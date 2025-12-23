#!/bin/bash
#
# Weekly Cronjob Runner: Pull Mortgage Products and Banks in Vietnam
#
# This script runs the mortgage product sync job.
# Schedule with crontab for weekly execution.
#
# SETUP:
# 1. Make this script executable:
#    chmod +x /path/to/loan-ai/apps/api/scripts/run_mortgage_cron.sh
#
# 2. Add to crontab (run: crontab -e):
#    # Run every Sunday at 2:00 AM
#    0 2 * * 0 /path/to/loan-ai/apps/api/scripts/run_mortgage_cron.sh >> /var/log/loan-ai/mortgage_cron.log 2>&1
#
# 3. Create log directory:
#    sudo mkdir -p /var/log/loan-ai
#    sudo chown $USER:$USER /var/log/loan-ai
#

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$API_DIR")")"

# Log timestamp
echo ""
echo "========================================"
echo "Mortgage Cron Job - $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# Change to API directory
cd "$API_DIR"

# Activate virtual environment if it exists
if [ -f "$PROJECT_ROOT/venv/bin/activate" ]; then
    echo "Activating virtual environment..."
    source "$PROJECT_ROOT/venv/bin/activate"
elif [ -f "$API_DIR/venv/bin/activate" ]; then
    echo "Activating virtual environment..."
    source "$API_DIR/venv/bin/activate"
fi

# Check if DATABASE_URL is set, otherwise use default
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL not set, using default..."
fi

# Run the Python cronjob
echo "Running mortgage products sync..."
python3 -m scripts.cron_pull_mortgage_products

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✓ Cron job completed successfully"
else
    echo "✗ Cron job failed with exit code: $EXIT_CODE"
fi

echo "========================================"
echo ""

exit $EXIT_CODE

