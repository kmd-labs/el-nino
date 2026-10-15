import { EnsoPhase, ImpactKind, ImpactLocation, Preset } from '../models/enso.model';

export const PH: Record<EnsoPhase, { name: string; col: string }> = {
  super: { name: 'Super El Niño', col: '#e8361f' },
  nino: { name: 'El Niño', col: '#f08a1c' },
  nina: { name: 'La Niña', col: '#2f7fe8' },
  neu: { name: 'Neutralny', col: '#6f7d98' }
};

export const KIND: Record<ImpactKind, number> = {
  dry: 0xff9a3d,
  fire: 0xff4f3a,
  wet: 0x5fb0ff,
  other: 0xc39bff
};

export const KIND_HEX: Record<ImpactKind, string> = {
  dry: '#ff9a3d',
  fire: '#ff4f3a',
  wet: '#5fb0ff',
  other: '#c39bff'
};

export const SRC: Record<string, [string, string]> = {
  anch: ['Wikipedia – 1972 Peruvian anchoveta crisis', 'https://en.wikipedia.org/wiki/1972_Peruvian_anchoveta_crisis'],
  nps: ['Naval Postgraduate School – Economic effects of El Niño (1982–83)', 'https://www.oc.nps.edu/webmodules/ENSO/economic.html'],
  eird: ['UN ISDR / CAF – El Niño 1997–98 w krajach andyjskich', 'https://www.eird.org/eng/revista/No1_2001/pagina22.htm'],
  ash: ['Wikipedia – Ash Wednesday bushfires', 'https://en.wikipedia.org/wiki/Ash_Wednesday_bushfires'],
  idn97: ['EBSCO Research Starters – pożary w Indonezji 1997–98', 'https://www.ebsco.com/research-starters/agriculture-and-agribusiness/indonesian-forest-fires-devastate-southeast-asia'],
  idn15: ['BenarNews (dane Banku Światowego) – pożary 2015', 'https://www.benarnews.org/english/news/indonesian/indonesia-fires-12152015170230.html'],
  png: ['Devpolicy Blog (ANU) – Food risks in PNG: lessons from 1997', 'https://devpolicy.org/food-risks-in-png-lessons-from-1997-20150826/'],
  rvf: ['CDC MMWR – gorączka doliny Rift, Afryka Wsch. 1997–98', 'https://www.cdc.gov/mmwr/preview/mmwrhtml/00051976.htm'],
  chn: ['Wikipedia – 1998 China floods', 'https://en.wikipedia.org/wiki/1998_China_floods'],
  cal: ['Government Technology (dane FEMA) – El Niño 1997–98', 'https://www.govtech.com/em/emergency-blogs/disaster-zone/disaster-officials-brace-for-havoc-from-historic-el-nino.html'],
  saf15: ['Public Finance Focus – apel SADC, lipiec 2016', 'https://www.publicfinancefocus.org/news/2016/07/drought-stricken-african-nations-launch-24bn-drought-appeal'],
  eth: ['ONZ w Etiopii – Susza: 10 mln osób w potrzebie (2016)', 'https://ethiopia.un.org/en/15009-drought-ethiopia-10-million-people-need'],
  cam: ['WFP USA / FAO – Suchy Korytarz Ameryki Środkowej, 30.06.2016', 'https://wfpusa.org/news/to-reduce-el-ninos-impact-on-central-americas-dry-corridor-build-resilience-and-invest-in-sustainable-agriculture/'],
  vnm: ['ReliefWeb (UN OCHA / ECHO) – Wietnam, 29.04.2016', 'https://reliefweb.int/report/viet-nam/vietnam-drought-and-salt-water-intrusion-caused-el-ni-o-echo-un-ocha-mard-echo-daily'],
  saf92: ['FAO GIEWS – Update on the 1991/92 drought', 'https://www.fao.org/4/x5558e/X5558e01.htm'],
  saf24: ['Al Jazeera (dane SADC) – 17.08.2024', 'https://www.aljazeera.com/news/2024/8/17/nearly-68-million-people-reeling-from-drought-in-southern-africa-official'],
  som23: ['UN OCHA / ReliefWeb – Somalia, 9.11.2023', 'https://reliefweb.int/report/somalia/somalia-faces-once-century-flooding-un-relief-wing-releases-25-million-jumpstart-life-saving-assistance'],
  amz: ['Mongabay – susza w Amazonii, październik 2023', 'https://news.mongabay.com/2023/10/amazon-drought-cuts-river-traffic-leaves-communities-without-water-and-supplies/'],
  pan: ['Woodwell Climate Research Center – susza a Kanał Panamski', 'https://www.woodwellclimate.org/drought-panama-canal-7-graphics/'],
  ind09: ['ThePrint – słabe monsuny 2009 i 2014', 'https://theprint.in/environment/indias-driest-june-in-17-years-what-happened-after-the-weak-monsoons-of-2009-and-2014/2977449/'],
  qld: ['Wikipedia – 2010–2011 Queensland floods', 'https://en.wikipedia.org/wiki/2010%E2%80%932011_Queensland_floods'],
  pak10: ['Wikipedia – 2010 Pakistan floods', 'https://en.wikipedia.org/wiki/2010_Pakistan_floods'],
  pak22: ['Wikipedia – 2022 Pakistan floods', 'https://en.wikipedia.org/wiki/2022_Pakistan_floods'],
  som11: ['FSNAU (FAO) / FEWS NET – badanie umieralności, 2.05.2013', 'https://fsnau.org/in-focus/technical-release-study-suggests-258000-somalis-died-due-severe-food-insecurity-and-famine-'],
  horn: ['UNDRR – Horn of Africa floods and drought 2020–2023', 'https://www.undrr.org/resource/horn-africa-floods-and-drought/2020-2023'],
  arg: ['Dialogue Earth – La Niña a susza w Argentynie', 'https://dialogue.earth/en/climate/370215-la-nina-ends-but-drought-exposes-deeper-problems-for-argentina/'],
  tha: ['Wikipedia – 2011 Thailand floods', 'https://en.wikipedia.org/wiki/2011_Thailand_floods'],
  col: ['RPP / Dirección de Gestión del Riesgo – czerwiec 2011', 'https://rpp.pe/mundo/actualidad/colombia-lluvias-dejan-469-muertos-en-catorce-meses-noticia-373653'],
  tex: ['Drovers (Texas AgriLife Extension) – marzec 2012', 'https://www.drovers.com/news/2011-texas-agricultural-drought-losses-total-7-62-billion'],
  bgd: ['ReliefWeb – raporty sytuacyjne UNDRO, powodzie 1988', 'https://reliefweb.int/report/bangladesh/bangladesh-floods-aug-1988-undro-situation-reports-1-13'],
  moz: ['Wikipedia – 2000 Mozambique flood', 'https://en.wikipedia.org/wiki/2000_Mozambique_flood']
};

