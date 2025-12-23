# 🚀 LoanAI Quick Start Guide

## Prerequisites

Before starting, ensure you have:

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
   - Make sure Docker Desktop is running
   - Check by running: `docker ps`

2. **Python 3.9+** - Already installed ✓

3. **Node.js 18+** - Already installed ✓

## One-Command Startup

The application has been fully configured and is ready to run!

### Start Everything

```bash
./start.sh
```

This script will:
- ✅ Check if Docker is running
- ✅ Start PostgreSQL database
- ✅ Run database migrations
- ✅ Seed database with sample data (6 banks, 12 loan products, 2 test users)
- ✅ Start backend API server (port 8000)
- ✅ Start frontend web app (port 3000)
- ✅ Show you the logs

### Stop Everything

```bash
./stop.sh
```

## Access the Application

Once started, open your browser:

### 🌐 Web Application
**URL:** http://localhost:3000

**Test Credentials:**
- Email: `test@example.com`
- Password: `test123456`

OR

- Email: `admin@loanai.vn`
- Password: `admin123456`

### 📚 API Documentation
**URL:** http://localhost:8000/docs

Interactive Swagger UI with all API endpoints

### 🔧 API Base URL
**URL:** http://localhost:8000/api/v1

## What to Try

1. **Browse Products** - View 12 loan products from 6 Vietnamese banks
   - Filter by purpose (Home Purchase, Refinance, Repair/Build)
   - Compare rates, fees, and eligibility

2. **Apply for a Loan** - Complete the 5-step application wizard
   - Basic information
   - Loan details
   - Income sources
   - Existing debts
   - Collateral

3. **Get Recommendations** - Receive personalized product matches
   - Ranked by fit score (0-100)
   - Detailed cost estimates
   - Approval predictions (HIGH/MEDIUM/LOW)
   - Why each product fits your profile
   - Risk considerations

4. **View API Docs** - Explore the backend API
   - Try out endpoints
   - See request/response schemas
   - Test authentication

## Troubleshooting

### Docker Not Running

**Error:** `Docker is not running`

**Solution:**
1. Open Docker Desktop app
2. Wait for it to fully start (whale icon in menu bar)
3. Run `./start.sh` again

### Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port (edit start.sh)
```

### Database Connection Error

**Error:** `Could not connect to database`

**Solution:**
```bash
# Check if PostgreSQL container is running
docker ps

# Restart database
docker compose -f infra/docker/docker-compose.yml restart

# Check logs
docker compose -f infra/docker/docker-compose.yml logs
```

### Frontend Build Error

**Error:** `Module not found`

**Solution:**
```bash
cd apps/web
rm -rf node_modules package-lock.json
npm install
```

### Backend Import Error

**Error:** `ModuleNotFoundError`

**Solution:**
```bash
cd apps/api
source .venv/bin/activate
pip install -r requirements.txt
```

## Manual Startup (Advanced)

If you prefer to start services individually:

### 1. Start Database

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

### 2. Backend

```bash
cd apps/api
source .venv/bin/activate
alembic upgrade head
python -m scripts.seed_data  # First time only
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd apps/web
npm run dev
```

## Database Access

Connect to PostgreSQL directly:

```bash
psql postgresql://loan:loan@localhost:5432/loan_ai
```

Or use a GUI tool:
- **Host:** localhost
- **Port:** 5432
- **Database:** loan_ai
- **Username:** loan
- **Password:** loan

## Viewing Logs

### Real-time logs

```bash
# Backend
tail -f /tmp/loan-ai-backend.log

# Frontend
tail -f /tmp/loan-ai-frontend.log

# Database
docker compose -f infra/docker/docker-compose.yml logs -f
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
│                 http://localhost:3000                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend (Port 3000)               │
│  - React components with TailwindCSS                    │
│  - TanStack Query for state management                  │
│  - Type-safe API client                                 │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                │
│  - RESTful API endpoints                                │
│  - JWT authentication                                   │
│  - Deterministic recommendation engine                  │
│  - Financial calculators                                │
└────────────────────┬────────────────────────────────────┘
                     │ SQLAlchemy
                     ▼
┌─────────────────────────────────────────────────────────┐
│           PostgreSQL + pgvector (Port 5432)             │
│  - Users, Banks, Loan Products                          │
│  - Applications (income, debts, collaterals)            │
│  - Recommendations (audit log)                          │
└─────────────────────────────────────────────────────────┘
```

## Next Steps

1. ✅ **Explore the UI** - Navigate through all pages
2. ✅ **Test the API** - Use the interactive docs
3. ✅ **Submit an application** - Try the full flow
4. ✅ **Review recommendations** - See the scoring algorithm
5. ✅ **Check the code** - Explore the implementation

## Need Help?

- **Documentation:** See `/docs` folder for API contracts and product catalog
- **Backend Code:** `apps/api/`
- **Frontend Code:** `apps/web/`
- **Project Guidelines:** `CLAUDE.md`

---

**Happy Testing!** 🎉
