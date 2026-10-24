import { Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Globe,
  Activity,
  Thermometer,
  Wind,
  CloudRain,
  Share2,
  Check,
  CalendarDays,
  Handshake
} from 'lucide-angular';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { ShareLinkService, ShareMode } from '../../core/services/share-link.service';
import { PageService } from '../../core/services/page.service';
import { BreakpointService } from '@kmd/design-system/services/breakpoint.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Lang } from '../../core/i18n/i18n.types';
import { DisplayMode, ViewMode } from '../../core/models/enso.model';
import { DropdownComponent } from '@kmd/design-system/ui/dropdown/dropdown.component';
import { DropdownOption } from '@kmd/design-system/ui/dropdown/dropdown.model';
import { TooltipService } from '@kmd/design-system/ui/tooltip/tooltip.service';
import { TooltipDirective } from '@kmd/design-system/ui/tooltip/tooltip.directive';
import { ButtonComponent } from '@kmd/design-system/ui/button/button.component';

const CTA_DELAY_MS = 20000;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    DropdownComponent,
    ButtonComponent,
    TooltipDirective,
    LucideAngularModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnDestroy {
  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  bp = inject(BreakpointService);
  page = inject(PageService);
  private shareLink = inject(ShareLinkService);
  private tooltip = inject(TooltipService);
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly globeIcon = Globe;
  readonly shareIcon = Share2;
  readonly checkIcon = Check;
  readonly ctaIcon = Handshake;
  readonly copied = signal(false);
  /** The CTA appears a while after the globe starts, so it doesn't compete with the first impression. */
  readonly showCta = signal(false);
  private ctaTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (!this.state.experienceStarted() || this.ctaTimer !== null) return;
      this.ctaTimer = setTimeout(() => this.showCta.set(true), CTA_DELAY_MS);
    });
  }

  ngOnDestroy() {
    if (this.ctaTimer !== null) clearTimeout(this.ctaTimer);
  }

  @ViewChild('sharePill') private sharePill?: ElementRef<HTMLElement>;

  /** Share either the day shown on the timeline or the ENSO state; the day needs the timeline data. */
  readonly shareOptions = computed<DropdownOption<ShareMode>[]>(() => {
    const t = this.i18n.t();
    const opts: DropdownOption<ShareMode>[] = [];
    const date = this.shareLink.currentDate();
    if (date) {
      const label = new Intl.DateTimeFormat(t.htmlLang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(`${date}T12:00:00Z`));
      opts.push({ value: 'date', label: t.shareDate, badge: label, icon: CalendarDays });
    }
    opts.push({ value: 'state', label: t.shareState, badge: this.state.category().name, icon: Activity });
    return opts;
  });

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
  async onShare(mode: ShareMode) {
    const t = this.i18n.t();
    const url = this.shareLink.buildUrl(mode);
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
    const anchor = this.sharePill?.nativeElement.getBoundingClientRect();
    if (anchor) {
      this.tooltip.show(ok ? t.linkCopied : t.linkCopyFailed, anchor.left + anchor.width / 2, anchor.bottom + 8, 'bottom', 1800);
    }
    if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(false), 1800);
  }
}
