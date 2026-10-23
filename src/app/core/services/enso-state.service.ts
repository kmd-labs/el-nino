import { Injectable, computed, inject, signal } from '@angular/core';
import { DisplayMode, EnsoPhase, ImpactLocationMeta, PhaseInfo, ViewMode } from '../models/enso.model';
import { CYCLE_FORECAST_FROM, CYCLE_START_YEAR, EVENTS_META, PRESETS } from '../constants/enso-data';
import { EnsoMathService } from './enso-math.service';
import { I18nService } from '../i18n/i18n.service';

/** First weekly NOAA frame (6 Nov 2024); the animation starts exactly here. */
const EARLIEST_STRENGTH = -1.8;
const NOW_STRENGTH = 1.4;

@Injectable({
  providedIn: 'root'
})
export class EnsoStateService {
  private math = inject(EnsoMathService);
  private i18n = inject(I18nService);

  // Start at the first observed keyframe (6 Nov 2024), animating towards NOW
  readonly sTarget = signal<number>(EARLIEST_STRENGTH);
  readonly sCur = signal<number>(EARLIEST_STRENGTH);
  readonly displayMode = signal<DisplayMode>('sst');
  readonly view = signal<ViewMode>('globe');
  /** Views that replace the globe with a flat cross-section (the globe stays hidden and paused). */
  readonly crossSectionView = computed(() => this.view() === 'walker');
  readonly showAtmosphere = signal<boolean>(true);
  readonly showEvents = signal<boolean>(true);
  readonly autoRotate = signal<boolean>(true);
  readonly isPlaying = signal<boolean>(true);
  /** False while the splash loader is visible; the cycle and globe animations hold still. */
  readonly experienceReady = signal<boolean>(false);
  /** True after the first fully rendered interactive globe frame (labels included). */
  readonly sceneReady = signal<boolean>(false);
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
   * Rough chance that the 2026 ENSO peak (Oct–Dec, Niño 3.4) falls in the slider's range.
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

  /**
   * Unlocks the globe (and its labels) without starting the clock, so the splash
   * host can render the first frame behind the loader.
   */
  prepareExperience() {
    if (this.experienceReady()) return;
    this.experienceReady.set(true);
    this.autoRotate.set(true);
    // Hold the clock at the first keyframe until the splash actually fades.
    this.isPlaying.set(false);
  }

  /** Starts the cycle from the first keyframe once the splash begins to fade. */
  beginExperience() {
    this.prepareExperience();
    if (!this.isPlaying()) this.startPlaying();
  }

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
    if (!this.experienceReady() || !this.isPlaying()) return;
    const speed = (NOW_STRENGTH - EARLIEST_STRENGTH) / 12; // 12 seconds from Nov 2024 to Oct 2026
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
    if (!this.experienceReady()) return;
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
