import {
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  inject,
  effect,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { PRESETS } from '../../core/constants/enso-data';
import { DisplayMode, Preset } from '../../core/models/enso.model';
import { ButtonComponent } from '../ui/button/button.component';
import { I18nService } from '../../core/i18n/i18n.service';

type Popup = 'thermo' | 'desc' | null;

/**
 * ENSO state bar above the view dock: presets, strength slider with the 2026 likelihood,
 * the 4-year cycle and pop-ups with the thermocline cross-section and the phase description.
 */
@Component({
  selector: 'app-enso-bar',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './enso-bar.component.html',
  styleUrl: './enso-bar.component.scss',
  host: { '[class.is-collapsed]': 'collapsed()' }
})
export class EnsoBarComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  private math = inject(EnsoMathService);

  readonly presets = PRESETS;
  readonly popup = signal<Popup>(null);
  /** Folded to the left edge, leaving only a tab. */
  readonly collapsed = signal(false);

  @ViewChild('sectionCanvas') set sectionCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    // the canvas exists only while the thermocline pop-up is open
    this.sectionRef = ref;
    this.secImgData = null;
    this.lastDrawnS = 9999;
    if (ref) this.drawSection(this.state.sCur(), this.state.displayMode());
  }

  private sectionRef: ElementRef<HTMLCanvasElement> | undefined;
  private secImgData: ImageData | null = null;
  private lastDrawnS = 9999;
  private lastDrawnMode = '';
  private lastDrawnLang = '';

  constructor() {
    effect(() => {
      const s = this.state.sCur();
      const m = this.state.displayMode();
      const lang = this.i18n.lang(); // the cross-section carries a translated label
      if (this.sectionRef && (Math.abs(s - this.lastDrawnS) > 0.005 || m !== this.lastDrawnMode || lang !== this.lastDrawnLang)) {
        this.drawSection(s, m);
      }
    });
  }

  fold() {
    this.popup.set(null);
    this.collapsed.set(true);
  }

  toggle(p: Exclude<Popup, null>) {
    this.popup.update(v => v === p ? null : p);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.popup.set(null);
  }

  onPresetClick(p: Preset) {
    this.state.setPreset(p.strength);
  }

  onSliderInput(event: Event) {
    this.state.setStrengthTarget(parseFloat((event.target as HTMLInputElement).value));
  }

  private drawSection(s: number, mode: DisplayMode) {
    const c = this.sectionRef?.nativeElement;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    if (!this.secImgData) this.secImgData = ctx.createImageData(c.width, c.height);

    const Wd = c.width;
    const Hd = c.height;
    const { lut, lo, hi } = mode === 'sst' ? this.math.lutSst : this.math.lutAnom;
    const sc = 255 / (hi - lo);
    const d = this.secImgData.data;

    for (let px = 0; px < Wd; px++) {
      const lon = 120 + 160 * px / (Wd - 1);
      for (let py = 0; py < Hd; py++) {
        const y = -4 * py / (Hd - 1);
        let v = this.math.secTemp(lon, y, s);
        if (mode !== 'sst') {
          v -= this.math.secTemp(lon, y, 0);
        }
        const k = this.math.clamp(Math.round((v - lo) * sc), 0, 255) * 3;
        const o = (py * Wd + px) * 4;
        d[o] = lut[k];
        d[o + 1] = lut[k + 1];
        d[o + 2] = lut[k + 2];
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(this.secImgData, 0, 0);

    // thermocline contour
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let px = 0; px < Wd; px += 4) {
      const u = (120 + 160 * px / (Wd - 1) - 200) / 80;
      const py = -this.math.thermo(u, s) / 4 * (Hd - 1);
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.fillText(this.i18n.t().thermoChip, 8, -this.math.thermo(-0.9, s) / 4 * (Hd - 1) - 5);
    ctx.fillText('120°E', 4, Hd - 5);
    ctx.fillText('180°', Wd * 0.375 - 10, Hd - 5);
    ctx.fillText('80°W', Wd - 32, Hd - 5);
    ctx.fillText('300 m', Wd - 34, 12);
    ctx.shadowBlur = 0;

    this.lastDrawnS = s;
    this.lastDrawnMode = mode;
    this.lastDrawnLang = this.i18n.lang();
  }
}
