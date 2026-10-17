import { Component, ElementRef, ViewChild, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Layers, BookOpen } from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { ThemeService } from '../../core/services/theme.service';
import { BreakpointService } from '../../core/services/breakpoint.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { DisplayMode } from '../../core/models/enso.model';
import { IMPACT_SOURCES } from '../../core/constants/impacts-data';
import { DropdownComponent } from '../ui/dropdown/dropdown.component';
import { TooltipDirective } from '../ui/tooltip/tooltip.directive';
import { ButtonComponent } from '../ui/button/button.component';
import { PopupService } from '../ui/popup/popup.service';
import { GlossaryComponent } from '../glossary/glossary.component';

/**
 * Legend & Glossary controls:
 * 1. Thermal / Anomaly color scale bar, Phase Impacts Pins & Continental Rainfall Anomalies
 * 2. Searchable Glossary modal trigger
 */
@Component({
  selector: 'app-legend-panel',
  standalone: true,
  imports: [CommonModule, DropdownComponent, ButtonComponent, TooltipDirective, LucideAngularModule],
  templateUrl: './legend-panel.component.html',
  styleUrl: './legend-panel.component.scss'
})
export class LegendPanelComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  theme = inject(ThemeService);
  bp = inject(BreakpointService);
  private math = inject(EnsoMathService);
  private popup = inject(PopupService);

  readonly layersIcon = Layers;
  readonly bookOpenIcon = BookOpen;
  readonly sources = IMPACT_SOURCES;

  @ViewChild('scaleCanvas') set scaleCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.scaleRef = ref;
    if (ref) this.drawScale(this.scaleMode());
  }
  private scaleRef: ElementRef<HTMLCanvasElement> | undefined;

  readonly scaleMode = computed<DisplayMode>(() => {
    const v = this.state.view();
    return v === 'walker' || v === 'thermocline' ? 'sst' : v === 'impacts' ? 'anom' : this.state.displayMode();
  });

  readonly rainTitle = computed(() => {
    const s = this.state.sCur();
    const t = this.i18n.t();
    if (s < -0.3) return t.rainTitleNina;
    if (s < 0.3) return t.rainTitleNeutral;
    return t.rainTitleNino;
  });

  readonly showImpactsLegend = computed(() => {
    return !this.state.crossSectionView();
  });

  openGlossaryPopup() {
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
      this.theme.theme();
      this.drawScale(this.scaleMode());
    });
  }

  private drawScale(mode: DisplayMode) {
    const c = this.scaleRef?.nativeElement;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const st = mode === 'sst' ? this.math.getThermalStops() : this.math.getAnomalyStops();
    const lo = st[0][0];
    const hi = st[st.length - 1][0];
    const gr = ctx.createLinearGradient(0, 0, c.width, 0);
    st.forEach(([v, h]) => gr.addColorStop((v - lo) / (hi - lo), h));
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, c.width, c.height);
  }
}
