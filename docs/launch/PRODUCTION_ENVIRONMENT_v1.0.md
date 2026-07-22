# Production Environment v1.0

**Platform:** WEB FACTOR  
**Version:** v1.0 RC  
**Sprint:** 2.1  
**Date:** 2026-07-20  
**Status:** SPECIFICATION

---

## 1. Runtime Infrastructure

### 1.1 Application Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  Next.js 14+ (App Router)                                   │
│  - SSR / SSG / ISR                                         │
│  - Edge Functions                                          │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  Next.js API Routes                                        │
│  - REST endpoints                                          │
│  - WebSocket (real-time)                                   │
│  - File uploads                                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Runtime Services                          │
│  - Template Runtime                                        │
│  - Component Runtime                                       │
│  - Theme Runtime                                           │
│  - Asset Processing                                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                               │
│  PostgreSQL (Supabase)                                      │
│  - Multi-tenant RLS                                        │
│  - Connection Pooling                                      │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       Storage                               │
│  S3 / Cloudflare R2                                        │
│  - Media assets                                            │
│  - Template packages                                       │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Providers                        │
│  - Stripe (Payments)                                       │
│  - Resend/SendGrid (Email)                                 │
│  - Cloudflare (DNS/CDN)                                    │
│  - OpenAI/Anthropic (AI)                                   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Hosting Decision

| Component | Provider | Reasoning |
|-----------|----------|-----------|
| Application | AWS ECS / Docker | Full control, scalable |
| Database | Supabase Pro | Managed Postgres, RLS built-in |
| Storage | Cloudflare R2 | Zero egress fees, global CDN |
| CDN | Cloudflare | DNS + CDN + WAF in one |
| Email | Resend | Modern API, good deliverability |
| Payments | Stripe | Industry standard |
| AI | OpenAI | Best quality, reliable API |

### 1.3 Region & Compliance

| Requirement | Decision |
|-------------|----------|
| Primary Region | EU (eu-central-1) |
| GDPR Compliance | Yes |
| Data Residency | EU only |
| Backup Region | EU (backup) |

### 1.4 Runtime Configuration

| Property | Value |
|----------|-------|
| Node.js Version | 20 LTS |
| Next.js Output | Standalone |
| Process Manager | Docker / ECS |
| Instances (min) | 2 |
| Instances (max) | 8 |
| Auto-scaling | CPU > 70% |
| Health Check | `/api/health` every 30s |

---

## 2. Production Database

### 2.1 Supabase Production Configuration

```yaml
project:
  name: webfactor-production
  region: eu-central-1
  plan: Pro
  
database:
  version: "15"
  instance_size: 8 CPU / 32GB RAM
  storage: 500GB SSD
  connection_limit: 100
  
pg_cron:
  enabled: true
  
backup:
  enabled: true
  retention_days: 30
  pitr_enabled: true
  
pooling:
  enabled: true
  max_connections: 20
  pool_mode: transaction
```

### 2.2 Tenant Isolation Verification

**Test Case 1: Tenant A isolation**
```sql
-- Set tenant context
SET app.current_tenant_id = 'tenant-a-uuid';

-- Query should return only Tenant A data
SELECT * FROM stores WHERE tenant_id = 'tenant-a-uuid';
-- Result: Only Tenant A stores
```

**Test Case 2: Tenant B isolation**
```sql
-- Set tenant context
SET app.current_tenant_id = 'tenant-b-uuid';

-- Query should return only Tenant B data
SELECT * FROM stores WHERE tenant_id = 'tenant-b-uuid';
-- Result: Only Tenant B stores
```

**Test Case 3: Cross-tenant access blocked**
```sql
-- Tenant A tries to access Tenant B data
SET app.current_tenant_id = 'tenant-a-uuid';
SELECT * FROM stores WHERE tenant_id = 'tenant-b-uuid';
-- Result: Empty (RLS blocked)
```

### 2.3 Required Tables by Domain

