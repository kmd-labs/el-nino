import { Injectable, computed, signal } from '@angular/core';

export interface TimelineKeyframeMeta {
  index: number;
  id: string;
  date: string;
  s: number;
  nino34: number;
  now?: boolean;
  forecast?: boolean;
}

export interface OpenMeteoSnapshot {
  source: string;
  sourceUrl: string;
  time: string | null;
  grid: { lat0: number; lon0: number; step: number; nLat: number; nLon: number };
  windSpeed: (number | null)[];
  windDir: (number | null)[];
  waveHeight: (number | null)[];
  waveDir: (number | null)[];
  wavePeriod: (number | null)[];
  /** Air temperature at 2 m in °C, same 10° grid. */
  airTemp?: (number | null)[];
}

export interface LiveConditions {
  airTemp: number | null;
  windSpeed: number | null;
  time: string | null;
  source: string;
}

export interface DailyWeather {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  start: string;
  end: string;
  airTemp: (number | null)[];
  windSpeed: (number | null)[];
}

export interface DailyConditions {
  airTemp: number | null;
  windSpeed: number | null;
}

export interface TimelineMeta {
  source: string;
  sourceUrl: string;
  sstSourceUrl: string;
  fetchedAt: string;
  grid: { step: number; nLat: number; nLon: number; lat0: number; lon0: number };
  totalFrames: number;
  binFile: string;
  keyframes: TimelineKeyframeMeta[];
  openMeteo?: OpenMeteoSnapshot;
  dailyWeather?: DailyWeather;
}

export interface KeyframePair {
  indexA: number;
  indexB: number;
  t: number;
  kfA: TimelineKeyframeMeta;
  kfB: TimelineKeyframeMeta;
}

export interface WindSample {
  u: number;
  v: number;
}

export interface WaveSample {
  h: number;
  period: number;
  dx: number;
  dy: number;
}

const DEG = Math.PI / 180;
const DAY_MS = 86_400_000;

@Injectable({ providedIn: 'root' })
export class CurrentWeatherService {
  readonly meta = signal<TimelineMeta | null>(null);
  readonly status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  /** Coarse loading progress (0–100) for the splash screen. */
  readonly progress = signal(0);

  /** Tropical mean of the live Open-Meteo snapshot, used by the dock readout. */
  readonly liveConditions = computed<LiveConditions | null>(() => {
    const m = this.meta()?.openMeteo;
    if (!m || this.status() !== 'ready') return null;
    const g = m.grid;
    let tSum = 0, tN = 0, wSum = 0, wN = 0;
    for (let r = 0; r < g.nLat; r++) {
      const lat = g.lat0 + r * g.step;
      if (Math.abs(lat) > 30) continue;
      for (let c = 0; c < g.nLon; c++) {
        const i = r * g.nLon + c;
        const at = this.at[i];
        if (Number.isFinite(at)) {
          tSum += at;
          tN++;
        }
        const u = this.u[i];
        const v = this.v[i];
        if (Number.isFinite(u) && Number.isFinite(v)) {
          wSum += Math.hypot(u, v);
          wN++;
        }
      }
    }
    return {
      airTemp: tN ? tSum / tN : null,
      windSpeed: wN ? wSum / wN : null,
      time: m.time,
      source: m.source
    };
  });

  // Packed 0.5° Uint8Array for all weekly frames (frameSize = 720 * 360 = 259,200 bytes)
  sstBin: Uint8Array | null = null;
  readonly FRAME_SIZE = 720 * 360;

  private u = new Float32Array(0);
  private v = new Float32Array(0);
  private at = new Float32Array(0);
  private wh = new Float32Array(0);
  private wp = new Float32Array(0);
  private wx = new Float32Array(0);
  private wy = new Float32Array(0);

  load() {
    if (this.status() !== 'idle') return;
    this.status.set('loading');
    this.progress.set(5);

    Promise.all([
      fetch('assets/data/timeline-meta.json', { cache: 'no-cache' }).then(r => {
        if (!r.ok) throw new Error(`Meta HTTP ${r.status}`);
        this.progress.update(p => Math.max(p, 25));
        return r.json() as Promise<TimelineMeta>;
      }),
      this.fetchSstBinary()
    ])
      .then(([meta, bin]) => {
        this.sstBin = bin;
        this.prepareOpenMeteo(meta.openMeteo);
        this.progress.set(95);
        this.meta.set(meta);
        this.status.set('ready');
        this.progress.set(100);
      })
      .catch(err => {
        console.warn('Timeline data unavailable:', err);
        this.status.set('error');
        this.progress.set(100);
      });
  }

