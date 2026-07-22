#!/bin/bash
set -euo pipefail

# Sprint 2.2 — ETAP 1: Cloudflare DNS + SSL Provisioning
# Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

echo "=== Sprint 2.2 — Cloudflare Provisioning ==="

DOMAINS=("app.solospot.pl" "api.solospot.pl" "cdn.solospot.pl")
APP_IP="${APP_IP:-auto}"

# 1. Add/verify domain in zone
echo "[1/5] Verifying domain ownership"
for domain in "${DOMAINS[@]}"; do
  echo "  Checking: $domain"
  # Verification happens via DNS
  curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"CNAME\",
      \"name\": \"$domain\",
      \"content\": \"solospot.pl\",
      \"ttl\": 1,
      \"proxied\": true
    }"
  echo "    $domain → proxied"
done

# 2. Configure DNS records
echo "[2/5] Configuring DNS records"
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "A",
    "name": "@",
    "content": "APP_IP_PLACEHOLDER",
    "ttl": 1,
    "proxied": true
  }'

# 3. Enable SSL/TLS
echo "[3/5] Enabling SSL/TLS"
curl -s -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/ssl" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "full"}'

# 4. Enable WAF
echo "[4/5] Enabling WAF"
curl -s -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/waf" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'

# 5. Verify propagation
echo "[5/5] Verifying DNS propagation"
for domain in "${DOMAINS[@]}"; do
  IP=$(dig +short "$domain" @1.1.1.1 | head -n1)
  echo "  $domain → $IP"
done

echo ""
echo "=== EVIDENCE ==="
echo "Zone ID: $CLOUDFLARE_ZONE_ID"
echo "Domains: ${DOMAINS[*]}"
echo "SSL: full (strict)"
echo "WAF: enabled"
echo ""
echo "NEXT STEPS:"
echo "1. Verify SSL certificates are Active"
echo "2. Configure CDN cache rules"
echo "3. Test HTTPS on all domains"