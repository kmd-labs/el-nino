import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { ProperNounsPipe } from './proper-nouns.pipe';

describe('ProperNounsPipe', () => {
  const html = (text: string) => {
    const pipe = TestBed.runInInjectionContext(() => new ProperNounsPipe());
    const sanitizer = TestBed.inject(DomSanitizer);
    const safe = pipe.transform(text);
    // SafeHtml keeps the raw string for trusted values
    return (safe as unknown as { changingThisBreaksApplicationSecurity: string }).changingThisBreaksApplicationSecurity
      ?? sanitizer.sanitize(1, safe);
  };

  it('wraps ENSO names so browser translation leaves them alone', () => {
    expect(html('Super El Niño beats La Niña in Niño 3.4'))
      .toBe('<span translate="no" class="notranslate">Super El Niño</span> beats '
        + '<span translate="no" class="notranslate">La Niña</span> in '
        + '<span translate="no" class="notranslate">Niño 3.4</span>');
  });

  it('escapes the rest of the text', () => {
    expect(html('<b>El Niño</b> & co')).toBe('&lt;b&gt;<span translate="no" class="notranslate">El Niño</span>&lt;/b&gt; &amp; co');
  });
});
