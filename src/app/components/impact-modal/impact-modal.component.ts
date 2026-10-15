import { Component, HostListener, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { PH } from '../../core/constants/enso-data';
import { ButtonComponent } from '../ui/button/button.component';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-impact-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './impact-modal.component.html',
  styleUrl: './impact-modal.component.scss'
})
export class ImpactModalComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  readonly PH = PH;

  /** The selected location with its texts in the current language. */
  readonly location = computed(() => {
    const loc = this.state.selectedLocation();
    return loc ? this.i18n.location(loc) : null;
  });
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
