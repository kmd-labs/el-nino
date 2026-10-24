import { Injectable, computed, effect, signal } from '@angular/core';
import { Dict, Lang, TempUnit } from './i18n.types';
import { PL } from './pl';
import { EN } from './en';
import { ES } from './es';
import { EVENTS_META, SRC_URLS } from '../constants/enso-data';
import { ImpactLocation, ImpactLocationMeta } from '../models/enso.model';

const DICTS: Record<Lang, Dict> = { en: EN, pl: PL, es: ES };
const STORAGE_KEY = 'el-nino.lang';
const TEMP_UNIT_KEY = 'el-nino.temp-unit';
const TEMP_UNIT_MANUAL_KEY = 'el-nino.temp-unit.manual';

/**
 * Manages UI language, localized texts, and temperature units.
 * Initializes from localStorage or Navigator API (falling back to 'en' if not 'en' | 'pl' | 'es'),
 * and persists settings to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly dicts = DICTS;
  readonly langs: Lang[] = ['en', 'pl', 'es'];

  private readonly initialLang = this.resolveInitialLang();
  readonly lang = signal<Lang>(this.initialLang);
  readonly tempUnit = signal<TempUnit>(this.resolveInitialTempUnit(this.initialLang));
  readonly t = computed(() => DICTS[this.lang()]);

  constructor() {
    effect(() => {
      const currentLang = this.lang();
      const d = this.t();
      // document.title, meta description and canonical: SeoService
      if (typeof document !== 'undefined') {
        document.documentElement.lang = d.htmlLang;
      }
      this.persistLang(currentLang);
    });
  }

  setLang(lang: Lang) {
    this.lang.set(lang);
    if (!this.hasManualTempUnit()) {
      const autoUnit: TempUnit = lang === 'en' ? 'F' : 'C';
      this.tempUnit.set(autoUnit);
      this.persistTempUnit(autoUnit, false);
    }
  }

  setTempUnit(unit: TempUnit) {
    this.tempUnit.set(unit);
    this.persistTempUnit(unit, true);
  }

  private hasManualTempUnit(): boolean {
    try {
      return localStorage.getItem(TEMP_UNIT_MANUAL_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private resolveInitialTempUnit(initialLang: Lang): TempUnit {
    try {
      const stored = localStorage.getItem(TEMP_UNIT_KEY);
      if (stored === 'C' || stored === 'F') {
        return stored;
      }
    } catch {
      // localStorage unavailable
    }
    return initialLang === 'en' ? 'F' : 'C';
  }

  private persistTempUnit(unit: TempUnit, manual: boolean) {
    try {
      localStorage.setItem(TEMP_UNIT_KEY, unit);
      if (manual) {
        localStorage.setItem(TEMP_UNIT_MANUAL_KEY, 'true');
      }
    } catch {
      // localStorage unavailable
    }
  }

  /** Resolves an EVENTS_META entry (or ImpactLocation) with texts in the active language. */
  location(locOrMeta: ImpactLocationMeta | ImpactLocation): ImpactLocation {
    const i = EVENTS_META.findIndex(m => m.id === locOrMeta.id);
    const meta = i >= 0 ? EVENTS_META[i] : EVENTS_META[0];
    const dict = this.t();
    const tr = i >= 0 ? dict.events[i] : dict.events[0];

    return {
      id: meta.id,
      lon: meta.lon,
      lat: meta.lat,
      name: tr?.name ?? meta.id,
      region: tr?.region ?? '',
      ev: meta.ev.map((e, j) => {
        const te = tr?.ev[j];
        const url = SRC_URLS[e.srcKey] ?? '';
        const srcTitle = dict.srcTitles[e.srcKey] ?? e.srcKey;
        return {
          ph: e.ph,
          yrs: e.yrs,
          kind: e.kind,
          area: te?.area,
          type: te?.type ?? '',
          aff: te?.aff ?? '',
          note: te?.note,
          src: [srcTitle, url] as [string, string]
        };
      })
    };
  }

  private resolveInitialLang(): Lang {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (this.isSupportedLang(stored)) {
        return stored;
      }
    } catch {
      // localStorage unavailable
    }

    if (typeof navigator !== 'undefined') {
      const candidates = [
        ...(Array.isArray(navigator.languages) ? navigator.languages : []),
        navigator.language
      ].filter(Boolean);

      for (const candidate of candidates) {
        const prefix = candidate.slice(0, 2).toLowerCase();
        if (this.isSupportedLang(prefix)) {
          return prefix;
        }
      }
    }

    return 'en';
  }

  private isSupportedLang(val: string | null | undefined): val is Lang {
    return val === 'en' || val === 'pl' || val === 'es';
  }

  private persistLang(lang: Lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage unavailable
    }
  }
}
