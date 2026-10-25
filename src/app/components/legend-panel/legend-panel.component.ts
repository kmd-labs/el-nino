import { Component, ElementRef, ViewChild, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Layers, BookOpen } from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { BreakpointService } from '@kmd/design-system/services/breakpoint.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { DisplayMode } from '../../core/models/enso.model';
import { DropdownComponent } from '@kmd/design-system/ui/dropdown/dropdown.component';
import { TooltipDirective } from '@kmd/design-system/ui/tooltip/tooltip.directive';
import { ButtonComponent } from '@kmd/design-system/ui/button/button.component';
import { PopupService } from '@kmd/design-system/ui/popup/popup.service';
import { GlossaryComponent } from '../glossary/glossary.component';
import { CurrentWeatherService } from '../../core/services/current-weather.service';
import { LocaleTempPipe } from '../../core/pipes/locale-temp.pipe';

/**
 * Legend & Glossary controls:
 * 1. Thermal / Anomaly color scale bar, Phase Impacts Pins & Continental Rainfall Anomalies
 * 2. Searchable Glossary modal trigger
 */
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-legend-panel',
  standalone: true,
  imports: [CommonModule, DropdownComponent, ButtonComponent, TooltipDirective, LucideAngularModule],
  providers: [LocaleTempPipe],
  templateUrl: './legend-panel.component.html',
  styleUrl: './legend-panel.component.scss'
})
export class LegendPanelComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  bp = inject(BreakpointService);
  private math = inject(EnsoMathService);
  private popup = inject(PopupService);
  private localeTemp = inject(LocaleTempPipe);
  private analytics = inject(AnalyticsService);

  readonly layersIcon = Layers;
  readonly bookOpenIcon = BookOpen;

  @ViewChild('scaleCanvas') set scaleCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.scaleRef = ref;
    if (ref) this.drawScale();
  }
  private scaleRef: ElementRef<HTMLCanvasElement> | undefined;

  readonly scaleMode = computed<DisplayMode>(() => 'sst');

  /** Ends and middle of the temperature scale, formatted for the UI language and temperature unit (e.g. "16,5 °C" or "61.7 °F"). */
  readonly scaleTicks = computed(() => {
    const st = this.math.getThermalStops();
    const lo = st[0][0];
    const hi = st[st.length - 1][0];
    const fmt = (v: number) => this.localeTemp.transform(v, 'temp');
    return [fmt(lo), fmt((lo + hi) / 2), fmt(hi)];
  });

  readonly rainTitle = computed(() => {
    const s = this.state.sCur();
    const t = this.i18n.t();
    if (s < -0.3) return t.rainTitleNina;
    if (s < 0.3) return t.rainTitleNeutral;
    return t.rainTitleNino;
  });

  readonly showImpactsLegend = computed(() => !this.state.crossSectionView());

  openGlossaryPopup() {
    this.analytics.track('glossary-open');
    this.popup.open({
      id: 'glossary',
      title: computed(() => this.i18n.t().glTitle),
      subtitle: computed(() => this.i18n.t().layerGlossaryTitle),
      component: GlossaryComponent,
      size: 'lg',
      actions: [
        {
          label: computed(() => this.i18n.t().close),
          variant: 'default'
        }
      ]
    });
  }

  constructor() {
    effect(() => {
      this.drawScale();
    });
  }

  private drawScale() {
    const c = this.scaleRef?.nativeElement;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const st = this.math.getThermalStops();
    const lo = st[0][0];
    const hi = st[st.length - 1][0];
    const gr = ctx.createLinearGradient(0, 0, c.width, 0);
    st.forEach(([v, h]) => gr.addColorStop((v - lo) / (hi - lo), h));
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, c.width, c.height);
  }
}
