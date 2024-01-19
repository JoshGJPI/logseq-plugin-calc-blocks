import { childTreeObject } from './index.js';

export const nameRegex = /\$\{([^}]+)\}/g;
export const uuidRegex = /\[([^\]]+)\]\(\(\(([^\)]+)\)\)\)/g;
export const operatorRegex = /\s[+\-*/^()<>?:]\s/;
export const trimmedOperatorRegex = /[+\-*/^()<>?:]/;
export const wordRegex = /^[a-zA-Z]/;
export const nameVariableRegex = /\${.*?}/g;

//search block text to see if a ${variable} or [variable](((uuid))) is identified
export function findVariables(text) {
	console.log('begin findVariables');
	//find named variables of form ${variable name}
	let nameMatches = [...text.matchAll(nameRegex)];

	//find uuid variables of form [variable value](((block uuid)))
	let uuidMatches = [...text.matchAll(uuidRegex)];

	//return empty array if no variables
	if (nameMatches.length === 0 && uuidMatches.length === 0) {
		console.log('no variables');
		return [];
	}

	//parse and return array of found named variables
	let namedVariables = nameMatches.map((match) => {
		return {
			index: match.index,
			rawValue: match[0],
			name: match[1],
			type: 'raw',
		};
	});

	//parse and return array of found uuid variables
	let uuidVariables = uuidMatches.map((match) => {
		console.log("Found a UUID variable!");
		//replace [value](((uuid))) format with variable's name from global object
		let uuid = match[2];

		//give context if error
		if (!childTreeObject[uuid]?.variableName) {
			console.log("variable name error");
			console.log(match);
			console.log(childTreeObject)
		}
		let variableName = childTreeObject[uuid].variableName;
		
		console.log(match, variableName);
		return {
			index: match.index,
			rawValue: match[0],
			name: variableName,
			type: 'calced',
		};
	});

	//compile and return results in an array
	let compiledArray = [...namedVariables, ...uuidVariables];
	return compiledArray;
}

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

//break expression string into a number and unit
export function parseExpressionValues(text) {
	console.log('begin parseExpressionValues');

	//confirm input is a string to enable regex searches
	const num = parseFloat(text.match(/^[\d\.]+/));
	const letters = text.match(/[a-zA-Z]+.*/) ? text.match(/[a-zA-Z]+.*/) : [''];

	let object = {
		rawText: text,
		value: num,
		unit: letters[0],
	};

	return object;
}

//take raw content of block and convert into info for calcs
export function parseBlockInfo(block) {
	console.log('begin parseBlockInfo');
	console.log(block);
	//if the block doesn't exist, stop
	if (block === undefined) return false;

	let rawContent = block.content ? block.content : block.rawContent
	//get only first line to avoid block parameters
	let firstLine = rawContent.split('\n')[0];
	let containsChildren = block.children.length > 0;
	let childrenArray = [];

	//check to see if a variable has been declared
	let namesVariable = firstLine.includes(':=');
	let variableName = '';
	let rawVariableName = '';
	let rawVariableValue = firstLine;
	let toBeCalced = false;
	let variables = [];
	let containsVariables = false;

	//if it contains children, fill the array with their uuids
	if (containsChildren) {
		childrenArray = block.children.map((item) => {
			return item[1];
		});
	}

	//if variable name has been declared, parse to determine name and value
	if (namesVariable) {
		let infoArray = firstLine.split(':=');
		//take the part of the string before the :=, and remove any [[]] from block references
		variableName = infoArray[0].replaceAll(/[\[\]]*/g, '');
		rawVariableName = infoArray[0];
		rawVariableValue = infoArray[1];
	}

	//check if it needs to be calced based on containing an operator with a space on either side
	let containsOperator = operatorRegex.test(rawVariableValue);

	//remove named variables from the string before checking for words
	let namelessArray = rawVariableValue.replaceAll(nameVariableRegex, "")
	//split the string by spaces and see if any items start with a letter as a test for containing a word
	let wordArray = namelessArray.split(" ");
	let containsWord = false;

	//check each item to see if it starts with a letter
	wordArray.every(item => {
		let isWord = wordRegex.test(item);
		if (isWord) {
			console.log(`${item} is a word!`);
			containsWord = true;
			return false
		}
		return true
	});

	//If it doesn't contain a word or it does contain ":=", check for variables
	if (!containsWord && namesVariable) {
		//check to see if other variables are included in expression
		variables = findVariables(rawVariableValue);
		containsVariables = variables.length !== 0;

		//if it contains variables OR it contains an operator, calculate variable
		if (containsVariables || containsOperator) {
			//if it contains an operator or variable name, add to calc tree
			console.log("Shalt be calced");
			toBeCalced = true;
		}
	}
	//if it doesn't contain a word and does contain an operator, calculate it
	if (!containsWord, containsOperator) toBeCalced = true;
	
	//always calculate blocks with a ":="
	if (namesVariable) toBeCalced = true;

	let parsedBlock = {
		uuid: block.uuid,
		rawContent: rawContent.split('\n')[0],
		calculatedContent: '',
		value: false,
		valueStr: '',
		unit: '',
		containsChildren: containsChildren,
		children: childrenArray,
		rawVariableName: rawVariableName.trim(),
		variableName: variableName.trim(),
		rawCalcContent: rawVariableValue.trim(),
		toBeCalced: toBeCalced,
		hasBeenCalced: false,
		containsVariables: containsVariables,
		variables: variables,
	};

	console.log(parsedBlock);
	return parsedBlock;
}

//returns an object with the value of a calculated block
export function getValue(text) {
	let resultArray = text.split(":=");

	let result = resultArray[1].trim();
	if (resultArray.length > 2) {
		result = resultArray.split("=")[1].trim();
	}
	
}