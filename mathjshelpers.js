import { exponentExpressionRegex, globalUnitsRegex, invalidMJSUnitRegex, startingNumberRegex, trimmedOperatorRegex } from "./regex.js";
import { BASE_UNIT_ARRAY, UNIT_PREFERENCES, UNIT_SYSTEMS } from "./constants.js";
import { calcBlockMJS } from "./blockhelpers.js";
import { childTreeObject } from "./index.js";
import { calcVariableBlockMJS } from "./uuidhelpers.js";
import { getExpressionUnit } from "./helpers.js";

//determine the type of unit from a MathJS result
export function getResultUnitType(dimensionArray) {
	let resultUnitArray = dimensionArray;
	//check if the input is an array of 10 numbers indicating valueless Unit
	//use .toString() to allow comparison
	if (resultUnitArray.length > 9 && !resultUnitArray.slice(8).reduce((total, current) => total && current === 0, true)) {
  		console.log("valueless Unit detected");
		return "VALUELESS";
	}
	//check if a valueless unit has been created, and trim normal arrays
	if (resultUnitArray.length > 9 && resultUnitArray.slice(8).reduce((total, current) => total && current === 0, true)) {
		resultUnitArray = resultUnitArray.slice(0, 9);
		console.log(dimensionArray, resultUnitArray);
		console.log("A valueless array has been created. This unit is not valueless and has been trimmed to 9 slots\n", resultUnitArray);
	}
    // Check if the input is a valid array of 9 numbers
    if (!Array.isArray(resultUnitArray) || resultUnitArray.length !== 9 || 
        !resultUnitArray.every(num => typeof num === 'number')) {
      throw new Error('Input must be an array of 9 numbers');
    }
  
    // Convert the input array to a string for easier comparison
    const dimensionString = JSON.stringify(resultUnitArray);
  
    // Find the matching unit in BASE_UNIT_ARRAY
    const matchingUnit = BASE_UNIT_ARRAY.find(unit => 
        //convert to string for easier comparison
        JSON.stringify(unit[1]) === dimensionString
    );
  
    // Return the name if found, otherwise return 'UNKNOWN'
    return matchingUnit ? matchingUnit[0] : 'UNKNOWN';
}

//determine if a Mathjs unit result needs to have an exponent added to it
//rawResult by default has unit.name = "in" and unit.power = 3 for in^3
export function getConfiguredUnit(rawResultUnit) {
	let unitName = rawResultUnit.unit.name;
	//check to see if unit is raised to a power
	let unitPower = rawResultUnit.power;
	//add unit exponent if necessary
	let unitExponent = unitPower > 1 ? `^${unitPower}` : "";
	let configuredUnit = `${unitName}${unitExponent}`;
	console.log(unitName, unitPower, configuredUnit);
	return configuredUnit;
}

//create a custom Mathjs unit and plural/singluar alias
export function createCustomUnit(text) {
	console.log("Begin createCustomUnit", text);
	//if text is undefined, return false
	if (!text) {
		console.log(`no Unit Text found: ${text}`);
		return false;
	}
	//check if it ends in an "s" - assume this is plural
	let isPlural = text.toLowerCase()[text.length-1] === "s";
	//determine if an "s" needs to be added to the alias
	let cleanedAlias = isPlural ? text.slice(0, -1) : `${text}s`;
	//define the new unit and alias
	let newUnit = math.createUnit(text, { 
		aliases: [cleanedAlias]
	});

	console.log(`Created new unit: ${text}\n`, newUnit);
}

