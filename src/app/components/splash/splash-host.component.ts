import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplashComponent } from '@kmd/design-system/ui/splash/splash.component';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { CurrentWeatherService } from '../../core/services/current-weather.service';
import { I18nService } from '../../core/i18n/i18n.service';

/** Keep the splash wordmark reveal visible long enough to finish gracefully. */
const MIN_VISIBLE_MS = 2400;
/** Hard stop: never leave the app behind the splash if an asset request hangs. */
const MAX_WAIT_MS = 12000;
/** Matches the `splash` transition token in the design system. */
const FADE_MS = 620;

/**
 * App-side splash host: owns readiness detection and timing, while the visual
 * loader itself is the shared `<app-splash>` design-system component.
 *
 * The loader stays up until every layer is genuinely ready: weather data, land
 * outlines, the Borel font, the splash reveal animation and the first rendered
 * interactive globe frame (including its DOM labels). Starting the experience
 * before the fade means there is no blank second between the splash and the map.
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
  readonly splashRevealed = signal(false);
  readonly fontsReady = signal(typeof document === 'undefined' || !document.fonts);

  private readonly startedAt = performance.now();
  private readyHandled = false;
  private experienceStarted = false;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly maxWaitTimer = setTimeout(() => this.finish(), MAX_WAIT_MS);

  /** Data needed to build the scene; the experience can start as soon as this is true. */
  readonly dataReady = computed(() => {
    const weatherDone = this.weather.status() === 'ready' || this.weather.status() === 'error';
    const mapDone = this.state.mapLoaded() || this.state.mapError();
    return weatherDone && mapDone;
  });

  /** The splash may only leave once the first interactive frame has been painted. */
  readonly ready = computed(
    () => this.dataReady() && this.state.sceneReady() && this.splashRevealed() && this.fontsReady()
  );

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
    if (this.dataReady()) return t.splashPreparing;
    return t.splashLoading;
  });

  constructor() {
    this.loadFonts();

    effect(() => {
      if (this.dataReady() && !this.experienceStarted) {
        this.experienceStarted = true;
        // Render the globe and its labels behind the still-visible splash,
        // but keep the clock at 6 Nov 2024 until the fade starts.
        queueMicrotask(() => this.state.prepareExperience());
      }

      if (!this.ready() || this.readyHandled) return;
      this.readyHandled = true;
      const elapsed = performance.now() - this.startedAt;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      this.hideTimer = setTimeout(() => this.afterPaint(() => this.finish()), wait);
    });
  }

  ngOnDestroy() {
    if (this.hideTimer !== null) clearTimeout(this.hideTimer);
    clearTimeout(this.maxWaitTimer);
    // Never leave the experience gated if the splash is torn down early.
    this.state.beginExperience();
  }

  onRevealed() {
    this.splashRevealed.set(true);
  }

  private loadFonts() {
    if (typeof document === 'undefined' || !document.fonts) return;
    Promise.all([
      document.fonts.ready,
      document.fonts.load('1em Borel')
    ])
      .then(() => this.fontsReady.set(true))
      .catch(() => this.fontsReady.set(true));
  }

  /** Wait for two frames so the first interactive render is on screen before fading. */
  private afterPaint(fn: () => void) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  private finish() {
    if (this.fading() || this.gone()) return;
    clearTimeout(this.maxWaitTimer);
    // Unlock the scene even on the max-wait fallback; it is already mounted.
    this.state.beginExperience();
    this.fading.set(true);
    this.hideTimer = setTimeout(() => this.gone.set(true), FADE_MS);
  }
}
