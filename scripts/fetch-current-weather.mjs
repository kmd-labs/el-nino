#!/usr/bin/env node
/**
 * Fetches weekly NOAA OISST v2.1 sea surface temperature anomaly files from late 2024 to present,
 * extracts a detailed 0.5° grid (720 × 360 = 259,200 points per frame),
 * and writes:
 *   1. src/assets/data/timeline-meta.json (~6 KB metadata, dates & s-curve mapping)
 *   2. src/assets/data/timeline-sst.bin.gz (~1.7 MB gzipped Int8 binary for all ~100 weekly frames)
 *
 * Runs with concurrency and local disk caching so re-running only downloads new/missing files.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import h5wasm from 'h5wasm/node';

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT_META = resolve(DIR, '../src/assets/data/timeline-meta.json');
const OUT_BIN_GZ = resolve(DIR, '../src/assets/data/timeline-sst.bin.gz');
const CACHE_DIR = resolve(DIR, '.cache');

const OISST_DIR = 'https://www.ncei.noaa.gov/data/sea-surface-temperature-optimum-interpolation/v2.1/access/avhrr';

const N_LAT = 360; // 0.5° grid: -89.75 to +89.75
const N_LON = 720; // 0.5° grid: -179.75 to +179.75
const FRAME_POINTS = N_LAT * N_LON; // 259,200

// Open-Meteo 10° grid for surface wind & wave forecast
const OM_LAT0 = -60;
const OM_LON0 = -180;
const OM_STEP = 10;
const OM_N_LAT = 13;
const OM_N_LON = 36;
const OM_CHUNK = 120;
const OM_WIND_URL = 'https://api.open-meteo.com/v1/forecast';
const OM_WAVE_URL = 'https://marine-api.open-meteo.com/v1/marine';

const omPoints = [];
for (let r = 0; r < OM_N_LAT; r++) {
  for (let c = 0; c < OM_N_LON; c++) {
    omPoints.push({ lat: OM_LAT0 + r * OM_STEP, lon: OM_LON0 + c * OM_STEP });
  }
}

async function fetchOpenMeteoCurrent(baseUrl, variables, extra = '') {
  const out = [];
  for (let i = 0; i < omPoints.length; i += OM_CHUNK) {
    const chunk = omPoints.slice(i, i + OM_CHUNK);
    const url = `${baseUrl}?latitude=${chunk.map(p => p.lat).join(',')}`
      + `&longitude=${chunk.map(p => p.lon).join(',')}`
      + `&current=${variables.join(',')}${extra}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${baseUrl}: HTTP ${res.status}`);
    const body = await res.json();
    const list = Array.isArray(body) ? body : [body];
    for (const loc of list) out.push(loc.current ?? {});
  }
  return out;
}

async function fetchLiveWindAndWaves() {
  try {
    const wind = await fetchOpenMeteoCurrent(
      OM_WIND_URL,
      ['wind_speed_10m', 'wind_direction_10m', 'temperature_2m'],
      '&wind_speed_unit=ms'
    );
    await new Promise(r => setTimeout(r, 1200));
    const waves = await fetchOpenMeteoCurrent(OM_WAVE_URL, ['wave_height', 'wave_direction', 'wave_period']);
    return {
      source: 'Open-Meteo.com (CC BY 4.0)',
      sourceUrl: 'https://open-meteo.com/',
      time: wind[0]?.time ?? new Date().toISOString(),
      grid: { lat0: OM_LAT0, lon0: OM_LON0, step: OM_STEP, nLat: OM_N_LAT, nLon: OM_N_LON },
      windSpeed: wind.map(w => round1(w.wind_speed_10m)),
      windDir: wind.map(w => round1(w.wind_direction_10m)),
      airTemp: wind.map(w => round1(w.temperature_2m)),
      waveHeight: waves.map(w => round1(w.wave_height)),
      waveDir: waves.map(w => round1(w.wave_direction)),
      wavePeriod: waves.map(w => round1(w.wave_period))
    };
  } catch (err) {
    console.warn('Open-Meteo fetch failed, keeping previous values:', err.message);
    return null;
  }
}

// Generate weekly dates from Nov 6, 2024 to present
const START_DATE = new Date('2024-11-06T12:00:00Z');

function generateWeeklyDates() {
  const dates = [];
  const now = new Date();
  for (let d = new Date(START_DATE); d <= now; d.setUTCDate(d.getUTCDate() + 7)) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    dates.push({ ym: `${y}${m}`, ymd: `${y}${m}${day}`, iso: d.toISOString().slice(0, 10) });
  }
  return dates;
}

async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true });
}

async function fetchWithRetry(url, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === retries) return null;
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  return null;
}

async function getOisstNetcdf(item) {
  const cacheFile = resolve(CACHE_DIR, `oisst-${item.ymd}.nc`);
  try {
    return await readFile(cacheFile);
  } catch {}

  const url = `${OISST_DIR}/${item.ym}/oisst-avhrr-v02r01.${item.ymd}.nc`;
  let buf = await fetchWithRetry(url);
  if (!buf) {
    // Try preliminary filename if final is not yet available
    const prelimUrl = `${OISST_DIR}/${item.ym}/oisst-avhrr-v02r01.${item.ymd}_preliminary.nc`;
    buf = await fetchWithRetry(prelimUrl);
  }
  if (buf) {
    await writeFile(cacheFile, buf);
  }
  return buf;
}

function downsampleSst05(raw, scale, fill) {
  const k = 2; // 0.25° * 2 = 0.5°
  const grid = new Float32Array(FRAME_POINTS).fill(NaN);

  for (let r = 0; r < N_LAT; r++) {
    for (let c = 0; c < N_LON; c++) {
      const srcC = (c + N_LON / 2) % N_LON;
      let sum = 0, n = 0;
      for (let dr = 0; dr < k; dr++) {
        for (let dc = 0; dc < k; dc++) {
          const v = raw[(r * k + dr) * 1440 + srcC * k + dc];
          if (v !== fill) { sum += v * scale; n++; }
        }
      }
      if (n > 0) grid[r * N_LON + c] = sum / n;
    }
  }

  // Coastal dilation (2 passes): expand sea surface temperature into coastline pixels
  for (let pass = 0; pass < 2; pass++) {
    const src = grid.slice();
    for (let r = 0; r < N_LAT; r++) {
      for (let c = 0; c < N_LON; c++) {
        const i = r * N_LON + c;
        if (!Number.isNaN(src[i])) continue;
        let sum = 0, n = 0;
        for (let dr = -1; dr <= 1; dr++) {
          const rr = r + dr;
          if (rr < 0 || rr >= N_LAT) continue;
          for (let dc = -1; dc <= 1; dc++) {
            const v = src[rr * N_LON + (c + dc + N_LON) % N_LON];
            if (!Number.isNaN(v)) { sum += v; n++; }
          }
        }
        if (n > 0) grid[i] = sum / n;
      }
    }
  }

  // Quantize to Uint8Array: byte = (temp + 5.0) * 5 (0.2°C precision), 255 for land
  const out = new Uint8Array(FRAME_POINTS);
  for (let i = 0; i < FRAME_POINTS; i++) {
    const v = grid[i];
    if (Number.isNaN(v)) {
      out[i] = 255;
    } else {
      out[i] = Math.min(254, Math.max(0, Math.round((v + 5.0) * 5)));
    }
  }
  return out;
}

// Compute Niño 3.4 box anomaly mean (5°S–5°N, 170°W–120°W) in °C from anom dataset
// Preserve Open-Meteo nulls (e.g. wave data over land) instead of turning them into 0.
const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
const round2 = (v) => Math.round(v * 100) / 100;
const round3 = (v) => Math.round(v * 1000) / 1000;

function computeNino34FromRaw(rawAnom, scale, fill) {
  // rawAnom is 720 lat x 1440 lon at 0.25°:
  // lat from -89.875 to +89.875, lon from 0.125 to 359.875
  // Niño 3.4 box: -5 to +5 lat, 170°W to 120°W (190°E to 240°E)
  let sum = 0, n = 0;
  for (let r = 0; r < 720; r++) {
    const lat = -89.875 + r * 0.25;
    if (lat < -5 || lat > 5) continue;
    for (let c = 0; c < 1440; c++) {
      const lon = 0.125 + c * 0.25;
      if (lon < 190 || lon > 240) continue;
      const v = rawAnom[r * 1440 + c];
      if (v !== fill) {
        sum += v * scale;
        n++;
      }
    }
  }
  return n > 0 ? sum / n : 0;
}

function g(lon, c, w) {
  const d = ((lon - c + 540) % 360) - 180;
  return Math.exp(-((d / w) ** 2));
}

/**
 * Simulates global Sea Surface Temperature (SST) response during a Super El Niño (e.g. late 2026 forecast).
 * Accounts for tropical Pacific warming, coastal Kelvin wave impact off South America,
 * North Pacific "blob" / PNA wave train, Indian Ocean basin-wide & dipole warming,
 * Atlantic/Caribbean teleconnections, and Southern Ocean PSA pattern.
 */
