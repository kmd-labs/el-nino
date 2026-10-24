#!/usr/bin/env node
/**
 * Builds src/assets/data/enso-history.json from the NOAA CPC monthly index files:
 *   1. detrend.nino34.ascii.txt — Niño 3.4 anomaly against a trend-adjusted climatology, 1950 → present
 *      (primary series; this is the product whose peaks match the commonly quoted ONI values)
 *   2. sstoi.indices — all four Niño regions (1+2, 3, 4, 3.4), 1982 → present
 *      (regional detail, and the most recent months, because detrend lags a few months behind)
 *
 * Emits the monthly ONI-equivalent series, a catalogue of past El Niño / La Niña events with
 * explicit tiers, and an analog-ensemble forecast for the event in progress.
 *
 * Never fails the build: on a network error the committed asset is kept.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(DIR, '../src/assets/data/enso-history.json');

const URL_DETREND = 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/detrend.nino34.ascii.txt';
const URL_SSTOI = 'https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices';
const URL_WEEKLY = 'https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for';

/** Peak ONI thresholds. `super` and `nino` mirror EnsoMathService.category(). */
const TIERS = { super: 2.0, strong: 1.5, moderate: 1.0, weak: 0.5 };

/** Analog ensemble settings. */
const WINDOW = 12;  // months of the current trajectory that must match
const HORIZON = 12; // months projected forward
const K = 5;        // ensemble members kept

const round1 = v => Math.round(v * 10) / 10;
const round2 = v => Math.round(v * 100) / 100;

const monthKey = (y, m) => `${y}-${String(m).padStart(2, '0')}`;

async function fetchText(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw new Error(`${url}: ${err.message}`);
      await new Promise(r => setTimeout(r, 700 * attempt));
    }
  }
}

/** ` YR MON TOTAL ClimAdjust ANOM` → [{ y, m, anom }] */
function parseDetrend(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const f = line.trim().split(/\s+/);
    if (f.length < 5) continue;
    const y = Number(f[0]);
    const m = Number(f[1]);
    const anom = Number(f[4]);
    if (!Number.isInteger(y) || y < 1900 || !Number.isInteger(m) || m < 1 || m > 12) continue;
    if (!Number.isFinite(anom)) continue;
    out.push({ y, m, anom });
  }
  return out;
}

/** `YR MON NINO1+2 ANOM NINO3 ANOM NINO4 ANOM NINO3.4 ANOM` → [{ y, m, a12, a3, a4, a34 }] */
function parseSstoi(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const f = line.trim().split(/\s+/);
    if (f.length < 10) continue;
    const y = Number(f[0]);
    const m = Number(f[1]);
    if (!Number.isInteger(y) || y < 1900 || !Number.isInteger(m) || m < 1 || m > 12) continue;
    const vals = f.slice(2, 10).map(Number);
    if (vals.some(v => !Number.isFinite(v))) continue;
    out.push({ y, m, a12: vals[1], a3: vals[3], a4: vals[5], a34: vals[7] });
  }
  return out;
}

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * ` 14OCT2026     26.2 5.2     29.2 4.2     30.0 3.3     29.7 1.1` → [{ y, m, d, a34 }]
 *
 * The columns are fixed-width, so a negative anomaly runs into the SST before it (`20.6-0.1`).
 * Pulling the signed numbers out with a regex handles both spellings.
 */
function parseWeekly(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const head = /^\s*(\d{1,2})([A-Z]{3})(\d{4})\s+(.*)$/.exec(line);
    if (!head) continue;
    const m = MONTH_ABBR.indexOf(head[2]) + 1;
    if (m === 0) continue;
    const nums = head[4].match(/-?\d+\.\d+/g);
    if (!nums || nums.length < 6) continue;
    out.push({ y: Number(head[3]), m, d: Number(head[1]), a34: Number(nums[5]) });
  }
  return out;
}

