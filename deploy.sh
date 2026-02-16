#!/bin/bash
set -e
SERVER="root@37.60.249.84"
echo "🚀 Deploying DoraAudit..."
git add -A && git commit -m "deploy: $(date +%Y-%m-%d_%H:%M)" --allow-empty
git push origin master
ssh -o StrictHostKeyChecking=no $SERVER << 'EOF'
cd /root/dora-compliance-checker
git pull origin master
docker compose build backend frontend --no-cache
docker compose up -d --force-recreate backend frontend
echo "✅ Deploy done!"
sleep 10
curl -s -o /dev/null -w "Health: %{http_code}\n" https://doraaudit.eu
EOF
echo "✅ DoraAudit deployed!"
