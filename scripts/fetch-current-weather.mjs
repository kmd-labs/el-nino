#!/usr/bin/env node
/**
 * Fetches the current surface wind, ocean waves and sea surface temperature on a global 10° grid from Open-Meteo
 * (https://open-meteo.com, CC BY 4.0) and writes them to src/assets/data/current-weather.json
 * for the "Current situation" view.
 *
 * Runs in CI before every Pages build (see .github/workflows/deploy.yml), so visitors read a
 * static file instead of calling the API. On any error the previous file is kept and the script
 * still exits 0, so a flaky API never breaks a deploy.
 *
 * Usage: node scripts/fetch-current-weather.mjs
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets/data/current-weather.json');

// Grid: 13 latitudes (60°S–60°N) × 36 longitudes (180°W–170°E) = 468 points per API.
const LAT0 = -60;
const LON0 = -180;
const STEP = 10;
const N_LAT = 13;
const N_LON = 36;
// Open-Meteo's free tier allows 600 calls/minute and counts every location as one call,
// so the wind and wave requests are spaced a minute apart.
const CHUNK = 120;
const PAUSE_BETWEEN_APIS_MS = 65_000;

const WIND_URL = 'https://api.open-meteo.com/v1/forecast';
const WAVE_URL = 'https://marine-api.open-meteo.com/v1/marine';

const points = [];
for (let r = 0; r < N_LAT; r++) {
  for (let c = 0; c < N_LON; c++) {
    points.push({ lat: LAT0 + r * STEP, lon: LON0 + c * STEP });
  }
}

const sleep = ms => new Promise(res => setTimeout(res, ms));
const round1 = v => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);

/** Requests `current` variables for all grid points, in chunks; returns one `current` object per point. */
async function fetchCurrent(baseUrl, variables, extra = '') {
  const out = [];
  for (let i = 0; i < points.length; i += CHUNK) {
    const chunk = points.slice(i, i + CHUNK);
    const url = `${baseUrl}?latitude=${chunk.map(p => p.lat).join(',')}`
      + `&longitude=${chunk.map(p => p.lon).join(',')}`
      + `&current=${variables.join(',')}${extra}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${baseUrl}: HTTP ${res.status} ${await res.text()}`);
    const body = await res.json();
    const list = Array.isArray(body) ? body : [body];
    for (const loc of list) out.push(loc.current ?? {});
  }
  if (out.length !== points.length) throw new Error(`${baseUrl}: expected ${points.length} points, got ${out.length}`);
  return out;
}

async function main() {
  const wind = await fetchCurrent(WIND_URL, ['wind_speed_10m', 'wind_direction_10m'], '&wind_speed_unit=ms');
  await sleep(PAUSE_BETWEEN_APIS_MS);
  const waves = await fetchCurrent(WAVE_URL, ['wave_height', 'wave_direction', 'wave_period', 'sea_surface_temperature']);

  const data = {
    source: 'Open-Meteo.com (CC BY 4.0)',
    sourceUrl: 'https://open-meteo.com/',
    /** model time of the values (UTC), e.g. "2026-10-21T07:30" */
    time: wind[0].time ?? null,
    fetchedAt: new Date().toISOString(),
    grid: { lat0: LAT0, lon0: LON0, step: STEP, nLat: N_LAT, nLon: N_LON },
    /** wind at 10 m: speed (m/s) and the direction it blows FROM (degrees, meteorological) */
    windSpeed: wind.map(w => round1(w.wind_speed_10m)),
    windDir: wind.map(w => round1(w.wind_direction_10m)),
    /** significant wave height (m), direction the waves come FROM (degrees), period (s); null over land */
    waveHeight: waves.map(w => round1(w.wave_height)),
    waveDir: waves.map(w => round1(w.wave_direction)),
    wavePeriod: waves.map(w => round1(w.wave_period)),
    /** sea surface temperature (°C); null over land and sea ice */
    sst: waves.map(w => round1(w.sea_surface_temperature))
  };
  await writeFile(OUT, JSON.stringify(data) + '\n');
  console.log(`current-weather: wrote ${points.length} points for ${data.time} UTC to ${OUT}`);
}

main().catch(err => {
  console.warn(`current-weather: fetch failed, keeping the previous file – ${err.message}`);
});
