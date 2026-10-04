# JalDrishti 2030

### An IoT–AI Digital Twin for Predictive Water-Stress and Intervention Planning in Bengaluru

> **Research-driven decision support for neighbourhood-scale urban water resilience.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-E2553B?style=flat-square)](https://repository-name-jal-drishti-2030-9o.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.27-111111?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Status](https://img.shields.io/badge/Status-Research_Prototype-16323D?style=flat-square)](#current-status)
[![Data Integrity](https://img.shields.io/badge/Data-Synthetic%2FProvenance--Aware-8B8F93?style=flat-square)](#data-integrity-and-research-honesty)

**Live application:** https://repository-name-jal-drishti-2030-9o.vercel.app  
**Repository:** https://github.com/Jyatin/Repository-name-JalDrishti-2030  
**Research manuscript:** *JalDrishti 2030: An IoT–AI Digital Twin for Predictive Water-Stress and Intervention Planning in Bengaluru*  
**Competition:** III International Competition of Student and Young Researcher Projects — **SMART CITY 2030**, Category 3: Smart-City Technologies and Services  
**Author:** Jyatin Kumar Singh, B.Tech CSE, Lovely Professional University  
**Research supervision:** Dr. Parveen Kumar, Mittal School of Business, Lovely Professional University

> **Paper note:** the manuscript is currently maintained as the competition/research document rather than a public publisher URL. A public PDF link can be added here once an externally accessible copy is available; no unverified URL is intentionally published.

---

## 1. Overview

**JalDrishti 2030** is a research-backed software prototype for neighbourhood-level water-stress planning in Bengaluru. It explores how an urban water-planning layer can combine heterogeneous data, predictive modelling, representative hydraulic simulation and multi-objective intervention analysis into one traceable decision-support workflow.

The system is designed around a six-stage planning cycle:

**Sense → Integrate → Predict → Simulate → Optimise → Decide**

The project is deliberately positioned as a **planning and decision-support layer**, not an operational water-control system. It does not control utility infrastructure or claim to reproduce Bengaluru's real hydraulic state.

The central research contribution is equally important: the paper's Phase 2 data-availability audit found that several variables required for ward-level modelling are **not publicly available at the resolution required**. JalDrishti therefore treats data provenance, uncertainty and synthetic-data disclosure as first-class product requirements rather than hiding the gap behind apparently precise numbers.

---

## 2. Research question

> **How can a city-scale digital-twin architecture support transparent, predictive and equity-aware water-stress planning when the operational data required for ward-level modelling is incomplete or unavailable?**

The prototype answers this by implementing the computational and decision-support mechanisms that can be demonstrated today while explicitly separating:

- published/measured evidence;
- paper-derived methodology;
- synthetic demonstration data;
- proposed future infrastructure; and
- validated results.

This distinction is fundamental to the credibility of the project.

---

## 3. The problem in Bengaluru

City-wide supply figures can conceal neighbourhood-level vulnerability. A planning system therefore needs to reason spatially about:

- water demand and supply;
- rainfall and groundwater conditions;
- service reliability and losses;
- population exposure and vulnerability;
- hydraulic feasibility;
- intervention cost;
- equity; and
- uncertainty in the underlying evidence.

The research found a major constraint: several operational variables required for a genuinely calibrated ward-level model are not publicly available at the necessary resolution.

Rather than manufacture a false "live Bengaluru model", this prototype makes that constraint visible throughout the application.

---

## 4. What the prototype implements

### Research narrative — `/`

A presentation-oriented research story connecting the problem, methodology, data audit, modelling pipeline, 2030 scenarios, intervention planning and paper traceability.

### Water-stress analysis — `/stress`

- Ward-level prototype visualisation
- Min–max normalisation
- Direction reversal for stress-reducing indicators
- Entropy weighting
- Equal-weight comparison
- Rank-stability analysis using Spearman correlation
- Indicator contribution breakdown
- Scenario-aware stress calculations

### Provenance and traceability

The application can trace a displayed ranking through:

**result → analytical run → weights → indicators → source → availability grade → synthetic status**

This implements the paper's emphasis on making recommendations traceable to data and assumptions.

### Representative hydraulic network — `/network`

A Level-2 representative network demonstrates:

- looped topology;
- supply-reduction perturbations;
- leakage scenarios;
- pump-outage scenarios;
- pressure profiles; and
- a minimum-pressure feasibility gate.

It is explicitly **not a calibrated EPANET/WNTR model of Bengaluru**.

### Intervention optimisation — `/optimise`

The prototype evaluates seeded intervention portfolios against multiple objectives rather than collapsing everything into one arbitrary score:

- intervention cost;
- residual water stress;
- population protected; and
- equity-weighted protection.

A non-dominated/Pareto filtering step identifies trade-off portfolios.

### Data availability — `/data`

The paper's Phase 2 data audit is represented as an interactive catalogue showing the availability grade, resolution, provenance and limitation of each variable.

---

## 5. Data integrity and research honesty

**This is the most important design principle in the repository.**

| Category | Meaning |
|---|---|
| **Real** | Published or measured evidence used by the research, including the rainfall record and data-availability findings |
| **Synthetic** | Demonstration values generated because the required operational data is unavailable at the target resolution |
| **Proposed methodology** | Methods specified by the research, such as WSI construction, entropy weighting, scenario design and multi-objective optimisation |
| **Validated result** | A measured Bengaluru result supported by real observations and validation; **none is claimed by this prototype** |

The UI communicates this distinction through:

- synthetic-data tags;
- hatching and visual treatment;
- availability grades;
- provenance drawers;
- confidence indicators; and
- explicit dashboard disclosures.

### Non-negotiable rule

> **Never present synthetic output as a real Bengaluru finding.**

The representative network is not presented as a calibrated digital twin, synthetic ward indicators are not presented as measured utility data, and optimisation outputs are not presented as validated municipal recommendations.

---

## 6. Methodology

### Water-Stress Index

The prototype implements a reproducible WSI pipeline:

1. Indicator normalisation
2. Direction reversal where higher values indicate lower stress
3. Entropy-derived weighting
4. Weighted aggregation
5. Confidence propagation
6. Rank-stability comparison under alternative weighting

### Forecasting

The frontend contains a baseline-vs-candidate forecasting workflow with chronological holdout validation and MAE/RMSE comparison. The architecture is designed so that production model training and persisted validation runs can move to the backend in the next phase.

### Hydraulic simulation

The paper defines a Level-2 hydraulic twin based on EPANET/WNTR. The current application implements a clearly labelled representative network layer for demonstration and interaction; it does **not** claim a calibrated hydraulic solve.

### Multi-objective optimisation

Intervention portfolios are evaluated independently across multiple objectives and filtered through non-dominated sorting. The future production architecture calls for NSGA-II with hydraulic verification before any portfolio is treated as decision-ready.

---

## 7. Four 2030 planning scenarios

The prototype carries the research scenarios into an interactive planning interface:

| Scenario | Planning interpretation |
|---|---|
| **A — Business as Usual** | Existing management trajectory continues |
| **B — Supply Augmentation** | Verified supply additions improve system conditions |
| **C — Predictive Intervention** | Forecast-driven targeting prioritises vulnerable areas |
| **D — Integrated Water Resilience** | Supply, demand, losses and equity are addressed together |

The scenario multipliers used by the prototype are **synthetic planning assumptions**. They are not forecasts of Bengaluru's actual 2030 operating conditions.

---

## 8. Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    JalDrishti 2030                           │
│          Research + Decision-Support Prototype               │
└──────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴────────────────┐
              │                                │
       Next.js / TypeScript              FastAPI Backend
       Research Interface                 Health / API seam
              │                                │
       ┌──────┼────────┐                       │
       │      │        │                       │
     WSI   Forecast  Optimise              PostgreSQL /
       │      │        │                   PostGIS (planned)
       └──────┼────────┘                       │
              │                                │
        Provenance Layer                 Real Data Connectors
              │                         (planned Phase 2+)
              │
       ┌──────┴──────────┐
       │                 │
  `/stress`         `/network`
  Water stress      Hydraulic twin
       │                 │
       └────────┬────────┘
                │
          `/optimise`
        Intervention search
                │
             `/data`
       Availability & sources
```

The frontend/backend seam is intentionally narrow. The current FastAPI service provides health status; analytical routes are planned for the next implementation phase. The UI therefore remains honest about which numbers originate from local prototype fixtures.

---

## 9. Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15.5.27, React, TypeScript 5.8 |
| Styling | Tailwind CSS 4 |
| Visualisation | Hand-written SVG charts and maps |
| Backend | Python, FastAPI, Pydantic |
| Database | PostgreSQL + PostGIS — planned for the full backend phase |
| Hydraulic modelling | EPANET / WNTR — planned for calibrated simulation |
| Optimisation | NSGA-II / pymoo — planned for production optimisation |
| Deployment | Vercel for the current frontend deployment |
| Testing | TypeScript checks, production build, backend pytest suite |

The current frontend deliberately keeps runtime dependencies minimal and implements its visual language in-repo to maintain consistent scientific/provenance semantics.

---

## 10. Repository structure

```text
.
├── src/
│   ├── app/
│   │   ├── page.tsx              # Research narrative
│   │   ├── stress/page.tsx       # Water-stress analysis
│   │   ├── network/page.tsx      # Representative hydraulic network
│   │   ├── optimise/page.tsx     # Intervention optimisation
│   │   └── data/page.tsx         # Data availability audit
│   ├── components/
│   │   ├── shell/               # Application shell and navigation
│   │   ├── map/                 # Ward visualisation
│   │   ├── charts/              # Scientific visualisations
│   │   ├── provenance/          # Traceability and evidence UI
│   │   └── ui/                  # Shared primitives
│   ├── data/                    # Prototype datasets and paper-derived definitions
│   ├── lib/
│   │   ├── wsi.ts               # WSI computation
│   │   ├── forecast.ts           # Forecasting / validation logic
│   │   ├── optimise.ts           # Pareto / optimisation logic
│   │   ├── geo.ts                # Spatial projection helpers
│   │   └── api.ts                # Backend integration seam
│   └── types/                   # Domain types
├── tools/                       # Deterministic prototype data generation
├── docs/                        # Supporting project documentation
├── backend (1)/backend/         # FastAPI backend foundation
├── PROJECT_CONTEXT.md           # Research and implementation source of truth
├── package.json
└── README.md
```

---

## 11. Research-to-software traceability

| Research component | Prototype implementation |
|---|---|
| Sense → Decide cycle | Application route structure and stage labels |
| Phase 2 data audit | `/data` + `src/data/catalogue.ts` |
| Water-Stress Index | `src/lib/wsi.ts` + `/stress` |
| Predictive modelling | `src/lib/forecast.ts` |
| Level-2 hydraulic twin | `/network` |
| Intervention library | `src/data/interventions.ts` |
| Multi-objective optimisation | `src/lib/optimise.ts` + `/optimise` |
| Equity-aware optimisation | Vulnerability/equity objective |
| Uncertainty & sensitivity | Weighting comparison, rank stability, confidence |
| 2030 scenarios | Scenario controls across stress/network views |
| Governance & human review | Provenance UI and explicit non-autonomous positioning |

The repository's `PROJECT_CONTEXT.md` provides the detailed mapping between the research methodology, implementation phases, domain terminology and current limitations.

---

## 12. Current status

### Completed

- [x] Research narrative and paper-aligned application shell
- [x] Water-Stress Index computation
- [x] Entropy/equal-weight comparison
- [x] Rank-stability analysis
- [x] Forecast baseline comparison
- [x] Pareto/non-dominated portfolio filtering
- [x] Provenance and traceability interface
- [x] Data-availability audit interface
- [x] Representative hydraulic network interface
- [x] Four 2030 scenario controls
- [x] FastAPI health integration
- [x] Production Next.js build
- [x] TypeScript typecheck
- [x] Vercel deployment

### In progress / future phases

- [ ] Real public-data ingestion connectors
- [ ] Persisted dataset and run provenance
- [ ] PostgreSQL/PostGIS backend
- [ ] Server-side WSI computation
- [ ] Production forecasting/model registry
- [ ] Calibrated EPANET/WNTR hydraulic simulation
- [ ] NSGA-II optimisation with hydraulic verification
- [ ] Role-based decision workflow and audit log

---

## 13. Running locally

### Prerequisites

- Node.js 18.18+; Node.js 20+ recommended
- Python 3.12+ for backend development

### Frontend

```bash
git clone https://github.com/Jyatin/Repository-name-JalDrishti-2030.git
cd Repository-name-JalDrishti-2030
npm install
npm run dev
```

Open `http://localhost:3000`.

### Verification

```bash
npm run typecheck
npm run build
```

The frontend accepts `NEXT_PUBLIC_API_URL` as the backend base URL, including `/api/v1`. The legacy `NEXT_PUBLIC_API_BASE_URL` variable remains supported for compatibility.

> Public Next.js environment variables are inlined at build time. Set production values before building the deployment.

---

## 14. Deployment

The current research prototype is deployed on Vercel:

**https://repository-name-jal-drishti-2030-9o.vercel.app**

The production frontend is built from the repository root using the standard Next.js build pipeline.

The backend is currently a foundation service whose implemented API surface is limited to health/status functionality. The frontend therefore does not imply that analytical values have become live simply because the API is reachable.

---

## 15. Research limitations

The following limitations are intentional and documented rather than hidden:

1. Several operational water variables are unavailable publicly at the resolution required for the proposed Bengaluru model.
2. Ward-level consumption, losses and service-reliability values used in the prototype are synthetic.
3. The ward geometry is a deterministic prototype lattice, not an official municipal boundary dataset.
4. The hydraulic network is representative and uncalibrated.
5. Intervention effect sizes and some planning coefficients are prototype assumptions derived from the research design rather than measured outcomes.
6. No citywide intervention recommendation is claimed as a validated Bengaluru result.

These constraints define the boundary between **research methodology** and **empirical validation**.

---

## 16. Research integrity

JalDrishti is intentionally designed to make uncertainty visible.

> **A precise-looking synthetic number is more dangerous than an obvious missing number.**

For that reason, the application prioritises provenance, data grades, synthetic-share indicators and explicit status labels. Any future backend implementation must preserve these guarantees.

---

## 17. Acknowledgements

**Research supervision:** Dr. Parveen Kumar, Mittal School of Business, Lovely Professional University.  
**Author:** Jyatin Kumar Singh, B.Tech Computer Science and Engineering, Lovely Professional University.  
**Research context:** BRICS SMART CITY 2030 — Category 3, Smart-City Technologies and Services.

Public-data and research sources are documented within the project data catalogue and research manuscript.

---

## License

MIT — see [`LICENSE`](LICENSE).

The MIT license covers the source code. Underlying datasets and third-party materials remain subject to their respective publishers' terms.

---

### Links

- **Live application:** https://repository-name-jal-drishti-2030-9o.vercel.app
- **GitHub:** https://github.com/Jyatin/Repository-name-JalDrishti-2030
- **Project context:** [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- **Research paper title:** *JalDrishti 2030: An IoT–AI Digital Twin for Predictive Water-Stress and Intervention Planning in Bengaluru*
