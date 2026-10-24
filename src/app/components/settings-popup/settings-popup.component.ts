import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../core/i18n/i18n.service';
import { Lang, TempUnit } from '../../core/i18n/i18n.types';

@Component({
  selector: 'app-settings-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-popup.component.html',
  styleUrl: './settings-popup.component.scss'
})
export class SettingsPopupComponent {
  i18n = inject(I18nService);

  readonly languages: { id: Lang; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'pl', label: 'Polski' },
    { id: 'es', label: 'Español' }
  ];

  readonly tempUnits: { id: TempUnit; labelKey: 'unitCelsius' | 'unitFahrenheit' }[] = [
    { id: 'C', labelKey: 'unitCelsius' },
    { id: 'F', labelKey: 'unitFahrenheit' }
  ];

  selectLang(lang: Lang) {
    this.i18n.setLang(lang);
  }

  selectTempUnit(unit: TempUnit) {
    this.i18n.setTempUnit(unit);
  }
}
