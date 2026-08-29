const AI_API_URL = import.meta.env.VITE_AI_API_URL; // e.g. http://localhost:5001/api/ai-insights
const FETCH_TIMEOUT_MS = 4000;

// ---- Layer 1: rule-based generator (always available) ----

function describeAqi(environmental) {
  const { aqi, pm25, aqiLabel } = environmental;
  if (aqi == null) return null;
  if (aqi > 150) return `AQI is ${aqi} (${aqiLabel ?? "unhealthy"}), driven by PM2.5 at ${pm25} µg/m³`;
  if (aqi > 100) return `AQI is ${aqi} (${aqiLabel ?? "moderate"}) — sensitive groups should take note`;
  if (aqi > 50) return `AQI is ${aqi} (${aqiLabel ?? "moderate"})`;
  return `AQI is ${aqi} (${aqiLabel ?? "good"}) — air quality isn't a major concern right now`;
}

function describeHeat(environmental) {
  const { temperature, feelsLike } = environmental;
  if (temperature == null) return null;
  if (feelsLike != null && feelsLike >= 90) return `It feels like ${feelsLike}°F — heat risk is elevated`;
  if (temperature >= 85) return `Temperature is ${temperature}°F, warm enough to factor into outdoor plans`;
  return `Temperature is ${temperature}°F — not a significant heat concern`;
}

function describeTrees(environmental) {
  const { treeCoverage } = environmental;
  if (treeCoverage == null) return null;
  if (treeCoverage < 20) return `Tree coverage is low (${treeCoverage}%), offering little shade or air filtering`;
  if (treeCoverage < 45) return `Tree coverage is moderate (${treeCoverage}%)`;
  return `Tree coverage is strong (${treeCoverage}%), which helps moderate both heat and air quality`;
}

// Exported so App.jsx (or a future Feature 2 module) can call it
// directly without going through fetchAIInsights, e.g. for an
// instant first pass before the Ollama layer resolves.
export function generateRuleBasedInsights(environmental = {}, risk = {}, simulation = {}) {
  const factors = [describeAqi(environmental), describeHeat(environmental), describeTrees(environmental)].filter(
    Boolean,
  );

  const airScore = risk.airRisk ?? (environmental.aqi != null ? Math.min(100, Math.round(environmental.aqi / 3)) : null);
  const heatScore = risk.heatRisk;

  let mainConcern;
  if (airScore != null && heatScore != null) {
    mainConcern =
      airScore >= heatScore
        ? `Air quality is the bigger factor here — ${describeAqi(environmental) ?? "current readings are elevated"}.`
        : `Heat is the bigger factor here — ${describeHeat(environmental) ?? "current readings are elevated"}.`;
  } else if (environmental.aqi != null) {
    mainConcern = `${describeAqi(environmental)}.`;
  } else {
    mainConcern = "Search for a location to see a risk summary.";
  }

  const recommendations = [];
  if (environmental.aqi != null && environmental.aqi > 100) {
    recommendations.push("Limit prolonged outdoor exertion, especially for sensitive groups");
  }
  if (environmental.pm25 != null && environmental.pm25 > 35) {
    recommendations.push("Consider an air purifier or N95 mask outdoors");
  }
  if (environmental.feelsLike != null && environmental.feelsLike > 90) {
    recommendations.push("Stay hydrated and avoid peak-heat hours outdoors");
  }
  if (environmental.treeCoverage != null && environmental.treeCoverage < 30) {
    recommendations.push("More tree cover in this area would meaningfully reduce heat and air risk");
  }
  if (recommendations.length === 0) {
    recommendations.push("No major concerns detected — conditions look reasonable right now");
  }

  const simulationExplanation =
    simulation?.simulatedRisk != null && simulation?.currentRisk != null
      ? `Adding 10% tree coverage moves the overall risk score from ${simulation.currentRisk} to ${simulation.simulatedRisk}, mainly by adding shade and filtering particulates.`
      : null;

  return {
    mainConcern,
    contributingFactors: factors.length > 0 ? factors : ["Search for a location to see contributing factors"],
    recommendations,
    simulationExplanation,
  };
}

// ---- Layer 2: optional local LLM (Ollama via server/app.py) ----

export async function fetchAIInsights(environmental, risk, simulation) {
  if (!AI_API_URL) {
    return generateRuleBasedInsights(environmental, risk, simulation);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ environmental, risk, simulation }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`AI backend responded ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    return data;
  } catch {
    // Backend not configured, not running, timed out, or returned
    // something unusable — fall back to the always-available
    // rule-based version instead of showing an error.
    return generateRuleBasedInsights(environmental, risk, simulation);
  } finally {
    clearTimeout(timeout);
  }
}
