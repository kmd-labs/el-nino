import * as THREE from 'three';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { CurrentWeatherService, WaveSample, WindSample } from '../../core/services/current-weather.service';

/**
 * Real surface wind streaks and ocean wave crests interpolated across
 * temperature keyframes (from La Niña cold peak through current situation to Super El Niño forecast).
 */
export class CurrentWeatherLayer {
  readonly group = new THREE.Group();

  private readonly NW: number;
  private readonly TRAIL: number;
  private readonly MAX_LAT = 58;
  private wLon: Float32Array;
  private wLat: Float32Array;
  private wAge: Float32Array;
  private wLife: Float32Array;
  private wHist: Float32Array;
  private wPos: Float32Array;
  private wCol: Float32Array;
  private wGeo = new THREE.BufferGeometry();

  private readonly NV: number;
  private readonly V_TRAIL: number;
  private vLon: Float32Array;
  private vLat: Float32Array;
  private vAge: Float32Array;
  private vLife: Float32Array;
  private vHist: Float32Array;
  private vPos: Float32Array;
  private vCol: Float32Array;
  private vGeo = new THREE.BufferGeometry();

  private readonly wind: WindSample = { u: 0, v: 0 };
  private readonly wave: WaveSample = { h: 0, period: 8, dx: 1, dy: 0 };
  private readonly p = new THREE.Vector3();
  private readonly cWaveCur = new THREE.Color();
  private seeded = false;
  private lastS = 1.4;

  constructor(
    private math: EnsoMathService,
    private weather: CurrentWeatherService,
    private isLand: (lon: number, lat: number) => boolean,
    private cWind: THREE.Color,
    private cStrong: THREE.Color,
    private cWaveWarm: THREE.Color,
    private cWaveCold: THREE.Color
  ) {
    // Unified visual density across desktop and mobile per user request
    this.NW = 450;
    this.TRAIL = 260;
    this.NV = 650;
    this.V_TRAIL = 350;

    this.wLon = new Float32Array(this.NW);
    this.wLat = new Float32Array(this.NW);
    this.wAge = new Float32Array(this.NW);
    this.wLife = new Float32Array(this.NW);
    this.wHist = new Float32Array(this.NW * this.TRAIL * 3);

    this.vLon = new Float32Array(this.NV);
    this.vLat = new Float32Array(this.NV);
    this.vAge = new Float32Array(this.NV);
    this.vLife = new Float32Array(this.NV);
    this.vHist = new Float32Array(this.NV * this.V_TRAIL * 3);

    const mat = () => new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const wSeg = this.NW * (this.TRAIL - 1) * 2;
    this.wPos = new Float32Array(wSeg * 3);
    this.wCol = new Float32Array(wSeg * 4);
    this.wGeo.setAttribute('position', new THREE.BufferAttribute(this.wPos, 3));
    this.wGeo.setAttribute('color', new THREE.BufferAttribute(this.wCol, 4));

    // Streamlines showcasing water flow direction: (V_TRAIL - 1) line segments per line
    const vSeg = this.NV * (this.V_TRAIL - 1) * 2;
    this.vPos = new Float32Array(vSeg * 3);
    this.vCol = new Float32Array(vSeg * 4);
    this.vGeo.setAttribute('position', new THREE.BufferAttribute(this.vPos, 3));
    this.vGeo.setAttribute('color', new THREE.BufferAttribute(this.vCol, 4));

    this.group.add(new THREE.LineSegments(this.vGeo, mat()));
    this.group.add(new THREE.LineSegments(this.wGeo, mat()));
    this.group.visible = false;
  }

  private randomPoint(): [number, number] {
    const s = Math.sin(this.MAX_LAT * this.math.DEG);
    return [Math.random() * 360 - 180, Math.asin((Math.random() * 2 - 1) * s) / this.math.DEG];
  }

  private spawnWind(i: number) {
    const [lon, lat] = this.randomPoint();
    this.wLon[i] = lon;
    this.wLat[i] = lat;
    this.wAge[i] = 0;
    this.wLife[i] = 14.0 + Math.random() * 14.0;
    this.math.pos(lon, lat, this.math.R * 1.013, this.p);
    const o = i * this.TRAIL * 3;
    for (let k = 0; k < this.TRAIL; k++) {
      this.wHist[o + k * 3] = this.p.x;
      this.wHist[o + k * 3 + 1] = this.p.y;
      this.wHist[o + k * 3 + 2] = this.p.z;
    }
  }

  private spawnWave(i: number, s: number) {
    for (let tries = 0; tries < 8; tries++) {
      const [lon, lat] = this.randomPoint();
      if (!this.isLand(lon, lat) && this.weather.waves(lon, lat, s, this.wave)) {
        this.vLon[i] = lon;
        this.vLat[i] = lat;
        break;
      }
    }
    this.vAge[i] = 0;
    this.vLife[i] = 16.0 + Math.random() * 16.0;
    this.math.pos(this.vLon[i], this.vLat[i], this.math.R * 1.011, this.p);
    const o = i * this.V_TRAIL * 3;
    for (let k = 0; k < this.V_TRAIL; k++) {
      this.vHist[o + k * 3] = this.p.x;
      this.vHist[o + k * 3 + 1] = this.p.y;
      this.vHist[o + k * 3 + 2] = this.p.z;
    }
  }

