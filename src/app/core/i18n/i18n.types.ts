import { EnsoPhase } from '../models/enso.model';

export type Lang = 'en' | 'pl' | 'es';
export type TempUnit = 'C' | 'F';

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

/** Translated bio and task chips of one TEAM member, in the same order as TEAM. */
export interface PersonText {
  bio: string;
  tasks: string[];
}

/** "About us" page and the header entry points to it. */
export interface AboutText {
  docTitle: string;
  metaDescription: string;
  cta: string;
  contact: string;
  openAbout: string;
  title: string;
  kicker: string;
  /** Hero paragraphs, rendered in order. */
  leads: string[];
  /** External references shown as pills under the hero text. */
  refs: { label: string; href: string; title: string; aria: string }[];
  back: string;
  tasksLabel: string;
  photoSoon: string;
  linkedinAria: (name: string) => string;
  githubAria: (name: string) => string;
  footer: string;
  people: PersonText[];
}

/** "How we built it" mini case study at the end of the glossary. */
export interface BuiltText {
  title: string;
  rows: { label: string; text: string }[];
  teamLink: string;
}

export interface MethodologyItem {
  label: string;
  area: string;
  text: string;
}

export interface SourceItem {
  name: string;
  url: string;
  license: string;
  desc: string;
}

export interface MethodologyText {
  title: string;
  subtitle: string;
  items: MethodologyItem[];
}

/** Every user-facing text of the app in one language. */
export interface Dict {
  htmlLang: string;
  locale: string;
  docTitle: string;
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
  settingsTitle: string;
  settingsSubtitle: string;
  settingsAria: string;
  temperatureUnit: string;
  unitCelsius: string;
  unitFahrenheit: string;

  // ENSO state & dock controls
  ensoLabel: string;
  strengthAria: string;
  probText: string;
  probTitle: string;
  probSource: string;
  playStart: string;
  playStop: string;
  playbackSpeed: string;
  speedNormal: string;
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
  hintNeutral: string;
  hintPins: (count: number, phase: string) => string;

  // view dock
  chooseView: string;
  shareLink: string;
  shareTitle: string;
  shareSubtitle: string;
  shareAppUrl: string;
  shareQrCode: string;
  copyLink: string;
  shareDate: string;
  shareState: string;
  linkCopied: string;
  linkCopyFailed: string;
  viewTemp: string;
  viewAnom: string;
  viewWalker: string;
  viewImpacts: string;
  viewCurrent: string;
  sstOnDateTitle: string;
  dailyConditionsLabel: string;
  waterTempLabel: string;
  airTempLabel: string;
  windSpeedLabel: string;
  airTempTitle: string;
  windSpeedTitle: string;
  timelineNow: string;
  live: string;
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
  walkerCycleCaption: (date: string) => string;
  walkerPrev: string;
  walkerNext: string;
  walkerPlay: string;
  walkerPause: string;
  walkerStep: (i: number, title: string) => string;
  steps: string[];
  canvas: WalkerCanvasText;

  splashLoading: string;
  splashPreparing: string;
  splashError: string;

  about: AboutText;

  // previous-cycles view
  viewCycles: string;
  cyclesAria: string;
  cyclesTitle: string;
  cyclesNote: string;
  cyclesBarrier: string;
  cyclesLegendPast: string;
  cyclesLegendAnalog: string;
  cyclesLegendCurrent: string;
  cyclesLegendForecast: string;
  cyclesAxisOni: string;
  cyclesYearN: (n: number) => string;
  cyclesCatalogue: string;
  cyclesColSeason: string;
  cyclesColPeak: string;
  cyclesColTier: string;
  cyclesColLength: string;
  cyclesMonthsShort: (n: number) => string;
  cyclesOngoing: string;
  cyclesProvisional: (date: string) => string;
  cyclesAnalogTitle: string;
  cyclesAnalogNote: (window: number, members: number) => string;
  cyclesAnalogMatch: string;
  cyclesAnalogWeight: string;
  cyclesForecastPeak: (lo: number, hi: number, window: string) => string;
  cyclesRecordNote: (first: string, last: string) => string;
  cyclesLoading: string;
  cyclesError: string;
  tier: Record<'super' | 'strong' | 'moderate' | 'weak', string>;

  // glossary
  glTitle: string;
  glSearch: string;
  glSearchAria: string;
  glEmpty: (q: string) => string;
  /** suffix after "Wikipedia" when the linked article is in another language */
  wikiIn: Record<Lang, string>;
  glossary: GlossaryGroup[];
  methodology: MethodologyText;
  built: BuiltText;
  sourcesTitle: string;
  sourcesList: SourceItem[];

  // globe inspection tooltip
  inspectCoords: (lat: number, lon: number) => string;
  inspectWater: string;
  inspectAir: string;
  inspectNoWater: string;

  // impacts view data (same order as RAIN_REGIONS / IMPACT_SOURCES)
  regions: { name: string; season: string }[];
  impactSourceTitles: string[];

  // historical events (same order as EVENTS_META) and translated source titles (by SRC_URLS key)
  events: LocationText[];
  srcTitles: Record<string, string>;
}
