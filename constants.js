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

// Preference order for units of different types
export const UNIT_PREFERENCES = {
  LENGTH: ['ft', 'in', 'm', 'mm'],
  FORCE: ['lb', 'kip', 'N', 'kN'],
  UNIFORM_LOAD: ['plf', 'klf', 'N/m', 'kN/m'],
  SURFACE: ['sf', 'sqin', 'm^2'],
  VOLUME: ['cuft', 'cuin', 'm^3'],
  MOMENT: ['lb*ft', 'kip*ft', 'lb*in', 'kip*in', 'N*m', 'kN*m'],
  PRESSURE: ['psf', 'ksf', 'psi', 'ksi', 'Pa', 'kPa']
};

// Grouping of units by system (US or Metric)
export const UNIT_SYSTEMS = {
  US: {
    LENGTH: ['ft', 'in'],
    FORCE: ['lb', 'kip'],
    MOMENT: ['lb*ft', 'kip*ft', 'lb*in', 'kip*in'],
  },
  METRIC: {
    LENGTH: ['m', 'mm'],
    FORCE: ['N', 'kN'],
    MOMENT: ['N*m', 'kN*m'],
  }
};