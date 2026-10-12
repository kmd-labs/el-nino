import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as d3Geo from 'd3-geo';
import * as topojson from 'topojson-client';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { EVENTS, KIND } from '../../core/constants/enso-data';
import { EnsoPhase, ImpactKind, ImpactLocation } from '../../core/models/enso.model';

interface PinItem {
  loc: ImpactLocation;
  sp: THREE.Sprite;
  p: THREE.Vector3;
  a: number;
  phases: Set<EnsoPhase>;
}

interface CloudPuff {
  m: THREE.Mesh;
  dLon: number;
  dLat: number;
  alt: number;
  sc: number;
}

@Component({
  selector: 'app-globe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './globe.component.html',
  styleUrl: './globe.component.scss'
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lblConvRef') lblConvRef!: ElementRef<HTMLDivElement>;
  @ViewChild('lblNinoRef') lblNinoRef!: ElementRef<HTMLDivElement>;
  @ViewChild('lblWalkerRef') lblWalkerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('tooltipRef') tooltipRef!: ElementRef<HTMLDivElement>;

  private ngZone = inject(NgZone);
  state = inject(EnsoStateService);
  private math = inject(EnsoMathService);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animId: number | null = null;
  private clock = new THREE.Clock();

  // SST texture
  private readonly GW = 720;
  private readonly GH = 360;
  private readonly NG = 720 * 360;
  private CLIM!: Float32Array;
  private BP!: Float32Array;
  private BC!: Float32Array;
  private BN!: Float32Array;
  private texData!: Uint8Array;
  private sstTex!: THREE.DataTexture;

  // Land overlay
  private landCanvas!: HTMLCanvasElement;
  private landTex!: THREE.CanvasTexture;

  // Atmosphere
  private atmGroup!: THREE.Group;
  private pGeo!: THREE.BufferGeometry;
  private pPos!: Float32Array;
  private pCol!: Float32Array;
  private pTh!: Float32Array;
  private pLat!: Float32Array;
  private pR!: Float32Array;
  private pU!: Float32Array;
  private pV!: Float32Array;
  private readonly NP = 2200;
  private readonly cLow = new THREE.Color('#ffcf94');
  private readonly cHigh = new THREE.Color('#8fbaff');
  private readonly LW0 = 60;
  private readonly LE0 = 285;

  private puffs: CloudPuff[] = [];
  private readonly NR = 380;
  private rLon!: Float32Array;
  private rLat!: Float32Array;
  private rH!: Float32Array;
  private rGeo!: THREE.BufferGeometry;
  private rPos!: Float32Array;

  // Pins & interaction
  private pinGroup!: THREE.Group;
  private pins: PinItem[] = [];
  private hoverPin: PinItem | null = null;
  private downXY: [number, number] | null = null;

  private readonly camDir = new THREE.Vector3();
  private readonly v3 = new THREE.Vector3();
  private readonly pv = new THREE.Vector3();
  private readonly fv = new THREE.Vector3();
  private readonly tmpVec = new THREE.Vector3();

  private lastS = 999;
  private lastMode = '';

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.initSstData();
      this.initLandOverlay();
      this.initAtmosphere();
      this.initPins();
      this.handleResize();
      this.animate();
    });
  }

  ngOnDestroy() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
    }
    this.renderer?.dispose();
  }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03060d);

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 400);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.minDistance = 7.5;
    this.controls.maxDistance = 40;
    this.controls.enablePan = false;
    this.controls.autoRotate = this.state.autoRotate();
    this.controls.autoRotateSpeed = 0.35;

    this.controls.addEventListener('start', () => {
      this.ngZone.run(() => {
        this.state.toggleAutoRotate(false);
      });
      this.controls.autoRotate = false;
    });

    const hemiLight = new THREE.HemisphereLight(0xdfe8ff, 0x223044, 0.95);
    this.scene.add(hemiLight);

    const headLight = new THREE.DirectionalLight(0xffffff, 0.75);
    headLight.position.set(2, 3, 5);
    this.camera.add(headLight);

    // Initial camera position looking at Pacific
    const isPortrait = window.innerWidth / window.innerHeight < 0.9;
    this.math.pos(-165, 12, isPortrait ? 26 : 16, this.camera.position);
    this.controls.update();

    // Glow shader & starry background
    this.initGlowAndStars();
  }

  private initGlowAndStars() {
    const R = this.math.R;
    const glowMat = new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(0x3d8bff) } },
      vertexShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 c;
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float d = clamp(-dot(vN, vV), 0.0, 1.0);
          float i = pow(d, 1.6) * 1.4;
          gl_FragColor = vec4(c * i, i);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    const glow = new THREE.Mesh(new THREE.SphereGeometry(R * 1.13, 64, 32), glowMat);
    this.scene.add(glow);

    // Star points
    const n = 1800;
    const starPos = new Float32Array(n * 3);
    const starVec = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      starVec.randomDirection().multiplyScalar(120 + Math.random() * 120);
      starPos.set([starVec.x, starVec.y, starVec.z], i * 3);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0x9fb4d8,
        size: 0.6,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7
      })
    );
    this.scene.add(stars);
  }

  private initSstData() {
    this.CLIM = new Float32Array(this.NG);
    this.BP = new Float32Array(this.NG);
    this.BC = new Float32Array(this.NG);
    this.BN = new Float32Array(this.NG);

    for (let r = 0; r < this.GH; r++) {
      const lat = -90 + (r + 0.5) * 180 / this.GH;
      for (let c = 0; c < this.GW; c++) {
        const lon = ((-180 + (c + 0.5) * 360 / this.GW) + 360) % 360;
        const i = r * this.GW + c;
        this.CLIM[i] = this.math.clim(lon, lat);
        this.BP[i] = this.math.basisP(lon, lat);
        this.BC[i] = this.math.basisC(lon, lat);
        this.BN[i] = this.math.basisN(lon, lat);
      }
    }

    this.texData = new Uint8Array(this.NG * 4);
    this.sstTex = new THREE.DataTexture(this.texData, this.GW, this.GH, THREE.RGBAFormat);
    this.sstTex.colorSpace = THREE.SRGBColorSpace;
    this.sstTex.magFilter = THREE.LinearFilter;
    this.sstTex.minFilter = THREE.LinearFilter;
    this.sstTex.wrapS = THREE.RepeatWrapping;

    this.recolorTexture(this.state.sCur(), this.state.displayMode());

    const globeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.math.R, 128, 64),
      new THREE.MeshLambertMaterial({ map: this.sstTex })
    );
    this.scene.add(globeMesh);
  }

  private recolorTexture(s: number, mode: 'sst' | 'anom') {
    const { lut, lo, hi } = mode === 'sst' ? this.math.lutSst : this.math.lutAnom;
    const sc = 255 / (hi - lo);
    const sp = Math.max(0, s);
    const sk = Math.max(0, s - 1.4);
    const sn = Math.max(0, -s);
    const isSST = mode === 'sst';

    for (let i = 0; i < this.NG; i++) {
      const a = sp * this.BP[i] + sk * this.BC[i] + sn * this.BN[i];
      const v = isSST ? this.CLIM[i] + a : a;
      const k = this.math.clamp(Math.round((v - lo) * sc), 0, 255) * 3;
      const o = i * 4;
      this.texData[o] = lut[k];
      this.texData[o + 1] = lut[k + 1];
      this.texData[o + 2] = lut[k + 2];
      this.texData[o + 3] = 255;
    }
    this.sstTex.needsUpdate = true;
  }

  private initLandOverlay() {
    const maxTexSize = this.renderer.capabilities.maxTextureSize >= 8192 ? 4096 : 2048;
    this.landCanvas = document.createElement('canvas');
    this.landCanvas.width = maxTexSize;
    this.landCanvas.height = maxTexSize / 2;

    this.landTex = new THREE.CanvasTexture(this.landCanvas);
    this.landTex.colorSpace = THREE.SRGBColorSpace;
    this.landTex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const landMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.math.R * 1.003, 128, 64),
      new THREE.MeshLambertMaterial({ map: this.landTex, transparent: true, depthWrite: false })
    );
    this.scene.add(landMesh);

    this.drawLand(null);

    // Fetch land topology
    const loadLand = async () => {
      try {
        let resp = await fetch('assets/data/land-50m.json');
        if (!resp.ok) {
          resp = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json');
        }
        const topology = await resp.json();
        const landFeature = topojson.feature(topology, topology.objects.land as any);
        this.drawLand(landFeature);
        this.ngZone.run(() => {
          this.state.mapLoaded.set(true);
        });
      } catch (err) {
        console.warn('Could not load land data:', err);
        this.ngZone.run(() => {
          this.state.mapError.set('Nie udało się wczytać konturów lądów.');
        });
      }
    };
    loadLand();
  }

  private drawLand(land: any) {
    const ctx = this.landCanvas.getContext('2d');
    if (!ctx) return;
    const Wc = this.landCanvas.width;
    const Hc = this.landCanvas.height;

    ctx.clearRect(0, 0, Wc, Hc);
    const X = (lon: number) => (lon + 180) / 360 * Wc;
    const Y = (lat: number) => (90 - lat) / 180 * Hc;

    const proj = d3Geo.geoEquirectangular().scale(Wc / (2 * Math.PI)).translate([Wc / 2, Hc / 2]).precision(0.1);
    const path = d3Geo.geoPath(proj, ctx);

    ctx.beginPath();
    path(d3Geo.geoGraticule().step([30, 30])());
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = Wc / 2048;
    ctx.stroke();

    if (land) {
      ctx.beginPath();
      path(land);
      ctx.fillStyle = '#2a3830';
      ctx.fill();
      ctx.strokeStyle = 'rgba(205, 230, 215, 0.6)';
      ctx.lineWidth = Wc / 1800;
      ctx.stroke();
    }

    // Equator dashed line
    ctx.setLineDash([Wc / 300, Wc / 400]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = Wc / 2048;
    ctx.beginPath();
    ctx.moveTo(0, Y(0));
    ctx.lineTo(Wc, Y(0));
    ctx.stroke();

    // Niño 3.4 boundary box: 170°W–120°W, 5°S–5°N
    ctx.setLineDash([Wc / 400, Wc / 600]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Wc / 1100;
    ctx.strokeRect(X(-170), Y(5), X(-120) - X(-170), Y(-5) - Y(5));
    ctx.setLineDash([]);

    this.landTex.needsUpdate = true;
  }

  private initAtmosphere() {
    this.atmGroup = new THREE.Group();
    this.scene.add(this.atmGroup);

    // Particle texture
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = dotCanvas.height = 64;
    const dotCtx = dotCanvas.getContext('2d')!;
    const gr = dotCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gr.addColorStop(0.4, 'rgba(255, 255, 255, 0.55)');
    gr.addColorStop(1, 'rgba(255, 255, 255, 0)');
    dotCtx.fillStyle = gr;
    dotCtx.fillRect(0, 0, 64, 64);
    const dotTex = new THREE.CanvasTexture(dotCanvas);

    this.pTh = new Float32Array(this.NP);
    this.pLat = new Float32Array(this.NP);
    this.pR = new Float32Array(this.NP);
    this.pU = new Float32Array(this.NP);
    this.pV = new Float32Array(this.NP);

    for (let i = 0; i < this.NP; i++) {
      this.pTh[i] = Math.random() * Math.PI * 2;
      this.pLat[i] = (Math.random() - 0.5) * 22;
      this.pR[i] = 0.55 + Math.random() * 0.5;
      this.pU[i] = Math.random();
      this.pV[i] = 0.7 + Math.random() * 0.6;
    }

    this.pGeo = new THREE.BufferGeometry();
    this.pPos = new Float32Array(this.NP * 3);
    this.pCol = new Float32Array(this.NP * 3);
    this.pGeo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    this.pGeo.setAttribute('color', new THREE.BufferAttribute(this.pCol, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.075,
      map: dotTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.atmGroup.add(new THREE.Points(this.pGeo, pMat));

    // Cloud puffs
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xf2f5ff, transparent: true, opacity: 0.88 });
    const puffGeo = new THREE.SphereGeometry(1, 14, 10);
    this.puffs = [];
    for (let i = 0; i < 34; i++) {
      const m = new THREE.Mesh(puffGeo, cloudMat);
      const dLon = (Math.random() - 0.5) * 22;
      const dLat = (Math.random() - 0.5) * 18;
      const core = 1 - Math.min(1, Math.hypot(dLon / 11, dLat / 9));
      this.puffs.push({
        m,
        dLon,
        dLat,
        alt: 0.18 + Math.random() * 0.2 + core * 0.35,
        sc: 0.14 + Math.random() * 0.14 + core * 0.12
      });
      this.atmGroup.add(m);
    }

    // Rain lines
    this.rLon = new Float32Array(this.NR);
    this.rLat = new Float32Array(this.NR);
    this.rH = new Float32Array(this.NR);
    for (let i = 0; i < this.NR; i++) {
      this.rLon[i] = (Math.random() - 0.5) * 22;
      this.rLat[i] = (Math.random() - 0.5) * 16;
      this.rH[i] = Math.random() * 0.45;
    }
    this.rGeo = new THREE.BufferGeometry();
    this.rPos = new Float32Array(this.NR * 6);
    this.rGeo.setAttribute('position', new THREE.BufferAttribute(this.rPos, 3));
    this.atmGroup.add(
      new THREE.LineSegments(
        this.rGeo,
        new THREE.LineBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.6 })
      )
    );
  }

  private initPins() {
    this.pinGroup = new THREE.Group();
    this.scene.add(this.pinGroup);

    // Ring texture for sprite
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = ringCanvas.height = 64;
    const rc = ringCanvas.getContext('2d')!;
    rc.strokeStyle = '#fff';
    rc.lineWidth = 6;
    rc.beginPath();
    rc.arc(32, 32, 24, 0, Math.PI * 2);
    rc.stroke();
    rc.fillStyle = '#fff';
    rc.beginPath();
    rc.arc(32, 32, 9, 0, Math.PI * 2);
    rc.fill();
    const ringTex = new THREE.CanvasTexture(ringCanvas);

    this.pins = EVENTS.map(loc => {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: ringTex, transparent: true, depthWrite: false, opacity: 0 })
      );
      const p = this.math.pos(loc.lon, loc.lat, this.math.R * 1.012);
      sp.position.copy(p);
      sp.visible = false;
      this.pinGroup.add(sp);
      return {
        loc,
        sp,
        p,
        a: 0,
        phases: new Set<EnsoPhase>(loc.ev.map(e => e.ph))
      };
    });
  }

  private updateAtm(s: number, dt: number) {
    const xc = this.math.convLon(s);
    const wW = Math.max(1, xc - this.LW0);
    const wE = Math.max(1, this.LE0 - xc);
    const frac = wW / (wW + wE);
    const vE = 0.5 + 0.9 * this.math.clamp(this.math.trade(s), 0, 2);
    const vW = 0.5 + 0.5 * Math.max(0, s);

    for (let i = 0; i < this.NP; i++) {
      const isW = this.pU[i] < frac;
      const a = isW ? this.LW0 : xc;
      const b = isW ? xc : this.LE0;
      const cx = (a + b) / 2;
      const rx = (b - a) / 2 * this.pR[i];

      this.pTh[i] += (isW ? 1 : -1) * (isW ? vW : vE) * this.pV[i] * dt * 1.1 * (55 / Math.max(25, rx));
      const sn = Math.sin(this.pTh[i]);
      const h = (sn + 1) / 2;

      this.math.pos(cx + rx * Math.cos(this.pTh[i]), this.pLat[i] * (0.6 + 0.4 * this.pR[i]), this.math.R + 0.06 + 0.6 * h * this.pR[i], this.tmpVec);
      this.pPos[i * 3] = this.tmpVec.x;
      this.pPos[i * 3 + 1] = this.tmpVec.y;
      this.pPos[i * 3 + 2] = this.tmpVec.z;

      this.pCol[i * 3] = this.math.lerp(this.cLow.r, this.cHigh.r, h);
      this.pCol[i * 3 + 1] = this.math.lerp(this.cLow.g, this.cHigh.g, h);
      this.pCol[i * 3 + 2] = this.math.lerp(this.cLow.b, this.cHigh.b, h);
    }
    this.pGeo.attributes['position'].needsUpdate = true;
    this.pGeo.attributes['color'].needsUpdate = true;

    const boost = 0.9 + 0.1 * Math.abs(s);
    for (const p of this.puffs) {
      this.math.pos(xc + p.dLon, p.dLat, this.math.R + p.alt, p.m.position);
      p.m.scale.setScalar(p.sc * boost);
    }

    for (let i = 0; i < this.NR; i++) {
      this.rH[i] -= dt * 0.9;
      if (this.rH[i] < 0.02) this.rH[i] = 0.42;
      this.math.pos(xc + this.rLon[i], this.rLat[i], this.math.R + this.rH[i], this.tmpVec);
      this.rPos.set([this.tmpVec.x, this.tmpVec.y, this.tmpVec.z], i * 6);
      this.math.pos(xc + this.rLon[i], this.rLat[i], this.math.R + this.rH[i] - 0.07, this.tmpVec);
      this.rPos.set([this.tmpVec.x, this.tmpVec.y, this.tmpVec.z], i * 6 + 3);
    }
    this.rGeo.attributes['position'].needsUpdate = true;
  }

  private updatePins(t: number, dt: number) {
    const curPhase = this.state.phase();
    const showEvents = this.state.showEvents();
    const selectedLoc = this.state.selectedLocation();

    for (const pn of this.pins) {
      const on = showEvents && pn.phases.has(curPhase);
      pn.a += ((on ? 1 : 0) - pn.a) * Math.min(1, dt * 4);
      pn.sp.visible = pn.a > 0.01;

      if (on) {
        const evItem = pn.loc.ev.find(e => e.ph === curPhase);
        if (evItem) {
          pn.sp.material.color.setHex(KIND[evItem.kind]);
        }
      }
      pn.sp.material.opacity = pn.a;
      const isHighlighted = pn === this.hoverPin || (selectedLoc && pn.loc.name === selectedLoc.name);
      const big = isHighlighted ? 1.4 : 1;
      pn.sp.scale.setScalar((0.34 + 0.05 * Math.sin(t * 3 + pn.p.x)) * big * (0.6 + 0.4 * pn.a));
    }
  }

  private placeLabel(el: HTMLElement | null, worldPos: THREE.Vector3, visible: boolean, opacity: number = 1) {
    if (!el) return;
    if (!visible) {
      el.style.opacity = '0';
      return;
    }
    const facing = this.v3.copy(worldPos).normalize().dot(this.camDir);
    if (facing < 0.18) {
      el.style.opacity = '0';
      return;
    }
    this.v3.copy(worldPos).project(this.camera);
    const x = (this.v3.x + 1) / 2 * window.innerWidth;
    const y = (1 - this.v3.y) / 2 * window.innerHeight;
    const alpha = opacity * this.math.clamp((facing - 0.18) * 4, 0, 1);
    el.style.opacity = alpha.toString();
    el.style.transform = `translate(${x}px,${y}px) translate(-50%,-140%)`;
  }

  private updateLabels(s: number) {
    this.camDir.copy(this.camera.position).normalize();
    const showAtm = this.state.showAtmosphere();

    const convPos = this.math.pos(this.math.convLon(s), 14, this.math.R + 0.95);
    this.placeLabel(this.lblConvRef?.nativeElement, convPos, showAtm);

    const walkerPos = this.math.pos((this.math.convLon(s) + this.LE0) / 2, -16, this.math.R + 0.75);
    this.placeLabel(this.lblWalkerRef?.nativeElement, walkerPos, showAtm, 0.85);

    const ninoPos = this.math.pos(-145, 5, this.math.R * 1.01);
    this.placeLabel(this.lblNinoRef?.nativeElement, ninoPos, true);
  }

  private screenOf(p: THREE.Vector3): [number, number] {
    this.pv.copy(p).project(this.camera);
    return [(this.pv.x + 1) / 2 * window.innerWidth, (1 - this.pv.y) / 2 * window.innerHeight];
  }

  private facingOf(p: THREE.Vector3): number {
    return this.fv.copy(p).normalize().dot(this.camDir);
  }

  private pickPin(x: number, y: number, radius: number): PinItem | null {
    let best: PinItem | null = null;
    let bd = radius;
    for (const pn of this.pins) {
      if (pn.a < 0.5 || this.facingOf(pn.p) < 0.12) continue;
      const [sx, sy] = this.screenOf(pn.p);
      const d = Math.hypot(sx - x, sy - y);
      if (d < bd) {
        bd = d;
        best = pn;
      }
    }
    return best;
  }

  onPointerDown(e: PointerEvent) {
    this.downXY = [e.clientX, e.clientY];
  }

  onPointerUp(e: PointerEvent) {
    if (!this.downXY) return;
    const moved = Math.hypot(e.clientX - this.downXY[0], e.clientY - this.downXY[1]);
    this.downXY = null;
    if (moved > 6) return;

    const pn = this.pickPin(e.clientX, e.clientY, e.pointerType === 'touch' ? 34 : 22);
    this.ngZone.run(() => {
      if (pn) {
        this.state.selectLocation(pn.loc);
      } else {
        this.state.selectLocation(null);
      }
    });
  }

  onPointerMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    this.hoverPin = e.buttons ? null : this.pickPin(e.clientX, e.clientY, 22);
    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = this.hoverPin ? 'pointer' : '';

    const tip = this.tooltipRef?.nativeElement;
    if (tip) {
      if (this.hoverPin) {
        tip.textContent = this.hoverPin.loc.name;
        tip.style.transform = `translate(${e.clientX + 14}px,${e.clientY - 30}px)`;
        tip.style.opacity = '1';
      } else {
        tip.style.opacity = '0';
      }
    }
  }

  onPointerLeave() {
    this.hoverPin = null;
    const tip = this.tooltipRef?.nativeElement;
    if (tip) tip.style.opacity = '0';
  }

  @HostListener('window:resize')
  handleResize() {
    if (!this.renderer || !this.camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const portrait = w / h < 0.9;

    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    if (portrait) {
      this.camera.setViewOffset(w, h, 0, h * 0.17, w, h);
    } else {
      this.camera.clearViewOffset();
    }
    this.camera.updateProjectionMatrix();
    this.controls.minDistance = portrait ? 11 : 7.5;
  }

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    // Cycle & interpolation updates
    this.state.updateCycle(dt);
    this.state.updateInterpolatedStrength(dt);

    const s = this.state.sCur();
    const mode = this.state.displayMode();

    if (Math.abs(s - this.lastS) > 0.004 || mode !== this.lastMode) {
      this.recolorTexture(s, mode);
      this.lastS = s;
      this.lastMode = mode;
    }

    this.atmGroup.visible = this.state.showAtmosphere();
    if (this.atmGroup.visible) {
      this.updateAtm(s, dt);
    }

    this.controls.autoRotate = this.state.autoRotate();
    this.controls.update();
    this.camDir.copy(this.camera.position).normalize();

    this.updatePins(t, dt);
    this.updateLabels(s);

    this.renderer.render(this.scene, this.camera);
  };
}
