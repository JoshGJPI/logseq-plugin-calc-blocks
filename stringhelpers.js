import { addToChildTreeObject } from './helpers.js';
import { childTreeObject } from './index.js';
import { parseBlockInfo } from './blockhelpers.js';
import { 
    nameRegex, 
    namedUUIDRegex, 
    startingNumberRegex, 
    unitsRegex, 
    trimmedOperatorRegex 
} from './regex.js';

//search block text to see if a ${variable} or [variable](((uuid))) is identified
export async function findVariables(text) {
	console.log('begin findVariables');
	//find named variables of form ${variable name}
	let nameMatches = [...text.matchAll(nameRegex)];
	console.log(nameMatches, text)

	//find uuid variables of form [variable value](((block uuid)))
	let uuidMatches = [...text.matchAll(namedUUIDRegex)];

	//return empty array if no variables
	if (nameMatches.length === 0 && uuidMatches.length === 0) {
		console.log('no variables');
		return [];
	}

	//parse and return array of found named variables
	let namedVariables = nameMatches.map((match) => {
		return {
			index: match.index,
			//trim to avoid errors from spaces at the end
			rawValue: match[0].trim(),
			name: match[1].trim(),
			type: 'raw',
		};
	});

	let undefinedVariable = false;
	//parse and return array of found uuid variables
	let uuidVariables = await Promise.all(uuidMatches.map(async (match) => {
		console.log("findVariables === Found a UUID variable!");
		//replace [value](((uuid))) format with variable's name from global object
		let uuid = match[2];

		//if the block isn't defined in the childTreeObject, get it and parse it
		if (!childTreeObject[uuid]?.variableName) {
			let foreignBlock = await logseq.Editor.get_block(uuid);
			let foreignParsedBlock = await parseBlockInfo(foreignBlock);
			let toBeCalced = foreignParsedBlock.toBeCalced;

			//if variable is supposed to be calced, add it to global object
			if (toBeCalced) {
				let addSuccessful = addToChildTreeObject(foreignParsedBlock);
				if (!addSuccessful) {
					console.log("findVariables === Error adding to ChildTreeObject");
					return false;
				}
			}

			if (!childTreeObject[uuid]?.variableName) {
				undefinedVariable = true;
				console.log("findVariables === variable name error");
				console.log(match);
				console.log(childTreeObject)
				return false;
			}
		}
		let variableName = childTreeObject[uuid].variableName;
		
		console.log(match, variableName);
		return {
			index: match.index,
			rawValue: match[0],
			name: variableName,
			type: 'calced',
		};
	}));

	//if a variable is undefined, return false
	if (undefinedVariable) return false;

	//if all variables are defined, compile and return results in an array
	let compiledArray = [...namedVariables, ...uuidVariables];
	return compiledArray;
}

//break expression string into a number and unit
export function parseExpressionValues(text) {
	console.log('begin parseExpressionValues');
	let expression = text;
	let numValue = 0;

	//check for "-" at the beginning of the expression to see if the number is negative
	const isNegative = text[0] === "-" ? true : false;
	let negativeFactor = isNegative ? -1 : 1;

	//remove "-", so num can be parsed
	if (isNegative) {
		expression = expression.slice(1);
	}

	//confirm input is a string to enable regex searches
	const num = parseFloat(expression.match(startingNumberRegex));
	//check to see if num isn't a number
	if (num === NaN) {
		console.log(`${expression} is NaN`);
	} else {
		//if num is a number, apply negative factor
		numValue = num * negativeFactor;
	}

	//check for units in the string
	const letters = expression.match(unitsRegex) ? expression.match(unitsRegex) : [''];

	let object = {
		rawText: text,
		value: numValue,
		unit: letters[0],
	};

	console.log(object);
	return object;
}

//takes a string of values, calculates result, and returns it as a number
export function calculateStringValue(text) {
	console.log("begin calculateStringValue");

	//remove training spaces, then split expressions by internal spaces " "
	let contentArray = text.trim().split(' ');
	
	//remove empty elements in array to avoid errors
	let spacelessContentArray = contentArray.filter(item => item !== "");
	let unitsArray = [];

	//remove units and convert into array of numbers for calculation
	let parsedArray = spacelessContentArray.map((item) => {
		//check to see if input is a number
		let isNumber = typeof item === "number";

		if (!isNumber) {
			//check if it's an operator
			let isOperator = (trimmedOperatorRegex.test(item) && item.length === 1);
	
			if (isOperator) {
				//convert to ^ to JS native power operator
				if (item === '^') item = '**';
				return item;
			}
		}

		//if item is a number, convert to string for parseExpressionValues()
		let stringItem = isNumber ? item.toString() : item;
		//break nonoperator 30psf into 30 & "psf"
		let {value, unit} = parseExpressionValues(stringItem);
		//add units to unit array
		if (unit) unitsArray.push(unit);

		//if the parsed expression isn't a number, return empty
		if (isNaN(value)) return;

		//if the number is negative, wrap in parenthesis to avoid issues with ** operator
		let isNegative = value < 0 ? true : false;
		let parsedValue = isNegative ? `(${value})` : value;

		return parsedValue;
	});

	//check for errors in parsedArray
	let parsedError = parsedArray.includes(NaN);
	if (parsedError) return false;

	//rejoin array with spaces
	let evalString = parsedArray.join(' ');
	console.log(evalString);
	//calculate block value and prepare text display value - round result to 3 decimal places
	const roundAmount = 1000;
	let resultNum;
	try {
		resultNum = Math.round(eval(evalString)*roundAmount)/roundAmount;
	} catch (error) {
		//if there's an error in the calc, return false to register an error message
		return false;
	}

	let calcStringObject = {
		resultNum: resultNum,
		unitsArray: unitsArray
	}
	
	return calcStringObject;
}
