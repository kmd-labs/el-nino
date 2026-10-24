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
  Wind
} from 'lucide-angular';
import { EnsoStateService, PLAYBACK_SPEEDS } from '../../core/services/enso-state.service';
import { PRESETS } from '../../core/constants/enso-data';
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
    LucideAngularModule
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
    return Math.abs(s - 1.4) < 0.05;
  });

  readonly activeSst = computed(() => this.weather.nino34Sst(this.state.sCur()));

  readonly daily = computed(() => this.weather.dailyWeatherOn(this.state.sCur()));

  readonly isForecast = computed(() => this.weather.isForecast(this.state.sCur()));

  readonly dataReady = computed(() => this.weather.status() === 'ready');

  readonly timelineMarkers = computed<TimelineMarker[]>(() => {
    const t = this.i18n.t();
    const curPhase = this.state.phase();
    return PRESETS.map(p => ({
      id: p.ph,
      value: p.strength,
      label: t.phase[p.ph],
      hot: !!p.hot,
      active: curPhase === p.ph
    }));
  });

  readonly dateMarkers = computed<DateMarker[]>(() => {
    const t = this.i18n.t();
    const sCur = this.state.sCur();
    const lang = t.htmlLang;

    const kfs = this.weather.meta()?.keyframes;
    const nowKf = kfs?.find(k => k.now) ?? kfs?.find(k => !k.forecast && Math.abs(k.s - 1.4) < 0.05);
    const fcKf = kfs?.find(k => k.forecast);
    const ninaKf = kfs?.[0];

    const today = new Date();
    const fallbackNow = today.toISOString().slice(0, 10);
    const fallbackForecastDate = new Date(today);
    fallbackForecastDate.setUTCDate(fallbackForecastDate.getUTCDate() + 56);
    const fallbackForecast = fallbackForecastDate.toISOString().slice(0, 10);

    const milestones = [
      { id: 'm-nina', value: -1.8, dateIso: ninaKf?.date ?? '2024-11-06', now: false, forecast: false, hot: false },
      { id: 'm-neu', value: 0.0, dateIso: '2025-07-15', now: false, forecast: false, hot: false },
      { id: 'm-now', value: 1.4, dateIso: nowKf?.date ?? fallbackNow, now: true, forecast: false, hot: false },
      { id: 'm-fc', value: 2.6, dateIso: fcKf?.date ?? fallbackForecast, now: false, forecast: true, hot: true }
    ];

    return milestones.map(p => {
      const d = new Date(`${p.dateIso}T12:00:00Z`);
      const label = this.localeDate.transform(d, 'monthYear');
      let subLabel: string | undefined;
      if (p.now) subLabel = t.live.toUpperCase();
      if (p.forecast) subLabel = t.timelineForecast;
      const active = Math.abs(sCur - p.value) < 0.22;

      return {
        id: p.id,
        value: p.value,
        label,
        subLabel,
        hot: p.hot,
        active
      };
    });
  });

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
