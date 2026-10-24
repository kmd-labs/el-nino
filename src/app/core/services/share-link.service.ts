import { Injectable, effect, inject } from '@angular/core';
import { PRESETS } from '../constants/enso-data';
import { EnsoPhase, ViewMode } from '../models/enso.model';
import { I18nService } from '../i18n/i18n.service';
import { Lang } from '../i18n/i18n.types';
import { EnsoStateService } from './enso-state.service';

/** Same range as the strength slider in the map dock. */
const STRENGTH_MIN = -2;
const STRENGTH_MAX = 3;
const VIEWS: ViewMode[] = ['globe', 'walker', 'impacts'];
/** Older view names from the issue proposal, both meaning the temperature globe. */
const VIEW_ALIASES: Record<string, ViewMode> = { sst: 'globe', anom: 'globe' };
const NOW_STRENGTH = PRESETS.find(p => p.now)?.strength ?? 1.4;
const SYNC_DELAY_MS = 400;

/**
 * Deep links such as `?view=walker&state=super` (or `state=0.85` for a slider position).
 * Reads them on start-up, keeps the address bar in sync while the user explores and builds
 * the URL for the share button. Default values are left out so the plain URL stays clean.
 */
@Injectable({ providedIn: 'root' })
export class ShareLinkService {
  private state = inject(EnsoStateService);
  private i18n = inject(I18nService);
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.applyFromUrl();

    effect(() => {
      const view = this.state.view();
      const strength = this.state.sTarget();
      if (!this.state.experienceReady() || this.state.isPlaying()) return;
      if (this.syncTimer !== null) clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(() => this.syncUrl(view, strength), SYNC_DELAY_MS);
    });
  }

  /** Link to the current view and strength, without unrelated query parameters. */
  buildUrl(): string {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    this.writeParams(url.searchParams, this.state.view(), this.state.sTarget());
    return url.toString();
  }

  private applyFromUrl() {
    if (typeof location === 'undefined') return;
    const params = new URLSearchParams(location.search);
    const lang = params.get('lang');
    if (lang && (this.i18n.langs as string[]).includes(lang)) {
      this.i18n.setLang(lang as Lang);
    }
    this.state.applySharedState(this.parseView(params.get('view')), this.parseStrength(params.get('state')));
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

  private writeParams(params: URLSearchParams, view: ViewMode, strength: number) {
    if (view === 'globe') params.delete('view');
    else params.set('view', view);
    if (Math.abs(strength - NOW_STRENGTH) < 0.01) params.delete('state');
    else params.set('state', this.formatStrength(strength));
  }

  private syncUrl(view: ViewMode, strength: number) {
    this.syncTimer = null;
    const url = new URL(location.href);
    this.writeParams(url.searchParams, view, strength);
    if (url.href === location.href) return;
    try {
      history.replaceState(history.state, '', url);
    } catch {
      // Some browsers throttle history updates; the share button still builds the link
    }
  }
}
