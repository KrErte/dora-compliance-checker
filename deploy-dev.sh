#!/bin/bash
# DORA Compliance Checker - DEV Deployment Script
# Usage: ./deploy-dev.sh

set -e

DEV_SERVER="root@37.60.225.35"
PROJECT_DIR="/root/dora-compliance-checker"

echo "=========================================="
echo "  DORA DEV Deployment"
echo "  Target: dev.doraaudit.eu (37.60.225.35)"
echo "=========================================="

# Check SSH connection
echo ""
echo "[1/5] Checking SSH connection..."
ssh -o ConnectTimeout=5 $DEV_SERVER "echo 'SSH OK'" || { echo "ERROR: Cannot connect to DEV server"; exit 1; }

# Pull latest code
echo ""
echo "[2/5] Pulling latest code from git..."
ssh $DEV_SERVER "cd $PROJECT_DIR && git fetch origin && git reset --hard origin/master"

# Rebuild and restart containers
echo ""
echo "[3/5] Rebuilding Docker containers..."
ssh $DEV_SERVER "cd $PROJECT_DIR && docker compose down && docker compose up -d --build"

# Wait for services to be healthy
echo ""
echo "[4/5] Waiting for services to be healthy..."
sleep 10

# Check health
echo ""
echo "[5/5] Checking service health..."
ssh $DEV_SERVER "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Test API
echo ""
echo "Testing API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://dev.doraaudit.eu/api/regulations)
if [ "$HTTP_CODE" = "200" ]; then
    echo "API OK (HTTP $HTTP_CODE)"
else
    echo "WARNING: API returned HTTP $HTTP_CODE"
fi

echo ""
echo "=========================================="
echo "  Deployment complete!"
echo "  URL: https://dev.doraaudit.eu"
echo "=========================================="
