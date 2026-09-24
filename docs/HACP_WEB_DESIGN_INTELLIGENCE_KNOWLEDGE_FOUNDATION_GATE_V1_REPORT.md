# HACP Web Design Intelligence Knowledge Foundation Gate v1.0

**Status: PASS (local) · pending prod verification**
**Date:** 2026-09-24
**Baseline:** `a441797` (Website Creation Gate closed)

---

## PASS criteria (16)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Knowledge layer exists | PASS | `src/lib/knowledge/` (types, registry, retrieval, index, domains/) |
| 2 | Modular | PASS | 18 domain modules `01…18-*.ts`, each exporting domain data |
| 3 | Versioned | PASS | `KNOWLEDGE_SCHEMA_VERSION='1.0.0'`, every entry `stamp()`ed |
| 4 | Uniform entry format | PASS | `KnowledgeEntry` (id, domain, title, rule, why, whenToUse, whenNotToUse, goodExample, badExample, verification, …); KnowledgeBase.test format-for-all |
| 5 | All major domains | PASS | `KNOWLEDGE_DOMAINS` = 18; every domain has ≥1 entry |
| 6 | Industry patterns | PASS | 20 `IndustryPattern` (incl. `IP-dental-medical`) |
| 7 | Anti-patterns | PASS | domain `15-anti-patterns` = 10 entries |
| 8 | QA framework | PASS | 24 `QaCheck` across 11 categories |
| 9 | Runtime retrieval | PASS | `buildDecisionContext(brief, industry?, purpose?)` |
| 10 | Relevant retrieval for brief | PASS | dentist brief → `IP-dental-medical` + `BP-dental-clinic` + CTA `Umów wizytę` (gate-stats.json) |
| 11 | HACP uses knowledge in planning | PASS | `SitePlanPlanner.generateSitePlan` → `buildDecisionContext` → strategies + `metadata.knowledge` + `console.log('[Knowledge]', …)` |
| 12 | Existing execution works | PASS | `src/lib/ai` 284/284; knowledge purity (no HacpBridge/BuilderDocument imports) |
| 13 | Dentist test E2E | PASS | local **15 PASS / 0 FAIL / 1 WARN** (WARN = pre-existing 401/404) |
| 14 | No fake SUCCESS | PASS | E2E A12: sections 1→8 before complete; A10: 0 fake knowledge claims |
| 15 | No batch_execute leak | PASS | E2E A9: absent from copilot request.tools |
| 16 | Prod verification | PENDING | after single `vercel deploy --prod` |

---

## 19-point report fields

### 1. Knowledge base architecture
```
src/lib/knowledge/
  types.ts          KnowledgeEntry contract, DecisionContext, KNOWLEDGE_DOMAINS (18)
  registry.ts       lazy getKnowledgeRegistry(), dup-ID throw, schemaVersion stamp
  retrieval.ts      buildDecisionContext, scoring+stemming, domain quotas (≤32 entries)
  index.ts          public API (Knowledge ≠ Execution; zero UI/execution imports)
  domains/01…18-*.ts
  __tests__/        KnowledgeBase, Retrieval, GateStats
```

### 2. File locations
- Layer root: `src/lib/knowledge/`
- Integration: `src/lib/ai/SitePlanPlanner.ts`, `src/lib/ai/SitePlanTypes.ts`
- Tests: `src/lib/knowledge/__tests__/`, `src/lib/ai/__tests__/KnowledgePlanIntegration.test.ts`
- E2E: `scratch/knowledge-gate-e2e.js` · proof: `scratch/knowledge-gate-proof/`

### 3. Knowledge entry format
Uniform: `id`, `domain`, `title`, `rule`, `why`, `whenToUse`, `whenNotToUse`, `goodExample`, `badExample`, `verification` (+ optional `antiPattern`, `executionHint`, `relatedRules`, `tags`, `schemaVersion`).

