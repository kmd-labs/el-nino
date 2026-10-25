import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CyclesViewComponent } from './cycles-view.component';
import { EnsoHistory, EnsoHistoryService } from '../../core/services/enso-history.service';
import { EnsoStateService } from '../../core/services/enso-state.service';

/** 24-month trajectory shaped like a developing El Niño, with gaps at both ends. */
const traj = (peak: number, upTo = 24): (number | null)[] =>
  Array.from({ length: 24 }, (_, i) =>
    i >= upTo ? null : Math.round((peak * Math.exp(-((i - 11) ** 2) / 40)) * 100) / 100
  );

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
  provisional: {
    month: '2026-10',
    anom: 3.36,
    oni: 2.93,
    weeks: 2,
    lastWeek: '2026-10-14',
    weeklyAnom: 3.3,
    offset: 0.06
  },
  regions: { firstMonth: '1982-01', lastMonth: '2026-09', nino12: [], nino3: [], nino4: [], nino34: [] },
  events: [
    {
      season: '1997/98', phase: 'nino', tier: 'super', peakOni: 2.4, peakMonth: '1997-12',
      peakNino12: 3.7, startMonth: '1997-04', endMonth: '1998-05', durationMonths: 12,
      ongoing: false, trajectory: traj(2.4)
    },
    {
      season: '1973/74', phase: 'nina', tier: 'strong', peakOni: -2.03, peakMonth: '1974-01',
      peakNino12: null, startMonth: '1973-06', endMonth: '1974-08', durationMonths: 15,
      ongoing: false, trajectory: traj(-2.03)
    },
    {
      season: '2026/27', phase: 'nino', tier: 'super', peakOni: 2.5, peakMonth: '2026-09',
      peakNino12: 4.7, startMonth: '2026-05', endMonth: '2026-09', durationMonths: 5,
      ongoing: true, trajectory: traj(2.5, 9)
    }
  ],
  current: {
    season: '2026/27', phase: 'nino', tier: 'super', oniNow: 2.5, month: '2026-09',
    peakSoFar: 2.5, peakMonthSoFar: '2026-09', trajectory: traj(2.5, 9)
  },
  forecast: {
    method: 'analog-ensemble, members anchored to the current level',
    windowMonths: 12,
    horizonMonths: 12,
    members: 2,
    fromMonth: '2026-09',
    fromOni: 2.5,
    futureMonths: ['2026-10', '2026-11', '2026-12', '2027-01'],
    peakWindow: ['2026-10', '2026-11', '2026-12'],
    analogs: [
      { season: '1997/98', endMonth: '1997-09', rmse: 0.16, weight: 0.6, anchor: 0.36, future: [2.66, 2.73, 2.71, 2.6], peakMean: 2.7, peakMax: 2.8 },
      { season: '1972/73', endMonth: '1972-09', rmse: 0.42, weight: 0.4, anchor: 0.92, future: [2.1, 2.0, 1.9, 1.7], peakMean: 2.0, peakMax: 2.1 }
    ],
    median: [2.66, 2.73, 2.71, 2.6],
    p10: [2.49, 2.24, 1.89, 1.69],
    p90: [2.76, 3.01, 3.04, 2.92]
  }
};

describe('CyclesViewComponent', () => {
  let fixture: ComponentFixture<CyclesViewComponent>;
  let component: CyclesViewComponent;
  let history: EnsoHistoryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CyclesViewComponent]
    }).compileComponents();

    history = TestBed.inject(EnsoHistoryService);
    fixture = TestBed.createComponent(CyclesViewComponent);
    component = fixture.componentInstance;
  });

  it('renders and draws onto the canvas once the record is loaded', () => {
    history.data.set(HISTORY);
    history.status.set('ready');
    fixture.detectChanges();

    const box = fixture.componentInstance.boxRef.nativeElement;
    box.style.width = '600px';
    box.style.height = '400px';
    (fixture.componentInstance as any).resize();
    (fixture.componentInstance as any).draw();

    const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas.width).toBeGreaterThan(1);

    // Something was actually painted: at least one pixel is no longer fully transparent.
    const ctx = canvas.getContext('2d')!;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) { painted++; if (painted > 50) break; }
    }
    expect(painted).toBeGreaterThan(50);
  });

  it('puts the event in progress first in the catalogue and keeps La Niña out of it', () => {
    history.data.set(HISTORY);
    fixture.detectChanges();

    const seasons = component.catalogue().map(e => e.season);
    expect(seasons[0]).toBe('2026/27');
    expect(seasons).not.toContain('1973/74');
  });

  it('derives the projected peak range from the analog members', () => {
    history.data.set(HISTORY);
    fixture.detectChanges();

    const range = component.peakRange();
    expect(range?.lo).toBeCloseTo(2.0, 6);
    expect(range?.hi).toBeCloseTo(2.7, 6);
  });

  it('draws without throwing while the record is still missing', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelector('.cycles__state')).toBeTruthy();
  });

  it('shows the month in progress with the date of its last week', () => {
    history.data.set(HISTORY);
    history.status.set('ready');
    fixture.detectChanges();

    const prov: HTMLElement = fixture.nativeElement.querySelector('.cycles__meta--prov');
    expect(prov).toBeTruthy();
    // +2.9 °C for October, not the September value that ends the monthly series
    expect(prov.textContent).toContain('+2.9');
    expect(prov.textContent).toContain('2026');
    expect(component.dayLabel('2026-10-14')).toContain('14');
  });

  it('thins the x-axis labels so full month names keep fitting', () => {
    // "październik" measures roughly 56 px at the 10 px label size
    expect(component.monthStep(1700, 56)).toBe(1);   // very wide: every month
    expect(component.monthStep(900, 56)).toBe(2);    // desktop: every other month
    expect(component.monthStep(520, 56)).toBe(4);
    expect(component.monthStep(300, 56)).toBe(6);    // phone: four labels
    expect(component.monthStep(80, 56)).toBe(12);    // never denser than one per year
  });

  it('measures real month names rather than assuming a width', () => {
    history.data.set(HISTORY);
    fixture.detectChanges();

    const ctx = (fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement).getContext('2d')!;
    ctx.font = '500 10px Inter, sans-serif';
    const widest = Math.max(
      ...['January', 'February', 'September', 'październik', 'septiembre'].map(m => ctx.measureText(m).width)
    );
    expect(widest).toBeGreaterThan(20);
    // whatever the font metrics turn out to be, 24 full names never claim to fit a phone
    expect(component.monthStep(320, widest)).toBeGreaterThanOrEqual(4);
  });

  it('redraws when the dock slider moves', () => {
    history.data.set(HISTORY);
    fixture.detectChanges();
    const state = TestBed.inject(EnsoStateService);

    expect(() => {
      state.setStrengthTarget(2.6);
      fixture.detectChanges();
    }).not.toThrow();
  });
});
