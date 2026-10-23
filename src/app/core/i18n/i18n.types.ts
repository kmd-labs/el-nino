import { EnsoPhase } from '../models/enso.model';

export type Lang = 'en' | 'pl' | 'es';

export interface GlossaryTerm {
  term: string;
  text: string;
  wiki: string;
  wikiLang: Lang;
}

export interface GlossaryGroup {
  title: string;
  terms: GlossaryTerm[];
}

export interface EventText {
  area?: string;
  type: string;
  aff: string;
  note?: string;
}

/** Translated texts of one EVENTS_META location, in the same order as EVENTS_META (and its events). */
export interface LocationText {
  name: string;
  region: string;
  ev: EventText[];
}

/** Labels drawn on the Walker cross-section canvas. */
export interface WalkerCanvasText {
  tropopause: string;
  thermocline: string;
  kelvin: string;
  indonesia: string;
  andes: string;
  trades: string;
  aloft: string;
  sinkDry: string;
  rising: string;
  sinkDrought: string;
  westerly: string;
  warmPool: string;
  coldTongue: string;
}

/** Every user-facing text of the app in one language. */
export interface Dict {
  htmlLang: string;
  docTitle: string;
  /** page <meta name="description">; the English one is also the static default in index.html */
  metaDescription: string;
  langName: string;

  phase: Record<EnsoPhase, string>;
  desc: Record<EnsoPhase, string>;
  months: string[];

  // header & settings
  readoutTitle: string;
  loadingMap: string;
  mapError: string;
  changeLanguage: string;

  // ENSO state & dock controls
  ensoLabel: string;
  strengthAria: string;
  probText: string;
  probTitle: string;
  probSource: string;
  playStart: string;
  playStop: string;
  detailsAria: string;
  thermoChip: string;
  thermoAria: string;
  thermoTitle: string;
  thermoNote: string;
  descChip: string;
  descChipTitle: string;
  close: string;
  hidePanel: string;
  showPanel: string;
  ensoTab: string;
  viewTab: string;
  cycleMonth: (year: number, month: string, realYear: number, forecast: boolean) => string;
  hintNeutral: string;
  hintPins: (count: number, phase: string) => string;

  // view dock
  chooseView: string;
  viewTemp: string;
  viewAnom: string;
  viewWalker: string;
  viewImpacts: string;
  viewCurrent: string;
  /** Active timeline date: mean SST inside the Niño 3.4 box. */
  sstOnDateTitle: string;
  /** Live Open-Meteo conditions shown in the dock. */
  liveConditionsLabel: string;
  /** Compact labels in the top data lozenge. */
  waterTempLabel: string;
  airTempLabel: string;
  windSpeedLabel: string;
  /** Per-parameter tooltips; air and wind are live snapshots, water follows the timeline. */
  airTempTitle: string;
  windSpeedTitle: string;
  timelineNow: string;
  timelineForecast: string;
  /** current-situation view: live-data badge */
  currentLive: string;
  currentAt: (time: string) => string;
  currentWind: string;
  currentWaves: string;
  scaleSstNow: string;
  scaleSstOn: (date: string) => string;
  scaleNoData: string;
  currentSources: string;
  currentSourceTitle: string;
  sstSourceTitle: (date: string, preliminary: boolean) => string;
  currentLoading: string;
  currentError: string;
  scaleSst: string;
  scaleAnom: string;
  scaleSstShort: string;
  scaleAnomShort: string;
  impactsTab: string;
  flowLegendTitle: string;
  flowWindLabel: string;
  flowWaveLabel: string;
  flowDesc: string;
  layersAria: string;
  layerAtm: string;
  layerAtmTitle: string;
  layerEvents: string;
  layerEventsTitle: string;
  layerRotate: string;
  layerRotateTitle: string;
  layerGlossary: string;
  layerGlossaryTitle: string;
  pinLegendTitle: (phase: string) => string;
  kindDry: string;
  kindFire: string;
  kindWet: string;
  kindOther: string;
  rainDry: string;
  rainWet: string;
  rainTitleNina: string;
  rainTitleNeutral: string;
  rainTitleNino: string;
  sources: string;
  sourceOisstTooltip: string;
  sourceOpenMeteoTooltip: string;

  // globe labels
  lblConvection: string;
  lblTrades: string;
  lblKelvin: string;
  lblIod: string;
  rainDryShort: string;
  rainWetShort: string;

  // impact pop-up
  mArea: string;
  mAnomaly: string;
  mScale: string;
  mRole: string;
  mSource: string;

  // Walker view
  walkerAria: string;
  walkerCaption: string;
  walkerNow: string;
  walkerCycle: string;
  walkerCurrent: (phase: string) => string;
  walkerCycleCaption: (month: string) => string;
  walkerPrev: string;
  walkerNext: string;
  walkerPlay: string;
  walkerPause: string;
  walkerStep: (i: number, title: string) => string;
  steps: string[];
  canvas: WalkerCanvasText;

  // splash loader
  splashLoading: string;
  splashPreparing: string;
  splashError: string;

  // glossary
  glTitle: string;
  glSearch: string;
  glSearchAria: string;
  glEmpty: (q: string) => string;
  /** suffix after "Wikipedia" when the linked article is in another language */
  wikiIn: Record<Lang, string>;
  glossary: GlossaryGroup[];

  // impacts view data (same order as RAIN_REGIONS / IMPACT_SOURCES)
  regions: { name: string; season: string }[];
  impactSourceTitles: string[];

  // historical events (same order as EVENTS_META) and translated source titles (by SRC_URLS key)
  events: LocationText[];
  srcTitles: Record<string, string>;
}
