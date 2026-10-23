import { WeatherValuePipe } from './weather-value.pipe';

describe('WeatherValuePipe', () => {
  const pipe = new WeatherValuePipe();

  it('always shows one decimal place', () => {
    expect(pipe.transform(24, '°C')).toBe('24.0 °C');
    expect(pipe.transform(24.5, '°C')).toBe('24.5 °C');
    expect(pipe.transform(24.56, '°C')).toBe('24.6 °C');
  });

  it('formats with the active locale', () => {
    expect(pipe.transform(24, 'm/s', 'pl')).toBe('24,0 m/s');
    expect(pipe.transform(24.5, 'm/s', 'es')).toBe('24,5 m/s');
  });

  it('shows a dash for missing values', () => {
    expect(pipe.transform(null, '°C')).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform(Number.NaN)).toBe('—');
  });
});
