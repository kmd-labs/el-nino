import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Thermometer,
  Wind,
  CloudRain,
  Share2,
  Handshake,
  Settings,
  ChartLine
} from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { PageService } from '../../core/services/page.service';
import { BreakpointService } from '@kmd/design-system/services/breakpoint.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ViewMode } from '../../core/models/enso.model';
import { DropdownComponent } from '@kmd/design-system/ui/dropdown/dropdown.component';
import { DropdownOption } from '@kmd/design-system/ui/dropdown/dropdown.model';
import { ButtonComponent } from '@kmd/design-system/ui/button/button.component';
import { PopupService } from '@kmd/design-system/ui/popup/popup.service';
import { SettingsPopupComponent } from '../settings-popup/settings-popup.component';
import { SharePopupComponent } from '../share-popup/share-popup.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    DropdownComponent,
    ButtonComponent,
    LucideAngularModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  bp = inject(BreakpointService);
  page = inject(PageService);
  private popup = inject(PopupService);

  readonly shareIcon = Share2;
  readonly ctaIcon = Handshake;
  readonly settingsIcon = Settings;

  readonly mobileExpanded = signal(false);

  /** Whether any popup dialog is currently active */
  readonly isPopupOpen = computed(() => this.popup.config() !== null);

  /**
   * The brand pill is always expanded on desktop/tablet, and always expanded
   * whenever a popup modal is open (so KMD logo and CTA are visible above the backdrop).
   * On mobile during normal browsing, it collapses and expands on tap/hover.
   */
  readonly isBrandExpanded = computed(() => {
    if (!this.bp.mobile()) return true;
    if (this.isPopupOpen()) return true;
    return this.mobileExpanded();
  });

  onBrandClick(event: MouseEvent) {
    if (this.bp.mobile() && !this.isPopupOpen()) {
      if (!this.mobileExpanded()) {
        event.stopPropagation();
        this.mobileExpanded.set(true);
        return;
      }
    }
    this.mobileExpanded.set(false);
    this.openAbout();
  }

  onBrandHover(entering: boolean) {
    if (this.bp.mobile() && !this.isPopupOpen()) {
      this.mobileExpanded.set(entering);
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent) {
    if (!this.mobileExpanded() || this.isPopupOpen()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.header__brand')) return;
    this.mobileExpanded.set(false);
  }

  openAbout() {
    this.page.openAbout();
  }

  openSharePopup() {
    this.popup.open({
      id: 'share',
      title: computed(() => this.i18n.t().shareTitle),
      subtitle: computed(() => this.i18n.t().shareSubtitle),
      component: SharePopupComponent,
      size: 'sm',
      actions: [
        {
          label: computed(() => this.i18n.t().close),
          variant: 'default'
        }
      ]
    });
  }

  openSettings() {
    this.popup.open({
      id: 'settings',
      title: computed(() => this.i18n.t().settingsTitle),
      subtitle: computed(() => this.i18n.t().settingsSubtitle),
      component: SettingsPopupComponent,
      size: 'sm',
      actions: [
        {
          label: computed(() => this.i18n.t().close),
          variant: 'default'
        }
      ]
    });
  }

  readonly currentView = computed<string>(() => this.state.view());

  readonly viewOptions = computed<DropdownOption<string>[]>(() => {
    const t = this.i18n.t();
    return [
      { value: 'globe', label: t.viewAnom, icon: Thermometer },
      { value: 'walker', label: t.viewWalker, icon: Wind },
      { value: 'impacts', label: t.viewImpacts, icon: CloudRain },
      { value: 'cycles', label: t.viewCycles, icon: ChartLine }
    ];
  });

  readonly currentViewIcon = computed(
    () => this.viewOptions().find(o => o.value === this.currentView())?.icon ?? Thermometer
  );

  onViewChange(v: string) {
    this.state.setView(v as ViewMode);
  }
}
