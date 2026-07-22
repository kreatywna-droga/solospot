#!/bin/bash
set -euo pipefail

# verify-production.sh
# Post-deployment verification for SoloSpot production
# Usage: ./scripts/verify-production.sh

APP_URL="${APP_URL:-https://api.solospot.pl}"
FAILED=0

echo "=== SoloSpot Production Verification ==="
echo "Target: $APP_URL"
echo ""

# 1. Health check
echo "[1/6] Application health check"
HEALTH=$(curl -sf "$APP_URL/api/health" || echo "FAILED")
if [ "$HEALTH" = "FAILED" ]; then
  echo "  ❌ /api/health failed"
  FAILED=1
else
  echo "  ✅ /api/health OK"
fi

# 2. Database connectivity
echo "[2/6] Database connectivity"
DB_HEALTH=$(curl -sf "$APP_URL/api/health/db" || echo "FAILED")
if [ "$DB_HEALTH" = "FAILED" ]; then
  echo "  ❌ /api/health/db failed"
  FAILED=1
else
  echo "  ✅ /api/health/db OK"
fi

# 3. Storage connectivity
echo "[3/6] Storage connectivity"
STORAGE_HEALTH=$(curl -sf "$APP_URL/api/health/storage" || echo "FAILED")
if [ "$STORAGE_HEALTH" = "FAILED" ]; then
  echo "  ❌ /api/health/storage failed"
  FAILED=1
else
  echo "  ✅ /api/health/storage OK"
fi

# 4. Environment config
echo "[4/6] Environment configuration"
ENV_CHECK=$(curl -sf "$APP_URL/api/health/config" || echo "FAILED")
if [ "$ENV_CHECK" = "FAILED" ]; then
  echo "  ❌ /api/health/config failed"
  FAILED=1
else
  echo "  ✅ /api/health/config OK"
fi

# 5. Basic API endpoints
echo "[5/6] Basic API endpoints"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/v1/status" || echo "000")
if [ "$API_STATUS" = "200" ]; then
  echo "  ✅ API responding (HTTP $API_STATUS)"
else
  echo "  ❌ API failed (HTTP $API_STATUS)"
  FAILED=1
fi

# 6. Storage read/write test
echo "[6/6] Storage read/write test"
TEST_KEY="health-check-$(date +%s)"
TEST_VALUE="solospot-health-check-$(date +%s)"
WRITE_RESULT=$(curl -sf -X POST "$APP_URL/api/health/storage-test" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"$TEST_KEY\",\"value\":\"$TEST_VALUE\"}" || echo "FAILED")
if [ "$WRITE_RESULT" = "FAILED" ]; then
  echo "  ❌ Storage write failed"
  FAILED=1
else
  echo "  ✅ Storage read/write OK"
fi

echo ""
echo "=== VERIFICATION SUMMARY ==="
if [ $FAILED -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED"
  echo "Platform is ready for smoke test."
  exit 0
else
  echo "❌ VERIFICATION FAILED"
  echo "Check logs and retry."
  exit 1
fi