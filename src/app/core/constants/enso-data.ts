import { EnsoPhase, ImpactKind, ImpactLocationMeta, Preset } from '../models/enso.model';

/** SCSS design token names for each ENSO phase */
export const PHASE_COLOR_TOKENS: Record<EnsoPhase, string> = {
  super: 'phase-super',
  nino: 'phase-nino',
  nina: 'phase-nina',
  neu: 'phase-neu'
};

/** SCSS design token names for each historical impact kind */
export const KIND_COLOR_TOKENS: Record<ImpactKind, string> = {
  dry: 'kind-dry',
  fire: 'kind-fire',
  wet: 'kind-wet',
  other: 'kind-other'
};

/** Thermal (Sea Surface Temperature, °C) scale stops mapped to SCSS design tokens */
export const TEMP_COLOR_TOKENS: [number, string][] = [
  [-2, 'sst-m2'],
  [0, 'sst-0'],
  [5, 'sst-5'],
  [10, 'sst-10'],
  [15, 'sst-15'],
  [20, 'sst-20'],
  [23, 'sst-23'],
  [25.5, 'sst-25-5'],
  [27.5, 'sst-27-5'],
  [29.2, 'sst-29-2'],
  [31, 'sst-31']
];

/** Temperature Anomaly (°C vs normal) scale stops mapped to SCSS design tokens */
export const ANOM_COLOR_TOKENS: [number, string][] = [
  [-3, 'anom-m3'],
  [-1.5, 'anom-m1-5'],
  [0, 'anom-0'],
  [1.5, 'anom-p1-5'],
  [3, 'anom-p3']
];

/** Source URLs by source key (titles are localized in i18n dictionaries) */
export const SRC_URLS: Record<string, string> = {
  anch: 'https://en.wikipedia.org/wiki/1972_Peruvian_anchoveta_crisis',
  nps: 'https://www.oc.nps.edu/webmodules/ENSO/economic.html',
  eird: 'https://www.eird.org/eng/revista/No1_2001/pagina22.htm',
  ash: 'https://en.wikipedia.org/wiki/Ash_Wednesday_bushfires',
  idn97: 'https://www.ebsco.com/research-starters/agriculture-and-agribusiness/indonesian-forest-fires-devastate-southeast-asia',
  idn15: 'https://www.benarnews.org/english/news/indonesian/indonesia-fires-12152015170230.html',
  png: 'https://devpolicy.org/food-risks-in-png-lessons-from-1997-20150826/',
  rvf: 'https://www.cdc.gov/mmwr/preview/mmwrhtml/00051976.htm',
  chn: 'https://en.wikipedia.org/wiki/1998_China_floods',
  cal: 'https://www.govtech.com/em/emergency-blogs/disaster-zone/disaster-officials-brace-for-havoc-from-historic-el-nino.html',
  saf15: 'https://www.publicfinancefocus.org/news/2016/07/drought-stricken-african-nations-launch-24bn-drought-appeal',
  eth: 'https://ethiopia.un.org/en/15009-drought-ethiopia-10-million-people-need',
  cam: 'https://wfpusa.org/news/to-reduce-el-ninos-impact-on-central-americas-dry-corridor-build-resilience-and-invest-in-sustainable-agriculture/',
  vnm: 'https://reliefweb.int/report/viet-nam/vietnam-drought-and-salt-water-intrusion-caused-el-ni-o-echo-un-ocha-mard-echo-daily',
  saf92: 'https://www.fao.org/4/x5558e/X5558e01.htm',
  saf24: 'https://www.aljazeera.com/news/2024/8/17/nearly-68-million-people-reeling-from-drought-in-southern-africa-official',
  som23: 'https://reliefweb.int/report/somalia/somalia-faces-once-century-flooding-un-relief-wing-releases-25-million-jumpstart-life-saving-assistance',
  amz: 'https://news.mongabay.com/2023/10/amazon-drought-cuts-river-traffic-leaves-communities-without-water-and-supplies/',
  pan: 'https://www.woodwellclimate.org/drought-panama-canal-7-graphics/',
  ind09: 'https://theprint.in/environment/indias-driest-june-in-17-years-what-happened-after-the-weak-monsoons-of-2009-and-2014/2977449/',
  qld: 'https://en.wikipedia.org/wiki/2010%E2%80%932011_Queensland_floods',
  pak10: 'https://en.wikipedia.org/wiki/2010_Pakistan_floods',
  pak22: 'https://en.wikipedia.org/wiki/2022_Pakistan_floods',
  som11: 'https://fsnau.org/in-focus/technical-release-study-suggests-258000-somalis-died-due-severe-food-insecurity-and-famine-',
  horn: 'https://www.undrr.org/resource/horn-africa-floods-and-drought/2020-2023',
  arg: 'https://dialogue.earth/en/climate/370215-la-nina-ends-but-drought-exposes-deeper-problems-for-argentina/',
  tha: 'https://en.wikipedia.org/wiki/2011_Thailand_floods',
  col: 'https://rpp.pe/mundo/actualidad/colombia-lluvias-dejan-469-muertos-en-catorce-meses-noticia-373653',
  tex: 'https://www.drovers.com/news/2011-texas-agricultural-drought-losses-total-7-62-billion',
  bgd: 'https://reliefweb.int/report/bangladesh/bangladesh-floods-aug-1988-undro-situation-reports-1-13',
  moz: 'https://en.wikipedia.org/wiki/2000_Mozambique_flood'
};

