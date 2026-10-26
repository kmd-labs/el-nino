import { TestBed } from '@angular/core/testing';
import { MapDockComponent } from './map-dock.component';
import { CurrentWeatherService, TimelineMeta } from '../../core/services/current-weather.service';
import { LocaleDatePipe } from '../../core/pipes/locale-date.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { LocaleTempPipe } from '../../core/pipes/locale-temp.pipe';

/**
 * Builds an observed timeline keyframes array spanning s = -1.8 to 1.4.
 */
const meta = (frames: [string, number][]): TimelineMeta =>
  ({
    grid: { step: 0.5, nLat: 360, nLon: 720, lat0: -89.75, lon0: -179.75 },
    totalFrames: frames.length,
    binFile: 'assets/data/timeline-sst.bin.gz',
    keyframes: frames.map(([date, nino34], idx) => {
      const isNow = idx === frames.length - 1;
      return {
        index: idx,
        id: isNow ? 'now' : `w${String(idx).padStart(3, '0')}`,
        date,
        nino34,
        s: Math.round((-1.8 + (idx / Math.max(1, frames.length - 1)) * (1.4 - -1.8)) * 1000) / 1000,
        ...(isNow ? { now: true } : {})
      };
    })
  }) as TimelineMeta;

/** Cold peak, a long calm stretch, then a warm-up into super. */
const RECORD: [string, number][] = [
  ['2024-11-06', -0.2],
  ['2024-12-18', -1.2], // deepest cold peak -> La Niña anchor
  ['2025-02-12', -0.3],
  ['2025-04-16', 0.1], // middle of the longest calm run -> Neutral anchor
  ['2025-06-18', 0.0],
  ['2025-08-20', 0.2],
  ['2025-10-22', 0.7], // first week at or above +0.5 -> El Niño anchor
  ['2026-01-14', 2.3],
  ['2026-10-21', 3.1] // now -> Super anchor
];

describe('MapDockComponent', () => {
  const setup = (frames: [string, number][]) => {
    TestBed.configureTestingModule({ providers: [LocaleDatePipe, LocaleTempPipe] });
    const weather = TestBed.inject(CurrentWeatherService);
    const localeDate = TestBed.inject(LocaleDatePipe);
    const state = TestBed.inject(EnsoStateService);
    const i18n = TestBed.inject(I18nService);
    i18n.setLang('en');
    weather.meta.set(meta(frames));
    const fixture = TestBed.createComponent(MapDockComponent);
    const dock = fixture.componentInstance;
    const month = (iso: string) => localeDate.transform(new Date(`${iso}T12:00:00Z`), 'monthYear');
    return { weather, dock, state, i18n, month };
  };

  afterEach(() => TestBed.resetTestingModule());

  it('puts each phase anchor where the observed series actually shows it', () => {
    const { weather } = setup(RECORD);

    expect(weather.phaseAnchors().map(a => [a.ph, a.date, a.nino34])).toEqual([
      ['nina', '2024-12-18', -1.2],
      ['neu', '2025-04-16', 0.1],
      ['nino', '2025-10-22', 0.7],
      ['super', '2026-10-21', 3.1]
    ]);
  });

  it('lights the anomaly category according to observed data', () => {
    const { state } = setup(RECORD);

    state.sCur.set(-1.4); // the record reads -1.2 here
    expect(state.phase()).toBe('nina');
    expect(state.category().k).toBe('nina');

    state.sCur.set(-0.6); // warmed back to +0.1
    expect(state.phase()).toBe('neu');
    expect(state.category().k).toBe('neu');

    state.sCur.set(1.4); // +3.1
    expect(state.phase()).toBe('super');
    expect(state.category().k).toBe('super');
  });

  it('renders formatted Niño 3.4 temperature delta', () => {
    const { dock, state } = setup(RECORD);
    const temp = TestBed.inject(LocaleTempPipe);

    state.sCur.set(1.4);
    expect(dock.formattedNino()).toBe(temp.transform(3.1, 'delta'));
  });

  it('identifies live/now state correctly at the end of the slider', () => {
    const { dock, state } = setup(RECORD);

    state.sCur.set(-1.8);
    expect(dock.isNow()).toBe(false);

    state.sCur.set(1.4);
    expect(dock.isNow()).toBe(true);
  });

  it('generates phaseTicks across the slider rail', () => {
    const { dock } = setup(RECORD);
    const ticks = dock.phaseTicks();
    expect(ticks).toBeTruthy();
    expect(ticks).toContain('linear-gradient(90deg');
  });

  it('updates target strength on slider change', () => {
    const { dock, state } = setup(RECORD);
    dock.onSliderChange(0.5);
    expect(state.sTarget()).toBe(0.5);
  });

  it('computes dock metrics and clearance', () => {
    const { dock } = setup(RECORD);
    const fixture = TestBed.createComponent(MapDockComponent);
    fixture.detectChanges();
    fixture.componentInstance.updateDockMetrics();
    expect(document.documentElement.style.getPropertyValue('--dock-clearance')).toBeTruthy();
  });
});
