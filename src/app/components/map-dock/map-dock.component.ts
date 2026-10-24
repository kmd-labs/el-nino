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
  Settings
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
import { WeatherValuePipe } from '../../core/pipes/weather-value.pipe';

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
  imports: [CommonModule, ButtonComponent, DropdownComponent, TimelineSliderComponent, LegendPanelComponent, LucideAngularModule, TooltipDirective, WeatherValuePipe],
  templateUrl: './map-dock.component.html',
  styleUrl: './map-dock.component.scss'
})
export class MapDockComponent implements AfterViewInit, OnDestroy {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  weather = inject(CurrentWeatherService);

  readonly playIcon = Play;
  readonly pauseIcon = Pause;
  readonly waterIcon = Waves;
  readonly airIcon = Thermometer;
  readonly windIcon = Wind;
  readonly speedIcon = Settings;

  /** YouTube-style playback speed menu: 0,5× … 2×, with 1× labelled "Normal". */
  readonly speedOptions = computed<DropdownOption<number>[]>(() => {
    const t = this.i18n.t();
    const fmt = new Intl.NumberFormat(t.htmlLang);
    return PLAYBACK_SPEEDS.map(s => ({ value: s, label: s === 1 ? t.speedNormal : `${fmt.format(s)}×` }));
  });

  @ViewChild('wrap') wrapRef!: ElementRef<HTMLDivElement>;
  private resizeObs: ResizeObserver | null = null;

  readonly formattedNino = computed(() => {
    const n = this.state.nino34Value();
    return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)} °C`;
  });

  /** Interpolated date badge, e.g. "Oct 2026 · Now" or "Jan 2025" */
  readonly activeDateLabel = computed(() => {
    const t = this.i18n.t();
    return this.weather.interpolatedDateLabel(this.state.sCur(), t.htmlLang, t.timelineNow, t.timelineForecast);
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
      const monthStr = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' }).format(d);
      const yearStr = d.getUTCFullYear();
      let subLabel: string | undefined;
      if (p.now) subLabel = t.timelineNow;
      if (p.forecast) subLabel = t.timelineForecast;
      const active = Math.abs(sCur - p.value) < 0.22;

      return {
        id: p.id,
        value: p.value,
        label: `${monthStr} ${yearStr}`,
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
