import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'weatherValue',
  standalone: true
})
export class WeatherValuePipe implements PipeTransform {
  transform(value: number | null | undefined, unit = '', locale = 'en'): string {
    if (value == null || !Number.isFinite(value)) return '—';
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
    return unit ? `${formatted} ${unit}` : formatted;
  }
}
