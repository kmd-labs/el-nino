import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ExternalLink } from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { EnsoMathService } from '../../core/services/enso-math.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { BadgeComponent } from '@kmd/design-system/ui/badge/badge.component';

@Component({
  selector: 'app-impact-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BadgeComponent],
  templateUrl: './impact-modal.component.html',
  styleUrl: './impact-modal.component.scss'
})
export class ImpactModalComponent {
  state = inject(EnsoStateService);
  math = inject(EnsoMathService);
  i18n = inject(I18nService);
  readonly externalLinkIcon = ExternalLink;

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
}