/**
 * The weekly product uses a different climatology base than the monthly series, so the current
 * partial month is bias-corrected against the overlapping complete months before being reported.
 * The result is explicitly provisional: it is kept out of `index`, which stays whole months only.
 */
function buildProvisional(months, weekly) {
  if (!weekly.length) return null;

  const byMonth = new Map();
  for (const w of weekly) {
    const key = monthKey(w.y, w.m);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(w);
  }

  const monthlyByKey = new Map(months.map(d => [d.key, d]));
  const diffs = [];
  for (const [key, weeks] of byMonth) {
    const monthly = monthlyByKey.get(key);
    if (!monthly) continue;
    const mean = weeks.reduce((a, w) => a + w.a34, 0) / weeks.length;
    diffs.push({ key, diff: monthly.anom - mean });
  }
  if (diffs.length < 12) return null;
  const offset = round2(median(diffs.slice(-24).map(d => d.diff)));

  const last = months[months.length - 1];
  const lastIdx = last.y * 12 + last.m;
  const partial = [...byMonth.entries()]
    .map(([key, weeks]) => ({ key, weeks, idx: Number(key.slice(0, 4)) * 12 + Number(key.slice(5)) }))
    .filter(e => e.idx > lastIdx)
    .sort((a, b) => a.idx - b.idx)[0];
  if (!partial) return null;

  const anom = round2(partial.weeks.reduce((a, w) => a + w.a34, 0) / partial.weeks.length + offset);
  const prev = months.slice(-2).map(d => d.anom);
  const lastWeek = partial.weeks[partial.weeks.length - 1];

  return {
    month: partial.key,
    anom,
    oni: round2((prev[0] + prev[1] + anom) / 3),
    weeks: partial.weeks.length,
    lastWeek: `${lastWeek.y}-${String(lastWeek.m).padStart(2, '0')}-${String(lastWeek.d).padStart(2, '0')}`,
    weeklyAnom: lastWeek.a34,
    offset
  };
}

const median = arr => {
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.floor(s.length / 2);
  return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2;
};

/**
 * The two CPC products use different climatology base periods, so their anomalies differ by a
 * near-constant offset. Splice the newer sstoi months onto the detrend series, bias-corrected by
 * the median difference over the overlapping tail, and report the correction so it stays auditable.
 */
function spliceSeries(detrend, sstoi) {
  const months = detrend.map(d => ({ key: monthKey(d.y, d.m), y: d.y, m: d.m, anom: d.anom }));
  const byKey = new Map(months.map(d => [d.key, d]));
  const lastDetrend = months[months.length - 1];

  const diffs = [];
  for (const s of sstoi.slice(-24)) {
    const d = byKey.get(monthKey(s.y, s.m));
    if (d) diffs.push(d.anom - s.a34);
  }
  const offset = diffs.length >= 6 ? round2(median(diffs)) : 0;

  const appended = [];
  for (const s of sstoi) {
    const key = monthKey(s.y, s.m);
    if (byKey.has(key)) continue;
    if (s.y * 12 + s.m <= lastDetrend.y * 12 + lastDetrend.m) continue;
    appended.push({ key, y: s.y, m: s.m, anom: round2(s.a34 + offset) });
  }
  appended.sort((a, b) => (a.y * 12 + a.m) - (b.y * 12 + b.m));

  return {
    months: [...months, ...appended],
    offset,
    spliceFrom: appended.length ? appended[0].key : null,
    spliceCount: appended.length
  };
}

/** 3-month centred-trailing running mean, the convention the ONI uses. */
function oniSeries(months) {
  return months.map((_, i) =>
    i < 2 ? null : round2((months[i - 2].anom + months[i - 1].anom + months[i].anom) / 3)
  );
}

/**
 * Tier from the peak magnitude. `super` is reserved for El Niño: there is no established
 * "super La Niña" category, so cold events top out at `strong`.
 */
