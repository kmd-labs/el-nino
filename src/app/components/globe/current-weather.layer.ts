import * as THREE from 'three';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { CurrentWeatherService, WaveSample, WindSample } from '../../core/services/current-weather.service';

/**
 * "Current situation" layer: real surface wind (streaks with fading trails) and ocean waves
 * (crests moving the way the waves travel) from the latest Open-Meteo snapshot.
 * Owns its own Three.js objects; the globe shows the group and calls update() each frame.
 */
export class CurrentWeatherLayer {
  readonly group = new THREE.Group();

  // wind streaks
  private readonly NW = 3200;
  private readonly TRAIL = 20;
  private readonly MAX_LAT = 58;
  private wLon = new Float32Array(this.NW);
  private wLat = new Float32Array(this.NW);
  private wAge = new Float32Array(this.NW);
  private wLife = new Float32Array(this.NW);
  private wHist = new Float32Array(this.NW * this.TRAIL * 3);
  private wPos: Float32Array;
  private wCol: Float32Array;
  private wGeo = new THREE.BufferGeometry();

  // wave crests: 3 points (tip – middle – tip) drawn as 2 segments
  private readonly NV = 1400;
  private vLon = new Float32Array(this.NV);
  private vLat = new Float32Array(this.NV);
  private vAge = new Float32Array(this.NV);
  private vLife = new Float32Array(this.NV);
  private vPos = new Float32Array(this.NV * 4 * 3);
  private vCol = new Float32Array(this.NV * 4 * 4);
  private vGeo = new THREE.BufferGeometry();

  private readonly wind: WindSample = { u: 0, v: 0 };
  private readonly wave: WaveSample = { h: 0, period: 8, dx: 1, dy: 0 };
  private readonly p = new THREE.Vector3();
  private seeded = false;

  constructor(
    private math: EnsoMathService,
    private weather: CurrentWeatherService,
    private isLand: (lon: number, lat: number) => boolean,
    private cWind: THREE.Color,
    private cStrong: THREE.Color,
    private cWave: THREE.Color
  ) {
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
    this.vGeo.setAttribute('position', new THREE.BufferAttribute(this.vPos, 3));
    this.vGeo.setAttribute('color', new THREE.BufferAttribute(this.vCol, 4));
    this.group.add(new THREE.LineSegments(this.vGeo, mat()));
    this.group.add(new THREE.LineSegments(this.wGeo, mat()));
    this.group.visible = false;
  }

  /** Random point, uniform over the sphere's area between ±MAX_LAT. */
  private randomPoint(): [number, number] {
    const s = Math.sin(this.MAX_LAT * this.math.DEG);
    return [Math.random() * 360 - 180, Math.asin((Math.random() * 2 - 1) * s) / this.math.DEG];
  }

  private spawnWind(i: number) {
    const [lon, lat] = this.randomPoint();
    this.wLon[i] = lon;
    this.wLat[i] = lat;
    this.wAge[i] = 0;
    this.wLife[i] = 2.5 + Math.random() * 3.5;
    this.math.pos(lon, lat, this.math.R * 1.012, this.p);
    const o = i * this.TRAIL * 3;
    for (let k = 0; k < this.TRAIL; k++) {
      this.wHist[o + k * 3] = this.p.x;
      this.wHist[o + k * 3 + 1] = this.p.y;
      this.wHist[o + k * 3 + 2] = this.p.z;
    }
  }

  private spawnWave(i: number) {
    for (let tries = 0; tries < 8; tries++) {
      const [lon, lat] = this.randomPoint();
      if (!this.isLand(lon, lat) && this.weather.waves(lon, lat, this.wave)) {
        this.vLon[i] = lon;
        this.vLat[i] = lat;
        break;
      }
    }
    this.vAge[i] = 0;
    this.vLife[i] = 2 + Math.random() * 3;
  }

  update(dt: number) {
    if (!this.weather.data()) return;
    if (!this.seeded) {
      for (let i = 0; i < this.NW; i++) {
        this.spawnWind(i);
        this.wAge[i] = Math.random() * this.wLife[i];
      }
      for (let i = 0; i < this.NV; i++) {
        this.spawnWave(i);
        this.vAge[i] = Math.random() * this.vLife[i];
      }
      this.seeded = true;
    }
    this.updateWind(dt);
    this.updateWaves(dt);
  }

