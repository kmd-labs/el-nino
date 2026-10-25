import { TestBed } from '@angular/core/testing';
import { MapDockComponent } from './map-dock.component';
import { CurrentWeatherService, TimelineMeta } from '../../core/services/current-weather.service';
import { LocaleDatePipe } from '../../core/pipes/locale-date.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { LocaleTempPipe } from '../../core/pipes/locale-temp.pipe';

/**
 * Builds a timeline the way scripts/fetch-current-weather.mjs does: the last frame is
 * the forecast pinned to s = 2.6, the one before it is `now` at s = 1.4, and the rest
 * ramp linearly from s = -1.8 over the frame index.
 */
const meta = (frames: [string, number][]): TimelineMeta =>
  ({
    keyframes: frames.map(([date, nino34], idx) => {
      const isLast = idx === frames.length - 1;
      const isNow = !isLast && idx === frames.length - 2;
      return {
        index: idx,
        id: isLast ? 'forecast' : isNow ? 'now' : `w${String(idx).padStart(3, '0')}`,
        date,
        nino34,
        // round3, exactly as the fetch script writes it
        s: isLast ? 2.6 : Math.round((-1.8 + (idx / Math.max(1, frames.length - 2)) * (1.4 - -1.8)) * 1000) / 1000,
        ...(isNow ? { now: true } : {}),
        ...(isLast ? { forecast: true } : {})
      };
    })
  }) as TimelineMeta;

/** Cold peak, a long calm stretch, then a warm-up into a super forecast. */
const RECORD: [string, number][] = [
  ['2024-11-06', -0.2],
  ['2024-12-18', -1.2], // deepest cold peak -> La Niña anchor
  ['2025-02-12', -0.3],
  ['2025-04-16', 0.1], // middle of the longest calm run -> Neutral anchor
  ['2025-06-18', 0.0],
  ['2025-08-20', 0.2],
  ['2025-10-22', 0.7], // first week at or above +0.5 -> El Niño anchor
  ['2026-01-14', 2.3],
  ['2026-10-21', 3.1], // now
  ['2026-12-16', 4.2] // warmest frame of all -> Super anchor
];

/** Same record with the cold peak one frame later and a deeper calm. */
const SHIFTED: [string, number][] = RECORD.map(([d, v], i): [string, number] =>
  i === 1 ? [d, -0.4] : i === 2 ? [d, -1.5] : [d, v]
);

