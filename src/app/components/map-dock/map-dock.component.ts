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
import { TooltipDirective } from '@kmd/design-system/ui/tooltip/tooltip.directive';
import { CurrentWeatherService } from '../../core/services/current-weather.service';
import { EnsoMathService } from '../../core/services/enso-math.service';

@Component({
  selector: 'app-map-dock',
  standalone: true,
  imports: [CommonModule, ButtonComponent, TimelineSliderComponent, LegendPanelComponent, LucideAngularModule, TooltipDirective],
  templateUrl: './map-dock.component.html',
  styleUrl: './map-dock.component.scss'
})
export class MapDockComponent implements AfterViewInit, OnDestroy {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  weather = inject(CurrentWeatherService);
  private math = inject(EnsoMathService);

  /** Day of the sea-surface-temperature analysis, e.g. "19 Oct", in the UI language. */
  readonly sstDate = computed(() => this.weather.sstDay(this.i18n.t().htmlLang));

  /** CSS gradient of the temperature scale, built from the same stops as the globe texture. */
  readonly sstGradient = computed(() => {
    const st = this.math.getThermalStops();
    const lo = st[0][0];
    const hi = st[st.length - 1][0];
    return `linear-gradient(90deg, ${st.map(([v, c]) => `${c} ${((v - lo) / (hi - lo) * 100).toFixed(1)}%`).join(', ')})`;
  });

  /** Model time of the live data, e.g. "21 Oct, 07:30" (UTC), in the UI language. */
  readonly currentTime = computed(() => {
    const time = this.weather.data()?.time;
    if (!time) return '';
    return new Intl.DateTimeFormat(this.i18n.t().htmlLang, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'
    }).format(new Date(`${time}Z`));
  });

  readonly playIcon = Play;
  readonly pauseIcon = Pause;

  @ViewChild('wrap') wrapRef!: ElementRef<HTMLDivElement>;
  private resizeObs: ResizeObserver | null = null;

  readonly formattedNino = computed(() => {
    const n = this.state.nino34Value();
    return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)} °C`;
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

  onSliderChange(val: number) {
    this.state.setStrengthTarget(val);
  }
}
