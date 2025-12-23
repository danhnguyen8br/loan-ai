# Loan AI Recommender MVP

AI-powered loan product recommendation system that uses **deterministic rules + calculators** for recommendations, with LLM assistance for intake UX and explanations.

## Project Structure

```
loan-ai/
├── apps/
│   ├── api/              # FastAPI backend
│   │   ├── app/
│   │   │   ├── core/     # Config, database
│   │   │   ├── models/   # SQLAlchemy models
│   │   │   ├── schemas/  # Pydantic schemas
│   │   │   ├── routers/  # API endpoints
│   │   │   ├── services/ # Business logic
│   │   │   └── main.py
│   │   ├── alembic/      # Database migrations
│   │   ├── tests/
│   │   └── requirements.txt
│   └── web/              # Next.js frontend
│       ├── app/          # App router pages
│       ├── components/   # React components
│       └── lib/          # Utilities
├── packages/
│   └── shared/           # Shared types (optional)
├── infra/
│   └── docker/
│       └── docker-compose.yml
└── docs/
    ├── product_catalog/
    └── api_contracts/
```

## Quick Start

### 1. Start Database

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

This starts PostgreSQL with pgvector extension on port 5432.

### 2. Backend Setup

```bash
cd apps/api

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -U pip
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000
```

API will be available at http://localhost:8000
API docs at http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd apps/web

# Install dependencies
npm install

# Create .env.local
cp .env.local.example .env.local

# Start dev server
npm run dev
```

Frontend will be available at http://localhost:3000

## Core Features

### MVP Scope (Must-Have)

- ✅ Product catalog + rules in database (editable via admin)
- ✅ Deterministic calculators + rule engine
- ✅ Recommendation engine + compare view
- ✅ Audit log of recommendations
- 🔄 Minimal RAG FAQ (optional)

### Out of Scope (For Later)

- Full AVM ML model (using stub for now)
- Bank integrations
- Automated document OCR/verification

## API Endpoints

### Applications

- `POST /api/v1/applications` - Create draft application
- `GET /api/v1/applications/{id}` - Get application
- `PUT /api/v1/applications/{id}` - Update application
- `POST /api/v1/applications/{id}/compute` - Compute metrics (DSR, LTV, etc.)

### Products

- `GET /api/v1/products` - List products (filter by purpose)
- `GET /api/v1/products/{id}` - Get product details
- `POST /api/v1/products` - Create product (admin)
- `PUT /api/v1/products/{id}` - Update product (admin)
- `DELETE /api/v1/products/{id}` - Delete product (admin)

### Recommendations

- `POST /api/v1/recommendations/{application_id}/recommend` - Generate recommendations
- `GET /api/v1/recommendations/{id}` - Get recommendation results

## Database Schema

### Core Tables

- `users` - User accounts
- `banks` - Partner banks
- `loan_products` - Loan product catalog with rules
- `applications` - Loan applications
- `application_incomes` - Income sources
- `application_debts` - Existing debts
- `application_collaterals` - Collateral assets
- `recommendation_runs` - Audit log of recommendations

### Product Rules Structure

Products include constraints stored as JSONB:

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

### Backend

- **FastAPI** - Python web framework
- **PostgreSQL** with **pgvector** - Database with vector support
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **Pydantic** - Data validation

### Frontend

- **Next.js 15** - React framework (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching (to be added)

## Development Workflow

### Creating Database Migrations

```bash
cd apps/api
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Running Tests

```bash
cd apps/api
pytest
```

### Adding New API Endpoint

1. Define Pydantic schemas in `app/schemas/`
2. Create service functions in `app/services/`
3. Add router endpoints in `app/routers/`
4. Register router in `app/main.py`

## Non-Negotiable Rules

### Deterministic Decision Boundary

- **Filtering/scoring** MUST be deterministic (rule engine + calculators)
- LLM can:
  - Ask questions (intake)
  - Explain results using structured facts
  - Answer FAQ via RAG with citations
- LLM CANNOT:
  - Invent rates, fees, eligibility constraints
  - Claim approval
  - Output numbers not in allowed inputs/outputs

### Server-Side Guardrails

- All responses validated by Pydantic schemas
- LLM responses with forbidden claims are rejected/sanitized

## Next Steps

### Immediate Development Tasks

1. Implement amortization calculators (annuity + equal principal)
2. Build rule engine with hard filters + soft scoring
3. Implement recommendation algorithm
4. Create frontend wizard for application intake
5. Add unit tests for calculators and rule engine
6. Seed initial product catalog data

### Future Enhancements

- Document upload and verification
- AVM (Automated Valuation Model) integration
- Bank partner portal
- RAG-based FAQ system
- Monitoring and analytics

## Environment Variables

See `.env.example` files in:
- `/apps/api/.env.example` - Backend configuration
- `/apps/web/.env.local.example` - Frontend configuration

## License

Proprietary - All Rights Reserved

## Support

For issues and questions, please contact the development team.
