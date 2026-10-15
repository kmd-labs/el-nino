import { GlossaryGroup } from '../i18n/i18n.types';

/**
 * Plain-language explanations of the terms used across the app, grouped by topic (Polish).
 * Links go to Polish Wikipedia where an article exists, otherwise English.
 */

export const GLOSSARY: GlossaryGroup[] = [
  {
    title: 'Podstawy',
    terms: [
      {
        term: 'ENSO (El Niño – Oscylacja Południowa)',
        text: 'Naturalne wahanie klimatu na równikowym Pacyfiku, powtarzające się co 2–7 lat. Ocean i atmosfera „huśtają się” razem między trzema stanami: El Niño, La Niña i stanem neutralnym.',
        wiki: 'https://en.wikipedia.org/wiki/El_Ni%C3%B1o%E2%80%93Southern_Oscillation',
        wikiLang: 'en'
      },
      {
        term: 'El Niño',
        text: 'Ciepła faza ENSO. Pasaty słabną, ciepła woda rozlewa się na wschód Pacyfiku, a ulewy przesuwają się z Indonezji nad środek oceanu. Nazwa („Dzieciątko”) pochodzi od peruwiańskich rybaków, bo zjawisko zwykle szczytuje około Bożego Narodzenia.',
        wiki: 'https://pl.wikipedia.org/wiki/El_Ni%C3%B1o',
        wikiLang: 'pl'
      },
      {
        term: 'La Niña',
        text: 'Chłodna faza ENSO, w dużej mierze odwrotność El Niño. Pasaty są silniejsze niż zwykle, zimna woda sięga daleko na zachód, a ulewy nad Indonezją i Australią się nasilają.',
        wiki: 'https://pl.wikipedia.org/wiki/La_Ni%C3%B1a',
        wikiLang: 'pl'
      },
      {
        term: 'Super El Niño',
        text: 'Potoczna nazwa bardzo silnego El Niño, gdy anomalia w regionie Niño 3.4 przekracza około +2 °C. Takie zdarzenia były w latach 1982–83, 1997–98 i 2015–16 i mają skutki na całym świecie.',
        wiki: 'https://pl.wikipedia.org/wiki/El_Ni%C3%B1o',
        wikiLang: 'pl'
      },
      {
        term: 'Oscylacja Południowa',
        text: 'Atmosferyczna „połowa” ENSO: przeciwstawne zmiany ciśnienia powietrza nad Tahiti i nad Darwin w Australii. Gdy różnica ciśnień maleje, słabną pasaty – i zaczyna się El Niño.',
        wiki: 'https://pl.wikipedia.org/wiki/Oscylacja_Po%C5%82udniowa',
        wikiLang: 'pl'
      },
      {
        term: 'Niño 3.4',
        text: 'Prostokąt na równikowym Pacyfiku (5°S–5°N, 170°W–120°W). Średnia anomalia temperatury wody w nim to podstawowa miara siły ENSO: powyżej +0,5 °C – El Niño, poniżej −0,5 °C – La Niña.',
        wiki: 'https://en.wikipedia.org/wiki/El_Ni%C3%B1o%E2%80%93Southern_Oscillation',
        wikiLang: 'en'
      },
      {
        term: 'Anomalia temperatury',
        text: 'Różnica między obecną temperaturą a średnią z wielu lat dla tego miejsca i pory roku. Anomalia +2 °C znaczy „o 2 °C cieplej niż zwykle”, a nie „2 °C”.',
        wiki: 'https://en.wikipedia.org/wiki/Temperature_anomaly',
        wikiLang: 'en'
      }
    ]
  },
  {
    title: 'Ocean',
    terms: [
      {
        term: 'Temperatura powierzchni oceanu (SST)',
        text: 'Temperatura najwyższej warstwy wody, mierzona z satelitów i boi. To ona najmocniej wpływa na parowanie i powstawanie chmur nad oceanem.',
        wiki: 'https://pl.wikipedia.org/wiki/Temperatura_powierzchni_oceanu',
        wikiLang: 'pl'
      },
      {
        term: 'Termoklina',
        text: 'Cienka warstwa w oceanie, w której temperatura szybko spada z głębokością – granica między ciepłą wodą przy powierzchni a zimną w głębi. Na Pacyfiku jest nachylona: głęboko na zachodzie, płytko na wschodzie. Podczas El Niño się wypłaszcza.',
        wiki: 'https://pl.wikipedia.org/wiki/Termoklina',
        wikiLang: 'pl'
      },
      {
        term: 'Ciepły basen (warm pool)',
        text: 'Ogromny obszar najcieplejszej wody na Ziemi (ponad 28–29 °C) w zachodnim Pacyfiku i przy Indonezji. Pasaty spychają tam ciepłą wodę, a nad nią powstają potężne chmury burzowe.',
        wiki: 'https://en.wikipedia.org/wiki/Indo-Pacific_Warm_Pool',
        wikiLang: 'en'
      },
      {
        term: 'Zimny jęzor',
        text: 'Pas chłodniejszej wody wzdłuż równika na wschodnim Pacyfiku, ciągnący się od wybrzeży Ameryki Płd. Zasilają go zimny Prąd Peruwiański i upwelling. Przy El Niño słabnie, przy La Niña sięga dalej na zachód.',
        wiki: 'https://pl.wikipedia.org/wiki/Pr%C4%85d_Peruwia%C5%84ski',
        wikiLang: 'pl'
      },
      {
        term: 'Upwelling',
        text: 'Wypływanie zimnej, bogatej w składniki odżywcze wody z głębin ku powierzchni, gdy wiatr odpycha wodę od brzegu. Przy Peru karmi jedne z największych łowisk świata – dlatego El Niño, który go osłabia, uderza w rybołówstwo.',
        wiki: 'https://pl.wikipedia.org/wiki/Upwelling',
        wikiLang: 'pl'
      },
      {
        term: 'Fala Kelvina',
        text: 'Bardzo długa, niewidoczna z powierzchni fala w oceanie, która płynie wzdłuż równika na wschód przez około 2–3 miesiące. Niesie ciepłą wodę i obniża termoklinę – to ona „przenosi” El Niño do Ameryki Płd.',
        wiki: 'https://pl.wikipedia.org/wiki/Fala_Kelvina',
        wikiLang: 'pl'
      }
    ]
  },
  {
    title: 'Atmosfera',
    terms: [
      {
        term: 'Pasaty',
        text: 'Stałe wiatry w tropikach, wiejące ze wschodu na zachód i lekko ku równikowi. Nad Pacyfikiem spychają ciepłą wodę w stronę Indonezji. Ich osłabienie to sygnał rozwoju El Niño.',
        wiki: 'https://pl.wikipedia.org/wiki/Pasat',
        wikiLang: 'pl'
      },
      {
        term: 'Cyrkulacja Walkera',
        text: 'Wielka pętla powietrza nad równikowym Pacyfikiem: przy powierzchni pasaty wieją na zachód, nad ciepłym basenem powietrze się wznosi, wysoko wraca na wschód i opada nad chłodnym wschodnim Pacyfikiem. El Niño ją osłabia i przesuwa.',
        wiki: 'https://en.wikipedia.org/wiki/Walker_circulation',
        wikiLang: 'en'
      },
      {
        term: 'Konwekcja',
        text: 'Unoszenie się ciepłego, wilgotnego powietrza. Gdy się wznosi, ochładza się, a para wodna skrapla – rosną chmury burzowe i padają ulewy. Strefa konwekcji podąża za najcieplejszą wodą.',
        wiki: 'https://pl.wikipedia.org/wiki/Konwekcja',
        wikiLang: 'pl'
      },
      {
        term: 'Cumulonimbus',
        text: 'Wysoka chmura burzowa sięgająca nawet tropopauzy. Na górze rozpłaszcza się w charakterystyczne „kowadło”. Przynosi ulewy, pioruny i porywisty wiatr.',
        wiki: 'https://pl.wikipedia.org/wiki/Cumulonimbus',
        wikiLang: 'pl'
      },
      {
        term: 'Międzyzwrotnikowa strefa zbieżności (ITCZ)',
        text: 'Pas wokół Ziemi blisko równika, gdzie zbiegają się pasaty z obu półkul. Powietrze się tu wznosi, więc jest pochmurno i deszczowo. Na Pacyfiku leży zwykle kilka stopni na północ od równika.',
        wiki: 'https://pl.wikipedia.org/wiki/Mi%C4%99dzyzwrotnikowa_strefa_zbie%C5%BCno%C5%9Bci',
        wikiLang: 'pl'
      },
      {
        term: 'Tropopauza',
        text: 'Górna granica troposfery – najniższej warstwy atmosfery, w której dzieje się pogoda. W tropikach leży na wysokości około 16–17 km. Chmury burzowe zatrzymują się pod nią i rozpływają na boki.',
        wiki: 'https://pl.wikipedia.org/wiki/Tropopauza',
        wikiLang: 'pl'
      },
      {
        term: 'Porywy wiatru zachodniego (WWB)',
        text: 'Kilkudniowe epizody silnego wiatru z zachodu nad zachodnim Pacyfikiem, wiejącego pod prąd pasatów. Wzbudzają fale Kelvina i często „zapalają” El Niño.',
        wiki: 'https://en.wikipedia.org/wiki/Westerly_wind_burst',
        wikiLang: 'en'
      }
    ]
  },
  {
    title: 'Skutki',
    terms: [
      {
        term: 'Telekoneksje',
        text: 'Powiązania pogody w odległych od siebie miejscach. Zmiana nad Pacyfikiem przesuwa prądy strumieniowe i wpływa na opady i temperaturę nawet tysiące kilometrów dalej – w Afryce, Ameryce czy Azji.',
        wiki: 'https://en.wikipedia.org/wiki/Teleconnection',
        wikiLang: 'en'
      },
      {
        term: 'Monsun',
        text: 'Sezonowa zmiana kierunku wiatru, która przynosi porę deszczową, np. w Indiach latem. El Niño często osłabia monsun indyjski, co grozi suszą.',
        wiki: 'https://pl.wikipedia.org/wiki/Monsun',
        wikiLang: 'pl'
      },
      {
        term: 'Dipol Oceanu Indyjskiego (IOD)',
        text: '„Kuzyn” ENSO na Oceanie Indyjskim: różnica temperatury wody między jego zachodnią a wschodnią częścią. Dodatni dipol (często razem z El Niño) to susze w Indonezji i Australii oraz ulewy w Afryce Wschodniej.',
        wiki: 'https://pl.wikipedia.org/wiki/Dipol_Oceanu_Indyjskiego',
        wikiLang: 'pl'
      }
    ]
  }
];
