import { Injectable, inject } from '@angular/core';
import { ThemeMode, ThemeService } from '@kmd/design-system/services/theme.service';

/** Must match the key read by the inline script in `index.html` (applied before Angular boots). */
export const THEME_STORAGE_KEY = 'el-nino.theme';

/**
 * Persists the opt-in "Midnight" dark theme. The design-system `ThemeService` owns the live
 * `<html data-theme>` state; persistence belongs to the host app (`<app-slug>.theme`).
 * Light stays the default — only an explicit choice in the Settings popup turns dark mode on.
 */
@Injectable({ providedIn: 'root' })
export class ThemePreferenceService {
  private theme = inject(ThemeService);

  /** Re-applies the stored mode so `<meta name="theme-color">` matches what `index.html` already set. */
  init() {
    this.theme.setMode(this.read());
  }

  set(mode: ThemeMode) {
    this.theme.setMode(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // localStorage unavailable
    }
  }

  private read(): ThemeMode {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
}
