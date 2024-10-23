import { addToChildTreeObject, getExpressionUnit } from './helpers.js';
import { formattedEvaluate } from './mathjshelpers.js';
import { childTreeObject } from './index.js';
import { parseBlockInfo } from './blockhelpers.js';
import { 
    nameRegex, 
    namedUUIDRegex, 
    startingNumberRegex, 
    unitsRegex, 
    trimmedOperatorRegex, 
	trigRegex,
	logRegex,
	naturalLogRegex,
	unitParenthesisRegex,
	wordRegex,
	roundedRegex,
} from './regex.js';

//search block text to see if a ${variable} or [variable](((uuid))) is identified
export async function findVariables(text) {
	console.log('begin findVariables');
	//find named variables of form ${variable name}
	let nameMatches = [...text.matchAll(nameRegex)];

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
			let foreignBlock = await logseq.Editor.getBlock(uuid);
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
	console.log(text);
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
		let parsedFloat = parseFloat(item);
		let isNumber = !isNaN(parsedFloat);
		let isTrig = trigRegex.test(item);
		let isLog = logRegex.test(item)
		let isNaturalLog = naturalLogRegex.test(item);
		console.log(item, isNumber, isTrig, isLog, isNaturalLog);

		if (!isNumber) {
			console.log(`${item} isn't a number`);

			//check if it's a natural Log
			if (isNaturalLog) {
				console.log(`${item} is a natural log Function`);
				let naturalLogItem = "Math.log(";
				console.log(item, naturalLogItem);
				return naturalLogItem;
			}

			//check if it's a numerical log
			if (isLog){
				console.log(`${item} is a log Function`);
				let logItem = item.toLowerCase() === "log(" ? "Math.log10(" : `Math.${item}`;
				console.log(item, logItem)
				return logItem;
			}

			//check if it's a trig function
			if (isTrig) {
				//convert it to JS for eval()
				let trigItem = `Math.${item}`;
				logseq.UI.showMsg(`${item} is a trig expression\nRemember to convert angle to Radians!`, "Warning", {timeout: 8000});
				console.log(item, trigItem);
				return trigItem;
			}

			//check if it's an operator
			let isOperator = (trimmedOperatorRegex.test(item) && item.length === 1);
			console.log(isOperator, item);
	
			if (isOperator) {
				//convert to ^ to JS native power operator
				if (item === '^') item = '**';
				return item;
			}

			//check if item is Pi
			let isPi = false
			if (item?.toLowerCase() === "pi" || item === "π") isPi = true;
			if (isPi) {
				console.log("found Pi(e)!!!");
				return Math.PI;
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
	if (parsedError) {
		console.log("calculateStringValue === parsedArray Error", parsedArray);
		return false;
	}

	//rejoin array with spaces
	let evalString = parsedArray.join(' ');
	console.log(evalString);
	//calculate block value and prepare text display value - round result to 4 decimal places
	const roundAmount = 10000;
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

// Calculate string value using MathJS
export function calculateStringValueMJS(text) {
	console.log("Begin calculateStringValueMJS", text);
	let textToCalc = text;
	let resultUnit = "";

	// Check for desired unit output
	let splitText = text.split(" ");
	let lastItem = splitText[splitText.length - 1];
	let resultModified = lastItem.match(unitParenthesisRegex);
	//setup rounded and converted variables for later reference
	let isRounded, isConverted;
	console.log(resultModified);
	//default rounded precision to 3 decimals
	let decimalPrecision = 3;
  
	// If a specific result unit is requested, extract it and remove from calculation text
	if (resultModified) {
		let modifierText = resultModified[1];
		//check if rounding is input
		isRounded = modifierText.match(roundedRegex);
		//if the result modifier starts with a letter, unit conversion is required
		isConverted = wordRegex.test(modifierText);
		console.log(resultModified, isRounded, modifierText, isConverted)
		if (isRounded) {
			//find the location of the :
			let roundIndex = isRounded.index;
			//convert items after to number
			decimalPrecision = parseInt(modifierText.slice(roundIndex+1));
			//if the user inputs unit conversion, establish it as the final unit
			if (isConverted) resultUnit = modifierText.split(":")[0];
			console.log(decimalPrecision, resultUnit)
		} else if (isConverted) {
			resultUnit = modifierText;
		}
		textToCalc = splitText.slice(0, -1).join(" ");
	}
	console.log(decimalPrecision)

	// Evaluate the expression using MathJS
	const { formattedResult, rawResult, rawResultUnit } = formattedEvaluate(textToCalc, resultUnit, decimalPrecision);
	
	// If evaluation failed, return false
	if (!formattedResult) return false;

	// Extract the numeric value from the formatted result
	// This regex matches the number at the start of the string
	const numericMatch = formattedResult.match(startingNumberRegex);
	console.log(numericMatch, formattedResult);
	const resultNum = numericMatch ? parseFloat(numericMatch[0]) : NaN;

	if (isNaN(resultNum)) {
		console.error("Failed to parse numeric value from", formattedResult);
		return false;
	}

	//if there's no conversion and there IS a rawResultUnit, update resultUnit to outputted result
	if (!isConverted && rawResultUnit !== "") {
		resultUnit = getExpressionUnit(formattedResult).join("/");
		console.log(resultUnit);
		//add "-" to MOMENT results
		if(rawResultUnit === "MOMENT") {
			resultUnit = resultUnit.replaceAll(" ", "-");
			console.log("Moment found!: ", resultUnit);
		}
	}
	console.log(formattedResult, rawResult, resultNum, rawResultUnit, resultUnit);

	// Parse the result and return
	return {
	  resultNum: resultNum,
	  unit: resultUnit,
	  unitType: rawResultUnit
	};
  }