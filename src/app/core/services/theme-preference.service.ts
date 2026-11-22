import { Injectable, inject } from '@angular/core';
import { ThemeMode, ThemeService } from '@kmd/design-system/services/theme.service';

/** Must match the key read by the inline script in `index.html` (applied before Angular boots). */
export const THEME_STORAGE_KEY = 'el-nino.theme';

/** Local hours that default to the dark theme: 18:00 up to (not including) 06:00. */
export const DARK_FROM_HOUR = 18;
export const DARK_UNTIL_HOUR = 6;

/** The default before the visitor picks a theme: dark in the evening and at night, light by day. */
export function defaultModeAt(date: Date): ThemeMode {
  const h = date.getHours();
  return h >= DARK_FROM_HOUR || h < DARK_UNTIL_HOUR ? 'dark' : 'light';
}

/**
 * Persists the opt-in "Midnight" dark theme. The design-system `ThemeService` owns the live
 * `<html data-theme>` state; persistence belongs to the host app (`<app-slug>.theme`).
 * Until the visitor picks a theme in the Settings popup, the mode follows their local clock
 * (`defaultModeAt`, decided once per page load); an explicit choice is stored and always wins.
 * Keep the hour rule in step with the inline script in `index.html`.
 */
@Injectable({ providedIn: 'root' })
export class ThemePreferenceService {
  private theme = inject(ThemeService);

  /** Overridable in tests. */
  now = () => new Date();

  /** Re-applies the resolved mode so `<meta name="theme-color">` matches what `index.html` already set. */
  init() {
    this.theme.setMode(this.stored() ?? defaultModeAt(this.now()));
  }

  set(mode: ThemeMode) {
    this.theme.setMode(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // localStorage unavailable
    }
  }

  private stored(): ThemeMode | null {
    try {
      const v = localStorage.getItem(THEME_STORAGE_KEY);
      return v === 'dark' || v === 'light' ? v : null;
    } catch {
      return null;
    }
  }
}
