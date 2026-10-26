/**
 * Typical rainfall changes during El Niño, simplified to ellipses on the globe.
 * All user-facing region names, seasons, and source titles live in `src/app/core/i18n/`.
 */

export type RainKind = 'dry' | 'wet';
export type ImpactSourceId = 'wmo' | 'jrc' | 'jma';

export interface RainRegionMeta {
  kind: RainKind;          // during El Niño
  lon: number;             // centre, degrees east (−180…180)
  lat: number;
  rx: number;              // half-width, degrees of longitude
  ry: number;              // half-height, degrees of latitude
  rot?: number;            // rotation, degrees (counter-clockwise on the map)
  src: ImpactSourceId[];
}

export interface ImpactSourceMeta {
  id: ImpactSourceId;
  short: string;
  url: string;
}

export const IMPACT_SOURCES: ImpactSourceMeta[] = [
  {
    id: 'wmo',
    short: 'WMO',
    url: 'https://wmo.int/news/media-centre/wmo-prepare-el-nino'
  },
  {
    id: 'jrc',
    short: 'JRC',
    url: 'https://joint-research-centre.ec.europa.eu/jrc-news-and-updates/potentially-historic-el-nino-come-analysis-shows-humanitarian-toll-2026-06-15_en'
  },
  {
    id: 'jma',
    short: 'JMA',
    url: 'https://ds.data.jma.go.jp/tcc/tcc/products/climate/ENSO/index.htm'
  }
];

export const RAIN_REGIONS: RainRegionMeta[] = [
  // ── drier than normal ──
  { kind: 'dry', lon: 118, lat: 0, rx: 22, ry: 11, rot: -15, src: ['wmo', 'jrc', 'jma'] },
  { kind: 'dry', lon: 138, lat: -24, rx: 17, ry: 11, rot: -10, src: ['wmo', 'jrc', 'jma'] },
  { kind: 'dry', lon: 28, lat: -22, rx: 11, ry: 8, src: ['wmo', 'jrc', 'jma'] },
  { kind: 'dry', lon: 78, lat: 21, rx: 8, ry: 9, src: ['wmo', 'jrc', 'jma'] },
  { kind: 'dry', lon: 0, lat: 13, rx: 20, ry: 4, src: ['wmo', 'jrc'] },
  { kind: 'dry', lon: 39, lat: 10, rx: 5, ry: 4, src: ['wmo'] },
  { kind: 'dry', lon: -86, lat: 13, rx: 9, ry: 5, rot: -20, src: ['wmo', 'jrc'] },
  { kind: 'dry', lon: -62, lat: 0, rx: 15, ry: 9, src: ['wmo', 'jrc', 'jma'] },
  { kind: 'dry', lon: -41, lat: -8, rx: 6, ry: 6, src: ['wmo', 'jma'] },

  // ── wetter than normal ──
  { kind: 'wet', lon: -80, lat: -4, rx: 4, ry: 6, src: ['wmo', 'jma'] },
  { kind: 'wet', lon: -57, lat: -30, rx: 8, ry: 6, src: ['wmo', 'jrc', 'jma'] },
  { kind: 'wet', lon: -71, lat: -35, rx: 3, ry: 6, src: ['wmo', 'jma'] },
  { kind: 'wet', lon: 40, lat: -2, rx: 7, ry: 7, src: ['wmo', 'jrc'] },
  { kind: 'wet', lon: -100, lat: 31, rx: 19, ry: 6, src: ['wmo', 'jrc', 'jma'] },
  { kind: 'wet', lon: 58, lat: 38, rx: 13, ry: 7, src: ['wmo', 'jrc'] },
  { kind: 'wet', lon: 124, lat: 29, rx: 14, ry: 6, rot: 20, src: ['wmo', 'jrc', 'jma'] },
  { kind: 'wet', lon: -160, lat: 1, rx: 38, ry: 6, src: ['wmo', 'jma'] }
];
