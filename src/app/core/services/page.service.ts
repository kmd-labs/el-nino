import { Injectable, computed, inject, signal } from '@angular/core';
import { PopupService } from '@kmd/design-system/ui/popup/popup.service';
import { AboutModalComponent } from '@kmd/design-system';
import { I18nService } from '../i18n/i18n.service';

const PARAM = 'page';
const ABOUT = 'about';

/**
 * The "About us" popup shown over the globe, linkable as `?page=about`.
 * Opening it pushes a history entry so the browser's Back button closes the popup.
 */
@Injectable({ providedIn: 'root' })
export class PageService {
  private popup = inject(PopupService);
  private i18n = inject(I18nService);

  readonly about = signal<boolean>(this.aboutInUrl());
  /** Control that opened the page; focus goes back to it on close. */
  private opener: HTMLElement | null = null;
  private isHandlingPopstate = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        this.isHandlingPopstate = true;
        try {
          const inUrl = this.aboutInUrl();
          if (inUrl && !this.about()) {
            this.about.set(true);
            this.showAboutPopup();
          } else if (!inUrl && this.about()) {
            this.setAbout(false);
            if (this.popup.config()?.id === ABOUT) {
              this.popup.close();
            }
          }
        } finally {
          this.isHandlingPopstate = false;
        }
      });
    }
  }

  /** Initialize the popup on startup if ?page=about is in URL */
  initFromUrl() {
    if (this.about()) {
      this.showAboutPopup();
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
    this.showAboutPopup();
  }

  closeAbout() {
    if (!this.about()) return;
    this.setAbout(false);
    if (this.popup.config()?.id === ABOUT) {
      this.popup.close();
    }
    if (!this.isHandlingPopstate) {
      if (history.state?.[ABOUT]) {
        history.back();
      } else {
        const url = new URL(location.href);
        url.searchParams.delete(PARAM);
        history.replaceState(null, '', url);
      }
    }
  }

  private showAboutPopup() {
    this.popup.open({
      id: ABOUT,
      title: computed(() => this.i18n.t().about.title),
      component: AboutModalComponent,
      componentInputs: { lang: this.i18n.lang() },
      size: 'lg',
      actions: [
        {
          label: computed(() => this.i18n.t().close),
          variant: 'default'
        }
      ],
      onClose: () => {
        if (this.about()) {
          this.closeAbout();
        }
      }
    });
  }

  private setAbout(open: boolean) {
    this.about.set(open);
    if (!open && this.opener) {
      const el = this.opener;
      this.opener = null;
      setTimeout(() => el.focus({ preventScroll: true }));
    }
  }

  private aboutInUrl(): boolean {
    return typeof location !== 'undefined' && new URLSearchParams(location.search).get(PARAM) === ABOUT;
  }
}
