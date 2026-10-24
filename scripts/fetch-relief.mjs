#!/usr/bin/env node
/**
 * Downloads the Natural Earth 50m shaded-relief raster and writes a packed greyscale
 * version of it to src/assets/data/relief.bin.gz — the mountain ranges and highlands
 * the globe paints over its land fill.
 *
 * Natural Earth ships it as an uncompressed 8-bit TIFF (10800 x 5400, one strip per row),
 * so no image library is needed: the strip offsets point straight at the rows. The output
 * is box-filtered down to OUT_W x OUT_H and gzipped, which is small because most of the
 * raster sits at the flat sea-level value.
 *
 * Source: Natural Earth (public domain), https://www.naturalearthdata.com/
 * The relief never changes, so this is a one-off — unlike fetch:weather it is not in CI.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { gzipSync, inflateRawSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CACHE_DIR = resolve(__dirname, '.cache');
const CACHE_FILE = resolve(CACHE_DIR, 'SR_50M.zip');
const OUT_FILE = resolve(ROOT, 'src/assets/data/relief.bin.gz');

const SRC_URL = 'https://naciscdn.org/naturalearth/50m/raster/SR_50M.zip';

/**
 * Output grid. The land canvas is 4096 x 2048 on anything with an 8k max texture size, so
 * matching it 1:1 keeps the relief crisp when the globe is zoomed in — upscaling it there was
 * visibly soft. ~1.6 MB gzipped; devices that fall back to a 2048 canvas just downscale it.
 */
const OUT_W = 4096;
const OUT_H = 2048;

/** `KMDR`, then u16 width, u16 height, u8 base, u8 version. */
const MAGIC = 0x4b4d4452;
const VERSION = 1;
const HEADER_BYTES = 10;

async function download() {
  try {
    const cached = await readFile(CACHE_FILE);
    console.log(`Using cached ${CACHE_FILE} (${(cached.length / 1048576).toFixed(1)} MB)`);
    return cached;
  } catch {}

  console.log(`Downloading ${SRC_URL} ...`);
  const res = await fetch(SRC_URL, { signal: AbortSignal.timeout(300000) });
  if (!res.ok) throw new Error(`Natural Earth: HTTP ${res.status}`);
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

/** Reads an uncompressed 8-bit greyscale TIFF into { width, height, data }. */
function readGreyTiff(buf) {
  const le = buf.toString('ascii', 0, 2) === 'II';
  const u16 = o => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = o => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  if (u16(2) !== 42) throw new Error('tiff: bad magic');

  const ifd = u32(4);
  const n = u16(ifd);
  const tags = {};
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    tags[u16(e)] = { type: u16(e + 2), count: u32(e + 4), value: u32(e + 8) };
  }

  const width = tags[256].value;
  const height = tags[257].value;
  if (tags[258].value !== 8) throw new Error(`tiff: expected 8 bits per sample, got ${tags[258].value}`);
  if (tags[259].value !== 1) throw new Error(`tiff: expected no compression, got ${tags[259].value}`);
  if (tags[277] && tags[277].value !== 1) throw new Error('tiff: expected a single sample per pixel');

  const strips = tags[273];
  const offsets = [];
  if (strips.count === 1) offsets.push(strips.value);
  else for (let i = 0; i < strips.count; i++) offsets.push(u32(strips.value + i * 4));

  const rowsPerStrip = tags[278] ? tags[278].value : height;
  const data = Buffer.alloc(width * height);
  for (let s = 0; s < offsets.length; s++) {
    const row0 = s * rowsPerStrip;
    const rows = Math.min(rowsPerStrip, height - row0);
    buf.copy(data, row0 * width, offsets[s], offsets[s] + rows * width);
  }
  return { width, height, data };
}

/** Box filter — the relief is smooth, so averaging keeps ranges without aliasing them. */
function downsample(src, sw, sh, dw, dh) {
  const out = Buffer.alloc(dw * dh);
  const fx = sw / dw;
  const fy = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * fy);
    const y1 = Math.max(y0 + 1, Math.min(sh, Math.floor((y + 1) * fy)));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * fx);
      const x1 = Math.max(x0 + 1, Math.min(sw, Math.floor((x + 1) * fx)));
      let sum = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        const row = yy * sw;
        for (let xx = x0; xx < x1; xx++) { sum += src[row + xx]; n++; }
      }
      out[y * dw + x] = Math.round(sum / n);
    }
  }
  return out;
}

/** The value the flat ocean and lowlands sit at — the runtime shades relative to it. */
function modeValue(data) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < data.length; i++) hist[data[i]]++;
  let best = 0;
  for (let v = 1; v < 256; v++) if (hist[v] > hist[best]) best = v;
  return best;
}

async function main() {
  const zip = await download();

  console.log('Extracting the relief raster...');
  const tif = unzipEntry(zip, name => name.toLowerCase().endsWith('.tif'));

  const { width, height, data } = readGreyTiff(tif);
  console.log(`  ${width} x ${height}, 8-bit greyscale`);

  console.log(`Downsampling to ${OUT_W} x ${OUT_H}...`);
  const small = downsample(data, width, height, OUT_W, OUT_H);
  const base = modeValue(small);
  console.log(`  flat/sea-level value: ${base}`);

  const header = Buffer.alloc(HEADER_BYTES);
  header.writeUInt32BE(MAGIC, 0);
  header.writeUInt16LE(OUT_W, 4);
  header.writeUInt16LE(OUT_H, 6);
  header.writeUInt8(base, 8);
  header.writeUInt8(VERSION, 9);

  const gz = gzipSync(Buffer.concat([header, small]), { level: 9 });
  await writeFile(OUT_FILE, gz);
  console.log(`Wrote ${OUT_FILE} (${(gz.length / 1048576).toFixed(2)} MB gzipped)`);
}

main().catch(err => {
  console.error('fetch:relief failed:', err.message);
  process.exit(1);
});
