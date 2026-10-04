# PROJECT_CONTEXT.md

Single source of truth for continuing JalDrishti 2030 development across sessions.
Update this file whenever a major decision, phase, or module changes — do not let it drift.

---

## 1. Purpose & paper connection

Frontend prototype for **JalDrishti 2030**, a decision-support system for neighbourhood-level
water-stress planning in Bengaluru. Implements the paper:

> *JalDrishti 2030: An IoT–AI Digital Twin for Predictive Water-Stress and Intervention
> Planning in Bengaluru* — submitted to BRICS SMART CITY 2030 (Category 3), supervised by
> Dr. Parveen Kumar, Mittal School of Business, LPU. Author: Jyatin Kumar Singh.

**System is a planning layer above utility infrastructure, not a control system.** It does not
manage the network; it recommends where to intervene and why, for human review (paper §6.5).

**The paper's actual empirical result is negative**: a Phase 2 data-availability audit (Table 3)
found ward/DMA consumption, non-revenue water, and supply-reliability data do not exist
publicly at the resolution needed. This finding is the project's foundation, not a limitation
to hide — it drives the entire synthetic/real data-labelling system (§8).

---

## 2. What's being built

Six-stage pipeline from the paper, **Sense → Integrate → Predict → Simulate → Optimise → Decide**.
Chosen build direction: **Option D — full vertical slice**, thin but complete, scoped for one
solo developer (not the paper's 24-month institutional programme).

| Stage | Paper ref | Frontend module (this repo) | Backend module (planned) |
|---|---|---|---|
| Sense | §4.2 | `/data` catalogue, synthetic generators | Ingestion connectors, `dataset_version` |
| Integrate | §4.8 | Ward lattice + indicator join | PostGIS crosswalk, `allocation_weight` |
| Predict | §4.5 | `lib/forecast.ts` | Model registry, rolling-origin validation |
| Simulate | §4.7 | `/network` (illustrative) | WNTR/EPANET job service |
| Optimise | §4.10–4.11 | `/optimise` (client-side NSGA-lite) | pymoo NSGA-II, hydraulic verification |
| Decide | §4.4, §6.5 | Provenance drawer, ranked list | `recommendation`, accept/reject workflow |

---

## 3. Frontend modules (current)

| Route | Purpose | Key mechanics |
|---|---|---|
| `/` | **Research story** — 10-section presentation narrative (Problem → Traceability) | Reuses live `lib/` functions for embedded mini-visuals (WSI ranking, forecast, Pareto front); IntersectionObserver-driven section nav; every section carries a `StatusBadge` |
| `/stress` | Ward map, WSI ranking, scenario/weighting controls | Live WSI recompute on control change; rank-stability (Spearman ρ) vs alt weighting. **Moved from `/` — was the old home route.** |
| `/network` | Representative hydraulic zone | Perturbations (leak/pump/supply); feasibility gate at min pressure 12 m |
| `/optimise` | Intervention portfolio search | 400 seeded portfolios → real non-dominated sort; budget + confidence-threshold sliders |
| `/data` | Phase 2 audit + source catalogue | Table 3 rendered live; expandable limitations per variable |

Cross-cutting: `ProvenanceDrawer` — traces any number on screen back through
run → weights → indicators → source → grade → synthetic flag. Implements paper's Stage 6
validation gate ("users can trace recommendations to data and assumptions").

**Two status vocabularies, both live, do not conflate:**
- `GradeChip` (A–E) — resolution grade of a *data point*, from Table 3.
- `StatusBadge` (Real/Synthetic/Proposed/Validated) — implementation status of a *feature*,
  introduced for the presentation narrative. A feature can be Real+grade-C, or Synthetic+grade-E,
  etc. — orthogonal axes. `components/provenance/StatusBadge.tsx`.

---

## 4. Methodology & terminology (must stay consistent with paper)

- **WSI (Water-Stress Index)** — Level 1. Min–max normalization with **direction reversal**
  (stress-decreasing indicators like supply reliability flip so 1 = more stress), then
  **entropy weighting** derived from the observation set (not arbitrary/expert weights).
  `lib/wsi.ts`.
- **Confidence** — weighted mean of each indicator's grade-derived confidence (A=.95 … E=.25).
  Propagated through every score.
- **Synthetic share** — fraction of a score's weight resting on fabricated indicators. Surfaced
  everywhere (header %, hatching, tags).
- **Grade (A–E)** — Table 3 resolution classification. A=ward-usable, E=not available at
  required resolution. See `data/catalogue.ts` → `AVAILABILITY_AUDIT`.
- **Vulnerability index (V_i)** — §4.11. Composite of groundwater depletion (0.4) + tanker
  dependence (0.35) + (1 − supply reliability) (0.25). Feeds equity objective. `lib/optimise.ts`.
- **Rank stability** — Spearman rank correlation between entropy- and equal-weighted runs;
  paper's robustness check for whether priority zones hold under different weightings.
- **Feasibility gate** — §5.5. Hydraulic run must pass before its intervention portfolio can be
  recommended (min-pressure / unmet-demand threshold). Optimizer runs *after* this gate.
- **Level 1 / Level 2** — Level 1 = ward-scale WSI; Level 2 = representative-DMA hydraulic model.
  Never conflate: Level 2 network is NOT calibrated to Bengaluru (`NETWORK_META.calibrated = false`).
- **Allocation weight (a_j)** — §4.8. Disaggregates ward demand onto hydraulic nodes;
  `D_j(t) = D_i(t) · a_j`. Not yet implemented (needs real network + real ward↔node crosswalk).

---

## 5. Development phases (3, consolidated from paper's 6-stage cycle)

| Phase | Scope | Status |
|---|---|---|
| **1 — Frontend Prototype** | Next.js UI, client-side analytics on synthetic/seeded data, full provenance UI, no backend | ✅ **Done** (this repo) |
| **2 — Backend Foundation + Real Analytics** | FastAPI, PostgreSQL+PostGIS, `Run`/`dataset_version`/provenance tables, real ingestion (rainfall/wards/boundaries), server-side WSI with persisted runs, forecasting with model registry | Not started |
| **3 — Real Hydraulics + Optimisation + Decision Workflow** | WNTR/EPANET via job queue, pymoo NSGA-II with top-N hydraulic verification, RBAC, accept/reject + audit log | Not started |

(Full 10-phase breakdown with week estimates exists in the original architecture blueprint
from chat history — this table is the compressed version for quick reference.)

---

## 6. Four 2030 scenarios (paper Table 5) — `data/interventions.ts` → `SCENARIOS`

| ID | Name | Assumption | Demand ×/Loss ×/Supply × |
|---|---|---|---|
| A | Business as usual | Existing management continues | 1.00 / 1.00 / 1.00 |
| B | Supply augmentation | Verified supply additions occur | 1.04 / 1.00 / 0.82 |
| C | Predictive intervention | Forecasts guide priority targeting | 0.97 / 0.86 / 0.95 |
| D | Integrated water resilience | Supply+demand+loss+equity combined | 0.92 / 0.74 / 0.86 |

Multipliers are synthetic (paper gives qualitative mechanism only, not coefficients). Applied to
both WSI stress multiplier and network demand in `/network`.

---

## 7. Current implementation status & limitations

**Working / real computation:**
- WSI engine (normalization, entropy weighting, confidence, rank stability) — fully implemented, unit-testable logic
- Forecast baseline-vs-candidate with chronological holdout validation — real MAE/RMSE comparison
- Non-dominated (Pareto) sort — genuine filtering, not mocked
- Ward geometry — deterministic seeded Voronoi lattice, real WGS84 coords (schematic, not official)

**Explicitly NOT real (labelled everywhere in UI):**
- Hydraulic pressures in `/network`: distance+elevation falloff formula, **not an EPANET/WNTR solve**
- Ward consumption, NRW, supply reliability, tanker dependence: seeded synthetic generators
- Intervention effect sizes / unit costs: fabricated placeholders (paper gives cost *bands* only, no benefit figures)
- Optimizer's "hydraulically verified" flag on `/optimise`: presentational only, no solver ran

**No backend yet.** `lib/api.ts` defines the future FastAPI contract (endpoint shapes match
planned routes) but all functions currently return local fixtures from `src/data/`. Swapping in
`NEXT_PUBLIC_API_BASE_URL` is the intended integration point — see `IS_FIXTURE_MODE`.

**Known gaps vs. full paper scope:** no allocation-weight computation (needs real network), no
persisted `Run`/lineage records (provenance tree is computed fresh client-side each render, not
stored), no RBAC/auth, no real ingestion connectors.

---

## 8. Non-negotiable rule (applies to all future work)

**Never present synthetic output as a real Bengaluru finding.** Every value reaching the UI must
be traceable to one of these four categories — do not blur them:

| Category | Meaning | Marker |
|---|---|---|
| **Real** | Measured/published (rainfall 1991–2023, city-level; ward boundaries; audit findings themselves) | No hatch/tag; grade shown |
| **Synthetic** | Fabricated under documented seed because real data doesn't exist at required resolution | `SyntheticTag`, hatch pattern, `is_synthetic` |
| **Proposed methodology** | From the paper (WSI formula, entropy weighting, NSGA-II objectives, intervention mechanisms/cost *bands*) — the method is real, values it operates on may not be | Cite paper section in code comment |
| **Validated result** | None exist yet for Bengaluru. Do not create UI that implies one does. | N/A — flag immediately if this ever appears |

When adding a feature: if it would display a number, ask which of the 4 categories it belongs to
before writing the component. If unsure, default to synthetic + label it.

---

## 9. UI/UX decisions & design system

**Visual reference:** oil/gas industrial dashboard (user-supplied screenshots) — premium/clean
aesthetic, large map, left icon rail, layered info panels, dashed selection marquee. Content
fully replaced with water-domain substance; UI/UX pattern language kept.

**Signature move:** the reference's dashed selection marquee is repurposed to mark synthetic-data
extent. Hatch opacity on map = per-ward synthetic share. This is the single visual device the
whole system is built around — makes the paper's core finding (data doesn't exist) the most
visible thing on screen, not a footnote.

