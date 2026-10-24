import { Injectable, effect, inject } from '@angular/core';
import { PRESETS } from '../constants/enso-data';
import { EnsoPhase, ViewMode } from '../models/enso.model';
import { I18nService } from '../i18n/i18n.service';
import { Lang } from '../i18n/i18n.types';
import { CurrentWeatherService } from './current-weather.service';
import { EnsoStateService } from './enso-state.service';

/** `date` pins a day of the data, `state` pins an ENSO strength (preset or slider position). */
export type ShareMode = 'date' | 'state';

/** Same range as the strength slider in the map dock. */
const STRENGTH_MIN = -2;
const STRENGTH_MAX = 3;
const VIEWS: ViewMode[] = ['globe', 'walker', 'impacts'];
/** Older view names from the issue proposal, both meaning the temperature globe. */
const VIEW_ALIASES: Record<string, ViewMode> = { sst: 'globe', anom: 'globe' };
const NOW_STRENGTH = PRESETS.find(p => p.now)?.strength ?? 1.4;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const SYNC_DELAY_MS = 400;

/**
 * Deep links such as `?view=walker&state=super`, `?state=0.85` or `?date=2025-03-12`.
 * Reads them on start-up, keeps the address bar in sync while the user explores and builds
 * the URL for the share menu. The address bar leaves defaults out so the plain URL stays clean.
 */
@Injectable({ providedIn: 'root' })
export class ShareLinkService {
  private state = inject(EnsoStateService);
  private weather = inject(CurrentWeatherService);
  private i18n = inject(I18nService);
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  /** Day from a shared link, applied once the timeline data has loaded. */
  private pendingDate: string | null = null;
  /** What the shared link set, so the address bar keeps the link until the user changes something. */
  private linked: { view: ViewMode; strength: number } | null = null;

  constructor() {
    this.applyFromUrl();

    effect(() => {
      if (!this.pendingDate || !this.weather.meta()) return;
      const strength = this.weather.strengthForDate(this.pendingDate);
      this.pendingDate = null;
      if (strength === null) return;
      this.state.applySharedState(null, strength);
      this.linked = { view: this.state.view(), strength };
    });

    effect(() => {
      const view = this.state.view();
      const strength = this.state.sTarget();
      if (!this.state.experienceStarted() || this.state.isPlaying()) return;
      if (this.syncTimer !== null) clearTimeout(this.syncTimer);
      if (this.linked && this.linked.view === view && this.linked.strength === strength) return;
      this.linked = null;
      this.syncTimer = setTimeout(() => this.syncUrl(view, strength), SYNC_DELAY_MS);
    });
  }

  /** Day shown for the current slider position, null until the timeline data has loaded. */
  currentDate(): string | null {
    return this.weather.dateIsoAt(this.state.sTarget());
  }

  /** Link to the current view plus either the shown day or the ENSO state. */
  buildUrl(mode: ShareMode): string {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    const params = url.searchParams;
    const view = this.state.view();
    if (view !== 'globe') params.set('view', view);
    const date = mode === 'date' ? this.currentDate() : null;
    if (date) params.set('date', date);
    else params.set('state', this.formatStrength(this.state.sTarget()));
    return url.toString();
  }

  private applyFromUrl() {
    if (typeof location === 'undefined') return;
    const params = new URLSearchParams(location.search);
    const lang = params.get('lang');
    if (lang && (this.i18n.langs as string[]).includes(lang)) {
      this.i18n.setLang(lang as Lang);
    }

    const view = this.parseView(params.get('view'));
    const date = params.get('date');
    if (date && ISO_DAY.test(date) && Number.isFinite(Date.parse(date))) {
      this.pendingDate = date;
      this.state.applySharedState(view, null, true);
      return;
    }
    const strength = this.parseStrength(params.get('state'));
    this.state.applySharedState(view, strength);
    if (strength !== null) this.linked = { view: this.state.view(), strength };
  }

  private parseView(raw: string | null): ViewMode | null {
    if (!raw) return null;
    const v = raw.toLowerCase();
    return VIEW_ALIASES[v] ?? (VIEWS.includes(v as ViewMode) ? (v as ViewMode) : null);
  }

  private parseStrength(raw: string | null): number | null {
    if (!raw) return null;
    const preset = PRESETS.find(p => p.ph === (raw.toLowerCase() as EnsoPhase));
    if (preset) return preset.strength;
    const n = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(n)) return null;
    return Math.min(STRENGTH_MAX, Math.max(STRENGTH_MIN, n));
  }

  /** Preset name when the strength sits on a preset marker, otherwise the value to 2 decimals. */
  private formatStrength(s: number): string {
    const preset = PRESETS.find(p => Math.abs(p.strength - s) < 0.01);
    return preset ? preset.ph : String(Math.round(s * 100) / 100);
  }

  /** Address bar: view and state only, defaults left out, unrelated params (utm_*, lang) kept. */
  private syncUrl(view: ViewMode, strength: number) {
    this.syncTimer = null;
    const url = new URL(location.href);
    const params = url.searchParams;
    params.delete('date');
    if (view === 'globe') params.delete('view');
    else params.set('view', view);
    if (Math.abs(strength - NOW_STRENGTH) < 0.01) params.delete('state');
    else params.set('state', this.formatStrength(strength));
    if (url.href === location.href) return;
    try {
      history.replaceState(history.state, '', url);
    } catch {
      // Some browsers throttle history updates; the share menu still builds the link
    }
  }
}
