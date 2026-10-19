import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Globe,
  Activity,
  Thermometer,
  Wind,
  CloudRain,
  Waves
} from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { BreakpointService } from '@kmd/design-system/services/breakpoint.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Lang } from '../../core/i18n/i18n.types';
import { DisplayMode, ViewMode } from '../../core/models/enso.model';
import { DropdownComponent } from '@kmd/design-system/ui/dropdown/dropdown.component';
import { DropdownOption } from '@kmd/design-system/ui/dropdown/dropdown.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    DropdownComponent,
    LucideAngularModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  bp = inject(BreakpointService);

  readonly globeIcon = Globe;

  /** Combined view/mode key: globe sub-modes ('anom' / 'sst') plus other views. */
  readonly currentView = computed<string>(() => {
    const v = this.state.view();
    return v === 'globe' ? this.state.displayMode() : v;
  });

  readonly viewOptions = computed<DropdownOption<string>[]>(() => {
    const t = this.i18n.t();
    return [
      { value: 'anom', label: t.viewAnom, icon: Activity },
      { value: 'sst', label: t.viewTemp, icon: Thermometer },
      { value: 'walker', label: t.viewWalker, icon: Wind },
      { value: 'impacts', label: t.viewImpacts, icon: CloudRain },
      { value: 'thermocline', label: t.thermoChip, icon: Waves }
    ];
  });

  readonly currentViewIcon = computed(
    () => this.viewOptions().find(o => o.value === this.currentView())?.icon ?? Activity
  );

  onViewChange(v: string) {
    if (v === 'sst' || v === 'anom') this.state.setDisplayMode(v as DisplayMode);
    else this.state.setView(v as ViewMode);
  }

  readonly langOptions = computed<DropdownOption<Lang>[]>(() =>
    this.i18n.langs.map(l => ({
      value: l,
      label: this.i18n.dicts[l].langName,
      shortLabel: l.toUpperCase(),
      badge: l.toUpperCase()
    }))
  );

  onLangChange(lang: Lang) {
    this.i18n.setLang(lang);
  }
}
