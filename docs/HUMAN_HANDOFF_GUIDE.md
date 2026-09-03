# WEB FACTOR — PRODUCTION HANDOFF GUIDE (NIGHT SHIFT 16)

## 1. WHAT ACCESS IS REQUIRED?
Only two external credentials are required to cross the production boundary:
1. **`VERCEL_TOKEN`**: A personal or team Vercel deployment token with permissions for project `solospot`.
2. **`STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`**: Stripe **TEST MODE** credentials (`sk_test_...` and `whsec_...`).

---

## 2. WHERE DOES THE HUMAN PROVIDE IT?
Provide the credentials in your local environment or `.env.local` before launching:
```powershell
$env:VERCEL_TOKEN = "your_vercel_token_here"
$env:STRIPE_SECRET_KEY = "sk_test_your_key_here"
$env:STRIPE_WEBHOOK_SECRET = "whsec_your_secret_here"
```

---

## 3. WHAT SHOULD NEVER BE PASTED INTO CHAT?
- **NEVER** paste `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or `VERCEL_TOKEN` directly into chat prompts.
- All secrets must reside exclusively in environment variables or `.env.local`.

---

## 4. WHAT COMMAND STARTS THE EXECUTION?
Run the automated orchestrator:
```powershell
node scripts/e2e_handoff_orchestrator.js
```

---

## 5. WHAT WILL HACP DO AUTOMATICALLY?
Once started, the orchestrator executes without any human intervention:
1. Validates all environment variables with secret masking.
2. Checks live Supabase production database health (`solospot-production`).
3. Executes production Vercel deployment (`vercel deploy --prod --yes`).
4. Discovers the resulting public deployment URL.
5. Performs HTTP smoke tests on storefront routes.
6. Connects to Stripe test API and creates a test payment intent with deterministic idempotency key.
7. Dispatches the test webhook and verifies cryptographic signature validation.
8. Executes atomic order CAS status update (`pending` -> `paid`) on live database.
9. Executes atomic inventory commit RPC (`atomic_inventory_commit`) on live database.
10. Tests duplicate webhook delivery to prove zero side-effect amplification.
11. Performs teardown to delete temporary test fixtures.
12. Produces the final verification report.

---

## 6. WHAT EVIDENCE WILL BE PRODUCED?
- Vercel Deployment ID & Production URL.
- Stripe Test PaymentIntent ID (`pi_test_...`).
- Supabase Live Transaction Records (Order ID, Inventory stock changes, CAS row updates).
- Comprehensive Level 5/6 Verification Report.

---

## 7. WHAT CONDITIONS CAUSE STOP?
- Missing `VERCEL_TOKEN` -> Skips deployment, performs dry run.
- Missing `STRIPE_SECRET_KEY` -> Skips Stripe provider calls, performs dry run.
- Database connection failure -> Aborts with diagnostic error.

---

## 8. WHAT DOES THE HUMAN HAVE TO DO AFTER START?
**NOTHING.** The entire flow executes autonomously to completion and outputs the final status report.
