import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobeComponent } from './components/globe/globe.component';
import { HeaderComponent } from './components/header/header.component';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';
import { ImpactModalComponent } from './components/impact-modal/impact-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    GlobeComponent,
    HeaderComponent,
    ControlPanelComponent,
    ImpactModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}
