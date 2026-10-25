/**
 * Downloads ETOPO2v2c and writes src/assets/data/equator-profile.json — the terrain the
 * Walker cross-section stands on, sampled along the equator from 100°E to 70°W.
 *
 * ETOPO2v2c ships a raw little-endian int16 grid (10800 x 5400, 2 arc-minutes, no header,
 * metres), so reading it is a cast. The grid starts at 90°N, 180°W — note the longitude
 * origin is -180°, not 0°, which is a half-world shift away from the SST grids elsewhere
 * in this repo.
 *
 * The cross-section is drawn along the equator, so this takes the single grid row at 0°
 * rather than averaging a band: averaging flattens the features the profile is there to
 * show (the Galápagos platform reads -2459 m on the line and -1501 m over ±1°).
 *
 * The terrain never changes, so — like fetch-relief and fetch-elevation — this is NOT in
 * CI. Run it once; the committed JSON is the asset.
 *
 * Source: NOAA NGDC ETOPO2v2 (public domain).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CACHE_DIR = resolve(__dirname, '.cache');
const CACHE_FILE = resolve(CACHE_DIR, 'ETOPO2v2c_i2_LSB.zip');
const OUT_FILE = resolve(ROOT, 'src/assets/data/equator-profile.json');

const SRC_URL =
  'https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2/ETOPO2v2-2006/ETOPO2v2c/raw_binary/ETOPO2v2c_i2_LSB.zip';

const SRC_W = 10800;
const SRC_H = 5400;

/** Must match LON0/LON1 in walker-view.component.ts. */
const LON0 = 100;
const LON1 = 290;
/** ~11 km per sample: finer than a pixel at any width the cross-section is drawn at. */
const STEP = 0.1;

async function download() {
  try {
    const cached = await readFile(CACHE_FILE);
    console.log(`Using cached ${CACHE_FILE} (${(cached.length / 1048576).toFixed(1)} MB)`);
    return cached;
  } catch {}

  console.log(`Downloading ${SRC_URL} ...`);
  const res = await fetch(SRC_URL, { signal: AbortSignal.timeout(600000) });
  if (!res.ok) throw new Error(`ETOPO2v2c: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, buf);
  console.log(`  ${(buf.length / 1048576).toFixed(1)} MB cached`);
  return buf;
}

/** Pulls one entry out of a zip via its central directory (store and deflate only). */
function unzipEntry(zip, matches) {
  let p = zip.length - 22;
  while (p > 0 && zip.readUInt32LE(p) !== 0x06054b50) p--;
  if (p <= 0) throw new Error('zip: no end-of-central-directory record');

  let cd = zip.readUInt32LE(p + 16);
  const count = zip.readUInt16LE(p + 10);
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(cd) !== 0x02014b50) throw new Error('zip: bad central directory entry');
    const method = zip.readUInt16LE(cd + 10);
    const csize = zip.readUInt32LE(cd + 20);
    const nameLen = zip.readUInt16LE(cd + 28);
    const extraLen = zip.readUInt16LE(cd + 30);
    const cmtLen = zip.readUInt16LE(cd + 32);
    const off = zip.readUInt32LE(cd + 42);
    const name = zip.toString('latin1', cd + 46, cd + 46 + nameLen);
    if (matches(name)) {
      console.log(`  entry ${name} (${method === 0 ? 'stored' : 'deflated'})`);
      const lhNameLen = zip.readUInt16LE(off + 26);
      const lhExtraLen = zip.readUInt16LE(off + 28);
      const start = off + 30 + lhNameLen + lhExtraLen;
      const raw = zip.subarray(start, start + csize);
      return method === 8 ? inflateRawSync(raw) : Buffer.from(raw);
    }
    cd += 46 + nameLen + extraLen + cmtLen;
  }
  throw new Error('zip: no matching entry');
}

async function main() {
  const zip = await download();
  const bin = unzipEntry(zip, name => name.toLowerCase().endsWith('.bin'));
  const expected = SRC_W * SRC_H * 2;
  if (bin.length !== expected) throw new Error(`expected ${expected} bytes of int16, got ${bin.length}`);
  const grid = new Int16Array(bin.buffer, bin.byteOffset, SRC_W * SRC_H);
  console.log(`  ${SRC_W} x ${SRC_H} int16 LSB`);

  // Rows run 90°N downwards at 30 per degree, so the equator is the middle row.
  const row = Math.round((90 / 180) * SRC_H) * SRC_W;
  const sampleAt = lon => {
    const x = Math.round(((((lon + 180) % 360) + 360) % 360 / 360) * SRC_W) % SRC_W;
    return grid[row + x];
  };

  const elev = [];
  for (let lon = LON0; lon <= LON1 + 1e-9; lon += STEP) elev.push(sampleAt(lon));

  const out = {
    source: 'NOAA NGDC ETOPO2v2c',
    sourceUrl: SRC_URL,
    note: 'Elevation in metres along the equator (latitude 0), positive above sea level.',
    lat: 0,
    lon0: LON0,
    lon1: LON1,
    step: STEP,
    elev
  };
  await writeFile(OUT_FILE, JSON.stringify(out));

  const land = elev.filter(v => v > 0).length;
  const shelf = elev.filter(v => v <= 0 && v >= -300).length;
  console.log(`Wrote ${OUT_FILE}: ${elev.length} samples, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
  console.log(`  min ${Math.min(...elev)} m, max ${Math.max(...elev)} m`);
  console.log(`  ${land} above sea level, ${shelf} within the 300 m the panel shows`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
