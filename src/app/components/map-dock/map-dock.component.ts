import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { TEMP_HEX, ANOM_HEX, KIND_HEX } from '../../core/constants/enso-data';
import { IMPACT_SOURCES } from '../../core/constants/impacts-data';
import { DisplayMode } from '../../core/models/enso.model';
import { ButtonComponent } from '../ui/button/button.component';

/**
 * Bottom dock with view settings: view (temperature / anomaly / Walker circulation) with its colour scale,
 * layer toggles and — when pins are shown — the legend of impact kinds.
 */
@Component({
  selector: 'app-map-dock',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './map-dock.component.html',
  styleUrl: './map-dock.component.scss'
})
export class MapDockComponent implements AfterViewInit, OnDestroy {
  state = inject(EnsoStateService);
  readonly kindHex = KIND_HEX;
  readonly sources = IMPACT_SOURCES;

  @ViewChild('wrap') wrapRef!: ElementRef<HTMLDivElement>;
  @ViewChild('scaleCanvas') scaleCanvasRef!: ElementRef<HTMLCanvasElement>;

  private resizeObs: ResizeObserver | null = null;

  readonly isWalker = computed(() => this.state.view() === 'walker');
  /** The Walker cross-section colours the ocean by temperature, the impacts view by anomaly. */
  readonly scaleMode = computed<DisplayMode>(() => {
    const v = this.state.view();
    return v === 'walker' ? 'sst' : v === 'impacts' ? 'anom' : this.state.displayMode();
  });

  readonly rainTitle = computed(() => {
    const s = this.state.sCur();
    if (s < -0.3) return 'La Niña – w przybliżeniu odwrotny układ opadów (uproszczenie):';
    if (s < 0.3) return 'Typowe zmiany opadów podczas El Niño (w fazie neutralnej nie występują):';
    return 'Typowe zmiany opadów podczas El Niño:';
  });

  constructor() {
    effect(() => {
      this.drawScale(this.scaleMode());
    });
  }

  ngAfterViewInit() {
    this.drawScale(this.scaleMode());
    // expose the dock height so the control panel can sit above it on narrow screens
    this.resizeObs = new ResizeObserver(() => {
      const h = this.wrapRef.nativeElement.offsetHeight;
      document.documentElement.style.setProperty('--dock-h', `${h}px`);
    });
    this.resizeObs.observe(this.wrapRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObs?.disconnect();
  }

  showPinLegend(): boolean {
    return this.state.view() === 'globe' && this.state.showEvents() && this.state.phase() !== 'neu';
  }

  onModeClick(m: DisplayMode) {
    this.state.setDisplayMode(m);
  }

  private drawScale(mode: DisplayMode) {
    const c = this.scaleCanvasRef?.nativeElement;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const st = mode === 'sst' ? TEMP_HEX : ANOM_HEX;
    const lo = st[0][0];
    const hi = st[st.length - 1][0];
    const gr = ctx.createLinearGradient(0, 0, c.width, 0);
    st.forEach(([v, h]) => gr.addColorStop((v - lo) / (hi - lo), h));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, c.width, c.height);
  }
}
