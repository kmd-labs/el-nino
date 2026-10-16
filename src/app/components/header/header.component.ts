import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Globe, Moon, Sun } from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { ThemeService } from '../../core/services/theme.service';
import { BreakpointService } from '../../core/services/breakpoint.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Lang } from '../../core/i18n/i18n.types';
import { ButtonComponent } from '../ui/button/button.component';
import { DropdownComponent } from '../ui/dropdown/dropdown.component';
import { DropdownOption } from '../ui/dropdown/dropdown.model';
import { LegendPanelComponent } from '../legend-panel/legend-panel.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    DropdownComponent,
    LegendPanelComponent,
    LucideAngularModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  theme = inject(ThemeService);
  bp = inject(BreakpointService);

  readonly globeIcon = Globe;
  readonly sunIcon = Sun;
  readonly moonIcon = Moon;

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
