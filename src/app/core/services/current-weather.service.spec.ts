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

  it('should compute the Niño 3.4 mean sea-surface temperature from the binary frames', () => {
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
    service.sstBin = new Uint8Array(360 * 720 * 2).fill(165); // 165 * 0.2 − 5 = 28 °C

    expect(service.nino34Sst(0)).toBeCloseTo(28, 1);

    service.sstBin = new Uint8Array(360 * 720 * 2).fill(255); // land / missing
    expect(service.nino34Sst(0)).toBeNull();
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

    const justAfterNow = service.interpolatedDateLabel(1.45, 'en', 'Now', 'Forecast');
    expect(justAfterNow).toContain('Forecast');

    const forecastLabel = service.interpolatedDateLabel(2.6, 'en', 'Now', 'Forecast');
    expect(forecastLabel).toContain('Forecast');
  });

  it('should return daily tropical weather for the selected date and none for the forecast frame', () => {
    service['meta'].set({
      source: 'test',
      sourceUrl: '',
      sstSourceUrl: '',
      fetchedAt: '',
      grid: { step: 0.5, nLat: 360, nLon: 720, lat0: -89.75, lon0: -179.75 },
      totalFrames: 3,
      binFile: '',
      keyframes: [
        { index: 0, id: 'w0', date: '2024-11-06', s: -1.8, nino34: 0 },
        { index: 1, id: 'now', date: '2024-11-08', s: 1.4, nino34: 0, now: true },
        { index: 2, id: 'forecast', date: '2025-01-03', s: 2.6, nino34: 0, forecast: true }
      ],
      dailyWeather: {
        source: 'test',
        sourceUrl: '',
        fetchedAt: '',
        start: '2024-11-06',
        end: '2024-11-08',
        airTemp: [20, 22, 24],
        windSpeed: [1, 2, 3]
      }
    });

    expect(service.dailyWeatherOn(-1.8)).toEqual({ airTemp: 20, windSpeed: 1 });
    expect(service.dailyWeatherOn(-0.2)).toEqual({ airTemp: 22, windSpeed: 2 });
    expect(service.dailyWeatherOn(1.4)).toEqual({ airTemp: 24, windSpeed: 3 });
    expect(service.dailyWeatherOn(2.6)).toBeNull();

    expect(service.isForecast(-1.8)).toBeFalse();
    expect(service.isForecast(1.4)).toBeFalse();
    expect(service.isForecast(1.5)).toBeTrue();
    expect(service.isForecast(2.6)).toBeTrue();
  });

  it('should sample point water and air temperatures from real pre-baked grids without interpolation', () => {
    const airGrid = { step: 10, nLat: 17, nLon: 36, lat0: -80, lon0: -180 };
    const airPoints = airGrid.nLat * airGrid.nLon;
    service['meta'].set({
      source: 'test',
      sourceUrl: '',
      sstSourceUrl: '',
      fetchedAt: '',
      grid: { step: 0.5, nLat: 360, nLon: 720, lat0: -89.75, lon0: -179.75 },
      airGrid,
      totalFrames: 2,
      binFile: '',
      keyframes: [
        { index: 0, id: 'k0', date: '2024-11-06', s: -1.0, nino34: 0 },
        { index: 1, id: 'k1', date: '2025-06-11', s: 1.0, nino34: 2 }
      ]
    });
    service.sstBin = new Uint8Array(360 * 720 * 2).fill(165); // 165 -> 28 °C
    service.airBin = new Int16Array(airPoints * 2);
    service.airBin.fill(49, 0, airPoints); // Frame 0: 4.9 °C
    service.airBin.fill(198, airPoints, airPoints * 2); // Frame 1: 19.8 °C

    const sampleNov = service.samplePointAt(17.04, 51.11, -1.0);
    expect(sampleNov.waterTemp).toBeCloseTo(28, 1);
    expect(sampleNov.airTemp).toBeCloseTo(4.9, 1);

    const sampleJun = service.samplePointAt(17.04, 51.11, 1.0);
    expect(sampleJun.waterTemp).toBeCloseTo(28, 1);
    expect(sampleJun.airTemp).toBeCloseTo(19.8, 1);

    // Over land/missing SST data
    service.sstBin = new Uint8Array(360 * 720 * 2).fill(255);
    const landSample = service.samplePointAt(17.04, 51.11, 1.0);
    expect(landSample.waterTemp).toBeNull();
    expect(landSample.airTemp).toBeCloseTo(19.8, 1);

    // Over land flag set explicitly
    service.sstBin = new Uint8Array(360 * 720 * 2).fill(165); // would be 28°C if ocean
    const explicitLandSample = service.samplePointAt(17.04, 51.11, 1.0, true);
    expect(explicitLandSample.waterTemp).toBeNull();
    expect(explicitLandSample.airTemp).toBeCloseTo(19.8, 1);
  });

  it('extracts packed weekly air temperature Int16Array from combined binary asset', () => {
    const airGrid = { step: 10, nLat: 17, nLon: 36, lat0: -80, lon0: -180 };
    const airPoints = airGrid.nLat * airGrid.nLon;
    const meta = {
      source: 'test',
      sourceUrl: '',
      sstSourceUrl: '',
      fetchedAt: '',
      totalFrames: 2,
      binFile: '',
      grid: { lat0: -89.75, lon0: -179.75, step: 0.5, nLat: 360, nLon: 720 },
      airGrid,
      keyframes: [
        { index: 0, id: 'k0', date: '2024-11-06', s: 0.0, nino34: 0 },
        { index: 1, id: 'k1', date: '2025-06-11', s: 1.0, nino34: 0 }
      ]
    };
    const sstBytes = 2 * service.FRAME_SIZE;
    const airArr = new Int16Array(2 * airPoints);
    airArr.fill(49, 0, airPoints); // 4.9 °C in November
    airArr.fill(150, airPoints, 2 * airPoints); // 15.0 °C in June
    const combined = new Uint8Array(sstBytes + airArr.byteLength);
    combined.fill(255, 0, sstBytes); // Land
    combined.set(new Uint8Array(airArr.buffer), sstBytes);

    service['meta'].set(meta);
    service.sstBin = combined;
    service.extractAirBin(meta, combined);

    const novSample = service.samplePointAt(17, 51, 0.0);
    const junSample = service.samplePointAt(17, 51, 1.0);
    expect(novSample.waterTemp).toBeNull();
    expect(novSample.airTemp).toBeCloseTo(4.9, 1);
    expect(junSample.airTemp).toBeCloseTo(15.0, 1);
  });

  it('returns null for water and air temperature when in forecast', () => {
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
    service.sstBin = new Uint8Array(360 * 720 * 2).fill(165);

    const forecastSample = service.samplePointAt(0, 0, 2.0);
    expect(forecastSample.waterTemp).toBeNull();
    expect(forecastSample.airTemp).toBeNull();
  });
});
