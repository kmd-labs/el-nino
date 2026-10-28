import * as THREE from 'three';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { CurrentWeatherService, WaveSample, WindSample } from '../../core/services/current-weather.service';

/**
 * A wind streak lives 6–10 s. At 0.55°/s per m/s that is ~25–40° of travel: long enough for a full
 * trail, short enough that streaks respawn before they drain into a convergence point of the 10°
 * snapshot grid (a low between grid nodes interpolates to a pure sink, #83).
 */
const WIND_LIFE_MIN = 6;
const WIND_LIFE_SPAN = 4;
/** Below this speed (m/s) a streak is sitting in a sink; respawn it instead of letting heads stack up. */
const WIND_MIN_SPEED = 0.8;

/**
 * Ocean waves are drawn as short crests across their direction of travel (#85): a small wave
 * train of CRESTS marks, the leading one brightest. A train lives 4–8 s, so it never has time to
 * pile up where the 10° direction field converges.
 */
const WAVE_LIFE_MIN = 4;
const WAVE_LIFE_SPAN = 4;
const CRESTS = 3;
const CREST_WEIGHT = [1, 0.55, 0.25];
/** Interpolated direction shorter than this means neighbouring swells cancel out: respawn there. */
const WAVE_MIN_DIR = 0.35;
/** Line segments per crest: tip – centre – tip, bowed forward like a real wave front. */
const CREST_SEGMENTS = 2;

