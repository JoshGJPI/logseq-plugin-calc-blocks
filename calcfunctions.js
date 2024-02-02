import { childTreeObject } from './index.js';
import {
	findVariables,
	getChildBlocks,
	parseExpressionValues,
	parseBlockInfo,
	operatorRegex,
	trimmedOperatorRegex
} from './helpers.js';

//get variable value from variable name
function getCalcedVariableValue(name) {
	let variableUUID = childTreeObject.variables[name].uuid;
	let variableInfo = childTreeObject[variableUUID];

	//if the variable hasn't been calced return
	if (!variableInfo.hasBeenCalced) return false;

	return variableInfo;
}

//takes a string of values, calculates result, and returns it as a number
export function calculateStringValue(text) {
	console.log("begin calculateStringValue");

	//remove training spaces, then split expressions by internal spaces " "
	let contentArray = text.trim().split(' ');
	let unitsArray = [];

	//remove units and convert into array of numbers for calculation
	let parsedArray = contentArray.map((item) => {
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
		let parsedItem = parseExpressionValues(stringItem);
		//add units to unit array
		if (parsedItem.unit) unitsArray.push(parsedItem.unit);

		return parsedItem.value;
	});

	//rejoin array with spaces
	let evalString = parsedArray.join(' ');
	console.log(evalString);
	//calculate block value and prepare text display value - round result to 3 decimal places
	const roundAmount = 1000;
	let resultNum = Math.round(eval(evalString)*roundAmount)/roundAmount;

	let calcStringObject = {
		resultNum: resultNum,
		unitsArray: unitsArray
	}
	
	return calcStringObject;
}

//calculate value of given block content and return updated block
export function calculateBlockValue(block) {
	console.log('begin calculateBlockValue');

	let calcBlock = block;

	//only get the content to be calculated (before the = sign)
	let content = calcBlock.rawCalcContent.split('=')[0].trim();
	//calculate the value of the block
	let {resultNum, unitsArray} = calculateStringValue(content);
	let resultStr = `${resultNum}`;

	//if the values had units, assume the last one is the resultant unit (for now)
	if (unitsArray.length > 0) {
		let resultUnit = unitsArray[unitsArray.length - 1];
		resultStr = `${resultStr}${resultUnit}`;
		calcBlock.unit = resultUnit;
	}

	//only add := if a variable name is defined
	let calcedVariableName = '';
	if (calcBlock.rawVariableName.length > 0)
		calcedVariableName = `${calcBlock.rawVariableName} := `;

	//if there's no operator, don't add = results to the end of calculatedContent
	let displayedResults = ` = ${resultStr}`;
	let containsOperator = operatorRegex.test(content);
	if (!containsOperator) displayedResults = "";

	//update block info after calculation
	calcBlock.hasBeenCalced = true;
	calcBlock.value = resultNum;
	calcBlock.valueStr = resultStr;
	calcBlock.calculatedContent = `${calcedVariableName}${content}${displayedResults}`;

	return calcBlock;
}

//calculate block without variables
export function calcBlock(rawBlock) {
	console.log('begin calcBlock');
	//get the current block
	let block = rawBlock;
	//parse it and prep info for calculation
	let parsedBlock = parseBlockInfo(block);

	//if the block doesn't contain calcable content or is undefined, return false
	let calculateBlock = parsedBlock?.toBeCalced;
	if (!parsedBlock || !calculateBlock) {
		console.log('no items to calculate');
		return false;
	}
	//calculate block expression results and prep text display
	let calculatedBlock = calculateBlockValue(parsedBlock);
	console.log(calculatedBlock);

	return calculatedBlock;
}

