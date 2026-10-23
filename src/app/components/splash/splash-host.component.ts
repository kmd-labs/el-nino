import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplashComponent } from '@kmd/design-system/ui/splash/splash.component';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { CurrentWeatherService } from '../../core/services/current-weather.service';
import { I18nService } from '../../core/i18n/i18n.service';

const MIN_VISIBLE_MS = 2200;
const REVEAL_HOLD_MS = 500;
const MAX_WAIT_MS = 12000;
const FADE_MS = 620;

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
  private revealedAt = 0;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly maxWaitTimer = setTimeout(() => this.finish(), MAX_WAIT_MS);

  readonly dataReady = computed(() => {
    const weatherDone = this.weather.status() === 'ready' || this.weather.status() === 'error';
    const mapDone = this.state.mapLoaded() || this.state.mapError();
    return weatherDone && mapDone;
  });

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
        queueMicrotask(() => this.state.prepareExperience());
      }

      if (!this.ready() || this.readyHandled) return;
      this.readyHandled = true;
      const elapsed = performance.now() - this.startedAt;
      const sinceReveal = this.revealedAt ? performance.now() - this.revealedAt : 0;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed, REVEAL_HOLD_MS - sinceReveal);
      this.hideTimer = setTimeout(() => this.afterPaint(() => this.finish()), wait);
    });
  }

  ngOnDestroy() {
    if (this.hideTimer !== null) clearTimeout(this.hideTimer);
    clearTimeout(this.maxWaitTimer);
    this.state.beginExperience();
  }

  onRevealed() {
    this.splashRevealed.set(true);
    this.revealedAt = performance.now();
    this.weather.load();
  }

  private loadFonts() {
    if (typeof document === 'undefined' || !document.fonts) return;
    Promise.all([
      document.fonts.ready,
      document.fonts.load('1em "JetBrains Mono"')
    ])
      .then(() => this.fontsReady.set(true))
      .catch(() => this.fontsReady.set(true));
  }

  private afterPaint(fn: () => void) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  private finish() {
    if (this.fading() || this.gone()) return;
    clearTimeout(this.maxWaitTimer);
    this.weather.load();
    this.state.beginExperience();
    this.fading.set(true);
    this.hideTimer = setTimeout(() => this.gone.set(true), FADE_MS);
  }
}
