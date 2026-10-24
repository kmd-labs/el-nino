import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Globe,
  Activity,
  Thermometer,
  Wind,
  CloudRain,
  Share2,
  Check
} from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { ShareLinkService } from '../../core/services/share-link.service';
import { BreakpointService } from '@kmd/design-system/services/breakpoint.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Lang } from '../../core/i18n/i18n.types';
import { DisplayMode, ViewMode } from '../../core/models/enso.model';
import { DropdownComponent } from '@kmd/design-system/ui/dropdown/dropdown.component';
import { DropdownOption } from '@kmd/design-system/ui/dropdown/dropdown.model';
import { ButtonComponent } from '@kmd/design-system/ui/button/button.component';
import { TooltipService } from '@kmd/design-system/ui/tooltip/tooltip.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    DropdownComponent,
    ButtonComponent,
    LucideAngularModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  bp = inject(BreakpointService);
  private shareLink = inject(ShareLinkService);
  private tooltip = inject(TooltipService);
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly globeIcon = Globe;
  readonly shareIcon = Share2;
  readonly checkIcon = Check;
  readonly copied = signal(false);

  readonly currentView = computed<string>(() => this.state.view());

  readonly viewOptions = computed<DropdownOption<string>[]>(() => {
    const t = this.i18n.t();
    return [
      { value: 'globe', label: t.viewAnom, icon: Thermometer },
      { value: 'walker', label: t.viewWalker, icon: Wind },
      { value: 'impacts', label: t.viewImpacts, icon: CloudRain }
    ];
  });

  readonly currentViewIcon = computed(
    () => this.viewOptions().find(o => o.value === this.currentView())?.icon ?? Thermometer
  );

  onViewChange(v: string) {
    this.state.setView(v as ViewMode);
  }

  readonly langOptions = computed<DropdownOption<Lang>[]>(() =>
    this.i18n.langs.map(l => ({
      value: l,
      label: this.i18n.dicts[l].langName,
      shortLabel: l.toUpperCase(),
      badge: l.toUpperCase()
    }))
  );

  onLangChange(lang: Lang) {
    this.i18n.setLang(lang);
  }

  /** Native share sheet on touch devices, clipboard elsewhere. */
  async onShare(event: MouseEvent) {
    const t = this.i18n.t();
    const url = this.shareLink.buildUrl();
    const anchor = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const touch = window.matchMedia('(pointer: coarse)').matches;

    if (touch && navigator.share) {
      try {
        await navigator.share({ title: t.docTitle, url });
        return;
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
      }
    }

    let ok = true;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      ok = false;
    }
    this.copied.set(ok);
    this.tooltip.show(ok ? t.linkCopied : t.linkCopyFailed, anchor.left + anchor.width / 2, anchor.bottom + 8, 'bottom', 1800);
    if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(false), 1800);
  }
}
