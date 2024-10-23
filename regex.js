//finds form of ${sample text}
export const nameRegex = /\$\{(.*?)\}(?=\s|,|$)/g;
//finds form of [text](((block uuid)))
export const namedUUIDRegex = /\[([^\]\s]+)\]\(\(\(([^\)]+)\)\)\)/g;
//finds form of (((block uuid)))
export const UUIDRegex = /^\(\(([^\)]+)\)\)$/;
//finds a space separated operator within a whole string
export const operatorRegex = /\s[+\-*/^()<>?:]\s/;
//identifies if a single character is an operator
export const trimmedOperatorRegex = /[+\-*/^()<>?:]/;
//checks if a string begins with a letter character
export const wordRegex = /^[a-zA-Z]/;
//checks if a string is a block reference - starts and ends with [[ ]]
export const pageRefRegex = /\[\[(.*)\]\]/;
//check for trig functions looking for 3 characters followed by "("
export const trigRegex = /(cos)|(sin)|(tan)\(/i;
//check for max/min/average functions  followed by "("
export const mJSFunctionRegex = /[a-z]+\(\s/g;
//check for logarithmic functions looking for "log" followed by 0-2 digits then "("
export const logRegex = /log\d{0,2}\(/i;
//check for natural log ln(
export const naturalLogRegex = /ln\(/i;
//find text surrounded by ${sample text}
export const nameVariableRegex = /\${.*?}/g;
//find numbers at the start of a string
export const startingNumberRegex = /^[\d\.]+/;
//include "_" to check for unit canceler
export const unitsRegex = /[a-zA-Z_%]+.*/;
//globally extract units from a string
export const globalUnitsRegex = /\b\d*\.?\d*([a-zA-Z]{1}[a-zA-Z/^\-0-9]+)\b/g;
//check for conversion unit in ()
export const unitParenthesisRegex = /^\(([a-zA-Z/0-9\-\^:]+)\)$/;
//find all brackets [ ] in a string
export const bracketsRegex = /[\[\]]*/g;
//find all parenthesis ( ) in a string
export const parenthesisRegex = /[()]/g;
//check if a string starts and ends with ()
export const surroundingParenthesisRegex = /^\([^)]+\)$/;
//check if a string contains a non-numeric value
export const nonNumberRegex = /[a-zA-z/\^]/;
//check for invalid MathJS unit characters
export const invalidMJSUnitRegex = /(?<=\w)-(?=\w)/g;
//recognize expressions followed by ^ to wrap in parenthesis to avoid Mathjs exponent confusion
export const exponentExpressionRegex = /(\d+(?:\.\d+)?)([a-zA-Z0-9\-\^]+)\s(\^|\*\*)\s(\d+(?:\.\d+)?)/g;
//check if the expression contains : followed by a digit to see if a result is to be rounded
export const roundedRegex = /:\d+/;