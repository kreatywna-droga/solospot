# External Services Matrix v1.0

**Platform:** WEB FACTOR  
**Version:** v1.0 RC  
**Date:** 2026-07-20  

---

## 1. Payment Processing

| Property | Value |
|----------|-------|
| Service | Stripe |
| Purpose | Subscriptions, one-time payments |
| Webhooks | `payment_intent.succeeded`, `invoice.paid`, `customer.subscription.updated` |
| Fallback | Manual invoicing via email |
| Environment | Live keys in production, test keys in staging |

### Required Setup

- [ ] Stripe account created
- [ ] Webhook endpoints configured
- [ ] Product catalog created
- [ ] Price IDs configured
- [ ] Tax settings enabled

---

## 2. Email Delivery

| Property | Value |
|----------|-------|
| Service | Resend / SendGrid |
| Purpose | Notifications, billing emails |
| Volume | Up to 100k emails/month |
| Fallback | Queue retry (exponential backoff) |

### Required Setup

- [ ] Sender domain verified
- [ ] SPF/DKIM configured
- [ ] Bounce handling enabled
- [ ] Unsubscribe links (if needed)

---

## 3. DNS Management

| Property | Value |
|----------|-------|
| Service | Cloudflare |
| Purpose | Domain management, SSL, CDN |
| Integration | Automated via Domain Manager |
| Fallback | Manual DNS configuration |

### Required Setup

- [ ] Cloudflare account linked
- [ ] API token created
- [ ] Zone configured
- [ ] SSL/TLS mode: Full (strict)

---

## 4. SSL Certificates

| Property | Value |
|----------|-------|
| Service | Let's Encrypt |
| Purpose | Automatic SSL for custom domains |
| Integration | SSL Engine in Domain Manager |
| Fallback | Self-signed for dev environments |

### Required Setup

- [ ] ACME server configured
- [ ] DNS challenge enabled
- [ ] Auto-renewal enabled (80 days)

---

## 5. AI Provider

| Property | Value |
|----------|-------|
| Service | OpenAI / Anthropic |
| Purpose | Content generation, theme suggestions |
| Fallback | Disabled if quota exceeded |
| Rate Limit | Per-organization quotas |

### Required Setup

- [ ] API keys configured
- [ ] Usage limits set
- [ ] Fallback behavior defined

---

## 6. Monitoring

| Property | Value |
|----------|-------|
| Uptime | Better Uptime / UptimeRobot |
| Errors | Sentry |
| Metrics | Prometheus + Grafana |
| Logs | Loki / Datadog |

### Required Setup

- [ ] Uptime monitors created
- [ ] Sentry DSN configured
- [ ] Dashboards created
- [ ] Alerts configured

---

## 7. CDN

| Property | Value |
|----------|-------|
| Service | Cloudflare |
| Purpose | Static assets, template assets, media |
| Cache | Browser + edge |
| Fallback | Direct S3 access |

### Required Setup

- [ ] Zone created
- [ ] CNAME records configured
- [ ] Cache rules defined
- [ ] WAF enabled (optional)

---

## 8. Backup

| Property | Value |
|----------|-------|
| Database | Supabase PITR / pg_dump |
| Storage | S3 versioning + Glacier |
| Retention | 30 days |

### Required Setup

- [ ] Automated backups enabled
- [ ] Restore tested
- [ ] Backup monitoring active

---

## 9. Contact & Support

| Role | Contact |
|------|---------|
| Platform Lead | TBD |
| DevOps | TBD |
| Security | TBD |
| Stripe Support | dashboard.stripe.com |
| Resend Support | dashboard.resend.com |

---

**Status:** READY FOR IMPLEMENTATION  
**Last Updated:** 2026-07-20
