.PHONY: up down migrate revision test lint

up:        ## Start Postgres+PostGIS and the API, applying migrations first
	docker compose up --build

down:
	docker compose down

migrate:   ## Apply migrations against whatever DATABASE_URL points at
	alembic upgrade head

revision:  ## Autogenerate a new migration from model changes (name=... required)
	alembic revision --autogenerate -m "$(name)"

test:
	pytest -q

lint:
	ruff check app tests
