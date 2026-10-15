import { Component, ElementRef, HostListener, ViewChild, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { GlossaryGroup } from '../../core/i18n/i18n.types';
import { ButtonComponent } from '../ui/button/button.component';

/** Side drawer explaining the harder terms in plain language, with links to Wikipedia. */
@Component({
  selector: 'app-glossary',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './glossary.component.html',
  styleUrl: './glossary.component.scss'
})
export class GlossaryComponent implements AfterViewInit {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);

  @ViewChild('search') searchRef!: ElementRef<HTMLInputElement>;

  readonly query = signal('');

  readonly groups = computed<GlossaryGroup[]>(() => {
    const all = this.i18n.t().glossary;
    const q = this.query().trim().toLowerCase();
    if (!q) return all;
    return all
      .map(g => ({ ...g, terms: g.terms.filter(t => (t.term + ' ' + t.text).toLowerCase().includes(q)) }))
      .filter(g => g.terms.length > 0);
  });

  ngAfterViewInit() {
    this.searchRef.nativeElement.focus({ preventScroll: true });
  }

  onSearch(e: Event) {
    this.query.set((e.target as HTMLInputElement).value);
  }

  close() {
    this.state.toggleGlossary(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }
}
