import { childTreeObject } from './index.js';
import { findVariables, calculateStringValue } from './stringhelpers.js';
import { operatorRegex, parenthesisRegex, trigRegex } from './regex.js';
import { getChildBlocks, addToChildTreeObject } from './helpers.js';
import { parseBlockInfo } from './blockhelpers.js';
import { unitCancel } from './helpers.js';

//calculate a block containing variable(s)
export async function calcVariableBlock(uuid) {
	console.log("begin calcVariableBlock");
	let calcBlock = childTreeObject[uuid];
	let {rawCalcContent, rawContent} = calcBlock;

	//find the variables in the block content
	let variables = await findVariables(rawCalcContent);
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

		//give user warning if variable name doesn't exist
		if (variableObject === undefined) {
			logseq.UI.showMsg(`variable "${variableName}" hasn't been defined at: "${calcBlock.rawContent}"\nCheck variable definitions for spelling errors`, "error", {timeout: 20000});
		}
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
	let calcedString = calculateStringValue(runningEvalString);

	//check if there's an error in the string calculation
	if (calcedString === false) {
		logseq.UI.showMsg(`error at "${rawContent}"`, "error", {timeout: 20000});
		throw `error at ${rawContent}`;
	}

	//parse calc results
	let {resultNum, unitsArray} = calcedString
	let resultStr = `${resultNum}`;
	
	console.log(parsedCalcContent)
	console.log(`${calcBlock.variableName} has been calculated`);

	//if the values had units, assume the last one is the resultant unit (for now)
	if (unitsArray.length > 0) {
		//if unit canceler is included, don't include unit in result
		let includesCanceler = unitsArray.includes(unitCancel);
		//remove parenthesis from units
		let resultUnit = includesCanceler ? "" : unitsArray[unitsArray.length - 1].replace(parenthesisRegex,"");
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
	let calcedResults = false;

	//if there's an operator or a trig function, add the calculated results to the end
	if (operatorRegex.test(parsedCalcContent)) calcedResults = true;
	if (trigRegex.test(parsedCalcContent)) calcedResults = true;

	//if there's no operator or trig function, don't display calculated result
	if (!calcedResults) displayedResults = "";

	//update block info after calculation
	calcBlock.hasBeenCalced = true;
	calcBlock.value = resultNum;
	calcBlock.valueStr = resultStr;
	calcBlock.calculatedContent = `${calcedVariableName}${linkContent}${displayedResults}`;

	console.log(calcBlock);
	return calcBlock;
}

//take UUID of a given block and return child/parent tree object
export async function createChildTreeObject(uuid) {
	console.log('begin CreateChildTreeObject');
	//get the block of the given uuid
	let currentBlock = await logseq.Editor.get_block(uuid);
	let children = await getChildBlocks(uuid);

	//error boolean used to stop the calc;
	let continueCalc = true;
	//return false if block contains no children
	if (!children) {
		console.log('No children');
		// return false;
	}

	//parse through current block
	let currentParsedBlock = await parseBlockInfo(currentBlock);

	//if current block has information, add it to global object
	if (currentParsedBlock.toBeCalced) {
		let addSuccessful = addToChildTreeObject(currentParsedBlock);
		//if the block can't be added, stop calc
		if (!addSuccessful) {
			console.log("createChildTreeObject === couldn't addToChildTreeObject\n", currentParsedBlock);
			continueCalc = false;
			return false;
		};
	}

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
			let parsedItem = await parseBlockInfo(parsingArray[i]);

			let { toBeCalced, children } = parsedItem;
			//if it's to be calced add it to the childTreeObject
			if (toBeCalced) {
				let addSuccessful = addToChildTreeObject(parsedItem);
				//if the block can't be added, stop calc
				if (!addSuccessful) {
					console.log("createChildTreeObject === couldn't addToChildTreeObject\n", parsedItem);
					continueCalc = false;
					return false;
				}
			}	

			//if it has children, push them to the runningArray for the next loop
			if (children?.length > 0) {
				for (let j = 0; j < children.length; j++) {
					let childBlock = await logseq.Editor.get_block(children[j]);
					runningArray.push(childBlock);
				};
			}
		};
		console.log(runningArray);
	} while (runningArray.length > 0 && continueCalc);

	//if error, return empty object
	if (!continueCalc) {
		console.log("error in calcs - empty childTreeObject");
		childTreeObject = {};
	}
	console.log("end do-while Loop");
	return childTreeObject;
}