**Design tokens** (`app/globals.css` → `@theme`):
| Token | Hex | Meaning |
|---|---|---|
| `paper` | `#F2F2EF` | Base surface |
| `ink` | `#15181B` | Primary text |
| `coral` | `#E2553B` | Stress / alert / selection |
| `sage` | `#DDE7C1` | Secure / adequate service |
| `deep` | `#16323D` | The piped network |
| stress ramp | 5-step secure→critical | `--color-stress-1..5` |

**Type:** Archivo (display, tight tracking) / IBM Plex Sans (body) / IBM Plex Mono (figures &
ticks only — tabular-nums).

**Hard bans enforced** (per CLAUDE.md design standards supplied by user): no purple/violet as
brand color, no gradients, no gradient-filled headline words, no meaningless stat rows, no emoji
in headings, no "Why choose us" sections, no glassmorphism, no centered-everything layout.
Verified clean in last review pass.

**Provenance vocabulary** (reusable across all future screens): `GradeChip` (A–E), `SyntheticTag`,
`ConfidenceBar`, `ProvenanceDrawer` with recursive `TraceNode`. Any new feature displaying a
derived number should use these, not invent new markers.

**Accessibility:** 44px min tap targets on mobile controls, `prefers-reduced-motion` respected,
keyboard-reachable tooltips, focus-visible outlines, semantic roles on map/chart SVGs.

