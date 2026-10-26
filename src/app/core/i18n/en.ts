import { Dict } from './i18n.types';

export const EN: Dict = {
  htmlLang: 'en',
  locale: 'en-US',
  docTitle: 'El Niño 2026 in 3D - Interactive Visualization | KMD Labs',
  metaDescription: 'Explore El Niño and La Niña on an interactive 3D globe: real NOAA sea temperatures, winds, the Walker circulation and impacts worldwide.',
  langName: 'English',

  phase: { super: 'Super El Niño', nino: 'El Niño', nina: 'La Niña', neu: 'Neutral' },
  desc: {
    nina: 'Stronger trade winds push warm water to the west. The cold tongue along the equatorial Pacific stretches far west, and heavy rain concentrates over Indonesia and Australia. The impacts are largely the opposite of El Niño.',
    neu: 'The trade winds keep a warm pool near Indonesia (~29–30 °C) and a cold tongue along the equator in the eastern Pacific. Convection and heavy rain concentrate over the western Pacific.',
    nino: 'The trade winds weaken, warm water shifts east and the convection zone moves towards the central Pacific. Teleconnections kick in – weather changes far away from the Pacific.',
    super: 'The Niño 3.4 anomaly exceeds +2 °C. The Walker circulation collapses, downpours hit Peru and Ecuador, while Indonesia, Australia, India and southern Africa suffer drought. The global mean temperature rises. Examples: 1982–83, 1997–98, 2015–16.'
  },
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

  readoutSource: 'Data source: NOAA OISST v2.1 sea surface temperature',
  readoutTitle: 'Anomaly',
  loadingMap: 'Loading continents…',
  mapError: 'Could not load land outlines.',
  changeLanguage: 'Language',
  settingsTitle: 'Settings',
  settingsSubtitle: 'Language & units',
  settingsAria: 'Settings',
  temperatureUnit: 'Temperature unit',
  unitCelsius: 'Celsius (°C)',
  unitFahrenheit: 'Fahrenheit (°F)',

  ensoLabel: 'ENSO phase',
  strengthAria: 'ENSO strength',
  probText: '2026 peak likelihood:',
  probTitle: 'Share of the analog ensemble whose Oct–Dec peak reaches the value shown — five past seasons matched against '
    + 'the current trajectory of the NOAA CPC Niño 3.4 record (1950–present). A coarse estimate, not a dynamical forecast.',
  probSource: 'NOAA CPC',
  playStart: '4-yr cycle',
  playStop: 'Stop',
  playbackSpeed: 'Playback speed',
  speedNormal: 'Normal',
  detailsAria: 'Details',
  thermoChip: 'Thermocline',
  thermoAria: 'Thermocline cross-section along the equator',
  thermoTitle: 'Thermocline along the equator (Pacific, 0–300 m)',
  thermoNote: 'The white line is the thermocline – the boundary between warm surface water and cold deep water. It flattens during El Niño and tilts more steeply during La Niña.',
  descChip: 'Phase info',
  descChipTitle: 'What happens in this phase',
  close: 'Close',
  hidePanel: 'Collapse controls',
  showPanel: 'Expand controls',
  ensoTab: 'ENSO state',
  viewTab: 'Controls',
  hintNeutral: 'There are no impact pins in the neutral phase. Choose La Niña, El Niño or Super El Niño to inspect historical events.',
  hintPins: (count, phase) => `${count} locations with documented impacts of ${phase}. Click any pin on the globe to inspect the event data and source.`,

  chooseView: 'View',
  shareLink: 'Share a link',
  shareTitle: 'Share',
  shareSubtitle: 'Link to app, specific date, ENSO state or scan QR code',
  shareAppUrl: 'App link',
  shareQrCode: 'Scan QR code to open on mobile',
  copyLink: 'Copy',
  shareDate: 'Link to this date',
  shareState: 'Link to this ENSO state',
  linkCopied: 'Link copied',
  linkCopyFailed: 'Could not copy – use the address bar',
  viewTemp: 'Water temperature',
  viewAnom: 'Water temperature',
  viewWalker: 'Walker cell',
  viewImpacts: 'Impacts',
  viewCurrent: 'Current situation',
  sstOnDateTitle: 'Mean sea-surface temperature in the Niño 3.4 box for the selected date',
  dailyConditionsLabel: 'Tropical conditions',
  waterTempLabel: 'Water',
  airTempLabel: 'Air',
  windSpeedLabel: 'Wind',
  airTempTitle: 'Daily 2 m air temperature for the selected date, averaged over the tropics.',
  windSpeedTitle: 'Daily 10 m wind speed for the selected date, averaged over the tropics.',
  timelineNow: 'Latest',
  live: 'Latest',
  timelineForecast: 'Forecast',
  currentLive: 'Latest',
  currentAt: time => `as of ${time} UTC`,
  currentWind: '10 m wind',
  currentWaves: 'waves',
  scaleSstNow: 'Water temperature – latest',
  scaleSstOn: date => `Water temperature · ${date}`,
  scaleNoData: 'no data',
  currentSources: 'Sources:',
  currentSourceTitle: 'Open-Meteo.com (CC BY 4.0 licence) – current wind and waves from weather models (incl. ECMWF), 10° grid, refreshed on every site deploy',
  sstSourceTitle: (date, preliminary) => `NOAA OISST v2.1 – daily sea surface temperature from satellites, ships and buoys, ${date}${preliminary ? ' (preliminary)' : ''}; averaged to a 1° grid`,
  currentLoading: 'Loading current data…',
  currentError: 'Current wind and wave data is unavailable.',
  scaleSst: 'Sea surface (water) temperature (°C)',
  scaleAnom: 'Water temperature anomaly vs. normal (°C)',
  scaleSstShort: 'Water temperature',
  scaleAnomShort: 'Temperature anomaly',
  impactsTab: 'Legend',
  flowLegendTitle: 'Ocean & Air Circulation',
  flowWindLabel: 'Surface winds (trade winds)',
  flowWaveLabel: 'Ocean water movement & waves',
  flowDesc: 'Grey lines trace low-level winds blowing toward the warm pool. Bright white lines showcase ocean water movement and equatorial Kelvin waves flowing across the basins.',
  layersAria: 'Layers & tools',
  layerAtm: 'Atmosphere',
  layerAtmTitle: 'Wind, waves and convective clouds',
  layerEvents: 'Events',
  layerEventsTitle: 'Pins with historical impacts of the phase',
  layerRotate: 'Auto-rotate',
  layerRotateTitle: 'Rotate the globe automatically',
  layerGlossary: 'Glossary',
  layerGlossaryTitle: 'Key terms – plain explanations',
  pinLegendTitle: phase => `Impacts of ${phase}:`,
  kindDry: 'Drought / heat',
  kindFire: 'Wildfires',
  kindWet: 'Floods / rain',
  kindOther: 'Fisheries / disease',
  rainDry: 'Drier than normal',
  rainWet: 'Wetter than normal',
  rainTitleNina: 'La Niña rainfall anomalies:',
  rainTitleNeutral: 'El Niño rainfall anomalies (muted in Neutral):',
  rainTitleNino: 'El Niño rainfall anomalies:',
  sources: 'Sources:',
  sourceOisstTooltip: 'NOAA OISST v2.1 – daily 0.5° sea surface temperature grid from satellites, ships and buoys',
  sourceOpenMeteoTooltip: 'Open-Meteo (CC BY 4.0) – global marine wave and 10 m surface wind forecast data',

  lblConvection: 'Convection & heavy rain',
  lblTrades: '← Trade winds',
  lblKelvin: 'Kelvin waves →',
  lblIod: 'Indian Ocean Dipole (IOD)',
  rainDryShort: 'drier',
  rainWetShort: 'wetter',

  mArea: 'Area',
  mAnomaly: 'Anomaly',
  mScale: 'Scale of impact',
  mRole: 'Role of ENSO:',
  mSource: 'Source:',

  walkerAria: 'Walker circulation and thermocline – cross-section along the equator',
  walkerCaption: 'Walker circulation & thermocline · cross-section along the equator (0°) · atmosphere 0–16 km · ocean 0–300 m (vertical scale exaggerated)',
  walkerNow: 'latest',
  walkerCycle: 'cycle',
  walkerCurrent: phase => `Current state: ${phase} · Press Play for step-by-step walkthrough`,
  walkerCycleCaption: date => (date ? `ENSO cycle · ${date}` : 'ENSO cycle'),
  walkerPrev: 'Previous step',
  walkerNext: 'Next step',
  walkerPlay: 'Play walkthrough',
  walkerPause: 'Pause walkthrough',
  walkerStep: (i, title) => `Step ${i}: ${title}`,
  steps: [
    'Starting point: the neutral state',
    'Trade winds blow near the surface – from east to west, from South America towards Indonesia',
    'The wind pushes warm water west: a warm pool builds up near Indonesia and the thermocline tilts',
    'Off South America, cold deep water rises to replace the water pushed away (upwelling)',
    'Over the warm pool, moist air rises – thunderclouds grow and heavy rain falls',
    'Below the tropopause, the now-dry air flows back east',
    'Over the cool eastern Pacific the air sinks and it is dry – the loop closes: this is the Walker circulation',
    'La Niña: the circulation speeds up – stronger trade winds, the cold tongue reaches far west',
    'The trade winds weaken – warm water flows back east as a Kelvin wave below the surface',
    'El Niño: convection moves over the central Pacific, the Walker cell weakens and breaks apart',
    'Super El Niño: the thermocline flattens – downpours in Peru and Ecuador, drought in Indonesia and Australia',
    'The trade winds recover, the neutral state returns – and the cycle starts again'
  ],
  canvas: {
    tropopause: 'Tropopause ~16 km',
    thermocline: 'thermocline',
    kelvin: 'Kelvin wave →',
    indonesia: 'Indonesia',
    andes: 'Andes',
    trades: '← trade winds',
    aloft: 'return flow aloft →',
    sinkDry: 'sinking · dry',
    rising: 'rising · downpours',
    sinkDrought: 'sinking · drought',
    westerly: 'westerly wind →',
    warmPool: 'warm pool',
    coldTongue: 'cold tongue'
  },

  splashLoading: 'Loading climate data…',
  splashPreparing: 'Preparing the globe…',
  splashError: 'Some data could not be loaded — starting with the available layers.',

  about: {
    docTitle: 'About us – KMD Labs, the team behind El Niño 2026 in 3D',
    metaDescription: 'Meet KMD Labs, a team of three building interactive data visualisations: data engineering, machine learning, 3D graphics and cartography. Open to new projects.',
    cta: 'Open to new projects',
    contact: 'Contact',
    openAbout: 'About KMD',
    title: 'About us',
    kicker: 'laboratory',
    leads: [
      'kmd-labs is a three-person team that grew out of Viadrus AI, the first Polish team to win the European final of the CASSINI hackathon run by the European Union Agency for the Space Programme (EUSPA). Our winning solution used satellite data to detect leaks in water supply networks early.',
      'After the final we decided to pool the computing power of our grey matter. Each of us comes from a different field, but we are bound by a passion for geoinformatics and satellite data, as well as for anomaly detection, machine learning, software development and geovisualisation.',
      'Got data and no idea how to show it on a map or in space? Write to us!'
    ],
    refs: [
      {
        label: '11th CASSINI hackathon – EC report',
        href: 'https://defence-industry-space.ec.europa.eu/orbit-water-tap-11th-cassini-hackathon-2026-05-08_en',
        title: 'defence-industry-space.ec.europa.eu – From Orbit to the Water Tap: 11th CASSINI Hackathon',
        aria: 'European Commission report on the 11th CASSINI hackathon'
      },
      {
        label: 'CASSINI Hackathons – portfolio',
        href: 'https://www.cassini.eu/hackathons/portfolio',
        title: 'cassini.eu/hackathons/portfolio – Meet the Winners',
        aria: 'CASSINI Hackathons – portfolio of winning teams'
      },
      {
        label: 'kmd-labs on LinkedIn',
        href: 'https://www.linkedin.com/company/kmd-lab',
        title: 'linkedin.com/company/kmd-lab – kmd-labs',
        aria: 'kmd-labs company profile on LinkedIn'
      }
    ],
    back: 'Back to the globe',
    tasksLabel: 'Focus',
    photoSoon: 'Photo coming soon',
    linkedinAria: name => `LinkedIn profile – ${name}`,
    githubAria: name => `GitHub profile – ${name}`,
    footer: 'KMD · interactive data visualisation',
    people: [
      {
        bio: 'An environmental engineer by training and an AI engineer by choice. My adventure with code began in 2019 with three.js and generative art, which led to building my own augmented reality (AR) solutions. Today I focus on artificial intelligence and machine learning, connecting technology with solving real problems – as shown by winning the 11th edition of the CASSINI hackathon. Beyond coding I contribute to open source, play games, make music and take photos.',
        tasks: ['Fullstack development', '3D graphics', 'DevOps', 'UX/UI', 'Artificial intelligence', 'Machine learning']
      },
      {
        bio: 'Master of Administration from the University of Wrocław. Professionally I work as a data engineer at a large FMCG company. Besides managing databases I specialise in anomaly detection, data quality control and process automation. In the Viadrus AI project I brought the whole team together and was responsible for data acquisition. I worked with Marcin before at the same financial institution – as an intern I asked him a great many questions. I like proving that the impossible is possible after all. In my free time I photograph and paint landscapes and I am into maps and strategy games.',
        tasks: ['Data engineering', 'Machine learning', 'Data analytics', 'Data acquisition', 'Data quality']
      },
      {
        bio: 'I am a graduate of Marine Geography at the Faculty of Earth Sciences, University of Szczecin; of Geoinformation at the Faculty of Geographical and Geological Sciences, Adam Mickiewicz University in Poznań; and of Artificial Intelligence in Corporate Finance and Controlling at Kozminski University. For 12 years I have worked as a functional consultant for ERP-class systems. After hours I build systems that detect anomalies in financial and satellite data using machine learning. Creating geovisualisations is another great passion of mine. I have been developing my artificial intelligence skills for 4 years. I believe the future belongs to domain experts who can use AI effectively as a tool in their everyday work. Outside work I am into strength training, board games, Magic: The Gathering and gardening.',
        tasks: ['Geoinformatics', 'Geovisualisation', 'Anomaly detection', 'Machine learning', 'Artificial intelligence']
      }
    ]
  },

  viewCycles: 'Previous cycles and forecast',
  cyclesAria: 'Previous ENSO cycles and the analog forecast',
  cyclesTitle: 'Every ENSO event since 1950',
  cyclesDetails: 'Data & analogs',
  cyclesDetailsTitle: 'Event history, analog forecast & methodology',
  cyclesNote: 'Each line is one event: the Niño 3.4 index (ONI, a 3-month running mean) across two calendar years. '
    + 'The seasons the forecast leans on are highlighted; the current event is the thick line.',
  cyclesBarrier: 'An analog forecast is a statistical baseline, not a dynamical model. Five members drawn from a record of '
    + 'ten comparable events carry real uncertainty, and skill drops sharply once a horizon crosses the spring predictability barrier.',
  cyclesLegendPast: 'Past events',
  cyclesLegendAnalog: 'Analogs used',
  cyclesLegendCurrent: 'Current event',
  cyclesLegendForecast: 'Forecast (p10–p90)',
  cyclesAxisOni: 'ONI (°C)',
  cyclesYearN: n => `year ${n}`,
  cyclesCatalogue: 'Strongest El Niño events',
  cyclesColSeason: 'Season',
  cyclesColPeak: 'Peak',
  cyclesColTier: 'Class',
  cyclesColLength: 'Length',
  cyclesMonthsShort: n => `${n} mo`,
  cyclesOngoing: 'in progress',
  cyclesProvisional: date => `provisional · week to ${date}`,
  cyclesAnalogTitle: 'Closest analogs',
  cyclesAnalogNote: (window, members) =>
    `Matched on the last ${window} months of the index; the ${members} best seasons, each shifted to continue from today's level.`,
  cyclesAnalogMatch: 'match',
  cyclesAnalogWeight: 'weight',
  cyclesForecastPeak: (lo, hi, window) =>
    `Projected ${window} peak: ${lo >= 0 ? '+' : '−'}${Math.abs(lo).toFixed(1)} to ${hi >= 0 ? '+' : '−'}${Math.abs(hi).toFixed(1)} °C`,
  cyclesRecordNote: (first, last) => `NOAA CPC monthly Niño 3.4, ${first} – ${last}`,
  cyclesLoading: 'Loading the historical record…',
  cyclesError: 'The historical record is unavailable.',
  tier: {
    super: 'Super',
    strong: 'Strong',
    moderate: 'Moderate',
    weak: 'Weak'
  },

  glTitle: 'Glossary & Key Terms',
  glSearch: 'Search terms, e.g. thermocline…',
  glSearchAria: 'Search for a term',
  glEmpty: q => `No terms match “${q}”.`,
  wikiIn: { pl: ' (PL)', en: '', es: ' (ES)' },
  glossary: [
    {
      title: 'Basics',
      terms: [
        { term: 'ENSO (El Niño – Southern Oscillation)', text: 'A natural climate swing in the equatorial Pacific that repeats every 2–7 years. The ocean and the atmosphere “seesaw” together between three states: El Niño, La Niña and neutral.', wiki: 'https://en.wikipedia.org/wiki/El_Ni%C3%B1o%E2%80%93Southern_Oscillation', wikiLang: 'en' },
        { term: 'El Niño', text: 'The warm phase of ENSO. The trade winds weaken, warm water spreads to the eastern Pacific and the heavy rain moves from Indonesia to the middle of the ocean. The name (“the Christ Child”) comes from Peruvian fishermen, as it usually peaks around Christmas.', wiki: 'https://en.wikipedia.org/wiki/El_Ni%C3%B1o', wikiLang: 'en' },
        { term: 'La Niña', text: 'The cool phase of ENSO, largely the reverse of El Niño. The trade winds are stronger than usual, cold water reaches far west and the rains over Indonesia and Australia intensify.', wiki: 'https://en.wikipedia.org/wiki/La_Ni%C3%B1a', wikiLang: 'en' },
        { term: 'Super El Niño', text: 'An informal name for a very strong El Niño, when the anomaly in the Niño 3.4 region exceeds about +2 °C. Such events happened in 1982–83, 1997–98 and 2015–16 and had worldwide impacts.', wiki: 'https://en.wikipedia.org/wiki/El_Ni%C3%B1o', wikiLang: 'en' },
        { term: 'Southern Oscillation', text: 'The atmospheric “half” of ENSO: opposite swings in air pressure over Tahiti and over Darwin in Australia. When the pressure difference shrinks, the trade winds weaken – and El Niño begins.', wiki: 'https://en.wikipedia.org/wiki/Southern_Oscillation', wikiLang: 'en' },
        { term: 'Niño 3.4', text: 'A box in the equatorial Pacific (5°S–5°N, 170°W–120°W). The average water temperature anomaly in it is the main measure of ENSO strength: above +0.5 °C – El Niño, below −0.5 °C – La Niña.', wiki: 'https://en.wikipedia.org/wiki/El_Ni%C3%B1o%E2%80%93Southern_Oscillation', wikiLang: 'en' },
        { term: 'Temperature anomaly', text: 'The difference between the current temperature and the long-term average for that place and season. An anomaly of +2 °C means “2 °C warmer than usual”, not “2 °C”.', wiki: 'https://en.wikipedia.org/wiki/Temperature_anomaly', wikiLang: 'en' }
      ]
    },
    {
      title: 'Ocean',
      terms: [
        { term: 'Sea surface temperature (SST)', text: 'The temperature of the topmost water layer, measured by satellites and buoys. It has the strongest effect on evaporation and cloud formation over the ocean.', wiki: 'https://en.wikipedia.org/wiki/Sea_surface_temperature', wikiLang: 'en' },
        { term: 'Thermocline', text: 'A thin layer in the ocean where temperature drops quickly with depth – the boundary between warm surface water and cold deep water. In the Pacific it is tilted: deep in the west, shallow in the east. During El Niño it flattens.', wiki: 'https://en.wikipedia.org/wiki/Thermocline', wikiLang: 'en' },
        { term: 'Warm pool', text: 'A huge area of the warmest water on Earth (over 28–29 °C) in the western Pacific and around Indonesia. The trade winds pile warm water up there, and towering thunderclouds form above it.', wiki: 'https://en.wikipedia.org/wiki/Indo-Pacific_Warm_Pool', wikiLang: 'en' },
        { term: 'Cold tongue', text: 'A band of cooler water along the equator in the eastern Pacific, stretching from the coast of South America. It is fed by the cold Humboldt (Peru) Current and by upwelling. It weakens during El Niño and reaches further west during La Niña.', wiki: 'https://en.wikipedia.org/wiki/Humboldt_Current', wikiLang: 'en' },
        { term: 'Upwelling', text: 'Cold, nutrient-rich deep water rising to the surface when the wind pushes water away from the coast. Off Peru it feeds some of the world’s largest fisheries – which is why El Niño, which weakens it, hits fishing.', wiki: 'https://en.wikipedia.org/wiki/Upwelling', wikiLang: 'en' },
        { term: 'Kelvin wave', text: 'A very long ocean wave, invisible at the surface, that travels east along the equator in about 2–3 months. It carries warm water and deepens the thermocline – it is what “delivers” El Niño to South America.', wiki: 'https://en.wikipedia.org/wiki/Kelvin_wave', wikiLang: 'en' }
      ]
    },
    {
      title: 'Atmosphere',
      terms: [
        { term: 'Trade winds', text: 'Steady tropical winds blowing from east to west and slightly towards the equator. Over the Pacific they push warm water towards Indonesia. Their weakening is a sign that El Niño is developing.', wiki: 'https://en.wikipedia.org/wiki/Trade_winds', wikiLang: 'en' },
        { term: 'Walker circulation', text: 'A huge loop of air over the equatorial Pacific: at the surface the trade winds blow west, over the warm pool the air rises, high up it returns east and it sinks over the cool eastern Pacific. El Niño weakens and shifts it.', wiki: 'https://en.wikipedia.org/wiki/Walker_circulation', wikiLang: 'en' },
        { term: 'Convection', text: 'Warm, moist air rising. As it rises, it cools and the water vapour condenses – thunderclouds grow and heavy rain falls. The convection zone follows the warmest water.', wiki: 'https://en.wikipedia.org/wiki/Atmospheric_convection', wikiLang: 'en' },
        { term: 'Cumulonimbus', text: 'A tall thundercloud that can reach the tropopause. At the top it flattens into a characteristic “anvil”. It brings downpours, lightning and gusty winds.', wiki: 'https://en.wikipedia.org/wiki/Cumulonimbus_cloud', wikiLang: 'en' },
        { term: 'Intertropical Convergence Zone (ITCZ)', text: 'A belt around the Earth near the equator where the trade winds of both hemispheres meet. Air rises there, so it is cloudy and rainy. Over the Pacific it usually lies a few degrees north of the equator.', wiki: 'https://en.wikipedia.org/wiki/Intertropical_Convergence_Zone', wikiLang: 'en' },
        { term: 'Tropopause', text: 'The upper boundary of the troposphere – the lowest layer of the atmosphere, where weather happens. In the tropics it lies at about 16–17 km. Thunderclouds stop below it and spread sideways.', wiki: 'https://en.wikipedia.org/wiki/Tropopause', wikiLang: 'en' },
        { term: 'Westerly wind bursts (WWB)', text: 'Episodes of strong westerly wind over the western Pacific lasting a few days, blowing against the trade winds. They trigger Kelvin waves and often “ignite” El Niño.', wiki: 'https://en.wikipedia.org/wiki/Westerly_wind_burst', wikiLang: 'en' }
      ]
    },
    {
      title: 'Impacts',
      terms: [
        { term: 'Teleconnections', text: 'Links between the weather in places far apart. A change over the Pacific shifts the jet streams and affects rainfall and temperature thousands of kilometres away – in Africa, the Americas or Asia.', wiki: 'https://en.wikipedia.org/wiki/Teleconnection', wikiLang: 'en' },
        { term: 'Monsoon', text: 'A seasonal shift in wind direction that brings the rainy season, e.g. in India in summer. El Niño often weakens the Indian monsoon, raising the risk of drought.', wiki: 'https://en.wikipedia.org/wiki/Monsoon', wikiLang: 'en' },
        { term: 'Indian Ocean Dipole (IOD)', text: 'ENSO’s “cousin” in the Indian Ocean: the difference in water temperature between its western and eastern parts. A positive dipole (often together with El Niño) means droughts in Indonesia and Australia and downpours in East Africa. On the globe both measurement boxes are outlined with a dashed purple line (50–70°E and 90–110°E), and the label shows the difference of their anomalies – the DMI index.', wiki: 'https://en.wikipedia.org/wiki/Indian_Ocean_Dipole', wikiLang: 'en' }
      ]
    }
  ],

  methodology: {
    title: 'Data & Methodology',
    subtitle: 'How temperatures, anomalies and geographic areas are measured',
    items: [
      {
        label: 'Niño 3.4 Temperature Anomaly',
        area: 'Niño 3.4 Box (5°S–5°N, 170°W–120°W) · ~6.2 million km²',
        text: 'The primary index of El Niño strength. Calculated as the average departure of sea-surface temperature from the 30-year climatological normal (1971–2000) across all ocean cells in the box. Anomalies above +0.5 °C denote El Niño, above +2.0 °C Super El Niño, and below −0.5 °C La Niña.'
      },
      {
        label: 'Water Temperature (SST)',
        area: 'Global Ocean (89.75°S–89.75°N, 179.75°W–179.75°E) · 0.5° × 0.5° grid (~3,080 km² per equatorial cell)',
        text: 'Produced from NOAA OISST v2.1 combining daily satellite radiometer data, drifting buoys, and ships with 2-pass coastal dilation. Each point on the globe samples the exact local 0.5° cell interpolated along the timeline date.'
      },
      {
        label: 'Air Temperature (2 m)',
        area: 'Global Tropics & Continents · 10° × 10° grid from Open-Meteo & ECMWF models',
        text: 'Modeled near-surface air temperature at 2 meters altitude. Local values are bilinearly interpolated across grid nodes and synchronized with the timeline date and regional sea-surface coupling.'
      },
      {
        label: 'Display Interpolation & Gaussian Smoothing',
        area: 'Visual Globe Surface Shader & Texture Pipeline',
        text: 'To present discrete numerical weather grid data as a natural continuous field, the display layer applies a Gaussian blur filter that smoothly interpolates temperature transitions and eliminates step artifacts.'
      }
    ]
  },

  built: {
    title: 'How we built it',
    rows: [
      { label: 'Technology', text: 'Angular and Three.js (WebGL globe) with a canvas cross-section. No backend: a static site on GitHub Pages, with data refreshed daily by GitHub Actions.' },
      { label: 'Data', text: 'NOAA OISST sea temperatures, Open-Meteo weather, the NOAA CPC ENSO outlook, rainfall impacts from WMO, EU JRC and JMA, and historical events with their sources linked in the app.' },
      { label: 'Visual interpolation', text: 'A Gaussian blur filter is applied to the visual display to smoothly interpolate and shade the discrete meteorological grid data across the globe surface.' },
      { label: 'Build time', text: 'About two weeks, by a team of three.' }
    ],
    teamLink: 'Meet the team'
  },

  sourcesTitle: 'Data Sources & Licences',
  dataSources: 'Data',
  dataSourcesTitle: 'Data',
  dataSourcesSubtitle: 'Datasets, methodology, and attribution',
  sourcesList: [
    {
      name: 'NOAA OISST v2.1',
      url: 'https://www.ncei.noaa.gov/products/optimum-interpolation-sst',
      license: 'Public Domain (US Gov)',
      desc: 'High-resolution daily sea surface temperature analysis (0.5° grid) produced from infrared/microwave satellite radiometers, drifting buoys, and research vessels.',
      products: [
        { name: 'Daily OISST v2.1 AVHRR-only files (NetCDF, 0.25°, final and preliminary) – sea temperature and anomaly', url: 'https://www.ncei.noaa.gov/data/sea-surface-temperature-optimum-interpolation/v2.1/access/avhrr/' },
        { name: 'Dataset record and citation (DOI 10.25921/RE9P-PT57)', url: 'https://doi.org/10.25921/RE9P-PT57' },
        { name: 'Huang et al. (2021) – Improvements of the Daily OISST Version 2.1, Journal of Climate', url: 'https://doi.org/10.1175/JCLI-D-20-0166.1' }
      ]
    },
    {
      name: 'Open-Meteo',
      url: 'https://open-meteo.com/',
      license: 'CC BY 4.0',
      desc: 'Global weather reanalysis and forecast models (ECMWF, DWD, NOAA), providing 2 m air temperature, 10 m surface wind velocity, and ocean waves.'
    },
    {
      name: 'NOAA CPC ENSO Diagnostics',
      url: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml',
      license: 'Public Domain (US Gov)',
      desc: 'Climate Prediction Center Niño 3.4 baseline SST anomalies, official monthly diagnostic discussions, and probabilistic ENSO outlook models.',
      products: [
        { name: 'Oceanic Niño Index (ONI) – table since 1950', url: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php' },
        { name: 'Niño 3.4 – monthly anomalies against a trend-adjusted climatology (since 1950)', url: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/detrend.nino34.ascii.txt' },
        { name: 'Niño 1+2, 3, 4 and 3.4 – monthly sea temperature and anomalies (since 1982)', url: 'https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices' },
        { name: 'Niño regions – weekly sea temperature and anomalies (1991–2020 normal)', url: 'https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for' },
        { name: 'All CPC climate indices (directory)', url: 'https://www.cpc.ncep.noaa.gov/data/indices/' }
      ]
    },
    {
      name: 'WMO – Prepare for El Niño (June 2026)',
      url: 'https://wmo.int/news/media-centre/wmo-prepare-el-nino',
      license: 'Open Access',
      desc: 'World Meteorological Organization outlook with a map of how El Niño shifts rainfall in June–August 2026: regions wetter and drier than normal.'
    },
    {
      name: 'EU JRC – Potentially historic El Niño to come (June 2026)',
      url: 'https://joint-research-centre.ec.europa.eu/jrc-news-and-updates/potentially-historic-el-nino-come-analysis-shows-humanitarian-toll-2026-06-15_en',
      license: 'CC BY 4.0',
      desc: 'European Commission Joint Research Centre analysis with a map of expected El Niño impacts on climate, food security and humanitarian risk.'
    },
    {
      name: 'JMA Tokyo Climate Center – Impacts of El Niño/La Niña and IOD on the global climate',
      url: 'https://ds.data.jma.go.jp/tcc/tcc/products/climate/ENSO/index.htm',
      license: 'Open Access',
      desc: 'Statistical maps of the temperature and precipitation anomalies typical of El Niño, La Niña and Indian Ocean Dipole events, season by season.'
    },
    {
      name: 'Disaster Records & Historical Impact Data',
      url: 'https://en.wikipedia.org/wiki/El_Ni%C3%B1o%E2%80%93Southern_Oscillation',
      license: 'Open / CC BY-SA 4.0',
      desc: 'Curated socio-economic impact figures, flood and drought records sourced directly from CDC MMWR, FAO GIEWS, FEMA, UNDRR, and UN OCHA ReliefWeb.',
      pinArticles: true
    }
  ],
  sourceProducts: n => `Products used (${n})`,
  sourcePinArticles: n => `Show full list of articles (${n})`,

  regions: [
    { name: 'Indonesia and the Philippines', season: 'Jun–Feb' },
    { name: 'Australia', season: 'Jul–Jan' },
    { name: 'Southern Africa', season: 'Nov–Mar' },
    { name: 'India (monsoon)', season: 'Jun–Sep' },
    { name: 'Sahel', season: 'Jul–Sep' },
    { name: 'Ethiopia', season: 'Jun–Sep' },
    { name: 'Central America', season: 'Jun–Feb' },
    { name: 'Northern South America and the Amazon', season: 'Dec–Jun' },
    { name: 'North-east Brazil', season: 'Feb–May' },
    { name: 'Coast of Peru and Ecuador', season: 'Dec–Apr' },
    { name: 'South-eastern South America', season: 'Sep–Apr' },
    { name: 'Central Chile', season: 'Jun–Aug' },
    { name: 'East Africa', season: 'Oct–Dec' },
    { name: 'Southern US and northern Mexico', season: 'Nov–Apr' },
    { name: 'Central Asia and the Middle East', season: 'Jan–Apr' },
    { name: 'South-east China and southern Japan', season: 'Nov–Feb' },
    { name: 'Central Pacific (rain over the ocean)', season: 'all year' }
  ],
  impactSourceTitles: [
    'WMO – El Niño shifts rainfall patterns in different parts of the world (2026)',
    'European Commission Joint Research Centre (JRC) – ENSO report, map of impacts (2026)',
    'JMA Tokyo Climate Center – Impacts of El Niño/La Niña on the global climate'
  ],

  events: [
    { name: 'Peru', region: 'South America', ev: [
      { type: 'Collapse of the Peruvian anchovy (anchoveta) catch – a crisis in fishing and the fishmeal industry',
        aff: 'The catch fell from 10.3 million t (1971) to 4.4 million t (1972); in 1970 fish products earned about 1/3 of Peru’s export income. Over USD 200 million of sector debt to state banks; the industry was nationalised in 1973.',
        note: 'Earlier overfishing also contributed to the collapse.' },
      { type: 'Downpours and floods on the coast, landslides, losses in fishing and farming',
        aff: 'Losses of about USD 3.5 billion (about 4.5% of GDP); GDP growth in 1998 up to 2.8 percentage points lower. Across the Andean Community about 135,000 homes were damaged or destroyed.' } ] },
    { name: 'Ecuador', region: 'South America', ev: [
      { area: 'Ecuador and northern Peru', type: 'Downpours and floods on the coast, destroyed infrastructure',
        aff: 'About 600 deaths, losses of about USD 650 million (Ecuador and northern Peru combined).' },
      { type: 'Floods in the coastal lowlands',
        aff: 'Losses of about USD 2.9 billion, i.e. 14.6% of Ecuador’s GDP – the largest relative losses in the region.' } ] },
    { name: 'Southern Brazil, northern Argentina, Paraguay', region: 'South America', ev: [
      { type: 'Prolonged downpours and floods in the Paraná basin',
        aff: '170 deaths, about 600,000 evacuated, losses of about USD 3 billion.' } ] },
    { name: 'Brazil – Amazonas state', region: 'South America', ev: [
      { type: 'Record drought, a sharp drop in the level of the Rio Negro',
        aff: '60 of the state’s 62 municipalities hit by drought (including Manaus); about 500,000 people with limited access to water and food; over 100 dead river dolphins in Lake Tefé.',
        note: 'The drought was caused by El Niño combined with a warm tropical North Atlantic.' } ] },
    { name: 'Argentina', region: 'South America', ev: [
      { type: 'Historic drought in the Pampas, the worst soybean harvest in 23 years',
        aff: 'Economic losses of about USD 20 billion (over 3% of GDP); soybean, maize and wheat harvests about 45% lower year on year; soybean export earnings down by about USD 8 billion.',
        note: 'The main cause was a third La Niña in a row; climate change made the drought worse (World Weather Attribution).' } ] },
    { name: 'Colombia', region: 'South America', ev: [
      { type: 'A record rainy season: floods and landslides',
        aff: '3.66 million people affected, 469 deaths, 13,351 homes destroyed and about 492,000 damaged; 29 of 32 departments; over 1.2 million ha of crops flooded (Apr 2010 – Jun 2011).' } ] },
    { name: 'California, USA', region: 'North America', ev: [
      { type: 'Winter storms, downpours, landslides and floods',
        aff: '17 deaths, losses of about USD 883 million; 40 counties declared federal disaster areas.' } ] },
    { name: 'Texas, USA', region: 'North America', ev: [
      { type: 'Record drought and heat – the driest year on record in Texas',
        aff: 'Agricultural losses of USD 7.62 billion (livestock 3.23 billion, cotton 2.2 billion); 55% of planted cotton fields were abandoned. The costliest drought in the state’s history.',
        note: 'The drought came during the 2010–12 La Niña.' } ] },
    { name: 'Central America Dry Corridor', region: 'Guatemala, El Salvador, Honduras', ev: [
      { type: 'Multi-year drought, loss of staple grain harvests',
        aff: 'About 3.5 million people in need of humanitarian aid; 1.6 million in moderate or severe food insecurity. WFP supported about 1 million people a year.' } ] },
    { name: 'Panama', region: 'Central America', ev: [
      { type: 'Drought, record-low level of Gatún Lake',
        aff: 'Transits through the Panama Canal cut from 38 to 24 ships a day (about 30% fewer); October 2023 had 43% less rain than normal. Gatún Lake supplies drinking water to millions of people (incl. Panama City and Colón).' } ] },
    { name: 'Southern Africa (SADC region)', region: 'Zimbabwe, Zambia, Malawi, Mozambique and others', ev: [
      { type: 'The worst drought and crop failure in decades',
        aff: 'About 40 million people food-insecure (about 14% of the SADC population); Zimbabwe and Malawi declared disasters; a regional appeal for USD 2.4 billion.' },
      { type: '“Drought of the century” – rainfall up to 90% below normal',
        aff: 'About 18 million people at risk of hunger in the region; cereal import needs of 7.73 million t.',
        note: 'The drought came during the 1991–92 El Niño.' },
      { type: 'Drought and crop failure in the 2023/24 season',
        aff: 'About 68 million people (17% of the region’s population) in need of assistance according to SADC.' } ] },
    { name: 'Mozambique', region: 'South-East Africa', ev: [
      { type: 'Limpopo floods and Cyclone Eline',
        aff: 'About 700–800 deaths; about 463,000 people displaced or homeless; losses of about USD 500 million.',
        note: 'The record rainfall came during the 1999–2000 La Niña.' } ] },
    { name: 'Ethiopia', region: 'Horn of Africa', ev: [
      { type: 'Extreme drought, failed rainy seasons',
        aff: '10.2 million people requiring urgent humanitarian assistance (Ethiopian government and UN agencies, early 2016); humanitarian needs had tripled since early 2015.' } ] },
    { name: 'Kenya and southern Somalia', region: 'East Africa', ev: [
      { type: 'The worst floods since 1961 and a Rift Valley fever epidemic',
        aff: 'Rainfall 60–100 times above the seasonal normal; an estimated 89,000 Rift Valley fever infections; 478 unexplained deaths reported in December 1997; about 70% of sheep and goats lost in the herds surveyed.',
        note: 'The downpours from October 1997 to January 1998 came during a Super El Niño.' } ] },
    { name: 'Somalia', region: 'Horn of Africa', ev: [
      { type: 'Deyr rainy-season floods (“once in a century”)',
        aff: 'About 1.2 million people affected (9 Nov 2023), up to 1.6 million forecast; up to 1.5 million ha of farmland at risk.',
        note: 'The rainfall was amplified by El Niño together with a positive Indian Ocean Dipole.' },
      { type: 'The driest year in 60 years, famine',
        aff: 'About 258,000 deaths (Oct 2010 – Apr 2012), including about 133,000 children under 5 – 4.6% of the population of southern and central Somalia.',
        note: 'The failed rainy seasons coincided with the strong 2010–11 La Niña; conflict and a spike in food prices deepened the tragedy.' } ] },
    { name: 'Horn of Africa', region: 'Ethiopia, Kenya, Somalia', ev: [
      { type: 'The longest drought on record – one failed rainy season after another',
        aff: 'Over 30 million people food-insecure (2020–22); in Somalia 7.8 million affected (46% of the population, Oct 2022); in Kenya 6.4 million in need of aid in 2023.',
        note: 'The three-year 2020–22 La Niña was the strongest in the region in 70 years.' } ] },
    { name: 'Indonesia', region: 'South-East Asia', ev: [
      { type: 'The worst drought in about 50 years, forest and peat fires, transboundary haze',
        aff: 'The haze affected about 75 million people (incl. 48 million Indonesians); about 25 million acres (about 10 million ha) burned; losses of about USD 9 billion.' },
      { type: 'Drought and peat fires, haze over the region',
        aff: '2.6 million ha burned (Jun–Oct 2015); a cost of about USD 16.1 billion, i.e. 1.9% of GDP (World Bank).',
        note: 'The fire season came during the 2015–16 Super El Niño, which prolonged the dry season.' } ] },
    { name: 'Papua New Guinea', region: 'Oceania', ev: [
      { type: 'Drought and frosts in the highlands, fires',
        aff: 'In December 1997 about 260,000 people were eating “famine food” and another 980,000 had meagre, poor-quality food rations; Australia airdropped food for about 100,000 people in places reachable only by air.' } ] },
    { name: 'China – Yangtze basin', region: 'East Asia', ev: [
      { type: 'Catastrophic floods on the Yangtze and in north-east China',
        aff: 'About 180 million people affected, 3,704–4,150 deaths, about 15 million homeless; losses of about USD 24 billion.',
        note: 'Summer 1998 was the decaying phase of a Super El Niño; researchers describe the link as indirect.' } ] },
    { name: 'Vietnam – Mekong Delta', region: 'South-East Asia', ev: [
      { type: 'Drought and saltwater intrusion into the delta',
        aff: 'Over 2 million people affected, about 2 million short of water, 1.1 million food-insecure; 14 provinces declared a state of emergency.' } ] },
    { name: 'India', region: 'South Asia', ev: [
      { type: 'A weak monsoon and drought',
        aff: 'Rainfall at 77% of normal (−23%); drought declared in 352 districts in 15 states; grain output fell from 234 to 218 million t (about −6.9%).',
        note: 'NOAA classifies 2009 as a moderate El Niño year.' } ] },
    { name: 'Pakistan', region: 'South Asia', ev: [
      { type: 'Monsoon floods – about 1/5 of the country under water',
        aff: 'About 20 million people affected, 1,985 deaths; losses estimated at up to USD 43 billion.',
        note: 'NASA’s rainfall anomaly map links the exceptionally intense monsoon to La Niña.' },
      { type: 'Record monsoon floods',
        aff: 'About 33 million people affected, 1,739 deaths, over 2.1 million homeless; damage of about USD 14.9 billion and losses of about USD 15.2 billion (Government of Pakistan).',
        note: 'The flood came during the triple-dip 2020–23 La Niña; the main causes were a record monsoon, glacier melt and climate change.' } ] },
    { name: 'Bangladesh', region: 'South Asia', ev: [
      { type: 'Catastrophic monsoon floods – more than half of the country under water',
        aff: '25–28 million people homeless (official estimates); about 2/3 of the 110 million population affected in 50 of 64 districts; an official death toll of about 500 (September 1988), many from snakebites and contaminated water.',
        note: 'The flood coincided with the strong 1988–89 La Niña.' } ] },
    { name: 'Thailand', region: 'South-East Asia', ev: [
      { type: 'The great flood (Bangkok, Ayutthaya)',
        aff: '13.6 million people affected, 815 deaths; 65 provinces declared disaster areas; losses of about USD 46.5 billion (World Bank).',
        note: 'The prolonged rainfall was amplified by a multi-year La Niña.' } ] },
    { name: 'Australia – Victoria and South Australia', region: 'Australia', ev: [
      { type: 'Drought, dust storms and bushfires (Ash Wednesday, 16 Feb 1983)',
        aff: '75 deaths in the fires; over 3,700 buildings destroyed or damaged, about 2,545 people and families left homeless; over 340,000 sheep died; a cost of over AUD 400 million (1983 prices).',
        note: 'The fires were preceded by a drought linked to El Niño – winter and spring rainfall in 1982 was up to half the previous record low.' } ] },
    { name: 'Australia – Queensland', region: 'Australia', ev: [
      { type: 'Catastrophic floods (Brisbane, Toowoomba)',
        aff: 'Over 200,000 people directly affected; 78% of the state declared a disaster zone (over 2.5 million residents); about 29,000 homes and businesses flooded; 33+ deaths; insured losses of AUD 2.38 billion, total cost of AUD 14.1 billion.',
        note: 'The floods were preceded by the wettest December in the state’s history during a strong La Niña.' } ] }
  ],
  srcTitles: {
    anch: 'Wikipedia – 1972 Peruvian anchoveta crisis',
    nps: 'Naval Postgraduate School – Economic effects of El Niño (1982–83)',
    eird: 'UN ISDR / CAF – El Niño 1997–98 in the Andean countries',
    ash: 'Wikipedia – Ash Wednesday bushfires',
    idn97: 'EBSCO Research Starters – Indonesian forest fires 1997–98',
    idn15: 'BenarNews (World Bank data) – fires of 2015',
    png: 'Devpolicy Blog (ANU) – Food risks in PNG: lessons from 1997',
    rvf: 'CDC MMWR – Rift Valley fever, East Africa 1997–98',
    chn: 'Wikipedia – 1998 China floods',
    cal: 'Government Technology (FEMA data) – El Niño 1997–98',
    saf15: 'Public Finance Focus – SADC appeal, July 2016',
    eth: 'UN in Ethiopia – Drought: 10 million people in need (2016)',
    cam: 'WFP USA / FAO – Central America Dry Corridor, 30 Jun 2016',
    vnm: 'ReliefWeb (UN OCHA / ECHO) – Vietnam, 29 Apr 2016',
    saf92: 'FAO GIEWS – Update on the 1991/92 drought',
    saf24: 'Al Jazeera (SADC data) – 17 Aug 2024',
    som23: 'UN OCHA / ReliefWeb – Somalia, 9 Nov 2023',
    amz: 'Mongabay – Amazon drought, October 2023',
    pan: 'Woodwell Climate Research Center – drought and the Panama Canal',
    ind09: 'ThePrint – the weak monsoons of 2009 and 2014',
    qld: 'Wikipedia – 2010–2011 Queensland floods',
    pak10: 'Wikipedia – 2010 Pakistan floods',
    pak22: 'Wikipedia – 2022 Pakistan floods',
    som11: 'FSNAU (FAO) / FEWS NET – mortality study, 2 May 2013',
    horn: 'UNDRR – Horn of Africa floods and drought 2020–2023',
    arg: 'Dialogue Earth – La Niña and drought in Argentina',
    tha: 'Wikipedia – 2011 Thailand floods',
    col: 'RPP / Dirección de Gestión del Riesgo – June 2011',
    tex: 'Drovers (Texas AgriLife Extension) – March 2012',
    bgd: 'ReliefWeb – UNDRO situation reports, 1988 floods',
    moz: 'Wikipedia – 2000 Mozambique flood'
  },

  inspectCoords: (lat: number, lon: number) => {
    const ns = lat >= 0 ? `${lat.toFixed(1)}°N` : `${Math.abs(lat).toFixed(1)}°S`;
    const ew = lon >= 0 ? `${lon.toFixed(1)}°E` : `${Math.abs(lon).toFixed(1)}°W`;
    return `${ns}, ${ew}`;
  },
  inspectWater: 'Water',
  inspectAir: 'Air',
  inspectNoWater: '-'
};
