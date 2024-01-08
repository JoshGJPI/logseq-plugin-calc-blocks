import { childTreeObject } from "./index.js";

//search block text to see if a ${variable} or [variable](((uuid))) is identified
function findVariables(text) {
    console.log("begin findVariables")
    //find named variables of form ${variable name}
    let nameRegex = /\$\{([^}]+)\}/g;
    let nameMatches = [...text.matchAll(nameRegex)];

    //find uuid variables of form [variable value](((block uuid)))
    let uuidRegex = /\[([^\]]+)\]\(\(\(([^\)]+)\)\)\)/g;
    let uuidMatches = [...text.matchAll(uuidRegex)];

    //return empty array if no variables
    if (nameMatches.length === 0 && uuidMatches.length === 0) {
        console.log("no variables");
        return [];
    }

    //parse and return array of found named variables
    let namedVariables = nameMatches.map(match => {
        return {
        index: match.index,
        rawValue: match[0],
        value: match[1],
        type: "raw"
        };
    });

    //parse and return array of found uuid variables
    let uuidVariables = uuidMatches.map(match => {
        return {
        index: match.index,
        rawValue: match[0],
        value: match[1],
        type: "calced"
        };
    })

    let compiledArray = [...namedVariables, ...uuidVariables];
    console.log(compiledArray);
    return compiledArray;
}

//take the UUID of a given block and return an array of children blocks
export async function getChildBlocks(uuid) {
    console.log("begin getChildBlocks");
    //get the block of the given uuid
    let block = await logseq.Editor.get_block(uuid);
    console.log(block);
    //check to see if it has children
    let hasChildren = block.children.length > 0;
    //if no children, return false
    if (!hasChildren) {
        console.log("no child blocks for:", uuid);
        return false
    }
    //if it has children, put them into an array and return that array
    let childBlockArray = [];
    childBlockArray = await Promise.all(block.children.map(async item => {
        console.log(item);
        let childUUID = item[1];
        let childBlock = await logseq.Editor.get_block(childUUID);
        console.log(childBlock);
        return childBlock;
    }));
    return childBlockArray;
} 

//break expression string into a number and unit
function parseExpressionValues(text) {
    console.log("begin parseExpressionValues");

    //confirm input is a string to enable regex searches
    const num = parseFloat(text.match(/^[\d\.]+/));
    const letters = text.match(/[a-zA-Z]+.*/) ? text.match(/[a-zA-Z]+.*/) : [""];

    let object = {
        rawText: text,
        value: num,
        unit: letters[0]
    }

    return object;
}

//get variable value from variable name
function getCalcedVariableValue(name) {

    let variableUUID = childTreeObject.variables[name].uuid;
    let variableInfo = childTreeObject[variableUUID];

    //if the variable hasn't been calced return
    if (!variableInfo.hasBeenCalced) return false;

    return variableInfo;
}

//take raw content of block and convert into info for calcs
export function parseBlockInfo(block) {
console.log("begin parseBlockInfo");

    //if the block doesn't exist, stop
    if (block === undefined) return false;

    //get only first line to avoid block parameters
    let firstLine = block.content.split('\n')[0];
    let containsChildren = block.children.length > 0;
    let childrenArray = [];

    //check to see if a variable has been declared
    let namesVariable = firstLine.includes(":=");
    let variableName = "";
    let rawVariableName = ""
    let rawVariableValue = firstLine;
    let toBeCalced = false;

    //if it contains children, fill the array with their uuids
    if (containsChildren) {
        childrenArray = block.children.map(item => {
        return item[1];
        })
    }

    //if variable name has been declared, parse to determine name and value
    if (namesVariable) {
        let infoArray = firstLine.split(":=");
        //take the part of the string before the :=, and remove any [[]] from block references
        variableName = infoArray[0].replaceAll(/[\[\]]*/g, "");
        rawVariableName = infoArray[0];
        rawVariableValue = infoArray[1];
    }

    //check if it needs to be calced based on containing an operator with a space on either side
    let operatorRegex = /\s[+\-*/^()]\s/;
    let containsOperator = operatorRegex.test(rawVariableValue);
    if (containsOperator) toBeCalced = true;

    //check to see if other variables are included in expression
    let variables = findVariables(rawVariableValue)
    let containsVariables = variables.length !== 0;

    let parsedBlock = {
        uuid: block.uuid,
        rawContent: block.content.split("\n")[0],
        calculatedContent: "",
        value: false,
        valueStr: "",
        unit: "",
        containsChildren: containsChildren,
        children: childrenArray,
        rawVariableName: rawVariableName.trim(),
        variableName: variableName.trim(),
        rawCalcContent: rawVariableValue.trim(),
        toBeCalced: toBeCalced,
        hasBeenCalced: false,
        containsVariables: containsVariables,
        variables: variables
    }

    return parsedBlock;
}


