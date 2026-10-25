import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ExternalLink } from 'lucide-angular';
import { ThemeService } from '@kmd/design-system/services/theme.service';
import { BadgeComponent } from '@kmd/design-system/ui/badge/badge.component';
import { EnsoStateService } from '../../core/services/enso-state.service';
import { EnsoHistoryEvent, EnsoHistoryService } from '../../core/services/enso-history.service';
import { CurrentWeatherService } from '../../core/services/current-weather.service';
import { I18nService } from '../../core/i18n/i18n.service';

/** Months covered by the x axis: January of the first season year → December of the second. */
const SPAN = 24;
const ONI_MIN = -2.6;
const ONI_MAX = 3.2;

/**
 * Full-screen chart of every observed ENSO event since 1950 with the analog-ensemble forecast
 * for the event in progress. Observed data only — the analytic model drives the other views.
 */
@Component({
  selector: 'app-cycles-view',
  standalone: true,
  imports: [CommonModule, BadgeComponent, LucideAngularModule],
  templateUrl: './cycles-view.component.html',
  styleUrl: './cycles-view.component.scss'
})
export class CyclesViewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('box') boxRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cv') canvasRef!: ElementRef<HTMLCanvasElement>;

  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  history = inject(EnsoHistoryService);
  private theme = inject(ThemeService);
  private weather = inject(CurrentWeatherService);

  readonly externalLinkIcon = ExternalLink;

  /** The event in progress first, then the strongest finished El Niño events. */
  readonly catalogue = computed<EnsoHistoryEvent[]>(() => {
    const events = this.history.events();
    const ongoing = events.filter(e => e.ongoing);
    const past = events
      .filter(e => e.phase === 'nino' && !e.ongoing)
      .sort((a, b) => b.peakOni - a.peakOni)
      .slice(0, 6);
    return [...ongoing, ...past];
  });

  readonly peakRange = computed<{ lo: number; hi: number; window: string } | null>(() => {
    const f = this.history.forecast();
    if (!f) return null;
    const peaks = f.analogs.map(a => a.peakMean);
    const first = f.peakWindow[0] ?? '';
    const last = f.peakWindow[f.peakWindow.length - 1] ?? '';
    return {
      lo: Math.min(...peaks),
      hi: Math.max(...peaks),
      window: first && last ? `${this.monthLabel(first)} – ${this.monthLabel(last)}` : ''
    };
  });

  private resizeObs: ResizeObserver | null = null;
  private ready = false;

  constructor() {
    effect(() => {
      // redraw when either dataset arrives, the language changes, or the dock slider moves
      this.history.data();
      this.weather.meta();
      this.i18n.lang();
      this.state.sTarget();
      if (this.ready) this.draw();
    });
  }

  ngAfterViewInit() {
    this.resizeObs = new ResizeObserver(() => {
      this.resize();
      this.draw();
    });
    this.resizeObs.observe(this.boxRef.nativeElement);
    this.ready = true;
    this.resize();
    this.draw();
  }

  ngOnDestroy() {
    this.resizeObs?.disconnect();
  }

  /** "2026-10" → "Oct 2026" in the active language. */
  monthLabel(key: string): string {
    const [y, m] = key.split('-').map(Number);
    const name = this.i18n.t().months[(m ?? 1) - 1] ?? '';
    return `${name} ${y}`;
  }

  /** "2026-10-14" or a Date → "14 Oct 2026" in the active language. */
  dayLabel(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(`${value}T12:00:00Z`);
    return new Intl.DateTimeFormat(this.i18n.t().htmlLang, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(d);
  }

  /**
   * The date the dock's time slider currently points at. The slider doubles as the app's timeline,
   * so this comes from the same keyframes that drive the globe; null until they are loaded.
   */
  private sliderDate(): Date | null {
    const pair = this.weather.getKeyframePair(this.state.sTarget());
    if (!pair) return null;
    const a = new Date(`${pair.kfA.date}T12:00:00Z`).getTime();
    const b = new Date(`${pair.kfB.date}T12:00:00Z`).getTime();
    return new Date(a + (b - a) * pair.t);
  }

  /**
   * How many months to skip between x-axis labels so full month names never overlap:
   * 1 = every month, 12 = one label per year. `widest` is the widest rendered name.
   */
  monthStep(plotW: number, widest: number): number {
    return [1, 2, 3, 4, 6, 12].find(s => (SPAN / s) * (widest + 12) <= plotW) ?? 12;
  }

  formatOni(v: number, digits = 2): string {
    return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(digits)}`;
  }

  tierLabel(tier: EnsoHistoryEvent['tier']): string {
    return this.i18n.t().tier[tier];
  }

  private resize() {
    const box = this.boxRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = this.canvasRef.nativeElement;
    c.width = Math.max(1, Math.round(box.clientWidth * dpr));
    c.height = Math.max(1, Math.round(box.clientHeight * dpr));
  }

  private draw() {
    const c = this.canvasRef?.nativeElement;
    const ctx = c?.getContext('2d');
    if (!c || !ctx || c.width < 2) return;

    const dpr = c.width / this.boxRef.nativeElement.clientWidth;
    const Wd = c.width / dpr;
    const Hd = c.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, Wd, Hd);

    const font = this.theme.getFontFamily();
    const ink = this.theme.getTokenColor('text-main', '#1f2937');
    const dim = this.theme.getTokenColor('text-dim', '#6b7280');
    const line = this.theme.getTokenColor('line', 'rgba(15,23,42,0.10)');
    const lineStrong = this.theme.getTokenColor('line-strong', 'rgba(15,23,42,0.18)');
    const cNino = this.theme.getTokenColor('phase-nino', '#f97316');
    const cNina = this.theme.getTokenColor('phase-nina', '#0ea5e9');
    const cSuper = this.theme.getTokenColor('phase-super', '#dc2626');
    const cAccent = this.theme.getTokenColor('accent', '#d37400');

    const padL = 42;
    const padR = 12;
    const padT = 14;
    const padB = 26;
    const plotW = Math.max(10, Wd - padL - padR);
    const plotH = Math.max(10, Hd - padT - padB);

    const X = (i: number) => padL + (i / (SPAN - 1)) * plotW;
    const Y = (v: number) => padT + ((ONI_MAX - v) / (ONI_MAX - ONI_MIN)) * plotH;

    // ── grid, thresholds and axis labels ──
    ctx.font = `500 10px ${font}`;
    ctx.textBaseline = 'middle';
    for (let v = -2; v <= 3; v += 1) {
      ctx.strokeStyle = v === 0 ? lineStrong : line;
      ctx.lineWidth = v === 0 ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(padL, Y(v));
      ctx.lineTo(padL + plotW, Y(v));
      ctx.stroke();
      ctx.fillStyle = dim;
      ctx.textAlign = 'right';
      ctx.fillText(this.formatOni(v, 0), padL - 6, Y(v));
    }

    // ±0.5 — the El Niño / La Niña thresholds
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = lineStrong;
    ctx.lineWidth = 1;
    for (const v of [-0.5, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(padL, Y(v));
      ctx.lineTo(padL + plotW, Y(v));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const t = this.i18n.t();
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = dim;

    // Full month names, thinned to whatever actually fits: "październik" is 11 characters,
    // so all 24 only ever fit on a very wide canvas.
    const widest = Math.max(...t.months.map(m => ctx.measureText(m).width));
    const step = this.monthStep(plotW, widest);
    for (let i = 0; i < SPAN; i += step) {
      const label = t.months[i % 12] ?? '';
      const half = ctx.measureText(label).width / 2;
      const x = X(i);
      // keep the first and last label inside the canvas instead of centring them off the edge
      if (x - half < 2) {
        ctx.textAlign = 'left';
        ctx.fillText(label, 2, Hd - 14);
      } else if (x + half > Wd - 2) {
        ctx.textAlign = 'right';
        ctx.fillText(label, Wd - 2, Hd - 14);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(label, x, Hd - 14);
      }
    }
    // year divider between the two calendar years
    ctx.strokeStyle = lineStrong;
    ctx.beginPath();
    ctx.moveTo(X(11.5), padT);
    ctx.lineTo(X(11.5), padT + plotH);
    ctx.stroke();
    ctx.fillStyle = dim;
    ctx.textAlign = 'center';
    ctx.fillText(t.cyclesYearN(1), X(5.5), Hd - 3);
    ctx.fillText(t.cyclesYearN(2), X(17.5), Hd - 3);

    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = dim;
    ctx.fillText(t.cyclesAxisOni, 0, 0);
    ctx.restore();

    const data = this.history.data();
    if (!data) return;

    const strokeTrajectory = (traj: (number | null)[], color: string, width: number, alpha: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      let drawing = false;
      for (let i = 0; i < Math.min(SPAN, traj.length); i++) {
        const v = traj[i];
        if (v === null || v === undefined) { drawing = false; continue; }
        const x = X(i);
        const y = Y(Math.max(ONI_MIN, Math.min(ONI_MAX, v)));
        if (!drawing) { ctx.moveTo(x, y); drawing = true; } else { ctx.lineTo(x, y); }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    // ── past events, analogs highlighted ──
    const analogs = this.history.analogSeasons();
    const current = data.current;
    for (const e of data.events) {
      if (current && e.season === current.season && e.ongoing) continue;
      const isAnalog = analogs.has(e.season);
      strokeTrajectory(
        e.trajectory,
        isAnalog ? cAccent : e.phase === 'nino' ? cNino : cNina,
        isAnalog ? 1.8 : 1,
        isAnalog ? 0.85 : 0.18
      );
    }

    if (!current) return;
    const seasonYear0 = Number(current.season.slice(0, 4));

    /** Fractional x position of a date on the season axis; day-of-month makes the cursor glide. */
    const axisPos = (y: number, m: number, day = 15) => {
      const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
      return (y - seasonYear0) * 12 + (m - 1) + (day - 0.5) / days - 0.5;
    };

    // ── where the dock's time slider currently sits ──
    const sliderDate = this.sliderDate();
    if (sliderDate) {
      const pos = axisPos(
        sliderDate.getUTCFullYear(),
        sliderDate.getUTCMonth() + 1,
        sliderDate.getUTCDate()
      );
      if (pos >= 0 && pos <= SPAN - 1) {
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = dim;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(X(pos), padT);
        ctx.lineTo(X(pos), padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = `600 10px ${font}`;
        ctx.fillStyle = dim;
        ctx.textAlign = pos > SPAN * 0.75 ? 'right' : 'left';
        ctx.fillText(
          this.dayLabel(sliderDate),
          X(pos) + (pos > SPAN * 0.75 ? -5 : 5),
          padT + 9
        );
      }
    }

    // ── and the level the record puts the slider's day at ──
    // This axis is ONI, so the marker has to be ONI too. The analytic ramp that used
    // to feed it is a different quantity altogether: at NOW it reads +1.29 against an
    // observed +2.93, and the line landed well below the event it was marking.
    const sliderOni = sliderDate ? this.history.oniAt(sliderDate.toISOString().slice(0, 10)) : null;
    if (sliderOni !== null && sliderOni > ONI_MIN && sliderOni < ONI_MAX) {
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = cSuper;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(padL, Y(sliderOni));
      ctx.lineTo(padL + plotW, Y(sliderOni));
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // ── forecast fan, continuing the current event on the same axis ──
    const f = data.forecast;
    if (f) {
      const idxOf = (key: string) => {
        const [y, m] = key.split('-').map(Number);
        return (y - seasonYear0) * 12 + (m - 1);
      };
      const pts = f.futureMonths
        .map((key, k) => ({ i: idxOf(key), p10: f.p10[k], p90: f.p90[k], med: f.median[k] }))
        .filter(p => p.i >= 0 && p.i < SPAN);

      if (pts.length) {
        const anchorIdx = idxOf(f.fromMonth);
        const band = [{ i: anchorIdx, p10: f.fromOni, p90: f.fromOni, med: f.fromOni }, ...pts];

        ctx.fillStyle = cSuper;
        ctx.globalAlpha = 0.14;
        ctx.beginPath();
        band.forEach((p, k) => {
          const x = X(p.i);
          const y = Y(Math.min(ONI_MAX, p.p90));
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        for (let k = band.length - 1; k >= 0; k--) {
          ctx.lineTo(X(band[k].i), Y(Math.max(ONI_MIN, band[k].p10)));
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.setLineDash([5, 3]);
        strokeTrajectory(
          Array.from({ length: SPAN }, (_, i) => band.find(p => p.i === i)?.med ?? null),
          cSuper,
          2,
          0.9
        );
        ctx.setLineDash([]);
      }
    }

    // ── the event in progress, drawn last so it sits on top ──
    strokeTrajectory(current.trajectory, cSuper, 3, 1);

    let lastIdx = -1;
    for (let i = 0; i < Math.min(SPAN, current.trajectory.length); i++) {
      if (current.trajectory[i] !== null) lastIdx = i;
    }
    const lastVal = lastIdx >= 0 ? current.trajectory[lastIdx] : null;
    if (lastIdx >= 0 && lastVal !== null) {
      ctx.fillStyle = cSuper;
      ctx.beginPath();
      ctx.arc(X(lastIdx), Y(lastVal), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── the month still in progress: weekly data, so a hollow marker on a dotted stub ──
    const prov = data.provisional;
    const provIdx = prov ? axisPos(Number(prov.month.slice(0, 4)), Number(prov.month.slice(5))) + 0.5 : -1;
    const provOnAxis = prov !== null && provIdx >= 0 && provIdx <= SPAN - 1;

    if (prov && provOnAxis) {
      const py = Y(Math.min(ONI_MAX, prov.oni));
      if (lastIdx >= 0 && lastVal !== null) {
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = cSuper;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(X(lastIdx), Y(lastVal));
        ctx.lineTo(X(provIdx), py);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = this.theme.getTokenColor('panel-bg-solid', '#ffffff');
      ctx.strokeStyle = cSuper;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X(provIdx), py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // ── one label, on whichever point is the newest ──
    const labelIdx = prov && provOnAxis ? provIdx : lastIdx;
    const labelVal = prov && provOnAxis ? prov.oni : lastVal;
    if (labelIdx >= 0 && labelVal !== null) {
      const right = labelIdx > SPAN * 0.7;
      ctx.font = `600 11px ${font}`;
      ctx.fillStyle = ink;
      ctx.textAlign = right ? 'right' : 'left';
      const dx = right ? -8 : 8;
      ctx.fillText(
        `${current.season} ${this.formatOni(labelVal, 1)} °C`,
        X(labelIdx) + dx,
        Y(Math.min(ONI_MAX, labelVal)) - 20
      );
      ctx.font = `500 10px ${font}`;
      ctx.fillStyle = dim;
      ctx.fillText(
        prov && provOnAxis ? t.cyclesProvisional(this.dayLabel(prov.lastWeek)) : this.monthLabel(current.month),
        X(labelIdx) + dx,
        Y(Math.min(ONI_MAX, labelVal)) - 8
      );
    }
  }
}
