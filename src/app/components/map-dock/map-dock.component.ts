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
  Activity,
  CloudRain,
  Pause,
  Play,
  Thermometer,
  Waves,
  Wind
} from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { PRESETS } from '../../core/constants/enso-data';
import { DisplayMode } from '../../core/models/enso.model';
import { ButtonComponent } from '../ui/button/button.component';
import { TimelineSliderComponent } from '../ui/timeline-slider/timeline-slider.component';
import { TimelineMarker } from '../ui/timeline-slider/timeline-slider.model';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-map-dock',
  standalone: true,
  imports: [CommonModule, ButtonComponent, TimelineSliderComponent, LucideAngularModule],
  templateUrl: './map-dock.component.html',
  styleUrl: './map-dock.component.scss'
})
export class MapDockComponent implements AfterViewInit, OnDestroy {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);

  readonly thermometerIcon = Thermometer;
  readonly activityIcon = Activity;
  readonly windIcon = Wind;
  readonly cloudRainIcon = CloudRain;
  readonly wavesIcon = Waves;
  readonly playIcon = Play;
  readonly pauseIcon = Pause;

  @ViewChild('wrap') wrapRef!: ElementRef<HTMLDivElement>;
  private resizeObs: ResizeObserver | null = null;

  readonly isThermocline = computed(() => this.state.view() === 'thermocline');
  readonly isWalker = computed(() => this.state.view() === 'walker');

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

  onModeClick(m: DisplayMode) {
    this.state.setDisplayMode(m);
  }

  onMarkerClick(m: TimelineMarker) {
    this.state.setPreset(m.value);
  }

  onSliderChange(val: number) {
    this.state.setStrengthTarget(val);
  }
}
