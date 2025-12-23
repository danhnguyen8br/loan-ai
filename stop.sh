#!/bin/bash

# LoanAI Application Stop Script
# This script stops all running services

echo "================================================"
echo "   Stopping LoanAI Application"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop backend server
if [ -f /tmp/loan-ai-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/loan-ai-backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo -e "${GREEN}✓ Backend stopped${NC}"
    else
        echo -e "${YELLOW}Backend not running${NC}"
    fi
    rm /tmp/loan-ai-backend.pid
else
    echo -e "${YELLOW}No backend PID file found${NC}"
fi

# Stop frontend server
if [ -f /tmp/loan-ai-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/loan-ai-frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    else
        echo -e "${YELLOW}Frontend not running${NC}"
    fi
    rm /tmp/loan-ai-frontend.pid
else
    echo -e "${YELLOW}No frontend PID file found${NC}"
fi

# Stop PostgreSQL container
echo "Stopping PostgreSQL database..."
cd /Users/danguyen/loan-ai
docker compose -f infra/docker/docker-compose.yml down
echo -e "${GREEN}✓ Database stopped${NC}"

echo ""
echo "================================================"
echo -e "${GREEN}   ✓ All services stopped${NC}"
echo "================================================"
