import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Thermometer,
  Wind,
  CloudRain,
  Share2,
  Handshake,
  Settings
} from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { PageService } from '../../core/services/page.service';
import { BreakpointService } from '@kmd/design-system/services/breakpoint.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ViewMode } from '../../core/models/enso.model';
import { DropdownComponent } from '@kmd/design-system/ui/dropdown/dropdown.component';
import { DropdownOption } from '@kmd/design-system/ui/dropdown/dropdown.model';
import { TooltipDirective } from '@kmd/design-system/ui/tooltip/tooltip.directive';
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
    TooltipDirective,
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
      { value: 'impacts', label: t.viewImpacts, icon: CloudRain }
    ];
  });

  readonly currentViewIcon = computed(
    () => this.viewOptions().find(o => o.value === this.currentView())?.icon ?? Thermometer
  );

  onViewChange(v: string) {
    this.state.setView(v as ViewMode);
  }
}
