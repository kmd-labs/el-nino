import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  LucideAngularModule,
  Share2,
  Copy,
  Check,
  CalendarDays,
  Activity,
  QrCode
} from 'lucide-angular';
import QRCode from 'qrcode';
import { ShareLinkService } from '../../core/services/share-link.service';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LocaleDatePipe } from '../../core/pipes/locale-date.pipe';

@Component({
  selector: 'app-share-popup',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [LocaleDatePipe],
  templateUrl: './share-popup.component.html',
  styleUrl: './share-popup.component.scss'
})
export class SharePopupComponent implements OnInit {
  private shareLink = inject(ShareLinkService);
  private state = inject(EnsoStateService);
  i18n = inject(I18nService);
  private localeDate = inject(LocaleDatePipe);
  private sanitizer = inject(DomSanitizer);
  private analytics = inject(AnalyticsService);

  readonly copyIcon = Copy;
  readonly checkIcon = Check;
  readonly shareIcon = Share2;
  readonly calendarIcon = CalendarDays;
  readonly activityIcon = Activity;
  readonly qrIcon = QrCode;

  readonly appUrl = signal<string>('');
  readonly qrSvg = signal<SafeHtml>('');
  readonly copiedKey = signal<string | null>(null);
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly currentDate = computed(() => this.shareLink.currentDate());

  readonly dateLabel = computed(() => {
    const d = this.currentDate();
    return d ? this.localeDate.transform(d, 'full') : '';
  });

  readonly stateLabel = computed(() => this.state.category().name);

  readonly dateUrl = computed(() => this.shareLink.buildUrl('date'));
  readonly stateUrl = computed(() => this.shareLink.buildUrl('state'));

  async ngOnInit() {
    // Links carry the current language, so recipients start in it too
    const appUrl = this.shareLink.appUrl();
    this.appUrl.set(appUrl);
    try {
      const svgString = await QRCode.toString(appUrl, {
        type: 'svg',
        margin: 1,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      });
      this.qrSvg.set(this.sanitizer.bypassSecurityTrustHtml(svgString));
    } catch (err) {
      console.warn('QR code generation failed:', err);
    }
  }

  async copyText(text: string, key: string) {
    this.analytics.track('share-copy', { link: key });
    try {
      await navigator.clipboard.writeText(text);
      this.copiedKey.set(key);
      if (this.copiedTimer !== null) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copiedKey.set(null), 2000);
    } catch {
      // clipboard fallback
    }
  }

  async nativeShare(url: string, title?: string) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title ?? this.i18n.t().docTitle,
          url
        });
      } catch (err) {
        if ((err as DOMException).name !== 'AbortError') {
          this.copyText(url, 'app');
        }
      }
    } else {
      this.copyText(url, 'app');
    }
  }
}
