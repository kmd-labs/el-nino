import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ExternalLink } from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { ThemeService } from '@kmd/design-system/services/theme.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { BadgeComponent } from '@kmd/design-system/ui/badge/badge.component';

/** Resolution of the temperature field; it is scaled up to the canvas so dragging the slider stays cheap. */
const FIELD_W = 440;
const FIELD_H = 135;

/**
 * Full-screen equatorial thermocline cross-section (Pacific, 0–300 m), shown as its own view
 * like the Walker cell so the dock's time slider keeps driving it.
 */
@Component({
  selector: 'app-thermocline-view',
  standalone: true,
  imports: [CommonModule, BadgeComponent, LucideAngularModule],
  templateUrl: './thermocline-view.component.html',
  styleUrl: './thermocline-view.component.scss'
})
export class ThermoclineViewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('box') boxRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cv') canvasRef!: ElementRef<HTMLCanvasElement>;

  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  private math = inject(EnsoMathService);
  private theme = inject(ThemeService);

  readonly externalLinkIcon = ExternalLink;

  readonly formattedNino = computed(() => {
    const n = this.state.nino34Value();
    return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)} °C`;
  });

  private field = document.createElement('canvas');
  private fieldImg: ImageData | null = null;
  private resizeObs: ResizeObserver | null = null;
  private ready = false;

  constructor() {
    this.field.width = FIELD_W;
    this.field.height = FIELD_H;
    effect(() => {
      // redraw whenever the animated strength or language changes
      this.state.sCur();
      this.i18n.lang();
      if (this.ready) this.draw();
    });
  }

  ngAfterViewInit() {
    this.resizeObs = new ResizeObserver(() => {
      this.resize();
      this.draw();
    });
    this.resizeObs.observe(this.boxRef.nativeElement);
    this.ready = true;
    this.resize();
    this.draw();
  }

  ngOnDestroy() {
    this.resizeObs?.disconnect();
  }

  private resize() {
    const box = this.boxRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = this.canvasRef.nativeElement;
    c.width = Math.max(1, Math.round(box.clientWidth * dpr));
    c.height = Math.max(1, Math.round(box.clientHeight * dpr));
  }

  private paintField(s: number) {
    const fctx = this.field.getContext('2d')!;
    if (!this.fieldImg) this.fieldImg = fctx.createImageData(FIELD_W, FIELD_H);
    const { lut, lo, hi } = this.math.lutSst;
    const sc = 255 / (hi - lo);
    const d = this.fieldImg.data;
    for (let px = 0; px < FIELD_W; px++) {
      const lon = 120 + 160 * px / (FIELD_W - 1);
      for (let py = 0; py < FIELD_H; py++) {
        const y = -4 * py / (FIELD_H - 1);
        const v = this.math.secTemp(lon, y, s);
        const k = this.math.clamp(Math.round((v - lo) * sc), 0, 255) * 3;
        const o = (py * FIELD_W + px) * 4;
        d[o] = lut[k];
        d[o + 1] = lut[k + 1];
        d[o + 2] = lut[k + 2];
        d[o + 3] = 255;
      }
    }
    fctx.putImageData(this.fieldImg, 0, 0);
  }

  private draw() {
    const c = this.canvasRef?.nativeElement;
    const ctx = c?.getContext('2d');
    if (!c || !ctx || c.width < 2) return;
    const dpr = c.width / this.boxRef.nativeElement.clientWidth;
    const Wd = c.width / dpr;
    const Hd = c.height / dpr;
    const s = this.state.sCur();

    this.paintField(s);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.field, 0, 0, Wd, Hd);

    const ink = this.theme.getTokenColor('text-bright', '#ffffff');
    const halo = this.theme.getTokenColor('panel-bg-solid', '#000000');

    // thermocline contour
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let px = 0; px <= Wd; px += 3) {
      const u = (120 + 160 * px / Wd - 200) / 80;
      const py = -this.math.thermo(u, s) / 4 * Hd;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.font = '600 12px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillStyle = ink;
    ctx.shadowColor = halo;
    ctx.shadowBlur = 4;
    ctx.textAlign = 'left';
    ctx.fillText(this.i18n.t().thermoChip, 12, -this.math.thermo(-0.9, s) / 4 * Hd - 8);
    ctx.fillText('120°E', 10, Hd - 8);
    ctx.textAlign = 'center';
    ctx.fillText('180°', Wd * 0.375, Hd - 8);
    ctx.textAlign = 'right';
    ctx.fillText('80°W', Wd - 10, Hd - 8);
    ctx.fillText('300 m', Wd - 10, 18);
    ctx.shadowBlur = 0;
  }
}
