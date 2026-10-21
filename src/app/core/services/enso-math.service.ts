import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { EnsoPhase, ImpactKind, PhaseInfo } from '../models/enso.model';
import {
  ANOM_COLOR_TOKENS,
  LIVE_SST_COLOR_TOKENS,
  KEY,
  KIND_COLOR_TOKENS,
  PHASE_COLOR_TOKENS,
  TEMP_COLOR_TOKENS
} from '../constants/enso-data';
import { ThemeService } from '@kmd/design-system/services/theme.service';

export interface ColorLut {
  lut: Uint8Array;
  lo: number;
  hi: number;
}

@Injectable({
  providedIn: 'root'
})
export class EnsoMathService {
  private themeService = inject(ThemeService);

  readonly R = 5;
  readonly DEG = Math.PI / 180;

  lutSst!: ColorLut;
  lutAnom!: ColorLut;
  /** Live view: blue → yellow → red water-temperature scale (see getLiveThermalStops). */
  lutSstLive!: ColorLut;

  constructor() {
    this.refreshLutsFromTokens();
  }

  /** Rebuilds the thermal and anomaly LUTs directly from `:root` SCSS design token CSS variables. */
  refreshLutsFromTokens() {
    this.lutSst = this.buildLUT(this.getThermalStops());
    this.lutAnom = this.buildLUT(this.getAnomalyStops());
    this.lutSstLive = this.buildLUT(this.getLiveThermalStops());
  }

  /** Returns thermal (SST) stops `[temp, hexColor][]` derived from SCSS design tokens. */
  getThermalStops(): [number, string][] {
    return TEMP_COLOR_TOKENS.map(([val, token]) => [
      val,
      this.themeService.getTokenColor(token, '#1f86cf')
    ]);
  }

  /**
   * Colours for measured water temperature (live view): blue → yellow → red, roughly linear in °C
   * (see LIVE_SST_COLOR_TOKENS). The model scale packs most colours into 20–31 °C, which would
   * turn the whole real tropics one red.
   */
  getLiveThermalStops(): [number, string][] {
    return LIVE_SST_COLOR_TOKENS.map(([val, token]) => [val, this.themeService.getTokenColor(token, '#93c5fd')]);
  }

  /** Returns anomaly stops `[anom, hexColor][]` derived from SCSS design tokens. */
  getAnomalyStops(): [number, string][] {
    return ANOM_COLOR_TOKENS.map(([val, token]) => [
      val,
      this.themeService.getTokenColor(token, '#eef1f6')
    ]);
  }

  /** Resolves phase color from SCSS design token (`--color-phase-*`). */
  getPhaseColor(phase: EnsoPhase): string {
    return this.themeService.getTokenColor(PHASE_COLOR_TOKENS[phase], '#6f7d98');
  }

  /** Resolves impact kind color from SCSS design token (`--color-kind-*`). */
  getKindColor(kind: ImpactKind): string {
    return this.themeService.getTokenColor(KIND_COLOR_TOKENS[kind], '#ff9a3d');
  }

  /** Resolves impact kind color as integer hex for Three.js materials. */
  getKindHexNumber(kind: ImpactKind): number {
    const hex = this.getKindColor(kind).replace('#', '');
    return parseInt(hex, 16) || 0xff9a3d;
  }

