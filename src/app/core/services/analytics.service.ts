import { Injectable } from '@angular/core';

/** Umami Cloud website ID (Umami → Settings → Websites → el-nino). Empty keeps analytics off. */
export const UMAMI_WEBSITE_ID = '884cbd52-1fa2-40a5-8c28-0489f7653e91';
const UMAMI_SRC = 'https://cloud.umami.is/script.js';
/** Only the deployed site is counted – never localhost, previews or tests. */
const PROD_HOST = 'kmd-labs.github.io';

/** Outbound links to data sources, by hostname suffix; anything else is reported as its host. */
const SOURCE_HOSTS: [string, string][] = [
  ['noaa.gov', 'noaa'],
  ['wikipedia.org', 'wikipedia'],
  ['wmo.int', 'wmo'],
  ['europa.eu', 'eu'],
  ['jma.go.jp', 'jma'],
  ['open-meteo.com', 'open-meteo'],
  ['naturalearthdata.com', 'natural-earth']
];
/** Maps an outbound link to `profile-click` (LinkedIn / GitHub profiles) or `source-click`; null for internal links. */
export function classifyLink(href: string, ownHost: string): { event: AnalyticsEvent; data: EventData } | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (!url.protocol.startsWith('http') || url.hostname === ownHost) return null;
  const host = url.hostname.replace(/^www\./, '');
  const slug = url.pathname.split('/').filter(Boolean);
  if (host === 'linkedin.com' && slug[0] === 'in' && slug[1]) {
    return { event: 'profile-click', data: { network: 'linkedin', person: slug[1] } };
  }
  if (host === 'github.com' && slug.length === 1) {
    return { event: 'profile-click', data: { network: 'github', person: slug[0] } };
  }
  const source = SOURCE_HOSTS.find(([suffix]) => host === suffix || host.endsWith('.' + suffix))?.[1] ?? host;
  return { event: 'source-click', data: { source, host } };
}

const LOAD_TIME_BUCKETS: [number, string][] = [[2000, '<2s'], [5000, '2-5s'], [10000, '5-10s']];

export type AnalyticsEvent =
  | 'cta-click'
  | 'about-open'
  | 'profile-click'
  | 'deeplink-open'
  | 'share-open'
  | 'share-copy'
  | 'view-change'
  | 'language'
  | 'temp-unit'
  | 'source-click'
  | 'glossary-open'
  | 'load-error'
  | 'load-time';
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
    // One listener for every outbound link, wherever it is rendered (also inside the
    // design-system About modal, which this app cannot annotate).
    document.addEventListener('click', e => this.onLinkClick(e), { capture: true });
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

  /** Time from navigation start until the globe is handed over, in coarse buckets per device class. */
  trackLoadTime(device: string) {
    const ms = performance.now();
    const bucket = LOAD_TIME_BUCKETS.find(([limit]) => ms < limit)?.[1] ?? '>10s';
    this.track('load-time', { bucket, device });
  }

  private onLinkClick(e: MouseEvent) {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    const hit = a ? classifyLink(a.href, location.hostname) : null;
    if (hit) this.track(hit.event, hit.data);
  }

  private umami(): UmamiTracker | undefined {
    return (window as unknown as { umami?: UmamiTracker }).umami;
  }
}
