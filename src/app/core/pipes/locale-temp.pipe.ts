import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { TempUnit } from '../i18n/i18n.types';

@Pipe({
  name: 'localeTemp',
  standalone: true,
  pure: false
})
export class LocaleTempPipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(
    valueCelsius: number | null | undefined,
    mode: 'temp' | 'delta' = 'temp',
    showSign = mode === 'delta',
    unitOverride?: TempUnit
  ): string {
    if (valueCelsius == null || !Number.isFinite(valueCelsius)) return '—';
    const unit = unitOverride ?? this.i18n.tempUnit();
    const locale = this.i18n.t().locale || 'en-US';

    const converted = unit === 'F'
      ? (mode === 'delta' ? valueCelsius * 1.8 : valueCelsius * 1.8 + 32)
      : valueCelsius;

    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(Math.abs(converted));

    let sign = '';
    if (converted < -0.04) {
      sign = '−';
    } else if (showSign && converted > 0.04) {
      sign = '+';
    }

    return `${sign}${formatted} °${unit}`;
  }
}