---

## 10. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | |
| Language | TypeScript 5.8, strict | |
| Styling | Tailwind CSS 4 | CSS-first `@theme`, no config file |
| Charts/Map | Hand-written SVG | Zero chart/map dependencies — see `components/charts`, `components/map` |
| Runtime deps | `next`, `react`, `react-dom` only | |
| Ward geometry gen | Python (`numpy`, `scipy`) | `tools/gen_wards.py`, run offline, output pasted into `data/wards.ts` |

**Planned backend (Phase 2+, not yet built):** FastAPI + Pydantic v2, PostgreSQL 16 + PostGIS +
TimescaleDB, WNTR (EPANET), pymoo (NSGA-II), ARQ (Redis job queue), SQLAlchemy 2 + Alembic +
GeoAlchemy2, MapLibre GL + deck.gl (once real map tiles needed).

---

## 11. Project structure

```
src/
├─ app/
│  ├─ page.tsx              Research story — home, 10-section narrative (NEW)
│  ├─ stress/page.tsx       Water-stress dashboard (moved from app/page.tsx)
│  ├─ network/ · optimise/ · data/
├─ components/
│  ├─ shell/               Rail (icon nav, 5 routes), TopBar (synthetic-% readout)
│  ├─ map/                 WardMap.tsx — hand-built SVG choropleth
│  ├─ panels/               WardPanel.tsx — left detail column
│  ├─ charts/               Charts.tsx — ForecastChart, ParetoPlot, PressureProfile
│  ├─ provenance/           GradeChip, SyntheticTag, ConfidenceBar, ProvenanceDrawer,
│  │                        StatusBadge (Real/Synthetic/Proposed/Validated — NEW)
│  └─ ui/                   Panel, CountUp, Tooltip (shared primitives)
├─ lib/
│  ├─ wsi.ts                normalize, entropyWeights, computeWsi, rankCorrelation
│  ├─ forecast.ts           buildHistory, forecastWard (baseline vs candidate)
│  ├─ optimise.ts           vulnerability, optimise (portfolio gen + paretoFront)
│  ├─ geo.ts                WGS84→SVG projection (makeProjection, ringToPath)
│  ├─ format.ts             display formatting, one place for units
│  └─ api.ts                ★ backend integration seam — swap fixtures for fetch here only
├─ data/                    wards.ts (generated) · catalogue.ts · interventions.ts ·
│                            paper.ts — STORY_STEPS, TRACEABILITY, PAPER_FIGURES (NEW)
└─ types/index.ts           domain types mirroring paper entities & future DB schema

public/paper/                drop-in location for the two real paper figures;
                              PaperFigure component falls back to a labelled
                              placeholder via onError until they're added
```

