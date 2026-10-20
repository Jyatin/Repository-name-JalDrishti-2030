# JalDrishti 2030

<p align="center">
  <strong>An IoT–AI Digital Twin for Predictive Water-Stress and Intervention Planning in Bengaluru</strong><br />
  Research-driven decision support for neighbourhood-scale urban water resilience.
</p>

<p align="center">
  <a href="https://repository-name-jal-drishti-2030-9o.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-Open%20Application-E2553B?style=for-the-badge" alt="Open live demo" /></a>
  <img src="https://img.shields.io/badge/Next.js-15.5.27-111111?style=for-the-badge&logo=next.js" alt="Next.js 15.5.27" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript 5.8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/FastAPI-Foundation-009688?style=for-the-badge&logo=fastapi" alt="FastAPI foundation" />
</p>

<p align="center">
  <a href="#the-project">Project</a> ·
  <a href="#explore-the-prototype">Prototype</a> ·
  <a href="#how-it-works">Methodology</a> ·
  <a href="#run-locally">Run locally</a> ·
  <a href="#research-integrity">Research integrity</a>
</p>

---

## The project

Cities need to understand not only how much water is available overall, but also where shortages may emerge, who is most exposed, and which interventions are worth investigating first.

**JalDrishti 2030** is a research-backed decision-support prototype exploring how a digital-twin architecture could support neighbourhood-scale water-stress assessment and intervention planning in Bengaluru. It brings together an interactive research narrative, water-stress analysis, scenario controls, a representative hydraulic network, intervention-portfolio exploration, and an auditable data-availability catalogue.

Its planning cycle is:

**Sense → Integrate → Predict → Simulate → Optimise → Decide**

> **Important:** JalDrishti is a research and planning prototype, not an operational water-control system. It does not control utility infrastructure, and it does not claim to represent Bengaluru's live hydraulic state.

### Open the application

