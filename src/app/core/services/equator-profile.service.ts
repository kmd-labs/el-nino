import { Injectable, signal } from '@angular/core';

/**
 * Terrain along the equator, as `scripts/fetch-equator-profile.mjs` writes it: one ETOPO2v2c
 * sample per `step` degrees of longitude, metres, positive above sea level.
 */
export interface EquatorProfile {
  source: string;
  sourceUrl: string;
  lat: number;
  lon0: number;
  lon1: number;
  step: number;
  elev: number[];
}

/**
 * The ground the Walker cross-section stands on. A single committed file — the terrain does
 * not change, so unlike the weather assets this is never refreshed.
 */
@Injectable({ providedIn: 'root' })
export class EquatorProfileService {
  readonly data = signal<EquatorProfile | null>(null);
  readonly status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');

  load() {
    if (this.status() !== 'idle') return;
    this.status.set('loading');

    fetch('assets/data/equator-profile.json', { cache: 'no-cache' })
      .then(r => {
        if (!r.ok) throw new Error(`Equator profile HTTP ${r.status}`);
        return r.json() as Promise<EquatorProfile>;
      })
      .then(p => {
        if (!p?.elev?.length) throw new Error('Equator profile is empty');
        this.data.set(p);
        this.status.set('ready');
      })
      .catch(err => {
        // The cross-section still draws; it simply has no coastline under it.
        console.warn('Equator profile unavailable:', err);
        this.status.set('error');
      });
  }
}