### 4. Counts (gate-stats.json)
| Metric | Count |
|--------|------:|
| Domains | 18 |
| Entries | 79 |
| Industry patterns | 20 |
| Anti-pattern entries | 10 |
| QA checks | 24 |
| Training cases | 20 (levels 1–5) |
| Website blueprints | 10 |

### 5. Retrieval mechanism
`USER BRIEF → extractBriefSignals → score entries (tags + stems) → domain quotas (max 32) → always attach industryPattern + blueprint + core QA (≤40) + 8 anti-patterns → DecisionContext`. Soft-fail: empty retrieval is honest (no fabricated claims).

### 6. Dentist retrieved context example
From `scratch/knowledge-gate-proof/gate-stats.json`:
- pattern: `IP-dental-medical`
- blueprint: `BP-dental-clinic`
- entries: `CD-005`, `IP-002`, `LC-003`
- qa: 24 · anti: 8
- retrievalLog: `industry-pattern:IP-dental-medical`, `blueprint:BP-dental-clinic`, `entries:3`, `signals:industry=dentist,purpose=booking`

### 7. Example DecisionContext designHints
- tone: `professional-warm reassuring`
- primaryCta: `Umów wizytę`
- visualDirection: `clean trust teal/blue, soft radii, photography of clinic/team`
- recommendedSections: navbar|hero|services|about|team|testimonials|cta|contact|footer
- mediaNeeds: clinic interior, team photos, smile/result imagery, service icons

### 8. Dentist E2E
- Script: `scratch/knowledge-gate-e2e.js`
- Prompt: implantologii + stomatologii estetycznej + umówienia wizyty (exact gate prompt)
- Local: **15 PASS / 0 FAIL / 1 WARN** (`BASE_URL=http://localhost:3000`)
- A2: `[Knowledge] schema=1.0.0 industry=dentist … pattern=IP-dental-medical blueprint=BP-dental-clinic qa=24 anti=8 cta=Umów wizytę`
- A4b: sections 1 → 8 · A5: dentalHits=8/8 · A8: `Umów wizytę` present
- Proof: `scratch/knowledge-gate-proof/result.json` + 3 PNG

### 9. Tests
- `src/lib/knowledge`: KnowledgeBase (13) + Retrieval (6) + GateStats (1) = **20**
- `KnowledgePlanIntegration`: **5**
- `src/lib/ai` full suite: **284/284** (18 files)
- HACP: 120/121 — T37 fails only with provider OFFLINE (environment noise, pre-existing)

### 10. TypeScript
`npx tsc --noEmit` → **OK**

### 11. Lint
`npx eslint` on knowledge + planner + integration test → **0 errors**

### 12. Build
`npm run build` → **✓ Compiled successfully** · BUILD_ID `vFuUb_9t0_TWZ0eg6Wu5c`

### 13. Browser proof (local)
`scratch/knowledge-gate-proof/01-loaded.png`, `02-prompt-typed.png`, `03-generation-end.png`

### 14. Local E2E summary
15/0/1 — no FAIL; console WARN = pre-existing `/api/stores` 401 + preview 404

### 15. Commit SHA
(pending this commit)

### 16. Vercel deployment
(pending single `npx vercel deploy --prod --yes`)

### 17. Prod E2E
(pending `BASE_URL=https://www.solospot.pl node scratch/knowledge-gate-e2e.js`)

### 18. Anti-fake evidence
- A9: `batch_execute` absent from request.tools
- A10: fake knowledge claims = 0 with non-empty retrievalLog
- A12: mutation (1→8) before complete
- Knowledge purity test: no execution-layer imports in `src/lib/knowledge`

### 19. Known gaps / BLOCKERS
- None for local gate. Prod verification outstanding until deploy.
- Console WARN (401/404) is pre-existing store noise from prior gates.
- HACP T37 provider-OFFLINE is environment noise unrelated to knowledge layer.

---

## Regression protection
- IntentClassifier: untouched (no knowledge hardcoding there)
- ToolSurfaceSelector / HacpBridge / BuilderDocument / Library: untouched
- Zero `batch_execute` on request surface (E2E A9)
- Knowledge layer purity enforced by test
