# Sprint 2.2 — Infrastructure Provisioning Execution Tracker

**Sprint:** 2.2  
**Status:** 🟡 IN PROGRESS  
**Date:** 2026-07-20  
**Mode:** EXECUTION (not planning)

---

## Execution Status Legend

⬜ Not Started  
🟡 In Progress  
✅ Verified  
❌ Blocked

**Evidence Types:**
- Link to panel/dashboard
- Resource ID
- Screenshot
- CI/CD log
- Command output
- URL

---

## ETAP 1 — Cloud Infrastructure

| # | Task | Owner | Status | Evidence | Provisioned | Verified | Rollback Available |
|---|------|-------|--------|----------|-------------|----------|-------------------|
| 1.1 | Create Supabase production project | Platform | ⬜ | Project ID: | ⬜ | ⬜ | ✅ |
| 1.2 | Configure Supabase connection pooling | Platform | ⬜ | PgBouncer enabled: | ⬜ | ⬜ | ✅ |
| 1.3 | Enable Supabase backups + PITR | Platform | ⬜ | Retention: 30 days | ⬜ | ⬜ | ✅ |
| 1.4 | Create R2 bucket (webfactor-media) | Platform | ⬜ | Bucket name: | ⬜ | ⬜ | ⬜ |
| 1.5 | Create R2 bucket (webfactor-templates) | Platform | ⬜ | Bucket name: | ⬜ | ⬜ | ⬜ |
| 1.6 | Configure Cloudflare account | Platform | ⬜ | Zone ID: | ⬜ | ⬜ | ✅ |
| 1.7 | Add domain webfactor.io to Cloudflare | Platform | ⬜ | Nameservers: | ⬜ | ⬜ | ⬜ |
| 1.8 | Configure DNS records (app, api, cdn) | Platform | ⬜ | A/CNAME records: | ⬜ | ⬜ | ⬜ |
| 1.9 | Issue SSL certificates (Let's Encrypt) | Platform | ⬜ | Cert status: | ⬜ | ⬜ | ⬜ |
| 1.10 | Configure CDN cache rules | Platform | ⬜ | TTL settings: | ⬜ | ⬜ | ✅ |

**Stage Rollback:** All Supabase changes reversible via dashboard. DNS changes reversible via Cloudflare.

---

## ETAP 2 — Production Secrets

| # | Task | Owner | Status | Evidence | Provisioned | Verified | Rollback Available |
|---|------|-------|--------|----------|-------------|----------|-------------------|
| 2.1 | Generate DATABASE_URL | Platform | ⬜ | Supabase connection string | ⬜ | ⬜ | ✅ |
| 2.2 | Generate STRIPE_SECRET_KEY | Platform | ⬜ | Stripe dashboard → Developers | ⬜ | ⬜ | ✅ |
| 2.3 | Generate STRIPE_WEBHOOK_SECRET | Platform | ⬜ | After webhook endpoint creation | ⬜ | ⬜ | ✅ |
| 2.4 | Generate RESEND_API_KEY | Platform | ⬜ | Resend dashboard | ⬜ | ⬜ | ✅ |
| 2.5 | Generate CLOUDFLARE_API_TOKEN | Platform | ⬜ | Cloudflare dashboard → API Tokens | ⬜ | ⬜ | ✅ |
| 2.6 | Generate OPENAI_API_KEY | Platform | ⬜ | OpenAI dashboard | ⬜ | ⬜ | ✅ |
| 2.7 | Generate SENTRY_DSN | Platform | ⬜ | Sentry project settings | ⬜ | ⬜ | ✅ |
| 2.8 | Generate ENCRYPTION_KEY | Platform | ⬜ | 32-byte base64 | ⬜ | ⬜ | ⬜ |
| 2.9 | Generate SESSION_SECRET | Platform | ⬜ | 64-byte random | ⬜ | ⬜ | ⬜ |
| 2.10 | Generate JWT_SECRET | Platform | ⬜ | 64-byte random | ⬜ | ⬜ | ⬜ |
| 2.11 | Store secrets in vault/secrets manager | Platform | ⬜ | Vault path / KMS key: | ⬜ | ⬜ | ⬜ |
| 2.12 | Verify no secrets in repository | Platform | ⬜ | git grep result: | ⬜ | ⬜ | ✅ |

**Stage Rollback:** Previous secrets remain valid until rotation. Can revert to previous secret version.

---

## ETAP 3 — Database Initialization

| # | Task | Owner | Status | Evidence | Provisioned | Verified | Rollback Available |
|---|------|-------|--------|----------|-------------|----------|-------------------|
| 3.1 | Run production migrations | Platform | ⬜ | Migration files: | ⬜ | ⬜ | ✅ |
| 3.2 | Verify migration status | Platform | ⬜ | All migrations applied: | ⬜ | ⬜ | ✅ |
| 3.3 | Enable RLS on all tenant tables | Platform | ⬜ | pg_policies count: | ⬜ | ⬜ | ✅ |
| 3.4 | Test Tenant A isolation | Platform | ⬜ | Test result: | ⬜ | ⬜ | ✅ |
| 3.5 | Test Tenant B isolation | Platform | ⬜ | Test result: | ⬜ | ⬜ | ✅ |
| 3.6 | Test cross-tenant access blocked | Platform | ⬜ | Test result: | ⬜ | ⬜ | ✅ |
| 3.7 | Seed plans (Free, Starter, Business, Enterprise) | Platform | ⬜ | Plans count: | ⬜ | ⬜ | ✅ |
| 3.8 | Seed feature flags | Platform | ⬜ | Flags count: | ⬜ | ⬜ | ✅ |

**Stage Rollback:** Database backups enable full restore to pre-migration state.

---

## ETAP 4 — First Production Deploy

| # | Task | Owner | Status | Evidence | Provisioned | Verified | Rollback Available |
|---|------|-------|--------|----------|-------------|----------|-------------------|
| 4.1 | Build Docker image | Platform | ⬜ | Image tag: | ⬜ | ⬜ | ✅ |
| 4.2 | Push to registry | Platform | ⬜ | Registry URL: | ⬜ | ⬜ | ✅ |
| 4.3 | Deploy to production | Platform | ⬜ | Deployment ID / timestamp: | ⬜ | ⬜ | ✅ |
| 4.4 | Verify health check | Platform | ⬜ | Response: | ⬜ | ⬜ | ✅ |
| 4.5 | Verify logs flowing | Platform | ⬜ | Log source: | ⬜ | ⬜ | ✅ |
| 4.6 | Verify metrics updating | Platform | ⬜ | Dashboard URL: | ⬜ | ⬜ | ✅ |

**Stage Rollback:** Previous Docker image tag available for immediate rollback.

---

## ETAP 5 — Production Smoke Test

| # | Task | Owner | Status | Evidence | Provisioned | Verified | Rollback Available |
|---|------|-------|--------|----------|-------------|----------|-------------------|
| 5.1 | Register test user | Platform | ⬜ | Email received: Yes / No | ⬜ | ⬜ | ⬜ |
| 5.2 | Create organization | Platform | ⬜ | Org ID: | ⬜ | ⬜ | ⬜ |
| 5.3 | Create tenant | Platform | ⬜ | Tenant ID: | ⬜ | ⬜ | ⬜ |
| 5.4 | Choose plan (Stripe test mode) | Platform | ⬜ | Subscription ID: | ⬜ | ⬜ | ⬜ |
| 5.5 | Create store | Platform | ⬜ | Store ID: | ⬜ | ⬜ | ⬜ |
| 5.6 | Choose template | Platform | ⬜ | Template ID: | ⬜ | ⬜ | ⬜ |
| 5.7 | Open builder | Platform | ⬜ | Builder loaded: Yes / No | ⬜ | ⬜ | ⬜ |
| 5.8 | Upload media | Platform | ⬜ | Asset ID: | ⬜ | ⬜ | ⬜ |
| 5.9 | Add product | Platform | ⬜ | Product ID: | ⬜ | ⬜ | ⬜ |
| 5.10 | Publish store | Platform | ⬜ | Live URL: | ⬜ | ⬜ | ⬜ |
| 5.11 | Verify HTTPS | Platform | ⬜ | SSL valid: Yes / No | ⬜ | ⬜ | ⬜ |
| 5.12 | Smoke test report | Platform | ⬜ | Pass / Fail | ⬜ | ⬜ | ⬜ |

**Stage Rollback:** If smoke test fails, rollback to previous deployment (4.3).

---

## ETAP 6 — Operational Verification

| # | Task | Owner | Status | Evidence | Provisioned | Verified | Rollback Available |
|---|------|-------|--------|----------|-------------|----------|-------------------|
| 6.1 | Verify monitoring active | Platform | ⬜ | Uptime monitor: | ⬜ | ⬜ | ✅ |
| 6.2 | Verify alerts configured | Platform | ⬜ | Alert channels: | ⬜ | ⬜ | ✅ |
| 6.3 | Verify backup running | Platform | ⬜ | Last backup: | ⬜ | ⬜ | ✅ |
| 6.4 | Test rollback | Platform | ⬜ | Rollback time: | ⬜ | ⬜ | ✅ |
| 6.5 | Test restart | Platform | ⬜ | Restart time: | ⬜ | ⬜ | ✅ |
| 6.6 | Verify log aggregation | Platform | ⬜ | Log source: | ⬜ | ⬜ | ✅ |
| 6.7 | Verify error tracking | Platform | ⬜ | Sentry project: | ⬜ | ⬜ | ✅ |

**Stage Rollback:** All monitoring/alerting configs are code-defined, can redeploy.

---

## Execution Artifacts

| Artifact | Purpose |
|----------|---------|
| `scripts/provision-supabase.sh` | Supabase project + backups + PITR |
| `scripts/provision-r2.sh` | R2 buckets + API keys |
| `scripts/provision-cloudflare.sh` | DNS + SSL + WAF |
| `deploy/Dockerfile` | Production container |
| `deploy/docker-compose.production.yml` | App deployment |
| `docs/launch/PRODUCTION_ENVIRONMENT_v1.0.md` | Environment spec |
| `docs/launch/PRODUCTION_DEPLOYMENT_PLAN_v1.0.md` | Deployment plan |
| `docs/launch/EXTERNAL_SERVICES_MATRIX.md` | External services |
| `docs/launch/DEPLOY_RUNBOOK.md` | Operational procedures |

---

## Evidence Template

For each verified task, attach:
- **Resource ID** (project ID, bucket name, etc.)
- **Dashboard link** (Supabase, Cloudflare, Stripe, etc.)
- **Screenshot** (optional but recommended)
- **Command output** (if applicable)
- **Verification date** (YYYY-MM-DD)

---

## Sprint 2.2 Definition of Done

Sprint is complete when ALL items are ✅:

- [ ] ETAP 1: All infrastructure provisioned and verified
- [ ] ETAP 2: All secrets configured (none in repo)
- [ ] ETAP 3: Database initialized and RLS verified
- [ ] ETAP 4: Application deployed and healthy
- [ ] ETAP 5: Smoke test passes end-to-end
- [ ] ETAP 6: Operational tools verified

---

## Sprint Result

**Status:**  
□ FAILED  
□ PARTIAL  
☐ COMPLETE

**Verified By:** _______________  
**Verification Date:** _______________

**Blocking Issues:**

---

**Go / No Go:**  
☐ GO — Proceed to Sprint 3 (First Demo Store)  
☐ NO GO — Blockers must be resolved

---

**Next Sprint:**  
Sprint 3 — First Demo Store

---

**Last Updated:** 2026-07-20  
**Next Review:** After each ETAP completion