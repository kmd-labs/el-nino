export type EnsoPhase = 'nina' | 'neu' | 'nino' | 'super';
export type DisplayMode = 'sst' | 'anom';
export type ViewMode = 'globe' | 'walker' | 'thermocline' | 'impacts';
export type ImpactKind = 'dry' | 'fire' | 'wet' | 'other';

export interface EnsoSource {
  title: string;
  url: string;
}

export interface HistoricalEventMeta {
  ph: EnsoPhase;
  yrs: string;
  kind: ImpactKind;
  srcKey: string;
}

export interface ImpactLocationMeta {
  id: string;
  lon: number;
  lat: number;
  ev: HistoricalEventMeta[];
}

export interface HistoricalEvent {
  ph: EnsoPhase;
  yrs: string;
  kind: ImpactKind;
  type: string;
  aff: string;
  area?: string;
  note?: string;
  src: [string, string];
}

export interface ImpactLocation {
  id: string;
  name: string;
  region: string;
  lon: number;
  lat: number;
  ev: HistoricalEvent[];
}

export interface PhaseInfo {
  k: EnsoPhase;
  name: string;
  col: string;
}

export interface Preset {
  ph: EnsoPhase;
  strength: number;
  dateIso?: string;
  now?: boolean;
  forecast?: boolean;
  hot?: boolean;
}
