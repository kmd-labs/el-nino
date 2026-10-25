import { Injectable, computed, inject, signal } from '@angular/core';
import { DisplayMode, EnsoPhase, ImpactLocationMeta, PhaseInfo, ViewMode } from '../models/enso.model';
import { EVENTS_META, PRESETS } from '../constants/enso-data';
import { EnsoMathService } from './enso-math.service';
import { EnsoHistoryService } from './enso-history.service';
import { CurrentWeatherService } from './current-weather.service';
import { I18nService } from '../i18n/i18n.service';

const EARLIEST_STRENGTH = -1.8;
const NOW_STRENGTH = 1.4;
/** The automatic intro on page load. */
const INTRO_DURATION_S = 12;
/** Play pressed by the user, at 1×: three times as long as the intro so the changes can be followed. */
const PLAY_DURATION_S = 36;
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

@Injectable({
  providedIn: 'root'
})
export class EnsoStateService {
  private math = inject(EnsoMathService);
  private history = inject(EnsoHistoryService);
  private weather = inject(CurrentWeatherService);
  private i18n = inject(I18nService);
  /** Position of the running playback, 0–1 (eased into strength in updateCycle). */
  private playProgress = 0;
  /** The running playback is the intro, which ignores the speed setting. */
  private introRun = false;
  /** Set by a shared link: the intro animation is skipped so the linked state stays on screen. */
  private skipIntro = false;

  readonly sTarget = signal<number>(EARLIEST_STRENGTH);
  readonly sCur = signal<number>(EARLIEST_STRENGTH);
  readonly displayMode = signal<DisplayMode>('sst');
  readonly view = signal<ViewMode>('globe');
  /** Views that replace the globe with a flat cross-section or chart (the globe stays hidden and paused). */
  readonly crossSectionView = computed(() => this.view() === 'walker' || this.view() === 'cycles');
  readonly showAtmosphere = signal<boolean>(true);
  readonly showEvents = signal<boolean>(true);
  readonly autoRotate = signal<boolean>(true);
  readonly isPlaying = signal<boolean>(true);
  readonly playbackSpeed = signal<number>(1);
  readonly experienceReady = signal<boolean>(false);
  /** True once the splash has handed over and the intro (if any) has started. */
  readonly experienceStarted = signal<boolean>(false);
  readonly sceneReady = signal<boolean>(false);
  readonly mapLoaded = signal<boolean>(false);
  readonly mapError = signal<boolean>(false);

  constructor() {}

  readonly selectedLocation = signal<ImpactLocationMeta | null>(null);
  readonly hoveredLocation = signal<ImpactLocationMeta | null>(null);

  /**
   * Niño 3.4 as the record holds it, with the analytic model standing in only until
   * the timeline loads. Every phase name hangs off this — the badge, the legend
   * title, the Walker narration, which impact pins light up — so it has to be the
   * observed series. The 0.918 · s ramp still drives the globe's physics, but it is
   * not the ocean: it reads the quiet mid-2025 weeks as La Niña.
   */
  readonly nino34Value = computed<number>(() => {
    return this.weather.nino34AnomAt(this.sCur()) ?? this.math.nino34(this.sCur());
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

  prepareExperience() {
    if (this.experienceReady()) return;
    this.experienceReady.set(true);
    this.autoRotate.set(true);
    this.isPlaying.set(false);
  }

  beginExperience() {
    this.prepareExperience();
    if (this.experienceStarted()) return;
    this.experienceStarted.set(true);
    if (!this.isPlaying() && !this.skipIntro) {
      this.startPlaying();
      this.introRun = true;
    }
  }

  /** Applies a view and/or strength from a shared link; a linked moment skips the intro animation. */
  applySharedState(view: ViewMode | null, strength: number | null, skipIntro = strength !== null) {
    if (skipIntro) this.skipIntro = true;
    if (view) this.view.set(view);
    if (strength !== null) {
      this.sTarget.set(strength);
      this.sCur.set(strength);
    }
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
    this.introRun = false;
    if (this.sTarget() >= NOW_STRENGTH - 0.05) {
      this.sTarget.set(EARLIEST_STRENGTH);
      this.sCur.set(EARLIEST_STRENGTH);
      this.playProgress = 0;
    } else {
      this.sCur.set(this.sTarget());
      this.playProgress = this.progressForStrength(this.sTarget());
    }
    this.isPlaying.set(true);
  }

  setPlaybackSpeed(speed: number) {
    if (PLAYBACK_SPEEDS.includes(speed)) this.playbackSpeed.set(speed);
  }

  stopPlaying() {
    if (this.isPlaying()) {
      this.isPlaying.set(false);
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
    if (!this.experienceReady() || !this.isPlaying()) return;
    // progress (not elapsed time) is kept, so a speed change mid-play continues without a jump
    const duration = this.introRun ? INTRO_DURATION_S : PLAY_DURATION_S / this.playbackSpeed();
    this.playProgress = Math.min(1, this.playProgress + dt / duration);
    const t = this.playProgress;
    const nextS = EARLIEST_STRENGTH + (NOW_STRENGTH - EARLIEST_STRENGTH) * this.ease(t);
    if (t >= 1) {
      this.sTarget.set(NOW_STRENGTH);
      this.sCur.set(NOW_STRENGTH);
      this.stopPlaying();
    } else {
      this.sTarget.set(nextS);
    }
  }

  private ease(t: number): number {
    const smooth = t * t * (3 - 2 * t);
    return 0.15 * t + 0.85 * smooth;
  }

  private progressForStrength(s: number): number {
    const p = Math.max(0, Math.min(1,
      (s - EARLIEST_STRENGTH) / (NOW_STRENGTH - EARLIEST_STRENGTH)
    ));
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (this.ease(mid) < p) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
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
