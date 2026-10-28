import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Names that must survive browser page translation ("El Niño" → "The Child", "La Niña" →
 * "The Girl" in Google Translate). Longest first, so "Super El Niño" wins over "El Niño".
 */
export const PROPER_NOUNS = /Super El Niño|El Niño|La Niña|Niño\s?(?:3\.4|1\+2|3|4)|Niño|Niña/g;

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * `[innerHTML]="text | properNouns"`: the text, HTML-escaped, with every ENSO proper noun wrapped in
 * `<span translate="no" class="notranslate">`, so the rest of the sentence can still be translated.
 */
@Pipe({ name: 'properNouns', standalone: true })
export class ProperNounsPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(text: string | null | undefined): SafeHtml {
    const escaped = (text ?? '').replace(/[&<>"']/g, c => ESCAPES[c]);
    const html = escaped.replace(PROPER_NOUNS, m => `<span translate="no" class="notranslate">${m}</span>`);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