function tierOf(peak, phase) {
  const a = Math.abs(peak);
  if (a >= TIERS.super && phase === 'nino') return 'super';
  if (a >= TIERS.strong) return 'strong';
  if (a >= TIERS.moderate) return 'moderate';
  return 'weak';
}

/**
 * An event is a maximal run of months whose ONI stays at or beyond ±0.5. Its season label comes
 * from the peak month: a peak in Jan–Jun belongs to the season that started the previous year.
 */
function detectEvents(months, oni) {
  const events = [];
  let run = null;

  const close = () => {
    if (!run) return;
    if (run.len >= 5) {
      const peakIdx = run.peakIdx;
      const peakMonth = months[peakIdx];
      const year0 = peakMonth.m <= 6 ? peakMonth.y - 1 : peakMonth.y;
      const phase = run.sign > 0 ? 'nino' : 'nina';
      events.push({
        season: `${year0}/${String((year0 + 1) % 100).padStart(2, '0')}`,
        phase,
        tier: tierOf(run.peak, phase),
        peakOni: run.peak,
        peakMonth: peakMonth.key,
        startMonth: months[run.start].key,
        endMonth: months[run.end].key,
        durationMonths: run.len,
        // The series ends mid-event: its peak and duration are provisional.
        ongoing: run.end === oni.length - 1,
        year0
      });
    }
    run = null;
  };

  for (let i = 0; i < oni.length; i++) {
    const v = oni[i];
    if (v === null || Math.abs(v) < TIERS.weak) { close(); continue; }
    const sign = v > 0 ? 1 : -1;
    if (run && run.sign !== sign) close();
    if (!run) run = { sign, start: i, end: i, len: 0, peak: v, peakIdx: i };
    run.end = i;
    run.len++;
    if (Math.abs(v) > Math.abs(run.peak)) { run.peak = v; run.peakIdx = i; }
  }
  close();
  return events;
}

/** 24 monthly ONI values covering Jan of year0 → Dec of year0+1, the usual event-overlay window. */
function trajectoryFor(year0, months, oni) {
  const idx = new Map(months.map((d, i) => [d.key, i]));
  const traj = [];
  for (let k = 0; k < 24; k++) {
    const y = year0 + Math.floor(k / 12);
    const m = (k % 12) + 1;
    const i = idx.get(monthKey(y, m));
    traj.push(i === undefined ? null : oni[i]);
  }
  return traj;
}

/**
 * Analog ensemble: find the past windows whose last WINDOW months of ONI best match the current
 * trajectory, then carry their following HORIZON months forward as forecast members.
 */
