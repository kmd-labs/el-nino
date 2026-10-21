#!/usr/bin/env node
/**
 * Writes src/assets/data/current-weather.json for the "Current situation" view:
 *  - surface wind and ocean waves on a global 10° grid from Open-Meteo (https://open-meteo.com, CC BY 4.0)
 *  - sea surface temperature on a global 1° grid from the latest daily NOAA OISST v2.1 file
 *    (https://www.ncei.noaa.gov/products/optimum-interpolation-sst, public domain, ~1–2 days behind)
 *
 * Runs in CI before every Pages build (see .github/workflows/deploy.yml), so visitors read a
 * static file instead of calling the APIs. If a source fails, the previous values for that part
 * are kept and the script still exits 0, so a flaky API never breaks a deploy.
 *
 * Usage: node scripts/fetch-current-weather.mjs
 */
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import h5wasm from 'h5wasm/node';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets/data/current-weather.json');

// ---------- wind & waves: Open-Meteo, 13 latitudes (60°S–60°N) × 36 longitudes = 468 points ----------
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

// ---------- sea surface temperature: NOAA OISST v2.1 daily, 0.25° → averaged to 1° ----------
const OISST_DIR = 'https://www.ncei.noaa.gov/data/sea-surface-temperature-optimum-interpolation/v2.1/access/avhrr';
const SST_STEP = 1;
const SST_N_LAT = 180;
const SST_N_LON = 360;
// fill this many 1° cells outwards from the sea, so straits and small seas are not left blank
// next to the coast (land is drawn over the ocean on the globe anyway)
const SST_COAST_FILL = 3;

const sleep = ms => new Promise(res => setTimeout(res, ms));
const round1 = v => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null);

const points = [];
for (let r = 0; r < N_LAT; r++) {
  for (let c = 0; c < N_LON; c++) {
    points.push({ lat: LAT0 + r * STEP, lon: LON0 + c * STEP });
  }
}

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

async function fetchWindAndWaves() {
  const wind = await fetchCurrent(WIND_URL, ['wind_speed_10m', 'wind_direction_10m'], '&wind_speed_unit=ms');
  await sleep(PAUSE_BETWEEN_APIS_MS);
  const waves = await fetchCurrent(WAVE_URL, ['wave_height', 'wave_direction', 'wave_period']);
  return {
    source: 'Open-Meteo.com (CC BY 4.0)',
    sourceUrl: 'https://open-meteo.com/',
    /** model time of the values (UTC), e.g. "2026-10-21T07:30" */
    time: wind[0].time ?? null,
    grid: { lat0: LAT0, lon0: LON0, step: STEP, nLat: N_LAT, nLon: N_LON },
    /** wind at 10 m: speed (m/s) and the direction it blows FROM (degrees, meteorological) */
    windSpeed: wind.map(w => round1(w.wind_speed_10m)),
    windDir: wind.map(w => round1(w.wind_direction_10m)),
    /** significant wave height (m), direction the waves come FROM (degrees), period (s); null over land */
    waveHeight: waves.map(w => round1(w.wave_height)),
    waveDir: waves.map(w => round1(w.wave_direction)),
    wavePeriod: waves.map(w => round1(w.wave_period))
  };
}

/** Newest daily OISST file name (preliminary or final) in this month's or last month's folder. */
async function latestOisstFile() {
  const now = new Date();
  for (let back = 0; back < 2; back++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const ym = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const res = await fetch(`${OISST_DIR}/${ym}/`);
    if (!res.ok) continue;
    const names = [...new Set((await res.text()).match(/oisst-avhrr-v02r01\.\d{8}(_preliminary)?\.nc/g) ?? [])];
    // prefer the final file over the preliminary one for the same day
    names.sort((a, b) => a.slice(19, 27).localeCompare(b.slice(19, 27)) || b.length - a.length);
    if (names.length) return { url: `${OISST_DIR}/${ym}/${names[names.length - 1]}`, name: names[names.length - 1] };
  }
  throw new Error('no OISST file found');
}

