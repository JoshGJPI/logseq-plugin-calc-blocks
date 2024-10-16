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
    ["DENSITY", [1, -2, -2, 0, 0, 0, 0, 0, 0]],
    ["STIFFNESS", [0, 4, 0, 0, 0, 0, 0, 0, 0]],
    ["HEXATIC", [0, 6, 0, 0, 0, 0, 0, 0, 0]],
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
  FORCE: ['lb', 'lbs', 'kip', 'k', 'kips', 'N', 'kN'],
  UNIFORM_LOAD: ['plf', 'klf', 'pli', 'kli', 'N/m', 'kN/m'],
  SURFACE: ['sf', 'sqft', 'sqin', 'in^2', 'ft^2', 'm^2'],
  VOLUME: ['in^3', 'ft^3', 'cuft', 'cuin', 'm^3'],
  DENSITY: ['pcf', 'kcf', 'pci', 'kci', 'N/mm^3', 'kN/m^3'],
  STIFFNESS: ['in^4'],
  HEXATIC: ['in^6'],
  MOMENT: ['lbft', 'kipft', 'lbin', 'kipin', 'Nm', 'kNm'],
  PRESSURE: ['psf', 'ksf', 'psi', 'ksi', 'Pa', 'kPa']
};

// Grouping of units by system (US or Metric)
export const UNIT_SYSTEMS = {
  US: {
    LENGTH: ['ft', 'in'],
    FORCE: ['lb', 'lbs', 'k', 'kip', 'kips'],
    UNIFORM_LOAD: ['plf', 'klf', 'pli', 'kli'],
    PRESSURE: ['psf', 'ksf', 'psi', 'ksi'],
    MOMENT: ['lbft', 'kipft', 'lbin', 'kipin'],
    SURFACE: ['sqin', 'sqft', 'sf', 'in^2', 'ft^2'],
    VOLUME: ['cuin', 'cuft', 'cf', 'in^3', 'ft^3'],
    DENSITY: ['pcf', 'kcf', 'pci', 'kci'],
    STIFFNESS: ['quartin', 'in^4'],
    HEXATIC: ['hexin', 'in^6'],
  },
  METRIC: {
    LENGTH: ['m', 'mm'],
    FORCE: ['N', 'kN'],
    UNIFORM_LOAD: ['N/m', 'kN/m', 'N/mm', 'kN/mm'],
    PRESSURE: ['Pa', 'kPa'],
    MOMENT: ['N*m', 'kN*m'],
    SURFACE: ['mm^2', 'm^2', 'sqmm', 'sqm'],
    VOLUME: ['mm^3', 'm^3', 'cmm', 'cm'],
    DENSITY: ['N/mm^3', 'kN/m^3'],
    STIFFNESS: ['mm^4'],
    HEXATIC: ['mm^6']
  }
};