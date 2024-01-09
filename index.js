import {
	calcBlock,
	createChildTreeObject,
	updateBlockDisplay,
} from './calcfunctions.js';

export let childTreeObject = {
	variables: {},
	calculatedBlocks: [],
	variableBlocks: [],
	totalBlocks: [],
};

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
	logseq.Editor.registerSlashCommand('cBlock', async () => {
		//pause before running to allow DB to update with current changes
		await new Promise((resolve) => setTimeout(resolve, 250));

		console.log('begin cBlock slash');

		//get the current block
		let currentBlock = await logseq.Editor.getCurrentBlock();
		console.log(currentBlock);
		//calculate block contents
		let calculatedBlock = await calcBlock(currentBlock.uuid);

		//update current block
		await updateBlockDisplay(calculatedBlock);
		console.log('calcBlock completed');
	});

	logseq.Editor.registerSlashCommand('cTree', async () => {
		//pause before running to allow DB to update with current changes
		await new Promise((resolve) => setTimeout(resolve, 250));

		console.log('begin cBlock slash');

		let currentBlock = await logseq.Editor.getCurrentBlock();
		console.log(currentBlock);

		resetChildTree();

		//cycle through all children and create the tree
		childTreeObject = await createChildTreeObject(currentBlock.uuid);
		console.log(childTreeObject);
	});
}

//wait until LogSeq is ready, then register the slash commands
logseq.ready(main).catch(console.error);
