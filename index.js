import { calcBlock } from './blockhelpers.js';
import { calculateTree, updateBlockDisplay } from './helpers.js';
import { createChildTreeObject } from './uuidhelpers.js';

//initialize default childTreeObject to store global calc information
export let childTreeObject = {
	variables: {},
	calculatedBlocks: [],
	variableBlocks: [],
	totalBlocks: [],
};

//resets child tree to default values
function resetChildTree() {
	const defaultTree = {
		variables: {},
		calculatedBlocks: [],
		variableBlocks: [],
		totalBlocks: [],
	};

	childTreeObject = {};
	childTreeObject = defaultTree;
	console.log('childTreeObject reset');
}

//Tell LogSeq to register these slash commands for use
function main() {
	console.log('=== begin registering slash commands ===');

	//register 'cBlock'
	logseq.Editor.registerSlashCommand('cBlock', async () => {
		//pause before running to allow DB to update with current changes
		await new Promise((resolve) => setTimeout(resolve, 400));

		console.log('begin cBlock slash');

		//get the current block
		let currentBlock = await logseq.Editor.getCurrentBlock();
		console.log(currentBlock);
		//calculate block contents
		let calculatedBlock = await calcBlock(currentBlock);

		//update current block
		await updateBlockDisplay(calculatedBlock);
		console.log('calcBlock completed');
	});

	//register 'cTree'
	logseq.Editor.registerSlashCommand('cTree', async () => {
		//pause before running to allow DB to update with current changes
		await new Promise((resolve) => setTimeout(resolve, 400));

		console.log('begin cTree slash');

		let currentBlock = await logseq.Editor.getCurrentBlock();
		console.log(currentBlock);

		//reset childTree to avoid old values impacting calcs
		resetChildTree();

		//cycle through all children and create the tree
		childTreeObject = await createChildTreeObject(currentBlock.uuid);
		console.log(childTreeObject);
		//calculate all items of the tree
		if (childTreeObject === false) {
			console.log("Error with ChildTreeObject");
			return false;
		};
		let calcedTree = await calculateTree(childTreeObject);
		console.log(calcedTree);
		//update display of all blocks
		for (let i = 0; i < calcedTree.calculatedBlocks.length; i++) {
			let block2Update = calcedTree.calculatedBlocks[i];
			console.log(block2Update);
			await updateBlockDisplay(block2Update);
			console.log(block2Update);
		}
		console.log(calcedTree)
		console.log("calculate block tree complete!");
	});

	console.log("======== CALC-BLOCK PLUGIN READY ========");
}

//wait until LogSeq is ready, then register the slash commands
logseq.ready(main).catch(console.error);
