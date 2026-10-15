import { EnsoPhase } from '../models/enso.model';

export type Lang = 'pl' | 'en' | 'es';

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

/** Translated texts of one EVENTS location, in the same order as EVENTS (and its events). */
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
  langName: string;

  phase: Record<EnsoPhase, string>;
  desc: Record<EnsoPhase, string>;
  months: string[];

  // header
  readoutTitle: string;
  loadingMap: string;
  mapError: string;
  changeLanguage: string;

  // ENSO state bar
  ensoLabel: string;
  strengthAria: string;
  probText: string;
  probTitle: string;
  probSource: string;
  playStart: string;
  playStop: string;
  detailsAria: string;
  thermoChip: string;
  thermoChipTitle: string;
  thermoTitle: string;
  thermoNote: string;
  descChip: string;
  descChipTitle: string;
  stateLabel: string;
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
  scaleSst: string;
  scaleAnom: string;
  scaleSstShort: string;
  scaleAnomShort: string;
  /** name of the folded impacts legend */
  impactsTab: string;
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

  // globe labels
  lblConvection: string;
  lblTrades: string;
  lblKelvin: string;
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

  // historical events (same order as EVENTS) and translated source titles (by SRC key)
  events: LocationText[];
  srcTitles: Partial<Record<string, string>>;
}
