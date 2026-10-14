/**
 * Typical rainfall changes during El Niño, simplified to ellipses on the globe.
 * Compiled from the three sources below (regions and seasons as shown on their maps);
 * outlines are approximate. During La Niña the pattern is broadly reversed — the app shows that
 * as an explicitly marked simplification.
 */

export type RainKind = 'dry' | 'wet';
export type ImpactSourceId = 'wmo' | 'jrc' | 'jma';

export interface RainRegion {
  name: string;
  kind: RainKind;          // during El Niño
  lon: number;             // centre, degrees east (−180…180)
  lat: number;
  rx: number;              // half-width, degrees of longitude
  ry: number;              // half-height, degrees of latitude
  rot?: number;            // rotation, degrees (counter-clockwise on the map)
  season: string;          // months when the anomaly is typical
  src: ImpactSourceId[];
}

export interface ImpactSource {
  id: ImpactSourceId;
  short: string;
  title: string;
  url: string;
}

export const IMPACT_SOURCES: ImpactSource[] = [
  {
    id: 'wmo',
    short: 'WMO',
    title: 'WMO – El Niño shifts rainfall patterns in different parts of the world (2026)',
    url: 'https://wmo.int/sites/default/files/styles/prose_1x/public/2026-06/EL%20Nino%20chamges%20rainfall%20patterns.png?itok=WKVfDATj'
  },
  {
    id: 'jrc',
    short: 'JRC',
    title: 'Wspólne Centrum Badawcze KE (JRC) – raport ENSO, mapa skutków (2026)',
    url: 'https://joint-research-centre.ec.europa.eu/sites/default/files/styles/embed_large/public/2026-06/ENSO_report_map_impacts.jpg?itok=1IGJ3duJ'
  },
  {
    id: 'jma',
    short: 'JMA',
    title: 'JMA Tokyo Climate Center – Impacts of El Niño/La Niña on the global climate',
    url: 'https://ds.data.jma.go.jp/tcc/tcc/products/climate/ENSO/index.htm'
  }
];

export const RAIN_REGIONS: RainRegion[] = [
  // ── drier than normal ──
  { name: 'Indonezja i Filipiny', kind: 'dry', lon: 118, lat: 0, rx: 22, ry: 11, rot: -15, season: 'cze–lut', src: ['wmo', 'jrc', 'jma'] },
  { name: 'Australia', kind: 'dry', lon: 138, lat: -24, rx: 17, ry: 11, rot: -10, season: 'lip–sty', src: ['wmo', 'jrc', 'jma'] },
  { name: 'Afryka Południowa', kind: 'dry', lon: 28, lat: -22, rx: 11, ry: 8, season: 'lis–mar', src: ['wmo', 'jrc', 'jma'] },
  { name: 'Indie (monsun)', kind: 'dry', lon: 78, lat: 21, rx: 8, ry: 9, season: 'cze–wrz', src: ['wmo', 'jrc', 'jma'] },
  { name: 'Sahel', kind: 'dry', lon: 0, lat: 13, rx: 20, ry: 4, season: 'lip–wrz', src: ['wmo', 'jrc'] },
  { name: 'Etiopia', kind: 'dry', lon: 39, lat: 10, rx: 5, ry: 4, season: 'cze–wrz', src: ['wmo'] },
  { name: 'Ameryka Środkowa', kind: 'dry', lon: -86, lat: 13, rx: 9, ry: 5, rot: -20, season: 'cze–lut', src: ['wmo', 'jrc'] },
  { name: 'Płn. Ameryka Płd. i Amazonia', kind: 'dry', lon: -62, lat: 0, rx: 15, ry: 9, season: 'gru–cze', src: ['wmo', 'jrc', 'jma'] },
  { name: 'Płn.-wsch. Brazylia', kind: 'dry', lon: -41, lat: -8, rx: 6, ry: 6, season: 'lut–maj', src: ['wmo', 'jma'] },

  // ── wetter than normal ──
  { name: 'Wybrzeże Peru i Ekwadoru', kind: 'wet', lon: -80, lat: -4, rx: 4, ry: 6, season: 'gru–kwi', src: ['wmo', 'jma'] },
  { name: 'Płd.-wsch. Ameryka Płd.', kind: 'wet', lon: -57, lat: -30, rx: 8, ry: 6, season: 'wrz–kwi', src: ['wmo', 'jrc', 'jma'] },
  { name: 'Środkowe Chile', kind: 'wet', lon: -71, lat: -35, rx: 3, ry: 6, season: 'cze–sie', src: ['wmo', 'jma'] },
  { name: 'Afryka Wschodnia', kind: 'wet', lon: 40, lat: -2, rx: 7, ry: 7, season: 'paź–gru', src: ['wmo', 'jrc'] },
  { name: 'Południe USA i płn. Meksyk', kind: 'wet', lon: -100, lat: 31, rx: 19, ry: 6, season: 'lis–kwi', src: ['wmo', 'jrc', 'jma'] },
  { name: 'Azja Środkowa i Bliski Wschód', kind: 'wet', lon: 58, lat: 38, rx: 13, ry: 7, season: 'sty–kwi', src: ['wmo', 'jrc'] },
  { name: 'Płd.-wsch. Chiny i płd. Japonia', kind: 'wet', lon: 124, lat: 29, rx: 14, ry: 6, rot: 20, season: 'lis–lut', src: ['wmo', 'jrc', 'jma'] },
  { name: 'Środkowy Pacyfik (ulewy nad oceanem)', kind: 'wet', lon: -160, lat: 1, rx: 38, ry: 6, season: 'cały rok', src: ['wmo', 'jma'] }
];
