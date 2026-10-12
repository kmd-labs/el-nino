import { Component, HostListener, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { PH } from '../../core/constants/enso-data';
import { ButtonComponent } from '../ui/button/button.component';

@Component({
  selector: 'app-impact-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './impact-modal.component.html',
  styleUrl: './impact-modal.component.scss'
})
export class ImpactModalComponent {
  state = inject(EnsoStateService);
  readonly PH = PH;

  readonly location = computed(() => this.state.selectedLocation());
  readonly currentPhase = computed(() => this.state.phase());

  readonly filteredEvents = computed(() => {
    const loc = this.location();
    if (!loc) return [];
    return loc.ev.filter(e => e.ph === this.currentPhase());
  });

  close() {
    this.state.selectLocation(null);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.location()) {
      this.close();
    }
  }
}
