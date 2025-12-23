# Deployment Guide

This guide covers deploying the loan-ai application with:
- **Frontend**: Vercel
- **Database**: Supabase PostgreSQL
- **Backend**: Railway (recommended) or Render

## Prerequisites

- GitHub account (already set up ✓)
- Vercel account (sign up at https://vercel.com with GitHub)
- Supabase account (sign up at https://supabase.com)
- Railway account (sign up at https://railway.app with GitHub)

---

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `loan-ai` or your preferred name
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

### 1.2 Enable pgvector Extension

1. In your Supabase project, go to **Database** → **Extensions**
2. Search for `vector`
3. Enable the `vector` extension

### 1.3 Get Connection String

1. Go to **Project Settings** → **Database**
2. Under "Connection string", select **URI** mode
3. Copy the connection string (format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`)
4. Replace `[YOUR-PASSWORD]` with your database password
5. Save this - you'll need it for Railway and local development

**Connection String Format:**
```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `loan-ai` repository
4. Railway will detect the monorepo structure

### 2.2 Configure Backend Service

1. Click "Add Service" → "GitHub Repo" → Select `loan-ai`
2. In the service settings:
   - **Name**: `loan-ai-api`
   - **Root Directory**: `apps/api`
   - **Start Command**: (will use Procfile automatically)

### 2.3 Add Environment Variables

In Railway service settings → **Variables**, add:

```bash
# Database (from Supabase)
DATABASE_URL=postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS (will update after deploying frontend)
CORS_ORIGINS=https://your-app.vercel.app

# API Config
API_V1_PREFIX=/api/v1
```

**Generate JWT_SECRET:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2.4 Deploy

1. Click "Deploy"
2. Railway will:
   - Install dependencies
   - Run Alembic migrations
   - Start the FastAPI server
3. Once deployed, copy the **public URL** (e.g., `https://loan-ai-api-production.up.railway.app`)

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Import Project

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `loan-ai` repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 3.2 Add Environment Variables

In Vercel project settings → **Environment Variables**, add:

```bash
NEXT_PUBLIC_API_URL=https://loan-ai-api-production.up.railway.app
```

Replace with your actual Railway backend URL.

### 3.3 Deploy

1. Click "Deploy"
2. Vercel will build and deploy your Next.js app
3. Copy the **deployment URL** (e.g., `https://loan-ai.vercel.app`)

---

## Step 4: Update CORS Settings

### 4.1 Update Railway Environment

1. Go back to Railway → your backend service
2. Update the `CORS_ORIGINS` variable:
```bash
CORS_ORIGINS=https://loan-ai.vercel.app
```
Replace with your actual Vercel URL.

3. Click "Redeploy" to apply changes

### 4.2 Update vercel.json (Optional)

If you want API proxy through Vercel:

1. Edit `vercel.json` in your repository
2. Update the `destination` URL to your Railway backend:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-url.railway.app/api/:path*"
    }
  ]
}
```

---

## Step 5: Verify Deployment

### 5.1 Test Backend

Visit your Railway URL + `/docs`:
```
https://loan-ai-api-production.up.railway.app/docs
```

You should see the FastAPI Swagger documentation.

### 5.2 Test Frontend

Visit your Vercel URL:
```
https://loan-ai.vercel.app
```

The app should load and be able to connect to the backend.

### 5.3 Test Database Connection

1. In Railway backend logs, check for successful migrations
2. Try creating a test user or application through the frontend

---

## Step 6: Seed Data (Optional)

To add initial loan products:

### Option 1: Run Locally Against Supabase

```bash
cd apps/api
source .venv/bin/activate

# Update .env with Supabase DATABASE_URL
# Then run:
python -m scripts.seed_data
```

### Option 2: Use Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed script
railway run python -m scripts.seed_data
```

---

## Continuous Deployment

Both Vercel and Railway are now set up for automatic deployments:

- **Push to `main` branch** → Automatic deployment
- **Create PR** → Preview deployments (Vercel)

---

## Environment Variables Summary

### Supabase (Database)
- ✅ No additional config needed
- Connection string used by Railway backend

### Railway (Backend)
```bash
DATABASE_URL=postgresql://postgres.xxxxx:...@supabase.com:6543/postgres
JWT_SECRET=<generated-secret>
CORS_ORIGINS=https://your-app.vercel.app
API_V1_PREFIX=/api/v1
```

### Vercel (Frontend)
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

---

## Troubleshooting

### Backend won't start
- Check Railway logs for migration errors
- Verify DATABASE_URL is correct
- Ensure pgvector extension is enabled in Supabase

### Frontend can't connect to backend
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check CORS_ORIGINS in Railway matches your Vercel domain
- Check Railway backend is running and accessible

### Database connection errors
- Verify Supabase password in DATABASE_URL
- Check Supabase project is not paused (free tier pauses after inactivity)
- Ensure connection string uses port 6543 (connection pooler)

---

## Costs

- **Supabase**: Free tier includes 500MB database, 2GB bandwidth
- **Railway**: $5/month credit (enough for small apps), pay-as-you-go after
- **Vercel**: Free tier includes unlimited deployments for personal projects

---

## Next Steps

After deployment:
1. Set up custom domain (optional)
2. Enable Supabase Auth if needed
3. Set up monitoring (Railway/Vercel dashboards)
4. Configure backup strategy for Supabase database
5. Add environment-specific configurations