| Domain | Tables |
|--------|--------|
| Platform Identity | `organizations`, `workspaces`, `tenants`, `users` |
| Billing | `subscriptions`, `invoices`, `payments` |
| Domains | `domains`, `dns_records`, `ssl_certificates` |
| Notifications | `notifications`, `notification_templates`, `delivery_attempts` |
| Workflow | `workflows`, `workflow_versions`, `executions`, `execution_logs` |
| Commerce | `products`, `carts`, `orders`, `order_items`, `payments` |
| Marketplace | `templates`, `packages`, `installations` |
| Builder | `builder_documents`, `drafts` |
| Media | `media_documents`, `assets` |
| Security | `audit_logs`, `api_keys`, `feature_flags` |

---

## 3. Storage Architecture

### 3.1 Provider: Cloudflare R2

| Property | Value |
|----------|-------|
| Provider | Cloudflare R2 |
| CDN | Cloudflare |
| Regions | Global (edge) |
| Egress | Free (within Cloudflare) |

### 3.2 Bucket Structure

```
webfactor-media/
  └── tenants/
      └── {tenant_id}/
          ├── uploads/          # Original uploads
          ├── processed/        # Transformed assets
          └── temp/             # Temporary files (7d TTL)

webfactor-templates/
  └── {template_id}/
      ├── assets/              # Template assets
      ├── previews/            # Preview images
      └── manifests/           # Package manifests

webfactor-system/
  ├── backups/                 # Database backups
  └── exports/                 # Data exports
```

### 3.3 Upload Flow

```
User Upload
    ↓
Media Manager (validation)
    ↓
Storage Provider (R2)
    ↓
Processing Pipeline (resize, optimize)
    ↓
CDN (cache)
    ↓
Runtime (serve)
```

### 3.4 Cache Rules

| Asset Type | Cache TTL | Cache Key |
|------------|-----------|-----------|
| Template assets | 1 year | `{template_id}/{path}` |
| Media uploads | 30 days | `{tenant_id}/{hash}` |
| Processed images | 7 days | `{tenant_id}/{width}x{height}/{hash}` |
| Temp files | 0 (no cache) | - |

### 3.5 Limits (Per Plan)

| Plan | Storage | Bandwidth | File Size |
|------|---------|-----------|-----------|
| Free | 1 GB | 10 GB | 5 MB |
| Starter | 10 GB | 100 GB | 20 MB |
| Business | 50 GB | 500 GB | 50 MB |
| Enterprise | Unlimited | Unlimited | 100 MB |

---

## 4. Secrets Management

### 4.1 .env.production.template

```bash
# ============================================
# APPLICATION
# ============================================
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.webfactor.io
NEXT_PUBLIC_APP_URL=https://app.webfactor.io
NEXT_PUBLIC_CDN_URL=https://cdn.webfactor.io

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgres://user:password@host:5432/webfactor
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# ============================================
# STORAGE
# ============================================
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=webfactor-media
CDN_URL=https://cdn.webfactor.io

# ============================================
# PAYMENTS
# ============================================
STRIPE_SECRET_KEY=sk_live_
STRIPE_WEBHOOK_SECRET=whsec_
NEXT_PUBLIC_STRIPE_PK=pk_live_

# ============================================
# EMAIL
# ============================================
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_
EMAIL_FROM=noreply@webfactor.io

# ============================================
# DNS
# ============================================
DNS_PROVIDER=cloudflare
CLOUDFLARE_API_TOKEN=

# ============================================
# AI
# ============================================
AI_PROVIDER=openai
OPENAI_API_KEY=sk-
AI_RATE_LIMIT=1000

# ============================================
# MONITORING
# ============================================
SENTRY_DSN=https://
LOG_LEVEL=info

# ============================================
# SECURITY
# ============================================
ENCRYPTION_KEY=
SESSION_SECRET=
JWT_SECRET=
```

### 4.2 Secret Management Rules

| Rule | Implementation |
|------|----------------|
| No secrets in repo | `.env.production` gitignored |
| Secrets at deploy time | Docker secrets / K8s secrets |
| Rotation | Every 90 days |
| Access | Limited to CI/CD and production |
| Audit | All access logged |

---

## 5. CI/CD Pipeline

### 5.1 Pipeline Definition