function globalElNinoDelta(lon, lat) {
  // 1. Equatorial central & eastern Pacific warming (+1.8°C to +3.0°C)
  const pacEquator = 1.95 * g(lon, 235, 38) * Math.exp(-lat * lat / 80);

  // 2. Coastal South America (Niño 1+2 / Peru upwelling collapse) (+1.6°C)
  const coastalPeru = 1.6 * g(lon, 278, 16) * Math.exp(-((lat + 4) ** 2) / 75);

  // 3. Western Pacific Warm Pool relative cooling (-0.5°C) as water drains east
  const westPacCool = -0.55 * g(lon, 140, 20) * Math.exp(-((lat + 2) ** 2) / 90);

  // 4. Subtropical horseshoe cooling lobes (-0.4°C)
  const horseshoe = -0.42 * g(lon, 160, 26) * (Math.exp(-((lat - 24) ** 2) / 90) + Math.exp(-((lat + 24) ** 2) / 90));

  // 5. North Pacific PNA teleconnection: Northeast Pacific / Alaska warming (+0.8°C), central cooling (-0.5°C)
  const northeastPacWarm = 0.85 * g(lon, 215, 26) * Math.exp(-((lat - 48) ** 2) / 110);
  const caliBajaWarm = 0.65 * g(lon, 240, 18) * Math.exp(-((lat - 32) ** 2) / 100);
  const midPacCool = -0.50 * g(lon, 180, 24) * Math.exp(-((lat - 40) ** 2) / 90);

  // 6. Indian Ocean Dipole & basin warming (+0.6°C west, -0.6°C east, +0.35°C general)
  const iodWest = 0.65 * g(lon, 60, 16) * Math.exp(-lat * lat / 100);
  const iodEast = -0.65 * g(lon, 102, 12) * Math.exp(-((lat + 6) ** 2) / 50);
  const ioBasin = 0.35 * g(lon, 78, 28) * Math.exp(-((lat + 12) ** 2) / 200);

  // 7. Tropical Atlantic & Caribbean warming (+0.5°C) from trade wind reduction
  const caribbeanAtlantic = 0.52 * g(lon, 305, 30) * Math.exp(-((lat - 14) ** 2) / 110);

  // 8. South Pacific PSA pattern: Southeast Pacific warming (+0.6°C), SW Pacific cooling (-0.45°C)
  const sePacWarm = 0.60 * g(lon, 265, 30) * Math.exp(-((lat + 45) ** 2) / 120);
  const swPacCool = -0.45 * g(lon, 195, 22) * Math.exp(-((lat + 48) ** 2) / 110);

  // 9. Broad tropical baseline warming (+0.25°C)
  const tropicalBaseline = 0.25 * Math.exp(-lat * lat / 400);

  return pacEquator + coastalPeru + westPacCool + horseshoe
    + northeastPacWarm + caliBajaWarm + midPacCool
    + iodWest + iodEast + ioBasin
    + caribbeanAtlantic + sePacWarm + swPacCool + tropicalBaseline;
}

