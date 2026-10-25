import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobeComponent } from './components/globe/globe.component';
import { HeaderComponent } from './components/header/header.component';
import { SplashHostComponent } from './components/splash/splash-host.component';
import { MapDockComponent } from './components/map-dock/map-dock.component';
import { WalkerViewComponent } from './components/walker-view/walker-view.component';
import { CyclesViewComponent } from './components/cycles-view/cycles-view.component';
import { PopupComponent } from '@kmd/design-system/ui/popup/popup.component';
import { TooltipComponent } from '@kmd/design-system/ui/tooltip/tooltip.component';
import { I18nService } from './core/i18n/i18n.service';
import { EnsoStateService } from './core/services/enso-state.service';
import { ShareLinkService } from './core/services/share-link.service';
import { PageService } from './core/services/page.service';
import { SeoService } from './core/services/seo.service';
import { EnsoHistoryService } from './core/services/enso-history.service';
import { CurrentWeatherService } from './core/services/current-weather.service';
import { AnalyticsService } from './core/services/analytics.service';
import { EquatorProfileService } from './core/services/equator-profile.service';
import { BreakpointService } from '@kmd/design-system/services/breakpoint.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    GlobeComponent,
    SplashHostComponent,
    HeaderComponent,
    MapDockComponent,
    WalkerViewComponent,
    CyclesViewComponent,
    PopupComponent,
    TooltipComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  page = inject(PageService);
  /** Created eagerly so a shared link is applied before the intro starts. */
  private shareLink = inject(ShareLinkService);
  private seo = inject(SeoService);
  private history = inject(EnsoHistoryService);
  private weather = inject(CurrentWeatherService);
  private analytics = inject(AnalyticsService);
  private profile = inject(EquatorProfileService);
  private bp = inject(BreakpointService);

  constructor() {
    // Start weather and history loads immediately on page load
    this.weather.load();
    this.history.load();
    this.page.initFromUrl();
    this.analytics.init();

    // Each failure and the load time are reported once per visit
    const reported = new Set<string>();
    const once = (key: string, report: () => void) => {
      if (reported.has(key)) return;
      reported.add(key);
      report();
    };
    effect(() => {
      if (this.weather.status() === 'error') once('sst', () => this.analytics.track('load-error', { what: 'sst' }));
      if (this.history.status() === 'error') once('history', () => this.analytics.track('load-error', { what: 'history' }));
      if (this.profile.status() === 'error') once('profile', () => this.analytics.track('load-error', { what: 'profile' }));
      if (this.state.mapError()) once('land', () => this.analytics.track('load-error', { what: 'land' }));
      if (this.state.experienceStarted()) {
        once('time', () => this.analytics.trackLoadTime(this.bp.mobile() ? 'mobile' : this.bp.tablet() ? 'tablet' : 'desktop'));
      }
    });
  }
}
