import { Component, ElementRef, ViewChild, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { BadgeComponent } from '../ui/badge/badge.component';
import { FlagComponent } from '../ui/flag/flag.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { ANOM_HEX, TEMP_HEX } from '../../core/constants/enso-data';
import { DisplayMode } from '../../core/models/enso.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, BadgeComponent, FlagComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);

  @ViewChild('scaleCanvas') set scaleCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.scaleRef = ref;
    if (ref) this.drawScale(this.scaleMode());
  }
  private scaleRef: ElementRef<HTMLCanvasElement> | undefined;

  /** The Walker cross-section colours the ocean by temperature, the impacts view by anomaly. */
  readonly scaleMode = computed<DisplayMode>(() => {
    const v = this.state.view();
    return v === 'walker' ? 'sst' : v === 'impacts' ? 'anom' : this.state.displayMode();
  });

  constructor() {
    effect(() => this.drawScale(this.scaleMode()));
  }

  private drawScale(mode: DisplayMode) {
    const c = this.scaleRef?.nativeElement;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const st = mode === 'sst' ? TEMP_HEX : ANOM_HEX;
    const lo = st[0][0];
    const hi = st[st.length - 1][0];
    const gr = ctx.createLinearGradient(0, 0, c.width, 0);
    st.forEach(([v, h]) => gr.addColorStop((v - lo) / (hi - lo), h));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, c.width, c.height);
  }

  readonly formattedNino = computed(() => {
    const n = this.state.nino34Value();
    const sign = n >= 0 ? '+' : '−';
    return `${sign}${Math.abs(n).toFixed(1)} °C`;
  });
}
