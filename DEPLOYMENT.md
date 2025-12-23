# Deployment Guide - Railway (All-in-One)

This guide covers deploying the entire loan-ai application on **Railway**:
- **Database**: Railway PostgreSQL with pgvector
- **Backend**: FastAPI on Railway
- **Frontend**: Next.js on Railway

Everything in one platform, one dashboard, one bill!

## Prerequisites

- GitHub account (already set up ✓)
- Railway account (sign up at https://railway.app with GitHub)
- Credit card for Railway (free $5 trial credit, then ~$5-10/month)

---

## Architecture Overview

Your Railway project will have **3 services**:
1. **PostgreSQL** - Database with pgvector extension
2. **loan-ai-api** - FastAPI backend (apps/api/)
3. **loan-ai-web** - Next.js frontend (apps/web/)

All services communicate via Railway's private networking.

---

## Step 1: Create Railway Project

### 1.1 Create New Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub
4. Select the `loan-ai` repository
5. Click "Deploy Now"

Railway will create a new project for you.

---

## Step 2: Add PostgreSQL Database

### 2.1 Add Database Service

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will provision a PostgreSQL instance

### 2.2 Enable pgvector Extension

Railway PostgreSQL doesn't have pgvector by default. You need to enable it:

**Option A: Using Railway's PostgreSQL client**
1. Click on your PostgreSQL service
2. Go to **"Data"** tab
3. Click **"Query"**
4. Run this SQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Option B: Using psql locally**
1. Click on PostgreSQL service → **"Connect"** tab
2. Copy the connection string
3. In your terminal:
```bash
psql "postgresql://postgres:...@...railway.app:...postgres"
# Then run:
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2.3 Note Database Credentials

Railway automatically creates a `DATABASE_URL` variable that other services can reference.

---

## Step 3: Deploy Backend (FastAPI)

### 3.1 Add Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your `loan-ai` repository
3. Railway will try to auto-detect, but we need to configure it for the monorepo

### 3.2 Configure Backend Service

Click on the new service, then go to **"Settings"**:

- **Service Name**: `loan-ai-api`
- **Root Directory**: `apps/api`
- **Build Command**: (leave empty, uses railway.json)
- **Start Command**: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 3.3 Add Environment Variables

Go to **"Variables"** tab and add:

```bash
# Database - Reference from PostgreSQL service
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secret - Generate a secure random string
JWT_SECRET=<generate-this-below>

# CORS - Will update after frontend is deployed
CORS_ORIGINS=*

# API Config
API_V1_PREFIX=/api/v1

# Python
PYTHONUNBUFFERED=1
```

**Generate JWT_SECRET:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Or use Railway's built-in generator: Click "Raw Editor" → Type `${{ Railway.RANDOM_SECRET }}`

### 3.4 Reference Database

To reference the PostgreSQL service:
1. In `DATABASE_URL` variable, click the text box
2. Type `${{` and you'll see a dropdown
3. Select `Postgres.DATABASE_URL`

This automatically uses Railway's private networking!

### 3.5 Deploy Backend

Click **"Deploy"** or just save - Railway auto-deploys on any change.

**Check deployment:**
- Go to **"Deployments"** tab to see build logs
- Once deployed, go to **"Settings"** → **"Networking"**
- Click **"Generate Domain"** to get a public URL
- Visit `https://your-backend-url.up.railway.app/docs` to see API docs

---

## Step 4: Deploy Frontend (Next.js)

### 4.1 Add Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your `loan-ai` repository again
3. Railway will create another service

### 4.2 Configure Frontend Service

Go to **"Settings"**:

- **Service Name**: `loan-ai-web`
- **Root Directory**: `apps/web`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 4.3 Add Environment Variables

Go to **"Variables"** tab and add:

```bash
# Backend API URL - Reference from backend service
NEXT_PUBLIC_API_URL=${{loan-ai-api.RAILWAY_PUBLIC_DOMAIN}}

# Or manually set it:
NEXT_PUBLIC_API_URL=https://loan-ai-api-production.up.railway.app
```

To reference the backend URL:
1. Click on `NEXT_PUBLIC_API_URL`
2. Type `https://${{loan-ai-api.RAILWAY_PUBLIC_DOMAIN}}`
3. Railway will auto-substitute the backend's public domain

### 4.4 Generate Public Domain

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. You'll get a URL like `https://loan-ai-web-production.up.railway.app`

### 4.5 Deploy Frontend

Railway will auto-deploy. Check **"Deployments"** tab for progress.

---

## Step 5: Update CORS

Now that you have the frontend URL, update the backend CORS:

1. Go to **loan-ai-api** service
2. Go to **"Variables"** tab
3. Update `CORS_ORIGINS`:
```bash
CORS_ORIGINS=https://loan-ai-web-production.up.railway.app
```
Replace with your actual frontend URL.

4. Railway will auto-redeploy the backend

---

## Step 6: Verify Deployment

### 6.1 Check All Services Running

In your Railway project dashboard, you should see:
- ✅ **Postgres** - Active
- ✅ **loan-ai-api** - Active (with public domain)
- ✅ **loan-ai-web** - Active (with public domain)

### 6.2 Test Backend

Visit: `https://your-backend-domain.up.railway.app/docs`

You should see FastAPI Swagger documentation.

### 6.3 Test Frontend

Visit: `https://your-frontend-domain.up.railway.app`

The Next.js app should load and connect to the backend.

### 6.4 Check Database Migrations

1. Go to **loan-ai-api** service → **"Deployments"**
2. Click on latest deployment → View logs
3. You should see:
```
INFO  [alembic.runtime.migration] Running upgrade -> f001, fresh_schema
INFO  [alembic.runtime.migration] Running upgrade f001 -> c07b1fb62d8e, add_repayment_strategy
```

---

## Step 7: Seed Initial Data (Optional)

To add loan products and test data:

### Option 1: Railway CLI (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Select the loan-ai-api service
railway service

# Run seed script
railway run python -m scripts.seed_data
```

### Option 2: One-off Command in Dashboard

1. Go to **loan-ai-api** service
2. Click **"Settings"** → **"Deploy"** section
3. Under "Custom Start Command", temporarily change to:
```bash
python -m scripts.seed_data && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
4. Let it deploy and run
5. Change it back to the original command

### Option 3: Connect Locally

```bash
# Get DATABASE_URL from Railway
# In PostgreSQL service -> Connect tab

# Set in your local .env
DATABASE_URL=postgresql://postgres:...railway.app.../postgres

# Run seed script
cd apps/api
source .venv/bin/activate
python -m scripts.seed_data
```

---

## Railway Service Configuration Summary

### PostgreSQL Service
- **Type**: PostgreSQL Database
- **Extensions**: vector
- **Variables**: Auto-generated `DATABASE_URL`

### loan-ai-api Service (Backend)
- **Root Directory**: `apps/api`
- **Start Command**: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Variables**:
  ```bash
  DATABASE_URL=${{Postgres.DATABASE_URL}}
  JWT_SECRET=<your-secret>
  CORS_ORIGINS=https://your-frontend.up.railway.app
  API_V1_PREFIX=/api/v1
  PYTHONUNBUFFERED=1
  ```

### loan-ai-web Service (Frontend)
- **Root Directory**: `apps/web`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Variables**:
  ```bash
  NEXT_PUBLIC_API_URL=https://${{loan-ai-api.RAILWAY_PUBLIC_DOMAIN}}
  ```

---

## Continuous Deployment

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push
```

All services will redeploy automatically!

You can also:
- **Manual deploy**: Click "Deploy" in any service
- **Rollback**: Go to Deployments → Click on old deployment → "Redeploy"
- **Preview environments**: Railway supports PR-based preview deployments (Pro plan)

---

## Custom Domain (Optional)

### For Frontend:

1. Go to **loan-ai-web** service → **"Settings"** → **"Networking"**
2. Click **"Custom Domain"**
3. Add your domain (e.g., `loan-ai.yourdomain.com`)
4. Update your DNS:
   - Add CNAME record: `loan-ai` → `your-app.up.railway.app`
5. Railway automatically provisions SSL certificate

### For Backend:

Same process for **loan-ai-api** service if you want API on custom domain.

Don't forget to update CORS_ORIGINS after adding custom domains!

---

## Monitoring & Logs

### View Logs
1. Click on any service
2. Go to **"Deployments"** tab
3. Click on a deployment to see real-time logs

### Metrics
1. Click on any service
2. Go to **"Metrics"** tab
3. See CPU, Memory, Network usage

### Alerts
- Railway Pro plan includes alerting for service downtime
- Free tier: Manually monitor via dashboard

---

## Costs

Railway pricing (as of 2024):
- **Trial**: $5 credit (no credit card required initially)
- **Usage-based**:
  - ~$5/month for small PostgreSQL database
  - ~$5/month per service (backend + frontend)
  - **Total estimated**: $10-15/month for all 3 services

Free $5 credit gets you started, then you'll need to add payment method.

**Cost optimization tips**:
- Use 1 replica per service (default)
- Set sleep/scale-to-zero for non-production environments
- Monitor usage in "Usage" tab

---

## Troubleshooting

### Backend won't start
**Check:**
1. Go to loan-ai-api → Deployments → View logs
2. Common issues:
   - Missing `DATABASE_URL` → Check it references `${{Postgres.DATABASE_URL}}`
   - Migration failed → Check pgvector extension is enabled
   - Port error → Ensure using `--port $PORT` in start command

**Fix:**
```bash
# In Railway PostgreSQL Query tab:
CREATE EXTENSION IF NOT EXISTS vector;
```

### Frontend can't connect to backend
**Check:**
1. `NEXT_PUBLIC_API_URL` is set correctly
2. Backend has public domain generated
3. CORS_ORIGINS includes frontend URL

**Fix:**
- Update CORS_ORIGINS in backend service
- Ensure both services have public domains

### Database connection errors
**Check:**
1. PostgreSQL service is running
2. DATABASE_URL is properly referenced in backend

**Fix:**
- Restart PostgreSQL service
- Check connection string in Postgres service → "Connect" tab

### Build failures
**Check deployment logs:**
- Frontend: Missing dependencies? Run `npm install` in build command
- Backend: Python version issues? Railway uses Python 3.11 by default

### pgvector not found
**Error:** `extension "vector" does not exist`

**Fix:**
```bash
# Connect to Railway PostgreSQL
railway connect Postgres

# Or use psql with connection string
psql "your-database-url"

# Run:
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Security Best Practices

1. **Rotate JWT_SECRET** regularly via Railway variables
2. **Restrict CORS** to specific domains (not `*`)
3. **Use Railway's private networking** for service-to-service communication
4. **Enable MFA** on your Railway account
5. **Review access logs** in Railway dashboard

---

## Backup & Recovery

### Database Backups
Railway automatically backs up PostgreSQL databases, but for critical data:

**Manual backup:**
```bash
# Get DATABASE_URL from Railway
pg_dump "your-database-url" > backup.sql

# Restore:
psql "your-database-url" < backup.sql
```

**Automated backups:**
- Upgrade to Railway Pro for automated daily backups
- Or set up a cron job using Railway CLI

---

## Next Steps

After successful deployment:

1. ✅ All services running on Railway
2. ✅ Database migrations applied
3. ✅ Frontend can reach backend
4. 🔄 Seed initial data (Step 7)
5. 🔄 Set up custom domain (optional)
6. 🔄 Configure monitoring alerts
7. 🔄 Set up staging environment (duplicate Railway project)

Your app is now live! 🚀

**Frontend URL**: `https://loan-ai-web-production.up.railway.app`
**Backend API**: `https://loan-ai-api-production.up.railway.app/docs`

---

## Railway CLI Quick Reference

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run commands in Railway environment
railway run python manage.py

# View logs
railway logs

# Open project in browser
railway open

# SSH into service
railway shell
```

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/danhnguyen8br/loan-ai/issues
