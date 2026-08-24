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
  },
  risk: {
    airRisk: null,
    heatRisk: null,
    overallRisk: null,
    topReasons: [],
  },

  simulation: {
    currentTreeCoverage: null,
    currentRisk: null,
    simulatedTreeCoverage: null,
    simulatedRisk: null,
    change: null,
  },

  ai: {
    mainConcern: null,
    contributingFactors: [],
    recommendations: [],
    simulationExplanation: null,
  },
};