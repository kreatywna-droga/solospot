# SOLOSPOT — MINI INSPECTOR AI REAL EXECUTION FAILURE FORENSIC TRACE + REPAIR GATE v7.0 — FINAL REPORT

**Status:** ✅ GATE PASSED (PHASE 0–28 complete)
**Branch:** `main` · **Commit:** `e8bd291` `fix(ai): restore Mini Inspector real command execution` (pushed)
**Deploy:** `https://solospot-arcapwh3l-kreatywna-droga.vercel.app` → aliased `https://www.solospot.pl`
**Constraint honoured:** NO product code was changed before the forensic phases (PHASE 1–16) were complete and the FIRST BREAK was proven.

---

## 0. EXECUTIVE SUMMARY

**Reported production symptom:** in the SoloSpot Mini Inspector every command that was not handled by the Fast Path ended with

> **„Nie udało się wykonać polecenia."**

panel status `FAILED`, zero document mutation, after a **15 002 ms** provider abort (`llmRequestCount:1`, `fallbackUsed:false`).

**Forensic result — the FIRST BREAK is proven and repaired:**

| # | Break | File | Why it broke | Repair |
|---|-------|------|--------------|--------|
| **A (earliest)** | Deterministic Polish commands were rejected `UNRESOLVED` and forced onto the LLM | `src/lib/hacp/TargetedEditResolver.ts`, `src/lib/hacp/FastPathEligibility.ts` | `fold()` uses Unicode NFD, which **cannot decompose `ł` (U+0142)** — so folded text kept `ł` and every ASCII alias (`naglowek`, `tytul`, `tlo`) missed `nagłówek`/`tytuł`/`tło`. Additionally `COLOR_RE` had **no background vocabulary at all** (`tło/tła/background`). | `fold()` maps `ł/Ł → l` before `normalize('NFD')` in **both** copies; `COLOR_RE` accepts `tło/tła/background`. New rejection reason `INSUFFICIENT_DATA`. |
| **B (terminal)** | The LLM request died without ever trying a fallback model | `src/lib/ai/OpenCodeProvider.ts` | An `AbortSignal.timeout(15000)` raised **while reading the body** left `response` assigned with `ok === true`, so the failover guard `!response \|\| !response.ok \|\| data?.error` evaluated to **false** → `llmRequestCount:1`, `fallbackUsed:false`, `ERROR`. | catch block clears `response`/`data`; guard also treats *empty `choices`* as failure; failover is **deadline-bounded** (25 s total budget, per-candidate timeout `min(15000, remaining)`). |
| **C** | Indefinite prompts had no honest deterministic answer | `src/lib/hacp/HacpBridge.ts` | `executeFastPath` returned `null` for *every* rejection → all four gate-negative prompts went to the model → abort → `FAILED`. | For `INSUFFICIENT_DATA` / `PARAMETERS_INCOMPLETE` the same fast-path entry point now returns an **honest deterministic `CLARIFY`** (zero mutations, zero model calls): *"Potrzebuję więcej informacji"*. |

**Nothing was bypassed:** `BuilderCommand → BuilderDocument → Canvas → Verification` is still the only mutation path; the Mini Inspector still edits configuration only (ADR-042/043/045 unchanged).

**Production acceptance (PHASE 27): 13/13 PASS** — 5/5 real commands `EXECUTED` with real BuilderDocument + Canvas changes, 4/4 negatives honest `CLARIFY` with **0 API calls and 0 mutations**, target lock / undo / redo / persistence all PASS. The four originally broken `ł`/`tło` prompts now execute in **~1.5 s** instead of failing after 15 s.

---

## 1. PHASE 0 — BASELINE (unchanged-by-gate reference)

| Check | Baseline |
|-------|----------|
| `npx tsc --noEmit` | 22 errors — **all in 3 files untouched by this gate** (21 from `packages/design-system/src/__tests__/visual-effectiveness.test.ts` added by `3c99dd1`, 1 pre-existing `src/lib/hacp/__tests__/HacpLiveDispatch.test.ts` `Cannot find namespace 'vi'`). Older AGENTS note ("exactly 6") predates `3c99dd1`. |
| `npm run lint` | **15 errors**, 42 warnings (authoring-studio / provision-engine / dashboard / `useParticleEngine`) — none in changed files |
| Full `vitest run` | **36 failed files / 224 failed tests** / 33 737 passed (33 961) — identical to baseline |
| Known pre-existing failure | `src/lib/hacp/__tests__/HacpIntentEngine.test.ts` **T37** (offline CLARIFY message in node env) |
| HEAD before gate | `3c99dd1` == `origin/main` |

