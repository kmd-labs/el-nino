import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowRight, ExternalLink, Search } from 'lucide-angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { GlossaryGroup } from '../../core/i18n/i18n.types';
import { PageService } from '../../core/services/page.service';
import { PopupService } from '@kmd/design-system/ui/popup/popup.service';

/** Searchable glossary projected inside the Design System Popup. */
@Component({
  selector: 'app-glossary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './glossary.component.html',
  styleUrl: './glossary.component.scss'
})
export class GlossaryComponent {
  i18n = inject(I18nService);
  private page = inject(PageService);
  private popup = inject(PopupService);
  readonly searchIcon = Search;
  readonly externalLinkIcon = ExternalLink;
  readonly arrowIcon = ArrowRight;

  readonly query = signal('');

  readonly groups = computed<GlossaryGroup[]>(() => {
    const all = this.i18n.t().glossary;
    const q = this.query().trim().toLowerCase();
    if (!q) return all;
    return all
      .map(g => ({ ...g, terms: g.terms.filter(t => (t.term + ' ' + t.text).toLowerCase().includes(q)) }))
      .filter(g => g.terms.length > 0);
  });

  readonly methodologyItems = computed(() => {
    const all = this.i18n.t().methodology.items;
    const q = this.query().trim().toLowerCase();
    if (!q) return all;
    return all.filter(item => (item.label + ' ' + item.area + ' ' + item.text).toLowerCase().includes(q));
  });

  readonly hasResults = computed(() => {
    return this.groups().length > 0 || this.methodologyItems().length > 0;
  });

  onSearch(e: Event) {
    this.query.set((e.target as HTMLInputElement).value);
  }

  /** "Meet the team": the About page opens under the popup, so close the popup first. */
  openAbout() {
    this.popup.close();
    this.page.openAbout();
  }
}