```yaml
name: Production Deployment

on:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  build:
    needs: [lint, typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
      - run: docker build -t webfactor:${{ github.sha }} .
      - run: docker push webfactor:${{ github.sha }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: deploy staging webfactor:${{ github.sha }}

  smoke-test:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:smoke

  deploy-production:
    needs: smoke-test
    runs-on: ubuntu-latest
    steps:
      - run: deploy production webfactor:${{ github.sha }}
      - run: curl -f https://api.webfactor.io/api/health

  health-check:
    needs: deploy-production
    runs-on: ubuntu-latest
    steps:
      - run: npm run health:check
```

### 5.2 Pipeline Flow

```
Git Push (main)
    ↓
Lint
    ↓
TypeScript Check
    ↓
Tests (819+)
    ↓
Production Build
    ↓
Docker Image
    ↓
Push to Registry
    ↓
Deploy Staging
    ↓
Smoke Tests
    ↓
Manual Approval
    ↓
Deploy Production
    ↓
Health Check
    ↓
Monitoring Active
```

### 5.3 Rollback Strategy

| Trigger | Action |
|---------|--------|
| Health check failure | Auto-rollback to previous |
| Error rate > 1% | Auto-rollback |
| Manual trigger | Immediate rollback |
| Rollback time target | < 5 minutes |

```bash
# Manual rollback
docker-compose rollback
# or
kubectl rollout undo deployment/webfactor
```

---

## 6. Production Smoke Test

### 6.1 Golden Flow Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create account | User created, verification email sent |
| 2 | Create organization | Organization created |
| 3 | Create tenant | Tenant provisioned with default settings |
| 4 | Choose plan | Subscription active (Stripe test mode) |
| 5 | Create store | Store created with unique slug |
| 6 | Choose template | Template installed from package |
| 7 | Open builder | Builder loads with template content |
| 8 | Upload media | Image processed and stored |
| 9 | Add product | Product in catalog |
| 10 | Configure payment | Stripe connected |
| 11 | Publish | Store live at domain |
| 12 | Verify domain | HTTPS active, store accessible |

### 6.2 Health Check Endpoints

```bash
# Application health
GET https://api.webfactor.io/api/health

# Database health
GET https://api.webfactor.io/api/health/db

# Storage health
GET https://api.webfactor.io/api/health/storage

# External services
GET https://api.webfactor.io/api/health/external
```

### 6.3 Monitoring Validation

| Check | Tool | Alert Threshold |
|-------|------|-----------------|
| Uptime | Better Uptime | < 99.9% |
| Response Time | Prometheus | P95 > 500ms |
| Error Rate | Sentry | > 0.1% |
| Queue Depth | Grafana | > 1000 |
| Disk Usage | Prometheus | > 80% |
| Memory Usage | Prometheus | > 80% |

---

## 7. Environment Configuration

### 7.1 Regions

| Environment | Region | Purpose |
|-------------|--------|---------|
| Production | eu-central-1 | Primary |
| Staging | eu-central-1 | Pre-production |
| Development | local | Local dev |

### 7.2 Domains

| Service | Domain |
|---------|--------|
| Application | https://app.webfactor.io |
| API | https://api.webfactor.io |
| CDN | https://cdn.webfactor.io |
| Docs | https://docs.webfactor.io |
| Developer Portal | https://developers.webfactor.io |

---

## 8. Sprint 2.1 Deliverables

- [x] `PRODUCTION_ENVIRONMENT_v1.0.md` — This document
- [ ] `.env.production.template` — Environment template
- [ ] `docker-compose.production.yml` — Production compose
- [ ] `Dockerfile` — Optimized build
- [ ] `deploy/` directory — Deployment scripts

---

## 9. Next Steps

1. Review and approve this specification
2. Create `.env.production.template`
3. Provision infrastructure (Sprint 2.2)
4. Configure CI/CD pipeline
5. Execute production smoke test

---

**Status:** SPECIFICATION COMPLETE  
**Next:** Sprint 2.2 — Infrastructure Provisioning  
**Owner:** Platform Team  
**Target:** 2026-07-27
