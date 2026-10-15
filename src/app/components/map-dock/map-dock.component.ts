import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { KIND_HEX } from '../../core/constants/enso-data';
import { IMPACT_SOURCES } from '../../core/constants/impacts-data';
import { DisplayMode } from '../../core/models/enso.model';
import { ButtonComponent } from '../ui/button/button.component';
import { EnsoBarComponent } from '../enso-bar/enso-bar.component';
import { I18nService } from '../../core/i18n/i18n.service';

/**
 * Bottom controls: the ENSO state bar, and below it the view dock (temperature / anomaly / Walker
 * circulation / impacts) with layer toggles. The rainfall legend appears above them in the impacts view,
 * the pin legend in the bottom-left corner.
 */
@Component({
  selector: 'app-map-dock',
  standalone: true,
  imports: [CommonModule, ButtonComponent, EnsoBarComponent],
  templateUrl: './map-dock.component.html',
  styleUrl: './map-dock.component.scss'
})
export class MapDockComponent implements AfterViewInit, OnDestroy {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  readonly kindHex = KIND_HEX;
  readonly sources = IMPACT_SOURCES;

  @ViewChild('wrap') wrapRef!: ElementRef<HTMLDivElement>;
  /** View dock folded to the left edge, leaving only a tab. */
  readonly collapsed = signal(false);
  /** Impacts legend folded to a small tab. */
  readonly legendCollapsed = signal(false);

  private resizeObs: ResizeObserver | null = null;

  readonly isWalker = computed(() => this.state.view() === 'walker');
  readonly rainTitle = computed(() => {
    const s = this.state.sCur();
    const t = this.i18n.t();
    if (s < -0.3) return t.rainTitleNina;
    if (s < 0.3) return t.rainTitleNeutral;
    return t.rainTitleNino;
  });

  /** Name of the current view, shown on the tab when the dock is folded. */
  readonly viewName = computed(() => {
    const t = this.i18n.t();
    switch (this.state.view()) {
      case 'walker': return t.viewWalker;
      case 'impacts': return t.viewImpacts;
      default: return this.state.displayMode() === 'sst' ? t.viewTemp : t.viewAnom;
    }
  });

  ngAfterViewInit() {
    // expose the height of the bottom controls so the Walker view and glossary end above them
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
}
