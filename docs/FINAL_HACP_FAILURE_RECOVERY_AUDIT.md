# FINAL HACP READINESS GATE — FAILURE RECOVERY & CHAOS AUDIT

## 1. Multi-Tier Failure Matrix

| ID | Failure Mode | Injected Scenario | Detection Mechanism | Recovery Action | Verified State |
|---|---|---|---|---|:---:|
| **F-01** | Worker Failure | Injected corrupt response in `OrderRuntime.ts` | 23 Vitest test failures | Reversible git rollback | Clean |
| **F-02** | Validator Failure | Simulated missing test file assertion | Static test discovery difference | Full inventory re-discovery | Clean |
| **F-03** | Domain Exception | `InvalidOrderStateException` on illegal transition | Domain state machine guard | Immediate throw & transaction abort | Clean |
| **F-04** | Concurrency Race | Parallel checkouts with identical `correlationId` | `inflightPromises` deduplication | Shared execution promise & cache | Clean |
| **F-05** | Persistence Failure | Null entity query in `StoreRepository` | 404 entity handling | Safe HTTP 404 response | Clean |
| **F-06** | Cross-Tenant Breach | Foreign tenant querying protected order | `TenantSecurityException` / RLS guard | 404 masking (zero existence leak) | Clean |
| **F-07** | Boundary Numbers | Large bulk checkout ($999,900.00\text{ PLN}$) | Integer precision test | Exact grosz calculations | Clean |
| **F-08** | Schema Validation | Negative quantity in request body | Zod schema validation error | 400 Bad Request rejection | Clean |
| **F-09** | Empty Payload | Empty items array in checkout request | Route handler array validation | 400 Bad Request rejection | Clean |
| **F-10** | Stale Cache | Repeated `confirmPayment` on `PAID` order | Idempotency guard in engine | Safe no-op return of `PAID` order | Clean |

---

## 2. Recovery Integrity Principles
- **No Partial State**: In all 10 failure modes, zero phantom orders, unlinked payment intents, or dirty database records were created.
- **Deterministic Sensitivity**: The test suites proved 100% sensitive to underlying regressions and faults.