  update(dt: number, s: number = 1.2) {
    if (this.weather.status() !== 'ready') return;
    if (!this.seeded) {
      for (let i = 0; i < this.NW; i++) {
        this.spawnWind(i);
        this.wAge[i] = Math.random() * this.wLife[i];
      }
      for (let i = 0; i < this.NV; i++) {
        this.spawnWave(i, s);
        this.vAge[i] = Math.random() * this.vLife[i];
      }
      // Fast warm-up so trails are immediately full length on first render
      for (let step = 0; step < 120; step++) {
        this.updateWind(0.03, s);
        this.updateWaves(0.03, s);
      }
      this.seeded = true;
    }

    const wT = Math.max(0, Math.min(1, 0.5 + s * 0.5));
    this.cWaveCur.copy(this.cWaveCold).lerp(this.cWaveWarm, wT);

    // If the user scrubs rapidly across the timeline (large delta in s),
    // partially flush trail histories towards current positions so trails adapt quickly
    const dS = Math.abs(s - this.lastS);
    if (dS > 0.04) {
      this.adaptTrailsToTimeline(s, dS);
      this.lastS = s;
    }

    this.updateWind(dt, s);
    this.updateWaves(dt, s);
  }

  private adaptTrailsToTimeline(s: number, dS: number) {
    const shiftFrac = Math.min(1, dS * 6);
    const R_wind = this.math.R * 1.013;
    const R_wave = this.math.R * 1.011;

    // Adapt wind streaks
    const stepsW = Math.max(2, Math.round(this.TRAIL * shiftFrac * 0.35));
    for (let i = 0; i < this.NW; i++) {
      this.math.pos(this.wLon[i], this.wLat[i], R_wind, this.p);
      const o = i * this.TRAIL * 3;
      for (let k = this.TRAIL - 1; k >= stepsW; k--) {
        this.wHist[o + k * 3] = this.wHist[o + (k - stepsW) * 3];
        this.wHist[o + k * 3 + 1] = this.wHist[o + (k - stepsW) * 3 + 1];
        this.wHist[o + k * 3 + 2] = this.wHist[o + (k - stepsW) * 3 + 2];
      }
      for (let k = 0; k < stepsW; k++) {
        this.wHist[o + k * 3] = this.p.x;
        this.wHist[o + k * 3 + 1] = this.p.y;
        this.wHist[o + k * 3 + 2] = this.p.z;
      }
    }

    // Adapt water streamlines
    const stepsV = Math.max(3, Math.round(this.V_TRAIL * shiftFrac * 0.35));
    for (let i = 0; i < this.NV; i++) {
      this.math.pos(this.vLon[i], this.vLat[i], R_wave, this.p);
      const o = i * this.V_TRAIL * 3;
      for (let k = this.V_TRAIL - 1; k >= stepsV; k--) {
        this.vHist[o + k * 3] = this.vHist[o + (k - stepsV) * 3];
        this.vHist[o + k * 3 + 1] = this.vHist[o + (k - stepsV) * 3 + 1];
        this.vHist[o + k * 3 + 2] = this.vHist[o + (k - stepsV) * 3 + 2];
      }
      for (let k = 0; k < stepsV; k++) {
        this.vHist[o + k * 3] = this.p.x;
        this.vHist[o + k * 3 + 1] = this.p.y;
        this.vHist[o + k * 3 + 2] = this.p.z;
      }
    }
  }