  /** Streams the gzipped SST binary, updating progress from Content-Length when available. */
  private async fetchSstBinary(): Promise<Uint8Array> {
    const r = await fetch('assets/data/timeline-sst.bin.gz', { cache: 'no-cache' });
    if (!r.ok) throw new Error(`Binary HTTP ${r.status}`);

    const total = Number(r.headers.get('content-length') ?? 0);
    let rawBuf: ArrayBuffer;
    if (r.body && total > 0 && typeof r.body.getReader === 'function') {
      const reader = r.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
        this.progress.set(Math.min(85, 25 + Math.round((loaded / total) * 60)));
      }
      const merged = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      rawBuf = merged.buffer;
    } else {
      rawBuf = await r.arrayBuffer();
      this.progress.set(85);
    }

    const header = new Uint8Array(rawBuf, 0, 2);
    // If gzip magic bytes 0x1f 0x8b, decompress with DecompressionStream
    if (header[0] === 0x1f && header[1] === 0x8b && typeof DecompressionStream !== 'undefined') {
      const stream = new Response(rawBuf).body!.pipeThrough(new DecompressionStream('gzip'));
      const decompressedBuf = await new Response(stream).arrayBuffer();
      return new Uint8Array(decompressedBuf);
    }
    return new Uint8Array(rawBuf);
  }

  private prepareOpenMeteo(d?: OpenMeteoSnapshot) {
    if (!d || !d.grid) return;
    const n = d.grid.nLat * d.grid.nLon;
    this.u = new Float32Array(n);
    this.v = new Float32Array(n);
    this.at = new Float32Array(n).fill(NaN);
    this.wh = new Float32Array(n);
    this.wp = new Float32Array(n);
    this.wx = new Float32Array(n);
    this.wy = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const sp = d.windSpeed[i];
      const dir = d.windDir[i];
      this.u[i] = sp == null || dir == null ? 0 : -sp * Math.sin(dir * DEG);
      this.v[i] = sp == null || dir == null ? 0 : -sp * Math.cos(dir * DEG);
      this.at[i] = d.airTemp?.[i] ?? NaN;

      const h = d.waveHeight[i];
      const wd = d.waveDir[i];
      this.wh[i] = h == null || wd == null ? NaN : h;
      this.wp[i] = d.wavePeriod[i] ?? 8;
      this.wx[i] = wd == null ? 0 : -Math.sin(wd * DEG);
      this.wy[i] = wd == null ? 0 : -Math.cos(wd * DEG);
    }
  }

  private cell(lon: number, lat: number): [number, number, number, number, number, number] | null {
    const g = this.meta()?.openMeteo?.grid;
    if (!g) return null;
    const fy = (lat - g.lat0) / g.step;
    if (fy < 0 || fy > g.nLat - 1) return null;
    let fx = (((lon - g.lon0) % 360) + 360) % 360 / g.step;
    const x0 = Math.floor(fx) % g.nLon;
    const x1 = (x0 + 1) % g.nLon;
    fx -= Math.floor(fx);
    const y0 = Math.min(Math.floor(fy), g.nLat - 2);
    const ty = fy - y0;
    return [y0 * g.nLon + x0, y0 * g.nLon + x1, (y0 + 1) * g.nLon + x0, (y0 + 1) * g.nLon + x1, fx, ty];
  }

  getKeyframePair(s: number): KeyframePair | null {
    if (!this.sstBin) return null;
    return this.getKeyframePairMeta(s);
  }

  private getKeyframePairMeta(s: number): KeyframePair | null {
    const kfs = this.meta()?.keyframes;
    if (!kfs || kfs.length === 0) return null;
    if (kfs.length === 1) return { indexA: 0, indexB: 0, t: 0, kfA: kfs[0], kfB: kfs[0] };

    if (s <= kfs[0].s) {
      return { indexA: 0, indexB: 0, t: 0, kfA: kfs[0], kfB: kfs[0] };
    }
    const lastIdx = kfs.length - 1;
    if (s >= kfs[lastIdx].s) {
      return { indexA: lastIdx, indexB: lastIdx, t: 1, kfA: kfs[lastIdx], kfB: kfs[lastIdx] };
    }

    for (let i = 0; i < kfs.length - 1; i++) {
      const a = kfs[i];
      const b = kfs[i + 1];
      if (s >= a.s && s <= b.s) {
        const span = b.s - a.s;
        const t = span <= 0 ? 0 : Math.max(0, Math.min(1, (s - a.s) / span));
        return { indexA: a.index, indexB: b.index, t, kfA: a, kfB: b };
      }
    }

    return { indexA: lastIdx, indexB: lastIdx, t: 1, kfA: kfs[lastIdx], kfB: kfs[lastIdx] };
  }

  interpolatedDateMs(s: number): number | null {
    const pair = this.getKeyframePairMeta(s);
    if (!pair) return null;
    const a = Date.parse(`${pair.kfA.date}T12:00:00Z`);
    const b = Date.parse(`${pair.kfB.date}T12:00:00Z`);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return a + (b - a) * pair.t;
  }

  isForecast(s: number): boolean {
    const nowKf = this.meta()?.keyframes.find(k => k.now);
    const ms = this.interpolatedDateMs(s);
    if (!nowKf || ms == null) return false;
    return new Date(ms).toISOString().slice(0, 10) > nowKf.date;
  }

  dailyWeatherOn(s: number): DailyConditions | null {
    const d = this.meta()?.dailyWeather;
    if (!d?.airTemp?.length || !d?.windSpeed?.length) return null;

    const dateMs = this.interpolatedDateMs(s);
    if (dateMs == null) return null;

    const startMs = Date.parse(`${d.start}T12:00:00Z`);
    const endMs = Date.parse(`${d.end}T12:00:00Z`);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null;
    if (dateMs < startMs - DAY_MS || dateMs > endMs + 2 * DAY_MS) return null;

    const pos = (Math.min(Math.max(dateMs, startMs), endMs) - startMs) / DAY_MS;
    const i = Math.min(Math.floor(pos), d.airTemp.length - 1);
    const t = Math.max(0, Math.min(1, pos - i));
    return {
      airTemp: this.interpolateDaily(d.airTemp, i, t),
      windSpeed: this.interpolateDaily(d.windSpeed, i, t)
    };
  }

  private interpolateDaily(values: (number | null)[], i: number, t: number): number | null {
    const a = values[i] ?? null;
    const b = values[Math.min(i + 1, values.length - 1)] ?? null;
    if (a == null && b == null) return null;
    if (a == null) return b;
    if (b == null) return a;
    return a + (b - a) * t;
  }

  /**
   * Mean sea-surface temperature (°C) inside the Niño 3.4 box for timeline strength `s`.
   * Reads the observed 0.5° SST frames and interpolates between the two surrounding weeks.
   */
  nino34Sst(s: number): number | null {
    const pair = this.getKeyframePair(s);
    const bin = this.sstBin;
    const g = this.meta()?.grid;
    if (!pair || !bin || !g) return null;

    const offsetA = pair.indexA * this.FRAME_SIZE;
    const offsetB = pair.indexB * this.FRAME_SIZE;
    let sum = 0;
    let n = 0;

    for (let lat = -5; lat <= 5; lat += 1) {
      const r = Math.round((lat - g.lat0) / g.step);
      if (r < 0 || r >= g.nLat) continue;
      for (let lon = 190; lon <= 240; lon += 1) {
        const lon180 = lon > 180 ? lon - 360 : lon;
        const c = ((Math.round((lon180 - g.lon0) / g.step) % g.nLon) + g.nLon) % g.nLon;
        const i = r * g.nLon + c;
        const va = bin[offsetA + i];
        const vb = bin[offsetB + i];
        if (va === 255 || vb === 255) continue;
        sum += (va + (vb - va) * pair.t) * 0.2 - 5.0;
        n++;
      }
    }
    return n > 0 ? sum / n : null;
  }

  wind(lon: number, lat: number, s: number, out: WindSample): boolean {
    const c = this.cell(lon, lat);
    let u = -7.0;
    let v = 0;
    if (c && this.u.length > 0) {
      const [a, b, cc, d, tx, ty] = c;
      const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
      u = this.u[a] * w00 + this.u[b] * w10 + this.u[cc] * w01 + this.u[d] * w11;
      v = this.v[a] * w00 + this.v[b] * w10 + this.v[cc] * w01 + this.v[d] * w11;
    }
    // Baseline snapshot is at NOW (s ≈ 1.4).
    // As s transitions from La Niña (-1.8) to Super El Niño (+2.6):
    // 1. Easterly trade winds in the central/eastern equatorial Pacific weaken or collapse and reverse to westerlies (westerly wind bursts).
    // 2. Convergence shifts eastward, pulling surrounding winds towards the warming central Pacific.
    const ds = s - 1.4;
    const eqDist = Math.abs(lat);
    const eqGauss = Math.exp(-(lat * lat) / 72);

    // Trade wind response in central/eastern equatorial Pacific (-180° to -80°)
    if (eqDist <= 18) {
      const pacWeight = this.bellCurve(lon, -135, 60);
      // Under El Niño (ds > 0), strong eastward anomaly (+u) weakens the easterly trades
      // Under La Niña (ds < 0), westward anomaly (-u) intensifies the easterly trades
      u += ds * 4.8 * eqGauss * pacWeight;

      // Meridional convergence towards the equator
      const vConv = -Math.sign(lat) * Math.sin(eqDist * DEG * 3.5);
      v += ds * 1.5 * vConv * pacWeight;
    }

    // Western Pacific (-160° to 120°): Westerly wind bursts and monsoonal shifts
    if (eqDist <= 14 && (lon >= 130 || lon <= -160)) {
      const wpWeight = this.bellCurve(lon < 0 ? lon + 360 : lon, 160, 40);
      u += ds * 3.2 * eqGauss * wpWeight;
    }

    out.u = u;
    out.v = v;
    return true;
  }

  waves(lon: number, lat: number, s: number, out: WaveSample): boolean {
    const c = this.cell(lon, lat);
    let h = 2.0;
    let p = 8.0;
    let dx = 1;
    let dy = 0;
    if (c && this.wh.length > 0) {
      const [a, b, cc, d, tx, ty] = c;
      const idx = [a, b, cc, d];
      const wts = [(1 - tx) * (1 - ty), tx * (1 - ty), (1 - tx) * ty, tx * ty];
      let sw = 0, sumH = 0, sumP = 0, sumDx = 0, sumDy = 0;
      for (let k = 0; k < 4; k++) {
        const i = idx[k];
        if (Number.isNaN(this.wh[i])) continue;
        sw += wts[k];
        sumH += this.wh[i] * wts[k];
        sumP += this.wp[i] * wts[k];
        sumDx += this.wx[i] * wts[k];
        sumDy += this.wy[i] * wts[k];
      }
      if (sw >= 0.25) {
        h = sumH / sw;
        p = sumP / sw;
        dx = sumDx;
        dy = sumDy;
      }
    }

    // Equatorial Kelvin wave / ocean flow response to ENSO timeline:
    // El Niño pushes downwelling Kelvin waves eastward across the Pacific (dx -> +1, higher speed, longer period)
    // La Niña suppresses eastward water movement, promoting westward trade drift and upwelling
    const ds = s - 1.4;
    const eqDist = Math.abs(lat);
    const eqGauss = Math.exp(-(lat * lat) / 50);

    if (eqDist <= 15) {
      const pacWeight = this.bellCurve(lon, -130, 55);
      // Eastward flow component responds strongly to ENSO phase
      dx += ds * 1.6 * eqGauss * pacWeight;
      // Wave height and period expand during high-energy El Niño transitions
      h = Math.max(0.3, h + ds * 0.7 * eqGauss * pacWeight);
      p = Math.max(4.5, Math.min(18, p + ds * 1.8 * eqGauss * pacWeight));
    }

    const len = Math.hypot(dx, dy) || 1;
    out.h = h;
    out.period = p;
    out.dx = dx / len;
    out.dy = dy / len;
    return true;
  }

  private bellCurve(val: number, center: number, width: number): number {
    const diff = ((val - center + 540) % 360) - 180;
    return Math.exp(-((diff / width) ** 2));
  }

  /** Formatted date label for strength s, e.g. "15 Jan 2025" or "20 Oct 2026 · Now" */
  interpolatedDateLabel(s: number, locale: string, nowLabel = 'Now', forecastLabel = 'Forecast'): string {
    const pair = this.getKeyframePair(s);
    if (!pair) return '';
    const dateA = new Date(`${pair.kfA.date}T12:00:00Z`).getTime();
    const dateB = new Date(`${pair.kfB.date}T12:00:00Z`).getTime();
    const ms = dateA + (dateB - dateA) * pair.t;
    const d = new Date(ms);
    const dayMonthYear = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);

    const nowKf = this.meta()?.keyframes.find(k => k.now);
    if (nowKf && d.toISOString().slice(0, 10) === nowKf.date) {
      return `${dayMonthYear} · ${nowLabel}`;
    }
    if (pair.kfA.forecast || pair.kfB.forecast) {
      return `${dayMonthYear} · ${forecastLabel}`;
    }
    return dayMonthYear;
  }
}
