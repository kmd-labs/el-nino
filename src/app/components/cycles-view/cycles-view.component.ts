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
import { LucideAngularModule, ExternalLink, Table } from 'lucide-angular';
import { ThemeService } from '@kmd/design-system/services/theme.service';
import { BadgeComponent } from '@kmd/design-system/ui/badge/badge.component';
import { ButtonComponent } from '@kmd/design-system/ui/button/button.component';
import { TooltipDirective } from '@kmd/design-system/ui/tooltip/tooltip.directive';
import { PopupService } from '@kmd/design-system/ui/popup/popup.service';
import { TemplateRef } from '@angular/core';
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
  imports: [CommonModule, BadgeComponent, ButtonComponent, LucideAngularModule],
  templateUrl: './cycles-view.component.html',
  styleUrl: './cycles-view.component.scss'
})
export class CyclesViewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('box') boxRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cv') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('detailsTpl') detailsTpl!: TemplateRef<unknown>;

  state = inject(EnsoStateService);
  i18n = inject(I18nService);
  history = inject(EnsoHistoryService);
  private theme = inject(ThemeService);
  private weather = inject(CurrentWeatherService);
  private popup = inject(PopupService);

  readonly externalLinkIcon = ExternalLink;
  readonly tableIcon = Table;

  openDetails() {
    this.popup.open({
      id: 'cycles-details',
      title: computed(() => this.i18n.t().cyclesDetails),
      subtitle: computed(() => this.i18n.t().cyclesDetailsTitle),
      template: this.detailsTpl,
      size: 'lg',
      actions: [
        {
          label: computed(() => this.i18n.t().close),
          variant: 'default'
        }
      ]
    });
  }

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

    const padL = 44;
    const padR = 16;
    const padT = 16;
    const padB = 36;
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
    const textY = padT + plotH + 13;
    for (let i = 0; i < SPAN; i += step) {
      const label = t.months[i % 12] ?? '';
      const half = ctx.measureText(label).width / 2;
      const x = X(i);
      // keep the first and last label inside the canvas instead of centring them off the edge
      if (x - half < padL + 2) {
        ctx.textAlign = 'left';
        ctx.fillText(label, padL + 2, textY);
      } else if (x + half > Wd - padR - 2) {
        ctx.textAlign = 'right';
        ctx.fillText(label, Wd - padR - 2, textY);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(label, x, textY);
      }
    }

    // year divider between the two calendar years
    ctx.strokeStyle = lineStrong;
    ctx.beginPath();
    ctx.moveTo(X(11.5), padT);
    ctx.lineTo(X(11.5), padT + plotH);
    ctx.stroke();

    const drawYearBadge = (text: string, cx: number) => {
      ctx.font = `600 10px ${font}`;
      const tw = ctx.measureText(text).width;
      const bw = tw + 14;
      const bh = 16;
      const bx = cx - bw / 2;
      const by = padT + plotH + 20;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fillStyle = this.theme.getTokenColor('panel-bg', 'rgba(255,255,255,0.7)');
      ctx.fill();
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = dim;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cx, by + bh / 2);
      ctx.restore();
    };

    drawYearBadge(t.cyclesYearN(1), (X(0) + X(11.5)) / 2);
    drawYearBadge(t.cyclesYearN(2), (X(11.5) + X(23)) / 2);

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

    // ── the month still in progress: weekly data, so a hollow marker on a dotted stub ──
    const prov = data.provisional;
    const provIdx = prov ? axisPos(Number(prov.month.slice(0, 4)), Number(prov.month.slice(5))) + 0.5 : -1;
    const provOnAxis = prov !== null && provIdx >= 0 && provIdx <= SPAN - 1;

    let lastIdx = -1;
    for (let i = 0; i < Math.min(SPAN, current.trajectory.length); i++) {
      if (current.trajectory[i] !== null) lastIdx = i;
    }
    const lastVal = lastIdx >= 0 ? current.trajectory[lastIdx] : null;

    const labelIdx = prov && provOnAxis ? provIdx : lastIdx;
    const labelVal = prov && provOnAxis ? prov.oni : lastVal;

    // ── where the dock's time slider currently sits ──
    let sliderRect: { x: number; y: number; w: number; h: number; lineX: number } | null = null;
    const sliderDate = this.sliderDate();
    if (sliderDate) {
      const pos = axisPos(
        sliderDate.getUTCFullYear(),
        sliderDate.getUTCMonth() + 1,
        sliderDate.getUTCDate()
      );
      if (pos >= 0 && pos <= SPAN - 1) {
        const lineX = X(pos);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = dim;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(lineX, padT);
        ctx.lineTo(lineX, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        const dateStr = this.dayLabel(sliderDate);
        ctx.font = `600 10px ${font}`;
        const dtw = ctx.measureText(dateStr).width;
        const dbw = dtw + 12;
        const dbh = 18;
        let dbx = pos > SPAN * 0.75 ? lineX - dbw - 4 : lineX + 4;
        dbx = Math.max(padL + 2, Math.min(Wd - padR - dbw - 2, dbx));
        const dby = padT + 4;

        sliderRect = { x: dbx, y: dby, w: dbw, h: dbh, lineX };

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(dbx, dby, dbw, dbh, 4);
        ctx.fillStyle = this.theme.getTokenColor('panel-bg-solid', '#ffffff');
        ctx.fill();
        ctx.strokeStyle = lineStrong;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = dim;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dateStr, dbx + dbw / 2, dby + dbh / 2);
        ctx.restore();
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

    if (lastIdx >= 0 && lastVal !== null) {
      ctx.fillStyle = cSuper;
      ctx.beginPath();
      ctx.arc(X(lastIdx), Y(lastVal), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── the month still in progress: weekly data, so a hollow marker on a dotted stub ──
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

    // ── one label card, on whichever point is the newest ──
    if (labelIdx >= 0 && labelVal !== null) {
      const line1 = `${current.season} ${this.formatOni(labelVal, 1)} °C`;
      const line2 = prov && provOnAxis ? t.cyclesProvisional(this.dayLabel(prov.lastWeek)) : this.monthLabel(current.month);

      ctx.font = `600 11px ${font}`;
      const w1 = ctx.measureText(line1).width;
      ctx.font = `500 10px ${font}`;
      const w2 = ctx.measureText(line2).width;

      const padX = 10;
      const padY = 6;
      const cardW = Math.max(w1 + 14, w2) + padX * 2;
      const cardH = 34;

      const ptX = X(labelIdx);
      const ptY = Y(Math.min(ONI_MAX, labelVal));

      const preferLeft = labelIdx > SPAN * 0.65;
      let cardX = preferLeft ? ptX - cardW - 10 : ptX + 10;
      cardX = Math.max(padL + 6, Math.min(Wd - padR - cardW - 6, cardX));

      let cardY = ptY - cardH / 2;
      cardY = Math.max(padT + 4, Math.min(padT + plotH - cardH - 4, cardY));

      // Avoid overlapping with the slider date pill
      let isDisplaced = false;
      if (sliderRect) {
        const pad = 8;
        const overlapsX =
          (cardX - pad < sliderRect.x + sliderRect.w && cardX + cardW + pad > sliderRect.x) ||
          (sliderRect.lineX >= cardX - pad && sliderRect.lineX <= cardX + cardW + pad);
        const overlapsY = cardY - pad < sliderRect.y + sliderRect.h && cardY + cardH + pad > sliderRect.y;

        if (overlapsX && overlapsY) {
          // 1. Try placing the card on the opposite horizontal side of ptX if it fits cleanly
          const altSideX = preferLeft ? ptX + 10 : ptX - cardW - 10;
          const fitsAltSide = altSideX >= padL + 6 && altSideX + cardW <= Wd - padR - 6;
          const altOverlapsX =
            (altSideX - pad < sliderRect.x + sliderRect.w && altSideX + cardW + pad > sliderRect.x) ||
            (sliderRect.lineX >= altSideX - pad && sliderRect.lineX <= altSideX + cardW + pad);

          if (fitsAltSide && !altOverlapsX) {
            cardX = altSideX;
            isDisplaced = true;
          } else {
            // 2. Shift the card vertically below the slider pill
            const belowY = Math.max(ptY + 14, sliderRect.y + sliderRect.h + 8);
            if (belowY + cardH <= padT + plotH - 4) {
              cardY = belowY;
              isDisplaced = true;
            } else {
              // 3. If near the bottom edge, shift above
              const aboveY = Math.min(ptY - cardH - 12, sliderRect.y - cardH - 8);
              if (aboveY >= padT + 4) {
                cardY = aboveY;
                isDisplaced = true;
              }
            }
          }
        }
      }

      // If the card was moved away from the target point, draw a subtle leader connector
      if (isDisplaced) {
        ctx.save();
        ctx.strokeStyle = cSuper;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        const edgeX = ptX < cardX ? cardX : ptX > cardX + cardW ? cardX + cardW : ptX;
        const edgeY = ptY < cardY ? cardY : ptY > cardY + cardH ? cardY + cardH : ptY;
        ctx.moveTo(edgeX, edgeY);
        ctx.lineTo(ptX, ptY);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 6);
      ctx.fillStyle = this.theme.getTokenColor('panel-bg-solid', '#ffffff');
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = this.theme.getTokenColor('line-strong', 'rgba(15,23,42,0.18)');
      ctx.lineWidth = 1;
      ctx.stroke();

      // Semantic colored dot for the active phase
      ctx.beginPath();
      ctx.arc(cardX + padX + 3, cardY + padY + 6, 3, 0, Math.PI * 2);
      ctx.fillStyle = cSuper;
      ctx.fill();

      ctx.font = `600 11px ${font}`;
      ctx.fillStyle = ink;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(line1, cardX + padX + 11, cardY + padY + 9);

      ctx.font = `500 10px ${font}`;
      ctx.fillStyle = dim;
      ctx.fillText(line2, cardX + padX, cardY + padY + 22);
      ctx.restore();
    }
  }
}
