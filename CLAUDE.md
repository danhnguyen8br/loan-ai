# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mortgage simulator and cost comparison tool for Vietnam. This is a **frontend-only** project using Next.js with a local TypeScript calculation engine.

## Architecture

### Project Structure
- `apps/web/` - Next.js 15 frontend (App Router)
- `packages/loan-engine/` - TypeScript loan calculation engine (shared package)

### Frontend Architecture (Next.js)
- `app/(main)/` - Main user-facing pages (simulator)
- `app/api/` - Next.js API routes (local endpoints)
- `components/` - React components
- `components/ui/` - Reusable UI components
- `components/simulator/` - Simulator-specific components
- `lib/` - Utilities, hooks, and type definitions
- `data/` - Static TypeScript data (curated offers)

### Loan Engine Package
- `packages/loan-engine/src/engine.ts` - Core simulation engine
- `packages/loan-engine/src/templates.ts` - Built-in product templates
- `packages/loan-engine/src/types.ts` - TypeScript type definitions

## Development Commands

### Initial Setup

```bash
# Install loan-engine package
cd packages/loan-engine
npm install
npm run build

# Install frontend dependencies
cd apps/web
npm install
```

### Running Development Server

```bash
# From apps/web/
npm run dev
# App: http://localhost:3000
```

### Building for Production

```bash
# Build loan-engine first
cd packages/loan-engine
npm run build

# Build frontend
cd apps/web
npm run build
```

### Testing

```bash
# Loan engine tests
cd packages/loan-engine
npm test

# Frontend type checking
cd apps/web
npm run build
```

## Key Features

### Simulator Flow
1. **Category Step** - Choose loan type (MORTGAGE_RE or REFINANCE)
2. **Inputs Step** - Enter loan details
3. **Strategy Results Step** - View 3 strategies compared across all product templates

### Multi-Strategy Comparison
- **Mortgage (M1, M2, M3)**:
  - M1: Minimum Payment
  - M2: Extra Principal (configurable amount)
  - M3: Exit Plan (early payoff)
  
- **Refinance (R1, R2, R3)**:
  - R1: Refinance Now (liquidity)
  - R2: Refinance + Accelerate
  - R3: Optimal Timing

### API Routes (Next.js)
- `GET /api/simulator/templates` - Fetch product templates (built-in)
- `POST /api/simulator/simulate` - Run multi-strategy simulation
- `POST /api/simulator/recommend` - Get recommended loan packages

### Data Sources
- Built-in templates from `@loan-ai/loan-engine` package (static, no database)
- Curated offers from `data/simulator-curated-offers.ts` (display metadata)

## Tech Stack

**Frontend:**
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- TanStack Query (React Query)

**Loan Engine:**
- TypeScript
- Vitest (testing)

## Adding New Features

### Adding New Product Template

1. Edit `packages/loan-engine/src/templates.ts` to add template data
2. Edit `apps/web/data/simulator-curated-offers.ts` to add display metadata
3. Templates must conform to the `ProductTemplate` type

### Adding New Simulation Strategy

1. Update types in `packages/loan-engine/src/types.ts`
2. Implement strategy logic in `packages/loan-engine/src/engine.ts`
3. Update frontend labels in `apps/web/lib/simulator-types.ts`

## Environment Configuration

Frontend (`apps/web/.env.local`):
- No external API configuration needed
- All simulations run locally
