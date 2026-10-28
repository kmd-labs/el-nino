import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowRight, ExternalLink } from 'lucide-angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { SourceItem } from '../../core/i18n/i18n.types';
import { EVENTS_META, SRC_URLS } from '../../core/constants/enso-data';
import { PageService } from '../../core/services/page.service';
import { PopupService } from '@kmd/design-system/ui/popup/popup.service';
import { ProperNounsPipe } from '../../core/pipes/proper-nouns.pipe';

/** Modal popup content displaying scientific data sources, licenses, and project attribution. */
@Component({
  selector: 'app-sources-popup',
  standalone: true,
  imports: [ProperNounsPipe, CommonModule, LucideAngularModule],
  templateUrl: './sources-popup.component.html',
  styleUrl: './sources-popup.component.scss'
})
export class SourcesPopupComponent {
  i18n = inject(I18nService);
  private page = inject(PageService);
  private popup = inject(PopupService);

  readonly externalLinkIcon = ExternalLink;
  readonly arrowIcon = ArrowRight;

  /** Every article behind the impact pins, once each, in pin order, with its translated title. */
  private readonly pinArticles = computed(() => {
    const titles = this.i18n.t().srcTitles;
    const keys = [...new Set(EVENTS_META.flatMap(loc => loc.ev.map(e => e.srcKey)))];
    return keys
      .filter(k => SRC_URLS[k])
      .map(k => ({ name: titles[k] ?? k, url: SRC_URLS[k] }));
  });

  /** The collapsible link list under a source card, or null when it has none. */
  extraLinks(s: SourceItem): { label: string; items: { name: string; url: string }[] } | null {
    const t = this.i18n.t();
    if (s.pinArticles) {
      const items = this.pinArticles();
      return { label: t.sourcePinArticles(items.length), items };
    }
    if (s.products?.length) return { label: t.sourceProducts(s.products.length), items: s.products };
    return null;
  }

  /** Splits area descriptors into distinct badge tags for clean wrapping. */
  splitTags(area: string): string[] {
    return area ? area.split(' · ') : [];
  }

  /** "Meet the team": the About page opens under the popup, so close the popup first. */
  openAbout() {
    this.popup.close();
    this.page.openAbout();
  }
}
