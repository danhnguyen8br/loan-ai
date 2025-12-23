# Railway Quick Start

Deploy your entire loan-ai app in ~15 minutes!

## TL;DR

1. **Sign up**: https://railway.app (use GitHub login)
2. **Deploy from GitHub**: Select `loan-ai` repository
3. **Add 3 services**:
   - PostgreSQL database
   - Backend (apps/api)
   - Frontend (apps/web)
4. **Configure & deploy**

## 3 Services Setup

### 1️⃣ PostgreSQL Database

```
+ New → Database → Add PostgreSQL
```

**After creation:**
- Go to Data tab → Query
- Run: `CREATE EXTENSION IF NOT EXISTS vector;`

### 2️⃣ Backend (FastAPI)

```
+ New → GitHub Repo → loan-ai
```

**Settings:**
- Root Directory: `apps/api`
- Start Command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Variables:**
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=${{Railway.RANDOM_SECRET}}
CORS_ORIGINS=*
API_V1_PREFIX=/api/v1
PYTHONUNBUFFERED=1
```

**Generate domain:** Settings → Networking → Generate Domain

### 3️⃣ Frontend (Next.js)

```
+ New → GitHub Repo → loan-ai
```

**Settings:**
- Root Directory: `apps/web`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Variables:**
```bash
NEXT_PUBLIC_API_URL=https://${{loan-ai-api.RAILWAY_PUBLIC_DOMAIN}}
```

**Generate domain:** Settings → Networking → Generate Domain

### 4️⃣ Update CORS

Go back to backend service → Variables:
```bash
CORS_ORIGINS=https://your-frontend-url.up.railway.app
```

## Done!

- ✅ Frontend: https://loan-ai-web-production.up.railway.app
- ✅ Backend: https://loan-ai-api-production.up.railway.app/docs
- ✅ Database: Connected via private network

## Seed Data

```bash
npm i -g @railway/cli
railway login
railway link
railway service  # Select loan-ai-api
railway run python -m scripts.seed_data
```

## Cost

~$10-15/month for all services (free $5 trial credit)

---

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full detailed guide.
