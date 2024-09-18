import { calcBlock, revertBlock } from './blockhelpers.js';
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

	//register 'cBlock' to calculate a single block
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

	//register 'cTree' to calculate a block, all it's children, and any 'linked' blocks
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

	//register 'rBlock' to convert [value](((UUID))) back to ${variable name} in current block
	logseq.Editor.registerSlashCommand('rBlock', async () => {
		//pause before running to allow DB to update with current changes
		await new Promise((resolve) => setTimeout(resolve, 400));

		console.log('begin rBlock slash');

		let currentBlock = await logseq.Editor.getCurrentBlock();
		console.log(currentBlock);

		//reset childTree to avoid old values impacting calcs
		resetChildTree();

		//cycle through all children and create the tree
		childTreeObject = await createChildTreeObject(currentBlock.uuid);
		console.log(childTreeObject);
		//confirm there are no errors with ChildTreeObject
		if (childTreeObject === false) {
			console.log("Error with ChildTreeObject");
			return false;
		};

		//revert variable form
		let revertedBlock = await revertBlock(childTreeObject[currentBlock.uuid]);
		
		//if there's an error, don't update
		if (revertedBlock === false) return false;
		
		//update block display
		await updateBlockDisplay(revertedBlock);
		
	});

	//register 'rTree' to convert [value](((UUID))) back to ${variable name} in children of current block
	logseq.Editor.registerSlashCommand('rTree', async () => {
		//pause before running to allow DB to update with current changes
		await new Promise((resolve) => setTimeout(resolve, 400));

		console.log('begin rTree slash');

		let currentBlock = await logseq.Editor.getCurrentBlock();
		console.log(currentBlock);

		//reset childTree to avoid old values impacting calcs
		resetChildTree();

		//cycle through all children and create the tree
		childTreeObject = await createChildTreeObject(currentBlock.uuid);
		console.log(childTreeObject);
		//confirm there are no errors with ChildTreeObject
		if (childTreeObject === false) {
			console.log("Error with ChildTreeObject");
			return false;
		};

		//confirm there are no foreign blocks
		let containsForeign = childTreeObject.variableBlocks.reduce((total, item) => {
			console.log(item);
			//if there's already a foreign block, no need to check
			if (total === true) return total;

			//check if block is foreign
			let isForeign = item.isForeign;
			console.log(isForeign, total);

			//if it's foreign update total to true, so containsForeign becomes true
			if (isForeign) {
				logseq.UI.showMsg(`${item.variableName} is foreign, cancel revert`, "error", {timeout: 10000});
				console.log(item.variableName, " is foreign");
				total = true;
			}
			return total;
		}, false);

		//cancel revert if foreign block present
		if (containsForeign) {
			return false;
		}
		//revert variable form for all blocks in tree
		console.log(childTreeObject);
		for (let i = 0; i < childTreeObject.variableBlocks.length; i++) {
			let blockUUID = childTreeObject.variableBlocks[i].uuid;
			let revertedBlock = await revertBlock(childTreeObject[blockUUID]);
			
			//if there's an error, don't update
			if (revertedBlock === false) {
				console.log(`Revert Tree Error ==== `, revertBlock);	
				return false;
			}
			//update block display
			await updateBlockDisplay(revertedBlock);
		}
		console.log(childTreeObject);
		console.log("rTree complete");
	});

	console.log("======== CALC-BLOCK PLUGIN READY ========");
}

//wait until LogSeq is ready, then register the slash commands
logseq.ready(main).catch(console.error);