---

## 2. PHASE 1–2 — SYMPTOM SOURCE & REPRODUCTION (production)

* Message source located: `src/components/builder/ai/MiniInspectorAI.tsx:417`, rendered when the panel `data-ai-status === 'FAILED'`.
* Fixture document: hero `sec-hero-init` with `node-heading-a` + `node-button-b`, written to `localStorage['solospot_store_s-demo']` (`/api/stores/s-demo` → 401), **Main Chat CLOSED** (`MAINOPEN=0`) for every acceptance run.
* **Reproduction:** the five gate positives always worked (`FAST_PATH`, 0 copilot POSTs). Every prompt that *left* the Fast Path reproduced the symptom:

```
AI_PATH → PROVIDER 15 002 ms (AbortSignal) → executionStatus: ERROR, intent: CLARIFY,
ok:false, notes: fast-path-rejected:UNRESOLVED + no-dispatch:ERROR
→ panel FAILED "Nie udało się wykonać polecenia." → 0 mutations
```

Reproduced for: `zmień tło na niebieski`, `zmień tło na czarne`, `zmień tytuł na Witaj świecie`, `zmień nagłówek na TEST`, `dodaj przycisk`, `zmień tło sekcji na delikatny gradient`, `zmień coś`, `zmień kolor`, `użyj jakiejś czcionki`, `zrób to ładniej`.

---

## 3. PHASE 3–10 — EXECUTION CHAIN TRACE (healthy, NOT the break)

Verified by console `EXECUTION_TRACE` + `window.__SOLOSPOT_LATENCY_TRACES__` on production:

| Stage | Verdict |
|-------|---------|
| Mini Inspector submit → `MiniInspectorCommandBus` (`source: mini-inspector`, QUEUE 1 ms) | healthy |
| `SharedExecutionService` fast-path-first → `executePlan` fallback | healthy |
| `mapExecutionStatus` (`CLARIFY→CLARIFY`, `EXECUTED→SUCCESS`, `ERROR/FAILED/BLOCKED→FAILED`) | healthy — mapping is honest |
| Fast Path execution (dispatch → verification → canvas) | healthy — 5/5 positives always executed |

**Conclusion:** the chain, the bridge delegation, the status mapping and the UI are correct. The failure is produced **upstream** of them.

---

## 4. PHASE 11 — FIRST BREAK DETERMINATION

### 4.1 Break A — `fold()` loses nothing but keeps `ł`; `COLOR_RE` has no "background"

Diagnostic (`npx vitest` over 26 verdict combinations, ASCII aliases × real Polish words, both `sec-hero-init` and `node-heading-a` targets):

| Prompt | BEFORE | AFTER |
|--------|--------|-------|
| `zmień kolor na czerwony` | `ELIGIBLE` | `ELIGIBLE` |
| `zmień tło na niebieski` | `UNRESOLVED` | **`ELIGIBLE`** (`backgroundColor #0000FF`) |
| `ustaw tło sekcji na czerwony` | `UNRESOLVED` | **`ELIGIBLE`** (`#FF0000`) |
| `zmień tło na czarne` | `UNRESOLVED` | **`ELIGIBLE`** |
| `zmień nagłówek na TEST` | `UNRESOLVED` | **`ELIGIBLE`** (`CHANGE_TEXT`) |
| `zmień tytuł na Witaj świecie` | `UNRESOLVED` | **`ELIGIBLE`** (`CHANGE_TEXT`) |
| `zmień coś` / `zrób to ładniej` | `UNRESOLVED` → LLM | **`INSUFFICIENT_DATA`** → deterministic CLARIFY |
| `zmień kolor` / `użyj jakiejś czcionki` | `PARAMETERS_INCOMPLETE` → LLM | `PARAMETERS_INCOMPLETE` → deterministic CLARIFY |
| `dodaj przycisk` | `UNRESOLVED` | `UNRESOLVED` (still AI — correct) |

