#!/bin/bash
# DORA Compliance Checker - Deployment Script
# Usage: ./deploy.sh [dev|live]

set -e

show_usage() {
    echo "Usage: ./deploy.sh [dev|live]"
    echo ""
    echo "Environments:"
    echo "  dev   - Deploy to dev.doraaudit.eu (37.60.225.35)"
    echo "  live  - Deploy to doraaudit.eu (37.60.249.84)"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh dev    # Deploy to DEV"
    echo "  ./deploy.sh live   # Deploy to LIVE (requires confirmation)"
}

if [ -z "$1" ]; then
    show_usage
    exit 1
fi

ENV=$1

case $ENV in
    dev)
        SERVER="root@37.60.225.35"
        URL="https://dev.doraaudit.eu"
        LABEL="DEV"
        CONFIRM=false
        ;;
    live)
        SERVER="root@37.60.249.84"
        URL="https://doraaudit.eu"
        LABEL="LIVE"
        CONFIRM=true
        ;;
    *)
        echo "ERROR: Unknown environment '$ENV'"
        show_usage
        exit 1
        ;;
esac

PROJECT_DIR="/root/dora-compliance-checker"

echo "=========================================="
echo "  DORA $LABEL Deployment"
echo "  Target: $URL"
echo "=========================================="

if [ "$CONFIRM" = true ]; then
    echo ""
    echo "  WARNING: This deploys to PRODUCTION!"
    echo ""
    read -p "Are you sure? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Aborted."
        exit 0
    fi
fi

# Check SSH connection
echo ""
echo "[1/5] Checking SSH connection..."
ssh -o ConnectTimeout=5 $SERVER "echo 'SSH OK'" || { echo "ERROR: Cannot connect to $LABEL server"; exit 1; }

# Pull latest code
echo ""
echo "[2/5] Pulling latest code from git..."
ssh $SERVER "cd $PROJECT_DIR && git fetch origin && git reset --hard origin/master"

# Rebuild and restart containers
echo ""
echo "[3/5] Rebuilding Docker containers..."
ssh $SERVER "cd $PROJECT_DIR && docker compose down && docker compose up -d --build"

# Wait for services to be healthy
echo ""
echo "[4/5] Waiting for services to be healthy..."
sleep 10

# Check health
echo ""
echo "[5/5] Checking service health..."
ssh $SERVER "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Test API
echo ""
echo "Testing API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/regulations")
if [ "$HTTP_CODE" = "200" ]; then
    echo "API OK (HTTP $HTTP_CODE)"
else
    echo "WARNING: API returned HTTP $HTTP_CODE"
fi

echo ""
echo "=========================================="
echo "  $LABEL Deployment complete!"
echo "  URL: $URL"
echo "=========================================="