function synthesizeForecast(baselineGrid) {
  const out = new Uint8Array(FRAME_POINTS);
  for (let r = 0; r < N_LAT; r++) {
    const lat = -89.75 + r * 0.5;
    for (let c = 0; c < N_LON; c++) {
      const lon = -179.75 + c * 0.5;
      const lon360 = (lon + 360) % 360;
      const i = r * N_LON + c;
      const baseByte = baselineGrid[i];
      if (baseByte === 255) {
        out[i] = 255;
      } else {
        const baseTemp = baseByte * 0.2 - 5.0;
        const delta = globalElNinoDelta(lon360, lat);
        const forecastTemp = Math.min(34.0, Math.max(-2.0, baseTemp + delta));
        out[i] = Math.min(254, Math.max(0, Math.round((forecastTemp + 5.0) * 5)));
      }
    }
  }
  return out;
}

async function main() {
  await ensureCacheDir();

  // 1. Fetch live Open-Meteo wind and waves
  console.log('Fetching live wind and waves from Open-Meteo...');
  const liveOpenMeteo = await fetchLiveWindAndWaves();

  // 2. Load existing dataset if available
  let existingMeta = null;
  let existingBin = null;
  try {
    existingMeta = JSON.parse(await readFile(OUT_META, 'utf8'));
    const compressed = await readFile(OUT_BIN_GZ);
    existingBin = gunzipSync(compressed);
  } catch {}

  const weeklyDates = generateWeeklyDates();
  console.log(`Targeting ${weeklyDates.length} weekly dates up to present...`);

  let grids = [];
  let validDates = [];
  let nino34Values = [];

  // If existing binary matches grid shape, reuse existing observed frames
  if (existingMeta && existingBin && existingMeta.keyframes) {
    const existingObservedKfs = existingMeta.keyframes.filter(k => !k.forecast);
    const existingCount = existingObservedKfs.length;
    console.log(`Found existing dataset with ${existingCount} observed frames.`);

    for (let i = 0; i < existingCount; i++) {
      const slice = existingBin.subarray(i * FRAME_POINTS, (i + 1) * FRAME_POINTS);
      grids.push(new Uint8Array(slice));
      validDates.push({ iso: existingObservedKfs[i].date });
      nino34Values.push(existingObservedKfs[i].nino34);
    }
  }

  // Find missing weeks
  const existingIsoSet = new Set(validDates.map(d => d.iso));
  const missingWeeklyDates = weeklyDates.filter(w => !existingIsoSet.has(w.iso));

  if (missingWeeklyDates.length > 0) {
    console.log(`Fetching ${missingWeeklyDates.length} missing weekly dates from NOAA OISST...`);
    await h5wasm.ready;

    for (const item of missingWeeklyDates) {
      try {
        const buf = await getOisstNetcdf(item);
        if (!buf) continue;
        const tempName = resolve(CACHE_DIR, `temp-${process.pid}.nc`);
        await writeFile(tempName, buf);
        const f = new h5wasm.File(tempName, 'r');
        const dsSst = f.get('sst');
        const rawSst = dsSst.value;
        const scaleSst = Number(dsSst.attrs['scale_factor'].value[0]);
        const fillSst = Number(dsSst.attrs['_FillValue'].value[0]);

        const dsAnom = f.get('anom');
        const rawAnom = dsAnom.value;
        const scaleAnom = Number(dsAnom.attrs['scale_factor'].value[0]);
        const fillAnom = Number(dsAnom.attrs['_FillValue'].value[0]);
        const nino34 = round1(computeNino34FromRaw(rawAnom, scaleAnom, fillAnom));

        f.close();
        const grid = downsampleSst05(rawSst, scaleSst, fillSst);
        grids.push(grid);
        validDates.push(item);
        nino34Values.push(nino34);
      } catch (err) {
        console.warn(`Could not process ${item.iso}:`, err.message);
      }
    }
  } else {
    console.log('All weekly dates up to present are already cached!');
  }

  if (grids.length === 0) {
    console.warn('No grids available to write. Keeping existing files.');
    return;
  }

  // Keep frames in chronological order even if an earlier week was backfilled late.
  const order = validDates.map((_, i) => i).sort((a, b) => validDates[a].iso.localeCompare(validDates[b].iso));
  grids = order.map(i => grids[i]);
  validDates = order.map(i => validDates[i]);
  nino34Values = order.map(i => nino34Values[i]);

  console.log(`Synthesizing global forecast frame from latest observed frame (${validDates[validDates.length - 1].iso})...`);
  const lastObservedIdx = grids.length - 1;
  const forecastGrid = synthesizeForecast(grids[lastObservedIdx]);

  // Combined frames: all observed frames + 1 forecast frame
  const totalFrames = grids.length + 1;
  const combinedBin = new Uint8Array(totalFrames * FRAME_POINTS);
  for (let f = 0; f < grids.length; f++) {
    combinedBin.set(grids[f], f * FRAME_POINTS);
  }
  combinedBin.set(forecastGrid, grids.length * FRAME_POINTS);

  // Issue #30: the seasonal forecast horizon follows the latest observation
  // instead of a hard-coded date (8 weeks ahead ≈ the event peak).
  const forecastDateObj = new Date(`${validDates[lastObservedIdx].iso}T12:00:00Z`);
  forecastDateObj.setUTCDate(forecastDateObj.getUTCDate() + 56);
  const forecastDate = { iso: forecastDateObj.toISOString().slice(0, 10), forecast: true };
  const allDates = [...validDates, forecastDate];
  const allNino34 = [...nino34Values, round1(nino34Values[lastObservedIdx] + 1.1)];

  // Compress with gzip
  console.log(`Compressing ${totalFrames} frames (${(combinedBin.byteLength / 1024 / 1024).toFixed(1)} MB uncompressed)...`);
  const gzippedBin = gzipSync(combinedBin, { level: 9 });
  await writeFile(OUT_BIN_GZ, gzippedBin);
  console.log(`Wrote ${OUT_BIN_GZ}: ${(gzippedBin.byteLength / 1024 / 1024).toFixed(2)} MB (${(gzippedBin.byteLength / 1024).toFixed(0)} KB)`);

  // Build metadata manifest
  const keyframesMeta = allDates.map((item, idx) => {
    const isLast = idx === allDates.length - 1;
    const isNow = !isLast && idx === allDates.length - 2;
    const s = isLast ? 2.6 : -1.8 + (idx / Math.max(1, allDates.length - 2)) * (1.4 - -1.8);
    const nino34 = allNino34[idx];
    return {
      index: idx,
      id: item.forecast ? 'forecast' : isNow ? 'now' : `w${String(idx).padStart(3, '0')}`,
      date: item.iso,
      s: round3(s),
      nino34,
      now: isNow || undefined,
      forecast: item.forecast || undefined
    };
  });

  const meta = {
    source: 'Open-Meteo.com & NOAA OISST v2.1',
    sourceUrl: 'https://open-meteo.com/',
    sstSourceUrl: 'https://www.ncei.noaa.gov/products/optimum-interpolation-sst',
    fetchedAt: new Date().toISOString(),
    grid: { step: 0.5, nLat: N_LAT, nLon: N_LON, lat0: -89.75, lon0: -179.75 },
    totalFrames,
    binFile: 'assets/data/timeline-sst.bin.gz',
    keyframes: keyframesMeta,
    openMeteo: liveOpenMeteo || existingMeta?.openMeteo || undefined
  };

  await writeFile(OUT_META, JSON.stringify(meta, null, 2) + '\n');
  console.log(`Wrote ${OUT_META}`);
}

main().catch(err => {
  console.warn('fetch-current-weather encountered an error, preserving committed data:', err);
  process.exit(0);
});