Production BEFORE evidence for exactly these prompts (`scratch/v7-reject-probe.json`, `scratch/v7-hunt.json`):

| Prompt | path | exec | notes |
|--------|------|------|-------|
| `zmień tło na niebieski` | AI_PATH | **ERROR** | `fast-path-rejected:UNRESOLVED` |
| `zmień tło na czarne` | AI_PATH | **ERROR** | `fast-path-rejected:UNRESOLVED` |
| `zmień tytuł na Witaj świecie` | AI_PATH | **ERROR** | `fast-path-rejected:UNRESOLVED` |
| `zmień nagłówek na TEST` | AI_PATH | EXECUTED (≈10 s, model-dependent) | `fast-path-rejected:UNRESOLVED` |
| `zmień kolor tła na czerwony` | FAST_PATH | EXECUTED | (`kolor` matched `COLOR_RE`, `tło` never needed) |

### 4.2 Break B — failover silently skipped on a body-phase abort

`src/lib/ai/OpenCodeProvider.ts` (BEFORE):

```ts
} catch (fetchErr) {                 // AbortSignal fired during response.text()
  errorBodyText = ...;               // response stays assigned, response.ok === true
}
if (!response || !response.ok || data?.error) {   // → false → NO fallback
  ...
}
// → returns ERROR with llmRequestCount:1, fallbackUsed:false, durationMs:15002
```

Verified with `scratch/v7-abort-repro.js` (6 live upstream calls): **1/6 aborted in body phase** (`responseSet:true, responseOk:true`), 5/6 aborted during `fetch` — i.e. only the body-phase abort hit the dead-end path, which is precisely the shape the production evidence shows (`llmRequestCount:1` with a completed HTTP response).

---

## 5. PHASE 12–13 — MAIN CHAT COMPARISON / MAIN CHAT CLOSED

* With Main Chat **open**: same commands, same outcomes (positive → `FAST_PATH EXECUTED` + "Zmieniłem kolor tła zaznaczenia **Hero** na **#FF0000**."; `zmień tło na niebieski` → AI_PATH ERROR, chat shows the *specific* message naming the model).
* With Main Chat **closed** (`MAINOPEN=0`): identical behaviour — Main Chat is not a variable. All acceptance runs below were executed with Main Chat closed.
* The Mini Inspector collapses the specific provider message into the generic „Nie udało się wykonać polecenia" — reported, **not changed** by this gate (see §12).

---

## 6. PHASE 15–19 — ACCEPTANCE **BEFORE** (production, `scratch/v7-accept-BEFORE.json`)

| # | Prompt | path | exec | API calls | llm | mutated | Panel |
|---|--------|------|------|-----------|-----|---------|-------|
| + | `zmień kolor na czerwony` | FAST_PATH | EXECUTED | 0 | — | ✅ | success |
| + | `zmień czcionkę na Inter` | FAST_PATH | EXECUTED | 0 | — | ✅ | success |
| + | `powiększ czcionkę o 20 procent` | FAST_PATH | EXECUTED | 0 | — | ✅ | success |
| + | `zmień tekst na TEST` | FAST_PATH | EXECUTED | 0 | — | ✅ | success |
| + | `wyśrodkuj tekst` | FAST_PATH | EXECUTED | 0 | — | ✅ | success |
| − | `zmień coś` | **AI_PATH** | **ERROR** | 1 | 1 | 0 | **„Nie udało się wykonać polecenia"** |
| − | `zmień kolor` | **AI_PATH** | **ERROR** | 1 | 1 | 0 | **„Nie udało się wykonać polecenia"** |
| − | `użyj jakiejś czcionki` | **AI_PATH** | **ERROR** | 1 | 1 | 0 | **„Nie udało się wykonać polecenia"** |
| − | `zrób to ładniej` | **AI_PATH** | **ERROR** | 1 | 1 | 0 | **„Nie udało się wykonać polecenia"** |

Target lock PASS · undo PASS · redo PASS · persistence PASS (these were never broken).

**Gate-blocking delta:** 4/4 negatives required `CLARIFY`, delivered `ERROR` + the reported symptom.

---

## 7. PHASE 20 — REPAIR (scope of the change)

