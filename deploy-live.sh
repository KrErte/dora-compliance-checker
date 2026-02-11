#!/bin/bash
# DORA Compliance Checker - LIVE Deployment Script
# Usage: ./deploy-live.sh

set -e

LIVE_SERVER="root@37.60.249.84"
PROJECT_DIR="/root/dora-compliance-checker"

echo "=========================================="
echo "  DORA LIVE Deployment"
echo "  Target: doraaudit.eu (37.60.249.84)"
echo "=========================================="
echo ""
echo "  WARNING: This deploys to PRODUCTION!"
echo ""
read -p "Are you sure? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 0
fi

# Check SSH connection
echo ""
echo "[1/5] Checking SSH connection..."
ssh -o ConnectTimeout=5 $LIVE_SERVER "echo 'SSH OK'" || { echo "ERROR: Cannot connect to LIVE server"; exit 1; }

# Pull latest code
echo ""
echo "[2/5] Pulling latest code from git..."
ssh $LIVE_SERVER "cd $PROJECT_DIR && git fetch origin && git reset --hard origin/master"

# Rebuild and restart containers
echo ""
echo "[3/5] Rebuilding Docker containers..."
ssh $LIVE_SERVER "cd $PROJECT_DIR && docker compose down && docker compose up -d --build"

# Wait for services to be healthy
echo ""
echo "[4/5] Waiting for services to be healthy..."
sleep 10

# Check health
echo ""
echo "[5/5] Checking service health..."
ssh $LIVE_SERVER "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Test API
echo ""
echo "Testing API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://doraaudit.eu/api/regulations)
if [ "$HTTP_CODE" = "200" ]; then
    echo "API OK (HTTP $HTTP_CODE)"
else
    echo "WARNING: API returned HTTP $HTTP_CODE"
fi

echo ""
echo "=========================================="
echo "  Deployment complete!"
echo "  URL: https://doraaudit.eu"
echo "=========================================="
