import { Component, Input } from '@angular/core';
import { Lang } from '../../../core/i18n/i18n.types';

/** National flag for a UI language, as inline SVG (emoji flags don't render on Windows). */
@Component({
  selector: 'app-flag',
  standalone: true,
  template: `
    @switch (lang) {
      @case ('en') {
        <svg viewBox="0 0 60 30" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <rect width="60" height="30" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="2" />
          <path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10" />
          <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6" />
        </svg>
      }
      @case ('es') {
        <svg viewBox="0 0 750 500" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <rect width="750" height="500" fill="#AA151B" />
          <rect y="125" width="750" height="250" fill="#F1BF00" />
        </svg>
      }
      @case ('pl') {
        <svg viewBox="0 0 16 10" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <rect width="16" height="10" fill="#fff" />
          <rect y="5" width="16" height="5" fill="#DC143C" />
        </svg>
      }
    }
  `,
  styles: [`
    :host {
      display: inline-block;
      overflow: hidden;
      border-radius: 3px;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class FlagComponent {
  @Input({ required: true }) lang!: Lang;
}
