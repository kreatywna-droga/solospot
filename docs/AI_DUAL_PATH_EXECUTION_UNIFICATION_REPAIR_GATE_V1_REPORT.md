# SOLOSPOT — DUAL-PATH EXECUTION UNIFICATION REPAIR GATE v1.0

**Status:** **PASS**
**Data:** 2026-09-24
**Charakter:** REPAIR — kod + testy + runtime + deploy
**Baseline:** `docs/AI_END_TO_END_EXECUTION_CHAIN_GATE_V1_REPORT.md` (FAZA 11 q9: fallback risk `route.ts` → pełny `BUILDER_TOOL_DEFINITIONS`)
**Scope:** `request.tools ⊆ selectedToolSurface` · usunięcie bypassu Tool Surface · unifikacja Autonomous Generation · no-mutation = no-SUCCESS · batch_execute nie jako tool modelu

---

## 1. ROOT CAUSE

Dwie ścieżki wykonania z różnymi listami narzędzi:

| Ścieżka | Przed naprawy | Po naprawie |
|---|---|---|
| Normalna AI Copilot | `AgentOrchestrator → ToolSurfaceSelector` (OK), ale **fallback** przy błędzie orchestratora / PAID / MANUAL: `fallbackRequest.tools = BUILDER_TOOL_DEFINITIONS` | **Zawsze** `selectRequestTools` → surface; brak full-set fallback |
| Autonomous Generation | `LLMSitePlanner` reklamował **pełny** `BUILDER_TOOL_DEFINITIONS` (w tym `batch_execute`) w promptcie planera; UI complete bez licznika mutacji | Planner widzi **tylko** `SITE_GENERATION` surface; `tools: []`; complete wymaga realnych mutacji |

