// riskEngine.js

// ============================================================
// AeroWatch Risk Engine
// ============================================================
//
// This is a deterministic hackathon scoring model.
// It is NOT an official scientific or medical environmental
// risk standard.
//
// Score meaning:
// 0   = worst conditions
// 100 = best conditions
// ============================================================


// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------

const AQI_LIMIT = 200;
const PM25_LIMIT = 50;

const IDEAL_TEMPERATURE = 72; // °F
const TEMPERATURE_RANGE = 40; // °F

const AIR_AQI_WEIGHT = 0.60;
const AIR_PM25_WEIGHT = 0.40;

const HEAT_TEMPERATURE_WEIGHT = 0.70;
const HEAT_TREE_WEIGHT = 0.30;

const OVERALL_AIR_WEIGHT = 0.50;
const OVERALL_HEAT_WEIGHT = 0.50;


// ------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------

/**
 * Keeps a number between a minimum and maximum value.
 *
 * Example:
 * clamp(120, 0, 100) → 100
 * clamp(-10, 0, 100) → 0
 */
function clamp(value, min = 0, max = 100) {
    return Math.min(Math.max(value, min), max);
}


/**
 * Checks whether a value is a valid number.
 *
 * Rejects:
 * - strings
 * - null
 * - undefined
 * - NaN
 * - Infinity
 */
function validateNumber(value, name) {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value)
    ) {
        throw new TypeError(`${name} must be a valid number.`);
    }
}


/**
 * Rounds a score to the nearest whole number and
 * guarantees that it remains between 0 and 100.
 */
function finalizeScore(score) {
    return Math.round(clamp(score, 0, 100));
}


// ------------------------------------------------------------
// AIR QUALITY
// ------------------------------------------------------------

/**
 * Converts AQI into a 0–100 score.
 *
 * AQI 0   → 100
 * AQI 200 → 0
 *
 * Values above 200 are clamped to 0.
 */
function calculateAQIScore(aqi) {
    validateNumber(aqi, "AQI");

    if (aqi < 0) {
        throw new RangeError("AQI cannot be negative.");
    }

    const score = 100 - (aqi / AQI_LIMIT) * 100;

    return finalizeScore(score);
}


/**
 * Converts PM2.5 into a 0–100 score.
 *
 * PM2.5 0  → 100
 * PM2.5 50 → 0
 *
 * Values above 50 are clamped to 0.
 */
function calculatePM25Score(pm25) {
    validateNumber(pm25, "PM2.5");

    if (pm25 < 0) {
        throw new RangeError("PM2.5 cannot be negative.");
    }

    const score = 100 - (pm25 / PM25_LIMIT) * 100;

    return finalizeScore(score);
}


/**
 * Calculates the overall Air Score from AQI and PM2.5.
 *
 * AQI contributes 60%.
 * PM2.5 contributes 40%.
 */
function calculateAirScore(aqi, pm25) {
    const aqiScore = calculateAQIScore(aqi);
    const pm25Score = calculatePM25Score(pm25);

    const score =
        (aqiScore * AIR_AQI_WEIGHT) +
        (pm25Score * AIR_PM25_WEIGHT);

    return finalizeScore(score);
}


// ------------------------------------------------------------
// HEAT
// ------------------------------------------------------------

/**
 * Calculates a temperature score.
 *
 * 72°F is treated as the ideal reference temperature.
 *
 * The score decreases as temperature moves farther away
 * from 72°F in either direction.
 */
function calculateTemperatureScore(temperature) {
    validateNumber(temperature, "Temperature");

    // Temperatures at or below the ideal reference
    // receive the maximum heat score.
    if (temperature <= IDEAL_TEMPERATURE) {
        return 100;
    }

    const heatAboveIdeal =
        temperature - IDEAL_TEMPERATURE;

    const score =
        100 - (heatAboveIdeal / TEMPERATURE_RANGE) * 100;

    return finalizeScore(score);
}


/**
 * Calculates the Heat Score.
 *
 * Temperature contributes 70%.
 * Tree coverage contributes 30%.
 */
