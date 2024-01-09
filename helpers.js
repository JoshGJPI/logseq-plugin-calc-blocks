//search block text to see if a ${variable} or [variable](((uuid))) is identified
export function findVariables(text) {
	console.log('begin findVariables');
	//find named variables of form ${variable name}
	let nameRegex = /\$\{([^}]+)\}/g;
	let nameMatches = [...text.matchAll(nameRegex)];

	//find uuid variables of form [variable value](((block uuid)))
	let uuidRegex = /\[([^\]]+)\]\(\(\(([^\)]+)\)\)\)/g;
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
			value: match[1],
			type: 'raw',
		};
	});

	//parse and return array of found uuid variables
	let uuidVariables = uuidMatches.map((match) => {
		return {
			index: match.index,
			rawValue: match[0],
			value: match[1],
			type: 'calced',
		};
	});

	let compiledArray = [...namedVariables, ...uuidVariables];
	console.log(compiledArray);
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
	console.log(object);
	return object;
}

//take raw content of block and convert into info for calcs
export function parseBlockInfo(block) {
	console.log('begin parseBlockInfo');

	//if the block doesn't exist, stop
	if (block === undefined) return false;

	//get only first line to avoid block parameters
	let firstLine = block.content.split('\n')[0];
	let containsChildren = block.children.length > 0;
	let childrenArray = [];

	//check to see if a variable has been declared
	let namesVariable = firstLine.includes(':=');
	let variableName = '';
	let rawVariableName = '';
	let rawVariableValue = firstLine;
	let toBeCalced = false;

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
	let operatorRegex = /\s[+\-*/^()]\s/;
	let containsOperator = operatorRegex.test(rawVariableValue);

	//if it conains an operator or a variable name, add to calc tree
	if (containsOperator || namesVariable) toBeCalced = true;

	//check to see if other variables are included in expression
	let variables = findVariables(rawVariableValue);
	let containsVariables = variables.length !== 0;

	let parsedBlock = {
		uuid: block.uuid,
		rawContent: block.content.split('\n')[0],
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

	return parsedBlock;
}
