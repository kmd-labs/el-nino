import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobeComponent } from './components/globe/globe.component';
import { HeaderComponent } from './components/header/header.component';
import { SplashHostComponent } from './components/splash/splash-host.component';
import { MapDockComponent } from './components/map-dock/map-dock.component';
import { WalkerViewComponent } from './components/walker-view/walker-view.component';
import { AboutPageComponent } from './components/about-page/about-page.component';
import { PopupComponent } from '@kmd/design-system/ui/popup/popup.component';
import { TooltipComponent } from '@kmd/design-system/ui/tooltip/tooltip.component';
import { I18nService } from './core/i18n/i18n.service';
import { EnsoStateService } from './core/services/enso-state.service';
import { ShareLinkService } from './core/services/share-link.service';
import { PageService } from './core/services/page.service';
import { SeoService } from './core/services/seo.service';

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
    AboutPageComponent,
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
}
