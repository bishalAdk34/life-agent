# Life Agent

Monorepo: FastAPI backend (agent loop over Gemini) + Expo/React Native mobile app.

## Structure

- `apps/backend` — FastAPI, SQLAlchemy, Alembic, agent loop, tool registry (uv-managed)
- `apps/mobile` — Expo + React Native + TypeScript
- `docker-compose.yml` — local Postgres

## Local dev

### 1. Postgres

```
docker compose up -d
```

### 2. Backend

```
cd apps/backend
cp ../../.env.example .env   # edit values
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Health check: `GET http://localhost:8000/health`

### 3. Mobile

```
cd apps/mobile
npm install
npm run start
```

## Architecture

See project plan for full details: API layer (FastAPI routers, HTTP boundary only) →
service layer (deterministic business logic, no LLM) → agent layer (orchestration loop,
whitelisted tools, Gemini provider abstraction). LLM never does money/date/threshold math.
