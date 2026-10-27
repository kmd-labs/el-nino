import { TestBed } from '@angular/core/testing';
import { CurrentWeatherService, TimelineMeta } from './current-weather.service';
import { EnsoStateService } from './enso-state.service';
import { I18nService } from '../i18n/i18n.service';
import { ShareLinkService } from './share-link.service';

const META = {
  keyframes: [
    { index: 0, id: 'w000', date: '2024-11-06', s: -1.8, nino34: 0 },
    { index: 1, id: 'now', date: '2026-10-21', s: 1.4, nino34: 3.5, now: true },
    { index: 2, id: 'forecast', date: '2026-12-16', s: 2.6, nino34: 4.6, forecast: true }
  ]
} as TimelineMeta;

/** A record with a real cold phase and a clear El Niño band ahead of the super peak. */
const FULL_META = {
  keyframes: [
    { index: 0, id: 'w000', date: '2024-11-06', s: -1.8, nino34: -0.9 },
    { index: 1, id: 'w001', date: '2025-02-12', s: -1.16, nino34: -1.2 },
    { index: 2, id: 'w002', date: '2025-06-18', s: -0.52, nino34: -0.1 },
    { index: 3, id: 'w003', date: '2025-11-05', s: 0.12, nino34: 0.8 },
    { index: 4, id: 'w004', date: '2026-04-15', s: 0.76, nino34: 1.3 },
    { index: 5, id: 'now', date: '2026-10-21', s: 1.4, nino34: 2.4, now: true },
    { index: 6, id: 'forecast', date: '2026-12-16', s: 2.6, nino34: 3.0, forecast: true }
  ]
} as TimelineMeta;

describe('ShareLinkService', () => {
  let originalUrl: string;

  const setup = (search: string) => {
    history.replaceState(null, '', location.pathname + search);
    TestBed.configureTestingModule({});
    const share = TestBed.inject(ShareLinkService);
    const state = TestBed.inject(EnsoStateService);
    const weather = TestBed.inject(CurrentWeatherService);
    TestBed.inject(I18nService).setLang('en');
    return { share, state, weather };
  };

  beforeEach(() => (originalUrl = location.href));
  afterEach(() => history.replaceState(null, '', originalUrl));

  it('applies a preset and view from the URL and skips the intro', () => {
    const { state } = setup('?state=super&view=walker');
    expect(state.view()).toBe('walker');
    expect(state.sTarget()).toBe(2.6);
    expect(state.sCur()).toBe(2.6);

    state.beginExperience();
    expect(state.isPlaying()).toBe(false);
  });

  it('clamps numeric strengths to the slider range', () => {
    const { state } = setup('?state=9');
    expect(state.sTarget()).toBe(3);
  });

  it('ignores invalid parameters and keeps the defaults', () => {
    const { state } = setup('?state=hot&view=moon&date=yesterday');
    expect(state.view()).toBe('globe');
    expect(state.sTarget()).toBe(-1.8);

    state.beginExperience();
    expect(state.isPlaying()).toBe(true);
  });

  it('applies a date link once the timeline data has loaded', () => {
    const { state, weather } = setup('?date=2026-11-18');
    state.beginExperience();
    expect(state.isPlaying()).toBe(false);

    weather.meta.set(META);
    TestBed.tick();
    expect(state.sTarget()).toBeCloseTo(2.0, 5);
    expect(weather.dateIsoAt(state.sTarget())).toBe('2026-11-18');
  });

  it('moves a phase link onto the anchor the record gives that phase', () => {
    const { state, weather } = setup('?state=nino');
    // Opens on the static preset, because the anchors are not loaded yet.
    expect(state.sTarget()).toBe(1.4);

    weather.meta.set(FULL_META);
    TestBed.tick();

    // +1.4 is a super week in this record; El Niño proper sits back at s = 0.12.
    expect(state.sTarget()).toBe(0.12);
  });

  it('names the phase in the URL when the slider sits on its anchor', () => {
    const { share, state, weather } = setup('');
    weather.meta.set(FULL_META);
    TestBed.tick();

    state.setPreset(-1.16);
    expect(new URL(share.buildUrl('state')).search).toBe('?state=nina&lang=en');
  });

  it('builds state links with preset names or rounded values', () => {
    const { share, state } = setup('?utm_source=linkedin');

    state.setView('impacts');
    state.setPreset(-1.6);
    expect(new URL(share.buildUrl('state')).search).toBe('?view=impacts&state=nina&lang=en');

    state.setView('globe');
    state.setStrengthTarget(0.8567);
    expect(new URL(share.buildUrl('state')).search).toBe('?state=0.86&lang=en');

    state.setStrengthTarget(1.4);
    expect(new URL(share.buildUrl('state')).search).toBe('?state=nino&lang=en');
  });

  it('builds date links from the day shown on the timeline', () => {
    const { share, state, weather } = setup('');
    weather.meta.set(META);
    state.setView('walker');
    state.setStrengthTarget(1.4);
    expect(new URL(share.buildUrl('date')).search).toBe('?view=walker&date=2026-10-21&lang=en');
  });
});