~7,700 LOC in `src/`. No backend directory yet — will be a sibling `apps/api/` per original
monorepo blueprint when Phase 2 starts.

**Route change (this session):** `/` is now the research-story narrative; the water-stress
dashboard that used to live at `/` moved to `/stress` with zero logic changes. Done for a
2-day-out presentation deadline — the story page needed to be the entry point, and rebuilding
4 working dashboards to fit inside one was the wrong risk to take.

---

## 12. Completed vs planned (quick checklist)

**Done:**
- [x] Full 5-route frontend, responsive, reviewed for mobile/a11y
- [x] Real WSI math, forecast validation, Pareto sort
- [x] Provenance drawer wired to WSI and optimizer outputs
- [x] Synthetic-data labelling system (hatch/tag/grade/header %) — comprehensive, checked for gaps
- [x] Seeded, reproducible ward geometry + indicator generator (Python, offline)
- [x] README, LICENSE, tools/README, `.env.example` for backend URL swap
- [x] Research-story landing page (`/`), 10-section presentation narrative with live embedded
      figures pulled from the same `lib/` functions as the dashboards
- [x] `StatusBadge` (Real/Synthetic/Proposed/Validated) — feature-level claim vocabulary,
      separate from `GradeChip`'s data-resolution vocabulary
- [x] Paper → implementation traceability table (`data/paper.ts` → `TRACEABILITY`)
- [x] Paper-figure drop-in slot (`public/paper/`) with graceful fallback until real images added

**Planned, not started:**
- [ ] FastAPI backend + PostgreSQL/PostGIS (Phase 2)
- [ ] Persisted `Run`/lineage records (currently computed fresh client-side, not stored)
- [ ] Real ingestion connectors (IMD rainfall, ward boundaries, BWSSB GIS)
- [ ] Server-side WSI with versioned runs
- [ ] WNTR/EPANET real hydraulic solve (Phase 3)
- [ ] pymoo NSGA-II with hydraulic verification of top-N solutions (Phase 3)
- [ ] Allocation-weight computation (ward↔node crosswalk)
- [ ] RBAC, accept/reject workflow, audit log (Phase 3)
- [ ] Swap `src/data/wards.ts` for real BBMP/GBA ward boundaries when available
- [ ] Drop real paper figures into `public/paper/` (`paper-page.png`, `scenarios-figure.png`)

---

*Last updated: added research-story landing page (`/`), moved water-stress dashboard to
`/stress`, added StatusBadge vocabulary and paper-traceability table for a presentation
deadline. Update the relevant section (don't append duplicate info) whenever a phase completes
or a design decision changes.*
