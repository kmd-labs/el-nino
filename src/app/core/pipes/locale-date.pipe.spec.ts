import { TestBed } from '@angular/core/testing';
import { LocaleDatePipe } from './locale-date.pipe';
import { I18nService } from '../i18n/i18n.service';

describe('LocaleDatePipe', () => {
  let pipe: LocaleDatePipe;
  let i18n: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocaleDatePipe, I18nService]
    });
    pipe = TestBed.inject(LocaleDatePipe);
    i18n = TestBed.inject(I18nService);
  });

  it('formats full dates with digits only according to locale', () => {
    const iso = '2026-10-24';
    i18n.setLang('en');
    expect(pipe.transform(iso, 'full')).toBe('10/24/2026');

    i18n.setLang('pl');
    expect(pipe.transform(iso, 'full')).toBe('24.10.2026');

    i18n.setLang('es');
    expect(pipe.transform(iso, 'full')).toBe('24/10/2026');
  });

  it('formats month and year numerically', () => {
    const iso = '2024-11-06';
    i18n.setLang('en');
    expect(pipe.transform(iso, 'monthYear')).toBe('11/2024');

    i18n.setLang('pl');
    expect(pipe.transform(iso, 'monthYear')).toBe('11.2024');
  });

  it('returns empty string for null or empty values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
