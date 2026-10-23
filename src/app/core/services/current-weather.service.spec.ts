import { TestBed } from '@angular/core/testing';
import { CurrentWeatherService } from './current-weather.service';

describe('CurrentWeatherService', () => {
  let service: CurrentWeatherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrentWeatherService);
    service.sstBin = new Uint8Array(360 * 720 * 2);
  });

  it('should be created with initial state', () => {
    expect(service).toBeTruthy();
    expect(service.status()).toBe('idle');
  });

  it('should interpolate keyframe pair correctly from metadata', () => {
    // Manually set metadata to test interpolation logic
    service['meta'].set({
      source: 'test',
      sourceUrl: '',
      sstSourceUrl: '',
      fetchedAt: '',
      grid: { step: 0.5, nLat: 360, nLon: 720, lat0: -89.75, lon0: -179.75 },
      totalFrames: 2,
      binFile: '',
      keyframes: [
        { index: 0, id: 'k0', date: '2024-11-06', s: -1.0, nino34: 0 },
        { index: 1, id: 'k1', date: '2024-11-13', s: 1.0, nino34: 2 }
      ]
    });

    const pair = service.getKeyframePair(0.0);
    expect(pair).toBeTruthy();
    expect(pair?.indexA).toBe(0);
    expect(pair?.indexB).toBe(1);
    expect(pair?.t).toBeCloseTo(0.5, 3);
  });

  it('should format date labels properly', () => {
    service['meta'].set({
      source: 'test',
      sourceUrl: '',
      sstSourceUrl: '',
      fetchedAt: '',
      grid: { step: 0.5, nLat: 360, nLon: 720, lat0: -89.75, lon0: -179.75 },
      totalFrames: 2,
      binFile: '',
      keyframes: [
        { index: 0, id: 'now', date: '2026-10-14', s: 1.4, nino34: 3.4, now: true },
        { index: 1, id: 'forecast', date: '2026-12-16', s: 2.6, nino34: 4.5, forecast: true }
      ]
    });

    const nowLabel = service.interpolatedDateLabel(1.4, 'en', 'Now', 'Forecast');
    expect(nowLabel).toContain('Now');

    const forecastLabel = service.interpolatedDateLabel(2.6, 'en', 'Now', 'Forecast');
    expect(forecastLabel).toContain('Forecast');
  });
});