  private updateWind(dt: number) {
    const R = this.math.R * 1.012;
    const T = this.TRAIL;
    const degPerMs = 0.7; // screen speed: degrees per second for 1 m/s of wind
    let w = 0;
    for (let i = 0; i < this.NW; i++) {
      this.wAge[i] += dt;
      const lat0 = this.wLat[i];
      if (this.wAge[i] > this.wLife[i] || Math.abs(lat0) > this.MAX_LAT + 1 || !this.weather.wind(this.wLon[i], lat0, this.wind)) {
        this.spawnWind(i);
        this.weather.wind(this.wLon[i], this.wLat[i], this.wind);
      } else {
        this.wLon[i] += this.wind.u * degPerMs * dt / Math.max(0.25, Math.cos(lat0 * this.math.DEG));
        this.wLat[i] += this.wind.v * degPerMs * dt;
        if (this.wLon[i] > 180) this.wLon[i] -= 360;
        if (this.wLon[i] < -180) this.wLon[i] += 360;
        const o = i * T * 3;
        this.wHist.copyWithin(o + 3, o, o + (T - 1) * 3);
        this.math.pos(this.wLon[i], this.wLat[i], R, this.p);
        this.wHist[o] = this.p.x;
        this.wHist[o + 1] = this.p.y;
        this.wHist[o + 2] = this.p.z;
      }

      // stronger wind: more opaque and tinted towards the accent colour
      const speed = Math.hypot(this.wind.u, this.wind.v);
      const k = Math.min(1, speed / 16);
      const r = this.cWind.r + (this.cStrong.r - this.cWind.r) * k * k;
      const g = this.cWind.g + (this.cStrong.g - this.cWind.g) * k * k;
      const b = this.cWind.b + (this.cStrong.b - this.cWind.b) * k * k;
      const life = this.wAge[i] / this.wLife[i];
      const a = 0.9 * Math.min(1, life * 5, (1 - life) * 3) * (0.35 + 0.65 * Math.min(1, speed / 8));

      const o = i * T * 3;
      for (let s = 0; s < T - 1; s++) {
        for (let j = 0; j < 6; j++) this.wPos[w * 3 + j] = this.wHist[o + s * 3 + j];
        const c = w * 4;
        this.wCol[c] = r; this.wCol[c + 1] = g; this.wCol[c + 2] = b;
        this.wCol[c + 3] = a * (1 - s / (T - 1)) ** 1.3;
        this.wCol[c + 4] = r; this.wCol[c + 5] = g; this.wCol[c + 6] = b;
        this.wCol[c + 7] = a * (1 - (s + 1) / (T - 1)) ** 1.3;
        w += 2;
      }
    }
    this.wGeo.attributes['position'].needsUpdate = true;
    this.wGeo.attributes['color'].needsUpdate = true;
  }

  private updateWaves(dt: number) {
    const R = this.math.R * 1.006;
    const D = this.math.DEG;
    for (let i = 0; i < this.NV; i++) {
      this.vAge[i] += dt;
      let ok = this.weather.waves(this.vLon[i], this.vLat[i], this.wave);
      if (this.vAge[i] > this.vLife[i] || !ok || this.isLand(this.vLon[i], this.vLat[i])) {
        this.spawnWave(i);
        ok = this.weather.waves(this.vLon[i], this.vLat[i], this.wave);
      }
      const o = i * 12;
      const oc = i * 16;
      if (!ok) {
        for (let j = 0; j < 4; j++) this.vCol[oc + j * 4 + 3] = 0;
        continue;
      }
      const { h, period, dx, dy } = this.wave;
      const cosLat = Math.max(0.25, Math.cos(this.vLat[i] * D));
      // crests drift the way the waves travel; longer-period swell moves faster
      const speed = 0.35 + 0.08 * Math.min(period, 16);
      this.vLon[i] += dx * speed * dt / cosLat;
      this.vLat[i] += dy * speed * dt;

      const lon = this.vLon[i];
      const lat = this.vLat[i];
      const half = 0.5 + 0.3 * Math.min(h, 6);          // higher waves → longer crests
      const bow = half * 0.3;                            // crest bulges forward
      const px = -dy, py = dx;                           // along the crest (perpendicular to travel)
      this.math.pos(lon + px * half / cosLat, lat + py * half, R, this.p);
      this.vPos[o] = this.p.x; this.vPos[o + 1] = this.p.y; this.vPos[o + 2] = this.p.z;
      this.math.pos(lon + dx * bow / cosLat, lat + dy * bow, R, this.p);
      this.vPos[o + 3] = this.p.x; this.vPos[o + 4] = this.p.y; this.vPos[o + 5] = this.p.z;
      this.vPos[o + 6] = this.p.x; this.vPos[o + 7] = this.p.y; this.vPos[o + 8] = this.p.z;
      this.math.pos(lon - px * half / cosLat, lat - py * half, R, this.p);
      this.vPos[o + 9] = this.p.x; this.vPos[o + 10] = this.p.y; this.vPos[o + 11] = this.p.z;

      const life = this.vAge[i] / this.vLife[i];
      const a = Math.sin(Math.PI * life) * (0.35 + 0.6 * Math.min(1, h / 3));
      for (let j = 0; j < 4; j++) {
        const f = j === 1 || j === 2 ? a : a * 0.15;
        this.vCol[oc + j * 4] = this.cWave.r;
        this.vCol[oc + j * 4 + 1] = this.cWave.g;
        this.vCol[oc + j * 4 + 2] = this.cWave.b;
        this.vCol[oc + j * 4 + 3] = f;
      }
    }
    this.vGeo.attributes['position'].needsUpdate = true;
    this.vGeo.attributes['color'].needsUpdate = true;
  }
}
