# JalDrishti 2030

**A decision-support prototype for neighbourhood water-stress planning in Bengaluru.**

[![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Status](https://img.shields.io/badge/status-frontend%20prototype-E2553B)](#roadmap)
[![Data](https://img.shields.io/badge/data-partly%20synthetic-8B8F93)](#what-is-real-and-what-is-not)

---

## What this is

JalDrishti is a planning layer, not a water management system. It sits *above* a
utility's existing operational infrastructure and answers a different question:
not "what is the network doing right now" but "which neighbourhoods will be
under water stress, and which package of interventions is worth funding?"

This repository is the frontend of that system — a working prototype with the
analytical layer running in the browser. The Python/FastAPI backend is a
separate, later phase.

The project is a software implementation of a research paper,
*JalDrishti 2030: An IoT–AI Digital Twin for Predictive Water-Stress and
Intervention Planning in Bengaluru*, submitted to the BRICS **SMART CITY 2030**
international student research competition.

---

## The problem

Bengaluru's water insecurity is not evenly spread, and a single citywide
supply-and-demand balance hides that. During the 2024 crisis a large share of
the city's borewells ran dry, and a groundwater assessment identified dozens of
wards and peripheral villages at high risk of shortage — while aggregate supply
capacity was simultaneously being increased. Adding water to the system does not
automatically reach the neighbourhood that has none.

The utility is not the obstacle. It runs centralised SCADA, GIS asset
management, bulk flow measurement and district metered areas. What is missing is
a layer that turns all of that into forward-looking, spatially targeted,
equity-aware planning decisions.

### The finding that shaped this build

The paper's Phase 2 audit went looking for the data such a layer would need, and
graded each variable against the resolution actually required:

| Grade | Meaning |
| :---: | --- |
| **A** | Directly usable ward-level numbers |
| **B** | Directly usable zone-level numbers |
| **C** | Spatial data that can reasonably be aggregated to wards |
| **D** | Categorical evidence only — not a measurement |
| **E** | Not available at the resolution the model requires |

Ward consumption, non-revenue water and supply reliability all came back at
**grade E**. Groundwater criticality exists only as a **grade D** categorical
notification. Rainfall and population reach **grade C**.

So the paper's headline result is a negative one: *the operational data this
model needs is not publicly published.* That is not an inconvenience to design
around. It is the finding, and this interface is built to make it visible rather
than to paper over it.

---

## What is real and what is not

This distinction is enforced in the type system, surfaced on every screen, and
is the single most important thing to understand about the project.

| Layer | Status | Notes |
| --- | --- | --- |
| Rainfall record (1991–2023) | **Real** | 33 complete years, measured series, grade C |
| Availability audit | **Real** | The paper's own Phase 2 findings |
| Intervention mechanisms & cost bands | **Real** | From the paper's intervention library |
| WSI mathematics | **Real** | Normalisation, entropy weighting, sensitivity |
| Forecast validation procedure | **Real** | Chronological holdout, MAE/RMSE, baseline gate |
| Non-dominated sort | **Real** | Genuine Pareto filtering over four objectives |
| Ward geometry | **Synthetic** | Seeded Voronoi lattice in real WGS84 coordinates |
| Ward consumption, losses, reliability | **Synthetic** | Every grade-E variable |
| Hydraulic network & pressures | **Synthetic** | Representative topology, *not* an EPANET solve |
| Intervention effect sizes | **Synthetic** | The paper gives bands, not benefit figures |

**No Bengaluru water-system result is claimed anywhere in this application.**
The ranking on the map is a demonstration of method. The header carries a
permanent synthetic-share readout, every fabricated value is hatched or tagged,
and the network page states in plain language that it is not a calibrated
digital twin.

---

## Key features

**Research story (`/`).** A 10-section presentation narrative — Problem → Research Concept →
Water-Stress Index → Prediction → Digital Twin → 2030 Scenarios → Intervention Planning →
Data Availability → Roadmap → Paper Traceability — built as the site's entry point for
presenting the paper alongside the working prototype. Every section carries a status badge
(**Real** / **Synthetic** / **Proposed** / **Validated**) stating precisely what kind of claim
it's making, and embeds live figures computed from the same `lib/` functions the dashboards use,
not a separate illustrative copy.

**Water-stress index that actually computes.** Min–max normalisation with
direction reversal for service-quality indicators, entropy weights derived from
the ward observation set, and per-indicator contribution breakdown. Switch
between entropy and equal weighting and the whole map recomputes — including a
Spearman rank-stability readout showing how far the priority order moved.

**Provenance tracing.** Click *"Why is this ward ranked 4th?"* and a drawer opens
the full chain: the ranking, the index run and its hash, the weighting and
normalisation steps, every indicator with its raw value, normalised value and
applied weight, then each indicator's source and the audit limitation that
governs it. The paper's Stage 6 gate reads *"users can trace recommendations to
data and assumptions"* — this is that gate, implemented.

**Scenario comparison.** The four 2030 planning scenarios from the paper, each
shifting demand, loss and supply multipliers through the index and the network.

**Representative hydraulic layer.** A looped distribution topology with leak,
pump-outage and supply-reduction perturbations, a minimum-pressure feasibility
gate, and per-junction pressure profile.

**Multi-objective intervention search.** 400 seeded portfolios evaluated against
cost, residual stress, population protected and equity-weighted protection, then
filtered by a real non-dominated sort. Budget and minimum-data-confidence act as
live constraints. Objectives are never collapsed into a single ranking.

**Data catalogue.** The Phase 2 audit rendered as an interactive table with
expandable limitations, plus the full source list with each dataset's tier.

---

## Screenshots

> Replace these placeholders after your first local run.

| | |
| --- | --- |
| ![Water stress overview](docs/screenshots/stress.png) | ![Provenance trace](docs/screenshots/trace.png) |
| **Water stress** — ward map, drivers, scenario controls | **Trace** — a ranking back to its sources |
| ![Network](docs/screenshots/network.png) | ![Interventions](docs/screenshots/optimise.png) |
| **Network** — representative zone under perturbation | **Interventions** — Pareto front with live budget |

---

## Technology

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15, App Router | Server components keep the lineage tree off the client bundle |
| Language | TypeScript 5.8, `strict` | Grade and synthetic flags are enforced at compile time |
| Styling | Tailwind CSS 4 | CSS-first `@theme` tokens, no config file to drift |
| Charts & map | Hand-written SVG | No library defaults leaking into the visual system |
| Geometry | Voronoi + Lloyd relaxation (Python) | Deterministic, reproducible, swappable for real GeoJSON |

**Runtime dependencies: `next`, `react`, `react-dom`. That is the whole list.**
No chart library, no map library, no animation library. Every visual element is
built in-repo, which is why the bar weights, tick styling and colour semantics
stay consistent across the app.

### Design system

| Token | Hex | Meaning |
| --- | --- | --- |
| `paper` | `#F2F2EF` | Base surface |
| `ink` | `#15181B` | Primary text |
| `coral` | `#E2553B` | Water stress, alerts, selection |
| `sage` | `#DDE7C1` | Adequate service |
| `deep` | `#16323D` | The piped network |

Type is **Archivo** for display, **IBM Plex Sans** for body, **IBM Plex Mono**
restricted to figures and axis ticks so numbers stay tabular down a column.

---

## Running locally

**Requirements:** Node.js 18.18+ (20+ recommended).

```bash
git clone https://github.com/<you>/jaldrishti-web.git
cd jaldrishti-web
npm install
npm run dev
```

Open <http://localhost:3000>.

```bash
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint
```

### Regenerating the ward lattice

Requires Python with `numpy` and `scipy`:

```bash
python3 tools/gen_wards.py > wards.json
```

Change `SEED` or `N_WARDS` at the top of the script for a different lattice.
See `tools/README.md` for wiring the output back into `src/data/wards.ts`.

---

## Project structure

```
src/
├─ app/
│  ├─ page.tsx              Research story — home, 10-section presentation narrative
│  ├─ stress/page.tsx       Water stress — map, drivers, scenarios
│  ├─ network/page.tsx      Level 2 representative network
│  ├─ optimise/page.tsx     Pareto explorer, intervention library
│  ├─ data/page.tsx         Availability audit and source catalogue
│  ├─ layout.tsx            Fonts and metadata
│  └─ globals.css           Design tokens, motion, hatching
│
├─ components/
│  ├─ shell/                Icon rail, header with synthetic readout
│  ├─ map/                  SVG choropleth, hover card, legend
│  ├─ panels/               Ward detail column
│  ├─ charts/               Sparkbars, forecast band, Pareto, pressure
│  ├─ provenance/           Grade chips, synthetic tags, trace drawer
│  └─ ui/                   Panel, CountUp, Tooltip
│
├─ lib/
│  ├─ wsi.ts                Normalisation, entropy weighting, rank stability
│  ├─ forecast.ts           Baseline vs candidate, chronological validation
│  ├─ optimise.ts           Portfolio generation, non-dominated sort, equity
│  ├─ geo.ts                WGS84 → SVG projection
│  ├─ format.ts             Display units in one place
│  └─ api.ts                The seam where the backend plugs in
│
├─ data/                    Fixtures — replaceable without touching the UI
│  ├─ wards.ts              Generated lattice + indicators
│  ├─ catalogue.ts          Indicators, audit, sources, rainfall record
│  └─ interventions.ts      Library, scenarios, network topology
│
└─ types/index.ts           Domain types mirroring the paper
```

### Separation of data and UI

No component computes a domain value inline. Pages read fixtures, hand them to
`src/lib`, and render the result. `src/lib/api.ts` already declares the return
shape of every backend endpoint, so wiring the real service is a mechanical pass
over four files rather than a rewrite.

---

## Roadmap

**Phase 1 — Frontend prototype** ✅ *this repository*

**Phase 2 — Backend foundation**
FastAPI service, PostgreSQL + PostGIS, provenance and dataset-version tables,
ingestion connectors for the genuinely public sources.

**Phase 3 — Real analytics**
Server-side WSI with persisted runs, forecasting with a model registry and
rolling-origin validation, per-ward error analysis.

**Phase 4 — Real hydraulics**
EPANET/WNTR via a job queue, extended-period simulation, Parquet result storage.
The `is_calibrated` flag stays `false` until field pressure and flow data exist.

**Phase 5 — Real optimisation**
NSGA-II via pymoo, hydraulic response caching, full re-simulation of leading
solutions before anything is recommended.

**Phase 6 — Decision workflow**
Role-based views, accept/reject with reviewer notes, audit log. Planning
analytics stay separated from operational control — permanently.

---

## Connection to the research

| Paper section | Where it lives |
| --- | --- |
| §4.1 Sense → Decide cycle | Route structure and the rail's stage labels |
| §4.3 Phase 2 audit (Table 3) | `data/catalogue.ts`, `/data` |
| §4.4 Water-Stress Index | `lib/wsi.ts` |
| §4.5 Predictive modelling | `lib/forecast.ts` |
| §4.7 Level 2 hydraulic twin | `/network`, labelled uncalibrated |
| §4.9 Intervention library (Table 4) | `data/interventions.ts` |
| §4.10 Multi-objective optimisation | `lib/optimise.ts` |
| §4.11 Equity-aware optimisation | `vulnerability()` and the equity objective |
| §4.12 Uncertainty and sensitivity | Weighting switch, rank stability, forecast bands |
| §4.13 2030 scenarios (Table 5) | Scenario switch on stress and network views |
| §6.5 Governance and privacy | No autonomous control; stated in the trace drawer |

---

## Contributing

Issues and pull requests are welcome, particularly on hydraulic modelling,
municipal data engineering and accessibility.

One rule overrides everything else:

> **Never present synthetic output as a real Bengaluru result.**

If a change causes a fabricated value to appear without its grade, hatch or
synthetic tag, that is a bug of the most serious kind in this project — more
serious than a crash, because a crash cannot mislead a planner.

Before opening a PR: `npm run typecheck && npm run lint && npm run build`.

---

## Acknowledgements

Research supervised by **Dr. Parveen Kumar**, Mittal School of Business, Lovely
Professional University. Public data via IMD, KSNDMC, CGWB and OpenCity.

Author: **Jyatin Kumar Singh**, B.Tech Computer Science and Engineering, Lovely
Professional University.

## License

MIT — see [LICENSE](LICENSE).

The MIT licence covers the source code. It does not extend to the underlying
public datasets, which remain under their publishers' terms.
