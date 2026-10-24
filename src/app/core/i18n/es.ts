import { Dict } from './i18n.types';

export const ES: Dict = {
  htmlLang: 'es',
  locale: 'es-ES',
  docTitle: 'El Niño 2026 en 3D - Visualización interactiva | KMD Labs',
  metaDescription: 'Explora El Niño y La Niña en un globo 3D interactivo: temperaturas reales del mar (NOAA), vientos, la circulación de Walker e impactos globales.',
  langName: 'Español',

  phase: { super: 'Súper El Niño', nino: 'El Niño', nina: 'La Niña', neu: 'Neutral' },
  desc: {
    nina: 'Los alisios reforzados empujan el agua cálida hacia el oeste. La lengua fría del Pacífico ecuatorial se extiende muy al oeste y las lluvias intensas se concentran sobre Indonesia y Australia. Los efectos son en gran medida opuestos a los de El Niño.',
    neu: 'Los alisios mantienen una piscina cálida junto a Indonesia (~29–30 °C) y una lengua fría a lo largo del ecuador en el Pacífico oriental. La convección y las lluvias intensas se concentran sobre el Pacífico occidental.',
    nino: 'Los alisios se debilitan, el agua cálida se desplaza hacia el este y la zona de convección avanza hacia el Pacífico central. Entran en juego las teleconexiones: cambios del tiempo lejos del Pacífico.',
    super: 'La anomalía Niño 3.4 supera los +2 °C. La circulación de Walker colapsa, los aguaceros azotan Perú y Ecuador, mientras Indonesia, Australia, la India y el sur de África sufren sequía. Sube la temperatura media del planeta. Ejemplos: 1982–83, 1997–98, 2015–16.'
  },
  months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],

  readoutTitle: 'Anomalía',
  loadingMap: 'Cargando continentes…',
  mapError: 'No se pudieron cargar los contornos de tierra.',
  changeLanguage: 'Idioma',
  settingsTitle: 'Configuración',
  settingsSubtitle: 'Idioma y unidades',
  settingsAria: 'Configuración',
  temperatureUnit: 'Unidad de temperatura',
  unitCelsius: 'Celsius (°C)',
  unitFahrenheit: 'Fahrenheit (°F)',

  ensoLabel: 'Fase ENSO',
  strengthAria: 'Intensidad de ENSO',
  probText: 'Probabilidad pico 2026:',
  probTitle: 'Proporción del conjunto de analogías cuyo pico oct–dic alcanza el valor mostrado — cinco temporadas pasadas '
    + 'ajustadas a la trayectoria actual del registro NOAA CPC Niño 3.4 (1950–hoy). Una estimación aproximada, no un modelo dinámico.',
  probSource: 'NOAA CPC',
  playStart: 'Ciclo 4 años',
  playStop: 'Detener',
  playbackSpeed: 'Velocidad de reproducción',
  speedNormal: 'Normal',
  detailsAria: 'Detalles',
  thermoChip: 'Termoclina',
  thermoAria: 'Corte de la termoclina a lo largo del ecuador',
  thermoTitle: 'Termoclina a lo largo del ecuador (Pacífico, 0–300 m)',
  thermoNote: 'La línea blanca es la termoclina: el límite entre el agua cálida de superficie y el agua fría profunda. Con El Niño se aplana; con La Niña se inclina más.',
  descChip: 'Info fase',
  descChipTitle: 'Qué ocurre en esta fase',
  close: 'Cerrar',
  hidePanel: 'Ocultar controles',
  showPanel: 'Mostrar controles',
  ensoTab: 'Estado ENSO',
  viewTab: 'Controles',
  cycleMonth: (year, month, realYear, forecast) => `Año ${year} · ${month} (≈ ${realYear}${forecast ? ', pronóstico' : ''})`,
  hintNeutral: 'En la fase neutral no hay marcadores. Elige La Niña, El Niño o Súper El Niño para ver los impactos históricos.',
  hintPins: (count, phase) => `${count} lugares con impactos documentados de ${phase}. Haz clic en un marcador para ver los datos y la fuente.`,

  chooseView: 'Vista',
  shareLink: 'Compartir un enlace',
  shareTitle: 'Compartir',
  shareSubtitle: 'Enlace a la app, fecha concreta, estado ENSO o código QR',
  shareAppUrl: 'Enlace a la aplicación',
  shareQrCode: 'Escanea el código QR para abrir en el móvil',
  copyLink: 'Copiar',
  shareDate: 'Enlace a esta fecha',
  shareState: 'Enlace a este estado ENSO',
  linkCopied: 'Enlace copiado',
  linkCopyFailed: 'No se pudo copiar: usa la barra de direcciones',
  viewTemp: 'Temperatura del agua',
  viewAnom: 'Temperatura del agua',
  viewWalker: 'Celda Walker',
  viewImpacts: 'Impactos',
  viewCurrent: 'Situación actual',
  sstOnDateTitle: 'Temperatura media de la superficie del mar en el recuadro Niño 3.4 para la fecha seleccionada',
  dailyConditionsLabel: 'Condiciones tropicales',
  waterTempLabel: 'Agua',
  airTempLabel: 'Aire',
  windSpeedLabel: 'Viento',
  airTempTitle: 'Temperatura media diaria del aire a 2 m para la fecha seleccionada, promediada en los trópicos.',
  windSpeedTitle: 'Velocidad media diaria del viento a 10 m para la fecha seleccionada, promediada en los trópicos.',
  timelineNow: 'Más reciente',
  live: 'Más reciente',
  timelineForecast: 'Pronóstico',
  currentLive: 'Más reciente',
  currentAt: time => `a las ${time} UTC`,
  currentWind: 'viento a 10 m',
  currentWaves: 'oleaje',
  scaleSstNow: 'Temperatura del agua – más reciente',
  scaleSstOn: date => `Temperatura del agua · ${date}`,
  scaleNoData: 'sin datos',
  currentSources: 'Fuentes:',
  currentSourceTitle: 'Open-Meteo.com (licencia CC BY 4.0): viento y oleaje actuales de modelos meteorológicos (incl. ECMWF), malla de 10°, actualizado en cada despliegue del sitio',
  sstSourceTitle: (date, preliminary) => `NOAA OISST v2.1: temperatura diaria de la superficie del mar a partir de satélites, barcos y boyas, ${date}${preliminary ? ' (datos preliminares)' : ''}; promediada a una malla de 1°`,
  currentLoading: 'Cargando datos actuales…',
  currentError: 'No hay datos actuales de viento y oleaje.',
  scaleSst: 'Temperatura superficial del agua del mar (°C)',
  scaleAnom: 'Anomalía de temperatura del agua respecto a lo normal (°C)',
  scaleSstShort: 'Temperatura del agua',
  scaleAnomShort: 'Anomalía de temperatura',
  impactsTab: 'Leyenda',
  flowLegendTitle: 'Circulación oceánica y vientos',
  flowWindLabel: 'Vientos superficiales (alisios)',
  flowWaveLabel: 'Movimiento del agua y ondas oceánicas',
  flowDesc: 'Las líneas grises trazan los vientos superficiales hacia la piscina cálida. Las líneas blancas brillantes muestran la dirección del movimiento del agua y las ondas Kelvin propagándose por las cuencas oceánicas.',
  layersAria: 'Capas y herramientas',
  layerAtm: 'Atmósfera',
  layerAtmTitle: 'Viento, olas y nubes convectivas',
  layerEvents: 'Eventos',
  layerEventsTitle: 'Marcadores con impactos históricos de la fase',
  layerRotate: 'Auto-rotar',
  layerRotateTitle: 'Rotación automática del globo',
  layerGlossary: 'Glosario',
  layerGlossaryTitle: 'Términos clave: explicaciones sencillas',
  pinLegendTitle: phase => `Impactos de ${phase}:`,
  kindDry: 'Sequía / calor',
  kindFire: 'Incendios',
  kindWet: 'Inundaciones / lluvias',
  kindOther: 'Pesca / enfermedades',
  rainDry: 'Más seco de lo normal',
  rainWet: 'Más húmedo de lo normal',
  rainTitleNina: 'Anomalías de lluvias durante La Niña:',
  rainTitleNeutral: 'Anomalías de lluvias de El Niño (atenuadas en fase neutral):',
  rainTitleNino: 'Anomalías de lluvias durante El Niño:',
  sources: 'Fuentes:',
  sourceOisstTooltip: 'NOAA OISST v2.1: malla diaria de 0.5° de temperatura del mar a partir de satélites, barcos y boyas',
  sourceOpenMeteoTooltip: 'Open-Meteo (CC BY 4.0): datos globales de oleaje marino y viento en superficie a 10 m',

  lblConvection: 'Zona de convección y lluvias',
  lblTrades: '← Alisios (viento)',
  lblKelvin: 'Ondas Kelvin →',
  lblIod: 'Dipolo del océano Índico (IOD)',
  rainDryShort: 'más seco',
  rainWetShort: 'más húmedo',

  mArea: 'Zona',
  mAnomaly: 'Anomalía',
  mScale: 'Magnitud del impacto',
  mRole: 'Papel de ENSO:',
  mSource: 'Fuente:',

  walkerAria: 'Circulación de Walker y termoclina: corte a lo largo del ecuador',
  walkerCaption: 'Circulación de Walker y termoclina · corte a lo largo del ecuador (0°) · atmósfera 0–16 km · océano 0–300 m (escala vertical convencional)',
  walkerNow: 'más reciente',
  walkerCycle: 'ciclo',
  walkerCurrent: phase => `Estado actual: ${phase} · Pulsa Reproducir para la explicación paso a paso`,
  walkerCycleCaption: month => `Ciclo ENSO · ${month || 'inicio'}`,
  walkerPrev: 'Paso anterior',
  walkerNext: 'Paso siguiente',
  walkerPlay: 'Reproducir los pasos',
  walkerPause: 'Pausar',
  walkerStep: (i, title) => `Paso ${i}: ${title}`,
  steps: [
    'Punto de partida: el estado neutral',
    'Junto a la superficie soplan los alisios: de este a oeste, de Sudamérica hacia Indonesia',
    'El viento empuja el agua cálida al oeste: junto a Indonesia se forma una piscina cálida y la termoclina se inclina',
    'Frente a Sudamérica, el agua fría profunda sube para reemplazar la que se aleja (afloramiento)',
    'Sobre la piscina cálida el aire húmedo asciende: crecen nubes de tormenta y caen aguaceros',
    'Bajo la tropopausa, el aire ya seco regresa hacia el este',
    'Sobre el Pacífico oriental fresco el aire desciende y hace seco: el circuito se cierra; es la circulación de Walker',
    'La Niña: la circulación se acelera – alisios más fuertes, la lengua fría llega muy al oeste',
    'Los alisios se debilitan: el agua cálida vuelve al este como una onda Kelvin bajo la superficie',
    'El Niño: la convección se desplaza al Pacífico central, la celda de Walker se debilita y se rompe',
    'Súper El Niño: la termoclina se aplana – aguaceros en Perú y Ecuador, sequía en Indonesia y Australia',
    'Los alisios se recuperan, vuelve el estado neutral… y el ciclo empieza de nuevo'
  ],
  canvas: {
    tropopause: 'Tropopausa ~16 km',
    thermocline: 'termoclina',
    kelvin: 'onda Kelvin →',
    indonesia: 'Indonesia',
    andes: 'Andes',
    trades: '← alisios',
    aloft: 'retorno en altura →',
    sinkDry: 'descenso · seco',
    rising: 'ascenso · aguaceros',
    sinkDrought: 'descenso · sequía',
    westerly: 'viento del oeste →',
    warmPool: 'piscina cálida',
    coldTongue: 'lengua fría'
  },

  splashLoading: 'Cargando datos climáticos…',
  splashPreparing: 'Preparando el globo…',
  splashError: 'No se pudieron cargar algunos datos; empezamos con las capas disponibles.',

  about: {
    docTitle: 'Sobre nosotros – KMD Labs, el equipo detrás de El Niño 2026 en 3D',
    metaDescription: 'Conoce a KMD Labs, un equipo de tres personas que crea visualizaciones interactivas de datos: ingeniería de datos, aprendizaje automático, gráficos 3D y cartografía. Abiertos a nuevos proyectos.',
    cta: 'Abiertos a nuevos proyectos',
    contact: 'Contacto',
    openAbout: 'Sobre KMD',
    title: 'Sobre nosotros',
    kicker: 'laboratory',
    leads: [
      'KMD Labs es un equipo de tres personas surgido de Viadrus AI: el primer equipo polaco que ganó la final europea del hackathon CASSINI organizado por la Agencia de la UE para el Programa Espacial (EUSPA). La solución ganadora empleaba datos satelitales para detectar de forma temprana fugas en las redes de abastecimiento de agua.',
      'Tras la final, Adrian, Leszek y Marcin decidieron unir la capacidad de cálculo de sus neuronas. Aunque cada uno viene de un ámbito distinto, comparten la pasión por la geoinformática, los datos satelitales, la detección de anomalías, el aprendizaje automático y el desarrollo de software.',
      'KMD Labs cree que divulgar la geoinformática y la tecnología espacial es tan importante como desarrollarlas. Los datos satelitales ayudan a resolver problemas reales del medio ambiente, las ciudades y las infraestructuras, pero en Polonia siguen faltando especialistas capaces de convertirlos en soluciones prácticas.',
      'Por eso KMD Labs sigue buscando los próximos datos que merezca la pena mostrar. Si tienes una idea para una visualización, o un conjunto de datos que te gustaría ver en esta forma, nos encantaría colaborar contigo: sentimos curiosidad por descubrir qué se puede sacar de él.'
    ],
    refs: [
      {
        label: '11.º hackathon CASSINI – crónica de la CE',
        href: 'https://defence-industry-space.ec.europa.eu/orbit-water-tap-11th-cassini-hackathon-2026-05-08_en',
        title: 'defence-industry-space.ec.europa.eu – From Orbit to the Water Tap: 11th CASSINI Hackathon',
        aria: 'Crónica de la Comisión Europea sobre el 11.º hackathon CASSINI'
      },
      {
        label: 'CASSINI Hackathons – portafolio',
        href: 'https://www.cassini.eu/hackathons/portfolio',
        title: 'cassini.eu/hackathons/portfolio – Meet the Winners',
        aria: 'CASSINI Hackathons – portafolio de equipos ganadores'
      }
    ],
    back: 'Volver al globo',
    tasksLabel: 'Áreas',
    photoSoon: 'Foto próximamente',
    linkedinAria: name => `Perfil de LinkedIn – ${name}`,
    githubAria: name => `Perfil de GitHub – ${name}`,
    footer: 'KMD · visualización interactiva de datos',
    people: [
      {
        bio: 'Ingeniero ambiental de formación e ingeniero de IA por elección. Mi aventura con el código empezó en 2019 con three.js y el arte generativo, lo que me llevó a crear mis propias soluciones de realidad aumentada (AR). Hoy me centro en la inteligencia artificial y el aprendizaje automático, uniendo la tecnología con la resolución de problemas reales, como demuestra la victoria en la 11.ª edición del hackathon CASSINI. Además de programar, participo en proyectos de código abierto, juego, hago música y fotografío.',
        tasks: ['Desarrollo fullstack', 'Gráficos 3D', 'DevOps', 'UX/UI', 'Inteligencia artificial', 'Aprendizaje automático']
      },
      {
        bio: 'Máster en Administración por la Universidad de Breslavia. Profesionalmente trabajo como ingeniero de datos en una gran empresa de gran consumo (FMCG). Además de gestionar bases de datos, me especializo en la detección de anomalías, el control de calidad de los datos y la automatización de procesos. En el proyecto Viadrus AI reuní a todo el equipo y me encargué de la obtención de datos. Antes trabajé con Marcin en la misma entidad financiera: como becario le hacía muchísimas preguntas. Me gusta demostrar que lo imposible sí es posible. En mi tiempo libre fotografío y pinto paisajes, y me interesan los mapas y los juegos de estrategia.',
        tasks: ['Ingeniería de datos', 'Aprendizaje automático', 'Analítica de datos', 'Obtención de datos', 'Calidad de datos']
      },
      {
        bio: 'Soy licenciado en Geografía Marina por la Facultad de Ciencias de la Tierra de la Universidad de Szczecin, en Geoinformación por la Facultad de Ciencias Geográficas y Geológicas de la Universidad Adam Mickiewicz de Poznań y en Inteligencia Artificial en Finanzas y Control de Gestión Empresarial por la Universidad Kozminski. Desde hace 12 años trabajo como consultor funcional de sistemas ERP. Fuera del horario laboral desarrollo sistemas de detección de anomalías en datos financieros y satelitales mediante aprendizaje automático. Crear geovisualizaciones es otra de mis grandes pasiones. Llevo 4 años desarrollando mis competencias en inteligencia artificial. Creo que el futuro pertenece a los expertos de dominio capaces de usar la IA con eficacia como herramienta en su trabajo diario. En lo personal me apasionan el entrenamiento de fuerza, los juegos de mesa, Magic: The Gathering y la jardinería.',
        tasks: ['Geoinformática', 'Geovisualización', 'Detección de anomalías', 'Aprendizaje automático', 'Inteligencia artificial']
      }
    ]
  },

  viewCycles: 'Ciclos anteriores',
  cyclesAria: 'Ciclos ENSO anteriores y el pronóstico por analogías',
  cyclesTitle: 'Todos los eventos ENSO desde 1950',
  cyclesNote: 'Cada línea es un evento: el índice Niño 3.4 (ONI, media móvil de 3 meses) a lo largo de dos años '
    + 'calendario. Las temporadas en que se basa el pronóstico están resaltadas; el evento actual es la línea gruesa.',
  cyclesBarrier: 'Un pronóstico por analogías es una base estadística, no un modelo dinámico. Cinco miembros extraídos de un '
    + 'registro de diez eventos comparables conllevan una incertidumbre real, y la destreza cae bruscamente cuando el horizonte '
    + 'cruza la barrera de predictibilidad de primavera.',
  cyclesLegendPast: 'Eventos pasados',
  cyclesLegendAnalog: 'Analogías usadas',
  cyclesLegendCurrent: 'Evento actual',
  cyclesLegendForecast: 'Pronóstico (p10–p90)',
  cyclesAxisOni: 'ONI (°C)',
  cyclesYearN: n => `año ${n}`,
  cyclesCatalogue: 'Eventos El Niño más fuertes',
  cyclesColSeason: 'Temporada',
  cyclesColPeak: 'Pico',
  cyclesColTier: 'Clase',
  cyclesColLength: 'Duración',
  cyclesMonthsShort: n => `${n} meses`,
  cyclesOngoing: 'en curso',
  cyclesProvisional: date => `provisional · semana hasta ${date}`,
  cyclesAnalogTitle: 'Analogías más cercanas',
  cyclesAnalogNote: (window, members) =>
    `Ajuste según los últimos ${window} meses del índice; las ${members} mejores temporadas, cada una desplazada para continuar desde el nivel actual.`,
  cyclesAnalogMatch: 'ajuste',
  cyclesAnalogWeight: 'peso',
  cyclesForecastPeak: (lo, hi, window) =>
    `Pico previsto ${window}: ${lo >= 0 ? '+' : '−'}${Math.abs(lo).toFixed(1)} a ${hi >= 0 ? '+' : '−'}${Math.abs(hi).toFixed(1)} °C`,
  cyclesRecordNote: (first, last) => `NOAA CPC, Niño 3.4 mensual, ${first} – ${last}`,
  cyclesLoading: 'Cargando el registro histórico…',
  cyclesError: 'El registro histórico no está disponible.',
  tier: {
    super: 'Super',
    strong: 'Fuerte',
    moderate: 'Moderado',
    weak: 'Débil'
  },

  glTitle: 'Glosario de términos clave',
  glSearch: 'Buscar término, p. ej. termoclina…',
  glSearchAria: 'Buscar un término',
  glEmpty: q => `Ningún término coincide con «${q}».`,
  wikiIn: { pl: ' (PL)', en: ' (EN)', es: '' },
  glossary: [
    {
      title: 'Conceptos básicos',
      terms: [
        { term: 'ENSO (El Niño – Oscilación del Sur)', text: 'Una oscilación natural del clima en el Pacífico ecuatorial que se repite cada 2–7 años. El océano y la atmósfera “se balancean” juntos entre tres estados: El Niño, La Niña y neutral.', wiki: 'https://es.wikipedia.org/wiki/Oscilaci%C3%B3n_del_Sur', wikiLang: 'es' },
        { term: 'El Niño', text: 'La fase cálida de ENSO. Los alisios se debilitan, el agua cálida se extiende hacia el Pacífico oriental y las lluvias intensas pasan de Indonesia al centro del océano. El nombre viene de los pescadores peruanos, porque suele alcanzar su pico cerca de Navidad.', wiki: 'https://es.wikipedia.org/wiki/El_Ni%C3%B1o', wikiLang: 'es' },
        { term: 'La Niña', text: 'La fase fría de ENSO, en gran medida lo contrario de El Niño. Los alisios son más fuertes de lo habitual, el agua fría llega muy al oeste y las lluvias sobre Indonesia y Australia se intensifican.', wiki: 'https://es.wikipedia.org/wiki/La_Ni%C3%B1a', wikiLang: 'es' },
        { term: 'Súper El Niño', text: 'Nombre informal de un El Niño muy fuerte, cuando la anomalía en la región Niño 3.4 supera unos +2 °C. Ocurrió en 1982–83, 1997–98 y 2015–16, con impactos en todo el mundo.', wiki: 'https://es.wikipedia.org/wiki/El_Ni%C3%B1o', wikiLang: 'es' },
        { term: 'Oscilación del Sur', text: 'La “mitad” atmosférica de ENSO: cambios opuestos de la presión del aire sobre Tahití y sobre Darwin, en Australia. Cuando la diferencia de presión disminuye, los alisios se debilitan… y empieza El Niño.', wiki: 'https://es.wikipedia.org/wiki/Oscilaci%C3%B3n_del_Sur', wikiLang: 'es' },
        { term: 'Niño 3.4', text: 'Un recuadro en el Pacífico ecuatorial (5°S–5°N, 170°O–120°O). La anomalía media de la temperatura del agua en él es la principal medida de la intensidad de ENSO: por encima de +0,5 °C, El Niño; por debajo de −0,5 °C, La Niña.', wiki: 'https://en.wikipedia.org/wiki/El_Ni%C3%B1o%E2%80%93Southern_Oscillation', wikiLang: 'en' },
        { term: 'Anomalía de temperatura', text: 'La diferencia entre la temperatura actual y el promedio de muchos años para ese lugar y época del año. Una anomalía de +2 °C significa “2 °C más cálido de lo normal”, no “2 °C”.', wiki: 'https://es.wikipedia.org/wiki/Anomal%C3%ADa_de_temperatura', wikiLang: 'es' }
      ]
    },
    {
      title: 'Océano',
      terms: [
        { term: 'Temperatura superficial del mar (TSM)', text: 'La temperatura de la capa de agua más superficial, medida por satélites y boyas. Es la que más influye en la evaporación y la formación de nubes sobre el océano.', wiki: 'https://es.wikipedia.org/wiki/Temperatura_superficial_del_mar', wikiLang: 'es' },
        { term: 'Termoclina', text: 'Una capa delgada del océano en la que la temperatura baja rápidamente con la profundidad: el límite entre el agua cálida de superficie y la fría del fondo. En el Pacífico está inclinada: profunda al oeste, somera al este. Con El Niño se aplana.', wiki: 'https://es.wikipedia.org/wiki/Termoclina', wikiLang: 'es' },
        { term: 'Piscina cálida', text: 'Una enorme zona con el agua más cálida de la Tierra (más de 28–29 °C) en el Pacífico occidental y alrededor de Indonesia. Los alisios acumulan allí el agua cálida y sobre ella se forman enormes nubes de tormenta.', wiki: 'https://en.wikipedia.org/wiki/Indo-Pacific_Warm_Pool', wikiLang: 'en' },
        { term: 'Lengua fría', text: 'Una franja de agua más fresca a lo largo del ecuador en el Pacífico oriental, que parte de la costa de Sudamérica. La alimentan la fría corriente de Humboldt y el afloramiento. Se debilita con El Niño y llega más al oeste con La Niña.', wiki: 'https://es.wikipedia.org/wiki/Corriente_de_Humboldt', wikiLang: 'es' },
        { term: 'Afloramiento (upwelling)', text: 'Ascenso de agua profunda, fría y rica en nutrientes hacia la superficie cuando el viento aleja el agua de la costa. Frente a Perú alimenta algunas de las mayores pesquerías del mundo; por eso El Niño, que lo debilita, golpea a la pesca.', wiki: 'https://es.wikipedia.org/wiki/Afloramiento', wikiLang: 'es' },
        { term: 'Onda Kelvin', text: 'Una onda oceánica muy larga, invisible en la superficie, que viaja hacia el este a lo largo del ecuador en unos 2–3 meses. Transporta agua cálida y hunde la termoclina: es la que “lleva” El Niño hasta Sudamérica.', wiki: 'https://es.wikipedia.org/wiki/Onda_Kelvin', wikiLang: 'es' }
      ]
    },
    {
      title: 'Atmósfera',
      terms: [
        { term: 'Alisios', text: 'Vientos constantes de los trópicos que soplan de este a oeste y ligeramente hacia el ecuador. Sobre el Pacífico empujan el agua cálida hacia Indonesia. Su debilitamiento es señal de que se forma El Niño.', wiki: 'https://es.wikipedia.org/wiki/Vientos_alisios', wikiLang: 'es' },
        { term: 'Circulación de Walker', text: 'Un gran circuito de aire sobre el Pacífico ecuatorial: en superficie los alisios soplan hacia el oeste, sobre la piscina cálida el aire asciende, en altura regresa al este y desciende sobre el Pacífico oriental fresco. El Niño la debilita y la desplaza.', wiki: 'https://en.wikipedia.org/wiki/Walker_circulation', wikiLang: 'en' },
        { term: 'Convección', text: 'Ascenso de aire cálido y húmedo. Al subir se enfría y el vapor de agua se condensa: crecen nubes de tormenta y caen aguaceros. La zona de convección sigue al agua más cálida.', wiki: 'https://es.wikipedia.org/wiki/Convecci%C3%B3n_atmosf%C3%A9rica', wikiLang: 'es' },
        { term: 'Cumulonimbo', text: 'Una nube de tormenta muy alta que puede llegar a la tropopausa. Arriba se aplana en un característico “yunque”. Trae aguaceros, rayos y viento racheado.', wiki: 'https://es.wikipedia.org/wiki/Cumulonimbus', wikiLang: 'es' },
        { term: 'Zona de convergencia intertropical (ZCIT)', text: 'Un cinturón alrededor de la Tierra cerca del ecuador donde se encuentran los alisios de ambos hemisferios. Allí el aire asciende, por eso hay nubes y lluvia. Sobre el Pacífico suele estar unos grados al norte del ecuador.', wiki: 'https://es.wikipedia.org/wiki/Zona_de_convergencia_intertropical', wikiLang: 'es' },
        { term: 'Tropopausa', text: 'El límite superior de la troposfera, la capa más baja de la atmósfera, donde ocurre el tiempo. En los trópicos está a unos 16–17 km. Las nubes de tormenta se detienen bajo ella y se extienden a los lados.', wiki: 'https://es.wikipedia.org/wiki/Tropopausa', wikiLang: 'es' },
        { term: 'Ráfagas de viento del oeste (WWB)', text: 'Episodios de viento fuerte del oeste sobre el Pacífico occidental que duran unos días y soplan contra los alisios. Generan ondas Kelvin y a menudo “encienden” El Niño.', wiki: 'https://en.wikipedia.org/wiki/Westerly_wind_burst', wikiLang: 'en' }
      ]
    },
    {
      title: 'Impactos',
      terms: [
        { term: 'Teleconexiones', text: 'Vínculos entre el tiempo de lugares muy alejados. Un cambio sobre el Pacífico desplaza las corrientes en chorro y afecta a las lluvias y temperaturas a miles de kilómetros: en África, América o Asia.', wiki: 'https://en.wikipedia.org/wiki/Teleconnection', wikiLang: 'en' },
        { term: 'Monzón', text: 'Un cambio estacional de la dirección del viento que trae la estación lluviosa, por ejemplo en la India en verano. El Niño suele debilitar el monzón indio, con riesgo de sequía.', wiki: 'https://es.wikipedia.org/wiki/Monz%C3%B3n', wikiLang: 'es' },
        { term: 'Dipolo del océano Índico (IOD)', text: 'El “primo” de ENSO en el océano Índico: la diferencia de temperatura del agua entre su parte occidental y la oriental. Un dipolo positivo (a menudo junto con El Niño) trae sequías en Indonesia y Australia y aguaceros en África oriental. En el globo, las dos zonas de medición están marcadas con una línea violeta discontinua (50–70°E y 90–110°E) y la etiqueta muestra la diferencia de sus anomalías: el índice DMI.', wiki: 'https://es.wikipedia.org/wiki/Dipolo_del_oc%C3%A9ano_%C3%8Dndico', wikiLang: 'es' }
      ]
    }
  ],

  methodology: {
    title: 'Datos y metodología',
    subtitle: 'Cómo se calculan las temperaturas, anomalías y las áreas geográficas',
    items: [
      {
        label: 'Anomalía de temperatura Niño 3.4',
        area: 'Región Niño 3.4 (5°S–5°N, 170°W–120°W) · ~6,2 millones de km²',
        text: 'El índice principal de intensidad de El Niño. Se calcula como la desviación media de la temperatura superficial del mar respecto a la media climatológica de 30 años (1971–2000) en todas las celdas marinas del recuadro. Anomalías superiores a +0,5 °C indican El Niño, superiores a +2,0 °C Súper El Niño, e inferiores a −0,5 °C La Niña.'
      },
      {
        label: 'Temperatura del agua (SST)',
        area: 'Océano global (89,75°S–89,75°N, 179,75°W–179,75°E) · malla de 0,5° × 0,5° (~3080 km² por celda en el ecuador)',
        text: 'Generada a partir de los datos diarios de NOAA OISST v2.1 que combinan satélites, boyas y barcos con 2 fases de dilatación costera. Cada punto del globo muestrea con precisión la celda local de 0,5° interpolada según la fecha seleccionada en la línea temporal.'
      },
      {
        label: 'Temperatura del aire (2 m)',
        area: 'Zona tropical y continentes · malla de 10° × 10° de los modelos Open-Meteo y ECMWF',
        text: 'Temperatura del aire modelada a 2 metros de altitud. Los valores locales se interpolan bilinealmente a partir de los nodos de la malla y se sincronizan con la fecha de la línea temporal y el acoplamiento oceánico regional.'
      },
      {
        label: 'Interpolación y suavizado gaussiano',
        area: 'Shader y textura visual de la superficie del globo',
        text: 'Para visualizar datos de cuadrícula meteorológica discretos como un campo natural continuo, la capa de visualización aplica un filtro de desenfoque gaussiano que interpola suavemente las transiciones térmicas y elimina artefactos.'
      }
    ]
  },

  built: {
    title: 'Cómo lo hicimos',
    rows: [
      { label: 'Tecnología', text: 'Angular y Three.js (globo en WebGL) con un corte transversal dibujado en canvas. Sin backend: un sitio estático en GitHub Pages, con datos que GitHub Actions actualiza cada día.' },
      { label: 'Datos', text: 'Temperatura del mar NOAA OISST, tiempo de Open-Meteo, el pronóstico ENSO de NOAA CPC, impactos en la lluvia según la OMM, el JRC de la UE y la JMA, y eventos históricos con sus fuentes enlazadas en la aplicación.' },
      { label: 'Interpolación visual', text: 'Se aplica un filtro de desenfoque gaussiano a la visualización para interpolar y suavizar suavemente los datos discretos de la cuadrícula meteorológica en la superficie del globo.' },
      { label: 'Tiempo de desarrollo', text: 'Unas dos semanas, con un equipo de tres personas.' }
    ],
    teamLink: 'Conoce al equipo'
  },

  sourcesTitle: 'Fuentes de datos y licencias',
  sourcesList: [
    {
      name: 'NOAA OISST v2.1',
      url: 'https://www.ncei.noaa.gov/products/optimum-interpolation-sst',
      license: 'Dominio público (Gobierno de EE. UU.)',
      desc: 'Análisis diario de 0,5° de temperatura de la superficie del mar a partir de radiómetros satelitales, boyas a la deriva y buques de investigación.'
    },
    {
      name: 'Open-Meteo',
      url: 'https://open-meteo.com/',
      license: 'CC BY 4.0',
      desc: 'Modelos globales de previsión y reanálisis (ECMWF, DWD, NOAA), con temperatura del aire a 2 m, viento en superficie a 10 m y oleaje marino.'
    },
    {
      name: 'NOAA CPC ENSO Diagnostics',
      url: 'https://www.cpc.ncep.noaa.gov/',
      license: 'Dominio público (Gobierno de EE. UU.)',
      desc: 'Anomalías del Niño 3.4, discusiones diagnósticas mensuales y modelos probabilísticos de predicción ENSO del Centro de Predicción Climática.'
    },
    {
      name: 'OMM · JRC (UE) · JMA Tokyo Climate Center',
      url: 'https://wmo.int/',
      license: 'Acceso abierto',
      desc: 'Patrones continentales de anomalías de precipitación, cambios en el monzón y clasificaciones regionales de lluvia durante El Niño y La Niña.'
    },
    {
      name: 'Registros de desastres e impactos históricos',
      url: 'https://es.wikipedia.org/wiki/El_Ni%C3%B1o-Oscilaci%C3%B3n_del_Sur',
      license: 'Abierto / CC BY-SA 4.0',
      desc: 'Pérdidas económicas, inundaciones y sequías recopiladas directamente de informes de CDC MMWR, FAO GIEWS, FEMA, UNDRR y ReliefWeb de la ONU.'
    }
  ],

  regions: [
    { name: 'Indonesia y Filipinas', season: 'jun–feb' },
    { name: 'Australia', season: 'jul–ene' },
    { name: 'África austral', season: 'nov–mar' },
    { name: 'India (monzón)', season: 'jun–sep' },
    { name: 'Sahel', season: 'jul–sep' },
    { name: 'Etiopía', season: 'jun–sep' },
    { name: 'Centroamérica', season: 'jun–feb' },
    { name: 'Norte de Sudamérica y Amazonía', season: 'dic–jun' },
    { name: 'Nordeste de Brasil', season: 'feb–may' },
    { name: 'Costa de Perú y Ecuador', season: 'dic–abr' },
    { name: 'Sudeste de Sudamérica', season: 'sep–abr' },
    { name: 'Chile central', season: 'jun–ago' },
    { name: 'África oriental', season: 'oct–dic' },
    { name: 'Sur de EE. UU. y norte de México', season: 'nov–abr' },
    { name: 'Asia Central y Oriente Medio', season: 'ene–abr' },
    { name: 'Sudeste de China y sur de Japón', season: 'nov–feb' },
    { name: 'Pacífico central (lluvia sobre el océano)', season: 'todo el año' }
  ],
  impactSourceTitles: [
    'OMM – El Niño altera los patrones de lluvia en distintas partes del mundo (2026)',
    'Centro Común de Investigación de la Comisión Europea (JRC) – informe ENSO, mapa de impactos (2026)',
    'JMA Tokyo Climate Center – Impactos de El Niño/La Niña en el clima mundial'
  ],

  events: [
    { name: 'Perú', region: 'Sudamérica', ev: [
      { type: 'Colapso de la pesca de anchoveta peruana: crisis de la pesca y de la industria de harina de pescado',
        aff: 'La captura cayó de 10,3 millones de t (1971) a 4,4 millones de t (1972); en 1970 los productos pesqueros aportaban cerca de 1/3 de los ingresos por exportaciones de Perú. Más de 200 millones de USD de deuda del sector con la banca estatal; la industria se nacionalizó en 1973.',
        note: 'La sobrepesca previa también contribuyó al colapso.' },
      { type: 'Aguaceros e inundaciones en la costa, deslizamientos, pérdidas en pesca y agricultura',
        aff: 'Pérdidas de unos 3500 millones de USD (cerca del 4,5 % del PIB); el crecimiento del PIB en 1998 fue hasta 2,8 puntos porcentuales menor. En toda la Comunidad Andina, unas 135 000 viviendas dañadas o destruidas.' } ] },
    { name: 'Ecuador', region: 'Sudamérica', ev: [
      { area: 'Ecuador y norte de Perú', type: 'Aguaceros e inundaciones en la costa, destrucción de infraestructura',
        aff: 'Unas 600 víctimas mortales, pérdidas de unos 650 millones de USD (Ecuador y norte de Perú en conjunto).' },
      { type: 'Inundaciones en las llanuras costeras',
        aff: 'Pérdidas de unos 2900 millones de USD, es decir, el 14,6 % del PIB de Ecuador: las mayores pérdidas relativas de la región.' } ] },
    { name: 'Sur de Brasil, norte de Argentina, Paraguay', region: 'Sudamérica', ev: [
      { type: 'Aguaceros prolongados e inundaciones en la cuenca del Paraná',
        aff: '170 víctimas mortales, unas 600 000 personas evacuadas, pérdidas de unos 3000 millones de USD.' } ] },
    { name: 'Brasil – estado de Amazonas', region: 'Sudamérica', ev: [
      { type: 'Sequía récord, fuerte descenso del nivel del río Negro',
        aff: '60 de los 62 municipios del estado afectados por la sequía (incluida Manaos); unas 500 000 personas con acceso difícil al agua y los alimentos; más de 100 delfines de río muertos en el lago Tefé.',
        note: 'La sequía la causó El Niño junto con el calentamiento del Atlántico norte tropical.' } ] },
    { name: 'Argentina', region: 'Sudamérica', ev: [
      { type: 'Sequía histórica en la Pampa, la peor cosecha de soja en 23 años',
        aff: 'Pérdidas para la economía de unos 20 000 millones de USD (más del 3 % del PIB); cosechas de soja, maíz y trigo cerca de un 45 % menores interanualmente; ingresos por exportación de soja unos 8000 millones de USD menores.',
        note: 'La causa principal fue una tercera La Niña consecutiva; el cambio climático agravó la sequía (World Weather Attribution).' } ] },
    { name: 'Colombia', region: 'Sudamérica', ev: [
      { type: 'Una temporada de lluvias récord: inundaciones y deslizamientos',
        aff: '3,66 millones de personas afectadas, 469 víctimas mortales, 13 351 viviendas destruidas y unas 492 000 dañadas; 29 de 32 departamentos; más de 1,2 millones de ha de cultivos inundados (abr 2010 – jun 2011).' } ] },
    { name: 'California, EE. UU.', region: 'Norteamérica', ev: [
      { type: 'Tormentas invernales, aguaceros, deslizamientos e inundaciones',
        aff: '17 víctimas mortales, pérdidas de unos 883 millones de USD; 40 condados declarados zona de desastre federal.' } ] },
    { name: 'Texas, EE. UU.', region: 'Norteamérica', ev: [
      { type: 'Sequía y calor récord: el año más seco registrado en Texas',
        aff: 'Pérdidas agrícolas de 7620 millones de USD (ganadería 3230 millones, algodón 2200 millones); se abandonó el 55 % de los campos de algodón sembrados. La sequía más costosa de la historia del estado.',
        note: 'La sequía coincidió con La Niña de 2010–12.' } ] },
    { name: 'Corredor Seco Centroamericano', region: 'Guatemala, El Salvador, Honduras', ev: [
      { type: 'Sequía de varios años, pérdida de las cosechas de granos básicos',
        aff: 'Unos 3,5 millones de personas necesitadas de ayuda humanitaria; 1,6 millones en inseguridad alimentaria moderada o grave. El PMA apoyó a cerca de 1 millón de personas al año.' } ] },
    { name: 'Panamá', region: 'Centroamérica', ev: [
      { type: 'Sequía, nivel récord mínimo del lago Gatún',
        aff: 'El tránsito por el Canal de Panamá se redujo de 38 a 24 buques diarios (cerca de un 30 % menos); octubre de 2023 tuvo un 43 % menos de lluvia de lo normal. El lago Gatún abastece de agua potable a millones de personas (incl. Ciudad de Panamá y Colón).' } ] },
    { name: 'África austral (región SADC)', region: 'Zimbabue, Zambia, Malaui, Mozambique y otros', ev: [
      { type: 'La peor sequía y mala cosecha en décadas',
        aff: 'Unos 40 millones de personas en inseguridad alimentaria (cerca del 14 % de la población de la SADC); Zimbabue y Malaui declararon el estado de desastre; un llamamiento regional por 2400 millones de USD.' },
      { type: '“La sequía del siglo”: lluvias hasta un 90 % por debajo de lo normal',
        aff: 'Unos 18 millones de personas en riesgo de hambre en la región; necesidades de importación de cereales de 7,73 millones de t.',
        note: 'La sequía coincidió con El Niño de 1991–92.' },
      { type: 'Sequía y mala cosecha en la temporada 2023/24',
        aff: 'Unos 68 millones de personas (17 % de la población de la región) necesitadas de ayuda, según la SADC.' } ] },
    { name: 'Mozambique', region: 'Sudeste de África', ev: [
      { type: 'Inundaciones del Limpopo y ciclón Eline',
        aff: 'Unas 700–800 víctimas mortales; unas 463 000 personas desplazadas o sin hogar; pérdidas de unos 500 millones de USD.',
        note: 'Las lluvias récord coincidieron con La Niña de 1999–2000.' } ] },
    { name: 'Etiopía', region: 'Cuerno de África', ev: [
      { type: 'Sequía extrema, temporadas de lluvias fallidas',
        aff: '10,2 millones de personas necesitadas de ayuda humanitaria urgente (Gobierno de Etiopía y agencias de la ONU, principios de 2016); las necesidades humanitarias se triplicaron desde principios de 2015.' } ] },
    { name: 'Kenia y sur de Somalia', region: 'África oriental', ev: [
      { type: 'Las peores inundaciones desde 1961 y una epidemia de fiebre del valle del Rift',
        aff: 'Lluvias 60–100 veces por encima de lo normal para la temporada; unas 89 000 infecciones estimadas de fiebre del valle del Rift; 478 muertes sin explicar notificadas en diciembre de 1997; pérdida de cerca del 70 % de ovejas y cabras en los rebaños estudiados.',
        note: 'Los aguaceros de octubre de 1997 a enero de 1998 coincidieron con un Súper El Niño.' } ] },
    { name: 'Somalia', region: 'Cuerno de África', ev: [
      { type: 'Inundaciones de la temporada de lluvias Deyr (“una vez en un siglo”)',
        aff: 'Unos 1,2 millones de personas afectadas (9.11.2023), con previsión de hasta 1,6 millones; hasta 1,5 millones de ha de cultivos en riesgo.',
        note: 'Las lluvias se intensificaron por El Niño junto con un dipolo positivo del océano Índico.' },
      { type: 'El año más seco en 60 años, hambruna',
        aff: 'Unas 258 000 muertes (oct 2010 – abr 2012), incluidos unos 133 000 niños menores de 5 años: el 4,6 % de la población del sur y centro de Somalia.',
        note: 'Las lluvias fallidas coincidieron con la fuerte La Niña de 2010–11; el conflicto y el alza de los precios de los alimentos agravaron la tragedia.' } ] },
    { name: 'Cuerno de África', region: 'Etiopía, Kenia, Somalia', ev: [
      { type: 'La sequía más larga registrada: una temporada de lluvias fallida tras otra',
        aff: 'Más de 30 millones de personas en inseguridad alimentaria (2020–22); en Somalia, 7,8 millones de afectados (46 % de la población, oct 2022); en Kenia, 6,4 millones necesitados de ayuda en 2023.',
        note: 'La Niña de tres años de 2020–22 fue la más fuerte en la región en 70 años.' } ] },
    { name: 'Indonesia', region: 'Sudeste Asiático', ev: [
      { type: 'La peor sequía en unos 50 años, incendios de bosques y turberas, bruma transfronteriza',
        aff: 'La bruma afectó a unos 75 millones de personas (incl. 48 millones de indonesios); ardieron unos 25 millones de acres (cerca de 10 millones de ha); pérdidas de unos 9000 millones de USD.' },
      { type: 'Sequía e incendios de turberas, bruma sobre la región',
        aff: '2,6 millones de ha quemadas (jun–oct 2015); un coste de unos 16 100 millones de USD, es decir, el 1,9 % del PIB (Banco Mundial).',
        note: 'La temporada de incendios coincidió con el Súper El Niño de 2015–16, que prolongó la estación seca.' } ] },
    { name: 'Papúa Nueva Guinea', region: 'Oceanía', ev: [
      { type: 'Sequía y heladas en las tierras altas, incendios',
        aff: 'En diciembre de 1997, unas 260 000 personas comían “alimentos de hambruna” y otras 980 000 tenían raciones escasas y de mala calidad; Australia lanzó alimentos desde el aire para unas 100 000 personas en lugares accesibles solo por vía aérea.' } ] },
    { name: 'China – cuenca del Yangtsé', region: 'Asia oriental', ev: [
      { type: 'Inundaciones catastróficas en el Yangtsé y en el noreste de China',
        aff: 'Unos 180 millones de afectados, 3704–4150 víctimas mortales, unos 15 millones sin hogar; pérdidas de unos 24 000 millones de USD.',
        note: 'El verano de 1998 fue la fase de debilitamiento de un Súper El Niño; los investigadores describen el vínculo como indirecto.' } ] },
    { name: 'Vietnam – delta del Mekong', region: 'Sudeste Asiático', ev: [
      { type: 'Sequía e intrusión de agua salada en el delta',
        aff: 'Más de 2 millones de personas afectadas, unos 2 millones con escasez de agua, 1,1 millones en inseguridad alimentaria; 14 provincias declararon el estado de emergencia.' } ] },
    { name: 'India', region: 'Asia meridional', ev: [
      { type: 'Monzón débil y sequía',
        aff: 'Lluvias al 77 % de lo normal (−23 %); sequía declarada en 352 distritos de 15 estados; la producción de cereales cayó de 234 a 218 millones de t (cerca de −6,9 %).',
        note: 'La NOAA clasifica 2009 como un año de El Niño moderado.' } ] },
    { name: 'Pakistán', region: 'Asia meridional', ev: [
      { type: 'Inundaciones monzónicas: cerca de 1/5 del país bajo el agua',
        aff: 'Unos 20 millones de personas afectadas, 1985 víctimas mortales; pérdidas estimadas de hasta 43 000 millones de USD.',
        note: 'El mapa de anomalías de lluvia de la NASA relaciona el monzón excepcionalmente intenso con La Niña.' },
      { type: 'Inundaciones monzónicas récord',
        aff: 'Unos 33 millones de personas afectadas, 1739 víctimas mortales, más de 2,1 millones sin hogar; daños de unos 14 900 millones de USD y pérdidas de unos 15 200 millones de USD (Gobierno de Pakistán).',
        note: 'La inundación coincidió con la triple La Niña de 2020–23; las causas principales fueron un monzón récord, el deshielo de glaciares y el cambio climático.' } ] },
    { name: 'Bangladés', region: 'Asia meridional', ev: [
      { type: 'Inundaciones monzónicas catastróficas: más de la mitad del país bajo el agua',
        aff: '25–28 millones de personas sin hogar (estimaciones oficiales); afectados cerca de 2/3 de los 110 millones de habitantes en 50 de 64 distritos; cifra oficial de unas 500 víctimas (septiembre de 1988), muchas por mordeduras de serpiente y agua contaminada.',
        note: 'La inundación coincidió con la fuerte La Niña de 1988–89.' } ] },
    { name: 'Tailandia', region: 'Sudeste Asiático', ev: [
      { type: 'La gran inundación (Bangkok, Ayutthaya)',
        aff: '13,6 millones de personas afectadas, 815 víctimas mortales; 65 provincias declaradas zona de desastre; pérdidas de unos 46 500 millones de USD (Banco Mundial).',
        note: 'Las lluvias prolongadas se intensificaron por una La Niña de varios años.' } ] },
    { name: 'Australia – Victoria y Australia Meridional', region: 'Australia', ev: [
      { type: 'Sequía, tormentas de polvo e incendios forestales (Miércoles de Ceniza, 16.02.1983)',
        aff: '75 víctimas de los incendios; más de 3700 edificios destruidos o dañados, unas 2545 personas y familias sin hogar; murieron más de 340 000 ovejas; un coste de más de 400 millones de AUD (precios de 1983).',
        note: 'Los incendios fueron precedidos por una sequía ligada a El Niño: las lluvias del invierno y la primavera de 1982 fueron hasta la mitad del mínimo anterior.' } ] },
    { name: 'Australia – Queensland', region: 'Australia', ev: [
      { type: 'Inundaciones catastróficas (Brisbane, Toowoomba)',
        aff: 'Más de 200 000 personas afectadas directamente; el 78 % del estado declarado zona de desastre (más de 2,5 millones de habitantes); unas 29 000 viviendas y empresas inundadas; 33+ víctimas; pérdidas aseguradas de 2380 millones de AUD y coste total de 14 100 millones de AUD.',
        note: 'Las inundaciones fueron precedidas por el diciembre más lluvioso de la historia del estado, durante una fuerte La Niña.' } ] }
  ],
  srcTitles: {
    anch: 'Wikipedia – Crisis de la anchoveta peruana de 1972',
    nps: 'Naval Postgraduate School – Efectos económicos de El Niño (1982–83)',
    eird: 'UN ISDR / CAF – El Niño 1997–98 en los países andinos',
    ash: 'Wikipedia – Incendios forestales del Miércoles de Ceniza',
    idn97: 'EBSCO Research Starters – incendios en Indonesia 1997–98',
    idn15: 'BenarNews (datos del Banco Mundial) – incendios de 2015',
    png: 'Devpolicy Blog (ANU) – Riesgos alimentarios en PNG: lecciones de 1997',
    rvf: 'CDC MMWR – fiebre del valle del Rift, África oriental 1997–98',
    chn: 'Wikipedia – Inundaciones de China de 1998',
    cal: 'Government Technology (datos de FEMA) – El Niño 1997–98',
    saf15: 'Public Finance Focus – llamamiento de la SADC, julio de 2016',
    eth: 'ONU en Etiopía – Sequía: 10 millones de personas necesitadas (2016)',
    cam: 'WFP USA / FAO – Corredor Seco Centroamericano, 30.06.2016',
    vnm: 'ReliefWeb (UN OCHA / ECHO) – Vietnam, 29.04.2016',
    saf92: 'FAO GIEWS – Informe sobre la sequía de 1991/92',
    saf24: 'Al Jazeera (datos de la SADC) – 17.08.2024',
    som23: 'UN OCHA / ReliefWeb – Somalia, 9.11.2023',
    amz: 'Mongabay – sequía en la Amazonía, octubre de 2023',
    pan: 'Woodwell Climate Research Center – la sequía y el Canal de Panamá',
    ind09: 'ThePrint – los monzones débiles de 2009 y 2014',
    qld: 'Wikipedia – Inundaciones de Queensland de 2010–2011',
    pak10: 'Wikipedia – Inundaciones de Pakistán de 2010',
    pak22: 'Wikipedia – Inundaciones de Pakistán de 2022',
    som11: 'FSNAU (FAO) / FEWS NET – estudio de mortalidad, 2.05.2013',
    horn: 'UNDRR – Inundaciones y sequía en el Cuerno de África 2020–2023',
    arg: 'Dialogue Earth – La Niña y la sequía en Argentina',
    tha: 'Wikipedia – Inundaciones de Tailandia de 2011',
    col: 'RPP / Dirección de Gestión del Riesgo – junio de 2011',
    tex: 'Drovers (Texas AgriLife Extension) – marzo de 2012',
    bgd: 'ReliefWeb – informes de situación de UNDRO, inundaciones de 1988',
    moz: 'Wikipedia – Inundación de Mozambique de 2000'
  },

  inspectCoords: (lat: number, lon: number) => {
    const ns = lat >= 0 ? `${lat.toFixed(1).replace('.', ',')}°N` : `${Math.abs(lat).toFixed(1).replace('.', ',')}°S`;
    const ew = lon >= 0 ? `${lon.toFixed(1).replace('.', ',')}°E` : `${Math.abs(lon).toFixed(1).replace('.', ',')}°W`;
    return `${ns}, ${ew}`;
  },
  inspectWater: 'Agua',
  inspectAir: 'Aire',
  inspectNoWater: '-'
};
