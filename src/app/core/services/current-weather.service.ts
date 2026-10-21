import { Injectable, signal } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class CurrentWeatherService {
  readonly meta = signal<TimelineMeta | null>(null);
  readonly status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');

  // Packed 0.5° Uint8Array for all weekly frames (frameSize = 720 * 360 = 259,200 bytes)
  sstBin: Uint8Array | null = null;
  readonly FRAME_SIZE = 720 * 360;

  private u = new Float32Array(0);
  private v = new Float32Array(0);
  private wh = new Float32Array(0);
  private wp = new Float32Array(0);
  private wx = new Float32Array(0);
  private wy = new Float32Array(0);

  load() {
    if (this.status() !== 'idle') return;
    this.status.set('loading');

    Promise.all([
      fetch('assets/data/timeline-meta.json', { cache: 'no-cache' }).then(r => {
        if (!r.ok) throw new Error(`Meta HTTP ${r.status}`);
        return r.json() as Promise<TimelineMeta>;
      }),
      fetch('assets/data/timeline-sst.bin.gz', { cache: 'no-cache' }).then(async r => {
        if (!r.ok) throw new Error(`Binary HTTP ${r.status}`);
        const rawBuf = await r.arrayBuffer();
        const header = new Uint8Array(rawBuf, 0, 2);
        // If gzip magic bytes 0x1f 0x8b, decompress with DecompressionStream
        if (header[0] === 0x1f && header[1] === 0x8b) {
          if (typeof DecompressionStream !== 'undefined') {
            const stream = new Response(rawBuf).body!.pipeThrough(new DecompressionStream('gzip'));
            const decompressedBuf = await new Response(stream).arrayBuffer();
            return new Uint8Array(decompressedBuf);
          }
        }
        return new Uint8Array(rawBuf);
      })
    ])
      .then(([meta, bin]) => {
        this.sstBin = bin;
        this.prepareOpenMeteo(meta.openMeteo);
        this.meta.set(meta);
        this.status.set('ready');
      })
      .catch(err => {
        console.warn('Timeline data unavailable:', err);
        this.status.set('error');
      });
  }

  private prepareOpenMeteo(d?: OpenMeteoSnapshot) {
    if (!d || !d.grid) return;
    const n = d.grid.nLat * d.grid.nLon;
    this.u = new Float32Array(n);
    this.v = new Float32Array(n);
    this.wh = new Float32Array(n);
    this.wp = new Float32Array(n);
    this.wx = new Float32Array(n);
    this.wy = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const sp = d.windSpeed[i];
      const dir = d.windDir[i];
      this.u[i] = sp == null || dir == null ? 0 : -sp * Math.sin(dir * DEG);
      this.v[i] = sp == null || dir == null ? 0 : -sp * Math.cos(dir * DEG);

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
    const kfs = this.meta()?.keyframes;
    if (!kfs || kfs.length === 0 || !this.sstBin) return null;
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

    if (pair.kfA.now || pair.kfB.now) {
      if ((pair.kfA.now && pair.t < 0.4) || (pair.kfB.now && pair.t > 0.6) || (pair.kfA.now && pair.kfB.now)) {
        return `${dayMonthYear} · ${nowLabel}`;
      }
    }
    if (pair.kfB.forecast && pair.t > 0.5) {
      return `${dayMonthYear} · ${forecastLabel}`;
    }
    return dayMonthYear;
  }
}
