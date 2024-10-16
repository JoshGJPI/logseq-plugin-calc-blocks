- # Calc Notes [[LogSeq]] [[Plugin]] V3.0
  id:: 66229298-acd5-4a8a-bffa-70e4e985bba9
	- This plugin enables dynamic, calculations within your notes, allowing you to define variables, perform complex mathematical operations, and includes support to handle unit conversions. It can be utilized to seamlessly integrate calculations into your notes, supporting both single-block computations and tree-based calculations supporting blocks referencing the values in other blocks
- ## Commands
	- **Block Calculations** - Calculates the value of the current block and updates the block's content to display the result at the end
		- `cBlock` - will calculate the current block without unit consideration
		- `cUBlock` - will calculate the current block with unit consideration
	- **Tree Calculations** - Searches the current block and all children, grandchildren, etc..., calculates their values, and updates displayed content with results. This command supports establishing block variable names to be referenced and used by other blocks
		- `cTree` - will calculate the current block's child tree without unit consideration
		- `cUTree` - will calculate the current block's child tree with unit consideration
	- **Design Notes Calculations** - searches the current block's parents until it finds one containing a [[Design Notes]] page reference, then performs a **Tree Calculation** of that parent block. This allows ease of global re-calculating design notes calcs
		- `CDNotes` - will calculate the found parent block's child tree without unit consideration
		- `CUDNotes` - will calculate the found parent block's child tree with unit consideration
- ## Syntax
	- All mathematical operators and expressions must be separated by spaces. There cannot be a space between units and the corresponding number
		- *correct:* ( 30sf + 10sf ) / 2 + 12ft ^ 2
		- *incorrect:* (30sf + 10 sf )/ 2 + 12ft^2
		- *output:* ( 30sf + 10sf ) / 2 + 12ft ^ 2 = 159sf
	- Variable names are defined by separating the variable name from the value or equation with ":="
		- *example:* sample name := ( 25psf + 15psf ) / 2
			- This defines the variable "sample name" with a calculated value of 20psf within a **Tree Calculation**
			- **Block Calculations** allows the presence of variable names in a single block's text but ignores them
	- Variable names may be referenced again by surrounding them within ${variable name}
		- before **Tree Calculation**:
			- length := 5ft
			- width := 10ft
			- perimeter := 2 * ( ${length} * ${width} )
		- after **Tree Calculation**:
			- length := 5ft
			- width := 10ft
			- perimeter := 2 * ( <ins>5ft</ins> * <ins>10ft</ins> ) = 30ft
	- Variables will then be *linked* to the referenced block using a [[Block Reference]]. Values will be updated each time a **Tree Calculation** is called
		- before **Tree Calculation**:
			- length := 8ft
			- width := 10ft
			- perimeter := 2 * ( <ins>5ft</ins> * <ins>10ft</ins> ) = 30ft
		- after **Tree Calculation**:
			- length := 8ft
			- width := 10ft
			- perimeter := 2 * ( <ins>8ft</ins> * <ins>10ft</ins> ) = 36ft
	- Words are not allowed after ":=" and will cause an error.
		- *Incorrect*
			- Tributary Width := 15ft (based on adjacent joist spacing)
		- *Correct* - place comments justifying chosen value below the block
			- Tributary Width := 15ft
				- based on adjacent joist spacing
