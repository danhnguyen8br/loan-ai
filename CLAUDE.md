# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered loan product recommendation system using **deterministic rules + calculators** for recommendations, with LLM assistance for intake UX and explanations. This is a monorepo with FastAPI backend and Next.js frontend.

## Architecture

### Monorepo Structure
- `apps/api/` - FastAPI backend with PostgreSQL + pgvector
- `apps/web/` - Next.js 15 frontend (App Router)
- `packages/shared/` - Shared types (optional)
- `infra/docker/` - Docker Compose for PostgreSQL
- `docs/` - Product catalog and API contracts documentation

### Backend Architecture (FastAPI)
- `app/core/` - Configuration, database setup
- `app/models/` - SQLAlchemy models (database tables)
- `app/schemas/` - Pydantic schemas (API validation)
- `app/routers/` - API endpoint handlers
- `app/services/` - Business logic layer (calculators, rule engine, recommendation algorithm)
- `alembic/` - Database migrations

### Frontend Architecture (Next.js)
- `app/` - Next.js App Router pages
- `components/` - React components
- `lib/` - Utilities and shared code

### Key Database Models
- `LoanProduct` - Product catalog with JSONB `constraints_json` containing hard/soft rules
- `Application` - Loan applications with related income, debts, collaterals
- `RecommendationRun` - Audit log of all recommendation computations

## Development Commands

### Initial Setup

```bash
# Start PostgreSQL database with pgvector
docker compose -f infra/docker/docker-compose.yml up -d

# Backend setup
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -U pip
pip install -r requirements.txt
cp .env.example .env  # Edit with actual values

# Run migrations
alembic upgrade head

# Frontend setup
cd apps/web
npm install
cp .env.local.example .env.local  # Edit with actual values
```

### Running Development Servers

```bash
# Backend (from apps/api/)
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
# API: http://localhost:8000
# Docs: http://localhost:8000/docs

# Frontend (from apps/web/)
npm run dev
# App: http://localhost:3000
```

### Database Migrations

```bash
cd apps/api
source .venv/bin/activate

# Create new migration (auto-generate from model changes)
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

### Testing

```bash
# Backend tests (from apps/api/)
source .venv/bin/activate
pytest

# Run specific test file
pytest tests/test_calculators.py

# Run with verbose output
pytest -v

# Frontend tests (from apps/web/)
npm run lint
npm run build  # Type checking happens during build
```

## Adding New Features

### Adding New API Endpoint

1. Define request/response schemas in `app/schemas/<domain>.py` using Pydantic
2. Implement business logic in `app/services/<domain>.py`
3. Create endpoint handler in `app/routers/<domain>.py` using FastAPI router
4. Register router in `app/main.py` if it's a new router file

### Adding New Database Table

1. Create SQLAlchemy model in `app/models/<name>.py`
2. Import model in `app/models/__init__.py`
3. Generate migration: `alembic revision --autogenerate -m "Add <table>"`
4. Review generated migration in `alembic/versions/`
5. Apply migration: `alembic upgrade head`

## Critical Constraints

### Deterministic Decision Boundary

This is the most important architectural constraint:

**MUST be deterministic:**
- Product filtering (hard constraints: max_ltv, max_dsr, min_income, max_tenor, geo, collateral types)
- Scoring calculations (soft preferences: fixed rate duration, SLA, fees)
- All financial calculations (DSR, LTV, monthly payment, amortization)
- Recommendation ranking algorithm

**LLM CAN do:**
- Guide application intake (ask clarifying questions)
- Explain recommendation results using structured facts from database
- Answer FAQ with RAG citations from product documentation

**LLM CANNOT do:**
- Generate or modify rates, fees, or eligibility constraints
- Make approval decisions or claims
- Output financial numbers not derived from deterministic calculators
- Invent product features or terms

### Server-Side Validation

All API responses must be validated by Pydantic schemas. Any LLM-generated content claiming approval or inventing financial terms must be rejected/sanitized before reaching users.

## Product Rules Structure

Products store constraints in JSONB fields:

```json
{
  "hard": {
    "max_ltv": 0.75,
    "max_dsr": 0.5,
    "min_income_monthly": 20000000,
    "max_tenor_months": 240,
    "allowed_collateral_types": ["HOUSE", "CONDO", "LAND"],
    "geo_allowed": ["HCM", "HN", "DN"]
  },
  "soft": {
    "pref_fixed_months_weight": 0.3,
    "pref_fast_sla_weight": 0.2,
    "pref_low_fee_weight": 0.2
  }
}
```

## Tech Stack

**Backend:**
- FastAPI (web framework)
- SQLAlchemy (ORM)
- Alembic (migrations)
- PostgreSQL with pgvector
- Pydantic (validation)
- pytest (testing)

**Frontend:**
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- TanStack Query

## Environment Configuration

Backend (`apps/api/.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `CORS_ORIGINS` - Allowed frontend origins
- `API_V1_PREFIX` - API version prefix (default: /api/v1)

Frontend (`apps/web/.env.local`):
- API endpoint configuration

See `.env.example` files for complete list.