// Get the preferred unit based on unit type and input units
export function getPreferredUnit(unitType, inputUnits) {
	const preferences = UNIT_PREFERENCES[unitType] || [];
	
	// Determine the unit system (US or METRIC) based on input units
	let unitSystem = 'US';
	for (const unit of inputUnits) {
	  if (UNIT_SYSTEMS.METRIC[unitType]?.includes(unit)) {
		unitSystem = 'METRIC';
		break;
	  }
	}
	console.log(unitSystem, unitType, UNIT_SYSTEMS[unitSystem][unitType]);
	// First, try to find a matching unit from the same system
	for (const unit of preferences) {
		console.log(unit, inputUnits, UNIT_SYSTEMS[unitSystem][unitType]?.includes(unit), inputUnits.includes(unit));
	  if (UNIT_SYSTEMS[unitSystem][unitType]?.includes(unit) && inputUnits.includes(unit)) {
		return unit;
	  }
	}
  
	// If no match found, return the first preference from the same system
	for (const unit of preferences) {
	  if (UNIT_SYSTEMS[unitSystem][unitType]?.includes(unit)) {
		return unit;
	  }
	}
  
	// If still no match, return the first preference overall
	return preferences[0] || '';
}

// Evaluate and return a formatted result using MathJS
export function formattedEvaluate(text, preferredUnit = '', preferredPrecision=4) {
	try {
		const evaluatePrecision = 12;

		// Remove dashes from units to ensure MathJS can parse them correctly
		let cleanedText = text.replaceAll(invalidMJSUnitRegex, "");
		let cleanedUnit = preferredUnit.replaceAll(invalidMJSUnitRegex, "");
		console.log(text, cleanedText, preferredUnit, cleanedUnit);
		console.log(math.Unit.isValuelessUnit(cleanedUnit));

		//check to see if it's a single expression defining the variable
		let singleExpression = cleanedText.split(" ").length === 1;
		//if it's a single expression, check to see if the unit needs to be defined
		if (cleanedUnit === "" && singleExpression) {
			let rawexpressionUnit = getExpressionUnit(text)
			let expressionUnit = rawexpressionUnit ? rawexpressionUnit.join("/") : "";
			console.log(cleanedUnit, expressionUnit);
			cleanedUnit = expressionUnit;
		}

		//get a list of all units defined in the string
		let allUnits = cleanedText.matchAll(globalUnitsRegex)
		let allUnitsArray = Array.from(allUnits, (unit => {
			let rawText = unit[0];
			let matchedText = unit[1]
			return {
				rawText: rawText,
				matchedText: matchedText
			}
		}));
		console.log(allUnitsArray)
		//check for custom units to define
		allUnitsArray.forEach(unit => {
			let unitText = unit.matchedText
			try {
				// This will throw an error if the unit doesn't exist
				math.unit(1, unitText);
			} catch (e) {
				console.log(e)
				// Handle compound units (like k/beam)
				const unitParts = unitText.split('/');
				console.log(unitParts);
				if (unitParts.length > 1) {
					// test and create each part separately if needed
					unitParts.forEach(part => {
					try {
						math.unit(1, part);
					} catch (e) {
						createCustomUnit(part);
					}
					});
				} else {
					// create a simple unit
					createCustomUnit(unitText);
				}
			}
		})

		//prepare exponents to distribute to magnitude, not just unit. ie. 12ft ^ 2 becomes (12ft) ^ 2
		let processedExponentText = cleanedText.replaceAll(exponentExpressionRegex, '($1$2) $3 $4');
		//replace π with "pi" for mathjs support
		let processedText = processedExponentText.replaceAll(/π/g, "pi");
		console.log(processedText, cleanedText);
		// Evaluate the expression using MathJS
		let rawResult = math.evaluate(processedText);
		console.log(rawResult);
		//format the result and remove all spaces
		let formattedResult = prepareResult(rawResult, evaluatePrecision).formattedResult.replaceAll(" ", "");
		console.log(formattedResult)
		//if the result is unitless, don't worry about unit conversions
		const isUnitless = typeof rawResult === "number";
		if (isUnitless) {
			console.log(`No units found in ${text} result`, formattedResult);
			formattedResult = parseFloat(formattedResult);			// Prepare the object to be returned
			let unitlessResultObject = prepareResult(formattedResult, preferredPrecision, "");
			
			console.log(unitlessResultObject);
			return unitlessResultObject;
		};
		// Determine the type of unit from the result's dimensions
		const unitType = getResultUnitType(rawResult.dimensions);
		console.log(unitType)
		//if the unit isn't supported, notify user and cancel calculation
		if (unitType === "UNKNOWN") {
			logseq.UI.showMsg(`${preferredUnit} is not a supported unit at\n ${text} ${preferredUnit}`, "error", {timeout: 15000});
			return false;
		}
		//if the unit is a user defined custom unit, don't worry about Unit conversions
		if (unitType === "VALUELESS") {
			// Prepare the object to be returned
			let formattedValuelessObject = prepareResult(formattedResult, preferredPrecision, "VALUELESS");
		
			console.log("Valueless Unit defined\n", formattedValuelessObject);
			return formattedValuelessObject;
		}
		// Extract the names of all units used in the input expression
		const inputUnits = cleanedText.split(" ").reduce((total, item) => {
			//if it's an operator, don't add it
			let isOperator = trimmedOperatorRegex.test(item) && item.length === 1;
			if (isOperator) return total;

			let unitArray = getExpressionUnit(item);
			console.log(unitArray);
			//if units are found, push them into running total
			if (unitArray) {
				unitArray.forEach(item => total.push(item))
			}
			return total;
		}, []);
		console.log(inputUnits);

		// Determine the most appropriate default unit based on the unit type and input units
		let defaultUnit = getPreferredUnit(unitType, inputUnits);
		if (!defaultUnit) defaultUnit = "";
		
		// Use the explicitly preferred unit if provided, otherwise use the determined default unit
		let targetUnit = cleanedUnit || defaultUnit;
		console.log("clean: ", cleanedUnit, "\ndefault: ", defaultUnit, "\ntarget:", targetUnit, "\nconfigured: ", getConfiguredUnit(rawResult.units[0]));
		console.log(rawResult, formattedResult);

		let initialResultUnit = getExpressionUnit(formattedResult);
		console.log(initialResultUnit);
		// If a target unit is specified and it's different from the current result unit,
		// convert the result to the target unit
		if (targetUnit && targetUnit !== initialResultUnit) {
			let evaluateString = `${formattedResult} to ${targetUnit}`;
			console.log(evaluateString);
			rawResult = math.evaluate(evaluateString);
			// reformat result after unit conversion
			formattedResult = prepareResult(rawResult, preferredPrecision)
		}

		// Prepare the object to be returned
		let formattedResultObject = prepareResult(rawResult, preferredPrecision);

		console.log(formattedResultObject);
		return formattedResultObject;
  
	} catch (error) {
		// If an error occurs during calculation, show an error message to the user
		// and log the error for debugging
		logseq.UI.showMsg(`Error calculating ${text}\n${error}`, "error", {timeout: 15000});
		console.error(error);
		throw error;
	}
}

