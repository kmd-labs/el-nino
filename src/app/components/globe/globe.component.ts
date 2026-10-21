import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ViewChildren,
  QueryList,
  signal,
  computed,
  effect,
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
import { ThemeService } from '@kmd/design-system/services/theme.service';
import { EVENTS_META } from '../../core/constants/enso-data';
import { RAIN_REGIONS } from '../../core/constants/impacts-data';
import { I18nService } from '../../core/i18n/i18n.service';
import { EnsoPhase, ImpactLocationMeta } from '../../core/models/enso.model';
import { isAtMost } from '@kmd/design-system/utils/breakpoints';
import { PopupService } from '@kmd/design-system/ui/popup/popup.service';
import { TooltipService } from '@kmd/design-system/ui/tooltip/tooltip.service';
import { ImpactModalComponent } from '../impact-modal/impact-modal.component';
import { CurrentWeatherService } from '../../core/services/current-weather.service';
import { CurrentWeatherLayer } from './current-weather.layer';

interface PinItem {
  loc: ImpactLocationMeta;
  sp: THREE.Sprite;
  p: THREE.Vector3;
  a: number;
  phases: Set<EnsoPhase>;
}

/** A label waiting to be placed this frame (see layoutLabels). */
interface LabelSlot {
  el: HTMLElement;
  x: number;
  y: number;
  a: number;
  prio: number;
}

interface CloudPuff {
  m: THREE.Mesh;
  dLon: number;
  dLat: number;
  alt: number;
  sx: number;
  sy: number;
  sz: number;
  ph: number;
}