/** Language-neutral location & event metadata (all localized text is in src/app/core/i18n/) */
export const EVENTS_META: ImpactLocationMeta[] = [
  {
    id: 'peru',
    lon: -78.5,
    lat: -9.5,
    ev: [
      { ph: 'super', yrs: '1972–1973', kind: 'other', srcKey: 'anch' },
      { ph: 'super', yrs: '1997–1998', kind: 'wet', srcKey: 'eird' }
    ]
  },
  {
    id: 'ecuador',
    lon: -79.8,
    lat: -1.6,
    ev: [
      { ph: 'super', yrs: '1982–1983', kind: 'wet', srcKey: 'nps' },
      { ph: 'super', yrs: '1997–1998', kind: 'wet', srcKey: 'eird' }
    ]
  },
  {
    id: 'parana',
    lon: -55,
    lat: -27,
    ev: [
      { ph: 'super', yrs: '1982–1983', kind: 'wet', srcKey: 'nps' }
    ]
  },
  {
    id: 'amazonas',
    lon: -60,
    lat: -3.1,
    ev: [
      { ph: 'nino', yrs: '2023', kind: 'dry', srcKey: 'amz' }
    ]
  },
  {
    id: 'argentina',
    lon: -61.5,
    lat: -33.5,
    ev: [
      { ph: 'nina', yrs: '2022–2023', kind: 'dry', srcKey: 'arg' }
    ]
  },
  {
    id: 'colombia',
    lon: -74.5,
    lat: 6.2,
    ev: [
      { ph: 'nina', yrs: '2010–2011', kind: 'wet', srcKey: 'col' }
    ]
  },
  {
    id: 'california',
    lon: -120,
    lat: 36.5,
    ev: [
      { ph: 'super', yrs: '1997–1998', kind: 'wet', srcKey: 'cal' }
    ]
  },
  {
    id: 'texas',
    lon: -99.5,
    lat: 31.5,
    ev: [
      { ph: 'nina', yrs: '2011', kind: 'dry', srcKey: 'tex' }
    ]
  },
  {
    id: 'dry-corridor',
    lon: -88.5,
    lat: 14.2,
    ev: [
      { ph: 'super', yrs: '2014–2016', kind: 'dry', srcKey: 'cam' }
    ]
  },
  {
    id: 'panama',
    lon: -79.7,
    lat: 9.1,
    ev: [
      { ph: 'nino', yrs: '2023–2024', kind: 'dry', srcKey: 'pan' }
    ]
  },
  {
    id: 'sadc',
    lon: 30,
    lat: -18,
    ev: [
      { ph: 'super', yrs: '2015–2016', kind: 'dry', srcKey: 'saf15' },
      { ph: 'nino', yrs: '1991–1992', kind: 'dry', srcKey: 'saf92' },
      { ph: 'nino', yrs: '2023–2024', kind: 'dry', srcKey: 'saf24' }
    ]
  },
  {
    id: 'mozambique',
    lon: 33,
    lat: -24.5,
    ev: [
      { ph: 'nina', yrs: '2000', kind: 'wet', srcKey: 'moz' }
    ]
  },
  {
    id: 'ethiopia',
    lon: 39.5,
    lat: 9,
    ev: [
      { ph: 'super', yrs: '2015–2016', kind: 'dry', srcKey: 'eth' }
    ]
  },
  {
    id: 'kenya-somalia',
    lon: 40.5,
    lat: -0.5,
    ev: [
      { ph: 'super', yrs: '1997–1998', kind: 'other', srcKey: 'rvf' }
    ]
  },
  {
    id: 'somalia',
    lon: 45.5,
    lat: 3.5,
    ev: [
      { ph: 'nino', yrs: '2023', kind: 'wet', srcKey: 'som23' },
      { ph: 'nina', yrs: '2010–2012', kind: 'dry', srcKey: 'som11' }
    ]
  },
  {
    id: 'horn-of-africa',
    lon: 38.5,
    lat: 4,
    ev: [
      { ph: 'nina', yrs: '2020–2023', kind: 'dry', srcKey: 'horn' }
    ]
  },
  {
    id: 'indonesia',
    lon: 113.5,
    lat: -1.5,
    ev: [
      { ph: 'super', yrs: '1997–1998', kind: 'fire', srcKey: 'idn97' },
      { ph: 'super', yrs: '2015', kind: 'fire', srcKey: 'idn15' }
    ]
  },
  {
    id: 'png',
    lon: 145,
    lat: -6,
    ev: [
      { ph: 'super', yrs: '1997–1998', kind: 'dry', srcKey: 'png' }
    ]
  },
  {
    id: 'yangtze',
    lon: 114,
    lat: 30,
    ev: [
      { ph: 'super', yrs: '1998', kind: 'wet', srcKey: 'chn' }
    ]
  },
  {
    id: 'mekong',
    lon: 105.8,
    lat: 10,
    ev: [
      { ph: 'super', yrs: '2015–2016', kind: 'dry', srcKey: 'vnm' }
    ]
  },
  {
    id: 'india',
    lon: 78,
    lat: 23,
    ev: [
      { ph: 'nino', yrs: '2009', kind: 'dry', srcKey: 'ind09' }
    ]
  },
  {
    id: 'pakistan',
    lon: 68.5,
    lat: 27.5,
    ev: [
      { ph: 'nina', yrs: '2010', kind: 'wet', srcKey: 'pak10' },
      { ph: 'nina', yrs: '2022', kind: 'wet', srcKey: 'pak22' }
    ]
  },
  {
    id: 'bangladesh',
    lon: 90.4,
    lat: 23.7,
    ev: [
      { ph: 'nina', yrs: '1988', kind: 'wet', srcKey: 'bgd' }
    ]
  },
  {
    id: 'thailand',
    lon: 100.5,
    lat: 14.6,
    ev: [
      { ph: 'nina', yrs: '2011', kind: 'wet', srcKey: 'tha' }
    ]
  },
  {
    id: 'victoria',
    lon: 144,
    lat: -37,
    ev: [
      { ph: 'super', yrs: '1982–1983', kind: 'fire', srcKey: 'ash' }
    ]
  },
  {
    id: 'queensland',
    lon: 151.5,
    lat: -26.5,
    ev: [
      { ph: 'nina', yrs: '2010–2011', kind: 'wet', srcKey: 'qld' }
    ]
  }
];

export const KEY: [number, number][] = [
  [0, -0.3],
  [6, -1.2],
  [12, -1.4],
  [18, -0.5],
  [24, 0.3],
  [28, 1.1],
  [32, 2.0],
  [35, 2.7],
  [38, 2.3],
  [42, 0.9],
  [46, -0.3],
  [48, -0.3]
];

/**
 * Calendar year of month 0 in the idealised 4-year cycle (KEY). Chosen so the modelled El Niño
 * peak (month 35 = December of year 3) lines up with the forecast peak of the current event
 * (Nov 2026 – Jan 2027); year 2 then matches the weak La Niña of winter 2024/25.
 */
export const CYCLE_START_YEAR = 2024;
/** Cycle month index from which the calendar is still a forecast (after October 2026). */
export const CYCLE_FORECAST_FROM = (2026 - 2024) * 12 + 10;

export const PRESETS: Preset[] = [
  { ph: 'nina', strength: -1.6 },
  { ph: 'neu', strength: 0 },
  { ph: 'nino', strength: 1.2 },
  { ph: 'super', strength: 2.6, hot: true }
];
