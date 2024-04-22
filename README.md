# Calc Notes Plugin
- This will calculate a single block's contents ('cblock') or a block and all of its children's contents ('cTree') and add the result to the end of each calculated block
## Commands
- **cBlock** - Calculates the value of the current block and updates the block's content to display the result at the end
- **cTree** - Searches the current block and all children, grandchildren, etc..., calculates their values, and updates displayed content with results. This command supports establishing block variable names to be referenced and used by other blocks
## Syntax
- All mathematical operators and expressions must be separated by spaces. There cannot be a space between units and the corresponding number
  - *correct:* ( 30sf + 10sf ) / 2 + 12ft ^ 2
  - *incorrect:* (30sf + 10 sf )/ 2 + 12ft^2
  - *output:* ( 30sf + 10sf ) / 2 + 12ft ^ 2 = 159sf
- Variable names are defined by including separating the variable name from the value or equation with a ":="
  - *example:* sample name := ( 25psf + 15psf ) / 2
    - This defines the variable "sample name" with a calculated value of 20psf within the 'ctree' command
    - 'cBlock' allows the presence of variable names in a single block's text but ignores them
- Variable names may be referenced again by surrounding them with ${variable name}
  - *before cTree command:*
    - length := 5ft
    - width := 10ft
    - area := ${length} * ${width} + 0sf
  - *after cTree command:*
    - length := 5ft
    - width := 10ft
    - area := <ins>5ft</ins> * <ins>10ft</ins> + 0sf = 50sf
- Variables will then be *linked* to the block the referenced block. Values will be updated each time the 'cTree' command is called
  - *before cTree command:*
    - length := 8ft
    - width := 10ft
    - area := <ins>5ft</ins> * <ins>10ft</ins> + 0sf = 50sf
  - *after cTree command:*
    - length := 8ft
    - width := 10ft
    - area := <ins>8ft</ins> * <ins>10ft</ins> + 0sf = 80sf
## Current Limitations
- Units are currently ignored. The last unit displayed in the equation will be copied onto the result. Units may be placed at the end of a string in parenthesis "()" to define the desired output units
  - *example:* sample := 20psf * 10ft = 200ft
  - *example defined units:* sample := 20psf \* 10ft (plf) = 200plf
  - **Adding an underscore '_' to a unit will make the result *unitless***
    - *example:* sample := 500lbs * 10 / 100_ = 50
- Variable names must be defined as a child, grandchild, etc. of the 'current block' used to initiate the **CTree** command. After a variable has been converted into the `[display value](((uuid)))` form, they can look for variable names outside the current block's children/grandchildren
  - *correct:*
    - Parent block
      - Total Load := ${Dead Load} + ${Live Load} *(references variables of child blocks)*
        - Dead Load := 15psf
        - Live Load := 20psf
      - Total Line Load := ${Total Load} * ${Tributary Area} + 0plf *(references variable in later sibling block)
      - Tributary Area := 10ft
  - *incorrect:*
    - Parent block
      - Total Load := ${Dead Load} + ${Live Load} *(references variables of child blocks)*
        - Dead Load := 15psf
        - Live Load := 20psf
      - Total Line Load := ${Total Load} * ${Tributary Area} + 0plf *(references variable in later sibling block)
    - Tributary Area := 10ft
## Updates from Previous Version
- Added support for named variable parenthesis syntax - sample := 20psf * 10ft (plf) = 200plf

### API

[![npm version](https://badge.fury.io/js/%40logseq%2Flibs.svg)](https://badge.fury.io/js/%40logseq%2Flibs)

##### Logseq.Editor

- `registerSlashCommand: (this: LSPluginUser, tag: string, actions: Array<SlashCommandAction>) => boolean`
- `showMsg: (content: string, status?: 'success' | 'warning' | string) => void`
    - content support  [hiccups](https://github.com/weavejester/hiccup) string

### Running the Sample

- `Load unpacked plugin` in Logseq Desktop client.
