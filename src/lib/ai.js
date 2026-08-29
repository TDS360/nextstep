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

  // "Protect yourself" — personal, immediate, protective actions.
  // Each one names WHO it matters most for and WHY, not just what.
  const recommendations = [];
  if (environmental.aqi != null && environmental.aqi > 100) {
    recommendations.push(
      "Limit prolonged or intense outdoor exertion (running, biking, yard work) today — this hits children, older adults, and anyone with asthma or heart/lung conditions first",
    );
  }
  if (environmental.pm25 != null && environmental.pm25 > 35) {
    recommendations.push(
      "If you're out for a while, wear a properly fitted N95/KN95 mask, and run a HEPA air purifier indoors — especially in bedrooms overnight",
    );
  }
  if (environmental.feelsLike != null && environmental.feelsLike > 90) {
    recommendations.push(
      "Drink water on a schedule (don't wait until you're thirsty), shift outdoor plans away from midday-to-late-afternoon, and check on elderly neighbors without A/C",
    );
  }
  if (recommendations.length === 0 && environmental.aqi != null) {
    recommendations.push("No major personal-safety concerns detected right now — conditions are fine for normal outdoor activity");
  }
  if (recommendations.length === 0) {
    recommendations.push("Search for a location to see personal safety recommendations");
  }

  // "Help the environment" — realistic, concrete community actions
  // tied to what's actually driving the numbers here, each with
  // enough detail to actually act on (who to contact, what to ask
  // for, why it works) rather than a generic one-liner.
  const environmentalActions = [];
  if (environmental.treeCoverage != null && environmental.treeCoverage < 30) {
    environmentalActions.push(
      "Contact your city or county's urban forestry / public works department and ask about their street-tree planting program — many will plant a tree in the sidewalk strip in front of your home for free or low cost. Coverage here is low enough that even a handful of new trees on your block will measurably cut local heat and filter particulates within a few years",
    );
  }
  if (environmental.aqi != null && environmental.aqi > 100) {
    environmentalActions.push(
      "Vehicle exhaust is one of the largest controllable sources of local PM2.5 and ozone — on days like this, combine errands into one trip, carpool with a neighbor or coworker, or swap short car trips for transit or biking where you can",
    );
  }
  if (environmental.pm25 != null && environmental.pm25 > 35) {
    environmentalActions.push(
      "Hold off on burning yard waste, wood, or trash today — open burning is one of the fastest ways to spike neighborhood PM2.5, and it's adding directly on top of an already elevated reading",
    );
  }
  if (environmental.treeCoverage != null && environmental.treeCoverage >= 30) {
    environmentalActions.push(
      "This area already has decent canopy — help keep it that way by reporting storm-damaged or diseased street trees to your city's forestry department, and by volunteering with a local tree-care group that waters and mulches young trees through their first few summers, when most newly planted trees actually die",
    );
  }
  if (environmentalActions.length === 0 && environmental.aqi != null) {
    environmentalActions.push(
      "Conditions are good right now — a good time to get ahead of future problems by finding a local tree-planting event, community garden, or park cleanup through your city's parks department, or a group like the Arbor Day Foundation or American Forests",
    );
  }
  const simulationExplanation =
    simulation?.simulatedRisk != null && simulation?.currentRisk != null
      ? `Adding 10% tree coverage moves the overall risk score from ${simulation.currentRisk} to ${simulation.simulatedRisk}, mainly by adding shade and filtering particulates.`
      : null;

    return {
    mainConcern,
    contributingFactors: factors.length > 0 ? factors : ["Search for a location to see contributing factors"],
    recommendations,
    environmentalActions,
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
