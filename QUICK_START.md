# 🚀 Quick Start - LoanAI Application

## ⚠️ Port Conflicts Detected

Your system has services already running on:
- **Port 3000** (frontend port) - n8n or another service
- **Port 5432** (PostgreSQL port) - another database

## ✅ Solution: Use Alternative Ports

### Option 1: Use Existing PostgreSQL (Recommended)

Since you already have PostgreSQL running on port 5432, we can use it!

#### Step 1: Start Backend API

```bash
cd /Users/danguyen/loan-ai/apps/api
source .venv/bin/activate
alembic upgrade head
python -m scripts.seed_data
uvicorn app.main:app --reload --port 8000
```

Keep this terminal open.

#### Step 2: Start Frontend (New Terminal)

```bash
cd /Users/danguyen/loan-ai/apps/web
PORT=3001 npm run dev
```

Keep this terminal open.

### Option 2: Stop Existing Services

```bash
# Find what's using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>

# Find what's using port 5432
lsof -i :5432
# Kill it
kill -9 <PID>

# Then run the automated script
./start.sh
```

## 📱 Access Your Application

### Using Alternative Ports:
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Test Credentials:
```
Email: test@example.com
Password: test123456
```

OR

```
Email: admin@loanai.vn
Password: admin123456
```

## 🎯 Quick Test

Once both servers are running:

1. Open http://localhost:3001 (or 3000 if you stopped the conflicting service)
2. Click "Apply for Loan"
3. Fill out the 5-step form:
   - Your information
   - Loan details (try: 500,000,000 VND for 180 months)
   - Add income source (try: 30,000,000 VND/month salary)
   - Add any debts (optional)
   - Add collateral (try: Condo worth 800,000,000 VND)
4. Submit and view your personalized recommendations!

## 📊 What You'll See

**Recommendations Page** will show:
- Top 5 matching loan products ranked by fit score
- Detailed cost estimates (monthly payment, total costs)
- Approval predictions (HIGH/MEDIUM/LOW)
- Why each product fits your profile
- Risk considerations
- Products that don't match (with reasons why)

## 🛑 To Stop

```bash
# Stop backend: Ctrl+C in backend terminal
# Stop frontend: Ctrl+C in frontend terminal
```

## 🐛 Troubleshooting

### Backend won't start

```bash
cd /Users/danguyen/loan-ai/apps/api
source .venv/bin/activate
pip install -r requirements.txt
```

### Frontend won't start

```bash
cd /Users/danguyen/loan-ai/apps/web
rm -rf node_modules .next
npm install
```

### Database connection error

Check your existing PostgreSQL:
```bash
psql -U loan -d loan_ai -h localhost
# Password: loan
```

If it doesn't exist, create it:
```sql
CREATE USER loan WITH PASSWORD 'loan';
CREATE DATABASE loan_ai OWNER loan;
\q
```

## 📖 Full Documentation

See `STARTUP.md` for comprehensive documentation including:
- Docker setup
- Database management
- Architecture overview
- Advanced configuration

---

**Ready to go!** Start the servers and explore the application. 🎉
