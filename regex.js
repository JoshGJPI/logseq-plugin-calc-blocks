//finds form of ${sample text}
export const nameRegex = /\$\{(.*?)\}(?=\s|$)/g;
//finds form of [text](((block uuid)))
export const namedUUIDRegex = /\[([^\]]+)\]\(\(\(([^\)]+)\)\)\)/g;
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
export const trigRegex = /[a-zA-Z]{3}\(/;
//check for logarithmic functions looking for "log" followed by 0-2 digits then "("
export const logRegex = /log\d{0,2}\(/;
//find text surrounded by ${sample text}
export const nameVariableRegex = /\${.*?}/g;
//find numbers at the start of a string
export const startingNumberRegex = /^[\d\.]+/;
//include "_" to check for unit canceler
export const unitsRegex = /[a-zA-Z_%]+.*/;
//find all brackets [ ] in a string
export const bracketsRegex = /[\[\]]*/g;
//find all parenthesis ( ) in a string
export const parenthesisRegex = /[()]/g;
//check if a string starts and ends with ()
export const surroundingParenthesisRegex = /^\([^)]+\)$/;