| File | Change |
|------|--------|
| `src/lib/hacp/TargetedEditResolver.ts` | `fold()` maps `ł/Ł → l` **before** `normalize('NFD')`; `COLOR_RE = /\bkolor\|\bcolour\|\bcolor\|\bbarw\|\btlo\b\|\btla\b\|\bbackground\b/` |
| `src/lib/hacp/FastPathEligibility.ts` | same `fold()` fix; new `FastPathReason = 'INSUFFICIENT_DATA'` + `INSUFFICIENT_DATA_RE` (evaluated **only** when the resolver returned `null`, so `PARAMETERS_INCOMPLETE`, `UNRESOLVED`, `DESIGN_INTELLIGENCE_REQUIRED` verdicts are unchanged) |
| `src/lib/hacp/HacpBridge.ts` | `executeFastPath()` returns `fastPathClarify(reason)` (honest `CLARIFY`, `commandsToDispatch: []`, `intent: 'CLARIFY'`, `executionStatus: 'CLARIFY'`) for `INSUFFICIENT_DATA` / `PARAMETERS_INCOMPLETE`; **every other reason still returns `null` → AI path** |
| `src/lib/ai/OpenCodeProvider.ts` | catch clears `response`/`data`; failover guard adds `!Array.isArray(data?.choices) \|\| data.choices.length === 0`; failover deadline `requestStartedAt + 25000`, `if (remainingMs < 2000) break`, `AbortSignal.timeout(Math.min(15000, remainingMs))` |

**Deliberately NOT changed:** primary `AbortSignal.timeout(15000)` for the initial request, agent-loop continuation timeouts, `HacpIntentEngine`, `SharedExecutionService`, `MiniInspectorAI` UI copy, prompt/instruction text to the model, `AgentOrchestrator`, model choice, Fast Path eligibility order for all other reasons, execution/verification pipeline.

---

## 8. PHASE 21 — REGRESSION TESTS (16 new)

* `src/lib/hacp/__tests__/GateV7RealExecution.test.ts` — **13 tests**: the six `ł`/`tło` verdicts, the four deterministic CLARIFY cases (status + zero dispatch + document byte-identical + no `„Wykonano"`), the AI-path preservation guards (`Zrób to lepiej`, `dodaj przycisk`, `zmień czcionkę na luksusową` must still return `null`), and two real dispatches (`zmień nagłówek na TEST`, `zmień tło na niebieski`).
* `src/lib/ai/__tests__/GateV7ProviderFailoverRegression.test.ts` — **3 tests**: body-phase abort → 2 upstream requests + `CHAT` + `fallbackUsed:true`; healthy primary → exactly 1 request; all candidates timing out → honest classified `ERROR` (never `NOT_CONFIGURED`, no `toolCalls`).
* **Proof the tests bite:** with Break B restored (catch + guard reverted) tests 1 and 3 fail with `expected 1 to be 2` / `expected 1 to be greater than 1`; with Break A restored the eligibility tests fail on `expected 'UNRESOLVED' to be 'ELIGIBLE'`.
* Temporary diagnostic `src/lib/hacp/__tests__/__tmp_diag.test.ts` was removed — it is **not** part of the commit.

---

## 9. PHASE 22–24 — VALIDATION

| Gate | Command | Result |
|------|---------|--------|
| Focused suites | `npx vitest run src/lib/hacp src/components/builder/ai src/lib/ai` | **551 passed / 552** — 1 failed = pre-existing `HacpIntentEngine` **T37** |
| New tests | `npx vitest run …GateV7*` | **16/16 passed** |
| Full suite | `npx vitest run` | **36 failed files / 224 failed tests / 33 737 passed** — **identical to baseline (0 new failures)** |
| Typecheck | `npx tsc --noEmit` | 22 errors, **0 in changed files** (delta 0 vs baseline) |
| Lint | `npm run lint` | **15 errors** = baseline, **0 in changed files** |
| Build | `npm run build` | **EXIT 0** |

---

## 10. PHASE 25–26 — COMMIT / PUSH / DEPLOY

```
e8bd291 fix(ai): restore Mini Inspector real command execution      (pushed to origin/main)
3c99dd1 fix(design-system): expand theme consumption in canvas…    (untouched predecessor)
```