**[Launch JalDrishti 2030](https://repository-name-jal-drishti-2030-9o.vercel.app)** · [View the source code](https://github.com/Jyatin/Repository-name-JalDrishti-2030) · [Read the implementation context](PROJECT_CONTEXT.md)

The live demo URL above is the frontend URL currently referenced by this repository. Deployment aliases and project names are managed by Vercel; see [Deployment troubleshooting](#deployment-troubleshooting) before treating a failed deployment entry as a failed application.

## Why this project matters

A digital twin can appear more accurate than its underlying evidence. The research behind JalDrishti identifies a central challenge: several operational variables needed for Bengaluru ward-level modelling are not publicly available at the required spatial resolution.

Instead of disguising those gaps with precise-looking outputs, JalDrishti separates:

- **Real evidence** — published or measured source material used by the research.
- **Synthetic data** — seeded demonstration values used where suitably detailed operational data is unavailable.
- **Proposed methodology** — analytical methods described by the research but not yet fully operationalised.
- **Validated results** — empirical findings supported by appropriate observations and validation. The current prototype does **not** claim validated citywide Bengaluru results.

This distinction is part of the product design, not a disclaimer added after the fact.

## Explore the prototype

| Area | Route | What it demonstrates |
|---|---|---|
| Research narrative | `/` | Problem framing, research methodology, data audit, modelling pipeline, scenarios and traceability |
| Water-stress analysis | `/stress` | Ward-scale prototype visualisation, normalisation, entropy weighting, equal-weight comparison and ranking stability |
| Representative network | `/network` | Illustrative network topology, supply reduction, leakage and pump-outage scenarios, pressure profiles and a feasibility gate |
| Intervention planning | `/optimise` | Multi-objective portfolio comparison across cost, residual stress, population protected and equity-weighted protection |
| Data availability | `/data` | Data catalogue with provenance, spatial resolution, availability grades and limitations |

### Key analytical ideas

**Water-Stress Index (WSI).** The frontend implements indicator normalisation, direction reversal for stress-reducing indicators, entropy-derived weighting, weighted aggregation, confidence propagation and comparison with equal weighting.

**Forecast comparison.** A baseline-versus-candidate workflow compares forecasts using a chronological holdout and MAE/RMSE metrics. This is prototype-side analytical logic, not a deployed production model registry.

**Intervention trade-offs.** Portfolio candidates are compared across separate objectives and filtered for non-dominated solutions. This helps expose trade-offs rather than hiding them inside one arbitrary score.

**Evidence traceability.** The interface is designed to trace a displayed result through its analytical run, weights, indicators, source, availability grade and synthetic-data status.

**2030 planning scenarios.** Four qualitative planning scenarios are represented: Business as Usual, Supply Augmentation, Predictive Intervention and Integrated Water Resilience. Prototype multipliers are assumptions for exploration, not forecasts of Bengaluru's real 2030 conditions.

## How it works

```text
                    JalDrishti 2030
            Research + decision-support prototype
                           |
              +------------+-------------+
              |                          |
       Next.js frontend            FastAPI backend
       Research interface          Foundation service
              |                          |
     +--------+---------+          Health endpoint
     |        |         |          /api/v1/health
    WSI    Forecast  Optimise
     |        |         |
     +--------+---------+
              |
      Provenance + data catalogue
              |
   Human review and planning exploration
```

The frontend contains the current interactive analytical prototype. The FastAPI service is a backend foundation; the currently documented API surface is health/status functionality. Analytical screens still use local, explicitly labelled prototype fixtures. Backend connectivity does not make those values live or empirically validated.

### Technology

| Layer | Current implementation |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript 5.8 |
| Styling | Tailwind CSS 4 |
| Charts and maps | Hand-written SVG visualisations |
| Backend foundation | Python, FastAPI, Pydantic |
| Database | PostgreSQL + PostGIS schema foundation; full analytical integration is pending |
| Hydraulic modelling | EPANET/WNTR proposed for future calibrated simulation |
| Optimisation | Current non-dominated portfolio filtering; NSGA-II/pymoo planned for a later phase |
| Frontend hosting | Vercel |
| Verification commands | TypeScript type-check and Next.js production build |

## Research integrity

The system deliberately distinguishes a working prototype from a calibrated digital twin.

| Component | Current status |
|---|---|
| WSI calculation and weighting comparison | Implemented in the frontend prototype |
| Forecast baseline/candidate comparison | Implemented prototype logic |
| Non-dominated portfolio filtering | Implemented prototype logic |
| Ward geometry | Deterministic schematic lattice, not official municipal boundaries |
| Ward consumption, losses and supply reliability | Synthetic demonstration values |
| Hydraulic pressures | Illustrative formula, not an EPANET/WNTR hydraulic solve |
| Hydraulic calibration to Bengaluru | Not implemented |
| Real data ingestion connectors | Planned |
| Persisted analytical runs and provenance lineage | Planned |
| Server-side WSI/forecast services | Planned |
| Production NSGA-II with hydraulic verification | Planned |
| Validated citywide intervention recommendations | Not claimed |

### The rule

> **Never present synthetic output as a measured Bengaluru finding.**

The prototype's ward geometry, operational indicators, scenario multipliers and intervention effect assumptions must not be interpreted as verified municipal data. The representative network is uncalibrated. Any real-world planning use would require trustworthy source data, calibration, validation, and review by relevant domain experts.

## Run locally

### Requirements

- Node.js 20 or newer recommended
- npm
- Python 3.12+ only if working on the backend

### Frontend

```bash
git clone https://github.com/Jyatin/Repository-name-JalDrishti-2030.git
cd Repository-name-JalDrishti-2030
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verify the frontend

```bash
npm run typecheck
npm run build
```

The project accepts `NEXT_PUBLIC_API_URL` as the public backend base URL, including the API prefix such as `/api/v1`. The legacy `NEXT_PUBLIC_API_BASE_URL` name is also supported by the implementation.

Create a local `.env.local` or use the provided `.env.example` as a starting point. Only place public, browser-safe values in `NEXT_PUBLIC_*` variables: Next.js inlines those values into the client bundle at build time.

### Backend foundation

The backend source is in [`backend (1)/backend`](backend%20(1)/backend/README.md). Its README documents the Docker Compose and Python development workflows, environment variables, database schema, migrations, and the current API scope. At present, the backend supports health/status functionality; analytics endpoints are future work.

## Deployment

- **Frontend application:** [Open JalDrishti 2030](https://repository-name-jal-drishti-2030-9o.vercel.app)
- **GitHub deployments:** [View deployment records](https://github.com/Jyatin/Repository-name-JalDrishti-2030/deployments)
- **Backend source and setup:** [Backend README](backend%20(1)/backend/README.md)

GitHub's Deployments panel records deployment events reported by an integration. The displayed name can be inherited from a Vercel project/environment and does not, by itself, prove that the target is healthy or unhealthy. A red backend deployment and a green frontend deployment refer to different services. Check the provider's deployment log for the actual failure reason before changing configuration.

### Deployment troubleshooting

If you see names such as `repository-name-jaldrishti-2030-backend` or `repository-name-jal-drishti-2030-9o` in GitHub:

1. Open the corresponding entry under [GitHub Deployments](https://github.com/Jyatin/Repository-name-JalDrishti-2030/deployments).
2. Follow the target environment/deployment link and inspect its provider logs.
3. For the **frontend**, confirm Vercel's Root Directory is the repository root, the framework preset is Next.js, and the build command is `npm run build`.
4. For the **backend**, confirm the service root directory is `backend (1)/backend`, its Docker/Python start configuration matches that directory, and its runtime environment variables are set. If hosted separately, set CORS to the exact frontend origin.
5. Rename the projects/services in their hosting provider settings, if desired. Updating README text cannot rename historical GitHub deployment records or change the provider's canonical project name.

Do not add guessed deployment URLs to the README. Once a stable custom domain or canonical Vercel URL is configured, update the single live-demo link at the top and in this section.

## Repository layout

```text
.
├── src/
│   ├── app/             # Research, stress, network, optimise and data routes
│   ├── components/      # Shell, maps, charts, provenance and shared UI
│   ├── data/            # Prototype datasets and research-derived definitions
│   ├── lib/             # WSI, forecasting, optimisation, geography and API seam
│   └── types/           # Domain types
├── backend (1)/backend/ # FastAPI foundation, schema, migrations and tests
├── docs/                # Screenshots and supporting documentation
├── public/paper/        # Research-figure assets
├── tools/               # Deterministic prototype-data generation
├── PROJECT_CONTEXT.md   # Research/software crosswalk and implementation source of truth
├── .env.example
├── package.json
└── README.md
```

See [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) for the detailed research-to-code mapping, methodology terminology, development phases, and design decisions.

## Research context

- **Research title:** *JalDrishti 2030: An IoT–AI Digital Twin for Predictive Water-Stress and Intervention Planning in Bengaluru*
- **Competition:** III International Competition of Student and Young Researcher Projects — SMART CITY 2030, Category 3: Smart-City Technologies and Services
- **Author:** Jyatin Kumar Singh, B.Tech Computer Science and Engineering, Lovely Professional University
- **Research supervision:** Dr. Parveen Kumar, Mittal School of Business, Lovely Professional University

The manuscript is maintained as a project/competition document; this repository does not currently advertise an unverified public publisher URL.

## Roadmap

- [ ] Connect real public datasets with documented licences, sources and spatial resolution.
- [ ] Persist dataset versions, analytical runs and provenance lineage.
- [ ] Implement server-side WSI and forecasting services.
- [ ] Integrate official ward boundaries when suitable data is available.
- [ ] Add calibrated EPANET/WNTR hydraulic simulations.
- [ ] Add NSGA-II portfolio search with hydraulic feasibility verification.
- [ ] Add human-review workflows and audit logs.

## License

The source code is released under the [MIT License](LICENSE). Third-party datasets and assets remain subject to their own licence and attribution requirements.
