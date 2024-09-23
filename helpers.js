import { childTreeObject } from './index.js';
import { calcBlock } from './blockhelpers.js';
import { calcVariableBlock } from './uuidhelpers.js';
import { logRegex, naturalLogRegex, operatorRegex, trigRegex } from './regex.js';

export const unitCancel = "_";

//take the UUID of a given block and return an array of children blocks
export async function getChildBlocks(uuid) {
	console.log('begin getChildBlocks');
	//get the block of the given uuid
	let block = await logseq.Editor.get_block(uuid);

	//check to see if it has children
	let hasChildren = block.children.length > 0;
	//if no children, return false
	if (!hasChildren) {
		console.log('no child blocks for:', uuid);
		return false;
	}
	//if it has children, put them into an array and return that array
	let childBlockArray = [];
	childBlockArray = await Promise.all(
		block.children.map(async (item) => {
			let childUUID = item[1];
			let childBlock = await logseq.Editor.get_block(childUUID);

			return childBlock;
		})
	);
	return childBlockArray;
}
let childRunNumber = 0;
//standardized way of adding blocks to child tree object
export function addToChildTreeObject(block) {
	console.log(`add ${block.variableName} to childTreeObject`);

	let uuid = block.uuid;
	let variableName = block?.variableName;
	let infoObject = {
		uuid: uuid,
		variableName: variableName,
	};

	//check if variable name is already defined
	let variableAlreadyDefined = Object.hasOwn(childTreeObject.variables, variableName);
	if (variableAlreadyDefined) {
		console.log(`${variableName} has already been defined`);
		//check if blocks have different UUIDs
		let differingUUID = childTreeObject.variables[variableName].uuid !== block.uuid;
		//if different UUIDs, give error and warning
		if (differingUUID) {
			//get existing block info for user to compare against new block info
			let existingUUID = childTreeObject.variables[variableName].uuid;
			let existingBlock = childTreeObject[existingUUID];
			let existingContent = existingBlock.rawContent;
			console.log(`ChildRun: ${childRunNumber}`);
			logseq.UI.showMsg(`${variableName} already exists! ${childRunNumber} Compare:\n${existingContent}\n${block.rawContent}`, "error", {timeout: 20000});
			childRunNumber = childRunNumber + 1;
			console.log(`ChildRun: ${childRunNumber}`);
			console.log("========================================\n========== Duplicate Variable Names ==========\n========================================");
			console.log("existing Block:", childTreeObject[existingUUID]);
			console.log("new Block:", block);
			return false;
		}
	}

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

	// childRunNumber = childRunNumber+1;
	return true;
}

//calculate tree of blocks for cTree
export async function calculateTree(object) {
	console.log('begin CalculateTree');
	console.log(object);
	let treeObject = object;
	for (let i = 0; i < treeObject.totalBlocks.length; i++) {
		//setup all block values without variables first
		let block = treeObject.totalBlocks[i];
		if (!block.containsVariables) {
			let calculatedBlock = await calcBlock(block);

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
	let variableCycle = 0;
	do {
		for (let i = 0; i < treeObject.variableBlocks.length; i++) {
			console.log(treeObject.variableBlocks[i]);
			let variableBlock = treeObject.variableBlocks[i];
			let hasBeenCalced = variableBlock.hasBeenCalced;

			//if the block has been calced, continue on
			if (hasBeenCalced) continue;

			let blockUUID = variableBlock.uuid
			let calculatedBlock = await calcVariableBlock(blockUUID);

			//if there's an error calculating the block, continue on
			if (!calculatedBlock) continue;

			//otherwise update tree object values
			treeObject[blockUUID] = calculatedBlock;
			//THIS MAY OVERRIDE OTHER BLOCKS IF i ISN'T COORDINATED
			treeObject.totalBlocks[i] = calculatedBlock;
			treeObject.calculatedBlocks.push(calculatedBlock);
		}
		variableCycle = variableCycle + 1;

		//stop after 10 rounds to prevent infinite cycles
	} while (treeObject.totalBlocks.length > treeObject.calculatedBlocks.length && variableCycle < 10)
	console.log(childTreeObject);
	console.log(`========================================\n======= VARIABLE CYCLE COUNT: ${variableCycle} =======\n========================================`);
	return childTreeObject;
}

//update a block's display to display calculated value
export async function updateBlockDisplay(block) {
	console.log('begin updateBlockDisplay');
	let { rawContent, calculatedContent } = block;
	//if there are no changes, don't update block
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

//determine if a block's calculated value should be added after "=" in the string
export function determineDisplayResults(resultString) {
	console.log("begin determineDisplayResults");
	let displayResults = false;
	//if there's an operator, display results
	if (operatorRegex.test(resultString)) displayResults = true;
	//if there's a trig function, display results
	if (trigRegex.test(resultString)) displayResults = true;
	//if there's a log or ln function, display results
	if (logRegex.test(resultString) || naturalLogRegex.test(resultString)) displayResults = true;

	return displayResults;
}