6 files changed, 483 insertions(+), 7 deletions(-) — 4 source + 2 test files only.
Deploy: `npx vercel deploy --prod --yes` → `Ready in 3m` → `https://www.solospot.pl`.

---

## 11. PHASE 27 — PRODUCTION ACCEPTANCE (**AFTER**)

### 11.1 Acceptance suite — `scratch/v7-prod-after.json` (13/13 PASS)

| # | Prompt | path | exec | API calls | mutated | Panel message |
|---|--------|------|------|-----------|---------|---------------|
| + | `zmień kolor na czerwony` | FAST_PATH | **EXECUTED** | 0 | `node-heading-a` | Polecenie wykonane pomyślnie |
| + | `zmień czcionkę na Inter` | FAST_PATH | **EXECUTED** | 0 | `node-heading-a` | Polecenie wykonane pomyślnie |
| + | `powiększ czcionkę o 20 procent` | FAST_PATH | **EXECUTED** | 0 | `node-heading-a` | Polecenie wykonane pomyślnie |
| + | `zmień tekst na TEST` | FAST_PATH | **EXECUTED** | 0 | `node-heading-a` | Polecenie wykonane pomyślnie |
| + | `wyśrodkuj tekst` | FAST_PATH | **EXECUTED** | 0 | `node-heading-a` | Polecenie wykonane pomyślnie |
| − | `zmień coś` | FAST_PATH | **CLARIFY** | **0** | **0** | Potrzebuję więcej informacji |
| − | `zmień kolor` | FAST_PATH | **CLARIFY** | **0** | **0** | Potrzebuję więcej informacji |
| − | `użyj jakiejś czcionki` | FAST_PATH | **CLARIFY** | **0** | **0** | Potrzebuję więcej informacji |
| − | `zrób to ładniej` | FAST_PATH | **CLARIFY** | **0** | **0** | Potrzebuję więcej informacji |

Rejection notes (honest, machine-readable):
`fast-path-rejected:INSUFFICIENT_DATA` (`zmień coś`, `zrób to ładniej`) ·
`fast-path-rejected:PARAMETERS_INCOMPLETE` (`zmień kolor`, `użyj jakiejś czcionki`) ·
`no-dispatch:CLARIFY` on all four.

* Positives: wall **1.37–1.63 s**, real BuilderDocument diff **and** real Canvas change (`redInside`, `innerColor`, `innerSize`, `innerAlign`).
* **PHASE 17 target lock:** heading → `#0000FF`, `buttonChanged:false`, panel target at submit `node-heading-a` → PASS.
* **PHASE 18 undo/redo:** `TEST → UNDO_STEP` → undo `TEST` → redo `UNDO_STEP` → PASS.
* **PHASE 19 persistence:** saved → full reload → byte-identical document, canvas renders `rgb(0, 0, 255)` → PASS.

### 11.2 Originally failing prompts — `scratch/v7-prod-repair.json` (4/4 repaired)

| Prompt (BEFORE: `AI_PATH`/`ERROR` after 15 s) | path | exec | wall | mutation |
|---|---|---|---|---|
| `zmień nagłówek na TEST` | FAST_PATH | **EXECUTED** | **1 495 ms** | `props.text = "TEST"` |
| `zmień tytuł na Witaj świecie` | FAST_PATH | **EXECUTED** | **1 593 ms** | `props.text = "Witaj świecie"` |
| `zmień tło na niebieski` | FAST_PATH | **EXECUTED** | **1 478 ms** | `styles.backgroundColor = #0000FF` |
| `ustaw tło sekcji na czerwony` | FAST_PATH | **EXECUTED** | **1 568 ms** | `styles.backgroundColor = #FF0000` |
| `zmień tło na gradient` (no literal colour — must NOT invent one) | AI_PATH | **ERROR** (`intent: CLARIFY`, honest TIMEOUT after failover) | 26.8 s | **0 mutations** (no fake colour) |

### 11.3 AI path after the repair — `node scratch/v7-api.js https://www.solospot.pl "zmień tło na gradient"`

```json
{ "status": "ERROR", "model": "nvidia/nemotron-3.5-lightning:free",
  "error": "The operation was aborted due to timeout",
  "message": "Upłynął limit czasu oczekiwania na odpowiedź modelu (nvidia/nemotron-3.5-lightning:free) (15s)…",
  "durationMs": 25001, "latency": { "llmMs": 25001, "llmRequestCount": 2 } }
```

