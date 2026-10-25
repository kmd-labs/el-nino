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
  Thermometer,
  Waves,
  Wind,
  Gauge,
  ChartLine
} from 'lucide-angular';
import { EnsoStateService, PLAYBACK_SPEEDS } from '../../core/services/enso-state.service';
import { EnsoPhase } from '../../core/models/enso.model';
import { PRESETS } from '../../core/constants/enso-data';
import { PHASE_THRESHOLDS } from '../../core/services/enso-math.service';

/** Mirrors the range handed to <app-timeline-slider> in the template. */
const SLIDER_MIN = -2;
const SLIDER_MAX = 3;
import { ButtonComponent } from '@kmd/design-system/ui/button/button.component';
import { DropdownComponent } from '@kmd/design-system/ui/dropdown/dropdown.component';
import { DropdownOption } from '@kmd/design-system/ui/dropdown/dropdown.model';
import { TimelineSliderComponent } from '@kmd/design-system/ui/timeline-slider/timeline-slider.component';
import { TimelineMarker } from '@kmd/design-system/ui/timeline-slider/timeline-slider.model';
import { I18nService } from '../../core/i18n/i18n.service';
import { LegendPanelComponent } from '../legend-panel/legend-panel.component';
import { CurrentWeatherService } from '../../core/services/current-weather.service';
import { TooltipDirective } from '@kmd/design-system/ui/tooltip/tooltip.directive';
import { LocaleTempPipe } from '../../core/pipes/locale-temp.pipe';
import { LocaleDatePipe } from '../../core/pipes/locale-date.pipe';

/** One anchor on the slider, shared by the pill row and the date row above it. */
interface Milestone {
  id: string;
  /** null for NOW, which marks a moment rather than a phase. */
  ph: EnsoPhase | null;
  value: number;
  dateIso: string;
  forecast: boolean;
  hot: boolean;
}

