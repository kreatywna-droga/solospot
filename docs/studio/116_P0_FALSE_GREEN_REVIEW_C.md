# 116. P0 Remediation — False Green Review C

> [!IMPORTANT]
> **STATUS: Requires Re-ratification**
> 
> Status dokumentu nie został jeszcze formalnie zatwierdzony przez Architekta.
> Dokument opisuje wykonane prace, jednak jedynym źródłem prawdy o statusie sprintów pozostaje:
> `docs/studio/99_IMPLEMENTATION_CHECKLIST.md`

> **Status:** 🔴 **DRAFT / PENDING ACCEPTANCE** (NOT YET ACCEPTED)
> **Purpose:** False-Green Review (Task C) — audit of green results to ensure they are genuine, not shallow/false pass indications
> **Date:** 2026-08-04
> **Author:** Agent 1 (implementation evidence) — cross-checked against independent gate logs
> **Scope Adherence:** Scope Freeze (Task D) — no new final completion reports; Step 6 docs remain **DRAFT / PENDING ACCEPTANCE**.

---

## 1. Purpose

A "false green" is a PASS that does not reflect real system health — e.g. a test suite that silently skips, a type-check that checks the wrong files, a build that succeeds without compiling the relevant modules, or a log that is stale/out of date. This document reviews the three green gates to confirm they are **true greens**.

---

## 2. Gate-by-Gate False-Green Analysis

### 2.1 `npx vitest run` — 190 files / 1922 tests, 0 failed

| False-green risk | Check | Verdict |
|---|---|---|
| Tests silently skipped | Final summary: `190 passed (190)`, `1922 passed (1922)`. **0 pending, 0 skipped, 0 failed.** All files ran. | ✅ No silent skip |
| Only a subset ran | Full suite includes all workspace packages (190 files) + the 4 Sprint 6 Step 6 commerce tests. | ✅ Complete |
| Commerce tests actually execute | `cart-store` (7), `order-runtime` (5), `checkout-route` (6), `order-integration` (2) all present in run and pass. | ✅ Genuine |
| Assertions are vacuous | Tests assert concrete outcomes (reducer state, status transitions, tenant isolation, idempotency, Payment.Completed → PAID). | ✅ Meaningful |
| `vi.mock` hides real logic | Integration test uses **real** `PlatformEventBusImpl`, `OrderProcessingEngine`, `PaymentEngine`, `CartManager`, `CheckoutManager`; only adapter/repo are stubbed. | ✅ Real path exercised |

**Verdict: TRUE GREEN.** Consolidated log: `vitest_gate_full.log`.

### 2.2 `npx tsc --noEmit` — 0 errors

| False-green risk | Check | Verdict |
|---|---|---|
| Empty project / wrong tsconfig | `tsconfig.json` present; `tsc --noEmit` runs the full project graph (monorepo + app). | ✅ Full project |
| Errors suppressed | No `skipLibCheck` misconfiguration hiding real errors; exit code 0 with empty output. | ✅ Clean |
| Stale evidence | Log regenerated fresh this session (`tsc_gate_full.log`, empty). | ✅ Fresh |

**Verdict: TRUE GREEN.** Consolidated log: `tsc_gate_full.log`.

### 2.3 `npm run build` — GREEN

| False-green risk | Check | Verdict |
|---|---|---|
| Build didn't compile app | Next.js production build output includes the full route table (home, dashboard, studio, store, `/store/[slug]`, `/store/[slug]/cart`, `/store/[slug]/checkout`, `/store/[slug]/order/[id]`, `/store/[slug]/order/success`). | ✅ App compiled |
| Stale build log | `build_gate_final.log` is the **authoritative fresh** run. The old `build-error-log.txt` (July 23) is **stale** and superseded. | ✅ Fresh |
| Commercial routes omitted | Storefront commerce routes present in compiled route table. | ✅ Included |

**Verdict: TRUE GREEN.** Consolidated log: `build_gate_final.log`.

---

## 3. Historical Build-Failure Review (the flagged "false magenta")

The prior evidence of a build failure pointed to a missing `@/lib/utils` module (`cn`). Review findings:

- `build-error-log.txt` is dated **July 23** and references `cn` imports in `DocsSidebar.tsx` / `TableOfContents.tsx`.
- **Current versions of those files no longer import `@/lib/utils`.**
- A project-wide search found **no import of `@/lib/utils`**.
- The **fresh** `npm run build` is **GREEN**.

**Conclusion:** The prior failure was real at the time but is now **resolved**; the lingering failure log is **stale**. It must not be treated as current evidence.

---

## 4. Known Limitations (Honest Transparency)

These are **not** hidden — they are declared and tracked:

| Limitation | Location | Impact |
|---|---|---|
| In-memory Checkout idempotency cache | `OrderRuntime.ts` | Single-instance only; Redis needed for distributed prod |
| Hardcoded `'guest'` customerId | `OrderRuntime.ts` | ADR-004 — Customer Runtime deferred |
| Client-side `OrderRuntime` instantiation on order page | `order/[id]/page.tsx` | Server API fetch planned |
| `vi.mock` used for `PaymentFactory` in `order-runtime.test.ts` | test | Adapter stubbed (no real network payment) — acceptable for unit scope |

---

## 5. Conclusion

All three gates are **TRUE GREEN** based on fresh, single-instance, complete runs with meaningful assertions. The one historical failure flagged in P0 is confirmed **stale and resolved**. There is **no false green** in the current evidence package.

> **Note:** Green gates do **not** constitute formal acceptance. Sprint 6 Step 6 and the P0 remediation remain **PENDING ACCEPTANCE** until Architect review (Scope Freeze, Task D).
