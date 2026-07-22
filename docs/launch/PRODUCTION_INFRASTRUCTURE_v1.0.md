# Production Infrastructure v1.0

**Platform:** WEB FACTOR  
**Version:** v1.0 RC  
**Sprint:** 2  
**Date:** 2026-07-20  
**Status:** READY FOR IMPLEMENTATION

---

## 1. Application Layer

### 1.1 Next.js Runtime

| Property | Value |
|----------|-------|
| Runtime | Node.js 20 LTS |
| Build | Next.js standalone |
| Output | `.next/standalone` |
| Process | Docker container |
| Port | 3000 (internal only) |
| Health Check | `/api/health` (returns 200 OK) |

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CDN / Cloudflare                          │
│                   Static assets + cache                      │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
│                    Health checks                             │
└─────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
┌─────────────────────┐             ┌─────────────────────┐
│  Next.js Instance 1 │             │  Next.js Instance 2 │
│  Port 3000          │             │  Port 3000          │
│  API + SSR          │             │  API + SSR          │
└─────────────────────┘             └─────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Worker Processes (if needed)                   │
│  - Publish Worker                                           │
│  - Notification Worker                                      │
│  - AI Worker                                                │
│  - Billing Worker                                           │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Supabase)                    │
│              Connection Pool + RLS                          │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storage (S3 / R2)                        │
│              Media + Templates + Assets                     │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Scaling Model

| Tier | Instances | CPU | Memory | Use Case |
|------|-----------|-----|--------|----------|
| Minimum | 2 | 1vCPU | 1GB | Production baseline |
| Standard | 4 | 2vCPU | 2GB | Normal traffic |
| Peak | 8 | 2vCPU | 2GB | Marketing campaigns |
| Burst | 16 | 2vCPU | 2GB | Flash sales / launches |

**Region:** EU (Frankfurt or Warsaw) for GDPR compliance

---

## 2. Database Production Setup

### 2.1 Supabase/Postgres Configuration

```yaml
# Production requirements
project:
  name: webfactor-production
  region: eu-central-1
  
database:
  version: "15"
  size: 8 CPU / 32GB RAM
  storage: 500GB SSD
  connection_limit: 100
  
pg_cron:
  enabled: true
  
backup:
  enabled: true
  retention: 30 days
  pitr: true
  
pooling:
  enabled: true
  max_connections: 20
  pool_mode: transaction
```

### 2.2 Required Tables (C1-C14)

| Domain | Tables |
|--------|--------|
| Platform Identity | organizations, workspaces, tenants, users |
| Platform Services | subscriptions, invoices, domains, notifications |
| Commerce | products, carts, orders, payments |
| Marketplace | templates, packages, installations |
| Builder | builder_documents, drafts |
| Media | media_documents, assets |
| Workflow | workflows, executions |
| Security | audit_logs, api_keys |

### 2.3 RLS Verification

```sql
-- Verify tenant isolation
CREATE POLICY tenant_isolation ON organizations
  USING (id = current_setting('app.current_tenant_id')::uuid);

-- Verify all tenant tables
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### 2.4 Migration Strategy

```bash
# Production migration
npm run db:migrate:prod

# Rollback
npm run db:migrate:rollback
```

---

## 3. Storage Production

### 3.1 Provider Configuration

| Requirement | S3 | Cloudflare R2 |
|-------------|-----|---------------|
| Provider | AWS S3 | Cloudflare R2 |
| Region | eu-central-1 | Auto |
| CDN | CloudFront | Cloudflare |
| Cache | Browser + CDN | Browser + CDN |
| Limits | Per-plan quotas | Per-plan quotas |

### 3.2 Bucket Structure

```
webfactor-media/
  └── tenants/
      └── {tenant_id}/
          ├── uploads/
          ├── processed/
          └── temp/

webfactor-templates/
  └── {template_id}/
      ├── assets/
      ├── previews/
      └── manifests/

webfactor-system/
  ├── backups/
  └── exports/
