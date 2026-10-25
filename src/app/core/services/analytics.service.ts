import { Injectable } from '@angular/core';

/** Umami Cloud website ID (Umami → Settings → Websites → el-nino). Empty keeps analytics off. */
export const UMAMI_WEBSITE_ID = '884cbd52-1fa2-40a5-8c28-0489f7653e91';
const UMAMI_SRC = 'https://cloud.umami.is/script.js';
/** Only the deployed site is counted – never localhost, previews or tests. */
const PROD_HOST = 'kmd-labs.github.io';

export type AnalyticsEvent = 'cta-click' | 'share-open' | 'share-copy' | 'view-change' | 'language';
type EventData = Record<string, string | number | boolean>;

interface UmamiTracker {
  track(): void;
  track(event: string, data?: EventData): void;
}

/**
 * Cookie-less analytics via Umami Cloud (no consent banner needed, GDPR-friendly).
 *
 * Automatic page views are off (`data-auto-pageview="false"`): Umami would count every
 * history.replaceState as a page view, and the address bar follows the slider (ShareLinkService).
 * So one page view is sent when the script loads (with the referrer and any utm_* parameters),
 * plus the named events below.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly enabled =
    !!UMAMI_WEBSITE_ID && typeof location !== 'undefined' && location.hostname === PROD_HOST;
  /** Events fired before the script has loaded, sent once it is ready. */
  private queue: [AnalyticsEvent, EventData | undefined][] = [];
  private ready = false;

  init() {
    if (!this.enabled || document.querySelector(`script[src="${UMAMI_SRC}"]`)) return;
    const script = document.createElement('script');
    script.defer = true;
    script.src = UMAMI_SRC;
    script.dataset['websiteId'] = UMAMI_WEBSITE_ID;
    script.dataset['autoPageview'] = 'false';
    script.dataset['domains'] = PROD_HOST;
    script.onload = () => {
      this.ready = true;
      this.umami()?.track();
      for (const [event, data] of this.queue) this.umami()?.track(event, data);
      this.queue = [];
    };
    document.head.appendChild(script);
  }

  track(event: AnalyticsEvent, data?: EventData) {
    if (!this.enabled) return;
    if (this.ready) this.umami()?.track(event, data);
    else this.queue.push([event, data]);
  }

  private umami(): UmamiTracker | undefined {
    return (window as unknown as { umami?: UmamiTracker }).umami;
  }
}
