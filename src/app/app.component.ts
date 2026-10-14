import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobeComponent } from './components/globe/globe.component';
import { HeaderComponent } from './components/header/header.component';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';
import { ImpactModalComponent } from './components/impact-modal/impact-modal.component';
import { MapDockComponent } from './components/map-dock/map-dock.component';
import { WalkerViewComponent } from './components/walker-view/walker-view.component';
import { GlossaryComponent } from './components/glossary/glossary.component';
import { EnsoStateService } from './core/services/enso-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    GlobeComponent,
    HeaderComponent,
    ControlPanelComponent,
    MapDockComponent,
    WalkerViewComponent,
    GlossaryComponent,
    ImpactModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  state = inject(EnsoStateService);
}
