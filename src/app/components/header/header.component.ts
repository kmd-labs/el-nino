import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { BadgeComponent } from '../ui/badge/badge.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  state = inject(EnsoStateService);

  readonly formattedNino = computed(() => {
    const n = this.state.nino34Value();
    const sign = n >= 0 ? '+' : '−';
    return `${sign}${Math.abs(n).toFixed(1)} °C`;
  });
}