export const EVENTS: ImpactLocation[] = [
  /* ===== Ameryka Południowa ===== */
  { name: 'Peru', region: 'Ameryka Południowa', lon: -78.5, lat: -9.5, ev: [
    { ph: 'super', yrs: '1972–1973', kind: 'other', type: 'Załamanie połowów sardeli peruwiańskiej (anchoveta), kryzys rybołówstwa i przemysłu mączki rybnej',
      aff: 'Połów spadł z 10,3 mln t (1971) do 4,4 mln t (1972); w 1970 r. produkty rybne dawały ok. 1/3 wpływów z eksportu Peru. Ponad 200 mln USD długu sektora wobec banków państwowych, nacjonalizacja branży w 1973 r.',
      note: 'Do załamania przyczyniło się także wcześniejsze przełowienie.', src: SRC['anch'] },
    { ph: 'super', yrs: '1997–1998', kind: 'wet', type: 'Ulewy i powodzie na wybrzeżu, osuwiska, straty w rybołówstwie i rolnictwie',
      aff: 'Straty ok. 3,5 mld USD (ok. 4,5% PKB); wzrost PKB w 1998 r. niższy nawet o 2,8 pkt proc. W całej Wspólnocie Andyjskiej ok. 135 tys. domów uszkodzonych lub zniszczonych.', src: SRC['eird'] } ] },
  { name: 'Ekwador', region: 'Ameryka Południowa', lon: -79.8, lat: -1.6, ev: [
    { ph: 'super', yrs: '1982–1983', kind: 'wet', area: 'Ekwador i północne Peru', type: 'Ulewy i powodzie na wybrzeżu, niszczenie infrastruktury',
      aff: 'Ok. 600 ofiar śmiertelnych, straty ok. 650 mln USD (Ekwador i płn. Peru łącznie).', src: SRC['nps'] },
    { ph: 'super', yrs: '1997–1998', kind: 'wet', type: 'Powodzie na nizinach przybrzeżnych',
      aff: 'Straty ok. 2,9 mld USD, czyli 14,6% PKB Ekwadoru – największe względne straty w regionie.', src: SRC['eird'] } ] },
  { name: 'Płd. Brazylia, płn. Argentyna, Paragwaj', region: 'Ameryka Południowa', lon: -55, lat: -27, ev: [
    { ph: 'super', yrs: '1982–1983', kind: 'wet', type: 'Długotrwałe ulewy i powodzie w dorzeczu Parany',
      aff: '170 ofiar śmiertelnych, ok. 600 tys. ewakuowanych, straty ok. 3 mld USD.', src: SRC['nps'] } ] },
  { name: 'Brazylia – stan Amazonas', region: 'Ameryka Południowa', lon: -60, lat: -3.1, ev: [
    { ph: 'nino', yrs: '2023', kind: 'dry', type: 'Rekordowa susza, gwałtowny spadek poziomu Rio Negro',
      aff: '60 z 62 gmin stanu dotkniętych suszą (w tym Manaus); ok. 500 tys. osób z utrudnionym dostępem do wody i żywności; ponad 100 martwych delfinów rzecznych w jeziorze Tefé.',
      note: 'Suszę wywołało El Niño w połączeniu z ociepleniem tropikalnego północnego Atlantyku.', src: SRC['amz'] } ] },
  { name: 'Argentyna', region: 'Ameryka Południowa', lon: -61.5, lat: -33.5, ev: [
    { ph: 'nina', yrs: '2022–2023', kind: 'dry', type: 'Historyczna susza w Pampie, najgorsze zbiory soi od 23 lat',
      aff: 'Straty dla gospodarki ok. 20 mld USD (ponad 3% PKB); zbiory soi, kukurydzy i pszenicy o ok. 45% niższe r/r; wpływy z eksportu soi niższe o ok. 8 mld USD.',
      note: 'Główną przyczyną była trzecia z rzędu La Niña; zmiana klimatu pogłębiła suszę (World Weather Attribution).', src: SRC['arg'] } ] },
  { name: 'Kolumbia', region: 'Ameryka Południowa', lon: -74.5, lat: 6.2, ev: [
    { ph: 'nina', yrs: '2010–2011', kind: 'wet', type: 'Rekordowa pora deszczowa: powodzie i osuwiska',
      aff: '3,66 mln osób dotkniętych, 469 ofiar śmiertelnych, 13 351 domów zniszczonych i ok. 492 tys. uszkodzonych; 29 z 32 departamentów; ponad 1,2 mln ha zalanych upraw (IV 2010 – VI 2011).', src: SRC['col'] } ] },

  /* ===== Ameryka Północna i Środkowa ===== */
  { name: 'Kalifornia, USA', region: 'Ameryka Północna', lon: -120, lat: 36.5, ev: [
    { ph: 'super', yrs: '1997–1998', kind: 'wet', type: 'Zimowe sztormy, ulewy, osuwiska i powodzie',
      aff: '17 ofiar śmiertelnych, straty ok. 883 mln USD; 40 hrabstw ogłoszonych federalnym obszarem klęski.', src: SRC['cal'] } ] },
  { name: 'Teksas, USA', region: 'Ameryka Północna', lon: -99.5, lat: 31.5, ev: [
    { ph: 'nina', yrs: '2011', kind: 'dry', type: 'Rekordowa susza i upały – najsuchszy rok w historii pomiarów w Teksasie',
      aff: 'Straty w rolnictwie 7,62 mld USD (hodowla 3,23 mld, bawełna 2,2 mld); porzucono 55% zasianych pól bawełny. Najdroższa susza w historii stanu.',
      note: 'Susza przypadła na La Niñę 2010–12.', src: SRC['tex'] } ] },
  { name: 'Suchy Korytarz Ameryki Środkowej', region: 'Gwatemala, Salwador, Honduras', lon: -88.5, lat: 14.2, ev: [
    { ph: 'super', yrs: '2014–2016', kind: 'dry', type: 'Wieloletnia susza, utrata zbiorów podstawowych zbóż',
      aff: 'Ok. 3,5 mln osób potrzebujących pomocy humanitarnej; 1,6 mln w umiarkowanej lub ciężkiej niepewności żywnościowej. WFP wspierało ok. 1 mln osób rocznie.', src: SRC['cam'] } ] },
  { name: 'Panama', region: 'Ameryka Środkowa', lon: -79.7, lat: 9.1, ev: [
    { ph: 'nino', yrs: '2023–2024', kind: 'dry', type: 'Susza, rekordowo niski poziom jeziora Gatún',
      aff: 'Tranzyt przez Kanał Panamski ograniczony z 38 do 24 statków dziennie (ok. 30% mniej); październik 2023 r. z opadami o 43% poniżej normy. Jezioro Gatún zaopatruje w wodę pitną miliony mieszkańców (m.in. miasto Panama i Colón).', src: SRC['pan'] } ] },

  /* ===== Afryka ===== */
  { name: 'Afryka Południowa (region SADC)', region: 'Zimbabwe, Zambia, Malawi, Mozambik i in.', lon: 30, lat: -18, ev: [
    { ph: 'super', yrs: '2015–2016', kind: 'dry', type: 'Najcięższa od dekad susza i nieurodzaj',
      aff: 'Ok. 40 mln osób w niepewności żywnościowej (ok. 14% ludności SADC); Zimbabwe i Malawi ogłosiły stan klęski; regionalny apel o 2,4 mld USD.', src: SRC['saf15'] },
    { ph: 'nino', yrs: '1991–1992', kind: 'dry', type: '„Susza stulecia” – opady nawet o 90% poniżej normy',
      aff: 'Ok. 18 mln osób zagrożonych głodem w regionie; zapotrzebowanie na import zbóż 7,73 mln t.',
      note: 'Susza przypadła na El Niño 1991–92.', src: SRC['saf92'] },
    { ph: 'nino', yrs: '2023–2024', kind: 'dry', type: 'Susza i nieurodzaj w sezonie 2023/24',
      aff: 'Ok. 68 mln osób (17% ludności regionu) potrzebujących pomocy wg SADC.', src: SRC['saf24'] } ] },
  { name: 'Mozambik', region: 'Afryka Południowo-Wschodnia', lon: 33, lat: -24.5, ev: [
    { ph: 'nina', yrs: '2000', kind: 'wet', type: 'Powodzie na Limpopo i cyklon Eline',
      aff: 'Ok. 700–800 ofiar śmiertelnych; ok. 463 tys. osób przesiedlonych lub bez dachu nad głową; straty ok. 500 mln USD.',
      note: 'Rekordowe opady przypadły na La Niñę 1999–2000.', src: SRC['moz'] } ] },
  { name: 'Etiopia', region: 'Róg Afryki', lon: 39.5, lat: 9, ev: [
    { ph: 'super', yrs: '2015–2016', kind: 'dry', type: 'Ekstremalna susza, nieudane pory deszczowe',
      aff: '10,2 mln osób potrzebujących pilnej pomocy humanitarnej (rząd Etiopii i agencje ONZ, początek 2016 r.); potrzeby humanitarne potroiły się od początku 2015 r.', src: SRC['eth'] } ] },
  { name: 'Kenia i płd. Somalia', region: 'Afryka Wschodnia', lon: 40.5, lat: -0.5, ev: [
    { ph: 'super', yrs: '1997–1998', kind: 'other', type: 'Najgorsze powodzie od 1961 r. i epidemia gorączki doliny Rift',
      aff: 'Opady 60–100 razy powyżej normy sezonowej; szacunkowo ok. 89 tys. zakażeń gorączką doliny Rift; 478 niewyjaśnionych zgonów zgłoszonych w grudniu 1997; utrata ok. 70% owiec i kóz w badanych stadach.',
      note: 'Ulewy od października 1997 do stycznia 1998 przypadły na Super El Niño.', src: SRC['rvf'] } ] },
  { name: 'Somalia', region: 'Róg Afryki', lon: 45.5, lat: 3.5, ev: [
    { ph: 'nino', yrs: '2023', kind: 'wet', type: 'Powodzie pory deszczowej Deyr („raz na stulecie”)',
      aff: 'Ok. 1,2 mln osób dotkniętych (9.11.2023), prognoza do 1,6 mln; do 1,5 mln ha pól zagrożonych.',
      note: 'Opady wzmocniło El Niño razem z dodatnim dipolem Oceanu Indyjskiego.', src: SRC['som23'] },
    { ph: 'nina', yrs: '2010–2012', kind: 'dry', type: 'Najsuchszy rok od 60 lat, klęska głodu',
      aff: 'Ok. 258 tys. zgonów (X 2010 – IV 2012), w tym ok. 133 tys. dzieci poniżej 5 lat – 4,6% ludności płd. i środk. Somalii.',
      note: 'Nieudane pory deszczowe zbiegły się z silną La Niñą 2010–11; tragedię pogłębiły konflikt i skok cen żywności.', src: SRC['som11'] } ] },
  { name: 'Róg Afryki', region: 'Etiopia, Kenia, Somalia', lon: 38.5, lat: 4, ev: [
    { ph: 'nina', yrs: '2020–2023', kind: 'dry', type: 'Najdłuższa susza w historii pomiarów – kolejne nieudane pory deszczowe',
      aff: 'Ponad 30 mln osób w niepewności żywnościowej (2020–22); w Somalii 7,8 mln dotkniętych (46% ludności, X 2022); w Kenii 6,4 mln potrzebujących pomocy w 2023 r.',
      note: 'Trzyletnia La Niña 2020–22 była w regionie najsilniejsza od 70 lat.', src: SRC['horn'] } ] },

  /* ===== Azja ===== */
  { name: 'Indonezja', region: 'Azja Południowo-Wschodnia', lon: 113.5, lat: -1.5, ev: [
    { ph: 'super', yrs: '1997–1998', kind: 'fire', type: 'Najgorsza susza od ok. 50 lat, pożary lasów i torfowisk, smog transgraniczny',
      aff: 'Smog dotknął ok. 75 mln ludzi (w tym 48 mln Indonezyjczyków); spłonęło ok. 25 mln akrów (ok. 10 mln ha); straty ok. 9 mld USD.', src: SRC['idn97'] },
    { ph: 'super', yrs: '2015', kind: 'fire', type: 'Susza i pożary torfowisk, smog nad regionem',
      aff: '2,6 mln ha spalonych (VI–X 2015); koszt ok. 16,1 mld USD, czyli 1,9% PKB (Bank Światowy).',
      note: 'Sezon pożarów przypadł na Super El Niño 2015–16, które przedłużyło porę suchą.', src: SRC['idn15'] } ] },
  { name: 'Papua-Nowa Gwinea', region: 'Oceania', lon: 145, lat: -6, ev: [
    { ph: 'super', yrs: '1997–1998', kind: 'dry', type: 'Susza i przymrozki w górach, pożary',
      aff: 'W grudniu 1997 r. ok. 260 tys. osób jadło „pokarm głodowy”, a kolejne 980 tys. – skąpe porcje żywności słabej jakości; Australia zrzucała żywność dla ok. 100 tys. osób w miejscach dostępnych tylko z powietrza.', src: SRC['png'] } ] },
  { name: 'Chiny – dorzecze Jangcy', region: 'Azja Wschodnia', lon: 114, lat: 30, ev: [
    { ph: 'super', yrs: '1998', kind: 'wet', type: 'Katastrofalne powodzie na Jangcy i w płn.-wsch. Chinach',
      aff: 'Ok. 180 mln poszkodowanych, 3 704–4 150 ofiar śmiertelnych, ok. 15 mln bez dachu nad głową; straty ok. 24 mld USD.',
      note: 'Lato 1998 r. to faza wygasania Super El Niño; badacze opisują ten związek jako pośredni.', src: SRC['chn'] } ] },
  { name: 'Wietnam – delta Mekongu', region: 'Azja Południowo-Wschodnia', lon: 105.8, lat: 10, ev: [
    { ph: 'super', yrs: '2015–2016', kind: 'dry', type: 'Susza i wdzieranie się słonej wody do delty',
      aff: 'Ponad 2 mln osób dotkniętych, ok. 2 mln z niedoborem wody, 1,1 mln w niepewności żywnościowej; 14 prowincji ogłosiło stan wyjątkowy.', src: SRC['vnm'] } ] },
  { name: 'Indie', region: 'Azja Południowa', lon: 78, lat: 23, ev: [
    { ph: 'nino', yrs: '2009', kind: 'dry', type: 'Słaby monsun i susza',
      aff: 'Opady 77% normy (−23%); susza ogłoszona w 352 dystryktach w 15 stanach; produkcja zbóż spadła z 234 do 218 mln t (ok. −6,9%).',
      note: 'NOAA klasyfikuje 2009 r. jako rok umiarkowanego El Niño.', src: SRC['ind09'] } ] },
  { name: 'Pakistan', region: 'Azja Południowa', lon: 68.5, lat: 27.5, ev: [
    { ph: 'nina', yrs: '2010', kind: 'wet', type: 'Powodzie monsunowe – ok. 1/5 kraju pod wodą',
      aff: 'Ok. 20 mln osób dotkniętych, 1 985 ofiar śmiertelnych; straty szacowane nawet na 43 mld USD.',
      note: 'Mapa anomalii opadów NASA wiąże wyjątkowo intensywny monsun z La Niñą.', src: SRC['pak10'] },
    { ph: 'nina', yrs: '2022', kind: 'wet', type: 'Rekordowe powodzie monsunowe',
      aff: 'Ok. 33 mln osób dotkniętych, 1 739 ofiar śmiertelnych, ponad 2,1 mln bez dachu nad głową; szkody ok. 14,9 mld USD i straty ok. 15,2 mld USD (rząd Pakistanu).',
      note: 'Powódź przypadła na potrójną La Niñę 2020–23; główne przyczyny to rekordowy monsun, topnienie lodowców i zmiana klimatu.', src: SRC['pak22'] } ] },
  { name: 'Bangladesz', region: 'Azja Południowa', lon: 90.4, lat: 23.7, ev: [
    { ph: 'nina', yrs: '1988', kind: 'wet', type: 'Katastrofalne powodzie monsunowe – ponad połowa kraju pod wodą',
      aff: '25–28 mln osób bez dachu nad głową (szacunki oficjalne); dotknięte ok. 2/3 ze 110 mln mieszkańców w 50 z 64 dystryktów; oficjalnie ok. 500 ofiar (wrzesień 1988), wiele z powodu ukąszeń węży i skażonej wody.',
      note: 'Powódź zbiegła się z silną La Niñą 1988–89.', src: SRC['bgd'] } ] },
  { name: 'Tajlandia', region: 'Azja Południowo-Wschodnia', lon: 100.5, lat: 14.6, ev: [
    { ph: 'nina', yrs: '2011', kind: 'wet', type: 'Wielka powódź (Bangkok, Ajutthaja)',
      aff: '13,6 mln osób dotkniętych, 815 ofiar śmiertelnych; 65 prowincji obszarem klęski; straty ok. 46,5 mld USD (Bank Światowy).',
      note: 'Długotrwałe opady wzmocniła wieloletnia La Niña.', src: SRC['tha'] } ] },

  /* ===== Australia ===== */
  { name: 'Australia – Wiktoria i Australia Płd.', region: 'Australia', lon: 144, lat: -37, ev: [
    { ph: 'super', yrs: '1982–1983', kind: 'fire', type: 'Susza, burze pyłowe i pożary buszu (Środa Popielcowa, 16.02.1983)',
      aff: '75 ofiar pożarów; ponad 3 700 budynków zniszczonych lub uszkodzonych, ok. 2 545 osób i rodzin bez dachu nad głową; padło ponad 340 tys. owiec; koszt ponad 400 mln AUD (ceny z 1983 r.).',
      note: 'Pożary poprzedziła susza wiązana z El Niño – opady zimą i wiosną 1982 r. nawet o połowę niższe od dotychczasowego minimum.', src: SRC['ash'] } ] },
  { name: 'Australia – Queensland', region: 'Australia', lon: 151.5, lat: -26.5, ev: [
    { ph: 'nina', yrs: '2010–2011', kind: 'wet', type: 'Katastrofalne powodzie (Brisbane, Toowoomba)',
      aff: 'Ponad 200 tys. osób bezpośrednio dotkniętych; 78% stanu ogłoszone obszarem klęski (ponad 2,5 mln mieszkańców); ok. 29 tys. domów i firm zalanych; 33+ ofiar; straty ubezpieczone 2,38 mld AUD, łączny koszt 14,1 mld AUD.',
      note: 'Powodzie poprzedził najmokrzejszy grudzień w historii stanu w czasie silnej La Niñy.', src: SRC['qld'] } ] }
];

