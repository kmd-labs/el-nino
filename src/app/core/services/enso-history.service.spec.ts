import { TestBed } from '@angular/core/testing';
import { EnsoHistory, EnsoHistoryService } from './enso-history.service';
import { EnsoStateService } from './enso-state.service';

/** Minimal record: two finished events, one in progress, three analog members. */
const HISTORY: EnsoHistory = {
  schema: 1,
  fetchedAt: '2026-10-22T00:00:00.000Z',
  sources: [{ id: 'cpc-detrend-nino34', title: 'CPC', url: 'https://example.invalid' }],
  tiers: { super: 2.0, strong: 1.5, moderate: 1.0, weak: 0.5 },
  index: {
    product: 'test',
    firstMonth: '1950-01',
    lastMonth: '2026-09',
    spliceFrom: '2026-07',
    spliceOffset: 0.04,
    anom: [],
    oni: []
  },
  provisional: null,
  regions: {
    firstMonth: '1982-01',
    lastMonth: '2026-09',
    nino12: [],
    nino3: [],
    nino4: [],
    nino34: []
  },
  events: [
    {
      season: '1997/98',
      phase: 'nino',
      tier: 'super',
      peakOni: 2.4,
      peakMonth: '1997-12',
      peakNino12: 3.7,
      startMonth: '1997-04',
      endMonth: '1998-05',
      durationMonths: 12,
      ongoing: false,
      trajectory: []
    },
    {
      season: '1973/74',
      phase: 'nina',
      tier: 'strong',
      peakOni: -2.03,
      peakMonth: '1974-01',
      peakNino12: null,
      startMonth: '1973-06',
      endMonth: '1974-08',
      durationMonths: 15,
      ongoing: false,
      trajectory: []
    },
    {
      season: '2026/27',
      phase: 'nino',
      tier: 'super',
      peakOni: 2.5,
      peakMonth: '2026-09',
      peakNino12: 4.7,
      startMonth: '2026-05',
      endMonth: '2026-09',
      durationMonths: 5,
      ongoing: true,
      trajectory: []
    }
  ],
  current: {
    season: '2026/27',
    phase: 'nino',
    tier: 'super',
    oniNow: 2.5,
    month: '2026-09',
    peakSoFar: 2.5,
    peakMonthSoFar: '2026-09',
    trajectory: []
  },
  forecast: {
    method: 'analog-ensemble, members anchored to the current level',
    windowMonths: 12,
    horizonMonths: 12,
    members: 3,
    fromMonth: '2026-09',
    fromOni: 2.5,
    futureMonths: ['2026-10', '2026-11', '2026-12'],
    peakWindow: ['2026-10', '2026-11', '2026-12'],
    analogs: [
      { season: '1997/98', endMonth: '1997-09', rmse: 0.16, weight: 0.5, anchor: 0.36, future: [], peakMean: 2.7, peakMax: 2.8 },
      { season: '1972/73', endMonth: '1972-09', rmse: 0.42, weight: 0.3, anchor: 0.92, future: [], peakMean: 2.0, peakMax: 2.1 },
      { season: '1957/58', endMonth: '1957-09', rmse: 0.45, weight: 0.2, anchor: 1.18, future: [], peakMean: 1.4, peakMax: 1.8 }
    ],
    median: [2.66, 2.73, 2.71],
    p10: [2.49, 2.24, 1.89],
    p90: [2.76, 3.01, 3.04]
  }
};

describe('EnsoHistoryService', () => {
  let service: EnsoHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsoHistoryService);
  });

  it('reports no probability before the record is loaded', () => {
    expect(service.status()).toBe('idle');
    expect(service.peakProbability(2.0)).toBeNull();
  });

  it('weights the analog ensemble when computing peak probability', () => {
    service.data.set(HISTORY);

    // every member peaks at or above 1.0; only the 1997/98 member reaches 2.5
    expect(service.peakProbability(1.0)).toBeCloseTo(1, 6);
    expect(service.peakProbability(2.5)).toBeCloseTo(0.5, 6);
    expect(service.peakProbability(2.0)).toBeCloseTo(0.8, 6);
    expect(service.peakProbability(3.5)).toBeCloseTo(0, 6);
  });

  it('excludes the event in progress from the past-event list', () => {
    service.data.set(HISTORY);
    const seasons = service.pastNinoEvents().map(e => e.season);
    expect(seasons).toEqual(['1997/98']);
    expect(service.analogSeasons().has('1997/98')).toBe(true);
  });

  it('never classifies a cold event as super', () => {
    service.data.set(HISTORY);
    expect(service.tierOf(2.5, 'nino')).toBe('super');
    expect(service.tierOf(-2.5, 'nina')).toBe('strong');
    expect(service.tierOf(0.2, 'neu')).toBeNull();
  });
});

describe('EnsoStateService peak probability', () => {
  let state: EnsoStateService;
  let history: EnsoHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    state = TestBed.inject(EnsoStateService);
    history = TestBed.inject(EnsoHistoryService);
  });

  it('shows a dash until the record is available', () => {
    expect(state.prob2026()).toBe('—');
  });

  it('derives the percentage from the analog ensemble, rounded to 5%', () => {
    history.data.set(HISTORY);

    // nino34(s) ≈ 0.918 · s, so s = 1.0 asks for a peak of ≈ +0.92 °C — every member clears it
    state.setStrengthTarget(1.0);
    expect(state.prob2026()).toBe('>95%');

    // s = 2.6 (the Super El Niño preset) asks for ≈ +2.39 °C — only the 1997/98 member clears it
    state.setStrengthTarget(2.6);
    expect(state.prob2026()).toBe('~50%');

    // beyond every member's peak
    state.setStrengthTarget(3.0);
    expect(state.prob2026()).toBe('<5%');
  });
});
