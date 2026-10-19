import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { ThemeService } from '@kmd/design-system/services/theme.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { WalkerCanvasText } from '../../core/i18n/i18n.types';

/** Parts of the picture a step can put in focus; everything else is dimmed. */
type Focus = 'all' | 'wind' | 'ocean' | 'thermo' | 'upwell' | 'convection' | 'aloft' | 'sink' | 'kelvin';

/** One walkthrough step; its title is Dict.steps[i] in the current language. */
interface WalkerStep {
  s: number;
  focus: Focus[];
}

interface Particle {
  th: number;
  k: number; // radial factor: 1 = outer loop, smaller = inner loops
}

const FOCUS_KEYS: Focus[] = ['wind', 'ocean', 'thermo', 'upwell', 'convection', 'aloft', 'sink', 'kelvin'];

const STEPS: WalkerStep[] = [
  { s: 0, focus: ['all'] },
  { s: 0, focus: ['wind'] },
  { s: 0, focus: ['ocean', 'thermo', 'wind'] },
  { s: 0, focus: ['upwell', 'thermo'] },
  { s: 0, focus: ['convection'] },
  { s: 0, focus: ['aloft'] },
  { s: 0, focus: ['sink', 'wind', 'convection', 'aloft'] },
  { s: -1.6, focus: ['all'] },
  { s: 0.8, focus: ['kelvin', 'ocean', 'thermo', 'wind'] },
  { s: 1.6, focus: ['all'] },
  { s: 2.6, focus: ['all'] },
  { s: 0, focus: ['all'] }
];

/** Seconds each step stays on screen while auto-playing. */
const STEP_SECONDS = 7;

// Cross-section extent: 100°E … 70°W along the equator
const LON0 = 100;
const LON1 = 290;
const Z_TOP = 18;      // km shown above the surface
const SEA_DEPTH = 300; // m shown below the surface

