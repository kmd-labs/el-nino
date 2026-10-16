# Super El Niño — 3D Globe Visualization

[![Deploy to GitHub Pages](https://github.com/kmd-labs/el-nino/actions/workflows/deploy.yml/badge.svg)](https://github.com/kmd-labs/el-nino/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-kmd--labs.github.io%2Fel--nino-ff6a2e?style=for-the-badge&logo=google-chrome&logoColor=white)](https://kmd-labs.github.io/el-nino/)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r184-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

An interactive 3D WebGL climatological simulation visualizing the **El Niño–Southern Oscillation (ENSO)** cycle and **Super El Niño** extremes. Built with **Angular 21**, **Three.js**, and modern SCSS design tokens.

🔗 **Explore Live Demo:** [https://kmd-labs.github.io/el-nino/](https://kmd-labs.github.io/el-nino/)

---

## 🌍 Key Features

- **Interactive 3D WebGL Globe**:
  - Real-time procedural Sea Surface Temperature (SST) data texture (720×360 grid, 259,200 points) dynamically computed using scientific basis functions and color LUTs.
  - Natural Earth continent vector overlays (`world-atlas` GeoJSON) with offline local asset fallback.
  - Precise delineation of the official **Niño 3.4 monitoring box** (170°W–120°W, 5°S–5°N).
  - Atmospheric rim glow shader with additive blending and starfield point cloud.
  - Smooth OrbitControls with momentum damping and toggleable auto-rotation.

- **Walker Circulation & Atmospheric Dynamics**:
  - Dual-cell tropospheric stream particle simulation with altitude-dependent thermodynamic coloring (warm rising air vs. cool subsiding air).
  - Procedural convective storm cloud puffs clustered around the shifting Pacific warm pool.
  - Dynamic rainfall streaks beneath the convective center.

- **Equatorial Thermocline Vertical Cross-Section (0–300 m)**:
  - Real-time depth profile across the equatorial Pacific from Indonesia (120°E) to South America (80°W).
  - Interactive visualization of the 20 °C isotherm / thermocline tilt under varying trade wind strengths.

- **Historical Impacts Database**:
  - 23 global pin locations with 30+ peer-documented climate events across South America, North America, Africa, Asia, and Oceania.
  - Interactive 3D billboard sprites with screen-space occlusion and raycast picking.
  - Detailed modal cards highlighting human and economic tolls (GDP loss, casualties, agricultural failure) with links to international institutions (UN OCHA, World Bank, CDC, FAO, NOAA).

- **Simulation & Time Controls**:
  - One-click presets: *La Niña* (-1.6), *Neutral* (0.0), *El Niño* (+1.2), and *Super El Niño* (+2.6).
  - Continuous ENSO strength slider (-2.00 to +3.00).
  - 4-year idealized ENSO cycle simulation with animated monthly progression.

---

## 🏗️ Architecture & Component Design

The codebase follows modern Angular standalone component architecture with reactive state management powered by **Angular Signals**:

```
src/
├── _variables.scss               # Reusable SCSS design system tokens (colors, radii, mixins, glass panels)
├── styles.scss                   # Global resets and typography
├── index.html                    # HTML entry point configured for GitHub Pages
├── main.ts                       # Application bootstrap
├── app/
│   ├── app.component.ts|html|scss# Root application shell
│   ├── core/
│   │   ├── constants/
│   │   │   └── enso-data.ts      # Scientific data constants, color LUTs, and historical event records
│   │   ├── models/
│   │   │   └── enso.model.ts     # TypeScript interfaces and domain types
│   │   └── services/
│   │       ├── enso-math.service.ts # Pure math model (climatology, anomalies, thermocline, 3D math)
│   │       └── enso-state.service.ts# Centralized reactive state using Angular Signals
│   └── components/
│       ├── globe/                # Three.js 3D viewport, particles, labels, and raycasting
│       ├── header/               # Top status bar with live Niño 3.4 index readout and badge
│       ├── control-panel/        # Floating glassmorphic control dock & thermocline canvas
│       ├── impact-modal/         # Event detail dialog with external research links
│       └── ui/
│           ├── button/           # Reusable button component with variant states
│           └── badge/            # Status badge pill with dynamic color transitions
└── assets/
    └── data/
        └── land-50m.json         # Bundled Natural Earth land topology
```

---

## 🎨 Design System & SCSS Tokens

All UI styling is strictly tokenized in [`src/_variables.scss`](src/_variables.scss):

- **Maps**: `$colors`, `$breakpoints`, `$transitions`, `$radii`, `$font-weights`, `$font-sizes`.
- **Accessor Functions**: `color($key)`, `radius($key)`, `font-size($key)`, `font-weight($key)`, `transition($key)`.
- **Mixins**:
  - `@mixin glass-panel($heavy)`: Glassmorphic panel styling with `backdrop-filter: blur(...)` and glowing border highlights.
  - `@mixin respond-to($breakpoint)`: Mobile-first responsive layout breakpoints.
  - `@mixin custom-scrollbar`: Sleek, unobtrusive dark-theme scrollbars.

---

## 🔬 Scientific Foundations

1. **Sea Surface Temperature (SST) Climatology**:
   $$T_{\text{clim}}(\lambda, \phi) = -1.8 + 30.5 \cos^{2.2}(\phi) + \sum_{k} A_k \exp\left(-\frac{\Delta\lambda_k^2}{w_k^2}\right) \exp\left(-\frac{\phi^2}{\sigma_k^2}\right)$$
   Models the Pacific warm pool, equatorial cold tongue, Humboldt Current, and global oceanic features.

2. **ENSO Anomaly Formulation**:
   $$A(\lambda, \phi, s) = \begin{cases} s \cdot \text{basis}_P + \max(0, s - 1.4) \cdot \text{basis}_C & \text{if } s \ge 0 \\ -s \cdot \text{basis}_N & \text{if } s < 0 \end{cases}$$
   Incorporates the non-linear coastal Peruvian warming characteristic of historic *Super El Niño* events (1982–83, 1997–98, 2015–16).

3. **Thermocline Profile**:
   Calculates the 20 °C isotherm depth across $120^\circ\text{E} \to 80^\circ\text{W}$ coupled to trade wind strength variations:
   $$z(\lambda, s) = -1.75 + 0.85 \cdot \text{trade}(s) \cdot u(\lambda)$$

---

## 💻 Local Development

### Prerequisites
- Node.js version 20+ (Node 22 LTS recommended)
- npm 10+

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/kmd-labs/el-nino.git
cd el-nino

# Install dependencies
npm install

# Start local development server (runs on http://localhost:4200/)
npm start

# Production build
npm run build

# Production build with GitHub Pages base-href
npm run build:gh-pages
```

---

## 🚀 Continuous Deployment (GitHub Actions)

Deployments to GitHub Pages are automated via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. **Trigger**: Pushes to `main` or manual `workflow_dispatch`.
2. **Build Stage**: Runs on `ubuntu-latest`, compiles the application with `npm run build:gh-pages` (`--base-href /el-nino/`), and uploads static assets via `actions/upload-pages-artifact@v3`.
3. **Deploy Stage**: Publishes to GitHub Pages with `actions/deploy-pages@v4`.
4. **Clean Workspace**: The build directory (`dist/`) is gitignored, and build artifacts reside strictly in ephemeral runner environments.

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).