- ## Variable Definition
	- Variable names must be initially defined as a child, grandchild, etc. of the block used to run a **Tree Calcuation**. After a variable has been converted into the `[display value](((uuid)))` form, they can look for variable names outside the current block's children/grandchildren
		- *correct:*
			- Parent block (where **Tree Calculation** is ran)
				- Total Load := ${Dead Load} + ${Live Load}
					- Dead Load := 15psf
					- Live Load := 20psf
				- Total Line Load := ${Total Load} * ${Tributary Area}
				- Tributary Area := 10ft
		- *incorrect:*
			- Parent block (where **Tree Calculation** is ran)
				- Total Load := ${Dead Load} + ${Live Load}
					- Dead Load := 15psf
					- Live Load := 20psf
				- Total Line Load := ${Total Load} * ${Tributary Area}
			- Tributary Area := 10ft
				- #+BEGIN_WARNING
				  This block is outside the parent block, so `Tributary Area` will be undefined within `Total Line Load`
				  #+END_WARNING
	- Variable Names much be Unique
		- *Incorrect* - multiple variables defined as `Span`
			- Parent Block (where **Tree Calculation** is ran)
				- Beam 1
					- Span := 12ft
				- Beam 2
					- Span := 15ft
		- *Correct* - unique variable names used
			- Parent Block (where **Tree Calculation** is ran)
				- Beam 1
					- Span 1 := 12ft
				- Beam 2
					- Span 2 := 15ft
	- [[Block Reference]]s of previously defined variables may be included within calcs. Be careful to avoid duplicate names - even of nested blocks
		- External block on another page
			- Dead Load := 20psf
			  id:: 670e8da7-c8a8-4f62-98cc-dc48db29de3d
		- Parent Block Example 1
			- ((670e8da7-c8a8-4f62-98cc-dc48db29de3d))
			- Tributary Width := 5ft
			- WDead := ${Dead Load} * ${Tributary Width}
			  id:: 670e8dc4-7673-472f-9b10-976bfc75aebb
		- Parent Block Example 2
			- Live Load := 30psf
			- ((670e8dc4-7673-472f-9b10-976bfc75aebb))
			- Tributary Width := 15ft
				- #+BEGIN_WARNING
				  This will result in a conflict with the Tributary width defined in Example 1
				  #+END_WARNING
- ## Units
	- ### Units are **ignored** in calculations from the `cBlock`, `cTree`, and `cDNotes` commands
		- By default the last unit displayed in the equation will be displayed in the result. Units may be placed at the end of an equation in parenthesis "()" to define the desired output units
			- Typical Output 1 := 10ft + 15ft = 25ft
			- Typical Output 2 := 20psf \* 10ft = 200ft
			- Defined Units Output := 20psf \* 10ft (plf) = 200plf
		- Adding an underscore '_' to a unit or at the end will make the result *unitless*
			- Underscore example 1 := 500lbs * 10 / 100_ = 50
			- Underscore example 2 := 500lbs * 10 / 100 _ = 50
			- W/O underscore := 500lbs * 10 / 100 = 50lbs
	- ### Units are **enforced** in calculations from the `cUBlock`, `cUTree`, and `cUDNotes` commands
		- The resulting units will default to the units input
			- Default example 1 := 15ft + 20ft = 35ft
			- Default example 2 := 10plf * 20ft = 200lbs
		- Unit conversions will default to preferred units (described below) and can be overridden with "()" at the end similar to that described above
			- Conversion example 1 := 2ft + 6in = 2.5ft
			- Conversion example 2 := 2ft + 6in (in) = 30in
			- Conversion example 2 := 2ft + 6in (mm) = 762mm
		- #### Typical Unit Syntax
		  id:: 670e925c-1350-41f4-8d2e-245254522ed1
			- Units must match a predefined syntax or be manually added to be supported during conversions. A list of supported unit forms is displayed below
				- | Unit Type | Supported Syntax |
				  | --- | --- |
				  | LENGTH | ft, in, m, mm, eighth (rebar diameter), sixteenth (weld leg) |
				  | FORCE | lb, lbs, kip, k, kips, N, kN|
				  | UNIFORM LOAD | plf, klf, pli, kli, lb/ft, lbs/ft, lb/in, lbs/in, k/ft, kip/ft, kips/ft, k/in, kip/in, kips/in, N/m, kN/m|
				  | SURFACE | sf, sqin, in^2, ft^2, m^2|
				  | VOLUME | in^3, ft^3, cuft, cuin, m^3|
				  | DENSITY | pcf, kcf, pci, kci, N/mm^3, kN/m^3 |
				  | STIFFNESS | in^4|
				  | HEXATIC | in^6 |
				  | MOMENT (with or without -) | lb-ft, lbs-ft, k-ft, kip-ft, kips-ft, lb-in, lbs-in, k-in, kip-in, kips-in, Nm, kNm |
				  | PRESSURE | psf, ksf, psi, ksi, Pa, kPa |
		- #### Valueless Units are added dynamically
			- Valueless units don't contain a unit type shown in the chart above and will be added dynamically for support within calculations. In the example below `cell` is the valueless unit defined
				- Total Equipment Weight := ${No. Cells} * ${Cell Weight}
					- No. Cells := 10cells
					- Cell Weight := 10k/cell
				- Support for the plural and singular forms of the unit is added by default