import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Sun, Moon } from 'lucide-angular';
import { ThemeMode, ThemeService } from '@kmd/design-system/services/theme.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Lang, TempUnit } from '../../core/i18n/i18n.types';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ThemePreferenceService } from '../../core/services/theme-preference.service';

@Component({
  selector: 'app-settings-popup',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './settings-popup.component.html',
  styleUrl: './settings-popup.component.scss'
})
export class SettingsPopupComponent {
  i18n = inject(I18nService);
  theme = inject(ThemeService);
  private themePref = inject(ThemePreferenceService);
  private analytics = inject(AnalyticsService);

  readonly languages: { id: Lang; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'pl', label: 'Polski' },
    { id: 'es', label: 'Español' }
  ];

  readonly tempUnits: { id: TempUnit; labelKey: 'unitCelsius' | 'unitFahrenheit' }[] = [
    { id: 'C', labelKey: 'unitCelsius' },
    { id: 'F', labelKey: 'unitFahrenheit' }
  ];

  readonly themeModes: { id: ThemeMode; labelKey: 'themeLight' | 'themeDark'; icon: typeof Sun }[] = [
    { id: 'light', labelKey: 'themeLight', icon: Sun },
    { id: 'dark', labelKey: 'themeDark', icon: Moon }
  ];

  selectLang(lang: Lang) {
    this.analytics.track('language', { lang });
    this.i18n.setLang(lang);
  }

  selectTempUnit(unit: TempUnit) {
    this.analytics.track('temp-unit', { unit });
    this.i18n.setTempUnit(unit);
  }

  selectTheme(mode: ThemeMode) {
    if (mode === this.theme.mode()) return;
    this.analytics.track('theme', { mode });
    this.themePref.set(mode);
  }
}