//calculate value of given block content and return updated block
export function calculateValue(block) {
    console.log("begin calculateValue");

    let calcBlock = block
    //only get the content to be calculated (before the = sign)
    let content = calcBlock.rawCalcContent.split("=")[0].trim();
    //split expressions by spaces " "
    let contentArray = content.split(" ");
    let unitsArray = [];
    let containsOperator = false;

    //remove units and convert into array of numbers for calculation
    let parsedArray = contentArray.map( item => {
        //check if it's an operator
        let operatorRegex = /[+\-*/^()]/;
        let isOperator = operatorRegex.test(item);

        if (isOperator) {
        //convert to ^ to JS native power operator
        if (item === "^") item = "**";
        containsOperator = true;
        return item;
        }
        //break 30psf into 30 & "psf"
        let parsedItem = parseExpressionValues(item);
        //add units to unit array
        if (parsedItem.unit) unitsArray.push(parsedItem.unit);

        return parsedItem.value;
    })

    //rejoin array with spaces
    let evalString = parsedArray.join(" ")

    //calculate block value and prepare text display value
    let resultNum = eval(evalString);
    let resultStr = `${resultNum}`;

    //if the values had units, assume the last one is the resultant unit (for now)
    if (unitsArray.length > 0) {
        let resultUnit = unitsArray[unitsArray.length -1];
        resultStr = `${resultStr}${resultUnit}`;
        calcBlock.unit = resultUnit;
    }

    //only add := if a variable name is defined
    let calcedVariableName = "";
    if (calcBlock.rawVariableName.length > 0) calcedVariableName = `${calcBlock.rawVariableName} := `;

    calcBlock.value = resultNum;
    calcBlock.valueStr = resultStr;
    calcBlock.calculatedContent = `${calcedVariableName}${content} = ${resultStr}`

    return calcBlock;
}

export async function calcBlock(uuid) {
    console.log("begin calcBlock");
    //get the current block
    let block = await logseq.Editor.get_block(uuid);
    //parse it and prep info for calculation
    let parsedBlock = parseBlockInfo(block);

    //if the block doesn't contain calcable content or is undefined, return false
    let calculateBlock = parsedBlock.toBeCalced;
    if (!parsedBlock || !calculateBlock) {
        console.log("no items to calculate");
        return false;
    }
    //calculate block expression results and prep text display
    let calculatedBlock = calculateValue(parsedBlock);
    console.log(calculatedBlock);

    return calculatedBlock;
}

export async function updateBlockDisplay(block) {
    console.log("begin updateBlockDisplay");
    let {rawContent, calculatedContent} = block;
    if (rawContent === calculatedContent) {
        console.log("no changes");
        return false;
    }

    let currentBlock = await logseq.Editor.get_block(block.uuid);
    //split to modify only first line
    let currentContentArray = currentBlock.content.split("\n");
    currentContentArray[0] = calculatedContent;
    //join the modified array back together
    let updatedContent = currentContentArray.join("\n");

    //update block display
    await logseq.Editor.updateBlock(block.uuid, updatedContent);
    console.log("block updated");
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
    console.log("begin addToChildTreeObject");

    let uuid = block.uuid;
    let variableName = block.variableName;
    let infoObject = {
    uuid: uuid,
    variableName: variableName
    };

    console.log(infoObject);
    console.log(childTreeObject);
    //add block info to global object
    childTreeObject[uuid] = block;
    childTreeObject.totalBlocks.push(block);
    childTreeObject.variables[variableName] = infoObject;
}

//take UUID of a given block and return child/parent tree object
export async function createChildTreeObject(uuid) {
    console.log("begin CreateChildTreeObject");
    //get the block of the given uuid
    let currentBlock = await logseq.Editor.get_block(uuid);
    let children = await getChildBlocks(uuid);
    console.log(children);

    //return false if block contains no children
    if (!children) {
        console.log("No children");
        return false;
    }

    //parse through current block
    let currentParsedBlock = parseBlockInfo(currentBlock);

    //if current block has information, add it to global object
    if (currentParsedBlock.toBeCalced) addToChildTreeObject(currentParsedBlock);

    //use Do-while loop to dig through all child blocks and add to childTreeObject
    let runningArray = children;
    do {
        console.log("begin do-while Loop");
        //clone and reset runningArray for future pushes into it
        let parsingArray = JSON.parse(JSON.stringify(runningArray));
        runningArray = [];
        console.log(parsingArray);
        //loop through array and parse each item
        parsingArray.forEach(item => {
            let parsedItem = parseBlockInfo(item);
            console.log(parsedItem);
            let {toBeCalced, children} = parsedItem;
            //if it's to be calced add it to the childTreeObject
            if (toBeCalced) addToChildTreeObject(parsedItem);

            //if it has children, push them to the runningArray for the next loop
            if (children.length > 0) {
                children.forEach(async item => {
                    console.log(item);
                    let childBlock = await logseq.Editor.get_block(item);
                    runningArray.push(childBlock);
                });
            }
        })
    }
    while (runningArray.length > 0);

    return childTreeObject;
}

function calculateTree(object) {
    console.log("begin CalculateTree");
    for (key in object) {
        if (key.length < 20) continue;
        
        //setup all block values without variables first
        let block = object[key];
        if (!block.containsVariables) {
        calculateValue(block.rawVariableValue, block.uuid)
        }
    }

    let i = 0;
    do {
        

        i++;
    }
    while (childTreeObject.totalBlocks.length > childTreeObject.calculatedBlocks.length || i < 100)
}