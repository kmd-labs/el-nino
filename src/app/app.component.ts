import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobeComponent } from './components/globe/globe.component';
import { HeaderComponent } from './components/header/header.component';
import { ImpactModalComponent } from './components/impact-modal/impact-modal.component';
import { MapDockComponent } from './components/map-dock/map-dock.component';
import { WalkerViewComponent } from './components/walker-view/walker-view.component';
import { GlossaryComponent } from './components/glossary/glossary.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { I18nService } from './core/i18n/i18n.service';
import { EnsoStateService } from './core/services/enso-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    GlobeComponent,
    HeaderComponent,
    MapDockComponent,
    WalkerViewComponent,
    GlossaryComponent,
    WelcomeComponent,
    ImpactModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
}