@Component({
  selector: 'app-walker-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './walker-view.component.html',
  styleUrl: './walker-view.component.scss'
})
export class WalkerViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('box') boxRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cv') canvasRef!: ElementRef<HTMLCanvasElement>;

  state = inject(EnsoStateService);
  private math = inject(EnsoMathService);
  private theme = inject(ThemeService);
  i18n = inject(I18nService);
  private ngZone = inject(NgZone);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly playIcon = Play;
  readonly pauseIcon = Pause;

  readonly steps = STEPS;
  /** Current walkthrough step; −1 = not started, the view just shows the current ENSO state. */
  readonly step = signal(-1);
  readonly playing = signal(false);

  readonly badge = computed(() => {
    const t = this.i18n.t();
    if (this.state.isPlaying()) return t.walkerCycle;
    const i = this.step();
    if (i < 0) return t.walkerNow;
    return i === 0 ? 'start' : `${i}/${STEPS.length - 1}`;
  });

  readonly caption = computed(() => {
    const t = this.i18n.t();
    if (this.state.isPlaying()) return t.walkerCycleCaption(this.state.monthText());
    if (this.step() < 0) return t.walkerCurrent(this.state.category().name);
    return t.steps[this.step()];
  });

  private ctx!: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private resizeObs: ResizeObserver | null = null;
  private animId: number | null = null;
  private lastTime = 0;
  private t = 0;
  private stepClock = 0;
  private lastSetS = 0;

  // smoothed focus alpha per element
  private fa: Record<Focus, number> = {
    all: 1, wind: 1, ocean: 1, thermo: 1, upwell: 1, convection: 1, aloft: 1, sink: 1, kelvin: 1
  };

  // ocean temperature image, rendered at low resolution and stretched
  private oceanCanvas = document.createElement('canvas');
  private oceanImg: ImageData | null = null;
  private oceanS = 999;

  private eastCell: Particle[] = [];
  private westCell: Particle[] = [];
  private rainX = new Float32Array(46);
  private rainZ = new Float32Array(46);
  private puffs: { dLon: number; z: number; r: number; flat: number }[] = [];
  private boltT = 0;
  private nextBolt = 2;
  private bolt: [number, number][] = [];

  ngOnInit() {
    this.lastSetS = this.state.sTarget();
  }

  ngAfterViewInit() {
    const c = this.canvasRef.nativeElement;
    this.ctx = c.getContext('2d')!;
    this.oceanCanvas.width = 190;
    this.oceanCanvas.height = 48;
    this.oceanImg = this.oceanCanvas.getContext('2d')!.createImageData(190, 48);
    this.initScene();

    this.ngZone.runOutsideAngular(() => {
      this.resizeObs = new ResizeObserver(() => this.resize());
      this.resizeObs.observe(this.boxRef.nativeElement);
      this.resize();
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this.frame);
    });
  }

  ngOnDestroy() {
    if (this.animId !== null) cancelAnimationFrame(this.animId);
    this.resizeObs?.disconnect();
  }

  // ─── Step controls ─────────────────────────────────────────────────────────

  go(i: number) {
    const n = STEPS.length;
    const idx = ((i % n) + n) % n;
    this.step.set(idx);
    this.stepClock = 0;
    this.lastSetS = STEPS[idx].s;
    this.state.setPreset(STEPS[idx].s);
  }

  private advance() {
    this.go(this.step() + 1);
  }

  next() {
    this.pick(this.step() + 1);
  }

  prev() {
    this.pick(this.step() < 0 ? STEPS.length - 1 : this.step() - 1);
  }

  pick(i: number) {
    this.playing.set(false);
    this.go(i);
  }

  togglePlay() {
    if (this.playing()) {
      this.playing.set(false);
      return;
    }
    this.playing.set(true);
    this.go(Math.max(0, this.step()));
  }

  // ─── Scene ─────────────────────────────────────────────────────────────────

  private initScene() {
    const mk = (n: number) => Array.from({ length: n }, () => ({
      th: Math.random() * Math.PI * 2,
      k: 0.62 + Math.random() * 0.38
    }));
    this.eastCell = mk(240);
    this.westCell = mk(140);

    for (let i = 0; i < this.rainX.length; i++) {
      this.rainX[i] = (Math.random() - 0.5) * 9;
      this.rainZ[i] = Math.random() * 2.2;
    }

    const j = (r: number) => (Math.random() * 2 - 1) * r;
    for (let k = 0; k < 9; k++) this.puffs.push({ dLon: j(4.5), z: 2.4 + j(0.3), r: 2.2 + Math.random() * 0.9, flat: 0.5 });
    for (let z = 3.2; z < 11.5; z += 0.6) {
      const w = 3.2 - (z - 3) * 0.12;
      for (let k = 0; k < 3; k++) this.puffs.push({ dLon: j(w), z: z + j(0.25), r: 1.9 + Math.random() * 0.9, flat: 1 });
    }
    for (let k = 0; k < 5; k++) this.puffs.push({ dLon: j(2), z: 11.8 + j(0.3), r: 1.6 + Math.random() * 0.6, flat: 1 });
    for (let k = 0; k < 11; k++) {
      const d = (k / 10) * 2 - 1;
      this.puffs.push({ dLon: d * 8 + j(0.8), z: 13 - Math.abs(d) * 0.6 + j(0.15), r: 2.4 + Math.random() * 1, flat: 0.3 });
    }
  }

  private resize() {
    const box = this.boxRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = box.clientWidth;
    this.H = box.clientHeight;
    const c = this.canvasRef.nativeElement;
    c.width = Math.max(1, Math.round(this.W * dpr));
    c.height = Math.max(1, Math.round(this.H * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private frame = (now: number) => {
    this.animId = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.t += dt;

    if (this.playing() && (this.state.isPlaying() || Math.abs(this.state.sTarget() - this.lastSetS) > 1e-6)) {
      this.ngZone.run(() => this.playing.set(false));
    }
    if (this.playing()) {
      this.stepClock += dt;
      if (this.stepClock > STEP_SECONDS) this.ngZone.run(() => this.advance());
    }

    const focus = this.state.isPlaying() || this.step() < 0 ? ['all'] : STEPS[this.step()].focus;
    const all = focus.includes('all');
    for (const k of FOCUS_KEYS) {
      const target = all || focus.includes(k) ? 1 : 0.18;
      this.fa[k] += (target - this.fa[k]) * Math.min(1, dt * 4);
    }

    if (this.W > 0 && this.H > 0) this.draw(dt);
  };

  // ─── Drawing ───────────────────────────────────────────────────────────────

  private X(lon: number) { return (lon - LON0) / (LON1 - LON0) * this.W; }
  private get axisH() { return 22; }
  private get ys() { return (this.H - this.axisH) * 0.66; }
  private get yo() { return this.H - this.axisH; }
  private zY(z: number) { return this.ys - z / Z_TOP * this.ys; }
  private dY(m: number) { return this.ys + m / SEA_DEPTH * (this.yo - this.ys); }

  private draw(dt: number) {
    const ctx = this.ctx;
    const L = this.i18n.t().canvas;
    const { W, H } = this;
    const s = this.state.sCur();
    const ys = this.ys;
    const xc = Math.max(128, this.math.convLon(s));
    const trade = this.math.trade(s);

    ctx.clearRect(0, 0, W, H);

    // sky derived from SCSS tokens
    const sky = ctx.createLinearGradient(0, 0, 0, ys);
    sky.addColorStop(0, this.theme.getTokenColor('walker-sky-top', '#0a1222'));
    sky.addColorStop(1, this.theme.getTokenColor('walker-sky-bottom', '#1a2a47'));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, ys);

    // tropopause
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(200, 215, 240, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, this.zY(16));
    ctx.lineTo(W, this.zY(16));
    ctx.stroke();
    ctx.restore();
    this.text(L.tropopause, W - 8, this.zY(16) - 6, 'right', 'rgba(200, 215, 240, 0.65)');

    this.drawOcean(s);
    this.drawThermocline(s, L.thermocline);
    this.drawUpwelling(trade);
    this.drawKelvin(s, xc, L.kelvin);
    this.drawLand(L.indonesia, L.andes);
    this.drawNinoBox();

    const eS = this.math.clamp(trade, 0, 1.8);
    const wS = this.math.clamp((s - 0.4) / 1.4, 0, 1);
    this.drawCell(this.eastCell, xc, 268, 1, eS, dt);
    if (wS > 0.01) this.drawCell(this.westCell, 112, xc, -1, wS * 0.8, dt);

    this.drawCloud(xc, dt);
    this.drawLabels(s, xc, eS, wS, L);
    this.drawAxis();
  }

  private text(str: string, x: number, y: number, align: CanvasTextAlign, color: string, bold = false) {
    const ctx = this.ctx;
    ctx.font = `${bold ? '600 ' : ''}11px ${this.theme.getFontFamily()}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  private drawOcean(s: number) {
    if (Math.abs(s - this.oceanS) > 0.01 && this.oceanImg) {
      const { lut, lo, hi } = this.math.lutSst;
      const sc = 255 / (hi - lo);
      const d = this.oceanImg.data;
      const ow = this.oceanCanvas.width;
      const oh = this.oceanCanvas.height;
      for (let px = 0; px < ow; px++) {
        const lon = LON0 + (px + 0.5) / ow * (LON1 - LON0);
        for (let py = 0; py < oh; py++) {
          const v = this.math.secTemp(lon, -4 * (py + 0.5) / oh, s);
          const k = this.math.clamp(Math.round((v - lo) * sc), 0, 255) * 3;
          const o = (py * ow + px) * 4;
          d[o] = lut[k];
          d[o + 1] = lut[k + 1];
          d[o + 2] = lut[k + 2];
          d[o + 3] = 255;
        }
      }
      this.oceanCanvas.getContext('2d')!.putImageData(this.oceanImg, 0, 0);
      this.oceanS = s;
    }
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.oceanCanvas, 0, this.ys, this.W, this.yo - this.ys);
    const dim = (1 - this.fa.ocean) * 0.55;
    if (dim > 0.01) {
      ctx.fillStyle = `rgba(4, 8, 18, ${dim})`;
      ctx.fillRect(0, this.ys, this.W, this.yo - this.ys);
    }
  }

  private thermoDepth(lon: number, s: number) {
    const d = -this.math.thermo((lon - 200) / 80, s);
    return this.math.clamp(d, 0, 4) / 4 * SEA_DEPTH;
  }

  private drawThermocline(s: number, label: string) {
    const ctx = this.ctx;
    const a = 0.25 + 0.75 * this.fa.thermo;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * a})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let lon = LON0; lon <= 280; lon += 2) {
      const x = this.X(lon);
      const y = this.dY(this.thermoDepth(lon, s));
      if (lon === LON0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    this.text(label, this.X(104), this.dY(this.thermoDepth(104, s)) - 5, 'left', `rgba(255, 255, 255, ${0.8 * a})`);
  }

  private drawUpwelling(trade: number) {
    const a = this.math.clamp(trade, 0, 1.6) / 1.6 * this.fa.upwell;
    if (a < 0.02) return;
    const ctx = this.ctx;
    ctx.strokeStyle = `rgba(150, 215, 255, ${0.9 * a})`;
    ctx.lineWidth = 1.6;
    const top = this.ys + 4;
    const bottom = this.dY(170);
    for (let i = 0; i < 4; i++) {
      const x = this.X(262 + i * 4.2);
      for (let k = 0; k < 3; k++) {
        const f = ((this.t * 0.45 + k / 3 + i * 0.13) % 1);
        const y = bottom + (top - bottom) * f;
        const fade = Math.sin(Math.PI * f);
        ctx.globalAlpha = fade;
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 4);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 4, y + 4);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawKelvin(s: number, xc: number, label: string) {
    const a = this.math.clamp(s / 1.2, 0, 1) * this.fa.kelvin;
    if (a < 0.02) return;
    const ctx = this.ctx;
    const span = 276 - xc;
    const lon = xc + ((this.t * 14) % span);
    const x = this.X(lon);
    const y = this.dY(this.thermoDepth(lon, s));
    const rx = this.X(LON0 + 7);
    const ry = (this.yo - this.ys) * 0.28;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, `rgba(255, 170, 70, ${0.55 * a})`);
    g.addColorStop(1, 'rgba(255, 170, 70, 0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.translate(-x, -y);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    this.text(label, x, this.dY(28), 'center', `rgba(255, 210, 160, ${a})`, true);
  }

  private drawLand(indonesia: string, andes: string) {
    const ctx = this.ctx;
    const ys = this.ys;
    const landCol = this.theme.getTokenColor('walker-land', '#121a1a');
    const hills: [number, number][] = [[100, 0], [101, 0.9], [104, 1.5], [107, 0.9], [110, 1.9], [114, 1.1], [118, 2.1], [122, 1.2], [125, 1.5], [128, 0]];
    ctx.fillStyle = landCol;
    ctx.beginPath();
    ctx.moveTo(this.X(100), ys);
    for (const [lon, z] of hills) ctx.lineTo(this.X(lon), this.zY(z));
    ctx.closePath();
    ctx.fill();
    this.text(indonesia, this.X(101.5), this.zY(2.6), 'left', 'rgba(220, 230, 245, 0.8)');

    ctx.fillStyle = landCol;
    ctx.beginPath();
    ctx.moveTo(this.X(279), this.yo);
    ctx.lineTo(this.X(279), ys);
    ctx.lineTo(this.X(281), this.zY(0.8));
    ctx.lineTo(this.X(283.5), this.zY(6.2));
    ctx.lineTo(this.X(285), this.zY(4.6));
    ctx.lineTo(this.X(287), this.zY(5.3));
    ctx.lineTo(this.X(290), this.zY(2.5));
    ctx.lineTo(this.X(290), this.yo);
    ctx.closePath();
    ctx.fill();
    this.text(andes, this.W - 8, this.zY(7), 'right', 'rgba(220, 230, 245, 0.8)');
  }

  private drawNinoBox() {
    const ctx = this.ctx;
    const x0 = this.X(190);
    const x1 = this.X(240);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, this.ys - 6, x1 - x0, this.dY(40) - this.ys + 6);
    ctx.restore();
    this.text('Niño 3.4', x0 + 2, this.ys - 10, 'left', 'rgba(255, 255, 255, 0.9)', true);
  }

  private drawCell(ps: Particle[], lonW: number, lonE: number, dir: number, strength: number, dt: number) {
    if (lonE - lonW < 8) return;
    const ctx = this.ctx;
    const speed = (0.12 + 0.3 * strength) * dir;
    const cellA = this.math.clamp(0.15 + strength * 0.85, 0, 1);
    const low = new Float32Array(2);
    const pt = (th: number, k: number, out: Float32Array) => {
      const c = Math.cos(th);
      const sn = Math.sin(th);
      const cx = (lonW + lonE) / 2;
      const rx = (lonE - lonW) / 2 * k;
      const zc = 7.2;
      const rz = 5.8 * k;
      out[0] = this.X(cx + rx * Math.sign(c) * Math.abs(c) ** 0.5);
      out[1] = this.zY(zc - rz * Math.sign(sn) * Math.abs(sn) ** 0.5);
    };
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    for (const p of ps) {
      p.th += speed * dt * (1.2 - 0.3 * p.k);
      const th = ((p.th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      let branch: Focus;
      if (th > Math.PI / 4 && th < Math.PI * 3 / 4) branch = 'wind';
      else if (th > Math.PI * 5 / 4 && th < Math.PI * 7 / 4) branch = 'aloft';
      else {
        const westEnd = th >= Math.PI * 3 / 4 && th <= Math.PI * 5 / 4;
        branch = westEnd === (dir === 1) ? 'convection' : 'sink';
      }
      const a = cellA * this.fa[branch] * 0.9;
      if (a < 0.02) continue;
      const h = (1 - Math.sin(th)) / 2;
      const r = Math.round(255 + (156 - 255) * h);
      const g = Math.round(214 + (196 - 214) * h);
      const b = Math.round(160 + (255 - 160) * h);
      pt(p.th, p.k, low);
      let px = low[0];
      let py = low[1];
      for (let k = 1; k <= 4; k++) {
        pt(p.th - dir * k * 0.028, p.k, low);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a * (1 - k / 5)})`;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(low[0], low[1]);
        ctx.stroke();
        px = low[0];
        py = low[1];
      }
    }
  }

  private drawCloud(xc: number, dt: number) {
    const a = this.fa.convection;
    const ctx = this.ctx;
    const pxDeg = this.W / (LON1 - LON0);
    const pxKm = this.ys / Z_TOP;

    ctx.strokeStyle = `rgba(160, 200, 240, ${0.5 * a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < this.rainX.length; i++) {
      this.rainZ[i] -= dt * 1.6;
      if (this.rainZ[i] < 0) this.rainZ[i] = 2.2;
      const x = this.X(xc + this.rainX[i]);
      const y = this.zY(this.rainZ[i]);
      ctx.moveTo(x, y);
      ctx.lineTo(x - 1, y + 7);
    }
    ctx.stroke();

    this.nextBolt -= dt;
    if (this.nextBolt <= 0) {
      this.nextBolt = 1.5 + Math.random() * 3.5;
      this.boltT = 0.3;
      let lon = xc + (Math.random() - 0.5) * 4;
      this.bolt = [];
      for (let z = 2.2; z >= 0; z -= 0.37) {
        this.bolt.push([lon, z]);
        lon += (Math.random() - 0.5) * 0.9;
      }
    }
    if (this.boltT > 0) {
      this.boltT -= dt;
      if (Math.sin(this.boltT * 60) > -0.3) {
        ctx.strokeStyle = `rgba(235, 242, 255, ${0.95 * a})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(190, 210, 255, 0.9)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        this.bolt.forEach(([lon, z], i) => {
          if (i === 0) ctx.moveTo(this.X(lon), this.zY(z));
          else ctx.lineTo(this.X(lon), this.zY(z));
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    for (const p of this.puffs) {
      const x = this.X(xc + p.dLon);
      const y = this.zY(p.z);
      const rx = p.r * pxDeg;
      const ry = Math.min(rx, p.r * pxKm * 0.9) * p.flat;
      const lum = Math.round(150 + 100 * Math.min(1, p.z / 12));
      ctx.fillStyle = `rgba(${lum - 8}, ${lum - 2}, ${lum + 5}, ${0.92 * a})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, Math.max(2, ry), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLabels(s: number, xc: number, eS: number, wS: number, L: WalkerCanvasText) {
    const dimText = (k: Focus, base = 0.85) => `rgba(220, 230, 248, ${base * (0.2 + 0.8 * this.fa[k])})`;
    const eA = this.math.clamp(eS, 0.15, 1);
    if (268 - xc > 30) {
      this.text(L.trades, this.X((xc + 268) / 2 + 8), this.zY(0.35) - 3, 'center', dimText('wind', 0.9 * eA), true);
      this.text(L.aloft, this.X((xc + 268) / 2 + 8), this.zY(14.4), 'center', dimText('aloft', 0.8 * eA));
      this.text(L.sinkDry, this.X(266), this.zY(8.2), 'right', dimText('sink', 0.8 * eA));
    }
    this.text(L.rising, this.X(xc), this.zY(15), 'center', dimText('convection'), true);
    if (wS > 0.05) {
      this.text(L.sinkDrought, this.X(113), this.zY(8.2), 'left', `rgba(255, 196, 140, ${0.85 * wS})`, true);
      this.text(L.westerly, this.X((112 + xc) / 2), this.zY(0.35) - 3, 'center', `rgba(255, 214, 170, ${0.85 * wS})`);
    }
    if (s < 1) {
      this.text(L.warmPool, this.X(134), this.dY(26), 'center', `rgba(255, 235, 215, ${0.85 * (0.25 + 0.75 * this.fa.ocean)})`, true);
    }
    if (s < 0.6) {
      this.text(L.coldTongue, this.X(254), this.dY(26), 'center', `rgba(220, 240, 255, ${0.85 * (0.25 + 0.75 * this.fa.ocean)})`, true);
    }
  }

  private drawAxis() {
    const ticks: [number, string][] = [[120, '120°E'], [150, '150°E'], [180, '180°'], [210, '150°W'], [240, '120°W'], [270, '90°W']];
    for (const [lon, label] of ticks) {
      this.text(label, this.X(lon), this.H - 6, 'center', 'rgba(180, 196, 224, 0.9)');
    }
  }
}
