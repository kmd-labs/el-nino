import { Injectable, computed, effect, signal } from '@angular/core';
import { Dict, Lang } from './i18n.types';
import { PL } from './pl';
import { EN } from './en';
import { ES } from './es';
import { EVENTS, SRC } from '../constants/enso-data';
import { ImpactLocation } from '../models/enso.model';

const DICTS: Record<Lang, Dict> = { pl: PL, en: EN, es: ES };
const STORAGE_KEY = 'el-nino.lang';

// SRC key by source URL, to translate the titles of the sources attached to events
const SRC_KEY_BY_URL = new Map(Object.entries(SRC).map(([k, [, url]]) => [url, k]));

/** Current UI language and the localised texts; the welcome page is shown until a language is picked. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly dicts = DICTS;
  readonly langs: Lang[] = ['en', 'es', 'pl'];

  /** Last language used on this device (pre-selected on the welcome page). */
  readonly remembered: Lang | null = this.readStored();
  readonly lang = signal<Lang>(this.remembered ?? 'pl');
  /** false until the visitor picks a language on the welcome page. */
  readonly chosen = signal(false);

  readonly t = computed(() => DICTS[this.lang()]);

  constructor() {
    effect(() => {
      const d = this.t();
      document.documentElement.lang = d.htmlLang;
      document.title = d.docTitle;
    });
  }

  choose(lang: Lang) {
    this.lang.set(lang);
    this.chosen.set(true);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // storage unavailable (private mode etc.) — the choice just isn't remembered
    }
  }

  /** Re-open the welcome page to switch language. */
  reopen() {
    this.chosen.set(false);
  }

  /** An EVENTS location with its texts in the current language (falls back to Polish). */
  location(loc: ImpactLocation): ImpactLocation {
    const i = EVENTS.indexOf(loc);
    const tr = i >= 0 ? this.t().events[i] : undefined;
    if (!tr) return loc;
    return {
      ...loc,
      name: tr.name,
      region: tr.region,
      ev: loc.ev.map((e, j) => {
        const te = tr.ev[j];
        const key = SRC_KEY_BY_URL.get(e.src[1]);
        const srcTitle = (key && this.t().srcTitles[key]) || e.src[0];
        return te
          ? { ...e, area: te.area, type: te.type, aff: te.aff, note: te.note, src: [srcTitle, e.src[1]] as [string, string] }
          : e;
      })
    };
  }

  private readStored(): Lang | null {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'pl' || v === 'en' || v === 'es' ? v : null;
    } catch {
      return null;
    }
  }
}
