import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplashComponent } from '@kmd/design-system/ui/splash/splash.component';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { CurrentWeatherService } from '../../core/services/current-weather.service';
import { I18nService } from '../../core/i18n/i18n.service';

/** Keep the handwritten logo animation visible long enough to finish gracefully. */
const MIN_VISIBLE_MS = 2400;
/** Hard stop: never leave the app behind the splash if an asset request hangs. */
const MAX_WAIT_MS = 12000;
const FADE_MS = 620;

/**
 * App-side splash host: owns readiness detection and timing, while the visual
 * loader itself is the shared `<app-splash>` design-system component.
 */
@Component({
  selector: 'app-splash-host',
  standalone: true,
  imports: [CommonModule, SplashComponent],
  templateUrl: './splash-host.component.html'
})
export class SplashHostComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  private weather = inject(CurrentWeatherService);

  readonly fading = signal(false);
  readonly gone = signal(false);

  private readonly startedAt = performance.now();
  private readyHandled = false;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly maxWaitTimer = setTimeout(() => this.finish(), MAX_WAIT_MS);

  readonly ready = computed(() => {
    const weatherDone = this.weather.status() === 'ready' || this.weather.status() === 'error';
    const mapDone = this.state.mapLoaded() || this.state.mapError();
    return weatherDone && mapDone;
  });

  readonly failed = computed(
    () => this.weather.status() === 'error' || this.state.mapError()
  );

  readonly progress = computed(() => {
    if (this.ready()) return 100;
    const mapPart = this.state.mapLoaded() ? 15 : 0;
    return Math.min(96, Math.round(this.weather.progress() * 0.85) + mapPart);
  });

  readonly statusText = computed(() => {
    const t = this.i18n.t();
    if (this.failed()) return t.splashError;
    if (this.weather.status() === 'ready') return t.splashPreparing;
    return t.splashLoading;
  });

  constructor() {
    effect(() => {
      if (!this.ready() || this.readyHandled) return;
      this.readyHandled = true;
      const elapsed = performance.now() - this.startedAt;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      this.hideTimer = setTimeout(() => this.finish(), wait);
    });
  }

  ngOnDestroy() {
    if (this.hideTimer !== null) clearTimeout(this.hideTimer);
    clearTimeout(this.maxWaitTimer);
    // Never leave the experience gated if the splash is torn down early.
    this.state.beginExperience();
  }

  private finish() {
    if (this.fading()) return;
    clearTimeout(this.maxWaitTimer);
    this.fading.set(true);
    this.hideTimer = setTimeout(() => {
      this.gone.set(true);
      this.state.beginExperience();
    }, FADE_MS);
  }
}