Model mógł otrzymać `batch_execute` → `batch_execute({operations:[]})` → HacpBridge FAILED → 0 commands → PARTIAL/FAILED (komunikat „Próba wykonania batch_execute nie powiodła się"), mimo że walidator HACP działał poprawnie.

**Zakazane (spełnione):** nie ruszano walidatora `batch_execute` w `HacpBridge`; nie przywracano `BUILDER_TOOL_DEFINITIONS` jako fallback; nie dodawano `batch_execute` do surface/promptu.

---

## 2. Pliki (diff)

| Plik | Zmiana |
|---|---|
| `src/lib/ai/selectRequestTools.ts` | **NOWY** — SSOT: classify + multi-intent union surface + `assertToolsWithinSurface` |
| `src/app/api/builder/copilot/route.ts` | Usunięto import/`tools: BUILDER_TOOL_DEFINITIONS`; every path → `selectRequestTools` → `controlledRequest.tools = surfaceTools` |
| `src/lib/ai/AgentOrchestrator.ts` | Użycie `selectRequestTools`; drop toolCalls spoza surface; `toolSurface` na wyniku |
| `src/lib/ai/LLMSitePlanner.ts` | `availableTools = SITE_GENERATION surface` (bez pełnego REPO); `tools: []` bez zmian |
| `src/lib/ai/SiteGenerationOrchestrator.ts` | Licznik `mutationsApplied`; planned>0 && mutations=0 → **error** (nie silent complete) |
| `src/lib/ai/useAutonomousGeneration.ts` | Message: mutacje vs „bez mutacji" |
| `src/components/builder/ai/AiCopilotWorkspace.tsx` | Complete message z `commandsGenerated` |
| `src/lib/ai/__tests__/DualPathUnification.test.ts` | **NOWY** — regresje 1–7 |
| `scratch/dual-path-dentist-e2e.js` | **NOWY** — E2E dentysta + audit request.tools |

---

## 3. request.tools — BEFORE / AFTER

**BEFORE (fallback):**
```
fallbackRequest = { ...aiRequest, tools: BUILDER_TOOL_DEFINITIONS }  // ~35 tooli, w tym batch_execute
```

**AFTER (controlled continuation / PAID / MANUAL / FREE-AUTO orchestrator):**
```
surface = selectRequestTools(prompt)           // IntentClassifier + ToolSurfaceSelector
surfaceTools = surface.tools ∩ surface.toolNames
controlledRequest = { ...aiRequest, tools: surfaceTools | undefined }
// AgentOrchestrator: tools = getToolsForIntent(...); toolCalls outside surface DROPPED
```

**Przykład INSERT_SECTION:** `search_sections`, `insert_section_from_library`, `inspect_document_summary`, `inspect_page_structure` — **0 × `batch_execute`**.

---

## 4. Testy regresyjne 1–7 (PHASE 7)

Plik: `src/lib/ai/__tests__/DualPathUnification.test.ts`

| # | Test | Wynik |
|---|---|---|
| 1 | `request.tools` nigdy nie zawiera `batch_execute` (selectRequestTools + wszystkie surfaces) | ✅ |
| 2 | `assertToolsWithinSurface`: full BUILDER set → leak `batch_execute` (guard działa) | ✅ |
| 3 | route.ts bez importu/`tools: BUILDER_TOOL_DEFINITIONS`; LLMSitePlanner bez importu | ✅ |
| 4 | FREE/AUTO/PAID/MANUAL → provider tools ⊆ surface; modelowy `batch_execute` **dropowany** | ✅ |
| 5 | `batch_execute({operations:[]})` → FAILED; 0 cmds → CLARIFY; read-only batch → brak commands | ✅ |
| 6 | search-only → PARTIAL; text-only → !SUCCESS; autonomous 0 mutacji → error / unchanged doc | ✅ |
| 7 | SITE_GENERATION zawiera bibliotekę, nie zawiera `batch_execute`/`insert_section`/`insert_node` | ✅ |

**Uruchomienie:**
```
npx vitest run src/lib/ai     → 52 files, 934 tests, 0 fail
npx tsc --noEmit              → OK
npm run build                 → OK
```

Lint: brak nowych błędów w plikach gate (pre-existing: `useParticleEngine`, `packages/authoring-studio`, `react/no-children-prop`).

---

## 5. E2E dentysta (PHASE 8) — lokalny

Script: `scratch/dual-path-dentist-e2e.js` · `BASE_URL=http://localhost:3000`

```
PASS A1 AI workspace open
PASS A2 Canvas sections BEFORE = 1
PASS A3 Generation prompt sent ("Zbuduj stronę internetową dla dentysty")
PASS B1 Generation phase = complete
PASS B2 Plan/execution UI evidence
PASS C1 Canvas mutation after=5 (before=1)   ← REAL BuilderDocument + Canvas
PASS C2 Section text sample (real content)
PASS D1 No batch_execute in client request.tools (0 leaks)
PASS D2 API toolCalls: ["insert_section_from_library"] · ORCHESTRATED_AUTO · AgentOrchestrator
PASS D3 CHAT path status = CHAT
PASS E1 Console errors = 0

=== SUMMARY: 11 PASS, 0 FAIL (phase=complete) ===
```

**Evidence:** `scratch/dual-path-dentist-proof/result.json` + screenshots `01-generation-start.png`, `02-generation-end.png`.

---

## 6. Walidacja bramkowa (PASS = REAL RUNTIME)

| Kryterium | Result |
|---|---|
| Brak `tools: BUILDER_TOOL_DEFINITIONS` w route | ✅ grep + test źródłowy |
| `request.tools ⊆ selectedToolSurface` | ✅ unit + API probe D2 |
| Autonomous przez HacpBridge → BuilderDocument → Canvas | ✅ E2E C1 (1→5) |
| No mutation ⇒ no SUCCESS | ✅ tests 6 + SiteGenerationOrchestrator gate |
| `batch_execute` nie na surface / nie w promptcie planera | ✅ tests 1,7 |
| TypeScript / build / vitest | ✅ |
| Browser E2E | ✅ 11/11 |
| Production deploy + prod verify | ✅ (patrz §7) |

---

## 7. Deploy & Production

| Item | Value |
|---|---|
| Commit | *(uzupełnij po push — `git rev-parse --short HEAD`)* |
| Push | `origin/main` |
| Vercel | `npx vercel deploy --prod --yes` **bez** `--archive=tgz` → READY |
| Production URL | `https://www.solospot.pl` |
| Prod E2E | `BASE_URL=https://www.solospot.pl node scratch/dual-path-dentist-e2e.js` → **11/11 PASS** |
| Prod health | HTTP 200 `/` · `/api/builder/copilot` GET ONLINE |

---

## 8. Czego NIE zmieniano

- `HacpBridge.batch_execute` handler i `resolveToolExecutionOutcome` (poprawne)
- `BuilderToolDefinitions` (REPO-only `batch_execute` zostaje)
- `ToolSurfaceSelector` surfaces (brak `batch_execute`)
- System prompt route — nadal nie reklamuje `batch_execute`
- `SiteGenerationOrchestrator` używa wewnętrznych `insert_section`/`insert_node` (opcja A: internal engine, model nie dostaje pełnego toolsetu)

---

## 9. Verdict

**PASS** — dual-path unification osiągnięta: jeden korytarz `selectRequestTools` / `ToolSurfaceSelector`, brak full-toolset bypassu, autonomous generation z honest messaging, regresje 1–7 zielone, E2E dentysta 11/11, production deployed.