//calculate tree of blocks for cTree
export async function calculateTreeMJS(object) {
	console.log('begin CalculateTree');
	console.log(object);
	let treeObject = object;
	for (let i = 0; i < treeObject.totalBlocks.length; i++) {
		//setup all block values without variables first
		let block = treeObject.totalBlocks[i];
		if (!block.containsVariables) {
			let calculatedBlock = await calcBlockMJS(block);

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
			let calculatedBlock = await calcVariableBlockMJS(blockUUID);

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

//prepare a result object for MJS
export function prepareResult(rawResult, precision=4, unitType) {
    let preparedResult = rawResult;
	console.log(rawResult, precision);
	
	if (typeof preparedResult === "string") {
		//find the numbers in the result
		let stringNumbers = preparedResult.match(startingNumberRegex);
		//convert them from a string to a number
		let parsedNumbers = parseFloat(stringNumbers);
		//round them to the desired precision
		let roundedNumbers = math.round(parsedNumbers, precision);
		console.log(preparedResult, stringNumbers, parsedNumbers, roundedNumbers)
		//update preparedResult
		preparedResult = preparedResult.replace(stringNumbers, `${roundedNumbers}`);
	} else {
		//prepare the result to match desired precision
		preparedResult = math.format(preparedResult, {
			notation: "fixed",
			precision: precision
		});
	}
	console.log(preparedResult);
	// Determine the final result unit type
	let resultDimensionArray = rawResult?.dimensions;
	let resultUnitType = resultDimensionArray ? getResultUnitType(resultDimensionArray) : "";
	if (unitType) resultUnitType = unitType;

	return {
		formattedResult: preparedResult,
		rawResult: rawResult,
		rawResultUnit: resultUnitType
	}
}
//establish custom Mathjs units
export function setupMathJSUnits() {
	console.log("Begin setupMathJSUnits");

	//length
	//rebar diameter
	math.createUnit('eighth', {
		definition: '0.125in',
		aliases: ['eighths']
	});
	//weld thickness
	math.createUnit('sixteenth', {
		definition: '0.0625in',
		aliases: ['sixteenths']
	});

	//Area
	math.createUnit('sf', {
		definition: '1ft^2',
	});

	//Volume
	math.createUnit('cf', {
		definition: '1ft^3',
	});

	//Density
	//US
	math.createUnit('pcf', {
		definition: '1lbf / ft^3'
	});
	math.createUnit('kcf', {
		definition: '1kip / ft^3'
	});
	math.createUnit('pci', {
		definition: '1lbf / in^3'
	});
	math.createUnit('kci', {
		definition: '1kip / in^3'
	});
	//metric
	math.createUnit('Nmm3', {
		definition: '1N / mm^3',
		aliases: ['N/mm3']
	});
	math.createUnit('kNm3', {
		definition: '1kN / m^3',
		aliases: ['kN/m3']
	});

	//Stiffness
	math.createUnit('in4', {
		definition: '1in^4',
		aliases: ['quin' ],
		baseName: "STIFFNESS"
	})

	//Inches to the sixth
	math.createUnit('in6', {
		definition: '1in^6',
		aliases: ['hexin' ],
		baseName: "HEXIC"
	})

	//force
	//override lb/lbs to be lbf instead of lbm
	math.createUnit('lbs','1lbf', {override: true});
	math.createUnit('lb','1lbf', {override: true});
	math.createUnit('k','1kip');

	//Pressure
	math.createUnit('psf', {
		definition: '1lbf / ft^2',
	});
	math.createUnit('ksf', {
		definition: '1kip / ft^2',
	});
	math.createUnit('ksi', {
		definition: '1kip / in^2',
	});

	//Distributed Loading
	//US units
	math.createUnit('plf', {
		definition: '1lbf / ft',
		baseName: "UNIFORM_LOAD",
		aliases: ['lbs/ft', 'lb/ft']
	});
	math.createUnit('klf', {
		definition: '1kip / ft',
		aliases: ['k/ft', 'kip/ft', 'kips/ft']
	});
	math.createUnit('pli', {
		definition: '1lbf / in',
		aliases: ['lbs/in', 'lb/in']
	});
	math.createUnit('kli', {
		definition: '1kip / in',
		aliases: ['k/in', 'kip/in', 'kips/in']
	});
	//metric units
	math.createUnit('Nlm', {
		definition: '1N / m',
		aliases: ['N/m']
	});
	math.createUnit('Nlmm', {
		definition: '1N / mm',
		aliases: ['N/mm']
	});
	math.createUnit('kNlm', {
		definition: '1kN / m',
		aliases: ['kN/m']
	});
	math.createUnit('kNlmm', {
		definition: '1kN / mm',
		aliases: ['kN/mm']
	});

	//Moment
	//US units
	math.createUnit('lbft', {
		definition: '1lbf * ft',
		aliases: ['ftlb', 'ftlbs'],
		baseName: "MOMENT"
	});
	math.createUnit('lbin', {
		definition: '1lbf * in',
		aliases: ['inlb', 'inlbs']
	});
	math.createUnit('kft', {
		definition: '1kip * ft',
		aliases: ['kipft', 'ftk', 'ftkip', 'ftkips']
	});
	math.createUnit('kin', {
		definition: '1kip * in',
		aliases: ['kipin', 'inkip', 'inkips']
	});
	//metric units
	math.createUnit('Nm', {
		definition: '1N * m',
	});
	math.createUnit('kNm', {
		definition: '1kN * m',
	});
	math.createUnit('Nmm', {
		definition: '1N * mm',
	});
	math.createUnit('kNmm', {
		definition: '1kN * mm',
	});

	console.log("custom mathJS Units setup");
	console.log(math);
}