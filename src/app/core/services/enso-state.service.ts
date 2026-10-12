import { Injectable, computed, inject, signal } from '@angular/core';
import { DisplayMode, EnsoPhase, ImpactLocation, PhaseInfo } from '../models/enso.model';
import { DESC, EVENTS, MON } from '../constants/enso-data';
import { EnsoMathService } from './enso-math.service';

@Injectable({
  providedIn: 'root'
})
export class EnsoStateService {
  private math = inject(EnsoMathService);

  readonly sTarget = signal<number>(0);
  readonly sCur = signal<number>(0);
  readonly displayMode = signal<DisplayMode>('sst');
  readonly showAtmosphere = signal<boolean>(true);
  readonly showEvents = signal<boolean>(true);
  readonly autoRotate = signal<boolean>(true);
  readonly isPlaying = signal<boolean>(false);
  readonly cycleT = signal<number>(0);
  readonly monthText = signal<string>('');
  readonly mapLoaded = signal<boolean>(false);
  readonly mapError = signal<string | null>(null);

  readonly selectedLocation = signal<ImpactLocation | null>(null);
  readonly hoveredLocation = signal<ImpactLocation | null>(null);
  readonly panelCollapsed = signal<boolean>(false);

  readonly nino34Value = computed<number>(() => {
    return this.math.nino34(this.sCur());
  });

  readonly category = computed<PhaseInfo>(() => {
    return this.math.category(this.nino34Value());
  });

  readonly phase = computed<EnsoPhase>(() => {
    return this.category().k;
  });

  readonly description = computed<string>(() => {
    return DESC[this.phase()];
  });

  readonly activeEventsCount = computed<number>(() => {
    const currentPhase = this.phase();
    return EVENTS.filter(l => l.ev.some(e => e.ph === currentPhase)).length;
  });

  readonly hint = computed<string>(() => {
    const ph = this.phase();
    const cat = this.category();
    if (ph === 'neu') {
      return 'W fazie neutralnej nie ma pinezek. Wybierz La Niña, El Niño lub Super El Niño, aby zobaczyć historyczne skutki.';
    }
    return `${this.activeEventsCount()} lokalizacji z udokumentowanymi skutkami fazy ${cat.name}. Kliknij pinezkę, aby zobaczyć dane i źródło.`;
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
      this.monthText.set('');
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

  togglePanel() {
    this.panelCollapsed.update(v => !v);
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
    const year = Math.floor(m / 12) + 1;
    const month = MON[m % 12];
    this.monthText.set(`Rok ${year} · ${month}`);
  }

  updateInterpolatedStrength(dt: number) {
    const cur = this.sCur();
    const target = this.sTarget();
    const next = cur + (target - cur) * Math.min(1, dt * 2.5);
    this.sCur.set(next);
  }
}
