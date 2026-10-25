import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Pause,
  Play,
  Gauge
} from 'lucide-angular';
import { EnsoStateService, PLAYBACK_SPEEDS } from '../../core/services/enso-state.service';
import { PHASE_THRESHOLDS } from '../../core/services/enso-math.service';

/** Mirrors the range handed to <app-timeline-slider> in the template. */
const SLIDER_MIN = -1.8;
const SLIDER_MAX = 1.4;

import { ButtonComponent } from '@kmd/design-system/ui/button/button.component';
import { DropdownComponent } from '@kmd/design-system/ui/dropdown/dropdown.component';
import { DropdownOption } from '@kmd/design-system/ui/dropdown/dropdown.model';
import { TimelineSliderComponent } from '@kmd/design-system/ui/timeline-slider/timeline-slider.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { LegendPanelComponent } from '../legend-panel/legend-panel.component';
import { CurrentWeatherService } from '../../core/services/current-weather.service';
import { TooltipDirective } from '@kmd/design-system/ui/tooltip/tooltip.directive';
import { LocaleTempPipe } from '../../core/pipes/locale-temp.pipe';
import { LocaleDatePipe } from '../../core/pipes/locale-date.pipe';

@Component({
  selector: 'app-map-dock',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    DropdownComponent,
    TimelineSliderComponent,
    LegendPanelComponent,
    LucideAngularModule,
    TooltipDirective
  ],
  providers: [LocaleTempPipe, LocaleDatePipe],
  templateUrl: './map-dock.component.html',
  styleUrl: './map-dock.component.scss'
})
export class MapDockComponent implements AfterViewInit, OnDestroy {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  weather = inject(CurrentWeatherService);
  private localeTemp = inject(LocaleTempPipe);
  private localeDate = inject(LocaleDatePipe);

  readonly playIcon = Play;
  readonly pauseIcon = Pause;
  readonly speedIcon = Gauge;

  /** Playback speed menu options formatted as 0.5x, 1x, 1.5x, 2x, etc. */
  readonly speedOptions = computed<DropdownOption<number>[]>(() => {
    return PLAYBACK_SPEEDS.map(s => ({
      value: s,
      label: `${s}x`,
      shortLabel: `${s}x`
    }));
  });

  @ViewChild('wrap') wrapRef!: ElementRef<HTMLDivElement>;
  private resizeObs: ResizeObserver | null = null;

  /**
   * The observed anomaly for the current playhead position.
   */
  readonly formattedNino = computed(() => {
    return this.localeTemp.transform(this.state.nino34Value(), 'delta');
  });

  /** Formatted numeric date for the date lozenge, e.g. "10/24/2026" */
  readonly activeDateLabel = computed(() => {
    const s = this.state.sCur();
    const ms = this.weather.interpolatedDateMs(s);
    if (ms == null) return '';
    return this.localeDate.transform(ms, 'full');
  });

  /** Whether the timeline is currently at the live / current keyframe */
  readonly isNow = computed(() => {
    const s = this.state.sCur();
    const nowKf = this.weather.meta()?.keyframes.find(k => k.now);
    const ms = this.weather.interpolatedDateMs(s);
    if (nowKf && ms != null) {
      return new Date(ms).toISOString().slice(0, 10) === nowKf.date;
    }
    return s >= 1.35;
  });

  /** Where the anomaly and the timeline come from (NOAA OISST), linked next to the date. */
  readonly sourceUrl = computed(
    () => this.weather.meta()?.sstSourceUrl ?? 'https://www.ncei.noaa.gov/products/optimum-interpolation-sst'
  );

  readonly dataReady = computed(() => this.weather.status() === 'ready');

  /**
   * Where the observed Niño 3.4 crossed ±0.5 °C, as a gradient painted over the rail.
   *
   * The marks sit at the midpoint between the two frames that straddle a crossing.
   */
  readonly phaseTicks = computed<string | null>(() => {
    const kfs = this.weather.meta()?.keyframes;
    if (!kfs || kfs.length < 2) return null;

    const band = (v: number) => (v >= PHASE_THRESHOLDS.nino ? 1 : v <= PHASE_THRESHOLDS.nina ? -1 : 0);
    const SPAN = SLIDER_MAX - SLIDER_MIN;
    const HALF_W = 0.2; // half a tick, in % of the rail
    const stops: string[] = [];

    for (let i = 1; i < kfs.length; i++) {
      if (kfs[i].forecast || kfs[i - 1].forecast) continue;
      if (band(kfs[i].nino34) === band(kfs[i - 1].nino34)) continue;
      const pct = ((kfs[i].s + kfs[i - 1].s) / 2 - SLIDER_MIN) / SPAN * 100;
      const a = Math.max(0, pct - HALF_W);
      const b = Math.min(100, pct + HALF_W);
      stops.push(`transparent ${a.toFixed(2)}%`, `currentColor ${a.toFixed(2)}%`, `currentColor ${b.toFixed(2)}%`, `transparent ${b.toFixed(2)}%`);
    }

    return stops.length ? `linear-gradient(90deg, ${stops.join(', ')})` : null;
  });

  ngAfterViewInit() {
    this.resizeObs = new ResizeObserver(() => {
      const h = this.wrapRef.nativeElement.offsetHeight;
      const w = this.wrapRef.nativeElement.offsetWidth;
      document.documentElement.style.setProperty('--dock-h', `${h}px`);
      document.documentElement.style.setProperty('--dock-w', `${w}px`);
    });
    this.resizeObs.observe(this.wrapRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObs?.disconnect();
  }

  onDateClick(val: number) {
    this.state.setPreset(val);
  }

  onSliderChange(val: number) {
    this.state.setStrengthTarget(val);
  }
}