export interface DateMarker {
  id: string;
  value: number;
  label: string;
  subLabel?: string;
  hot?: boolean;
  active: boolean;
}

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
  readonly waterIcon = Waves;
  readonly airIcon = Thermometer;
  readonly windIcon = Wind;
  readonly speedIcon = Gauge;
  /** Same glyph the header's view switcher uses for the cycles chart. */
  readonly cyclesIcon = ChartLine;

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
   * The observed anomaly, or an em dash past NOW. Frames beyond the last observation
   * are a synthesised scenario, not a measurement, so there is no NOAA figure to put
   * here — the same dash the rest of the app uses for data it does not have.
   */
  readonly formattedNino = computed(() => {
    const s = this.state.sCur();
    const observed = this.weather.isForecast(s) ? null : this.state.nino34Value();
    return this.localeTemp.transform(observed, 'delta');
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
    return Math.abs(s - 1.4) < 0.05;
  });

  /** Where the anomaly and the timeline come from (NOAA OISST), linked next to the date. */
  readonly sourceUrl = computed(
    () => this.weather.meta()?.sstSourceUrl ?? 'https://www.ncei.noaa.gov/products/optimum-interpolation-sst'
  );
  readonly isForecast = computed(() => this.weather.isForecast(this.state.sCur()));

  readonly dataReady = computed(() => this.weather.status() === 'ready');

  /**
   * Where the observed Niño 3.4 crossed ±0.5 °C, as a gradient painted over the rail.
   *
   * The rail's own gradient runs cold → warm exactly once, which reads as a one-way story, while
   * the record behind it crossed the phase thresholds several times between the first frame and
   * today. The marks sit at the midpoint between the two frames that straddle a crossing; the
   * forecast frame is left out, since nothing was observed there.
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

  /**
   * The slider's anchors: the four phases where the record actually shows them, plus
   * NOW. Both marker rows read this one list, so a date can never drift away from the
   * pill underneath it.
   */
  private readonly milestones = computed<Milestone[]>(() => {
    const kfs = this.weather.meta()?.keyframes;
    const nowKf = kfs?.find(k => k.now) ?? kfs?.find(k => !k.forecast && Math.abs(k.s - 1.4) < 0.05);
    const fcDate = kfs?.find(k => k.forecast)?.date;

    const today = new Date();
    const fallbackForecastDate = new Date(today);
    fallbackForecastDate.setUTCDate(fallbackForecastDate.getUTCDate() + 56);
    const startIso = kfs?.[0]?.date ?? '2024-11-06';
    const nowIso = nowKf?.date ?? today.toISOString().slice(0, 10);

    const anchors = this.weather.phaseAnchors();
    if (!anchors.length) {
      // Timeline still loading. Frames are weekly and `s` is linear in frame index,
      // so the observed axis is a straight line between its two known anchors.
      const a = Date.parse(`${startIso}T12:00:00Z`);
      const b = Date.parse(`${nowIso}T12:00:00Z`);
      const at = (v: number) => new Date(a + (b - a) * ((v + 1.8) / 3.2)).toISOString().slice(0, 10);
      return PRESETS.map(p => ({
        id: p.ph,
        ph: p.ph,
        value: p.strength,
        dateIso: p.forecast
          ? fallbackForecastDate.toISOString().slice(0, 10)
          : p.now
            ? nowIso
            : at(p.strength),
        forecast: !!p.forecast,
        hot: !!p.hot
      }));
    }

    const items: Milestone[] = anchors.map(a => ({
      id: a.ph,
      ph: a.ph,
      value: a.s,
      dateIso: a.date,
      forecast: a.date === fcDate,
      hot: a.ph === 'super'
    }));
    items.push({ id: 'now', ph: null, value: nowKf?.s ?? 1.4, dateIso: nowIso, forecast: false, hot: false });
    return items.sort((x, y) => x.value - y.value);
  });

  /**
   * The four phase pills, in a row of their own under the header rule rather than pinned to their
   * place on the slider. Which one is lit follows the observed anomaly — the record, not the handle,
   * and not the model ramp, which already reads as La Niña on the week the Neutral pill points at.
   */
  readonly phasePills = computed(() => {
    const t = this.i18n.t();
    const dataPhase = this.state.phase();
    return this.milestones()
      .filter(m => m.ph !== null)
      .map(m => ({
        id: m.id,
        value: m.value,
        label: t.phase[m.ph!],
        date: this.localeDate.transform(new Date(`${m.dateIso}T12:00:00Z`), 'monthYear'),
        sub: m.forecast ? t.timelineForecast : null,
        hot: m.hot,
        active: m.ph === dataPhase
      }))
      .map(p => ({ ...p, tip: p.sub ? `${p.sub} · ${p.date}` : p.date }));
  });

  /** NOW as a pill of its own, sitting in the row with the phases. */
  readonly nowPill = computed(() => {
    const m = this.milestones().find(x => x.ph === null);
    if (!m) return null;
    return {
      value: m.value,
      label: this.i18n.t().timelineNow,
      tip: this.localeDate.transform(new Date(`${m.dateIso}T12:00:00Z`), 'monthYear'),
      active: this.isNow()
    };
  });

  /** The rail still carries the NOW node, so the spot stays marked on the axis itself. */
  readonly timelineMarkers = computed<TimelineMarker[]>(() => {
    const t = this.i18n.t();
    const atNow = this.isNow();
    return this.milestones()
      .filter(m => m.ph === null)
      .map(m => ({ id: m.id, value: m.value, label: t.timelineNow, hot: m.hot, active: atNow }));
  });

  readonly activeDateMarkerId = computed<string>(() => {
    const sCur = this.state.sCur();
    const active = this.milestones().find(m => Math.abs(sCur - m.value) < 0.22);
    return active ? `m-${active.id}` : '';
  });

  readonly dateMarkers = computed<Omit<DateMarker, 'active'>[]>(() => {
    const t = this.i18n.t();
    return this.milestones().filter(m => m.ph === null).map(m => ({
      id: `m-${m.id}`,
      value: m.value,
      label: this.localeDate.transform(new Date(`${m.dateIso}T12:00:00Z`), 'monthYear'),
      subLabel: m.forecast ? t.timelineForecast : undefined,
      hot: m.hot
    }));
  });

  /** The forecast has no measured anomaly, so point at the chart that does project one. */
  openCycles() {
    this.state.setView('cycles');
  }

  markerPct(val: number): number {
    const min = -2;
    const max = 3;
    return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
  }

  ngAfterViewInit() {
    this.resizeObs = new ResizeObserver(() => {
      const h = this.wrapRef.nativeElement.offsetHeight;
      document.documentElement.style.setProperty('--dock-h', `${h}px`);
    });
    this.resizeObs.observe(this.wrapRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObs?.disconnect();
  }

  onMarkerClick(m: { value: number }) {
    this.state.setPreset(m.value);
  }

  onDateClick(val: number) {
    this.state.setPreset(val);
  }

  onSliderChange(val: number) {
    this.state.setStrengthTarget(val);
  }
}