```

### 3.3 Lifecycle Policies

| Path | Lifecycle |
|------|-----------|
| `/temp/` | Delete after 7 days |
| `/uploads/` | Archive to Glacier after 90 days |
| `/processed/` | Keep indefinitely |
| `/backups/` | Delete after 30 days |

---

## 4. Environment Configuration

### 4.1 .env.production

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.webfactor.io
NEXT_PUBLIC_APP_URL=https://app.webfactor.io

# Database
DATABASE_URL=postgres://user:pass@host:5432/webfactor
DATABASE_POOL_SIZE=20

# Storage
STORAGE_PROVIDER=s3
S3_BUCKET=webfactor-media
S3_REGION=eu-central-1
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=...

# CDN
CDN_URL=https://cdn.webfactor.io

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PK=pk_live_...

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@webfactor.io

# DNS
DNS_PROVIDER=cloudflare
CLOUDFLARE_API_TOKEN=...

# AI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
AI_RATE_LIMIT=1000

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=info

# Security
ENCRYPTION_KEY=base64:...
SESSION_SECRET=...
```

### 4.2 Secret Management

**Rule: No secrets in repository**

```bash
# .env.production is gitignored
echo ".env.production" >> .gitignore

# Secrets injected at deploy time
# - Docker secrets
# - Kubernetes secrets
# - Vault (optional)
```

---

## 5. CI/CD Pipeline

### 5.1 Pipeline Stages

```yaml
stages:
  - lint
  - test
  - build
  - migrate
  - deploy-staging
  - smoke-test
  - deploy-production
  - health-check
```

### 5.2 Pipeline Flow

```
Git Push (main)
    ↓
Lint + TypeScript
    ↓
Unit Tests (819+)
    ↓
Build Docker Image
    ↓
Push to Registry
    ↓
Deploy to Staging
    ↓
Smoke Tests
    ↓
Manual Approval
    ↓
Deploy to Production
    ↓
Health Check
    ↓
Monitoring Active
```

### 5.3 Rollback Procedure

```bash
# Automatic rollback triggers
- Health check failure
- Error rate > 1%
- Latency P95 > 500ms

# Manual rollback
kubectl rollout undo deployment/webfactor
# or
docker-compose rollback
```

---

## 6. Production Smoke Test

### 6.1 Golden Flow Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create account | User created, email sent |
| 2 | Create organization | Organization created |
| 3 | Create tenant | Tenant provisioned |
| 4 | Choose plan | Subscription active |
| 5 | Create store | Store created |
| 6 | Choose template | Template installed |
| 7 | Open builder | Builder loads |
| 8 | Upload image | Image processed |
| 9 | Add product | Product in catalog |
| 10 | Publish | Store live |
| 11 | Open domain | HTTPS, store visible |

### 6.2 Health Checks

```bash
# Application
curl https://api.webfactor.io/api/health

# Database
curl https://api.webfactor.io/api/health/db

# Storage
curl https://api.webfactor.io/api/health/storage

# External services
curl https://api.webfactor.io/api/health/external
```

### 6.3 Monitoring Validation

| Check | Tool | Alert Threshold |
|-------|------|-----------------|
| Uptime | Better Uptime | < 99.9% |
| Response Time | Prometheus | P95 > 500ms |
| Error Rate | Sentry | > 0.1% |
| Queue Depth | Grafana | > 1000 |
| Disk Usage | Prometheus | > 80% |

---

## 7. Deployment Checklist

### Pre-Deployment

- [ ] Database migrations tested
- [ ] Secrets rotated
- [ ] SSL certificates valid
- [ ] CDN cache purged
- [ ] Monitoring configured
- [ ] Alerts tested

### Deployment

- [ ] Build successful
- [ ] Tests passing
- [ ] Image pushed
- [ ] Staging deployed
- [ ] Smoke tests passed
- [ ] Production deployed
- [ ] Health checks passing

### Post-Deployment

- [ ] Logs flowing
- [ ] Metrics updating
- [ ] Alerts silent
- [ ] No error spikes
- [ ] Performance baseline met

---

## 8. Sprint 2 Acceptance Criteria

Sprint is complete when:

- [ ] Production application running
- [ ] Production database operational
- [ ] Storage operational
- [ ] Payment test transactions work
- [ ] Monitoring active
- [ ] First demo store can be created
- [ ] Full Golden Flow passes in production

---

## 9. Next Steps

After Sprint 2:

1. **Sprint 3:** First Demo Store (template + content)
2. **Sprint 4:** Template Marketplace v1
3. **Sprint 5:** Closed Beta (invite-only)

---

**Status:** READY FOR IMPLEMENTATION  
**Target Completion:** 2026-07-27  
**Owner:** Platform Team
