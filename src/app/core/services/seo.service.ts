import { Injectable, effect, inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { Lang } from '../i18n/i18n.types';
import { PageService } from './page.service';

/**
 * Title, meta description, canonical URL and hreflang links for what is on screen (globe or About page).
 * Crawler-facing URLs carry only what changes the content: `lang` (English is the plain URL) and
 * `page=about`, so view/state/date links fold into the main page. Same URLs as in sitemap.xml.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private i18n = inject(I18nService);
  private page = inject(PageService);

  constructor() {
    effect(() => {
      const lang = this.i18n.lang();
      const d = this.i18n.t();
      const about = this.page.about();
      if (typeof document === 'undefined') return;

      document.title = about ? d.about.docTitle : d.docTitle;
      document.querySelector('meta[name="description"]')
        ?.setAttribute('content', about ? d.about.metaDescription : d.metaDescription);

      // A ?lang= link must follow the language picker, or a reload would switch the language back
      const url = new URL(location.href);
      if (url.searchParams.has('lang') && url.searchParams.get('lang') !== lang) {
        url.searchParams.set('lang', lang);
        history.replaceState(history.state, '', url);
      }

      const urlLang = url.searchParams.get('lang');
      const pageLang = this.i18n.langs.includes(urlLang as Lang) ? (urlLang as Lang) : 'en';
      this.setLink('canonical', null, this.crawlerUrl(pageLang, about));
      for (const l of this.i18n.langs) this.setLink('alternate', l, this.crawlerUrl(l, about));
      this.setLink('alternate', 'x-default', this.crawlerUrl('en', about));
    });
  }

  private crawlerUrl(lang: Lang, about: boolean): string {
    const url = new URL(location.pathname, location.origin);
    if (lang !== 'en') url.searchParams.set('lang', lang);
    if (about) url.searchParams.set('page', 'about');
    return url.href;
  }

  private setLink(rel: string, hreflang: string | null, href: string) {
    const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
    let link = document.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      if (hreflang) link.hreflang = hreflang;
      document.head.appendChild(link);
    }
    link.href = href;
  }
}
