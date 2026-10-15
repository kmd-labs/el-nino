import { Injectable, computed, inject, signal } from '@angular/core';
import { DisplayMode, EnsoPhase, ImpactLocation, PhaseInfo, ViewMode } from '../models/enso.model';
import { CYCLE_FORECAST_FROM, CYCLE_START_YEAR, EVENTS, PRESETS } from '../constants/enso-data';
import { EnsoMathService } from './enso-math.service';
import { I18nService } from '../i18n/i18n.service';

/** Initial ENSO strength: the "El Niño" preset. */
const START_STRENGTH = PRESETS.find(p => p.ph === 'nino')!.strength;

@Injectable({
  providedIn: 'root'
})
export class EnsoStateService {
  private math = inject(EnsoMathService);
  private i18n = inject(I18nService);

  // start (desktop and mobile) in El Niño, shown as a temperature anomaly
  readonly sTarget = signal<number>(START_STRENGTH);
  readonly sCur = signal<number>(START_STRENGTH);
  readonly displayMode = signal<DisplayMode>('anom');
  readonly view = signal<ViewMode>('globe');
  readonly glossaryOpen = signal<boolean>(false);
  readonly showAtmosphere = signal<boolean>(true);
  readonly showEvents = signal<boolean>(true);
  readonly autoRotate = signal<boolean>(true);
  readonly isPlaying = signal<boolean>(false);
  readonly cycleT = signal<number>(0);
  /** Month index (0–47) of the running ENSO cycle, null when it is not playing. */
  readonly cycleMonth = signal<number | null>(null);
  readonly mapLoaded = signal<boolean>(false);
  readonly mapError = signal<boolean>(false);

  readonly selectedLocation = signal<ImpactLocation | null>(null);
  readonly hoveredLocation = signal<ImpactLocation | null>(null);

  readonly nino34Value = computed<number>(() => {
    return this.math.nino34(this.sCur());
  });

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
    return EVENTS.filter(l => l.ev.some(e => e.ph === currentPhase)).length;
  });

  readonly hint = computed<string>(() => {
    const t = this.i18n.t();
    if (this.phase() === 'neu') return t.hintNeutral;
    return t.hintPins(this.activeEventsCount(), this.category().name);
  });

  /** "Year 3 · December (≈ 2026, forecast)" for the running cycle, '' when stopped. */
  readonly monthText = computed<string>(() => {
    const m = this.cycleMonth();
    if (m === null) return '';
    const t = this.i18n.t();
    const year = Math.floor(m / 12) + 1;
    // approximate real time of the current cycle (see CYCLE_START_YEAR)
    return t.cycleMonth(year, t.months[m % 12], CYCLE_START_YEAR + year - 1, m >= CYCLE_FORECAST_FROM);
  });

  /**
   * Very rough chance that the 2026 ENSO peak (Oct–Dec, Niño 3.4) falls in the slider's range.
   * Based on the NOAA CPC ENSO discussion of 8 Oct 2026: El Niño advisory, Niño 3.4 ≈ +2.1 °C,
   * ~83% chance of ≥ +2.5 °C in Oct–Dec.
   */
  readonly prob2026 = computed<string>(() => {
    const n = this.math.nino34(this.sTarget());
    if (n >= 2.5) return '~83%';
    if (n >= 2.0) return '~10%';
    if (n >= 1.5) return '~4%';
    if (n >= 1.0) return '~2%';
    if (n >= 0.5) return '~1%';
    return '<1%';
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
    this.isPlaying.set(true);
    this.cycleT.set(0);
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
    if (v === 'walker') {
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

  toggleGlossary(open?: boolean) {
    this.glossaryOpen.update(v => open !== undefined ? open : !v);
  }

  selectLocation(loc: ImpactLocation | null) {
    this.selectedLocation.set(loc);
    if (loc) {
      this.autoRotate.set(false);
    }
  }

  setHoveredLocation(loc: ImpactLocation | null) {
    this.hoveredLocation.set(loc);
  }

  updateCycle(dt: number) {
    if (!this.isPlaying()) return;
    const nextT = this.cycleT() + dt / 0.6;
    this.cycleT.set(nextT);
    const newTarget = this.math.cycleS(nextT);
    this.sTarget.set(newTarget);

    const m = Math.floor(nextT) % 48;
    if (m !== this.cycleMonth()) this.cycleMonth.set(m);
  }

  updateInterpolatedStrength(dt: number) {
    const cur = this.sCur();
    const target = this.sTarget();
    const next = cur + (target - cur) * Math.min(1, dt * 2.5);
    this.sCur.set(next);
  }
}