function calculateHeatScore(temperature, treeCoverage) {
    validateNumber(temperature, "Temperature");
    validateNumber(treeCoverage, "Tree coverage");

    if (treeCoverage < 0) {
        throw new RangeError(
            "Tree coverage cannot be negative."
        );
    }

    // Tree coverage can never exceed 100%.
    const safeTreeCoverage = clamp(treeCoverage, 0, 100);

    const temperatureScore =
        calculateTemperatureScore(temperature);

    const treeScore = safeTreeCoverage;

    const score =
        (temperatureScore * HEAT_TEMPERATURE_WEIGHT) +
        (treeScore * HEAT_TREE_WEIGHT);

    return finalizeScore(score);
}


// ------------------------------------------------------------
// OVERALL SCORE
// ------------------------------------------------------------

/**
 * Combines Air Score and Heat Score.
 *
 * Air contributes 50%.
 * Heat contributes 50%.
 */
function calculateOverallScore(airScore, heatScore) {
    validateNumber(airScore, "Air score");
    validateNumber(heatScore, "Heat score");

    const safeAirScore = clamp(airScore, 0, 100);
    const safeHeatScore = clamp(heatScore, 0, 100);

    const score =
        (safeAirScore * OVERALL_AIR_WEIGHT) +
        (safeHeatScore * OVERALL_HEAT_WEIGHT);

    return finalizeScore(score);
}


// ------------------------------------------------------------
// MAIN ENVIRONMENTAL CALCULATION
// ------------------------------------------------------------

/**
 * Calculates all AeroWatch environmental scores.
 *
 * Expected input:
 *
 * {
 *     temperature: 89,
 *     aqi: 76,
 *     pm25: 18,
 *     treeCoverage: 14
 * }
 */
function calculateEnvironmentalRisk(environmentalData) {
    if (
        !environmentalData ||
        typeof environmentalData !== "object"
    ) {
        throw new TypeError(
            "Environmental data must be an object."
        );
    }

    const {
        temperature,
        aqi,
        pm25,
        treeCoverage
    } = environmentalData;

    const airScore = calculateAirScore(aqi, pm25);

    const heatScore =
        calculateHeatScore(
            temperature,
            treeCoverage
        );

    const overallScore =
        calculateOverallScore(
            airScore,
            heatScore
        );

    return {
        airScore,
        heatScore,
        overallScore,
        treeCoverage: clamp(treeCoverage, 0, 100)
    };
}


// ------------------------------------------------------------
// TREE COVERAGE SIMULATION
// ------------------------------------------------------------

/**
 * Simulates increasing tree coverage.
 *
 * Important:
 * - AQI stays unchanged.
 * - PM2.5 stays unchanged.
 * - Air Score stays unchanged.
 * - Heat Score can improve.
 * - Overall Score can improve.
 * - Tree coverage cannot exceed 100%.
 *
 * Example:
 *
 * simulateTreeCoverage(data, 10)
 *
 * 14% → 24%
 */
function simulateTreeCoverage(environmentalData, increase) {
    if (
        !environmentalData ||
        typeof environmentalData !== "object"
    ) {
        throw new TypeError(
            "Environmental data must be an object."
        );
    }

    validateNumber(increase, "Tree coverage increase");

    if (increase < 0) {
        throw new RangeError(
            "Tree coverage increase cannot be negative."
        );
    }

    const {
        temperature,
        aqi,
        pm25,
        treeCoverage
    } = environmentalData;

    validateNumber(treeCoverage, "Tree coverage");

    if (treeCoverage < 0) {
        throw new RangeError(
            "Tree coverage cannot be negative."
        );
    }

    // Calculate the original state.
    const before = calculateEnvironmentalRisk({
        temperature,
        aqi,
        pm25,
        treeCoverage
    });

    // Prevent tree coverage from exceeding 100%.
    const newTreeCoverage = clamp(
        treeCoverage + increase,
        0,
        100
    );

    // Calculate the simulated state.
    const after = calculateEnvironmentalRisk({
        temperature,
        aqi,
        pm25,
        treeCoverage: newTreeCoverage
    });

    return {
    before: {
        treeCoverage: before.treeCoverage,
        airScore: before.airScore,
        heatScore: before.heatScore,
        overallScore: before.overallScore
    },

    after: {
        treeCoverage: after.treeCoverage,
        airScore: after.airScore,
        heatScore: after.heatScore,
        overallScore: after.overallScore
    },

    change: after.overallScore - before.overallScore
    };
}


// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------

export {
    calculateAQIScore,
    calculatePM25Score,
    calculateAirScore,
    calculateTemperatureScore,
    calculateHeatScore,
    calculateOverallScore,
    calculateEnvironmentalRisk,
    simulateTreeCoverage
};