# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Commands

```bash
git submodule update --init --recursive   # REQUIRED: src/design-system is a git submodule and ships
                                          # empty on a fresh clone — nothing compiles without it
npm ci
npm start                                 # ng serve → http://localhost:4200
npm run build                             # production build → dist/el-nino/browser
npm run build:gh-pages                    # same, with --base-href /el-nino/ (what CI deploys)
npm test                                  # Karma + Jasmine, single run, ChromeHeadlessCI
npm run fetch:weather                     # regenerate the SST/weather data assets (network, slow)
npm run fetch:history                     # regenerate enso-history.json from NOAA CPC (network, seconds)
```

Single spec: `npm test -- --include=src/app/core/services/enso-state.service.spec.ts` (or temporarily
`fdescribe`/`fit`). `karma.conf.js` resolves Chrome via `puppeteer` (not a dependency here) and then falls
back to `$CHROME_BIN` or a hardcoded macOS path — on Windows/Linux set `CHROME_BIN` to a Chrome binary
first. Coverage thresholds (statements 20 / lines 20 / branches 15 / functions 15) are enforced by
`karma.conf.js`; the production build enforces a 4 MB initial budget and 50 KB per component style.

There is **no linter or formatter** configured. TypeScript is `strict` with `noPropertyAccessFromIndexSignature`,
`noImplicitReturns`, and Angular `strictTemplates` — type errors surface only via `ng build` / `ng test`.

## Architecture

Single-page Angular 21 app: standalone components, signals only (no router, no NgModules, no RxJS state).
`AppComponent` composes the whole UI — `<app-globe>` (always mounted) under a three-zone HUD
(`<app-header>` top, `<app-map-dock>` bottom) plus the design-system `<app-popup>` / `<app-tooltip>` outlets.

### `s` is both the ENSO amplitude and the time axis

The number the entire app revolves around is **ENSO strength `s`** (slider range −2 … +3), held in
`EnsoStateService` as `sTarget` (what the UI sets) and `sCur` (eased toward the target every frame).
`s` is simultaneously:

- a **physical amplitude** fed to the analytic model in `EnsoMathService` (`anom`, `nino34`, `dmi`, `trade`, `thermo`, …), and
- a **position on a real calendar**: `CurrentWeatherService.getKeyframePair(s)` maps `s` onto the weekly
  NOAA OISST keyframes, where `s ≈ −1.8` is the earliest observed frame (Jan 2025), `s = 1.4` is the `now`
  frame, and `s = 2.6` is a single synthesized Super-El-Niño forecast frame. `PRESETS`
  (`core/constants/enso-data.ts`) and the dock's date markers hard-code those same anchors.

Changing a preset/anchor therefore changes *both* the physics and the displayed date — keep `PRESETS` in
`enso-data.ts`, the `milestones` array in `map-dock.component.ts`, and the `s` formula in
`scripts/fetch-current-weather.mjs` (`-1.8 + idx/(n-2) * (1.4 - -1.8)`, forecast pinned to `2.6`) consistent.

### The globe owns the clock

`GlobeComponent.animate()` is the only `requestAnimationFrame` loop that advances global state: it calls
`state.updateCycle(dt)` and `state.updateInterpolatedStrength(dt)` *before* bailing out early for
cross-section views. Time keeps running in the Walker/thermocline views, but stops entirely if the globe
component is unmounted — which is why `<app-globe>` stays mounted and is only hidden via
`host: { '[class.is-hidden]': 'state.crossSectionView()' }`.

The loop runs inside `ngZone.runOutsideAngular`, so nothing in it may rely on change detection. Keep the
established perf conventions: preallocated `Float32Array` / `Vector3` scratch fields instead of per-frame
allocation, and the texture-recolor guard (`|Δs| > 0.004` plus a `textureKey` mode string) rather than
recoloring 259,200 pixels every frame.

### View modes

`state.view()` is `'globe' | 'impacts' | 'walker' | 'thermocline' | 'cycles'` (header dropdown):

- `globe` / `impacts` both render on the 3D globe; `impacts` dims the SST texture (`recolorTexture(s, dim)`)
  and foregrounds rainfall regions and event pins.
- `walker` / `thermocline` / `cycles` are `crossSectionView()` — separate full-screen 2D `<canvas>`
  components that overlay and pause the globe. `WalkerViewComponent` additionally runs its own 12-step
  guided walkthrough that drives `s` itself.

### Two separate sources of truth for "how strong is ENSO"

Keep these apart; mixing them in one number without saying which is which is the easiest way to
produce a nonsense figure:

- **`EnsoMathService`** — an analytic, idealized model. `nino34(s)` is effectively `0.918 · s`
  (`basisC` sits at 82°W, outside the Niño 3.4 box, so it contributes ~0.0003). The slider maximum
  `s = 3` therefore caps the displayed index at **+2.75**, and the `s = 2.6` "Super" preset reads **+2.39**.
  Any threshold written against real ONI values must be checked against this ceiling.
