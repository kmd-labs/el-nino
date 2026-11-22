import { TestBed } from '@angular/core/testing';
import { ThemeService } from '@kmd/design-system/services/theme.service';
import { THEME_STORAGE_KEY, ThemePreferenceService, defaultModeAt } from './theme-preference.service';

const at = (h: number, m = 0) => new Date(2026, 10, 22, h, m);

describe('defaultModeAt', () => {
  it('is dark from 18:00 up to 06:00 and light in between', () => {
    expect(defaultModeAt(at(17, 59))).toBe('light');
    expect(defaultModeAt(at(18, 0))).toBe('dark');
    expect(defaultModeAt(at(23, 30))).toBe('dark');
    expect(defaultModeAt(at(0, 0))).toBe('dark');
    expect(defaultModeAt(at(5, 59))).toBe('dark');
    expect(defaultModeAt(at(6, 0))).toBe('light');
    expect(defaultModeAt(at(12, 0))).toBe('light');
  });
});

describe('ThemePreferenceService', () => {
  let svc: ThemePreferenceService;
  let theme: ThemeService;

  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ThemePreferenceService);
    theme = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    theme.setMode('light');
  });

  it('follows the clock when nothing is stored', () => {
    svc.now = () => at(20);
    svc.init();
    expect(theme.mode()).toBe('dark');

    svc.now = () => at(10);
    svc.init();
    expect(theme.mode()).toBe('light');
  });

  it('lets a stored choice override the clock', () => {
    svc.set('light');
    svc.now = () => at(22);
    svc.init();
    expect(theme.mode()).toBe('light');

    svc.set('dark');
    svc.now = () => at(9);
    svc.init();
    expect(theme.mode()).toBe('dark');
  });

  it('persists an explicit choice', () => {
    svc.set('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
