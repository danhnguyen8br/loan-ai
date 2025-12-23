#!/bin/bash

# LoanAI Application Startup Script
# This script starts the complete application stack

set -e

echo "================================================"
echo "   LoanAI Application Startup"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and run this script again${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Start PostgreSQL database
echo "Starting PostgreSQL database..."
cd /Users/danguyen/loan-ai
docker compose -f infra/docker/docker-compose.yml up -d
echo -e "${GREEN}✓ PostgreSQL started${NC}"
echo ""

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5
echo -e "${GREEN}✓ Database is ready${NC}"
echo ""

# Backend setup
echo "Setting up backend..."
cd /Users/danguyen/loan-ai/apps/api

# Activate virtual environment
source .venv/bin/activate

# Run migrations
echo "Running database migrations..."
alembic upgrade head
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

# Check if database is already seeded
echo "Checking if database needs seeding..."
PRODUCT_COUNT=$(psql postgresql://loan:loan@localhost:5432/loan_ai -t -c "SELECT COUNT(*) FROM loan_products;" 2>/dev/null || echo "0")

if [ "$PRODUCT_COUNT" -eq "0" ]; then
    echo "Seeding database with sample data..."
    python -m scripts.seed_data
    echo -e "${GREEN}✓ Database seeded${NC}"
else
    echo -e "${YELLOW}ℹ Database already contains data (${PRODUCT_COUNT} products)${NC}"
    echo -e "${YELLOW}  Skip seeding to preserve existing data${NC}"
fi
echo ""

# Start backend server in background
echo "Starting backend API server..."
uvicorn app.main:app --reload --port 8000 > /tmp/loan-ai-backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
echo -e "  Logs: tail -f /tmp/loan-ai-backend.log"
echo ""

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 5

# Test backend health
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Backend might still be starting up${NC}"
fi
echo ""

# Start frontend server in background
echo "Starting frontend development server..."
cd /Users/danguyen/loan-ai/apps/web
npm run dev > /tmp/loan-ai-frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"
echo -e "  Logs: tail -f /tmp/loan-ai-frontend.log"
echo ""

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
sleep 8

echo "================================================"
echo -e "${GREEN}   ✓ LoanAI Application Started Successfully!${NC}"
echo "================================================"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "👤 Test Credentials:"
echo "   Email:    test@example.com"
echo "   Password: test123456"
echo ""
echo "   OR"
echo ""
echo "   Email:    admin@loanai.vn"
echo "   Password: admin123456"
echo ""
echo "📊 Database Info:"
echo "   Host:     localhost:5432"
echo "   Database: loan_ai"
echo "   User:     loan"
echo "   Password: loan"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/loan-ai-backend.log"
echo "   Frontend: tail -f /tmp/loan-ai-frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "   ./stop.sh"
echo "   (or kill processes: $BACKEND_PID, $FRONTEND_PID)"
echo ""
echo "================================================"
echo ""

# Save PIDs for stop script
echo "$BACKEND_PID" > /tmp/loan-ai-backend.pid
echo "$FRONTEND_PID" > /tmp/loan-ai-frontend.pid

echo "Press Ctrl+C to view logs (servers will continue running)"
echo ""

# Wait and show logs
sleep 2
echo "Showing combined logs (Ctrl+C to exit, servers will keep running):"
echo ""
tail -f /tmp/loan-ai-backend.log /tmp/loan-ai-frontend.log
