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
  Play
} from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { PRESETS } from '../../core/constants/enso-data';
import { ButtonComponent } from '@kmd/design-system/ui/button/button.component';
import { TimelineSliderComponent } from '@kmd/design-system/ui/timeline-slider/timeline-slider.component';
import { TimelineMarker } from '@kmd/design-system/ui/timeline-slider/timeline-slider.model';
import { I18nService } from '../../core/i18n/i18n.service';
import { LegendPanelComponent } from '../legend-panel/legend-panel.component';
import { CurrentWeatherService } from '../../core/services/current-weather.service';

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
  imports: [CommonModule, ButtonComponent, TimelineSliderComponent, LegendPanelComponent, LucideAngularModule],
  templateUrl: './map-dock.component.html',
  styleUrl: './map-dock.component.scss'
})
export class MapDockComponent implements AfterViewInit, OnDestroy {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  weather = inject(CurrentWeatherService);

  readonly playIcon = Play;
  readonly pauseIcon = Pause;

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

    const milestones = [
      { id: 'm-nina', value: -1.6, dateIso: ninaKf?.date ?? '2025-01-15', now: false, forecast: false, hot: false },
      { id: 'm-neu', value: 0.0, dateIso: '2025-07-15', now: false, forecast: false, hot: false },
      { id: 'm-now', value: 1.4, dateIso: nowKf?.date ?? '2026-10-21', now: true, forecast: false, hot: false },
      { id: 'm-fc', value: 2.6, dateIso: fcKf?.date ?? '2026-12-16', now: false, forecast: true, hot: true }
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
