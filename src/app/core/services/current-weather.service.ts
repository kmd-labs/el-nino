import { Injectable, signal } from '@angular/core';

/** Snapshot written by scripts/fetch-current-weather.mjs (Open-Meteo, global 10° grid). */
export interface CurrentWeatherData {
  source: string;
  sourceUrl: string;
  time: string | null;
  fetchedAt: string;
  grid: { lat0: number; lon0: number; step: number; nLat: number; nLon: number };
  windSpeed: (number | null)[];
  windDir: (number | null)[];
  waveHeight: (number | null)[];
  waveDir: (number | null)[];
  wavePeriod: (number | null)[];
  /** sea surface temperature (°C); null over land and sea ice. Missing in snapshots older than this field. */
  sst?: (number | null)[];
}

/** Wind vector in m/s (+u east, +v north). */
export interface WindSample {
  u: number;
  v: number;
}

/** Waves: significant height (m), period (s) and the unit vector they travel towards (+x east, +y north). */
export interface WaveSample {
  h: number;
  period: number;
  dx: number;
  dy: number;
}

const DEG = Math.PI / 180;

/**
 * Current surface wind and ocean waves for the "Current situation" view.
 * Loads the snapshot once, on first use, and interpolates it bilinearly at any point.
 */
@Injectable({ providedIn: 'root' })
export class CurrentWeatherService {
  readonly data = signal<CurrentWeatherData | null>(null);
  readonly status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');

  // per grid node, precomputed: wind u/v, wave height/period and propagation unit vector (NaN where missing)
  private u = new Float32Array(0);
  private v = new Float32Array(0);
  private wh = new Float32Array(0);
  private wp = new Float32Array(0);
  private wx = new Float32Array(0);
  private wy = new Float32Array(0);
  private sstT = new Float32Array(0);

  load() {
    if (this.status() !== 'idle') return;
    this.status.set('loading');
    fetch('assets/data/current-weather.json', { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CurrentWeatherData>;
      })
      .then(d => {
        this.prepare(d);
        this.data.set(d);
        this.status.set('ready');
      })
      .catch(err => {
        console.warn('Current weather data unavailable:', err);
        this.status.set('error');
      });
  }

  private prepare(d: CurrentWeatherData) {
    const n = d.grid.nLat * d.grid.nLon;
    this.u = new Float32Array(n);
    this.v = new Float32Array(n);
    this.wh = new Float32Array(n);
    this.wp = new Float32Array(n);
    this.wx = new Float32Array(n);
    this.wy = new Float32Array(n);
    this.sstT = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = d.sst?.[i];
      this.sstT[i] = t == null ? NaN : t;

      const sp = d.windSpeed[i];
      const dir = d.windDir[i];
      // meteorological direction = where the wind blows FROM
      this.u[i] = sp == null || dir == null ? 0 : -sp * Math.sin(dir * DEG);
      this.v[i] = sp == null || dir == null ? 0 : -sp * Math.cos(dir * DEG);

      const h = d.waveHeight[i];
      const wd = d.waveDir[i];
      this.wh[i] = h == null || wd == null ? NaN : h;
      this.wp[i] = d.wavePeriod[i] ?? 8;
      // waves travel opposite to the direction they come from
      this.wx[i] = wd == null ? 0 : -Math.sin(wd * DEG);
      this.wy[i] = wd == null ? 0 : -Math.cos(wd * DEG);
    }
  }

  /** Grid cell and weights for (lon, lat); null outside the covered latitudes. */
  private cell(lon: number, lat: number): [number, number, number, number, number, number] | null {
    const g = this.data()?.grid;
    if (!g) return null;
    const fy = (lat - g.lat0) / g.step;
    if (fy < 0 || fy > g.nLat - 1) return null;
    let fx = (((lon - g.lon0) % 360) + 360) % 360 / g.step;
    const x0 = Math.floor(fx) % g.nLon;
    const x1 = (x0 + 1) % g.nLon; // wraps across the date line
    fx -= Math.floor(fx);
    const y0 = Math.min(Math.floor(fy), g.nLat - 2);
    const ty = fy - y0;
    return [y0 * g.nLon + x0, y0 * g.nLon + x1, (y0 + 1) * g.nLon + x0, (y0 + 1) * g.nLon + x1, fx, ty];
  }

  wind(lon: number, lat: number, out: WindSample): boolean {
    const c = this.cell(lon, lat);
    if (!c) return false;
    const [a, b, cc, d, tx, ty] = c;
    const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
    out.u = this.u[a] * w00 + this.u[b] * w10 + this.u[cc] * w01 + this.u[d] * w11;
    out.v = this.v[a] * w00 + this.v[b] * w10 + this.v[cc] * w01 + this.v[d] * w11;
    return true;
  }

  /** true when the snapshot carries sea surface temperature */
  hasSst(): boolean {
    return !!this.data()?.sst;
  }

  /** Sea surface temperature (°C) from the ocean nodes of the surrounding cell; NaN where there is no data. */
  sst(lon: number, lat: number): number {
    const c = this.cell(lon, lat);
    if (!c) return NaN;
    const [a, b, cc, d, tx, ty] = c;
    const idx = [a, b, cc, d];
    const wts = [(1 - tx) * (1 - ty), tx * (1 - ty), (1 - tx) * ty, tx * ty];
    let sw = 0, sum = 0;
    for (let k = 0; k < 4; k++) {
      const v = this.sstT[idx[k]];
      if (Number.isNaN(v)) continue;
      sw += wts[k];
      sum += v * wts[k];
    }
    return sw < 0.15 ? NaN : sum / sw;
  }

  /** Waves at a point, from the ocean nodes of the surrounding cell; false over land / sea ice. */
  waves(lon: number, lat: number, out: WaveSample): boolean {
    const c = this.cell(lon, lat);
    if (!c) return false;
    const [a, b, cc, d, tx, ty] = c;
    const idx = [a, b, cc, d];
    const wts = [(1 - tx) * (1 - ty), tx * (1 - ty), (1 - tx) * ty, tx * ty];
    let sw = 0, h = 0, p = 0, dx = 0, dy = 0;
    for (let k = 0; k < 4; k++) {
      const i = idx[k];
      if (Number.isNaN(this.wh[i])) continue;
      sw += wts[k];
      h += this.wh[i] * wts[k];
      p += this.wp[i] * wts[k];
      dx += this.wx[i] * wts[k];
      dy += this.wy[i] * wts[k];
    }
    if (sw < 0.25) return false;
    const len = Math.hypot(dx, dy) || 1;
    out.h = h / sw;
    out.period = p / sw;
    out.dx = dx / len;
    out.dy = dy / len;
    return true;
  }
}