/**
 * Real surface wind streaks (trails along the flow) and ocean wave crests (short marks across the
 * direction of travel), interpolated across temperature keyframes (from the La Niña cold peak
 * through the current situation to the Super El Niño forecast).
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
  /** Wind speed at each streak's head, for its own colour and opacity. */
  private wSpd: Float32Array;
  private wHist: Float32Array;
  private wPos: Float32Array;
  private wCol: Float32Array;
  private wGeo = new THREE.BufferGeometry();

  private readonly NV: number;
  private vLon: Float32Array;
  private vLat: Float32Array;
  private vAge: Float32Array;
  private vLife: Float32Array;
  /** Unit direction of travel (east, north) and wave height / period at each train's lead crest. */
  private vDx: Float32Array;
  private vDy: Float32Array;
  private vH: Float32Array;
  private vPer: Float32Array;
  private vPos: Float32Array;
  private vCol: Float32Array;
  private vGeo = new THREE.BufferGeometry();

  private readonly wind: WindSample = { u: 0, v: 0 };
  private readonly wave: WaveSample = { h: 0, period: 8, dx: 1, dy: 0 };
  private readonly p = new THREE.Vector3();
  private readonly cWaveCur = new THREE.Color();
  private seeded = false;
  private lastS = 1.4;

  private readonly wDecay: Float32Array;

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

    this.wDecay = new Float32Array(this.TRAIL);
    for (let k = 0; k < this.TRAIL; k++) {
      this.wDecay[k] = (1 - k / (this.TRAIL - 1)) ** 0.75;
    }

    this.wLon = new Float32Array(this.NW);
    this.wLat = new Float32Array(this.NW);
    this.wAge = new Float32Array(this.NW);
    this.wLife = new Float32Array(this.NW);
    this.wSpd = new Float32Array(this.NW);
    this.wHist = new Float32Array(this.NW * this.TRAIL * 3);

    this.vLon = new Float32Array(this.NV);
    this.vLat = new Float32Array(this.NV);
    this.vAge = new Float32Array(this.NV);
    this.vLife = new Float32Array(this.NV);
    this.vDx = new Float32Array(this.NV);
    this.vDy = new Float32Array(this.NV);
    this.vH = new Float32Array(this.NV);
    this.vPer = new Float32Array(this.NV);

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

    // Wave trains: CRESTS crests of CREST_SEGMENTS line segments each
    const vSeg = this.NV * CRESTS * CREST_SEGMENTS * 2;
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
    this.wLife[i] = WIND_LIFE_MIN + Math.random() * WIND_LIFE_SPAN;
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
    this.vLife[i] = WAVE_LIFE_MIN + Math.random() * WAVE_LIFE_SPAN;
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
      // Fast warm-up: advance particle histories without rebuilding GPU buffers on each step
      for (let step = 0; step < 120; step++) {
        this.stepWind(0.03, s);
        this.stepWaves(0.03, s);
      }
      this.buildWindGeometry();
      this.buildWaveGeometry();
      this.seeded = true;
    }

    const wT = Math.max(0, Math.min(1, 0.5 + s * 0.5));
    this.cWaveCur.copy(this.cWaveCold).lerp(this.cWaveWarm, wT);

    // If the user scrubs rapidly across the timeline (large delta in s),
    // partially flush wind trail histories towards current positions so trails adapt quickly
    const dS = Math.abs(s - this.lastS);
    if (dS > 0.04) {
      this.adaptTrailsToTimeline(s, dS);
      this.lastS = s;
    }

    this.stepWind(dt, s);
    this.buildWindGeometry();
    this.stepWaves(dt, s);
    this.buildWaveGeometry();
  }

  private adaptTrailsToTimeline(s: number, dS: number) {
    const shiftFrac = Math.min(1, dS * 6);
    const R_wind = this.math.R * 1.013;

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
  }

  private stepWind(dt: number, s: number) {
    const R = this.math.R * 1.013;
    const T = this.TRAIL;
    const degPerMs = 0.55;

    for (let i = 0; i < this.NW; i++) {
      this.wAge[i] += dt;
      const lat0 = this.wLat[i];
      const alive = this.wAge[i] <= this.wLife[i]
        && Math.abs(lat0) <= this.MAX_LAT + 1
        && this.weather.wind(this.wLon[i], lat0, s, this.wind)
        && Math.hypot(this.wind.u, this.wind.v) >= WIND_MIN_SPEED;
      if (!alive) {
        this.spawnWind(i);
        this.weather.wind(this.wLon[i], this.wLat[i], s, this.wind);
        this.wSpd[i] = Math.hypot(this.wind.u, this.wind.v);
      } else {
        this.wSpd[i] = Math.hypot(this.wind.u, this.wind.v);
        this.wLon[i] += this.wind.u * degPerMs * dt / Math.max(0.25, Math.cos(lat0 * this.math.DEG));
        this.wLat[i] += this.wind.v * degPerMs * dt;
        if (this.wLon[i] > 180) this.wLon[i] -= 360;
        if (this.wLon[i] < -180) this.wLon[i] += 360;
        const o = i * T * 3;
        this.math.pos(this.wLon[i], this.wLat[i], R, this.p);
        this.wHist.copyWithin(o + 3, o, o + (T - 1) * 3);
        this.wHist[o] = this.p.x;
        this.wHist[o + 1] = this.p.y;
        this.wHist[o + 2] = this.p.z;
      }
    }
  }

  private buildWindGeometry() {
    const T = this.TRAIL;
    let w = 0;
    for (let i = 0; i < this.NW; i++) {
      const speed = this.wSpd[i];
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
        const a1 = a * this.wDecay[sIdx];
        const a2 = a * this.wDecay[sIdx + 1];
        this.wCol[c] = r; this.wCol[c + 1] = g; this.wCol[c + 2] = b;
        this.wCol[c + 3] = a1;
        this.wCol[c + 4] = r; this.wCol[c + 5] = g; this.wCol[c + 6] = b;
        this.wCol[c + 7] = a2;
        w += 2;
      }
    }
    this.wGeo.attributes['position'].needsUpdate = true;
    this.wGeo.attributes['color'].needsUpdate = true;
  }

  private stepWaves(dt: number, s: number) {
    const D = this.math.DEG;
    const degPerMs = 1.2;

    for (let i = 0; i < this.NV; i++) {
      this.vAge[i] += dt;
      let ok = this.vAge[i] <= this.vLife[i]
        && !this.isLand(this.vLon[i], this.vLat[i])
        && this.sampleWave(i, s);
      if (!ok) {
        this.spawnWave(i, s);
        ok = this.sampleWave(i, s);
      }
      if (!ok) {
        // nowhere usable found this frame: keep the train invisible until the next respawn
        this.vAge[i] = this.vLife[i];
        continue;
      }

      const cosLat = Math.max(0.25, Math.cos(this.vLat[i] * D));
      const speed = (0.9 + 0.14 * Math.min(this.vPer[i], 16)) * degPerMs;
      this.vLon[i] += this.vDx[i] * speed * dt / cosLat;
      this.vLat[i] += this.vDy[i] * speed * dt;
      if (this.vLon[i] > 180) this.vLon[i] -= 360;
      if (this.vLon[i] < -180) this.vLon[i] += 360;
    }
  }

  /** Reads the wave field at train i; false where there is no data or opposing swells cancel out. */
  private sampleWave(i: number, s: number): boolean {
    if (!this.weather.waves(this.vLon[i], this.vLat[i], s, this.wave)) return false;
    const len = Math.hypot(this.wave.dx, this.wave.dy);
    if (len < WAVE_MIN_DIR) return false;
    this.vDx[i] = this.wave.dx / len;
    this.vDy[i] = this.wave.dy / len;
    this.vH[i] = this.wave.h;
    this.vPer[i] = this.wave.period;
    return true;
  }

  private buildWaveGeometry() {
    const D = this.math.DEG;
    const R = this.math.R * 1.011;
    const r = this.cWaveCur.r;
    const g = this.cWaveCur.g;
    const b = this.cWaveCur.b;
    let v = 0;

    const put = (lon: number, lat: number, alpha: number) => {
      this.math.pos(lon, lat, R, this.p);
      this.vPos[v * 3] = this.p.x;
      this.vPos[v * 3 + 1] = this.p.y;
      this.vPos[v * 3 + 2] = this.p.z;
      this.vCol[v * 4] = r;
      this.vCol[v * 4 + 1] = g;
      this.vCol[v * 4 + 2] = b;
      this.vCol[v * 4 + 3] = alpha;
      v++;
    };

    for (let i = 0; i < this.NV; i++) {
      const life = Math.min(1, this.vAge[i] / this.vLife[i]);
      const h = this.vH[i];
      const a = 0.55 * Math.sin(Math.PI * life) * (0.5 + 0.5 * Math.min(1, h / 3));
      const lon0 = this.vLon[i];
      const lat0 = this.vLat[i];
      const k = 1 / Math.max(0.25, Math.cos(lat0 * D));
      // along travel (dx, dy) and across it (-dy, dx), in degrees of lon / lat
      const fx = this.vDx[i] * k, fy = this.vDy[i];
      const px = -this.vDy[i] * k, py = this.vDx[i];
      const half = 0.6 + 0.3 * Math.min(h, 5); // longer crests for higher waves
      const bow = 0.25 * half; // tips trail the centre, like a real wave front
      const spacing = 0.12 * Math.min(Math.max(this.vPer[i], 4), 16); // longer period, longer wavelength

      for (let c = 0; c < CRESTS; c++) {
        const cl = lon0 - fx * spacing * c;
        const ct = lat0 - fy * spacing * c;
        const ac = a * CREST_WEIGHT[c];
        const tipA = ac * 0.15;
        const lLon = cl + px * half - fx * bow, lLat = ct + py * half - fy * bow;
        const rLon = cl - px * half - fx * bow, rLat = ct - py * half - fy * bow;
        put(lLon, lLat, tipA); put(cl, ct, ac);
        put(cl, ct, ac); put(rLon, rLat, tipA);
      }
    }
    this.vGeo.attributes['position'].needsUpdate = true;
    this.vGeo.attributes['color'].needsUpdate = true;
  }
}