  clamp(v: number, a: number, b: number): number {
    return Math.max(a, Math.min(b, v));
  }

  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  sstep(a: number, b: number, x: number): number {
    const t = this.clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  g(lon: number, c: number, w: number): number {
    const d = ((lon - c + 540) % 360) - 180;
    return Math.exp(-((d / w) ** 2));
  }

  clim(lon: number, lat: number): number {
    const c = Math.cos(lat * this.DEG);
    let t = -1.8 + 30.5 * Math.pow(c, 2.2);
    t += 1.2 * this.g(lon, 150, 35) * Math.exp(-lat * lat / 250);
    t -= 3.2 * this.g(lon, 262, 32) * Math.exp(-((lat + 2) ** 2) / 40);
    t -= 2.0 * this.g(lon, 283, 7) * Math.exp(-((lat + 14) ** 2) / 140);
    t -= 1.5 * this.g(lon, 350, 16) * Math.exp(-lat * lat / 60);
    t += 0.8 * this.g(lon, 80, 25) * Math.exp(-lat * lat / 200);
    t += 1.5 * this.g(lon, 295, 20) * Math.exp(-((lat - 38) ** 2) / 60);
    return Math.max(-1.8, t);
  }

  horse(lon: number, lat: number): number {
    return this.g(lon, 155, 24) * (Math.exp(-((lat - 22) ** 2) / 80) + Math.exp(-((lat + 22) ** 2) / 80));
  }

  /**
   * Indian Ocean Dipole pattern in its positive phase: a warm western pole and a cool eastern pole
   * off Sumatra. Positive events often come with El Niño, negative ones (weaker) with La Niña.
   */
  iod(lon: number, lat: number): number {
    return 0.55 * this.g(lon, 62, 14) * Math.exp(-lat * lat / 90)
      - 0.8 * this.g(lon, 100, 11) * Math.exp(-((lat + 5) ** 2) / 45);
  }

  basisP(lon: number, lat: number): number {
    return 1.3 * this.g(lon, 228, 37.5) * Math.exp(-lat * lat / 110)
      - 0.35 * this.horse(lon, lat)
      - 0.2 * this.g(lon, 135, 15) * Math.exp(-lat * lat / 80)
      + 0.22 * this.g(lon, 75, 25) * Math.exp(-lat * lat / 250)
      + 0.5 * this.iod(lon, lat);
  }

  basisC(lon: number, lat: number): number {
    return 1.2 * this.g(lon, 278, 16) * Math.exp(-((lat + 4) ** 2) / 90);
  }

  basisN(lon: number, lat: number): number {
    return -1.15 * this.g(lon, 212, 40.8) * Math.exp(-lat * lat / 110)
      + 0.3 * this.horse(lon, lat)
      + 0.2 * this.g(lon, 135, 15) * Math.exp(-lat * lat / 80)
      - 0.25 * this.iod(lon, lat);
  }

  anom(lon: number, lat: number, s: number): number {
    return s >= 0
      ? s * this.basisP(lon, lat) + Math.max(0, s - 1.4) * this.basisC(lon, lat)
      : -s * this.basisN(lon, lat);
  }

  /** Mean anomaly over a lon/lat box (degrees east, 2.5° grid). */
  private boxMean(lon0: number, lon1: number, lat0: number, lat1: number, s: number): number {
    let sum = 0;
    let n = 0;
    for (let lon = lon0; lon <= lon1; lon += 2.5) {
      for (let lat = lat0; lat <= lat1; lat += 2.5) {
        sum += this.anom(lon, lat, s);
        n++;
      }
    }
    return sum / n;
  }

  /** Dipole Mode Index: western pole (50–70°E, 10°S–10°N) minus eastern pole (90–110°E, 10°S–0°). */
  dmi(s: number): number {
    return this.boxMean(50, 70, -10, 10, s) - this.boxMean(90, 110, -10, 0, s);
  }

  nino34(s: number): number {
    let sum = 0;
    let n = 0;
    for (let lon = 190; lon <= 240; lon += 2.5) {
      for (let lat = -5; lat <= 5; lat += 2.5) {
        sum += this.anom(lon, lat, s);
        n++;
      }
    }
    return sum / n;
  }

  trade(s: number): number {
    return this.clamp(1 - 0.5 * s, -0.6, 1.8);
  }

  convLon(s: number): number {
    return 120 + (this.clamp(s >= 0 ? -6.5 + 3.6 * s : -6.5 + 0.6 * s, -8, 4) + 10) * 8;
  }

  category(n: number): PhaseInfo {
    if (n >= 2) return { k: 'super', name: 'Super El Niño', col: this.getPhaseColor('super') };
    if (n >= 0.5) return { k: 'nino', name: 'El Niño', col: this.getPhaseColor('nino') };
    if (n <= -0.5) return { k: 'nina', name: 'La Niña', col: this.getPhaseColor('nina') };
    return { k: 'neu', name: 'Neutral', col: this.getPhaseColor('neu') };
  }

  buildLUT(st: [number, string][]): ColorLut {
    const lo = st[0][0];
    const hi = st[st.length - 1][0];
    const lut = new Uint8Array(256 * 3);
    const parseColor = (c: string): [number, number, number] => {
      const th = new THREE.Color(c);
      return [Math.round(th.r * 255), Math.round(th.g * 255), Math.round(th.b * 255)];
    };

    for (let i = 0; i < 256; i++) {
      const v = lo + (hi - lo) * i / 255;
      let k = 1;
      while (k < st.length - 1 && v > st[k][0]) k++;
      const a = st[k - 1];
      const b = st[k];
      const t = this.clamp((v - a[0]) / (b[0] - a[0]), 0, 1);
      const ca = parseColor(a[1]);
      const cb = parseColor(b[1]);
      for (let j = 0; j < 3; j++) {
        lut[i * 3 + j] = Math.round(ca[j] + (cb[j] - ca[j]) * t);
      }
    }
    return { lut, lo, hi };
  }

  thermo(u: number, s: number): number {
    return -1.75 + 0.85 * this.trade(s) * u;
  }

  secTemp(lon: number, y: number, s: number): number {
    const ts = this.clim(lon, 0) + this.anom(lon, 0, s);
    const u = (lon - 200) / 80;
    const d = this.thermo(u, s);
    const mix = this.sstep(d + 0.35, d - 0.35, y);
    const below = 14 - 8 * this.clamp((d - y) / (4 + d), 0, 1);
    return this.lerp(ts - 0.4 * this.clamp(-y, 0, 2), below, mix);
  }

  cycleS(m: number): number {
    m = ((m % 48) + 48) % 48;
    for (let i = 1; i < KEY.length; i++) {
      if (m <= KEY[i][0]) {
        const a = KEY[i - 1];
        const b = KEY[i];
        const t = (m - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * (1 - Math.cos(Math.PI * t)) / 2;
      }
    }
    return KEY[0][1];
  }

  /**
   * Find the month index m in [12, 35] (the rising La Niña -> Super El Niño branch)
   * whose cycleS(m) matches the given strength s, so pressing Play starts at the
   * current playhead position and moves forward (to the right).
   */
  cycleTFromStrength(s: number): number {
    const minS = KEY[2][1]; // -1.4 at month 12
    const maxS = KEY[7][1]; //  2.7 at month 35
    if (s >= maxS - 0.05) return 35;
    if (s <= minS + 0.05) return 12;
    let lo = 12;
    let hi = 35;
    for (let iter = 0; iter < 24; iter++) {
      const mid = (lo + hi) / 2;
      if (this.cycleS(mid) < s) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return (lo + hi) / 2;
  }

  pos(lon: number, lat: number, r: number = this.R, out = new THREE.Vector3()): THREE.Vector3 {
    const phi = (lon + 180) / 360 * Math.PI * 2;
    const th = (90 - lat) * this.DEG;
    return out.set(
      -r * Math.cos(phi) * Math.sin(th),
      r * Math.cos(th),
      r * Math.sin(phi) * Math.sin(th)
    );
  }
}