//calculate a block containing variable(s)
export function calcVariableBlock(uuid) {
	console.log("begin calcVariableBlock");
	let calcBlock = childTreeObject[uuid];
	let {rawCalcContent} = calcBlock;

	//find the variables in the block content
	let variables = findVariables(rawCalcContent);
	console.log(variables);

	//if there's an error with the variables, return false
	if (variables === false) return false;

	let allVariablesCalced = true;
	//see if all variables have been calced and parse them for block calculation
	let calculatedVariables = variables.map(item => {
		console.log(item);
		console.log(childTreeObject);
		//get variable info from childTreeObject
		let variableName = item.name;
		let variableObject = childTreeObject.variables[variableName];
		console.log(variableObject);
		let variableUUID = variableObject.uuid;
		let {hasBeenCalced, unit, value, valueStr} = childTreeObject[variableUUID];

		console.log(childTreeObject[variableUUID]);
		//check if the variable has been calculated
		if (!hasBeenCalced) {
			console.log(`${variableName} hasn't been calced`);
			allVariablesCalced = false;
			return;
		}

		//update variable with calced info
		let referenceText = `[${valueStr}](((${variableUUID})))`;
		let calcedObject = {
			...item,
			value: value,
			unit: unit, 
			valueStr: valueStr,
			uuid: variableUUID,
			referenceText: referenceText
		}

		return calcedObject;
	})

	//if one or more variables haven't been calculated, stop calc
	if (!allVariablesCalced) {
		console.log(calculatedVariables);
		console.log("not all variables calced");
		return false;
	}
	console.log(calculatedVariables);
	
	//remove any reexisting results in calc string
	let parsedCalcContent = rawCalcContent.split("=")[0].trim();
	//setup running eval string to have variables replaced
	let runningEvalString = parsedCalcContent;

	//replace variable info with number values for calculation
	for (let i = 0; i < calculatedVariables.length; i++) {
		//get rawtext and calculated value from item
		let {rawValue, valueStr} = calculatedVariables[i];
		
		//replace raw variable text with valculated value
		let modifiedString = runningEvalString.replace(rawValue, valueStr);
		//send updates to runningEvalString
		runningEvalString = modifiedString;

	}

	//use parsed string for eval calculation
	console.log(runningEvalString);
	let {resultNum, unitsArray} = calculateStringValue(runningEvalString);
	let resultStr = `${resultNum}`;
	
	console.log(parsedCalcContent)
	console.log(`${calcBlock.variableName} has been calculated`);

	//if the values had units, assume the last one is the resultant unit (for now)
	if (unitsArray.length > 0) {
		let resultUnit = unitsArray[unitsArray.length - 1];
		resultStr = `${resultStr}${resultUnit}`;
		calcBlock.unit = resultUnit;
	}

	//only add := if a variable name is defined
	let calcedVariableName = '';
	if (calcBlock.rawVariableName.length > 0)
		calcedVariableName = `${calcBlock.rawVariableName} := `;

	//replace variables with link content
	let linkContent = parsedCalcContent;
	calculatedVariables.forEach(item => {
		let {rawValue, referenceText} = item;
		linkContent = linkContent.replace(rawValue, referenceText);
		console.log(linkContent);
		console.log(`${rawValue} replaced with ${referenceText}`);
	})

	//if there's no operator, don't add = results to the end of calculatedContent
	let displayedResults = ` = ${resultStr}`;
	let containsOperator = operatorRegex.test(parsedCalcContent);
	if (!containsOperator) displayedResults = "";

	//update block info after calculation
	calcBlock.hasBeenCalced = true;
	calcBlock.value = resultNum;
	calcBlock.valueStr = resultStr;
	calcBlock.calculatedContent = `${calcedVariableName}${linkContent}${displayedResults}`;

	console.log(calcBlock);
	return calcBlock;
}

//update a block's display to display calculated value
export async function updateBlockDisplay(block) {
	console.log('begin updateBlockDisplay');
	let { rawContent, calculatedContent } = block;
	if (rawContent === calculatedContent) {
		console.log('no changes');
		return false;
	}

	let currentBlock = await logseq.Editor.get_block(block.uuid);
	//split to modify only first line
	let currentContentArray = currentBlock.content.split('\n');
	currentContentArray[0] = calculatedContent;
	//join the modified array back together
	let updatedContent = currentContentArray.join('\n');

	//update block display
	await logseq.Editor.updateBlock(block.uuid, updatedContent);
	console.log('block updated');
	return true;
}

//THESE ARE LEFTOVERS USED TO UPDATE GLOBAL CALC OBJECT
/*//show results at end of string if calculation is required
if (containsOperator) {
    let rawContent = treeObject.rawContent

    //display calculated result at the end of the string
    let newContent = `${rawContent} = ${result}`;
}

let treeObject = childTreeObject[uuid];
treeObject.value = result;
treeObject.unit = "";
treeObject.unit = resultUnit;
treeObject.resultText = result;
treeObject.newContent = newContent;
treeObject.needUpdateContent = true;
treeObject.inlineText = `[${result}](((${uuid})))`;

//declare block has been calced and push to calculated blocks array
treeObject.hasBeenCalced = true;
childTreeObject.calculatedBlocks.push(treeObject);
*/