describe('MapDockComponent slider anchors', () => {
  const setup = (frames: [string, number][]) => {
    TestBed.configureTestingModule({ providers: [LocaleDatePipe, LocaleTempPipe] });
    const weather = TestBed.inject(CurrentWeatherService);
    const localeDate = TestBed.inject(LocaleDatePipe);
    const state = TestBed.inject(EnsoStateService);
    const i18n = TestBed.inject(I18nService);
    i18n.setLang('en');
    weather.meta.set(meta(frames));
    const dock = TestBed.createComponent(MapDockComponent).componentInstance;
    const month = (iso: string) => localeDate.transform(new Date(`${iso}T12:00:00Z`), 'monthYear');
    return { weather, dock, state, i18n, month };
  };

  afterEach(() => TestBed.resetTestingModule());

  it('puts each phase where the observed series actually shows it', () => {
    const { weather, dock, month } = setup(RECORD);

    expect(weather.phaseAnchors().map(a => [a.ph, a.date, a.nino34])).toEqual([
      ['nina', '2024-12-18', -1.2],
      ['neu', '2025-04-16', 0.1],
      ['nino', '2025-10-22', 0.7],
      ['super', '2026-12-16', 4.2]
    ]);

    const dates = dock.dateMarkers();
    expect(dates.map(d => d.id)).toEqual(['m-nina', 'm-neu', 'm-nino', 'm-now', 'm-super']);
    expect(dates.map(d => d.value)).toEqual([-1.4, -0.6, 0.6, 1.4, 2.6]);
    expect(dates.map(d => d.label)).toEqual([
      month('2024-12-18'),
      month('2025-04-16'),
      month('2025-10-22'),
      month('2026-10-21'),
      month('2026-12-16')
    ]);
  });

  it('carries NOW as an extra marker and flags only the forecast', () => {
    const { dock, i18n } = setup(RECORD);

    const pills = dock.timelineMarkers();
    expect(pills.map(p => p.id)).toEqual(['nina', 'neu', 'nino', 'now', 'super']);
    expect(pills.find(p => p.id === 'now')!.label).toBe(i18n.t().timelineNow);

    const dates = dock.dateMarkers();
    expect(dates.filter(d => d.subLabel).map(d => d.id)).toEqual(['m-super']);
    expect(dates.find(d => d.id === 'm-now')!.subLabel).toBeUndefined();
  });

  it('anchors mid-run rather than on the threshold it just crossed', () => {
    const { weather } = setup([
      ['2025-01-01', 0.0],
      ['2025-03-01', 0.6], // the crossing itself — too close to the threshold to anchor on
      ['2025-05-01', 1.2],
      ['2025-07-01', 1.5],
      ['2025-09-01', 1.8],
      ['2026-10-21', 2.4],
      ['2026-12-16', 3.0]
    ]);

    const nino = weather.phaseAnchors().find(a => a.ph === 'nino')!;
    expect(nino.date).toBe('2025-05-01');
    expect(nino.nino34).toBe(1.2);
  });

  it('leaves out a phase the record never reached', () => {
    const { weather } = setup([
      ['2025-01-01', 0.1],
      ['2025-06-01', 0.3],
      ['2026-10-21', 2.4],
      ['2026-12-16', 3.0]
    ]);

    // Never colder than -0.5, and it jumps straight past the El Niño band into super.
    expect(weather.phaseAnchors().map(a => a.ph)).toEqual(['neu', 'super']);
  });

  it('reports no anomaly past NOW, where the frames stop being observations', () => {
    const { dock, state } = setup(RECORD);

    // Compared against the pipe's own output: 'en' renders Fahrenheit.
    const temp = TestBed.inject(LocaleTempPipe);
    state.sCur.set(1.4);
    expect(dock.formattedNino()).toBe(temp.transform(3.1, 'delta'));

    // Beyond the last observation the globe shows a synthesised scenario, so there is
    // no measured figure to report.
    state.sCur.set(2.6);
    expect(dock.formattedNino()).toBe('—');
  });

  it('keeps the super anchor on the end of the slider, never stacked on NOW', () => {
    // The forecast frame is cooler than the latest observation here, so the plain
    // warmest frame would be NOW — and two markers would land on one position.
    const { weather, dock } = setup([...RECORD.slice(0, -1), ['2026-12-16', 2.2]]);

    const sup = weather.phaseAnchors().find(a => a.ph === 'super')!;
    expect(sup.date).toBe('2026-12-16');
    expect(sup.s).toBe(2.6);
    expect(new Set(dock.dateMarkers().map(d => d.value)).size).toBe(dock.dateMarkers().length);
  });

  it('keeps the two rows on the same values, so a date cannot drift off its pill', () => {
    const { dock } = setup(RECORD);
    expect(dock.dateMarkers().map(d => d.value)).toEqual(dock.timelineMarkers().map(p => p.value));
  });

  it('follows the data when the record changes instead of freezing on a literal', () => {
    const base = setup(RECORD);
    const ninaBefore = base.dock.dateMarkers().find(d => d.id === 'm-nina')!;
    expect(ninaBefore.value).toBe(-1.4);

    TestBed.resetTestingModule();
    const shifted = setup(SHIFTED);
    const ninaAfter = shifted.dock.dateMarkers().find(d => d.id === 'm-nina')!;

    // The cold peak moved one frame later, so the La Niña anchor moved with it.
    expect(shifted.weather.phaseAnchors().find(a => a.ph === 'nina')!.date).toBe('2025-02-12');
    expect(ninaAfter.value).toBe(-1);
    expect(ninaAfter.label).toBe(shifted.month('2025-02-12'));
  });
});