  private updateWind(dt: number, s: number) {
    const R = this.math.R * 1.013;
    const T = this.TRAIL;
    const degPerMs = 0.55;
    let w = 0;

    for (let i = 0; i < this.NW; i++) {
      this.wAge[i] += dt;
      const lat0 = this.wLat[i];
      if (this.wAge[i] > this.wLife[i] || Math.abs(lat0) > this.MAX_LAT + 1 || !this.weather.wind(this.wLon[i], lat0, s, this.wind)) {
        this.spawnWind(i);
        this.weather.wind(this.wLon[i], this.wLat[i], s, this.wind);
      } else {
        this.wLon[i] += this.wind.u * degPerMs * dt / Math.max(0.25, Math.cos(lat0 * this.math.DEG));
        this.wLat[i] += this.wind.v * degPerMs * dt;
        let wrapped = false;
        if (this.wLon[i] > 180) { this.wLon[i] -= 360; wrapped = true; }
        if (this.wLon[i] < -180) { this.wLon[i] += 360; wrapped = true; }
        const o = i * T * 3;
        this.math.pos(this.wLon[i], this.wLat[i], R, this.p);
        if (wrapped) {
          for (let k = 0; k < T; k++) {
            this.wHist[o + k * 3] = this.p.x;
            this.wHist[o + k * 3 + 1] = this.p.y;
            this.wHist[o + k * 3 + 2] = this.p.z;
          }
        } else {
          this.wHist.copyWithin(o + 3, o, o + (T - 1) * 3);
          this.wHist[o] = this.p.x;
          this.wHist[o + 1] = this.p.y;
          this.wHist[o + 2] = this.p.z;
        }
      }

      const speed = Math.hypot(this.wind.u, this.wind.v);
      const k = Math.min(1, speed / 16);
      const r = this.cWind.r + (this.cStrong.r - this.cWind.r) * k * k;
      const g = this.cWind.g + (this.cStrong.g - this.cWind.g) * k * k;
      const b = this.cWind.b + (this.cStrong.b - this.cWind.b) * k * k;
      const life = this.wAge[i] / this.wLife[i];
      const a = 0.28 * Math.min(1, life * 5, (1 - life) * 3) * (0.45 + 0.55 * Math.min(1, speed / 8));

      const o = i * T * 3;
      for (let sIdx = 0; sIdx < T - 1; sIdx++) {
        for (let j = 0; j < 6; j++) this.wPos[w * 3 + j] = this.wHist[o + sIdx * 3 + j];
        const c = w * 4;
        this.wCol[c] = r; this.wCol[c + 1] = g; this.wCol[c + 2] = b;
        this.wCol[c + 3] = a * (1 - sIdx / (T - 1)) ** 0.75;
        this.wCol[c + 4] = r; this.wCol[c + 5] = g; this.wCol[c + 6] = b;
        this.wCol[c + 7] = a * (1 - (sIdx + 1) / (T - 1)) ** 0.75;
        w += 2;
      }
    }
    this.wGeo.attributes['position'].needsUpdate = true;
    this.wGeo.attributes['color'].needsUpdate = true;
  }

  private updateWaves(dt: number, s: number) {
    const R = this.math.R * 1.011;
    const D = this.math.DEG;
    const VT = this.V_TRAIL;
    const degPerMs = 1.2;
    let vPtr = 0;

    for (let i = 0; i < this.NV; i++) {
      this.vAge[i] += dt;
      let ok = this.weather.waves(this.vLon[i], this.vLat[i], s, this.wave);
      if (this.vAge[i] > this.vLife[i] || !ok || this.isLand(this.vLon[i], this.vLat[i])) {
        this.spawnWave(i, s);
        ok = this.weather.waves(this.vLon[i], this.vLat[i], s, this.wave);
      }

      const numSegs = VT - 1;
      const numVerts = numSegs * 2;

      if (!ok) {
        const c = vPtr * 4;
        const totalCol = numVerts * 4;
        for (let j = 0; j < totalCol; j++) this.vCol[c + j] = 0;
        vPtr += numVerts;
        continue;
      }

      const { period, dx, dy } = this.wave;
      const lat0 = this.vLat[i];
      const cosLat = Math.max(0.25, Math.cos(lat0 * D));
      const speed = 0.9 + 0.14 * Math.min(period, 16);
      this.vLon[i] += dx * speed * degPerMs * dt / cosLat;
      this.vLat[i] += dy * speed * degPerMs * dt;
      let wrapped = false;
      if (this.vLon[i] > 180) { this.vLon[i] -= 360; wrapped = true; }
      if (this.vLon[i] < -180) { this.vLon[i] += 360; wrapped = true; }

      const o = i * VT * 3;
      this.math.pos(this.vLon[i], this.vLat[i], R, this.p);
      if (wrapped) {
        for (let k = 0; k < VT; k++) {
          this.vHist[o + k * 3] = this.p.x;
          this.vHist[o + k * 3 + 1] = this.p.y;
          this.vHist[o + k * 3 + 2] = this.p.z;
        }
      } else {
        this.vHist.copyWithin(o + 3, o, o + (VT - 1) * 3);
        this.vHist[o] = this.p.x;
        this.vHist[o + 1] = this.p.y;
        this.vHist[o + 2] = this.p.z;
      }

      const life = this.vAge[i] / this.vLife[i];
      const a = Math.sin(Math.PI * life) * 0.38;
      const r = this.cWaveCur.r;
      const g = this.cWaveCur.g;
      const b = this.cWaveCur.b;

      // Pure streamline showcasing water flow direction: VT - 1 segments
      for (let sIdx = 0; sIdx < VT - 1; sIdx++) {
        for (let j = 0; j < 6; j++) {
          this.vPos[vPtr * 3 + j] = this.vHist[o + sIdx * 3 + j];
        }
        const c = vPtr * 4;
        const a1 = a * (1 - sIdx / (VT - 1)) ** 0.70;
        const a2 = a * (1 - (sIdx + 1) / (VT - 1)) ** 0.70;
        this.vCol[c] = r; this.vCol[c + 1] = g; this.vCol[c + 2] = b; this.vCol[c + 3] = a1;
        this.vCol[c + 4] = r; this.vCol[c + 5] = g; this.vCol[c + 6] = b; this.vCol[c + 7] = a2;
        vPtr += 2;
      }
    }
    this.vGeo.attributes['position'].needsUpdate = true;
    this.vGeo.attributes['color'].needsUpdate = true;
  }
}
