//an array of unit formulas
export const BASE_UNIT_ARRAY = [
    ["NONE", [0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ["MASS", [1, 0, 0, 0, 0, 0, 0, 0, 0]],
    ["LENGTH", [0, 1, 0, 0, 0, 0, 0, 0, 0]],
    ["TIME", [0, 0, 1, 0, 0, 0, 0, 0, 0]],
    ["CURRENT", [0, 0, 0, 1, 0, 0, 0, 0, 0]],
    ["TEMPERATURE", [0, 0, 0, 0, 1, 0, 0, 0, 0]],
    ["LUMINOUS_INTENSITY", [0, 0, 0, 0, 0, 1, 0, 0, 0]],
    ["AMOUNT_OF_SUBSTANCE", [0, 0, 0, 0, 0, 0, 1, 0, 0]],
    ["FORCE", [1, 1, -2, 0, 0, 0, 0, 0, 0]],
    ["UNIFORM_LOAD", [1, 0, -2, 0, 0, 0, 0, 0, 0]],
    ["SURFACE", [0, 2, 0, 0, 0, 0, 0, 0, 0]],
    ["VOLUME", [0, 3, 0, 0, 0, 0, 0, 0, 0]],
    ["MOMENT", [1, 2, -2, 0, 0, 0, 0, 0, 0]],
    ["POWER", [1, 2, -3, 0, 0, 0, 0, 0, 0]],
    ["PRESSURE", [1, -1, -2, 0, 0, 0, 0, 0, 0]],
    ["ELECTRIC_CHARGE", [0, 0, 1, 1, 0, 0, 0, 0, 0]],
    ["ELECTRIC_CAPACITANCE", [-1, -2, 4, 2, 0, 0, 0, 0, 0]],
    ["ELECTRIC_POTENTIAL", [1, 2, -3, -1, 0, 0, 0, 0, 0]],
    ["ELECTRIC_RESISTANCE", [1, 2, -3, -2, 0, 0, 0, 0, 0]],
    ["ELECTRIC_INDUCTANCE", [1, 2, -2, -2, 0, 0, 0, 0, 0]],
    ["ELECTRIC_CONDUCTANCE", [-1, -2, 3, 2, 0, 0, 0, 0, 0]],
    ["MAGNETIC_FLUX", [1, 2, -2, -1, 0, 0, 0, 0, 0]],
    ["MAGNETIC_FLUX_DENSITY", [1, 0, -2, -1, 0, 0, 0, 0, 0]],
    ["FREQUENCY", [0, 0, -1, 0, 0, 0, 0, 0, 0]],
    ["ANGLE", [0, 0, 0, 0, 0, 0, 0, 1, 0]],
    ["BIT", [0, 0, 0, 0, 0, 0, 0, 0, 1]]
  ];

//an object determining the default units for each base unit
export const DEFAULT_UNITS = {
    LENGTH: "ft",
    FORCE: "lb",
    UNIFORM_LOAD: "plf",
    SURFACE: "sf",
    VOLUME: "cf",
    MOMENT: "lbft",
    PRESSURE: "psi"
}