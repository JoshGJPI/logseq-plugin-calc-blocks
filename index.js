import { calcBlock, updateBlockDisplay } from "./helpers.js";

//Tell LogSeq to register these slash commands for use
function main () {
    console.log("=== begin registering cBlock slash commands ===")
    logseq.Editor.registerSlashCommand("cBlock",
      async () => {
        //pause before running to allow DB to update with current changes
        await new Promise(resolve => setTimeout(resolve, 250));

        console.log("begin cBlock slash");

        //get the current block
        let currentBlock = await logseq.Editor.getCurrentBlock()
        console.log(currentBlock);
        //calculate block contents
        let calculatedBlock = await calcBlock(currentBlock.uuid);

        //update current block
        await updateBlockDisplay(calculatedBlock);
        console.log("calcBlock completed")
    })
}

//wait until LogSeq is ready, then register the slash commands
logseq.ready(main).catch(console.error)