function buildForecast(months, oni, events) {
  const n = months.length;
  const last = n - 1;
  const current = oni.slice(last - WINDOW + 1, last + 1);
  if (current.some(v => v === null)) return null;

  const candidates = [];
  for (let t = WINDOW - 1; t <= n - 1 - HORIZON; t++) {
    // Keep analogs clear of the event in progress so it cannot match itself.
    if (last - t < 24) continue;
    const win = oni.slice(t - WINDOW + 1, t + 1);
    const fut = oni.slice(t + 1, t + 1 + HORIZON);
    if (win.some(v => v === null) || fut.some(v => v === null)) continue;
    let se = 0;
    for (let k = 0; k < WINDOW; k++) se += (win[k] - current[k]) ** 2;
    candidates.push({ t, rmse: Math.sqrt(se / WINDOW), fut });
  }
  if (candidates.length < K) return null;

  candidates.sort((a, b) => a.rmse - b.rmse);

  // Keep the best match per season so the ensemble is not five overlapping windows of one event.
  const picked = [];
  const usedSeasons = new Set();
  for (const c of candidates) {
    const cm = months[c.t];
    const year0 = cm.m <= 6 ? cm.y - 1 : cm.y;
    const season = events.find(e => e.year0 === year0 && e.phase === 'nino')?.season ?? `${year0}/${String((year0 + 1) % 100).padStart(2, '0')}`;
    if (usedSeasons.has(season)) continue;
    usedSeasons.add(season);
    picked.push({ ...c, season, endMonth: cm.key });
    if (picked.length === K) break;
  }

  const weights = picked.map(p => 1 / (p.rmse + 0.1));
  const wSum = weights.reduce((a, b) => a + b, 0);

  const lastMonth = months[last];
  const futureMonths = [];
  for (let k = 0; k < HORIZON; k++) {
    const t = lastMonth.y * 12 + (lastMonth.m - 1) + 1 + k;
    futureMonths.push(monthKey(Math.floor(t / 12), (t % 12) + 1));
  }

  // The season peak is the Oct–Dec mean; fall back to the window maximum if OND is already past.
  const ondIdx = futureMonths
    .map((key, i) => ({ i, m: Number(key.slice(5)) }))
    .filter(x => x.m >= 10 && x.m <= 12)
    .map(x => x.i);

  // Anchor each member to the current level: carry forward its month-to-month evolution, not its
  // own absolute level, so a weaker analog cannot imply an impossible jump at the splice point.
  const members = picked.map((p, i) => {
    const anchor = round2(current[WINDOW - 1] - oni[p.t]);
    const future = p.fut.map(v => round2(v + anchor));
    return {
      season: p.season,
      endMonth: p.endMonth,
      rmse: round2(p.rmse),
      weight: round2(weights[i] / wSum),
      anchor,
      future,
      peakMean: round2(ondIdx.length
        ? ondIdx.reduce((a, i2) => a + future[i2], 0) / ondIdx.length
        : Math.max(...future)),
      peakMax: round2(Math.max(...future))
    };
  });

  const quantile = (vals, w, q) => {
    const pairs = vals.map((v, i) => ({ v, w: w[i] })).sort((a, b) => a.v - b.v);
    const total = pairs.reduce((a, b) => a + b.w, 0);
    let acc = 0;
    for (const p of pairs) {
      acc += p.w;
      if (acc >= q * total) return round2(p.v);
    }
    return round2(pairs[pairs.length - 1].v);
  };

  const w = members.map(m => m.weight);
  const band = { median: [], p10: [], p90: [] };
  for (let k = 0; k < HORIZON; k++) {
    const col = members.map(m => m.future[k]);
    band.median.push(quantile(col, w, 0.5));
    band.p10.push(quantile(col, w, 0.1));
    band.p90.push(quantile(col, w, 0.9));
  }

  return {
    method: 'analog-ensemble, members anchored to the current level',
    windowMonths: WINDOW,
    horizonMonths: HORIZON,
    members: K,
    fromMonth: lastMonth.key,
    fromOni: current[WINDOW - 1],
    futureMonths,
    peakWindow: ondIdx.map(i => futureMonths[i]),
    analogs: members,
    ...band
  };
}

