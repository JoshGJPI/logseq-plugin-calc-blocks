import { childTreeObject } from './index.js';
import {
	findVariables,
	getChildBlocks,
	parseExpressionValues,
	parseBlockInfo,
} from './helpers.js';

//get variable value from variable name
function getCalcedVariableValue(name) {
	let variableUUID = childTreeObject.variables[name].uuid;
	let variableInfo = childTreeObject[variableUUID];

	//if the variable hasn't been calced return
	if (!variableInfo.hasBeenCalced) return false;

	return variableInfo;
}

//calculate value of given block content and return updated block
export function calculateValue(block) {
	console.log('begin calculateValue');

	let calcBlock = block;
	//only get the content to be calculated (before the = sign)
	let content = calcBlock.rawCalcContent.split('=')[0].trim();
	//split expressions by spaces " "
	let contentArray = content.split(' ');
	let unitsArray = [];
	let containsOperator = false;

	//remove units and convert into array of numbers for calculation
	let parsedArray = contentArray.map((item) => {
		//check if it's an operator
		let operatorRegex = /[+\-*/^()]/;
		let isOperator = ( operatorRegex.test(item) && item.length === 1 );

		if (isOperator) {
			//convert to ^ to JS native power operator
			if (item === '^') item = '**';
			containsOperator = true;
			return item;
		}
		//break 30psf into 30 & "psf"
		let parsedItem = parseExpressionValues(item);
		//add units to unit array
		if (parsedItem.unit) unitsArray.push(parsedItem.unit);

		return parsedItem.value;
	});

	//rejoin array with spaces
	let evalString = parsedArray.join(' ');

	//calculate block value and prepare text display value - round result to 3 decimal places
	let resultNum = Math.round(eval(evalString)*1000)/1000;
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

	calcBlock.value = resultNum;
	calcBlock.valueStr = resultStr;
	calcBlock.calculatedContent = `${calcedVariableName}${content} = ${resultStr}`;

	return calcBlock;
}

export async function calcBlock(uuid) {
	console.log('begin calcBlock');
	//get the current block
	let block = await logseq.Editor.get_block(uuid);
	//parse it and prep info for calculation
	let parsedBlock = parseBlockInfo(block);

	//if the block doesn't contain calcable content or is undefined, return false
	let calculateBlock = parsedBlock.toBeCalced;
	if (!parsedBlock || !calculateBlock) {
		console.log('no items to calculate');
		return false;
	}
	//calculate block expression results and prep text display
	let calculatedBlock = calculateValue(parsedBlock);
	console.log(calculatedBlock);

	return calculatedBlock;
}

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
	console.log('begin addToChildTreeObject');

	let uuid = block.uuid;
	let variableName = block.variableName;
	let infoObject = {
		uuid: uuid,
		variableName: variableName,
	};

	console.log(infoObject);
	console.log(childTreeObject);
	//add block info to global object
	childTreeObject[uuid] = block;
	childTreeObject.totalBlocks.push(block);
	//if the block contains variables, populate them in the global object
	if ( block.variableName !== "") {
		childTreeObject.variables[variableName] = infoObject;
		childTreeObject.variableBlocks.push(block);
	}
}

//take UUID of a given block and return child/parent tree object
export async function createChildTreeObject(uuid) {
	console.log('begin CreateChildTreeObject');
	//get the block of the given uuid
	let currentBlock = await logseq.Editor.get_block(uuid);
	let children = await getChildBlocks(uuid);
	console.log(children);

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
			console.log('parsingArray.forEach');
			let parsedItem = parseBlockInfo(parsingArray[i]);
			// console.log(parsedItem);
			let { toBeCalced, children } = parsedItem;
			//if it's to be calced add it to the childTreeObject
			if (toBeCalced) addToChildTreeObject(parsedItem);
			console.log(childTreeObject);
			//if it has children, push them to the runningArray for the next loop
			if (children.length > 0) {
				for (let j = 0; j < children.length; j++) {
					// console.log(item);
					let childBlock = await logseq.Editor.get_block(children[j]);
					runningArray.push(childBlock);
					console.log(runningArray);
				};
			}
		};
	} while (runningArray.length > 0);

	console.log("end do-while Loop");
	return childTreeObject;
}

function calculateTree(object) {
	console.log('begin CalculateTree');

	for (key in object) {
		if (key.length < 20) continue;

		//setup all block values without variables first
		let block = object[key];
		if (!block.containsVariables) {
			calculateValue(block.rawVariableValue, block.uuid);
		}
	}

	let i = 0;
	do {
		i++;
	} while (
		childTreeObject.totalBlocks.length >
			childTreeObject.calculatedBlocks.length ||
		i < 100
	);
}
