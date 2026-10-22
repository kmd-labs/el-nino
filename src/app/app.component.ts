import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobeComponent } from './components/globe/globe.component';
import { HeaderComponent } from './components/header/header.component';
import { MapDockComponent } from './components/map-dock/map-dock.component';
import { WalkerViewComponent } from './components/walker-view/walker-view.component';
import { ThermoclineViewComponent } from './components/thermocline-view/thermocline-view.component';
import { CyclesViewComponent } from './components/cycles-view/cycles-view.component';
import { PopupComponent } from '@kmd/design-system/ui/popup/popup.component';
import { TooltipComponent } from '@kmd/design-system/ui/tooltip/tooltip.component';
import { I18nService } from './core/i18n/i18n.service';
import { EnsoStateService } from './core/services/enso-state.service';
import { EnsoHistoryService } from './core/services/enso-history.service';

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
  private history = inject(EnsoHistoryService);

  constructor() {
    // Needed by the dock's peak-probability readout, not just by the cycles view.
    this.history.load();
  }
}
