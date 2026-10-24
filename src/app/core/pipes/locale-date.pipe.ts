import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';

export type LocaleDateFormat = 'full' | 'monthYear';

@Pipe({
  name: 'localeDate',
  standalone: true,
  pure: false
})
export class LocaleDatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(
    value: Date | string | number | null | undefined,
    format: LocaleDateFormat = 'full',
    localeOverride?: string
  ): string {
    if (value == null || value === '') return '';
    let d: Date;
    if (typeof value === 'string') {
      d = new Date(value.includes('T') ? value : `${value}T12:00:00Z`);
    } else if (typeof value === 'number') {
      d = new Date(value);
    } else {
      d = value;
    }

    if (Number.isNaN(d.getTime())) return '';

    const locale = localeOverride ?? this.i18n.t().locale ?? 'en-US';

    if (format === 'monthYear') {
      return new Intl.DateTimeFormat(locale, {
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(d);
    }

    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(d);
  }
}
