
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

// Turns a raw geocoding result into the shape the rest of
// the app uses. Keeps admin1 (state/region) + country
// around so results can be told apart in a dropdown, e.g.
// "Springfield, Illinois, United States" vs
// "Springfield, Missouri, United States".
function normalizeResult(result) {
  return {
    id: result.id,
    name: result.name,
    admin1: result.admin1 ?? null,
    country: result.country ?? null,
    lat: result.latitude,
    lng: result.longitude,
  };
}

export function formatLocationLabel(result) {
  return [result.name, result.admin1, result.country].filter(Boolean).join(", ");
}

// Search-as-you-type. Returns [] for short/empty queries
// instead of hitting the network on every keystroke.
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];

  const url = `${GEOCODE_URL}?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding request failed (${response.status})`);
  }

  const data = await response.json();
  return (data.results ?? []).map(normalizeResult);
}

// EPA US AQI breakpoints, in plain English.
function aqiLabelFor(aqi) {
  if (aqi == null) return null;
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

// DEMO PLACEHOLDER for tree coverage.
// There's no simple, free, key-free API for tree/canopy
// coverage, so this derives a deterministic value (0-70%)
// from the coordinates themselves — the same location
// always returns the same number, so the rest of the app
// (risk scoring, the tree simulator) has something
// real and stable to react to.
//
// To swap in real data later (e.g. Global Forest Watch /
// Hansen tree-cover tiles, which need an API key), replace
// the body of this function with that fetch call — nothing
// else needs to change, since callers just await
// fetchEnvironmentalData() and read `.treeCoverage`.
function demoTreeCoverage(lat, lng) {
  const seed = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
  const fraction = seed - Math.floor(seed); // deterministic 0..1
  return Math.round(fraction * 70);
}

// Fetches everything Feature 1 needs for a coordinate pair:
// AQI, AQI label, temperature, "feels like" temperature,
// PM2.5, and tree coverage. Shape matches
// `environmental` in data.js exactly, so callers can pass
// the result straight into appData.
export async function fetchEnvironmentalData(lat, lng) {
  const weatherUrl = `${WEATHER_URL}?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature&temperature_unit=fahrenheit`;
  const airQualityUrl = `${AIR_QUALITY_URL}?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5`;

  const [weatherResponse, airQualityResponse] = await Promise.all([
    fetch(weatherUrl),
    fetch(airQualityUrl),
  ]);

  if (!weatherResponse.ok) {
    throw new Error(`Weather request failed (${weatherResponse.status})`);
  }
  if (!airQualityResponse.ok) {
    throw new Error(`Air quality request failed (${airQualityResponse.status})`);
  }

  const weather = await weatherResponse.json();
  const airQuality = await airQualityResponse.json();

  const aqi = airQuality.current?.us_aqi ?? null;
  const pm25 = airQuality.current?.pm2_5 ?? null;
  const temperature = weather.current?.temperature_2m ?? null;
  const feelsLike = weather.current?.apparent_temperature ?? null;

  return {
    aqi: aqi != null ? Math.round(aqi) : null,
    aqiLabel: aqiLabelFor(aqi),
    temperature: temperature != null ? Math.round(temperature) : null,
    feelsLike: feelsLike != null ? Math.round(feelsLike) : null,
    pm25: pm25 != null ? Math.round(pm25 * 10) / 10 : null,
    treeCoverage: demoTreeCoverage(lat, lng),
  };
}
