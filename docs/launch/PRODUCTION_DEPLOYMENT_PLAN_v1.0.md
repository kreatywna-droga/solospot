# Production Deployment Plan v1.0

**Platform:** WEB FACTOR  
**Version:** v1.0 RC  
**Date:** 2026-07-20  
**Status:** READY FOR IMPLEMENTATION

---

## 1. Objective

Answer: **Can WEB FACTOR run 24/7 for a real customer?**

This document defines the production infrastructure, deployment procedure, and operational requirements for WEB FACTOR v1.0.

---

## 2. Application Hosting

### 2.1 Next.js Runtime

| Component | Requirement | Decision |
|-----------|-------------|----------|
| Runtime | Node.js 20+ | AWS ECS / VPS |
| Build | Next.js standalone | Docker |
| Process | PM2 / Docker | Docker |
| Port | 3000 | Internal only |
| Domains | Custom + platform | Cloudflare |

### 2.2 Deployment Strategy

**Recommended:** Docker containers on AWS ECS or self-hosted VPS

| Aspect | Configuration |
|--------|---------------|
| Build | `next build` → standalone output |
| Image | Node 20 Alpine |
| Health Check | `/api/health` |
| Graceful Shutdown | SIGTERM handling |
| Rollback | Previous image tag |
| Scaling | Horizontal (min 2 instances) |

---

## 3. Database Production

### 3.1 Supabase/Postgres

| Aspect | Requirement |
|--------|-------------|
| Provider | Supabase Pro or self-hosted |
| Connection Pooling | PgBouncer (required) |
| RLS | Enabled on all tenant tables |
| Backups | Automated daily + PITR |
| Migration | `npm run db:migrate` |

### 3.2 Required Tables

- `organizations`
- `workspaces`
- `tenants`
- `users`
- `subscriptions`
- `invoices`
- `domains`
- `notifications`
- `workflows`
- `marketplace_*`
- `commerce_*`
- `audit_logs`

---

## 4. Storage

### 4.1 Media Manager

| Requirement | Solution |
|-------------|----------|
| Provider | S3 / Cloudflare R2 |
| CDN | Cloudflare |
| Cache | Browser + CDN |
| Limits | Per-plan quotas |
| Lifecycle | Glacier after 90 days |

### 4.2 Template Assets

| Requirement | Solution |
|-------------|----------|
| Provider | S3 / R2 |
| CDN | Cloudflare |
| Cache | Immutable (1 year) |
| Compression | Brotli |

---

## 5. External Services Matrix

See `EXTERNAL_SERVICES_MATRIX.md` for full details.

| Service | Purpose | Provider | Fallback |
|---------|---------|----------|----------|
| Payments | Billing | Stripe | Manual invoicing |
| Email | Notifications | Resend / SendGrid | Queue retry |
| DNS | Domains | Cloudflare | Manual config |
| SSL | Domains | Let's Encrypt | Self-signed (dev) |
| AI | Content generation | OpenAI / Anthropic | Disabled |
| Monitoring | Observability | Self-hosted / SaaS | Logs only |

---

## 6. Security Checklist

### Pre-Launch

- [ ] All secrets in vault (not repo)
- [ ] Production API keys rotated
- [ ] HTTPS enforced (HSTS)
- [ ] CSP headers configured
- [ ] Rate limiting active
- [ ] RBAC verified
- [ ] Tenant isolation tested
- [ ] Audit logging enabled

### Ongoing

- [ ] Weekly security scans
- [ ] Monthly dependency audit
- [ ] Quarterly penetration test
- [ ] Annual security review

---

## 7. Monitoring Production

### 7.1 Error Tracking

- **Tool:** Sentry / self-hosted
- **Coverage:** Client + Server
- **Alerts:** PagerDuty / Discord webhook

### 7.2 Uptime Monitoring

- **Tool:** UptimeRobot / Better Uptime
- **Frequency:** 1 minute
- **Endpoints:** `/api/health`, `/api/status`

### 7.3 Logs

- **Tool:** Loki / Datadog
- **Retention:** 30 days
- **Format:** JSON structured

### 7.4 Metrics

- **Tool:** Prometheus + Grafana
- **Key Metrics:** CPU, Memory, Requests, Errors, Queue depth

---

## 8. Deployment Procedure

### 8.1 Prerequisites

```bash
# Environment variables
NODE_ENV=production
DATABASE_URL=postgres://...
NEXT_PUBLIC_API_URL=https://api.webfactor.io
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
```

### 8.2 Steps

1. Build Docker image
2. Run database migrations
3. Deploy to staging
4. Run smoke tests
5. Promote to production
6. Verify health checks
7. Monitor metrics

### 8.3 Rollback

1. Identify previous stable version
2. Deploy previous image
3. Verify health checks
4. Notify team

---

## 9. Launch Checklist

### Day 1: Infrastructure

- [ ] Production database provisioned
- [ ] Storage buckets created
- [ ] CDN configured
- [ ] SSL certificates issued
- [ ] DNS records propagated

### Day 2: Application

- [ ] Application deployed
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Logs flowing
- [ ] Alerts configured

### Day 3: External Services

- [ ] Stripe webhooks configured
- [ ] Email provider active
- [ ] DNS provider linked
- [ ] AI provider connected

### Day 4: First Tenant

- [ ] Create test tenant
- [ ] Create test store
- [ ] Test full Golden Flow
- [ ] Verify notifications
- [ ] Verify billing

---

## 10. Success Criteria

| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| P95 Latency | < 200ms |
| Error Rate | < 0.1% |
| Deployment Frequency | Daily |
| Rollback Time | < 5 minutes |

---

## 11. Next Steps

1. Create `EXTERNAL_SERVICES_MATRIX.md`
2. Provision production infrastructure
3. Configure CI/CD pipeline
4. Run deployment drill
5. Onboard first demo tenant

---

**Status:** READY FOR REVIEW  
**Owner:** Platform Team  
**Target:** Production Launch Q3 2026
