import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowRight, ExternalLink } from 'lucide-angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { PageService } from '../../core/services/page.service';
import { PopupService } from '@kmd/design-system/ui/popup/popup.service';

/** Modal popup content displaying scientific data sources, licenses, and project attribution. */
@Component({
  selector: 'app-sources-popup',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './sources-popup.component.html',
  styleUrl: './sources-popup.component.scss'
})
export class SourcesPopupComponent {
  i18n = inject(I18nService);
  private page = inject(PageService);
  private popup = inject(PopupService);

  readonly externalLinkIcon = ExternalLink;
  readonly arrowIcon = ArrowRight;

  /** "Meet the team": the About page opens under the popup, so close the popup first. */
  openAbout() {
    this.popup.close();
    this.page.openAbout();
  }
}
