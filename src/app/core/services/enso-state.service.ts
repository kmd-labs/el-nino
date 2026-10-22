import { Injectable, computed, inject, signal } from '@angular/core';
import { DisplayMode, EnsoPhase, ImpactLocationMeta, PhaseInfo, ViewMode } from '../models/enso.model';
import { CYCLE_FORECAST_FROM, CYCLE_START_YEAR, EVENTS_META, PRESETS } from '../constants/enso-data';
import { EnsoMathService } from './enso-math.service';
import { EnsoHistoryService } from './enso-history.service';
import { I18nService } from '../i18n/i18n.service';

const EARLIEST_STRENGTH = -1.6;
const NOW_STRENGTH = 1.4;

@Injectable({
  providedIn: 'root'
})
export class EnsoStateService {
  private math = inject(EnsoMathService);
  private history = inject(EnsoHistoryService);
  private i18n = inject(I18nService);

  // Start at the earliest keyframe (Jan 2025), animating towards NOW
  readonly sTarget = signal<number>(EARLIEST_STRENGTH);
  readonly sCur = signal<number>(EARLIEST_STRENGTH);
  readonly displayMode = signal<DisplayMode>('sst');
  readonly view = signal<ViewMode>('globe');
  /** Views that replace the globe with a flat cross-section or chart (the globe stays hidden and paused). */
  readonly crossSectionView = computed(() =>
    this.view() === 'walker' || this.view() === 'thermocline' || this.view() === 'cycles'
  );
  readonly showAtmosphere = signal<boolean>(true);
  readonly showEvents = signal<boolean>(true);
  readonly autoRotate = signal<boolean>(true);
  readonly isPlaying = signal<boolean>(true);
  readonly cycleT = signal<number>(0);
  /** Month index (0–47) of the running ENSO cycle, null when it is not playing. */
  readonly cycleMonth = signal<number | null>(null);
  readonly mapLoaded = signal<boolean>(false);
  readonly mapError = signal<boolean>(false);

  constructor() {}

  readonly selectedLocation = signal<ImpactLocationMeta | null>(null);
  readonly hoveredLocation = signal<ImpactLocationMeta | null>(null);

  readonly nino34Value = computed<number>(() => {
    return this.math.nino34(this.sCur());
  });

  /** Indian Ocean Dipole index (°C) for the current state. */
  readonly dmiValue = computed<number>(() => this.math.dmi(this.sCur()));

  readonly category = computed<PhaseInfo>(() => {
    const c = this.math.category(this.nino34Value());
    return { ...c, name: this.i18n.t().phase[c.k] };
  });

  readonly phase = computed<EnsoPhase>(() => {
    return this.category().k;
  });

  readonly description = computed<string>(() => {
    return this.i18n.t().desc[this.phase()];
  });

  readonly activeEventsCount = computed<number>(() => {
    const currentPhase = this.phase();
    return EVENTS_META.filter(l => l.ev.some(e => e.ph === currentPhase)).length;
  });

  readonly hint = computed<string>(() => {
    const t = this.i18n.t();
    if (this.phase() === 'neu') return t.hintNeutral;
    return t.hintPins(this.activeEventsCount(), this.category().name);
  });

  /** "Yr 3 · December (≈ 2026, forecast)" for the running cycle, '' when stopped. */
  readonly monthText = computed<string>(() => {
    const m = this.cycleMonth();
    if (m === null) return '';
    const t = this.i18n.t();
    const year = Math.floor(m / 12) + 1;
    return t.cycleMonth(year, t.months[m % 12], CYCLE_START_YEAR + year - 1, m >= CYCLE_FORECAST_FROM);
  });

  /**
   * Chance that this season's ENSO peak (Oct–Dec, Niño 3.4) reaches the value the slider shows,
   * taken from the analog ensemble in `enso-history.json`. Five weighted members cannot support
   * more precision than a step of 5%, hence the rounding and the leading "~".
   */
  readonly prob2026 = computed<string>(() => {
    const p = this.history.peakProbability(this.math.nino34(this.sTarget()));
    if (p === null) return '—';
    if (p >= 0.95) return '>95%';
    if (p <= 0.05) return '<5%';
    return `~${Math.round(p * 20) * 5}%`;
  });

  setStrengthTarget(val: number) {
    this.stopPlaying();
    this.sTarget.set(val);
  }

  setPreset(val: number) {
    this.stopPlaying();
    this.sTarget.set(val);
  }

  startPlaying() {
    if (this.sTarget() >= NOW_STRENGTH - 0.05) {
      this.sTarget.set(EARLIEST_STRENGTH);
      this.sCur.set(EARLIEST_STRENGTH);
    } else {
      this.sCur.set(this.sTarget());
    }
    this.isPlaying.set(true);
  }

  stopPlaying() {
    if (this.isPlaying()) {
      this.isPlaying.set(false);
      this.cycleMonth.set(null);
    }
  }

  togglePlaying() {
    if (this.isPlaying()) {
      this.stopPlaying();
    } else {
      this.startPlaying();
    }
  }

  setDisplayMode(mode: DisplayMode) {
    this.displayMode.set(mode);
    this.setView('globe');
  }

  setView(v: ViewMode) {
    if (v === this.view()) return;
    this.view.set(v);
    if (this.crossSectionView()) {
      this.selectedLocation.set(null);
    }
  }

  toggleAtmosphere(val?: boolean) {
    this.showAtmosphere.update(v => val !== undefined ? val : !v);
  }

  toggleEvents(val?: boolean) {
    this.showEvents.update(v => val !== undefined ? val : !v);
    if (!this.showEvents()) {
      this.selectedLocation.set(null);
    }
  }

  toggleAutoRotate(val?: boolean) {
    this.autoRotate.update(v => val !== undefined ? val : !v);
  }

  selectLocation(loc: ImpactLocationMeta | null) {
    this.selectedLocation.set(loc);
    if (loc) {
      this.autoRotate.set(false);
    }
  }

  setHoveredLocation(loc: ImpactLocationMeta | null) {
    this.hoveredLocation.set(loc);
  }

  updateCycle(dt: number) {
    if (!this.isPlaying()) return;
    const speed = (NOW_STRENGTH - EARLIEST_STRENGTH) / 12; // 12 seconds from Jan 2025 to Oct 2026
    const nextS = this.sTarget() + dt * speed;
    if (nextS >= NOW_STRENGTH) {
      this.sTarget.set(NOW_STRENGTH);
      this.sCur.set(NOW_STRENGTH);
      this.stopPlaying();
    } else {
      this.sTarget.set(nextS);
    }
  }

  updateInterpolatedStrength(dt: number) {
    if (this.isPlaying()) {
      this.sCur.set(this.sTarget());
      return;
    }
    const cur = this.sCur();
    const target = this.sTarget();
    const next = cur + (target - cur) * Math.min(1, dt * 5.0);
    this.sCur.set(next);
  }
}
