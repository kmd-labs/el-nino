import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobeComponent } from './components/globe/globe.component';
import { HeaderComponent } from './components/header/header.component';
import { MapDockComponent } from './components/map-dock/map-dock.component';
import { WalkerViewComponent } from './components/walker-view/walker-view.component';
import { ThermoclineViewComponent } from './components/thermocline-view/thermocline-view.component';
import { PopupComponent } from './components/ui/popup/popup.component';
import { TooltipComponent } from './components/ui/tooltip/tooltip.component';
import { I18nService } from './core/i18n/i18n.service';
import { EnsoStateService } from './core/services/enso-state.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    GlobeComponent,
    HeaderComponent,
    MapDockComponent,
    WalkerViewComponent,
    ThermoclineViewComponent,
    PopupComponent,
    TooltipComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  theme = inject(ThemeService);
}