//standardized way of adding blocks to child tree object
function addToChildTreeObject(block) {
	console.log(`add ${block.variableName} to childTreeObject`);

	let uuid = block.uuid;
	let variableName = block.variableName;
	let infoObject = {
		uuid: uuid,
		variableName: variableName,
	};

	//add block info to global object
	childTreeObject[uuid] = block;
	childTreeObject.totalBlocks.push(block);

	//if block defines a variable name, populate tree.variables
	if (variableName.length > 0) {
		childTreeObject.variables[variableName] = infoObject;
	}
	//if the block contains variables, populate them in the global object
	if (block.containsVariables) {
		childTreeObject.variableBlocks.push(block);
	}
}

//take UUID of a given block and return child/parent tree object
export async function createChildTreeObject(uuid) {
	console.log('begin CreateChildTreeObject');
	//get the block of the given uuid
	let currentBlock = await logseq.Editor.get_block(uuid);
	let children = await getChildBlocks(uuid);

	//return false if block contains no children
	if (!children) {
		console.log('No children');
		return false;
	}

	//parse through current block
	let currentParsedBlock = parseBlockInfo(currentBlock);

	//if current block has information, add it to global object
	if (currentParsedBlock.toBeCalced) addToChildTreeObject(currentParsedBlock);

	//use Do-while loop to dig through all child blocks and add to childTreeObject
	let runningArray = children;
	do {
		console.log('begin do-while Loop');
		//clone and reset runningArray for future pushes into it
		let parsingArray = JSON.parse(JSON.stringify(runningArray));
		runningArray = [];
		console.log(parsingArray);
		//loop through array and parse each item
		for (let i = 0; i < parsingArray.length; i++) {
			console.log('begin parsingArray loop');
			let parsedItem = parseBlockInfo(parsingArray[i]);
			// console.log(parsedItem);
			let { toBeCalced, children } = parsedItem;
			//if it's to be calced add it to the childTreeObject
			if (toBeCalced) addToChildTreeObject(parsedItem);

			//if it has children, push them to the runningArray for the next loop
			if (children?.length > 0) {
				for (let j = 0; j < children.length; j++) {
					// console.log(item);
					let childBlock = await logseq.Editor.get_block(children[j]);
					runningArray.push(childBlock);
				};
			}
		};
		console.log(runningArray);
	} while (runningArray.length > 0);

	console.log("end do-while Loop");
	return childTreeObject;
}

export async function calculateTree(object) {
	console.log('begin CalculateTree');
	console.log(object);
	let treeObject = object;
	for (let i = 0; i < treeObject.totalBlocks.length; i++) {
		//setup all block values without variables first
		let block = treeObject.totalBlocks[i];
		if (!block.containsVariables) {
			let calculatedBlock = calcBlock(block);

			//update tree object values
			treeObject[block.uuid] = calculatedBlock;
			treeObject.totalBlocks[i] = calculatedBlock;
			treeObject.calculatedBlocks.push(calculatedBlock);
		}
	}
	console.log("nonvariable blocks calculated")
	console.log(childTreeObject);
	//calculate blocks containing variables
	console.log("begin calcing variable blocks");
	do {
		for (let i = 0; i < treeObject.variableBlocks.length; i++) {
			console.log(treeObject.variableBlocks[i]);
			let variableBlock = treeObject.variableBlocks[i];
			let hasBeenCalced = variableBlock.hasBeenCalced;

			//if the block has been calced, continue on
			if (hasBeenCalced) continue;

			let blockUUID = variableBlock.uuid
			let calculatedBlock = calcVariableBlock(blockUUID);

			//if there's an error calculating the block, continue on
			if (!calculatedBlock) continue;

			//otherwise update tree object values
			treeObject[blockUUID] = calculatedBlock;
			//THIS MAY OVERRIDE OTHER BLOCKS IF i ISN'T COORDINATED
			treeObject.totalBlocks[i] = calculatedBlock;
			treeObject.calculatedBlocks.push(calculatedBlock);
		}
	} while (treeObject.totalBlocks.length > treeObject.calculatedBlocks.length)
	console.log(childTreeObject);
	
	return childTreeObject;
}
