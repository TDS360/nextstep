export const placeholderData = {
  location: {
    name: "Washington, DC, USA", // string|null
    lat: 38.9072, // number|null
    lng: -77.0369, // number|null
  },

  environmental: {
    // -- FEATURE 1 DEVELOPER produces this --
    aqi: null, // number|null — US AQI, e.g. 76
    aqiLabel: null, // string|null — e.g. "Moderate"
    temperature: null, // number|null — °F
    feelsLike: null, // number|null — °F
    pm25: null, // number|null — µg/m³
    treeCoverage: null, // number|null — percentage, 0-100
    treeCoverageIsEstimated: false, // bool — true when the real USDA dataset had no data for this point (outside the US) and a placeholder value was used instead
  },

  // SAFETY scores, straight from riskEngine.js: 100 = best/safest
  // conditions, 0 = worst. Higher is always better here.
  safety: {
    airSafety: null,
    heatSafety: null,
    overallSafety: null,
    topReasons: [],
  },

  simulation: {
    currentTreeCoverage: null,
    currentSafety: null,
    simulatedTreeCoverage: null,
    simulatedSafety: null,
    change: null, // positive = improvement (higher safety) after adding trees
  },

  ai: {
    mainConcern: null,
    contributingFactors: [],
    recommendations: [], // personal/protective actions — "Protect yourself"
    environmentalActions: [], // community/environmental actions — "Help the environment"
    simulationExplanation: null,
  },
};
