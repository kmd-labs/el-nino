import { Injectable, signal } from '@angular/core';

const PARAM = 'page';
const ABOUT = 'about';

/**
 * The "About us" page shown over the globe, linkable as `?page=about`.
 * Opening it pushes a history entry so the browser's Back button returns to the globe.
 */
@Injectable({ providedIn: 'root' })
export class PageService {
  readonly about = signal<boolean>(this.aboutInUrl());
  /** Control that opened the page; focus goes back to it on close. */
  private opener: HTMLElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => this.setAbout(this.aboutInUrl()));
    }
  }

  openAbout() {
    if (this.about()) return;
    const active = document.activeElement;
    this.opener = active instanceof HTMLElement && active !== document.body ? active : null;
    const url = new URL(location.href);
    url.searchParams.set(PARAM, ABOUT);
    history.pushState({ [ABOUT]: true }, '', url);
    this.about.set(true);
  }

  closeAbout() {
    if (!this.about()) return;
    // Opened from the globe: step back so the history has no leftover entry
    if (history.state?.[ABOUT]) {
      history.back();
      return;
    }
    // Opened from a shared ?page=about link: there is nothing to go back to
    const url = new URL(location.href);
    url.searchParams.delete(PARAM);
    history.replaceState(null, '', url);
    this.setAbout(false);
  }

  private setAbout(open: boolean) {
    this.about.set(open);
    if (!open && this.opener) {
      const el = this.opener;
      this.opener = null;
      // after the page is removed and the globe UI is no longer inert
      setTimeout(() => el.focus({ preventScroll: true }));
    }
  }

  private aboutInUrl(): boolean {
    return typeof location !== 'undefined' && new URLSearchParams(location.search).get(PARAM) === ABOUT;
  }
}