- **`EnsoHistoryService`** — observed monthly Niño 3.4 from NOAA CPC, 1950 → present, loaded from
  `assets/data/enso-history.json` and built by `scripts/fetch-enso-history.mjs`. `prob2026` is derived
  from the analog ensemble in that file, so it reports `—` until the fetch resolves.

### `enso-history.json`

Built from two CPC text products: `detrend.nino34.ascii.txt` (1950 →, trend-adjusted climatology, the
primary series) spliced with `sstoi.indices` (1982 →, all four Niño regions) for the months detrend
lags behind. The splice is bias-corrected by the median difference over the overlapping tail and the
correction is recorded as `index.spliceOffset` so it stays auditable. The file also carries an event
catalogue (a run of ≥ 5 consecutive months beyond ±0.5, tiered by peak — `super` only for El Niño,
since "super La Niña" is not an established category) and an **analog-ensemble forecast**: the five
past seasons whose last 12 months best match the current trajectory, each **anchored** to today's
level so a weaker analog cannot imply an impossible jump at the splice point. Note the historical
URLs live on `www.cpc.ncep.noaa.gov` — `origin.cpc.ncep.noaa.gov` does not resolve, and there is no
ASCII ONI file (only `ONI_v5.php` as HTML), hence the 3-month running mean computed locally.

### Data pipeline (committed assets, refreshed by CI)

`scripts/fetch-current-weather.mjs` (Node ESM, `h5wasm` for NetCDF) downloads weekly NOAA OISST anomaly
files plus an Open-Meteo wind/wave "current" snapshot and writes two committed assets:

- `src/assets/data/timeline-meta.json` — grid description, keyframe list (`date`, `s`, `nino34`, `now`,
  `forecast`) and the embedded `openMeteo` snapshot.
- `src/assets/data/timeline-sst.bin.gz` — all frames concatenated as packed `Uint8` (720 × 360 = 259,200
  bytes per frame; byte `255` = no data i.e. land/ice/poles, otherwise °C = `byte * 0.2 − 5.0`).

The script caches downloads in `scripts/.cache/` and reuses existing output, so re-running only fetches new
weeks. At runtime `CurrentWeatherService.load()` fetches both, gunzips the binary with `DecompressionStream`,
and sets `status()` to `ready` / `error`. `GlobeComponent.recolorTexture()` blends the two bracketing frames
into a `THREE.DataTexture`; `CurrentWeatherLayer` draws wind/wave streak trails from the Open-Meteo snapshot,
applying ENSO anomaly deltas relative to the `now` baseline (`ds = s - 1.4`). Everything degrades gracefully:
while `status()` is not `ready` the globe shows neutral grey and falls back to the procedural
`ensoWindLines` / `ensoWaveLines`, and land topology falls back from `assets/data/land-50m.json` to a jsDelivr CDN copy.

### i18n is positional — the main footgun

`core/i18n/i18n.types.ts` `Dict` is the contract; `en.ts`, `pl.ts`, `es.ts` must all implement it (add the key
to `Dict` first so TypeScript flags the missing translations). Location and event text is **not** keyed by id:
`EVENTS_META` / `RAIN_REGIONS` hold language-neutral geometry, and `dict.events[i]` / `dict.regions[i]` are
parallel arrays matched **by array index** (`I18nService.location()` joins them). Inserting, reordering, or
removing an entry in `enso-data.ts` / `impacts-data.ts` requires the identical edit at the same index in all
three dictionaries. Source URLs live in `SRC_URLS` keyed by `srcKey`; only their titles are translated.

### Design-system boundary

`src/design-system` (submodule `kmd-labs/design-system`) is imported as `@kmd/design-system/*` (tsconfig
paths) and its SCSS via `@use "variables" as *` (`angular.json` `stylePreprocessorOptions.includePaths`:
`src`, `src/design-system`). Treat it as read-only here — it is auto-bumped by
`.github/workflows/sync-design-system.yml` (6-hourly PR, auto-squash-merged), so local edits get lost.
Three.js/canvas code must read colors through `ThemeService.getTokenColor(token, fallback)`; the SST and
anomaly LUTs are built from `--color-*` tokens in `EnsoMathService.refreshLutsFromTokens()` (token names
listed in `TEMP_COLOR_TOKENS` / `ANOM_COLOR_TOKENS` / `PHASE_COLOR_TOKENS` / `KIND_COLOR_TOKENS`).
App-local token overrides belong in `src/styles.scss` under `:root`.

### CI

`.github/workflows/deploy.yml` deploys to GitHub Pages on push to `main`, on `workflow_dispatch`, and
**every 3 hours** — each run bumps the submodule, re-runs `npm run fetch:weather` and `npm run fetch:history`
(both tolerate failure, keeping the committed snapshot) and builds with `--base-href /el-nino/`. Running
either fetch locally is rarely needed; expect the data assets to drift underneath you.

Note: the architecture tree in `README.md` is stale (it still lists `control-panel/`, local `ui/button`,
`ui/badge`, and `src/_variables.scss`). Trust the source tree over the README.
