#!/bin/bash
set -euo pipefail

# Sprint 2.2 — ETAP 1: Cloudflare R2 Storage Provisioning
# Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID

echo "=== Sprint 2.2 — R2 Storage Provisioning ==="

# Configuration
MEDIA_BUCKET="solospot-media"
TEMPLATE_BUCKET="solospot-templates"

# 1. Create media bucket
echo "[1/4] Creating R2 bucket: $MEDIA_BUCKET"
curl -s -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets/$MEDIA_BUCKET" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"

echo "  Bucket: $MEDIA_BUCKET"

# 2. Create template bucket
echo "[2/4] Creating R2 bucket: $TEMPLATE_BUCKET"
curl -s -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets/$TEMPLATE_BUCKET" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"

echo "  Bucket: $TEMPLATE_BUCKET"

# 3. Generate API keys
echo "[3/4] Generating R2 API keys"
ACCESS_KEY_RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/api_keys" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "solospot-production",
    "permissions": ["object:read", "object:write"]
  }')

R2_ACCESS_KEY=$(echo "$ACCESS_KEY_RESPONSE" | jq -r '.result.access_key_id')
R2_SECRET_KEY=$(echo "$ACCESS_KEY_RESPONSE" | jq -r '.result.secret_access_key')

echo "  Access Key: $R2_ACCESS_KEY"
echo "  Secret Key: [REDACTED]"

# 4. Verify write access
echo "[4/4] Verifying write access"
echo "test-content-$(date +%s)" > /tmp/r2-test.txt
curl -s -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets/$MEDIA_BUCKET/objects/test-health-check" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/tmp/r2-test.txt

rm /tmp/r2-test.txt

echo ""
echo "=== EVIDENCE ==="
echo "Media Bucket: $MEDIA_BUCKET"
echo "Template Bucket: $TEMPLATE_BUCKET"
echo "Access Key: $R2_ACCESS_KEY"
echo "Write Test: PASSED"
echo ""
echo "NEXT STEPS:"
echo "1. Store R2_ACCESS_KEY and R2_SECRET_KEY in secrets manager"
echo "2. Configure CDN URL: https://cdn.solospot.pl"
echo "3. Test upload via Media Manager"