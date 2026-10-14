import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { PRESETS } from '../../core/constants/enso-data';
import { DisplayMode, Preset } from '../../core/models/enso.model';
import { ButtonComponent } from '../ui/button/button.component';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss'
})
export class ControlPanelComponent implements AfterViewInit, OnDestroy {
  state = inject(EnsoStateService);
  math = inject(EnsoMathService);

  readonly presets = PRESETS;

  @ViewChild('sectionCanvas') sectionCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('panel') panelRef!: ElementRef<HTMLDivElement>;

  private resizeObs: ResizeObserver | null = null;

  private secImgData: ImageData | null = null;
  private lastDrawnS = 9999;
  private lastDrawnMode = '';

  constructor() {
    effect(() => {
      const s = this.state.sCur();
      const m = this.state.displayMode();
      if (this.sectionCanvasRef) {
        if (Math.abs(s - this.lastDrawnS) > 0.005 || m !== this.lastDrawnMode) {
          this.drawSection(s, m);
          this.lastDrawnS = s;
          this.lastDrawnMode = m;
        }
      }
    });
  }

  ngAfterViewInit() {
    const secCanvas = this.sectionCanvasRef.nativeElement;
    const secCtx = secCanvas.getContext('2d');
    if (secCtx) {
      this.secImgData = secCtx.createImageData(secCanvas.width, secCanvas.height);
    }
    this.drawSection(this.state.sCur(), this.state.displayMode());

    // expose the panel height so the Walker view can end just above it on narrow screens
    this.resizeObs = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--panel-h', `${this.panelRef.nativeElement.offsetHeight}px`);
    });
    this.resizeObs.observe(this.panelRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObs?.disconnect();
  }

  onPresetClick(p: Preset) {
    this.state.setPreset(p.strength);
  }

  onSliderInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.state.setStrengthTarget(parseFloat(input.value));
  }

  onPlayClick() {
    this.state.togglePlaying();
  }

  togglePanel() {
    this.state.togglePanel();
  }

  private drawSection(s: number, mode: DisplayMode) {
    const c = this.sectionCanvasRef?.nativeElement;
    if (!c || !this.secImgData) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

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

    // Draw thermocline contour curve
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let px = 0; px < Wd; px += 4) {
      const u = (120 + 160 * px / (Wd - 1) - 200) / 80;
      const py = -this.math.thermo(u, s) / 4 * (Hd - 1);
      if (px === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Inset labels
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;

    ctx.fillText('Termoklina', 8, -this.math.thermo(-0.9, s) / 4 * (Hd - 1) - 5);
    ctx.fillText('120°E', 4, Hd - 5);
    ctx.fillText('180°', Wd * 0.375 - 10, Hd - 5);
    ctx.fillText('80°W', Wd - 32, Hd - 5);
    ctx.fillText('300 m', Wd - 34, 12);
    ctx.shadowBlur = 0;
  }
}
