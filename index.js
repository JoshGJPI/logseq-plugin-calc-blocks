import { calcBlock, updateBlockDisplay } from "./helpers.js";

//Tell LogSeq to register these slash commands for use
function main () {
    console.log("=== begin registering cBlock slash commands ===")
    logseq.Editor.registerSlashCommand("cBlock",
      async () => {
        //pause before running to allow DB to update with current changes
        await new Promise(resolve => setTimeout(resolve, 250));

        //get the current block
        const { uuid } = await logseq.Editor.getCurrentBlock()

        //calculate block contents
        let calculatedBlock = await calcBlock(uuid);

        //update current block
        await updateBlockDisplay(calculatedBlock);
        console.log("calcBlock completed")
    })
}

//wait until LogSeq is ready, then register the slash commands
logseq.ready(main).catch(console.error)
