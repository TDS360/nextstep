
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

// REAL tree coverage data.
// USDA Forest Service publishes actual satellite-derived tree
// canopy cover (NLCD Tree Canopy Cover, 30m resolution,
// updated through 2023) as a public ArcGIS ImageServer. The
// `getSamples` operation returns the pixel value at a single
// coordinate — no API key required.
//   https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_LandscapeAndWildlife/NLCD_TCC_CONUS/ImageServer
//
// Two important caveats, both handled by the try/catch below:
//   1. Coverage is CONUS only (continental US) — anywhere else
//      returns no-data, so this falls back automatically.
//   2. This is a legacy government server; it's not guaranteed
//      to always be fast, up, or reachable from a browser (CORS
//      policies on older ArcGIS deployments vary). A short
//      timeout + fallback means the app never hangs or breaks
//      waiting on it.
const TREE_COVER_IMAGE_SERVER_URL =
  "https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_LandscapeAndWildlife/NLCD_TCC_CONUS/ImageServer/getSamples";
const TREE_COVER_FETCH_TIMEOUT_MS = 3500;

// Pixel values 254 (non-processing area) and 255 (background/
// no data) are sentinel values in this dataset, not real
// tree-cover percentages — see the dataset's own description.
const TREE_COVER_NODATA_VALUES = new Set([254, 255]);

async function fetchRealTreeCoverage(lat, lng) {
  const geometry = JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } });
  const url = `${TREE_COVER_IMAGE_SERVER_URL}?geometry=${encodeURIComponent(geometry)}&geometryType=esriGeometryPoint&f=json`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TREE_COVER_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Tree cover request failed (${response.status})`);

    const data = await response.json();
    const rawValue = data.samples?.[0]?.value;
    const value = rawValue != null ? Math.round(Number(rawValue)) : NaN;

    if (Number.isNaN(value) || TREE_COVER_NODATA_VALUES.has(value) || value < 0 || value > 100) {
      return null; // outside CONUS, or the server had no data for this point
    }
    return value;
  } catch {
    return null; // network error, timeout, CORS, or anything else — fall back
  } finally {
    clearTimeout(timeout);
  }
}

// DEMO FALLBACK for tree coverage — used whenever the real USDA
// data above isn't available (outside the US, or the government
// server is unreachable). Derives a deterministic value (0-70%)
// from the coordinates themselves, so the same location always
// returns the same number and the rest of the app (risk scoring,
// the tree simulator) always has something stable to react to.
function demoTreeCoverage(lat, lng) {
  const seed = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
  const fraction = seed - Math.floor(seed); // deterministic 0..1
  return Math.round(fraction * 70);
}

export async function fetchEnvironmentalData(lat, lng) {
  const weatherUrl = `${WEATHER_URL}?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature&temperature_unit=fahrenheit`;
  const airQualityUrl = `${AIR_QUALITY_URL}?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5`;

  const [weatherResponse, airQualityResponse, realTreeCoverage] = await Promise.all([
    fetch(weatherUrl),
    fetch(airQualityUrl),
    fetchRealTreeCoverage(lat, lng),
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
  const treeCoverageIsEstimated = realTreeCoverage == null;

  return {
    aqi: aqi != null ? Math.round(aqi) : null,
    aqiLabel: aqiLabelFor(aqi),
    temperature: temperature != null ? Math.round(temperature) : null,
    feelsLike: feelsLike != null ? Math.round(feelsLike) : null,
    pm25: pm25 != null ? Math.round(pm25 * 10) / 10 : null,
    treeCoverage: realTreeCoverage ?? demoTreeCoverage(lat, lng),
    treeCoverageIsEstimated,
  };
}