async function main() {
  let detrendText;
  let sstoiText;
  let weeklyText;
  try {
    console.log('Fetching NOAA CPC Niño 3.4 index files...');
    [detrendText, sstoiText, weeklyText] = await Promise.all([
      fetchText(URL_DETREND),
      fetchText(URL_SSTOI),
      fetchText(URL_WEEKLY)
    ]);
  } catch (err) {
    console.warn(`CPC fetch failed, keeping the committed asset: ${err.message}`);
    return;
  }

  const detrend = parseDetrend(detrendText);
  const sstoi = parseSstoi(sstoiText);
  if (detrend.length < 600 || sstoi.length < 300) {
    console.warn(`Parsed too few rows (detrend ${detrend.length}, sstoi ${sstoi.length}); keeping the committed asset.`);
    return;
  }

  const { months, offset, spliceFrom, spliceCount } = spliceSeries(detrend, sstoi);
  const oni = oniSeries(months);
  console.log(`Series: ${months[0].key} → ${months[months.length - 1].key} (${months.length} months), `
    + `spliced ${spliceCount} month(s) from sstoi with offset ${offset >= 0 ? '+' : ''}${offset} °C`);

  const provisional = buildProvisional(months, parseWeekly(weeklyText));
  if (provisional) {
    console.log(`Provisional ${provisional.month}: ONI ${provisional.oni >= 0 ? '+' : ''}${provisional.oni} `
      + `from ${provisional.weeks} week(s) to ${provisional.lastWeek} `
      + `(weekly anomaly ${provisional.weeklyAnom}, base correction ${provisional.offset >= 0 ? '+' : ''}${provisional.offset})`);
  } else {
    console.log('No partial month beyond the monthly series.');
  }

  const events = detectEvents(months, oni);
  const nino = events.filter(e => e.phase === 'nino');
  console.log(`Events: ${nino.length} El Niño (${nino.filter(e => e.tier === 'super').length} super), `
    + `${events.length - nino.length} La Niña`);

  const current = events[events.length - 1];
  const forecast = buildForecast(months, oni, events);
  if (forecast) {
    console.log(`Analogs: ${forecast.analogs.map(a => `${a.season} (rmse ${a.rmse})`).join(', ')}`);
  } else {
    console.warn('Not enough data for an analog forecast.');
  }

  const sstoiByKey = new Map(sstoi.map(s => [monthKey(s.y, s.m), s]));

  const out = {
    schema: 1,
    fetchedAt: new Date().toISOString(),
    sources: [
      {
        id: 'cpc-detrend-nino34',
        title: 'NOAA CPC — Niño 3.4 against a trend-adjusted climatology, monthly from 1950',
        url: URL_DETREND
      },
      {
        id: 'cpc-sstoi',
        title: 'NOAA CPC — Niño 1+2 / 3 / 4 / 3.4 sea surface temperature and anomalies, monthly from 1982',
        url: URL_SSTOI
      },
      {
        id: 'cpc-weekly',
        title: 'NOAA CPC — weekly Niño region sea surface temperature and anomalies (1991–2020 base), from 1981',
        url: URL_WEEKLY
      }
    ],
    tiers: TIERS,
    index: {
      product: 'cpc-detrend-nino34 spliced with cpc-sstoi for the most recent months',
      firstMonth: months[0].key,
      lastMonth: months[months.length - 1].key,
      spliceFrom,
      spliceOffset: offset,
      anom: months.map(d => round2(d.anom)),
      oni
    },
    /** The month in progress, from the weekly product — incomplete, so never folded into `index`. */
    provisional,
    regions: {
      firstMonth: monthKey(sstoi[0].y, sstoi[0].m),
      lastMonth: monthKey(sstoi[sstoi.length - 1].y, sstoi[sstoi.length - 1].m),
      nino12: sstoi.map(s => round1(s.a12)),
      nino3: sstoi.map(s => round1(s.a3)),
      nino4: sstoi.map(s => round1(s.a4)),
      nino34: sstoi.map(s => round1(s.a34))
    },
    events: events.map(e => ({
      season: e.season,
      phase: e.phase,
      tier: e.tier,
      peakOni: e.peakOni,
      peakMonth: e.peakMonth,
      peakNino12: sstoiByKey.has(e.peakMonth) ? round1(sstoiByKey.get(e.peakMonth).a12) : null,
      startMonth: e.startMonth,
      endMonth: e.endMonth,
      durationMonths: e.durationMonths,
      ongoing: e.ongoing,
      trajectory: trajectoryFor(e.year0, months, oni)
    })),
    current: current
      ? {
          season: current.season,
          phase: current.phase,
          tier: current.tier,
          oniNow: oni[oni.length - 1],
          month: months[months.length - 1].key,
          peakSoFar: current.peakOni,
          peakMonthSoFar: current.peakMonth,
          trajectory: trajectoryFor(current.year0, months, oni)
        }
      : null,
    forecast
  };

  const json = JSON.stringify(out, null, 2) + '\n';
  await writeFile(OUT, json);
  console.log(`Wrote ${OUT}: ${(json.length / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.warn('fetch-enso-history failed, keeping the committed asset:', err.message);
});