export const DESC: Record<EnsoPhase, string> = {
  nina: 'Wzmocnione pasaty pchają ciepłą wodę na zachód. Zimny jęzor na równikowym Pacyfiku rozciąga się daleko na zachód, a ulewy skupiają się nad Indonezją i Australią. Skutki są w dużej mierze odwrotne do El Niño.',
  neu: 'Pasaty utrzymują ciepły basen przy Indonezji (~29–30 °C) i zimny jęzor wzdłuż równika na wschodnim Pacyfiku. Konwekcja i ulewy skupiają się nad zachodnim Pacyfikiem.',
  nino: 'Pasaty słabną, ciepła woda przesuwa się na wschód, a strefa konwekcji wędruje ku środkowemu Pacyfikowi. Zaczynają działać telekoneksje, czyli zmiany pogody daleko od Pacyfiku.',
  super: 'Anomalia Niño 3.4 powyżej +2 °C. Cyrkulacja Walkera się załamuje, ulewy nawiedzają Peru i Ekwador, a Indonezję, Australię, Indie i południową Afrykę susza. Średnia temperatura globu rośnie. Przykłady: 1982–83, 1997–98, 2015–16.'
};

export const TEMP_HEX: [number, string][] = [
  [-2, '#d6e2f5'],
  [0, '#4b4fa6'],
  [5, '#1d2e8c'],
  [10, '#1d4fae'],
  [15, '#1f86cf'],
  [20, '#2fc0d6'],
  [23, '#8be08a'],
  [25.5, '#f4e25a'],
  [27.5, '#ffa233'],
  [29.2, '#f0472b'],
  [31, '#9b0f2e']
];

export const ANOM_HEX: [number, string][] = [
  [-3, '#1b3a9c'],
  [-1.5, '#4f9ddc'],
  [0, '#eef1f6'],
  [1.5, '#ff9a4a'],
  [3, '#b8122a']
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

export const MON = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
];

export const PRESETS: Preset[] = [
  { ph: 'nina', label: 'La Niña', strength: -1.6 },
  { ph: 'neu', label: 'Neutralny', strength: 0 },
  { ph: 'nino', label: 'El Niño', strength: 1.2 },
  { ph: 'super', label: 'Super El Niño', strength: 2.6, hot: true }
];
