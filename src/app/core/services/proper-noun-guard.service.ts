import { Injectable } from '@angular/core';
import { PROPER_NOUNS } from '../pipes/proper-nouns.pipe';

/** Labels up to this length are short enough to keep untranslated as a whole. */
const MAX_LABEL = 40;
const MARK = 'data-proper-noun';

/**
 * Keeps short labels such as "El Niño" or "Super El Niño" out of browser page translation
 * (Google Translate renders them "The Child" / "The Girl"), including labels rendered by
 * design-system components that this app cannot template. Only attributes are touched, never
 * the text nodes, so Angular's own updates keep working. Longer texts use `ProperNounsPipe`.
 */
@Injectable({ providedIn: 'root' })
export class ProperNounGuardService {
  private observer?: MutationObserver;

  start() {
    if (this.observer || typeof MutationObserver === 'undefined') return;
    this.mark(document.body);
    this.observer = new MutationObserver(records => {
      for (const r of records) {
        // Text changes and removals only affect the element itself; new subtrees are scanned once
        const target = r.type === 'characterData' ? r.target.parentElement : r.target;
        if (target instanceof Element) this.check(target);
        r.addedNodes.forEach(n => n instanceof Element && this.mark(n));
      }
    });
    this.observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  /** Marks (or unmarks) `root` and every leaf element under it. */
  private mark(root: Element) {
    this.check(root);
    root.querySelectorAll('*').forEach(el => this.check(el));
  }

  /** A leaf element whose short text holds a proper noun gets `translate="no"`; the mark is undone when the text changes. */
  private check(el: Element) {
    if (el.childElementCount > 0) return;
    const text = el.textContent?.trim() ?? '';
    PROPER_NOUNS.lastIndex = 0;
    const isLabel = text.length > 0 && text.length <= MAX_LABEL && PROPER_NOUNS.test(text);
    if (isLabel && el.getAttribute('translate') !== 'no') {
      el.setAttribute('translate', 'no');
      el.setAttribute(MARK, '');
    } else if (!isLabel && el.hasAttribute(MARK)) {
      el.removeAttribute('translate');
      el.removeAttribute(MARK);
    }
  }
}