async function fetchSst() {
  const { url, name } = await latestOisstFile();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OISST: HTTP ${res.status}`);
  const dir = await mkdtemp(join(tmpdir(), 'oisst-'));
  const file = join(dir, 'oisst.nc');
  try {
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    await h5wasm.ready;
    const f = new h5wasm.File(file, 'r');
    const ds = f.get('sst');
    const [, , nLat, nLon] = ds.shape;                 // [time, zlev, 720, 1440], lat from 89.875°S, lon from 0.125°E
    const raw = ds.value;
    const scale = Number(ds.attrs['scale_factor'].value[0]);
    const offset = Number(ds.attrs['add_offset'].value[0]);
    const fill = Number(ds.attrs['_FillValue'].value[0]);
    f.close();

    // average each 1° block (4 × 4 cells of 0.25°) over the valid ocean cells; re-centre longitudes on 180°W
    const k = Math.round(nLat / SST_N_LAT);
    const grid = new Float32Array(SST_N_LAT * SST_N_LON).fill(NaN);
    for (let r = 0; r < SST_N_LAT; r++) {
      for (let c = 0; c < SST_N_LON; c++) {
        const srcC = (c + SST_N_LON / 2) % SST_N_LON;   // output column c starts at 180°W
        let sum = 0, n = 0;
        for (let dr = 0; dr < k; dr++) {
          for (let dc = 0; dc < k; dc++) {
            const v = raw[(r * k + dr) * nLon + srcC * k + dc];
            if (v !== fill) { sum += v * scale + offset; n++; }
          }
        }
        if (n) grid[r * SST_N_LON + c] = sum / n;
      }
    }
    for (let pass = 0; pass < SST_COAST_FILL; pass++) fillFromNeighbours(grid);

    return {
      source: 'NOAA OISST v2.1',
      sourceUrl: 'https://www.ncei.noaa.gov/products/optimum-interpolation-sst',
      /** analysis day, e.g. "2026-10-19" */
      date: `${name.slice(19, 23)}-${name.slice(23, 25)}-${name.slice(25, 27)}`,
      preliminary: name.includes('_preliminary'),
      grid: { lat0: -89.5, lon0: -179.5, step: SST_STEP, nLat: SST_N_LAT, nLon: SST_N_LON },
      /** °C, rows from south to north, null where there is no ocean nearby */
      values: Array.from(grid, round1)
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** One dilation pass: empty cells next to the sea take the mean of their valid neighbours. */
function fillFromNeighbours(grid) {
  const src = grid.slice();
  for (let r = 0; r < SST_N_LAT; r++) {
    for (let c = 0; c < SST_N_LON; c++) {
      const i = r * SST_N_LON + c;
      if (!Number.isNaN(src[i])) continue;
      let sum = 0, n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        const rr = r + dr;
        if (rr < 0 || rr >= SST_N_LAT) continue;
        for (let dc = -1; dc <= 1; dc++) {
          const v = src[rr * SST_N_LON + (c + dc + SST_N_LON) % SST_N_LON];
          if (!Number.isNaN(v)) { sum += v; n++; }
        }
      }
      if (n) grid[i] = sum / n;
    }
  }
}

async function readPrevious() {
  try {
    return JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const prev = await readPrevious();
  let windWaves = null;
  let sst = null;
  try {
    windWaves = await fetchWindAndWaves();
  } catch (err) {
    console.warn(`current-weather: wind/waves failed, keeping the previous values – ${err.message}`);
  }
  try {
    sst = await fetchSst();
  } catch (err) {
    console.warn(`current-weather: SST failed, keeping the previous values – ${err.message}`);
  }
  if (!windWaves && !sst) return;

  const keep = prev ?? {};
  const data = {
    ...(windWaves ?? {
      source: keep.source, sourceUrl: keep.sourceUrl, time: keep.time, grid: keep.grid,
      windSpeed: keep.windSpeed, windDir: keep.windDir,
      waveHeight: keep.waveHeight, waveDir: keep.waveDir, wavePeriod: keep.wavePeriod
    }),
    fetchedAt: new Date().toISOString(),
    sst: sst ?? keep.sst ?? null
  };
  if (!data.windSpeed) return; // nothing usable yet
  await writeFile(OUT, JSON.stringify(data) + '\n');
  console.log(`current-weather: wind/waves ${data.time} UTC, SST ${data.sst?.date ?? 'n/a'} → ${OUT}`);
}

main().catch(err => {
  console.warn(`current-weather: failed, keeping the previous file – ${err.message}`);
});
