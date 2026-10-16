import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'el-nino.theme';

/**
 * Manages Light/Dark color theme, initializing from localStorage or browser/OS preference
 * (Navigator/Window matchMedia API) and persisting changes to localStorage.
 * Also provides runtime access to SCSS design token CSS custom properties.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeMode>(this.resolveInitialTheme());

  constructor() {
    this.applyTheme(this.theme());

    effect(() => {
      const current = this.theme();
      this.applyTheme(current);
      this.persistTheme(current);
    });
  }

  setTheme(mode: ThemeMode) {
    this.theme.set(mode);
  }

  toggleTheme() {
    this.theme.update(m => (m === 'dark' ? 'light' : 'dark'));
  }

  /** Reads a `--color-<token>` CSS custom property from `:root` (derived from `_variables.scss`). */
  getTokenColor(token: string, fallback = '#000000'): string {
    if (typeof document === 'undefined') return fallback;
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue(`--color-${token}`)
      .trim();
    return val || fallback;
  }

  private applyTheme(mode: ThemeMode) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  }

  private resolveInitialTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // Storage unavailable
    }

    // Assume setting from browser / navigator environment
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  }

  private persistTheme(mode: ThemeMode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage unavailable
    }
  }
}
