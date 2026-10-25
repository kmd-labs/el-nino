# Implementation Plan — Sync with `main`, Issue #67 (Timeline & Dock Simplification), Cloud Sync & Full-Res SST Startup

## Overview

This plan updates our current work on `mobile-ux-improvements` (GitHub Issues **#54** and **#66**) to:
1. **Rebase/Merge Marcin's latest commits from `origin/main`** (`6e7f06a` and `c21c545`) while preserving our mobile landscape split-screen layout (#66) and simplified Walker Cell / Previous Cycles UI (#54).
2. **Fix Walker Cell vs. 3D Globe Cloud Position Discrepancy:** Drive both the 3D Globe's convective cloud cluster (`GlobeComponent`) and the Walker Cell cross-section (`WalkerViewComponent`) from the same observed Niño 3.4 physical amplitude (`sceneS` / `sForNino34`), removing the `Math.max(128, ...)` mismatch so clouds appear at the exact same longitude in both views.
3. **Timeline Range & Dock Simplification (Issue #67):**
   - Remove the synthetic post-`Latest` forecast tail on the timeline slider so the slider spans the actual captured dataset (`s = -1.8` to `s = 1.4`).
   - Keep Marcin's observed `--phase-ticks` crossings on `<app-timeline-slider>`, scaled to the `[-1.8, 1.4]` observed domain.
   - Move the **Anomaly Phase Type** (`La Niña`, `Neutral`, `El Niño`, `Super El Niño`) into the **top bar of the timeline dock on the left** (inside `.dock__header-group`, opposite Legend & Glossary), lit and colored by the observed phase (`state.phase()` / `state.category()`).
   - Remove `Latest` (`NOW`) as a separate timeline button/marker/date above the slider rail; instead, display only the existing `Latest` lozenge (`.dock__status-pill--live`) in the top bar whenever the slider is at the latest captured data (`isNow()`).
4. **Delete Low-Res Temperature Data (`timeline-sst-low.bin.gz`):**
   - Delete `src/assets/data/timeline-sst-low.bin.gz` and remove all low-res delta decoding/rendering logic so the app starts directly with full-quality 0.5° (`720×360`) water temperature data.

---

## 1. Sync with `origin/main` (`6e7f06a` & `c21c545`)

Marcin pushed two commits to `origin/main`:
- **`6e7f06a` (`fix(walker): drive the cross-section off the observed index, not the ramp`):**
  - Adds `EnsoMathService.sForNino34(v: number): number` (`clamp(v / 0.918, -2, 3)`).
  - Adds `CurrentWeatherService.nino34AnomSmoothedAt(s: number, days = 30): number | null`.
  - Updates `WalkerViewComponent` to compute `sceneS()` from the smoothed observed Niño 3.4 index when `step() < 0` (outside the guided walkthrough).
- **`c21c545` (`feat(dock): lift every pill above the timeline and light them by anomaly`):**
  - Adds `phaseTicks` (`--phase-ticks` CSS gradient on `<app-timeline-slider>`) marking every `±0.5 °C` phase threshold crossing along the observed record.
  - Lights the active phase based on `this.state.phase()` (observed anomaly category) rather than raw slider position.

### How We Apply Marcin's Changes to Ours
- We will merge/incorporate `EnsoMathService.sForNino34` and `CurrentWeatherService.nino34AnomSmoothedAt` cleanly.
- In `WalkerViewComponent`, we preserve our simplified single-bar layout and info tooltip from `#54` while using `sceneS()` inside `draw()`.
- In `MapDockComponent`, we preserve Marcin's `--phase-ticks` rail markings and observed-phase coloring, and adapt the dock layout to the new top-bar design and shortened timeline range (`#67`) across desktop, tablet, mobile, and `mobile-landscape` (`#66`).

---

## 2. Fix Cloud Position Discrepancy Between Walker Cell & 3D Globe

### Root Cause
1. **Amplitude Mismatch (`sceneS` vs. raw `sCur`):**
   - On the timeline, `sCur` (`-1.8` to `1.4`) is a **linear calendar time axis**, not physical ENSO strength.
   - After Marcin's `6e7f06a`, `WalkerViewComponent` converts `sCur` into physical amplitude `sceneS = math.sForNino34(weather.nino34AnomSmoothedAt(sCur))` (when `step() < 0`), whereas `GlobeComponent.updateAtm(s)` and `GlobeComponent.updateLabels(s)` still pass the raw calendar slider value `s = state.sCur()` into `math.convLon(s)`.
   - For example, in Jan 2026 (`s = 0.11`), the ocean is in La Niña (`-0.8 °C`, physical `s = -0.87`), placing Walker clouds over Indonesia (`~135°E`) while the Globe places clouds near `151°E`. At `Latest` (`s = 1.4`, `+3.5 °C`), physical `s = 3.0` places Walker clouds at `197°E` while the Globe places them at `171°E`.
   - Furthermore, when stepping through the Walker Cell walkthrough (`step() >= 0`), `WalkerViewComponent.go(i)` sets `sTarget = STEPS[i].s`; if the user switches back to the Globe or plays the walkthrough, both views should agree.
2. **Clamping Mismatch (`Math.max(128, ...)`):**
   - `WalkerViewComponent.draw()` clamped `xc = Math.max(128, this.math.convLon(s))` while `GlobeComponent` used `xc = this.math.convLon(s)` unclamped (`120.2°E` at `s = -1.8`).

### Planned Fix
- **[MODIFY] `src/app/core/services/enso-state.service.ts`**
  - Add a reactive `sceneS = computed<number>(...)` that returns:
    - If `weather.nino34AnomSmoothedAt(s)` is available, `math.sForNino34(observed)`.
    - Otherwise, fallback to `s`.
- **[MODIFY] `src/app/components/globe/globe.component.ts`**
  - In `animate()`, keep `recolorTexture(s)` and `currentLayer.update(dt, s)` driven by calendar `s = this.state.sCur()` (since SST and wind frames are indexed by calendar keyframe `s`), and pass physical amplitude `physS = this.state.sceneS()` to `updateAtm(physS, dt, t)` and `updateLabels(physS)`.
- **[MODIFY] `src/app/components/walker-view/walker-view.component.ts`**
  - Use `const s = this.step() >= 0 ? STEPS[this.step()].s : this.state.sceneS();`
  - Remove the artificial `Math.max(128, ...)` floor in `const xc = this.math.convLon(s);` so convective clouds align to the exact degree of longitude in both views.

---

## 3. Timeline & Dock Changes (GitHub Issue #67 + User Refinements)

### 3.1 Shorten Timeline — Remove Synthetic Forecast Tail (Issue #67)
- Currently, observed weekly NOAA OISST data spans `s = -1.8` (`2024-11-06`) to `s = 1.4` (`2026-10-21`, `now: true`), while a synthetic forecast keyframe sits at `s = 2.6` (`2026-12-16`) and the slider ranges from `min="-2"` to `max="3"` (leaving 32% of the slider width past `Latest` for a synthetic forecast we don't have).
- **Changes:**
  - **[MODIFY] `src/app/components/map-dock/map-dock.component.html`** & **`src/app/components/map-dock/map-dock.component.ts`**:
    - Change slider domain constants to match the observed record: `SLIDER_MIN = -1.8`, `SLIDER_MAX = 1.4` (`[min]="-1.8"`, `[max]="1.4"`).
    - Compute `phaseTicks()` across `SLIDER_MIN = -1.8` to `SLIDER_MAX = 1.4` so the `±0.5 °C` phase transition ticks map across 100% of the slider rail.
    - Remove the forecast status pill (`dock__status-pill--forecast`) and `isForecast` handling from `MapDockComponent`.
  - **[MODIFY] `src/app/core/services/enso-state.service.ts`**:
    - Clamp `setStrengthTarget(val)` to `[-1.8, 1.4]`.
  - **[MODIFY] `scripts/fetch-current-weather.mjs`** & **`src/assets/data/timeline-meta.json`**:
    - Stop appending the synthetic `+56 days` forecast frame in `fetch-current-weather.mjs`, and remove the synthetic `forecast` entry (`index: 103`, `s: 2.6`) from `timeline-meta.json` (keeping all 103 real observed keyframes `0..102` from `s = -1.8` to `s = 1.4`).

### 3.2 Move Anomaly Type to Top Bar (Left) & Use Lozenge Only for `Latest`
- **No Separate `Latest` Timeline Marker/Pill:**
  - Remove `nowPill()`, `timelineMarkers()`, and `dateMarkers()` from `MapDockComponent` and `<app-timeline-slider>`.
  - Whenever the timeline is at the latest captured data (`isNow()`, i.e. at the right end of the slider `s ≈ 1.4`), the existing green **`Latest` lozenge** (`.dock__status-pill--live`) in the top bar (`.dock__header-group`) is displayed.
- **Anomaly Type (`La Niña`, `Neutral`, `El Niño`, `Super El Niño`) in the Top Bar on the Left:**
  - In `.dock__row--readout` (the top bar of the timeline dock, on the left side inside `.dock__header-group`, opposite `<app-legend-panel>` on the right):
    - Display the current anomaly phase pill/badge (`{{ state.category().name }}` — `La Niña`, `Neutral`, `El Niño`, or `Super El Niño`) styled with the phase's semantic accent and tint colors (`nina`, `neutral`, `nino`, `super`), right next to the `Anomaly` delta readout (`+3.5 °C`), the date lozenge (`10/21/2026`), and the `NOAA` link.
    - Eliminate the extra `.dock__row--phases` middle row and `.dock__timeline-dates` strip so the dock consists of two clean, compact rows:
      1. **Row 1 (`.dock__row--readout`):**
         - **Left (`.dock__header-group`):** `[Latest lozenge (when at latest)]` + `[Phase Badge: La Niña / Neutral / El Niño / Super El Niño]` + `[Anomaly +3.5 °C]` + `[Date 10/21/2026]` + `[NOAA]`
         - **Right:** `<app-legend-panel>` (`Water temp` color bar + `Glossary` button)
      2. **Row 2 (`.dock__row--enso`):**
         - Full-width `<app-timeline-slider>` (from `-1.8` to `1.4` with `--phase-ticks` markings) + playback speed dropdown (`1x`) + Play/Pause button.

> **Quick Confirmation on Top-Bar Anomaly Phase UI:**
> The plan above places a **single dynamic phase lozenge/badge** (`La Niña` / `Neutral` / `El Niño` / `Super El Niño`, colored by the current anomaly phase) in the top-left bar next to the `Anomaly` readout, removing the 4-button phase row. Please confirm if you prefer this single dynamic phase badge in the top bar, or if you want the 4 clickable phase pills placed in the top bar instead.

---

## 4. Delete Low-Res Temperature Data (`timeline-sst-low.bin.gz`) & Start with Full Quality

- **[DELETE] `src/assets/data/timeline-sst-low.bin.gz`** (saves ~566 KB in repo/assets).
- **[MODIFY] `src/assets/data/timeline-meta.json`**
  - Remove `lowGrid`, `lowBinFile`, and `lowEncoding` properties.
- **[MODIFY] `scripts/fetch-current-weather.mjs`**
  - Remove `OUT_BIN_LOW_GZ` constant, the `2.0° 180×90` downsampling + delta-encoding loop, and the `lowGrid`/`lowBinFile`/`lowEncoding` metadata fields.
- **[MODIFY] `src/app/core/services/current-weather.service.ts`**
  - Remove `LOW_FRAME_SIZE`, `sstLowBin`, `highResReady`, `decodeLowRes()`, and `streamHighRes()`.
  - Remove `lowGrid`, `lowBinFile`, `lowEncoding` from `TimelineMeta` interface.
  - In `load()`, fetch `timeline-meta.json` and `timeline-sst.bin.gz` directly, streaming download progress into `this.progress` (`0..100`) and decompressing into `this.sstBin` + `this.extractAirBin(meta, bin)` before setting `this.status.set('ready')`.
- **[MODIFY] `src/app/components/globe/globe.component.ts`**
  - In `recolorTexture()`, remove `const lowBin = this.weather.sstLowBin;` and the `else if (pair && lowBin)` 4×4 block upsampling branch.
  - In `animate()`, remove `const hiRes = this.weather.highResReady();` from `textureKey`.
- **[MODIFY] `src/app/core/services/current-weather.service.spec.ts`**
  - Remove the `correctly decodes low-res delta-encoded preview frames` unit test and update forecast-related tests if needed.

---

## 5. Verification Plan

1. **Unit Tests (`npm test -- --watch=false`):**
   - Update `map-dock.component.spec.ts` and `current-weather.service.spec.ts` to reflect the removal of `timeline-sst-low.bin.gz`, removal of the separate `NOW` rail marker, and the updated dock structure.
   - Verify all unit tests pass.
2. **Production Build (`npm run build`):**
   - Verify zero TypeScript or Angular template warnings/errors and confirm `timeline-sst-low.bin.gz` is no longer in `dist/`.
3. **Visual & Functional Verification:**
   - Verify on startup that the splash screen loads the full-resolution `timeline-sst.bin.gz` directly and reveals a crisp, unpixelated globe.
   - Verify that at every slider position (`La Niña`, `Neutral`, `El Niño`, `Latest`), the convective clouds on the 3D Globe and the Walker Cell cross-section sit at the exact same longitude.
   - Verify desktop, tablet, mobile portrait, and `mobile-landscape` (`≤ 500px` height) layouts with the updated 2-row dock.