@Component({
  selector: 'app-globe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './globe.component.html',
  styleUrl: './globe.component.scss',
  host: { '[class.is-hidden]': 'state.crossSectionView()' }
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lblConvRef') lblConvRef!: ElementRef<HTMLDivElement>;
  @ViewChild('lblNinoRef') lblNinoRef!: ElementRef<HTMLDivElement>;
  @ViewChild('lblWalkerRef') lblWalkerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('lblKelvinRef') lblKelvinRef!: ElementRef<HTMLDivElement>;
  @ViewChild('lblIodRef') lblIodRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('rainLbl') rainLblRefs!: QueryList<ElementRef<HTMLDivElement>>;

  private ngZone = inject(NgZone);
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  private theme = inject(ThemeService);
  private popup = inject(PopupService);
  private tooltip = inject(TooltipService);

  /** DMI formatted like the Niño 3.4 readout, e.g. "+0.6 °C". */
  readonly formattedDmi = computed(() => {
    const v = this.state.dmiValue();
    return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)} °C`;
  });
  private math = inject(EnsoMathService);
  private weather = inject(CurrentWeatherService);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private glowMat?: THREE.ShaderMaterial;
  private globeMat?: THREE.MeshLambertMaterial;
  private landMat?: THREE.MeshLambertMaterial;
  private hemiLight?: THREE.HemisphereLight;
  private stars?: THREE.Points;
  private loadedLandFeature: any = null;
  /** Niño 3.4 / dipole boxes are drawn on the land layer (hidden in the live view) */
  private landBoxes = true;
  private maskBuiltFor: any = null;
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

  private applyThemeVisuals() {
    if (this.scene) {
      this.scene.background = new THREE.Color(this.theme.getTokenColor('globe-bg', '#f5f7fb'));
    }
    if (this.stars) {
      this.stars.visible = true;
      const mat = this.stars.material as THREE.PointsMaterial;
      mat.color.set(this.theme.getTokenColor('globe-star', '#475569'));
      mat.opacity = 0.85;
      mat.needsUpdate = true;
    }
    if (this.hemiLight) {
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0xdbe4f0);
      this.hemiLight.intensity = 1.25;
    }
    if (this.globeMat && this.sstTex) {
      // Unshaded emissive texture so neutral water (#f5f7fb) matches the background exactly without grey Lambert darkening
      this.globeMat.color.setHex(0x000000);
      this.globeMat.emissive.setHex(0xffffff);
      this.globeMat.emissiveMap = this.sstTex;
      this.globeMat.needsUpdate = true;
    }
    if (this.landMat && this.landTex) {
      this.landMat.color.setHex(0x000000);
      this.landMat.emissive.setHex(0xffffff);
      this.landMat.emissiveMap = this.landTex;
      this.landMat.needsUpdate = true;
    }
    if (this.glowMat) {
      this.glowMat.uniforms['c'].value.set(this.theme.getTokenColor('globe-glow', '#0f172a'));
      this.glowMat.uniforms['uOpacity'].value = 0.22;
      this.glowMat.uniforms['uPower'].value = 2.2;
      this.glowMat.blending = THREE.NormalBlending;
      this.glowMat.needsUpdate = true;
    }
    this.cWind.set(this.theme.getTokenColor('globe-wind', '#1e293b'));
    this.cWaveWarm.set(this.theme.getTokenColor('globe-wave-warm', '#0284c7'));
    this.cWaveCold.set(this.theme.getTokenColor('globe-wave-cold', '#2563eb'));
    this.cWindStrong.set(this.theme.getTokenColor('accent', '#d37400'));
  }

  // "Current situation" view: real wind and waves (Open-Meteo snapshot)
  private currentLayer!: CurrentWeatherLayer;
  private readonly cWindStrong = new THREE.Color('#d37400');

  private initCurrentLayer() {
    this.currentLayer = new CurrentWeatherLayer(
      this.math,
      this.weather,
      (lon, lat) => this.isLand(lon, lat),
      this.cWind,
      this.cWindStrong,
      this.cWaveCold
    );
    this.scene.add(this.currentLayer.group);
  }

  // Atmosphere
  private atmGroup!: THREE.Group;
  private readonly LE0 = 285;

  // Wind streaks (Windy-style trails): surface trade winds / westerly bursts
  private readonly NW = 1700;
  private readonly TRAIL = 28;
  private readonly W_LON0 = 40;
  private readonly W_LON1 = 290;
  private readonly W_LAT = 30;
  private wLon!: Float32Array;
  private wLat!: Float32Array;
  private wAge!: Float32Array;
  private wLife!: Float32Array;
  private wHist!: Float32Array;
  private wGeo!: THREE.BufferGeometry;
  private wPos!: Float32Array;
  private wCol!: Float32Array;
  private readonly cWind = new THREE.Color('#e9eef6');

  // Ocean wave crests: equatorial Kelvin waves travelling east
  private readonly NV = 750;
  // wave crests live in two basins split by the Maritime Continent
  private readonly IO_LON0 = 48;
  private readonly IO_LON1 = 100;
  private readonly V_LON0 = 125;
  private readonly V_LON1 = 282;
  private vLon!: Float32Array;
  private vLat!: Float32Array;
  private vAge!: Float32Array;
  private vLife!: Float32Array;
  private vGeo!: THREE.BufferGeometry;
  private vPos!: Float32Array;
  private vCol!: Float32Array;
  private readonly cWaveWarm = new THREE.Color('#a8f0ff');
  private readonly cWaveCold = new THREE.Color('#4f8fff');
  private readonly cWave = new THREE.Color();
  private readonly cWaveIO = new THREE.Color();
  private readonly WAVE_LEN = 4.2; // spacing between wave fronts, degrees
  private wavePhase = 0;
  private pulsePhase = 0;

  // Land mask (1° grid, 1 = land) used to keep wave crests on the ocean
  private landMask: Uint8Array | null = null;

  private puffs: CloudPuff[] = [];
  // cloud towers relative to the convection centre: offsets in degrees, height above the surface
  private readonly CLOUD_BASE = 0.45;
  private readonly TOWERS = [
    { lon: 0, lat: 0, h: 1.35 },
    { lon: 6, lat: -3, h: 1.1 },
    { lon: -7, lat: 4, h: 1.0 },
    { lon: -4, lat: -6, h: 0.8 },
    { lon: 9, lat: 5, h: 0.75 }
  ];
  private readonly NR = 380;
  private rLon!: Float32Array;
  private rLat!: Float32Array;
  private rH!: Float32Array;
  private rGeo!: THREE.BufferGeometry;
  private rPos!: Float32Array;

  // Lightning: an occasional short zigzag bolt below a tower plus a flash lighting the cloud
  private boltGeo!: THREE.BufferGeometry;
  private boltPos!: Float32Array;
  private boltMat!: THREE.LineBasicMaterial;
  private boltLight!: THREE.PointLight;
  private boltT = 0;
  private nextBolt = 2;
  private readonly BOLT_SEG = 11;

  // Impact on continents: rainfall anomaly regions painted on an overlay sphere, with labels
  private impCanvas!: HTMLCanvasElement;
  private impTex!: THREE.CanvasTexture;
  private impMesh!: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  readonly rainRegions = RAIN_REGIONS;
  readonly impSign = signal(1);   // +1 El Niño pattern, −1 reversed (La Niña)
  private impDrawn = 0;           // sign the overlay canvas was last painted with
  private impA = 0;               // faded opacity
  private impPos: THREE.Vector3[] = [];
  // larger regions win when labels compete for space
  private readonly impPrio = RAIN_REGIONS.map(r => 1 + r.rx * r.ry / 1000);

  // screen-space label layout: labels queued each frame, then spread so they don't overlap
  private lblQueue: LabelSlot[] = [];
  private lblSize = new Map<HTMLElement, { w: number; h: number }>();
  private lblFrame = 0;

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
  private readonly iodPos = this.math.pos(80, 12, this.math.R * 1.01);
  private readonly cEast = new THREE.Vector3();
  private readonly cUp = new THREE.Vector3();
  private readonly cNorth = new THREE.Vector3();
  private readonly cBasis = new THREE.Matrix4();

  private lastS = 999;
  private lastMode = '';

  private rotateResumeTimer: ReturnType<typeof setTimeout> | null = null;
  private uiResizeObs: ResizeObserver | null = null;

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.initSstData();
      this.initLandOverlay();
      this.initAtmosphere();
      this.initCurrentLayer();
      this.initPins();
      this.initImpacts();
      this.applyThemeVisuals();
      this.handleResize();
      this.initUiResizeObserver();
      this.animate();
    });
  }

  ngOnDestroy() {
    this.uiResizeObs?.disconnect();
    if (this.rotateResumeTimer !== null) {
      clearTimeout(this.rotateResumeTimer);
    }
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
    }
    this.renderer?.dispose();
  }

  private initUiResizeObserver() {
    this.uiResizeObs = new ResizeObserver(() => this.handleResize());
    const headerEl = document.querySelector('.header');
    const dockEl = document.querySelector('.dock-wrap');
    if (headerEl) this.uiResizeObs.observe(headerEl);
    if (dockEl) this.uiResizeObs.observe(dockEl);
  }

  private scheduleRotateResume(delayMs = 5000) {
    if (this.rotateResumeTimer !== null) {
      clearTimeout(this.rotateResumeTimer);
    }
    this.rotateResumeTimer = setTimeout(() => {
      this.rotateResumeTimer = null;
      if (!this.state.selectedLocation()) {
        this.ngZone.run(() => {
          this.state.toggleAutoRotate(true);
        });
      }
    }, delayMs);
  }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.theme.getTokenColor('globe-bg', '#f5f7fb'));

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 400);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.minDistance = 7.5;
    this.controls.maxDistance = 40;
    this.controls.enablePan = false;
    this.controls.autoRotate = false;

    this.controls.addEventListener('start', () => {
      if (this.rotateResumeTimer !== null) {
        clearTimeout(this.rotateResumeTimer);
        this.rotateResumeTimer = null;
      }
      this.controls.autoRotate = false;
      this.ngZone.run(() => {
        this.state.toggleAutoRotate(false);
      });
    });

    this.controls.addEventListener('end', () => {
      this.scheduleRotateResume(5000);
    });

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xdbe4f0, 1.25);
    this.scene.add(this.hemiLight);

    const headLight = new THREE.DirectionalLight(0xffffff, 0.75);
    headLight.position.set(2, 3, 5);
    this.camera.add(headLight);

    // Initial camera position looking at Pacific
    const isPortrait = window.innerWidth / window.innerHeight < 0.9;
    this.math.pos(-165, 12, isPortrait ? 26 : 16, this.camera.position);
    this.controls.update();

    // Glow / uniform drop shadow shader & starry background
    this.initGlowAndStars();
  }

  private initGlowAndStars() {
    const R = this.math.R;
    // Outer halo sphere (radius R * 1.15). At the globe's limb (r = R), -dot(vN, vV) = sqrt(1 - (1/1.15)^2) = 0.4938.
    this.glowMat = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: new THREE.Color(this.theme.getTokenColor('globe-glow', '#0f172a')) },
        uOpacity: { value: 0.22 },
        uPower: { value: 2.2 }
      },
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
        uniform float uOpacity;
        uniform float uPower;
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float d = clamp(-dot(vN, vV), 0.0, 1.0);
          float t = clamp(d / 0.4938, 0.0, 1.0);
          float a = pow(t, uPower) * uOpacity;
          gl_FragColor = vec4(c, a);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.NormalBlending,
      transparent: true,
      depthWrite: false
    });

    const glow = new THREE.Mesh(new THREE.SphereGeometry(R * 1.15, 64, 32), this.glowMat);
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
    this.stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: new THREE.Color(this.theme.getTokenColor('globe-star', '#475569')),
        size: 0.6,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85
      })
    );
    this.stars.visible = true;
    this.scene.add(this.stars);
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

    this.globeMat = new THREE.MeshLambertMaterial({ map: this.sstTex });
    const globeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.math.R, 128, 64),
      this.globeMat
    );
    this.scene.add(globeMesh);
  }

  /**
   * Live view: colour the ocean with the measured sea surface temperature (same scale as the
   * Temperature view); grey wherever there is no data – near the poles, under sea ice, or when the
   * snapshot could not be loaded. Land is drawn over it by the land layer.
   */
  private recolorLiveTexture() {
    const { lut, lo, hi } = this.math.lutSst;
    const sc = 255 / (hi - lo);
    // neutral-200: lighter than the land fill (neutral-300), so 'no data' never reads as land
    const grey = new THREE.Color(this.theme.getTokenColor('globe-no-data', '#e2e8f0'));
    const gr = Math.round(grey.r * 255), gg = Math.round(grey.g * 255), gb = Math.round(grey.b * 255);
    const hasData = this.weather.status() === 'ready' && this.weather.hasSst();
    for (let r = 0; r < this.GH; r++) {
      const lat = -90 + (r + 0.5) * 180 / this.GH;
      for (let c = 0; c < this.GW; c++) {
        const o = (r * this.GW + c) * 4;
        const v = hasData ? this.weather.sst(-180 + (c + 0.5) * 360 / this.GW, lat) : NaN;
        if (Number.isNaN(v)) {
          this.texData[o] = gr;
          this.texData[o + 1] = gg;
          this.texData[o + 2] = gb;
        } else {
          const k = this.math.clamp(Math.round((v - lo) * sc), 0, 255) * 3;
          this.texData[o] = lut[k];
          this.texData[o + 1] = lut[k + 1];
          this.texData[o + 2] = lut[k + 2];
        }
        this.texData[o + 3] = 255;
      }
    }
    this.sstTex.needsUpdate = true;
  }

  private recolorTexture(s: number, mode: 'sst' | 'anom', dim = false) {
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
      if (dim) {
        // Muted, light ocean blending into the #f5f7fb background so rainfall regions stand out without grey water
        this.texData[o] = Math.round(245 * 0.62 + lut[k] * 0.38);
        this.texData[o + 1] = Math.round(247 * 0.62 + lut[k + 1] * 0.38);
        this.texData[o + 2] = Math.round(251 * 0.62 + lut[k + 2] * 0.38);
      } else {
        this.texData[o] = lut[k];
        this.texData[o + 1] = lut[k + 1];
        this.texData[o + 2] = lut[k + 2];
      }
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

    this.landMat = new THREE.MeshLambertMaterial({ map: this.landTex, transparent: true, depthWrite: false });
    const landMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.math.R * 1.003, 128, 64),
      this.landMat
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
        this.loadedLandFeature = landFeature;
        this.drawLand(landFeature);
        this.ngZone.run(() => {
          this.state.mapLoaded.set(true);
        });
      } catch (err) {
        console.warn('Could not load land data:', err);
        this.ngZone.run(() => {
          this.state.mapError.set(true);
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
    ctx.strokeStyle = this.theme.getTokenColor('globe-graticule', 'rgba(255, 255, 255, 0.10)');
    ctx.lineWidth = Wc / 2048;
    ctx.stroke();

    if (land) {
      ctx.beginPath();
      path(land);
      ctx.fillStyle = this.theme.getTokenColor('globe-land-fill', '#25332d');
      ctx.fill();
      ctx.strokeStyle = this.theme.getTokenColor('globe-land-stroke', 'rgba(205, 230, 215, 0.55)');
      ctx.lineWidth = Wc / 1800;
      ctx.stroke();
    }

    // Equator dashed line
    ctx.setLineDash([Wc / 300, Wc / 400]);
    ctx.strokeStyle = this.theme.getTokenColor('globe-equator', 'rgba(255, 255, 255, 0.22)');
    ctx.lineWidth = Wc / 2048;
    ctx.beginPath();
    ctx.moveTo(0, Y(0));
    ctx.lineTo(Wc, Y(0));
    ctx.stroke();

    if (this.landBoxes) {
      // Niño 3.4 boundary box: 170°W–120°W, 5°S–5°N
      ctx.setLineDash([Wc / 400, Wc / 600]);
      ctx.strokeStyle = this.theme.getTokenColor('globe-nino-box', 'rgba(255, 255, 255, 0.9)');
      ctx.lineWidth = Wc / 1100;
      ctx.strokeRect(X(-170), Y(5), X(-120) - X(-170), Y(-5) - Y(5));

      // Indian Ocean Dipole poles: west 50–70°E, 10°S–10°N; east 90–110°E, 10°S–0°
      ctx.strokeStyle = this.theme.getTokenColor('kind-other', 'rgba(200, 175, 255, 0.85)');
      ctx.strokeRect(X(50), Y(10), X(70) - X(50), Y(-10) - Y(10));
      ctx.strokeRect(X(90), Y(0), X(110) - X(90), Y(-10) - Y(0));
    }
    ctx.setLineDash([]);

    this.landTex.needsUpdate = true;

    if (land && land !== this.maskBuiltFor) {
      this.buildLandMask(land);
      this.maskBuiltFor = land;
    }
  }

  private buildLandMask(land: any) {
    const mc = document.createElement('canvas');
    mc.width = 360;
    mc.height = 180;
    const mctx = mc.getContext('2d', { willReadFrequently: true });
    if (!mctx) return;
    const proj = d3Geo.geoEquirectangular().scale(360 / (2 * Math.PI)).translate([180, 90]);
    mctx.beginPath();
    d3Geo.geoPath(proj, mctx)(land);
    mctx.fillStyle = '#000';
    mctx.fill();
    const px = mctx.getImageData(0, 0, 360, 180).data;
    const mask = new Uint8Array(360 * 180);
    for (let i = 0; i < mask.length; i++) mask[i] = px[i * 4 + 3] > 64 ? 1 : 0;
    this.landMask = mask;
  }

  private isLand(lon: number, lat: number): boolean {
    if (!this.landMask) return false;
    const c = Math.floor(((((lon + 180) % 360) + 360) % 360));
    const r = this.math.clamp(Math.floor(90 - lat), 0, 179);
    return this.landMask[r * 360 + c] === 1;
  }

  private initAtmosphere() {
    this.atmGroup = new THREE.Group();
    this.scene.add(this.atmGroup);

    // Normal blending with 4-component RGBA vertex colours so trails work on both dark and white oceans
    const lineMat = () => new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    // Wind streaks: each particle keeps a short history of positions drawn as a fading trail
    this.wLon = new Float32Array(this.NW);
    this.wLat = new Float32Array(this.NW);
    this.wAge = new Float32Array(this.NW);
    this.wLife = new Float32Array(this.NW);
    this.wHist = new Float32Array(this.NW * this.TRAIL * 3);
    for (let i = 0; i < this.NW; i++) {
      this.spawnWind(i);
      this.wAge[i] = Math.random() * this.wLife[i];
    }
    const wSeg = this.NW * (this.TRAIL - 1) * 2;
    this.wGeo = new THREE.BufferGeometry();
    this.wPos = new Float32Array(wSeg * 3);
    this.wCol = new Float32Array(wSeg * 4);
    this.wGeo.setAttribute('position', new THREE.BufferAttribute(this.wPos, 3));
    this.wGeo.setAttribute('color', new THREE.BufferAttribute(this.wCol, 4));
    this.atmGroup.add(new THREE.LineSegments(this.wGeo, lineMat()));

    // Wave crests: short marks perpendicular to the direction of travel
    this.vLon = new Float32Array(this.NV);
    this.vLat = new Float32Array(this.NV);
    this.vAge = new Float32Array(this.NV);
    this.vLife = new Float32Array(this.NV);
    for (let i = 0; i < this.NV; i++) {
      this.spawnWave(i);
      this.vAge[i] = Math.random() * this.vLife[i];
    }
    this.vGeo = new THREE.BufferGeometry();
    this.vPos = new Float32Array(this.NV * 4 * 3);
    this.vCol = new Float32Array(this.NV * 4 * 4);
    this.vGeo.setAttribute('position', new THREE.BufferAttribute(this.vPos, 3));
    this.vGeo.setAttribute('color', new THREE.BufferAttribute(this.vCol, 4));
    this.atmGroup.add(new THREE.LineSegments(this.vGeo, lineMat()));

    // Convective towers: stacked cumulonimbus with a dark base, billowing column and flat anvil
    const puffGeo = new THREE.SphereGeometry(1, 18, 12);
    const matBase = new THREE.MeshLambertMaterial({ color: 0x8f9bb0, transparent: true, opacity: 0.92 });
    const matMid = new THREE.MeshLambertMaterial({ color: 0xdfe5f1, transparent: true, opacity: 0.9 });
    const matTop = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    this.puffs = [];
    const add = (mat: THREE.Material, dLon: number, dLat: number, alt: number, sx: number, sy: number, sz: number) => {
      const m = new THREE.Mesh(puffGeo, mat);
      this.puffs.push({ m, dLon, dLat, alt, sx, sy, sz, ph: Math.random() * Math.PI * 2 });
      this.atmGroup.add(m);
    };
    const jit = (r: number) => (Math.random() * 2 - 1) * r;
    for (const tw of this.TOWERS) {
      // flat, dark cloud base
      for (let k = 0; k < 8; k++) {
        const r = 0.09 + Math.random() * 0.04;
        add(matBase, tw.lon + jit(1.8), tw.lat + jit(1.8), this.CLOUD_BASE, r * 1.4, r * 0.55, r * 1.4);
      }
      // billowing column: clusters of small puffs every level, narrowing slightly with height
      const levels = Math.max(2, Math.round((tw.h - this.CLOUD_BASE - 0.1) / 0.07));
      for (let l = 0; l < levels; l++) {
        const f = l / (levels - 1);
        const alt = this.CLOUD_BASE + 0.07 + f * (tw.h - this.CLOUD_BASE - 0.18);
        const spread = 1.0 - 0.35 * f;
        for (let k = 0; k < 3; k++) {
          const r = (0.085 - 0.02 * f) * (0.8 + Math.random() * 0.45);
          add(matMid, tw.lon + jit(spread), tw.lat + jit(spread), alt + jit(0.02), r, r * 0.92, r);
        }
      }
      // cauliflower top
      for (let k = 0; k < 5; k++) {
        const r = 0.07 + Math.random() * 0.03;
        add(matTop, tw.lon + jit(0.9), tw.lat + jit(0.9), tw.h - 0.06 + jit(0.03), r, r, r);
      }
      // anvil spreading out under the tropopause
      for (let k = 0; k < 10; k++) {
        const r = 0.12 + Math.random() * 0.07;
        const d = (k / 9) * 2 - 1;
        add(matTop, tw.lon + d * 3.6 + jit(0.6), tw.lat + jit(1.6), tw.h + 0.02 - 0.03 * Math.abs(d), r * 1.6, r * 0.24, r * 1.2);
      }
    }

    // Rain lines
    this.rLon = new Float32Array(this.NR);
    this.rLat = new Float32Array(this.NR);
    this.rH = new Float32Array(this.NR);
    for (let i = 0; i < this.NR; i++) {
      // rain falls from the three biggest towers
      const tw = this.TOWERS[i % 3];
      this.rLon[i] = tw.lon + (Math.random() - 0.5) * 6;
      this.rLat[i] = tw.lat + (Math.random() - 0.5) * 6;
      this.rH[i] = Math.random() * (this.CLOUD_BASE - 0.02);
    }
    this.rGeo = new THREE.BufferGeometry();
    this.rPos = new Float32Array(this.NR * 6);
    this.rGeo.setAttribute('position', new THREE.BufferAttribute(this.rPos, 3));
    this.atmGroup.add(
      new THREE.LineSegments(
        this.rGeo,
        new THREE.LineBasicMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.45 })
      )
    );

    this.boltPos = new Float32Array(this.BOLT_SEG * 2 * 3);
    this.boltGeo = new THREE.BufferGeometry();
    this.boltGeo.setAttribute('position', new THREE.BufferAttribute(this.boltPos, 3));
    this.boltMat = new THREE.LineBasicMaterial({
      color: 0xeef3ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.atmGroup.add(new THREE.LineSegments(this.boltGeo, this.boltMat));
    this.boltLight = new THREE.PointLight(0xcfdcff, 0, 1.4, 1);
    this.atmGroup.add(this.boltLight);
  }

  private initImpacts() {
    this.impCanvas = document.createElement('canvas');
    this.impCanvas.width = 2048;
    this.impCanvas.height = 1024;
    this.impTex = new THREE.CanvasTexture(this.impCanvas);
    this.impTex.colorSpace = THREE.SRGBColorSpace;
    this.impMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.math.R * 1.0045, 128, 64),
      new THREE.MeshBasicMaterial({ map: this.impTex, transparent: true, depthWrite: false, opacity: 0 })
    );
    this.impMesh.visible = false;
    this.scene.add(this.impMesh);
    this.drawImpacts(1);
    this.impPos = RAIN_REGIONS.map(r => this.math.pos(r.lon, r.lat, this.math.R * 1.01));
  }

  /** Paint the rainfall regions; sign −1 swaps drier/wetter (the rough La Niña counterpart). */
  private drawImpacts(sign: number) {
    const ctx = this.impCanvas.getContext('2d');
    if (!ctx) return;
    const W = this.impCanvas.width;
    const H = this.impCanvas.height;
    const sx = W / 360;
    const sy = H / 180;
    ctx.clearRect(0, 0, W, H);
    ctx.filter = 'blur(10px)';
    ctx.globalAlpha = 0.62;
    const dryCol = this.theme.getTokenColor('rain-dry', '#f5a623');
    const wetCol = this.theme.getTokenColor('rain-wet', '#22b8cf');
    for (const r of RAIN_REGIONS) {
      const dry = (r.kind === 'dry') === (sign > 0);
      ctx.fillStyle = dry ? dryCol : wetCol;
      // drawn three times so regions crossing the date line wrap around
      for (const off of [-360, 0, 360]) {
        ctx.beginPath();
        ctx.ellipse((r.lon + off + 180) * sx, (90 - r.lat) * sy, r.rx * sx, r.ry * sy, -(r.rot ?? 0) * Math.PI / 180, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    this.impTex.needsUpdate = true;
    this.impDrawn = sign;
  }

  private updateImpacts(s: number, dt: number) {
    const on = this.state.view() === 'impacts';
    // El Niño pattern for warm states, its rough reverse for La Niña; faint in neutral years
    const sign = s < -0.3 ? -1 : 1;
    if (on && sign !== this.impDrawn) {
      this.drawImpacts(sign);
      this.ngZone.run(() => this.impSign.set(sign));
    }
    const target = on ? 0.35 + 0.65 * this.math.clamp(Math.abs(s) / 1.5, 0, 1) : 0;
    this.impA += (target - this.impA) * Math.min(1, dt * 4);
    this.impMesh.visible = this.impA > 0.01;
    this.impMesh.material.opacity = this.impA;
    this.rainLblRefs?.forEach((ref, i) => {
      this.placeLabel(ref.nativeElement, this.impPos[i], on, Math.min(1, this.impA * 1.6), this.impPrio[i]);
    });
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

    this.pins = EVENTS_META.map(loc => {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: ringTex,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          opacity: 0
        })
      );
      sp.renderOrder = 10;
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

  private spawnWind(i: number) {
    this.wLon[i] = this.W_LON0 + Math.random() * (this.W_LON1 - this.W_LON0);
    this.wLat[i] = (Math.random() * 2 - 1) * this.W_LAT;
    this.wAge[i] = 0;
    this.wLife[i] = 3 + Math.random() * 4;
    this.math.pos(this.wLon[i], this.wLat[i], this.math.R * 1.012, this.tmpVec);
    const o = i * this.TRAIL * 3;
    for (let k = 0; k < this.TRAIL; k++) {
      this.wHist[o + k * 3] = this.tmpVec.x;
      this.wHist[o + k * 3 + 1] = this.tmpVec.y;
      this.wHist[o + k * 3 + 2] = this.tmpVec.z;
    }
  }

  private spawnWave(i: number) {
    for (let tries = 0; tries < 6; tries++) {
      const io = this.IO_LON1 - this.IO_LON0;
      const u = Math.random() * (io + this.V_LON1 - this.V_LON0);
      this.vLon[i] = u < io ? this.IO_LON0 + u : this.V_LON0 + u - io;
      // Kelvin waves are trapped at the equator: Gaussian spread in latitude
      const gauss = (Math.random() + Math.random() + Math.random() - 1.5) * 2;
      this.vLat[i] = this.math.clamp(gauss * 5, -11, 11);
      // snap onto the nearest wave front so crests line up into coherent fronts
      const L = this.WAVE_LEN;
      this.vLon[i] = this.wavePhase + Math.round((this.vLon[i] - this.wavePhase) / L) * L + (Math.random() - 0.5) * 0.9;
      if (!this.isLand(this.vLon[i], this.vLat[i])) break;
    }
    this.vAge[i] = 0;
    this.vLife[i] = 2.5 + Math.random() * 3;
  }

  /**
   * Surface wind (arbitrary units, + = eastward / northward).
   * East of the convection zone the easterly trades blow towards Asia; west of it
   * westerly winds (westerly wind bursts during El Niño) blow towards the convection.
   * Both branches converge on the equator.
   */
  private windAt(lon: number, lat: number, s: number, xc: number, t: number, out: [number, number]) {
    const T = this.math.clamp(this.math.trade(s), 0, 1.8);
    const east = 0.25 + 0.8 * T;
    const west = 0.12 + 0.5 * Math.max(0, s);
    const k = this.math.sstep(-14, 14, lon - xc);
    let u = this.math.lerp(west, -east, k);
    u *= 1 - 0.75 * this.math.g(lon, xc, 9);
    u *= 0.55 + 0.45 * Math.exp(-((Math.abs(lat) - 12) ** 2) / 160);

    // Indian Ocean: weak equatorial westerlies towards the Indonesian convection, turning easterly
    // during El Niño (the Walker cell shifts east; positive Indian Ocean Dipole), plus the steady
    // south-east trades of the southern Indian Ocean
    const io = this.math.sstep(110, 92, lon);
    if (io > 0) {
      const uEq = 0.2 + 0.25 * Math.max(0, -s) - 0.4 * Math.max(0, s);
      const uIO = uEq * Math.exp(-lat * lat / 90) - 0.55 * this.math.sstep(-5, -16, lat);
      u = this.math.lerp(u, uIO, io);
    }

    // trades converge on the ITCZ, which sits a few degrees north of the equator
    let v = -0.3 * Math.tanh((lat - 4) / 9) * (0.4 + 0.6 * Math.abs(u));

    // Slowly drifting eddies from a stream function psi = sum A*sin(kx*lon + ky*lat + w*t + phase):
    // u' = dpsi/dlat, v' = -dpsi/dlon keeps the swirl divergence-free, so streaks curl like on Windy
    const eddy = 0.45 + 0.55 * Math.min(1, Math.abs(lat) / 18);
    const E = this.EDDIES;
    for (let i = 0; i < E.length; i += 5) {
      const c = Math.cos(E[i + 1] * lon + E[i + 2] * lat + E[i + 3] * t + E[i + 4]) * E[i] * eddy;
      u += c * E[i + 2] * 10;
      v -= c * E[i + 1] * 10;
    }
    out[0] = u;
    out[1] = v;
  }

  private readonly uv: [number, number] = [0, 0];
  // eddy modes: amplitude, kx (rad/deg lon), ky (rad/deg lat), angular speed, phase
  private readonly EDDIES = [
    0.34, 0.11, 0.16, 0.05, 0.0,
    0.26, -0.15, 0.12, -0.07, 1.7,
    0.2, 0.07, -0.21, 0.04, 3.1,
    0.14, 0.23, 0.19, -0.09, 4.4
  ];

  private updateWind(s: number, dt: number, t: number, xc: number) {
    const R = this.math.R * 1.012;
    const T = this.TRAIL;
    const spd = 7.5; // degrees per second at unit wind
    const alphaScale = 0.62;
    let w = 0;
    for (let i = 0; i < this.NW; i++) {
      this.wAge[i] += dt;
      const lon = this.wLon[i];
      const lat = this.wLat[i];
      if (this.wAge[i] > this.wLife[i] || lon < this.W_LON0 - 5 || lon > this.W_LON1 + 5 || Math.abs(lat) > this.W_LAT + 3) {
        this.spawnWind(i);
      } else {
        this.windAt(lon, lat, s, xc, t, this.uv);
        this.wLon[i] += this.uv[0] * spd * dt / Math.max(0.3, Math.cos(lat * this.math.DEG));
        this.wLat[i] += this.uv[1] * spd * dt;
        // shift trail history and push the new head
        const o = i * T * 3;
        this.wHist.copyWithin(o + 3, o, o + (T - 1) * 3);
        this.math.pos(this.wLon[i], this.wLat[i], R, this.tmpVec);
        this.wHist[o] = this.tmpVec.x;
        this.wHist[o + 1] = this.tmpVec.y;
        this.wHist[o + 2] = this.tmpVec.z;
      }

      this.windAt(this.wLon[i], this.wLat[i], s, xc, t, this.uv);
      const mag = Math.min(1, Math.hypot(this.uv[0], this.uv[1]) * 0.9);
      const life = this.wAge[i] / this.wLife[i];
      const edge = this.math.sstep(this.W_LAT + 2, this.W_LAT - 8, Math.abs(this.wLat[i]))
        * this.math.sstep(this.W_LON0, this.W_LON0 + 15, this.wLon[i])
        * this.math.sstep(this.W_LON1, this.W_LON1 - 10, this.wLon[i]);
      const a = alphaScale * Math.min(1, life * 5, (1 - life) * 3) * edge * (0.35 + 0.65 * mag);

      const o = i * T * 3;
      for (let k = 0; k < T - 1; k++) {
        const fa = a * (1 - k / (T - 1)) ** 1.3;
        const fb = a * (1 - (k + 1) / (T - 1)) ** 1.3;
        for (let j = 0; j < 6; j++) this.wPos[w * 3 + j] = this.wHist[o + k * 3 + j];
        const cIdx = w * 4;
        this.wCol[cIdx] = this.cWind.r;
        this.wCol[cIdx + 1] = this.cWind.g;
        this.wCol[cIdx + 2] = this.cWind.b;
        this.wCol[cIdx + 3] = fa;
        this.wCol[cIdx + 4] = this.cWind.r;
        this.wCol[cIdx + 5] = this.cWind.g;
        this.wCol[cIdx + 6] = this.cWind.b;
        this.wCol[cIdx + 7] = fb;
        w += 2;
      }
    }
    this.wGeo.attributes['position'].needsUpdate = true;
    this.wGeo.attributes['color'].needsUpdate = true;
  }

  /** Kelvin wave fronts run fastest along the equator, so each front bulges eastward there. */
  private frontBow(lat: number): number {
    return 1.6 * Math.exp(-lat * lat / 30);
  }

  private updateWaves(s: number, dt: number, xc: number) {
    const R = this.math.R * 1.006;
    // Downwelling Kelvin waves are weak in neutral years and dominate when El Niño builds;
    // in La Niña only faint, cold (upwelling) fronts remain.
    const nino = this.math.clamp(s, 0, 1.6) / 1.6;
    const K = 0.28 + 0.72 * nino;
    const speed = 2.2 + 2.3 * K; // degrees per second, eastward; non-dispersive, so all crests share it
    this.cWave.copy(this.cWaveCold).lerp(this.cWaveWarm, this.math.clamp(0.5 + s * 0.5, 0, 1));
    // Indian Ocean: weaker equatorial Kelvin waves; during El Niño (positive dipole) they turn cold
    // (upwelling off Sumatra), during La Niña warm
    const Kio = 0.3 + 0.25 * Math.min(1, Math.abs(s));
    this.cWaveIO.copy(this.cWaveWarm).lerp(this.cWaveCold, this.math.clamp(0.5 + s * 0.5, 0, 1));
    const L = this.WAVE_LEN;
    this.wavePhase = (this.wavePhase + speed * dt) % L;

    // one main Kelvin pulse leaving the convection zone and crossing to South America
    const span = this.V_LON1 - xc + 25;
    this.pulsePhase = (this.pulsePhase + speed * dt) % span;
    const pc = xc - 10 + this.pulsePhase;

    for (let i = 0; i < this.NV; i++) {
      this.vAge[i] += dt;
      this.vLon[i] += speed * dt;
      const inIO = this.vLon[i] < this.V_LON0 - 10;
      if (this.vAge[i] > this.vLife[i] || this.vLon[i] > this.V_LON1 || (inIO && this.vLon[i] > this.IO_LON1)
        || this.isLand(this.vLon[i], this.vLat[i])) {
        this.spawnWave(i);
      }
      const lon = this.vLon[i];
      const lat = this.vLat[i];
      const life = this.vAge[i] / this.vLife[i];
      const io = lon < this.V_LON0 - 10;
      const pulse = io ? 1 : this.math.lerp(1, 0.25 + 0.75 * Math.exp(-(((lon - pc) / 22) ** 2)), nino);
      const basin = io
        ? Kio * this.math.sstep(this.IO_LON0, this.IO_LON0 + 8, lon) * this.math.sstep(this.IO_LON1, this.IO_LON1 - 5, lon)
        : K * this.math.sstep(this.V_LON0, this.V_LON0 + 10, lon) * this.math.sstep(this.V_LON1, this.V_LON1 - 6, lon);
      const a = Math.sin(Math.PI * life) * basin * pulse * 0.48
        * (0.3 + 0.7 * Math.exp(-lat * lat / 30));
      const col = io ? this.cWaveIO : this.cWave;

      // crest: a short piece of the front, brightest in the middle, fading at the tips
      const half = 0.35 + 0.55 * ((i * 0.618) % 1);
      const o = i * 12;
      const oCol = i * 16;
      this.math.pos(lon + this.frontBow(lat - half), lat - half, R, this.tmpVec);
      this.vPos[o] = this.tmpVec.x; this.vPos[o + 1] = this.tmpVec.y; this.vPos[o + 2] = this.tmpVec.z;
      this.math.pos(lon + this.frontBow(lat), lat, R, this.tmpVec);
      this.vPos[o + 3] = this.tmpVec.x; this.vPos[o + 4] = this.tmpVec.y; this.vPos[o + 5] = this.tmpVec.z;
      this.vPos[o + 6] = this.tmpVec.x; this.vPos[o + 7] = this.tmpVec.y; this.vPos[o + 8] = this.tmpVec.z;
      this.math.pos(lon + this.frontBow(lat + half), lat + half, R, this.tmpVec);
      this.vPos[o + 9] = this.tmpVec.x; this.vPos[o + 10] = this.tmpVec.y; this.vPos[o + 11] = this.tmpVec.z;
      for (let j = 0; j < 4; j++) {
        const f = j === 1 || j === 2 ? a : a * 0.1;
        this.vCol[oCol + j * 4] = col.r;
        this.vCol[oCol + j * 4 + 1] = col.g;
        this.vCol[oCol + j * 4 + 2] = col.b;
        this.vCol[oCol + j * 4 + 3] = f;
      }
    }
    this.vGeo.attributes['position'].needsUpdate = true;
    this.vGeo.attributes['color'].needsUpdate = true;
  }

  private updateAtm(s: number, dt: number, t: number) {
    const xc = this.math.convLon(s);
    this.updateWind(s, dt, t, xc);
    this.updateWaves(s, dt, xc);

    // towers grow taller with a stronger anomaly; puffs breathe slowly
    const hs = 0.85 + 0.15 * Math.min(1, Math.abs(s));
    for (const p of this.puffs) {
      const lon = xc + p.dLon;
      this.math.pos(lon, p.dLat, this.math.R + p.alt * hs, p.m.position);
      // local frame: x = east, y = up (radial), z = east x up
      this.math.pos(lon + 1, p.dLat, this.math.R, this.cEast).sub(this.math.pos(lon, p.dLat, this.math.R, this.cUp)).normalize();
      this.cUp.copy(p.m.position).normalize();
      this.cNorth.crossVectors(this.cEast, this.cUp);
      this.cBasis.makeBasis(this.cEast, this.cUp, this.cNorth);
      p.m.quaternion.setFromRotationMatrix(this.cBasis);
      const b = 1 + 0.05 * Math.sin(t * 0.5 + p.ph);
      p.m.scale.set(p.sx * b, p.sy * b, p.sz * b);
    }

    for (let i = 0; i < this.NR; i++) {
      this.rH[i] -= dt * 1.0;
      if (this.rH[i] < 0.02) this.rH[i] = this.CLOUD_BASE * hs - 0.02;
      this.math.pos(xc + this.rLon[i], this.rLat[i], this.math.R + this.rH[i], this.tmpVec);
      this.rPos.set([this.tmpVec.x, this.tmpVec.y, this.tmpVec.z], i * 6);
      this.math.pos(xc + this.rLon[i], this.rLat[i], this.math.R + this.rH[i] - 0.07, this.tmpVec);
      this.rPos.set([this.tmpVec.x, this.tmpVec.y, this.tmpVec.z], i * 6 + 3);
    }
    this.rGeo.attributes['position'].needsUpdate = true;

    this.updateLightning(dt, xc, hs);
  }

  private updateLightning(dt: number, xc: number, hs: number) {
    this.nextBolt -= dt;
    if (this.nextBolt <= 0) {
      this.nextBolt = 1.5 + Math.random() * 4;
      this.boltT = 0.35;
      // zigzag from the cloud base of one of the big towers towards the sea, with a side branch
      const tw = this.TOWERS[Math.floor(Math.random() * 3)];
      let lon = xc + tw.lon + (Math.random() - 0.5) * 2;
      let lat = tw.lat + (Math.random() - 0.5) * 2;
      let alt = this.CLOUD_BASE * hs + 0.05;
      const main = 8;
      const step = (alt - 0.02) / main;
      const pts: [number, number, number][] = [[lon, lat, alt]];
      for (let k = 0; k < main; k++) {
        lon += (Math.random() - 0.5) * 0.7;
        lat += (Math.random() - 0.5) * 0.7;
        alt -= step;
        pts.push([lon, lat, alt]);
      }
      let w = 0;
      const put = (p: [number, number, number]) => {
        this.math.pos(p[0], p[1], this.math.R + p[2], this.tmpVec);
        this.boltPos[w++] = this.tmpVec.x;
        this.boltPos[w++] = this.tmpVec.y;
        this.boltPos[w++] = this.tmpVec.z;
      };
      for (let k = 0; k < main; k++) {
        put(pts[k]);
        put(pts[k + 1]);
      }
      let b = pts[2];
      for (let k = 0; k < this.BOLT_SEG - main; k++) {
        const nb: [number, number, number] = [b[0] + 0.25 + Math.random() * 0.4, b[1] + (Math.random() - 0.5) * 0.5, b[2] - step * 0.8];
        put(b);
        put(nb);
        b = nb;
      }
      this.boltGeo.attributes['position'].needsUpdate = true;
      this.math.pos(xc + tw.lon, tw.lat, this.math.R + this.CLOUD_BASE * hs + 0.15, this.boltLight.position);
    }

    if (this.boltT > 0) {
      this.boltT -= dt;
      // a couple of quick flickers, then out
      const f = this.boltT > 0 && Math.sin(this.boltT * 60) > -0.3 ? 0.6 + 0.4 * Math.random() : 0;
      this.boltMat.opacity = f;
      this.boltLight.intensity = 3 * f;
    } else {
      this.boltMat.opacity = 0;
      this.boltLight.intensity = 0;
    }
  }

  private updatePins(t: number, dt: number) {
    const curPhase = this.state.phase();
    // historical pins belong to the ENSO model views, not to today's weather
    const showEvents = this.state.showEvents() && this.state.view() !== 'current';
    const selectedLoc = this.state.selectedLocation();

    for (const pn of this.pins) {
      const on = showEvents && pn.phases.has(curPhase);
      pn.a += ((on ? 1 : 0) - pn.a) * Math.min(1, dt * 4);

      if (on) {
        const evItem = pn.loc.ev.find(e => e.ph === curPhase);
        if (evItem) {
          pn.sp.material.color.setHex(this.math.getKindHexNumber(evItem.kind));
        }
      }
      const facing = this.facingOf(pn.p);
      const limbFade = this.math.clamp((facing - 0.08) * 5, 0, 1);
      const finalOpacity = pn.a * limbFade;
      pn.sp.material.opacity = finalOpacity;
      pn.sp.visible = finalOpacity > 0.01;

      const isHighlighted = pn === this.hoverPin || (selectedLoc && pn.loc.id === selectedLoc.id);
      const big = isHighlighted ? 1.4 : 1;
      pn.sp.scale.setScalar((0.34 + 0.05 * Math.sin(t * 3 + pn.p.x)) * big * (0.6 + 0.4 * pn.a));
    }
  }

  /** Queue a label anchored at a point on the globe; layoutLabels() positions it. */
  private placeLabel(el: HTMLElement | null, worldPos: THREE.Vector3, visible: boolean, opacity: number = 1, prio = 0) {
    if (!el) return;
    const facing = this.v3.copy(worldPos).normalize().dot(this.camDir);
    if (!visible || facing < 0.18) {
      el.style.opacity = '0';
      return;
    }
    this.v3.copy(worldPos).project(this.camera);
    this.lblQueue.push({
      el,
      x: (this.v3.x + 1) / 2 * window.innerWidth,
      y: (1 - this.v3.y) / 2 * window.innerHeight,
      a: opacity * this.math.clamp((facing - 0.18) * 4, 0, 1),
      prio
    });
  }

  /**
   * Place the queued labels above their anchors, most important first. A label that would cover
   * an already placed one is nudged up or down a line; if no slot is free it is hidden.
   */
  private layoutLabels() {
    const q = this.lblQueue;
    this.lblQueue = [];
    // read sizes before writing styles (re-measured now and then, e.g. after a language change)
    const remeasure = this.lblFrame++ % 30 === 0;
    for (const l of q) {
      if (remeasure || !this.lblSize.has(l.el)) {
        this.lblSize.set(l.el, { w: l.el.offsetWidth, h: l.el.offsetHeight });
      }
    }
    q.sort((a, b) => b.prio - a.prio);

    const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const pad = 3;
    for (const l of q) {
      const { w, h } = this.lblSize.get(l.el)!;
      const left = l.x - w / 2;
      const top = l.y - 1.4 * h;
      let dyOk: number | null = null;
      for (const k of [0, -1, 1, -2, 2, -3]) {
        const dy = k * (h + pad);
        const r = { x0: left - pad, y0: top + dy - pad, x1: left + w + pad, y1: top + dy + h + pad };
        if (!placed.some(p => r.x0 < p.x1 && r.x1 > p.x0 && r.y0 < p.y1 && r.y1 > p.y0)) {
          dyOk = dy;
          // nearly invisible labels don't claim space
          if (l.a > 0.05) placed.push(r);
          break;
        }
      }
      if (dyOk === null) {
        l.el.style.opacity = '0';
        continue;
      }
      l.el.style.opacity = l.a.toString();
      l.el.style.transform = `translate(${left}px,${top + dyOk}px)`;
    }
  }

  private updateLabels(s: number) {
    this.camDir.copy(this.camera.position).normalize();
    // the impacts view has its own region labels; the atmosphere ones would only add clutter there
    // (and in the current-situation view they describe the model, not the real weather)
    const showAtm = this.state.showAtmosphere() && this.state.view() !== 'impacts' && this.state.view() !== 'current';

    const convPos = this.math.pos(this.math.convLon(s), 10, this.math.R + 1.55);
    this.placeLabel(this.lblConvRef?.nativeElement, convPos, showAtm, 1, 4);

    const walkerPos = this.math.pos((this.math.convLon(s) + this.LE0) / 2, -18, this.math.R * 1.02);
    this.placeLabel(this.lblWalkerRef?.nativeElement, walkerPos, showAtm, 0.85 * this.math.clamp(this.math.trade(s), 0.35, 1), 2);

    const kelvinPos = this.math.pos(250, -3, this.math.R * 1.01);
    this.placeLabel(this.lblKelvinRef?.nativeElement, kelvinPos, showAtm && s > 0.3, 0.85, 3);

    // the index boxes belong to the ENSO model views, not to today's weather
    const showBoxes = this.state.view() !== 'current';
    const ninoPos = this.math.pos(-145, 5, this.math.R * 1.01);
    this.placeLabel(this.lblNinoRef?.nativeElement, ninoPos, showBoxes, 1, 5);

    // above the gap between the two dipole poles
    this.placeLabel(this.lblIodRef?.nativeElement, this.iodPos, showBoxes, 0.95, 4.5);
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

  private pinHoldTimer: ReturnType<typeof setTimeout> | null = null;
  private pinHoldTriggered = false;

  private clearPinHoldTimer() {
    if (this.pinHoldTimer !== null) {
      clearTimeout(this.pinHoldTimer);
      this.pinHoldTimer = null;
    }
  }

  onPointerDown(e: PointerEvent) {
    this.downXY = [e.clientX, e.clientY];
    this.pinHoldTriggered = false;
    this.clearPinHoldTimer();

    if (e.pointerType !== 'mouse') {
      const pn = this.pickPin(e.clientX, e.clientY, 34);
      if (pn) {
        this.pinHoldTimer = setTimeout(() => {
          this.pinHoldTimer = null;
          this.pinHoldTriggered = true;
          this.hoverPin = pn;
          const [sx, sy] = this.screenOf(pn.p);
          this.ngZone.run(() => {
            this.tooltip.show(this.i18n.location(pn.loc).name, sx, sy - 16, 'top', 1800);
          });
        }, 420);
      }
    }
  }

  onPointerUp(e: PointerEvent) {
    this.clearPinHoldTimer();
    if (!this.downXY) return;
    const moved = Math.hypot(e.clientX - this.downXY[0], e.clientY - this.downXY[1]);
    this.downXY = null;
    if (this.pinHoldTriggered) {
      this.pinHoldTriggered = false;
      this.hoverPin = null;
      return;
    }
    if (moved > 6) return;

    const pn = this.pickPin(e.clientX, e.clientY, e.pointerType === 'touch' ? 34 : 22);
    this.ngZone.run(() => {
      if (pn) {
        this.tooltip.hide();
        const loc = pn.loc;
        this.state.selectLocation(loc);
        this.popup.open({
          id: 'impact-details',
          title: computed(() => this.i18n.location(loc).name),
          subtitle: computed(() => this.i18n.location(loc).region),
          component: ImpactModalComponent,
          size: 'md',
          actions: [
            {
              label: computed(() => this.i18n.t().close),
              variant: 'default'
            }
          ],
          onClose: () => {
            this.state.selectLocation(null);
            this.scheduleRotateResume(5000);
          }
        });
      }
    });
  }

  onPointerMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse') {
      if (this.downXY && this.pinHoldTimer !== null) {
        const moved = Math.hypot(e.clientX - this.downXY[0], e.clientY - this.downXY[1]);
        if (moved > 8) {
          this.clearPinHoldTimer();
        }
      }
      return;
    }
    this.hoverPin = e.buttons ? null : this.pickPin(e.clientX, e.clientY, 22);
    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = this.hoverPin ? 'pointer' : '';

    if (this.hoverPin) {
      this.tooltip.show(this.i18n.location(this.hoverPin.loc).name, e.clientX, e.clientY - 14, 'top');
    } else {
      this.tooltip.hide();
    }
  }

  onPointerLeave() {
    this.clearPinHoldTimer();
    this.hoverPin = null;
    this.tooltip.hide();
  }

  @HostListener('window:resize')
  handleResize() {
    if (!this.renderer || !this.camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const portrait = w / h < 0.9 || isAtMost('mobile');

    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;

    // Measure occupied space at top (header) and bottom (dock) so the globe is centered in the empty space between them
    const headerEl = document.querySelector(portrait ? '.header' : '.header__left');
    const dockEl = document.querySelector('.dock-wrap');
    const topOccupied = headerEl ? Math.max(0, headerEl.getBoundingClientRect().bottom) : (portrait ? 140 : 52);
    const bottomOccupied = dockEl ? Math.max(0, h - dockEl.getBoundingClientRect().top) : 130;

    // Positive offsetY shifts the globe up; negative offsetY shifts the globe down
    const offsetY = (bottomOccupied - topOccupied) / 2;
    this.camera.setViewOffset(w, h, 0, offsetY, w, h);

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

    // the cycle keeps running in other views; only the globe itself pauses
    if (this.state.crossSectionView()) return;

    const s = this.state.sCur();
    // the impacts view shows the ocean as a muted anomaly under the rainfall regions,
    // the current-situation view as muted temperature under the real wind and waves
    const impacts = this.state.view() === 'impacts';
    const current = this.state.view() === 'current';
    const mode = impacts ? 'anom' : this.state.displayMode();

    if (current) {
      // live view: measured temperature, repainted once the snapshot arrives (or fails)
      this.weather.load();
      const liveKey = `current:${this.weather.status()}:${this.weather.data()?.time ?? ''}`;
      if (liveKey !== this.lastMode) {
        this.recolorLiveTexture();
        this.lastMode = liveKey;
      }
    } else {
      const modeKey = impacts ? 'impacts' : mode;
      if (Math.abs(s - this.lastS) > 0.004 || modeKey !== this.lastMode) {
        this.recolorTexture(s, mode, impacts);
        this.lastS = s;
        this.lastMode = modeKey;
      }
    }

    // modelled atmosphere (ENSO wind, Kelvin waves, convection) vs. real wind and waves
    this.atmGroup.visible = this.state.showAtmosphere() && !current;
    if (this.atmGroup.visible) {
      this.updateAtm(s, dt, t);
    }
    // live view: redraw the land layer without the Niño 3.4 / dipole boxes (and back)
    if (this.landBoxes === current) {
      this.landBoxes = !current;
      this.drawLand(this.loadedLandFeature);
    }

    this.currentLayer.group.visible = current;
    if (current) {
      this.currentLayer.update(dt);
    }

    if (this.state.autoRotate()) {
      const dist = this.camera.position.length();
      const targetLon = 185 + this.math.clamp(s * 18, -30, 45);
      const targetLat = 8;
      this.math.pos(targetLon, targetLat, dist, this.tmpVec);
      this.camera.position.lerp(this.tmpVec, Math.min(1, dt * 0.9)).setLength(dist);
    }
    this.controls.update();
    this.camDir.copy(this.camera.position).normalize();

    this.updatePins(t, dt);
    this.updateLabels(s);
    this.updateImpacts(s, dt);
    this.layoutLabels();

    this.renderer.render(this.scene, this.camera);
  };
}
