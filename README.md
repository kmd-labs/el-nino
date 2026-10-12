# Super El Niño — Glob 3D

Interaktywna aplikacja webowa w **Angular 21** wizualizująca cykl zjawiska **El Niño–Southern Oscillation (ENSO)** oraz **Super El Niño** w trójwymiarowej przestrzeni z wykorzystaniem **Three.js**.

Projekt łączy fizyczno-klimatologiczny model anomalii temperatury oceanu (SST), model cyrkulacji atmosferycznej Walkera, przekrój głębokościowy termokliny wzdłuż równika oraz bazę udokumentowanych historycznych skutków klimatycznych i gospodarczych na całym świecie.

Aplikacja jest przystosowana do hostingu na **GitHub Pages** pod adresem:  
`https://kmd-labs.github.io/el-nino/`

---

## 🌟 Główne funkcjonalności

- **Interaktywny Glob 3D (Three.js)**:
  - Generowanie w czasie rzeczywistym dynamicznej tekstury danych SST (720×360 punktów siatki, 259 200 komórek) z tablicami kolorów (LUT) dla temperatury bezwzględnej oraz anomalii.
  - Wektory lądów w oparciu o Natural Earth / `world-atlas` (z lokalnym fallbackiem bez zależności od sieci zewnętrznej).
  - Oznaczenie prostokąta monitorowania wskaźnika **Niño 3.4** (170°W–120°W, 5°S–5°N).
  - Shader poświaty atmosferycznej oraz gwiezdne tło w głębokiej przestrzeni.
  - OrbitControls z automatycznym obrotem i płynnym tłumieniem (damping).

- **Atmosfera i Cyrkulacja Walkera**:
  - Symulacja cząsteczkowa przepływu powietrza wzdłuż pasatów i komórek Walkera z gradientem temperatury (unoszenie ciepłego powietrza, opadanie chłodnego).
  - Proceduralne chmury konwekcyjne skupiające się wokół przemieszczającego się centrum konwekcji.
  - Smugi opadów deszczu pod centrum burzowym.

- **Przekrój Pionowy Termokliny Pacyfiku (0–300 m)**:
  - Dynamiczny profil głębokościowy wzdłuż równika od Indonezji (120°E) po wybrzeże Ameryki Południowej (80°W).
  - Rysowanie krzywej termokliny oraz warstw termicznych zależnych od siły pasatów i fazy ENSO.

- **Baza Historycznych Skutków (Impact Pins)**:
  - 23 globalne lokalizacje i ponad 30 szczegółowo opisanych zdarzeń (susze, pożary, powodzie, załamania rybołówstwa, epidemie).
  - Interaktywne pinezki 3D z detekcją kliknięć i najechania myszą.
  - Karta informacyjna z opisem wpływu na PKB/ludność, rolą ENSO oraz odnośnikami do źródeł naukowych i międzynarodowych (ONZ, FAO, CDC, Bank Światowy).

- **Panel Sterowania i Symulacja Cyklu**:
  - Predefiniowane stany: *La Niña*, *Neutralny*, *El Niño*, *Super El Niño*.
  - Płynny suwak siły ENSO (-2.00 do +3.00).
  - Animowany, 4-letni cykl ENSO odzwierciedlający fazy narastania, szczytu i wygasania z licznikiem miesięcy i lat.

---

## 🏗️ Architektura Aplikacji (Angular Best Practices)

Aplikacja została zaprojektowana zgodnie ze standardami architektury komponentowej Angular:

```
src/
├── _variables.scss               # System tokenów SCSS (kolory, typografia, promienie, animacje, mixiny)
├── styles.scss                   # Globalne style i reset
├── app/
│   ├── core/
│   │   ├── constants/
│   │   │   └── enso-data.ts      # Dane naukowe, palety LUT, punkty cyklu, baza historycznych zdarzeń
│   │   ├── models/
│   │   │   └── enso.model.ts     # Ścisłe interfejsy i typy TypeScript
│   │   └── services/
│   │       ├── enso-math.service.ts # Model matematyczny SST, cyrkulacji, projekcji sferycznych
│   │       └── enso-state.service.ts# Reaktywny stan aplikacji oparty na Angular Signals
│   ├── components/
│   │   ├── globe/                # Komponent 3D Three.js (WebGL, cząsteczki, pinezki, etykiety)
│   │   ├── header/               # Nagłówek ze wskaźnikiem anomalii i stanem wczytywania mapy
│   │   ├── control-panel/        # Pływający panel sterowania, legendy i przekrój termokliny
│   │   ├── impact-modal/         # Modal z detalami wybranego zdarzenia historycznego
│   │   └── ui/
│   │       ├── button/           # Reużywalny komponent przycisku (warianty, stany active/hot)
│   │       └── badge/            # Reużywalny komponent odznaki/statusu
│   ├── app.component.ts|html|scss# Główny kontener aplikacji
│   └── app.config.ts / main.ts
└── assets/
    └── data/
        └── land-50m.json         # Topologia kontynentów dla nakładki globu
```

---

## 🎨 Reużywalne Tokeny SCSS

Projekt korzysta z modularnego systemu SCSS w `src/_variables.scss`:
- Mapy SCSS: `$colors`, `$breakpoints`, `$transitions`, `$radii`, `$font-weights`, `$font-sizes`.
- Funkcje dostępowe: `color($key)`, `radius($key)`, `font-size($key)`, `font-weight($key)`, `transition($key)`.
- Mixiny:
  - `@mixin glass-panel($heavy)` — nowoczesny efekt frosted glass z `backdrop-filter: blur(...)`.
  - `@mixin respond-to($breakpoint)` — responsywność dopasowana do urządzeń mobilnych i desktopowych.
  - `@mixin custom-scrollbar` — minimalistyczny scrollbar pasujący do ciemnego motywu.

---

## 🚀 Uruchomienie Lokalne

Wymagany Node.js (wersja 20+) oraz npm:

```bash
# Instalacja zależności
npm install

# Uruchomienie serwera deweloperskiego (dostępny pod http://localhost:4200/)
npm start

# Budowanie wersji produkcyjnej
npm run build

# Budowanie z właściwym base-href dla GitHub Pages
npm run build:gh-pages
```

---

## 🌐 Wdrażanie na GitHub Pages (GitHub Actions)

Aplikacja wdraża się automatycznie na GitHub Pages przy pomocy przepływu CI/CD w `.github/workflows/deploy.yml`:

1. Po wypchnięciu zmian do gałęzi `main`, GitHub Actions uruchamia efemeryczną maszynę wirtualną (`ubuntu-latest`).
2. Maszyna pobiera kod, instaluje zależności (`npm ci`) i buduje zoptymalizowane pliki statyczne (`npm run build:gh-pages`).
3. Akcja `actions/upload-pages-artifact@v3` pakuje wygenerowany katalog `dist/el-nino/browser`.
4. Akcja `actions/deploy-pages@v4` publikuje statyczną stronę bezpośrednio na GitHub Pages.
5. Po zakończeniu zadania maszyna i wszystkie tymczasowe pliki są niszczone.
6. Katalog `dist/` jest w `.gitignore` i nigdy nie obciąża repozytorium gita.

### Konfiguracja repozytorium GitHub:
W ustawieniach repozytorium w sekcji **Settings -> Pages**:
- **Source**: wybierz **GitHub Actions**.
