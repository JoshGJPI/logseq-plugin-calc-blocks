import { invalidMJSUnitRegex } from "./regex.js";
import { BASE_UNIT_ARRAY, DEFAULT_UNITS } from "./constants.js";

//determine the type of unit from a MathJS result
export function getResultUnitType(dimensionArray) {
    // Check if the input is a valid array of 9 numbers
    if (!Array.isArray(dimensionArray) || dimensionArray.length !== 9 || 
        !dimensionArray.every(num => typeof num === 'number')) {
      throw new Error('Input must be an array of 9 numbers');
    }
  
    // Convert the input array to a string for easier comparison
    const dimensionString = JSON.stringify(dimensionArray);
  
    // Find the matching unit in BASE_UNIT_ARRAY
    const matchingUnit = BASE_UNIT_ARRAY.find(unit => 
        //convert to string for easier comparison
        JSON.stringify(unit[1]) === dimensionString
    );
  
    // Return the name if found, otherwise return 'UNKNOWN'
    return matchingUnit ? matchingUnit[0] : 'UNKNOWN';
  }

//evaluate and return a formatted result using MathJS
export function formattedEvaluate(text) {
	try {
		//remove dashes from units for MathJS to be able to parse
		let dashMatches = text.replaceAll(invalidMJSUnitRegex, "");
		console.log(text, dashMatches);
		let rawResult = math.evaluate(dashMatches);
		let formattedResult = math.format(rawResult, {
			notation: 'fixed',
			precision: 4
		});
		console.log(rawResult);

        //compile involved units into an array
		let unitArray = rawResult.units.map(item => {
			let unitName = item.unit.name;
			let unitBase = item.unit.base.key;
            return {
                unitName: unitName,
                unitBase: unitBase
            }
		});

        //determine resulting unit type
        let resultDimensionArray = rawResult.dimensions;
        let resultUnit = getResultUnitType(resultDimensionArray)
		//return formatted & raw results and unit information
		let formattedResultObject = {
			formattedResult: formattedResult,
			rawResult: rawResult,
			expressionUnits: unitArray,
            rawResultUnit: resultUnit
		}

        console.log(formattedResultObject);
        return formattedResultObject;

	} catch (error) {
		//notify user if there's an error
		logseq.UI.showMsg(`Error calculating ${text}\n${error}`, "error", {timeout: 15000});
		console.error(error);
		throw error;
	}
}

//establish custom Mathjs units
export function setupMathJSUnits() {
	console.log("Begin setupMathJSUnits");

	//Area
	math.createUnit('sf', {
		definition: 'ft^2',
	});
	math.createUnit('sin', {
		definition: 'in^2',
	});

	//Volume
	math.createUnit('cf', {
		definition: 'ft^3',
	});
	
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