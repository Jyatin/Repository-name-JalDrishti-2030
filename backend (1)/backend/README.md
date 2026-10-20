# JalDrishti 2030 — API

FastAPI foundation for JalDrishti 2030. This service currently exposes health/status functionality and includes a PostgreSQL + PostGIS schema foundation. Analytical endpoints for WSI, forecasting, data ingestion and hydraulic analysis are future work.

The frontend uses this service for backend health visibility. Analytical screens still use explicitly labelled local prototype fixtures; a healthy API response does not mean the displayed values are live or validated.

## API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /` | Service identity and API documentation path |
| `GET /api/v1/health` | Health/status check |
| `/api/v1/docs` | Interactive OpenAPI documentation |

## Run with Docker Compose

Run these commands from this directory:

```bash
cp .env.example .env
```

Set the following values in `.env` before starting the stack:

```dotenv
PROJECT_NAME=JalDrishti 2030 API
ENVIRONMENT=local
API_V1_PREFIX=/api/v1
POSTGRES_USER=jaldrishti
POSTGRES_PASSWORD=change-this-local-password
POSTGRES_DB=jaldrishti
DATABASE_URL=postgresql+psycopg://jaldrishti:change-this-local-password@db:5432/jaldrishti
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
```

Use a URL-encoded password if it contains reserved characters. Keep real credentials out of Git.

Start the API and database:

```bash
docker compose up --build
```

The API listens on `http://localhost:8000`. OpenAPI docs are at `http://localhost:8000/api/v1/docs`; health should respond at `http://localhost:8000/api/v1/health`.

## Run without Docker

You need Python 3.12+ and a PostgreSQL instance with PostGIS support.

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements-dev.txt
```

Set `DATABASE_URL` in your local `.env` to the database URL for your instance, then run:

```bash
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Environment variables

| Variable | Purpose |
|---|---|
| `PROJECT_NAME` | API service name |
| `ENVIRONMENT` | Environment label, such as `local` or `production` |
| `API_V1_PREFIX` | Versioned API prefix; defaults to `/api/v1` |
| `DATABASE_URL` | SQLAlchemy connection URL using the psycopg driver |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Docker Compose database initialisation |
| `CORS_ORIGINS` | Comma-separated exact allowed browser origins |
| `LOG_LEVEL` | Logging level |

For a deployed frontend, set `CORS_ORIGINS` to the exact deployed frontend origin, with no path suffix. Include additional origins only when required. Do not use a wildcard origin with credentialed requests.

## Tests and lint

```bash
make test
make lint
```

## Schema notes

- Observations for consumption, groundwater, rainfall, supply and losses share a generic observation model and are distinguished by variable definitions.
- Enumerated status and grade values use `VARCHAR` columns with database `CHECK` constraints to make schema evolution manageable.
- Dataset versions require an explicit `is_synthetic` value so data provenance is not silently assumed.
- The initial Alembic migration was authored as a baseline and should be treated as the reference for subsequent schema changes.

## Current scope and roadmap

| Phase | Scope | Status |
|---|---|---|
| 2A | FastAPI skeleton, database schema, migrations and health check | Implemented foundation |
| 2B | Data-ingestion connectors and provenance population | Planned |
| 2C | Server-side WSI service and persisted analytical runs | Planned |
| 2D | Forecasting service and validation/model registry | Planned |
| 2E | Frontend integration with implemented analytical endpoints | Pending; health integration only |
| 3 | EPANET/WNTR simulation, NSGA-II optimisation and human-review workflow | Planned |

## Deployment notes

For a Docker-based host, configure the service's root directory as this backend folder, build using the included `Dockerfile`, and expose port `8000`. Set `DATABASE_URL` to the production database address, not `localhost` or the Compose hostname `db`. Configure the database, migrations and network access according to the chosen hosting provider.

Set `CORS_ORIGINS` to the real frontend origin before deployment. The backend is separate from the Vercel frontend: a successful frontend deployment does not prove the API is healthy, and vice versa. Inspect the backend host's build/runtime logs for the exact cause of any failed deployment.

## Research integrity

Do not treat synthetic frontend fixtures or the illustrative network as measured Bengaluru operational data. No calibrated citywide hydraulic result or validated citywide intervention recommendation is claimed by this phase.
