#!/usr/bin/env node
/**
 * Downloads ETOPO2v2c and writes src/assets/data/elevation.png — the height map the globe
 * feeds to `displacementMap`, so the continents stand off the sphere.
 *
 * ETOPO2v2c ships a raw little-endian int16 grid (10800 x 5400, 2 arc-minutes, no header,
 * row-major from 90N/180W), so reading it is a cast. The output is an 8-bit greyscale PNG
 * because `displacementMap` is a GPU texture — nothing ever reads these pixels on the CPU,
 * so the browser's own PNG decoder does the work.
 *
 * Heights are normalised against a FIXED ceiling (MAX_ELEV_M) rather than the grid's own
 * maximum, so the runtime can derive the displacement scale without reading any metadata.
 * Bathymetry is clamped to zero per sample before averaging: the ocean must not pull the
 * coast below the sphere, and clamping first leaves a gentle coastal ramp instead of a cliff.
 *
 * Source: NOAA NGDC ETOPO2v2 (public domain).
 * Terrain does not change, so like fetch:relief this is a one-off and is not in CI.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { deflateSync, crc32, inflateRawSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CACHE_DIR = resolve(__dirname, '.cache');
const CACHE_FILE = resolve(CACHE_DIR, 'ETOPO2v2c_i2_LSB.zip');
const OUT_FILE = resolve(ROOT, 'src/assets/data/elevation.png');

const SRC_URL =
  'https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2/ETOPO2v2-2006/ETOPO2v2c/raw_binary/ETOPO2v2c_i2_LSB.zip';

const SRC_W = 10800;
const SRC_H = 5400;

/** The land mesh is at most 1024 x 512, so twice that resolves every vertex. */
const OUT_W = 2048;
const OUT_H = 1024;

/**
 * Metres that map to white. Fixed on purpose — the globe multiplies by this constant to turn
 * a 0..1 texel into a displacement, so changing it here means changing MAX_ELEV_M there too.
 */
const MAX_ELEV_M = 9000;

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
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0 && i > zip.length - 66000; i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip: end of central directory not found');

  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);

  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error('zip: bad central directory entry');
    const method = zip.readUInt16LE(p + 10);
    const compSize = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const localOff = zip.readUInt32LE(p + 42);
    const name = zip.toString('latin1', p + 46, p + 46 + nameLen);

    if (matches(name)) {
      if (zip.readUInt32LE(localOff) !== 0x04034b50) throw new Error('zip: bad local header');
      const lNameLen = zip.readUInt16LE(localOff + 26);
      const lExtraLen = zip.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const raw = zip.subarray(start, start + compSize);
      console.log(`  entry ${name} (${method === 0 ? 'stored' : 'deflated'})`);
      if (method === 0) return raw;
      if (method === 8) return inflateRawSync(raw);
      throw new Error(`zip: unsupported compression method ${method}`);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error('zip: no matching entry');
}

/** Box filter over land height, bathymetry already flattened to sea level. */
function downsampleLand(src, dw, dh) {
  const out = Buffer.alloc(dw * dh);
  const fx = SRC_W / dw;
  const fy = SRC_H / dh;
  let peak = 0;

  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * fy);
    const y1 = Math.max(y0 + 1, Math.min(SRC_H, Math.floor((y + 1) * fy)));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * fx);
      const x1 = Math.max(x0 + 1, Math.min(SRC_W, Math.floor((x + 1) * fx)));
      let sum = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        const row = yy * SRC_W;
        for (let xx = x0; xx < x1; xx++) {
          const v = src.readInt16LE((row + xx) * 2);
          sum += v > 0 ? v : 0;
          n++;
        }
      }
      const m = sum / n;
      if (m > peak) peak = m;
      const t = m / MAX_ELEV_M;
      out[y * dw + x] = Math.round((t > 1 ? 1 : t) * 255);
    }
  }
  return { out, peak };
}

function chunk(type, body) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'latin1'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed) >>> 0, 0);
  return Buffer.concat([len, typed, crc]);
}

/** Minimal 8-bit greyscale PNG writer — no filtering, which deflate handles well enough here. */
function encodeGreyPng(data, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 0;  // colour type: greyscale
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const raw = Buffer.alloc(h * (w + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w + 1)] = 0; // filter: none
    data.copy(raw, y * (w + 1) + 1, y * w, (y + 1) * w);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

async function main() {
  const zip = await download();

  console.log('Extracting the elevation grid...');
  const grid = unzipEntry(zip, name => name.toLowerCase().endsWith('.bin'));
  const expected = SRC_W * SRC_H * 2;
  if (grid.length !== expected) {
    throw new Error(`expected ${expected} bytes of int16, got ${grid.length}`);
  }
  console.log(`  ${SRC_W} x ${SRC_H} int16 LSB`);

  console.log(`Downsampling to ${OUT_W} x ${OUT_H}...`);
  const { out, peak } = downsampleLand(grid, OUT_W, OUT_H);
  console.log(`  highest cell after averaging: ${Math.round(peak)} m of ${MAX_ELEV_M} m ceiling`);

  const png = encodeGreyPng(out, OUT_W, OUT_H);
  await writeFile(OUT_FILE, png);
  console.log(`Wrote ${OUT_FILE} (${(png.length / 1048576).toFixed(2)} MB)`);
}

main().catch(err => {
  console.error('fetch:elevation failed:', err.message);
  process.exit(1);
});
