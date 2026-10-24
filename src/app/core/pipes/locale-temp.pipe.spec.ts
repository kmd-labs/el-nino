import { TestBed } from '@angular/core/testing';
import { LocaleTempPipe } from './locale-temp.pipe';
import { I18nService } from '../i18n/i18n.service';

describe('LocaleTempPipe', () => {
  let pipe: LocaleTempPipe;
  let i18n: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocaleTempPipe, I18nService]
    });
    pipe = TestBed.inject(LocaleTempPipe);
    i18n = TestBed.inject(I18nService);
  });

  it('formats absolute temperature in Celsius', () => {
    i18n.setLang('pl');
    i18n.setTempUnit('C');
    expect(pipe.transform(24)).toBe('24,0 °C');
    expect(pipe.transform(-5.2)).toBe('−5,2 °C');
  });

  it('formats absolute temperature in Fahrenheit', () => {
    i18n.setLang('en');
    i18n.setTempUnit('F');
    // 0 °C -> 32 °F
    expect(pipe.transform(0)).toBe('32.0 °F');
    // 20 °C -> 68 °F
    expect(pipe.transform(20)).toBe('68.0 °F');
  });

  it('formats temperature anomaly (delta) with sign', () => {
    i18n.setLang('en');
    i18n.setTempUnit('C');
    expect(pipe.transform(1.5, 'delta')).toBe('+1.5 °C');
    expect(pipe.transform(-0.8, 'delta')).toBe('−0.8 °C');

    i18n.setTempUnit('F');
    // delta: +1.5 °C * 1.8 = +2.7 °F
    expect(pipe.transform(1.5, 'delta')).toBe('+2.7 °F');
  });

  it('shows a dash for missing or invalid values', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform(Number.NaN)).toBe('—');
  });
});
