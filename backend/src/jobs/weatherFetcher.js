// src/jobs/weatherFetcher.js
// Fetches weather forecasts (temperature + rainfall) for every zone from Open-Meteo
// and persists them into weather_readings.
//
// Called once on server start — uses setInterval to run every WEATHER_FETCH_INTERVAL_MS.
// Open-Meteo is free and requires no API key.
//
// Zone → coordinates mapping is loaded from ZONE_COORDS_JSON env var (JSON string)
// or falls back to a default map for the four seeded Indian cities.

const axios  = require('axios');
const prisma = require('../lib/prisma');

const FETCH_INTERVAL_MS = parseInt(process.env.WEATHER_FETCH_INTERVAL_MS) || 30 * 60 * 1000; // 30 min

// Default coordinates for the 4 seeded zones (city name → lat/lon).
// Override by setting ZONE_COORDS_JSON='{"Zone Name":[lat,lon],...}' in .env
const DEFAULT_COORDS = {
  'Ahmedabad North': [23.0225, 72.5714],
  'Surat West':      [21.1702, 72.8311],
  'Rajkot Central':  [22.3039, 70.8022],
  'Vadodara South':  [22.3072, 73.1812],
};

function getCoordMap() {
  try {
    return process.env.ZONE_COORDS_JSON
      ? JSON.parse(process.env.ZONE_COORDS_JSON)
      : DEFAULT_COORDS;
  } catch {
    console.warn('[Weather] ZONE_COORDS_JSON is invalid JSON, using defaults');
    return DEFAULT_COORDS;
  }
}

/** Fetch 1-day forecast from Open-Meteo for a lat/lon pair */
async function fetchOpenMeteo(lat, lon) {
  const url = 'https://api.open-meteo.com/v1/forecast';
  const resp = await axios.get(url, {
    params: {
      latitude:        lat,
      longitude:       lon,
      daily:           'precipitation_sum,temperature_2m_max',
      forecast_days:   1,
      timezone:        'Asia/Kolkata',
    },
    timeout: 8000,
  });

  const daily = resp.data?.daily;
  if (!daily) throw new Error('Unexpected Open-Meteo response shape');

  return {
    temperatureC: daily.temperature_2m_max?.[0] ?? 0,
    rainfallMm:   daily.precipitation_sum?.[0]  ?? 0,
    forecastFor:  new Date(daily.time?.[0]),
  };
}

/** One fetch cycle — iterate all zones and upsert weather reading */
async function fetchOnce() {
  const coordMap = getCoordMap();

  try {
    const zones = await prisma.zone.findMany({ select: { id: true, name: true } });

    for (const zone of zones) {
      const coords = coordMap[zone.name];
      if (!coords) {
        console.warn(`[Weather] No coordinates for zone "${zone.name}" — skipping`);
        continue;
      }

      try {
        const { temperatureC, rainfallMm, forecastFor } = await fetchOpenMeteo(coords[0], coords[1]);

        await prisma.weatherReading.create({
          data: { zoneId: zone.id, temperatureC, rainfallMm, forecastFor },
        });

        console.log(`[Weather] ${zone.name}: ${temperatureC}°C, ${rainfallMm}mm`);
      } catch (zoneErr) {
        console.error(`[Weather] Failed for zone "${zone.name}":`, zoneErr.message);
      }
    }
  } catch (err) {
    console.error('[Weather] Fetch cycle error:', err.message);
  }
}

/** Start the weather fetch loop. Returns the intervalId. */
function startWeatherFetcher() {
  console.log(`[Weather] Starting fetcher — interval ${FETCH_INTERVAL_MS / 60000} min`);
  fetchOnce(); // run immediately on startup
  return setInterval(fetchOnce, FETCH_INTERVAL_MS);
}

module.exports = { startWeatherFetcher };