* **`llmRequestCount: 1 → 2`** — the failover chain now actually runs after a body-phase abort (Break B fixed); the request is no longer dead after a single attempt.
* The error is **classified and specific** (model name + TIMEOUT), not a bare generic failure.
* The residual failure on *this* prompt is **upstream free-model latency** (both attempts consumed the 25 s budget), not the repaired break. See §13.

---

## 12. PHASE 28 — WHAT WAS **NOT** CHANGED (by design)

1. **No second execution engine.** All mutations still run `evaluateFastPath → executeToolCall → verifyCommandExecution → BuilderCommand → dispatch → BuilderDocument → Canvas`.
2. **No bypass** of `BuilderCommand → BuilderDocument → Canvas → Verification` anywhere; the new `CLARIFY` result dispatches **zero** commands by construction.
3. **No `requestAnimationFrame` / scheduler / playback logic** (ADR-042), **no Inspector-side animation or controller access** (ADR-043/045).
4. **Editor vs Runtime separation:** no `PlaybackController` / `RuntimeScheduler` / `RuntimeBridge` / Browser Adapter imports added; `packages/authoring-studio` untouched.
5. **No model / prompt / router / AgentOrchestrator changes**, no primary-timeout tuning, no UI copy changes, no Fast Path eligibility order changes for any other reason code.
6. Unrelated dirty files (`public/stores/s-new/*`, `scratch/*`, `docs/AI_*`, `docs/MINI_*`, `$`, `TODO_SPRINT6_STEP6.progress.md`) were **not** staged. No `git reset/clean/restore/checkout/rebase` used.

---

## 13. REMAININGS / OUT OF SCOPE (honest notes)

1. **Prompts the resolver does not own** (`zmień tło na gradient`, `dodaj przycisk`, long prose) still depend on free-model latency. After this gate they are no longer *silently* dead (failover engages, `llmRequestCount:1 → 2`, deadline 25 s, specific classified message), but they can still end `ERROR` when every free candidate is slow. Options deliberately left for a later gate: shorter primary timeout to widen the failover window, a higher total budget, or a deterministic Design-Intelligence CLARIFY for "value not in catalogue" prompts.
2. **Mini Inspector still shows the generic** „Nie udało się wykonać polecenia" instead of the specific provider message that Main Chat displays (`MiniInspectorAI.tsx:417`). Cosmetic/honesty gap, unchanged by this gate.
3. **`tsc` baseline drift:** AGENTS records "exactly 6 errors", the working baseline is now **22** — introduced by predecessor commit `3c99dd1` (`visual-effectiveness.test.ts`, 21 errors) plus the pre-existing `HacpLiveDispatch` namespace error. Gate delta = 0.
4. **Local methodology note:** during local acceptance `localhost:3000` was still serving a stale `next start` process from before the repair, which produced a false-negative run; the server was restarted against the fresh `npm run build` and the local run then matched production 13/13 (`scratch/v7-local-after2.json`).

---

## APPENDIX — EVIDENCE FILES (all read-only artifacts, untracked)

| File | Content |
|------|---------|
| `scratch/v7-reject-probe.json`, `scratch/v7-hunt.json` | BEFORE production rejections (`UNRESOLVED` → LLM → ERROR) |
| `scratch/v7-abort-repro.js` | upstream abort-phase reproduction (body vs fetch phase) |
| `scratch/v7-accept-BEFORE.json` | BEFORE acceptance (4/4 negatives FAILED) |
| `scratch/v7-local-after2.json`, `scratch/v7-repair-local.json` | local AFTER acceptance + `ł` verification |
| `scratch/v7-prod-after.json` | **production AFTER acceptance 13/13** |
| `scratch/v7-prod-repair.json` | **production AFTER `ł`/`tło` verification 4/4** |
| `scratch/v7-api.js` | direct `/api/builder/copilot` forensic probe |
| `scratch/vitest-v7.log`, `scratch/lint-v7.log`, `scratch/tsc-v7.log`, `scratch/build-v7.log`, `scratch/deploy-v7.log` | validation + deploy logs |
