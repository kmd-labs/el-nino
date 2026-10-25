import { Injectable, computed, signal } from '@angular/core';
import { EnsoPhase } from '../models/enso.model';

/** Peak-magnitude tier of a past event. `super` applies to El Niño only. */
export type EnsoTier = 'super' | 'strong' | 'moderate' | 'weak';

export interface EnsoHistorySource {
  id: string;
  title: string;
  url: string;
}

export interface EnsoHistoryEvent {
  /** e.g. "1997/98" — the year the event started plus the next one. */
  season: string;
  phase: 'nino' | 'nina';
  tier: EnsoTier;
  peakOni: number;
  peakMonth: string;
  peakNino12: number | null;
  startMonth: string;
  endMonth: string;
  durationMonths: number;
  /** The record ends mid-event, so peak and duration are provisional. */
  ongoing: boolean;
  /** 24 monthly ONI values: January of the first season year → December of the second. */
  trajectory: (number | null)[];
}

export interface EnsoAnalog {
  season: string;
  endMonth: string;
  rmse: number;
  weight: number;
  /** Shift applied so the member continues from today's level instead of its own. */
  anchor: number;
  future: number[];
  /** Mean over the season peak window (Oct–Dec), the quantity probabilities are taken from. */
  peakMean: number;
  peakMax: number;
}

export interface EnsoForecast {
  method: string;
  windowMonths: number;
  horizonMonths: number;
  members: number;
  fromMonth: string;
  fromOni: number;
  futureMonths: string[];
  peakWindow: string[];
  analogs: EnsoAnalog[];
  median: number[];
  p10: number[];
  p90: number[];
}

/** The month in progress, averaged from CPC's weekly product and bias-corrected to the monthly one. */
export interface EnsoProvisional {
  month: string;
  anom: number;
  /** 3-month mean ending in the partial month — comparable with `index.oni`, but incomplete. */
  oni: number;
  weeks: number;
  lastWeek: string;
  weeklyAnom: number;
  offset: number;
}

export interface EnsoHistoryCurrent {
  season: string;
  phase: 'nino' | 'nina';
  tier: EnsoTier;
  oniNow: number;
  month: string;
  peakSoFar: number;
  peakMonthSoFar: string;
  trajectory: (number | null)[];
}

export interface EnsoHistory {
  schema: number;
  fetchedAt: string;
  sources: EnsoHistorySource[];
  tiers: Record<'super' | 'strong' | 'moderate' | 'weak', number>;
  index: {
    product: string;
    firstMonth: string;
    lastMonth: string;
    spliceFrom: string | null;
    spliceOffset: number;
    anom: number[];
    oni: (number | null)[];
  };
  provisional: EnsoProvisional | null;
  regions: {
    firstMonth: string;
    lastMonth: string;
    nino12: number[];
    nino3: number[];
    nino4: number[];
    nino34: number[];
  };
  events: EnsoHistoryEvent[];
  current: EnsoHistoryCurrent | null;
  forecast: EnsoForecast | null;
}

/**
 * Observed ENSO history (NOAA CPC monthly Niño 3.4, 1950 → present) plus the analog-ensemble
 * forecast for the event in progress, both precomputed by `scripts/fetch-enso-history.mjs`.
 *
 * Unlike EnsoMathService — which models an idealized ENSO analytically — everything here is
 * measured data, so the two must not be mixed in one number without saying which is which.
 */
@Injectable({ providedIn: 'root' })
export class EnsoHistoryService {
  readonly data = signal<EnsoHistory | null>(null);
  readonly status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');

  readonly events = computed<EnsoHistoryEvent[]>(() => this.data()?.events ?? []);
  readonly provisional = computed<EnsoProvisional | null>(() => this.data()?.provisional ?? null);
  readonly current = computed<EnsoHistoryCurrent | null>(() => this.data()?.current ?? null);
  readonly forecast = computed<EnsoForecast | null>(() => this.data()?.forecast ?? null);

  /** Past El Niño events, strongest peak first; the event in progress is excluded. */
  readonly pastNinoEvents = computed<EnsoHistoryEvent[]>(() =>
    this.events()
      .filter(e => e.phase === 'nino' && !e.ongoing)
      .sort((a, b) => b.peakOni - a.peakOni)
  );

  /** Seasons the forecast leans on, for highlighting them among the rest. */
  readonly analogSeasons = computed<Set<string>>(
    () => new Set(this.forecast()?.analogs.map(a => a.season) ?? [])
  );

  load() {
    if (this.status() !== 'idle') return;
    this.status.set('loading');

    fetch('assets/data/enso-history.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<EnsoHistory>;
      })
      .then(data => {
        this.data.set(data);
        this.status.set('ready');
      })
      .catch(err => {
        console.warn('ENSO history unavailable:', err);
        this.status.set('error');
      });
  }

  /**
   * Weighted share of the analog ensemble whose season peak reaches `thresholdC` (°C, Niño 3.4),
   * or null until the data is loaded. With only a handful of members this is a coarse estimate —
   * callers should present it as such.
   */
  peakProbability(thresholdC: number): number | null {
    const analogs = this.forecast()?.analogs;
    if (!analogs?.length) return null;
    let hit = 0;
    let total = 0;
    for (const a of analogs) {
      total += a.weight;
      if (a.peakMean >= thresholdC) hit += a.weight;
    }
    return total > 0 ? hit / total : null;
  }

  /**
   * Observed ONI for a day, read off the month it falls in, with the provisional
   * value standing in for the month still in progress. Null outside the record —
   * which includes anything past the last observation, where there is nothing to read.
   */
  oniAt(iso: string): number | null {
    const d = this.data();
    if (!d) return null;
    const key = iso.slice(0, 7);
    if (d.provisional?.month === key) return d.provisional.oni;
    const [y0, m0] = d.index.firstMonth.split('-').map(Number);
    const [y, m] = key.split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
    return d.index.oni[(y - y0) * 12 + (m - m0)] ?? null;
  }

  /** Tier of an observed ONI value, using the same thresholds as the event catalogue. */
  tierOf(oni: number, phase: EnsoPhase): EnsoTier | null {
    const tiers = this.data()?.tiers;
    if (!tiers) return null;
    const a = Math.abs(oni);
    if (a >= tiers.super && phase !== 'nina') return 'super';
    if (a >= tiers.strong) return 'strong';
    if (a >= tiers.moderate) return 'moderate';
    if (a >= tiers.weak) return 'weak';
    return null;
  }
}
