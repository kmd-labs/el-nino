import { Injectable, computed, effect, signal } from '@angular/core';
import { Dict, Lang } from './i18n.types';
import { PL } from './pl';
import { EN } from './en';
import { ES } from './es';
import { EVENTS_META, SRC_URLS } from '../constants/enso-data';
import { ImpactLocation, ImpactLocationMeta } from '../models/enso.model';

const DICTS: Record<Lang, Dict> = { en: EN, pl: PL, es: ES };
const STORAGE_KEY = 'el-nino.lang';

/**
 * Manages UI language and localized texts.
 * Initializes from localStorage or Navigator API (falling back to 'en' if not 'en' | 'pl' | 'es'),
 * and persists language selection to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly dicts = DICTS;
  readonly langs: Lang[] = ['en', 'pl', 'es'];

  readonly lang = signal<Lang>(this.resolveInitialLang());
  readonly t = computed(() => DICTS[this.lang()]);

  constructor() {
    effect(() => {
      const currentLang = this.lang();
      const d = this.t();
      if (typeof document !== 'undefined') {
        document.documentElement.lang = d.htmlLang;
        document.title = d.docTitle;
        document.querySelector('meta[name="description"]')?.setAttribute('content', d.metaDescription);
      }
      this.persistLang(currentLang);
    });
  }

  setLang(lang: Lang) {
    this.lang.set(lang);
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
