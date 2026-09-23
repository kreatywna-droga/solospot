# SOLOSPOT — AI CAPABILITY SURFACE REPAIR GATE v1.0

**Status:** **PASS** (local gates) — pending production verify confirmation  
**Data:** 2026-09-23  
**Baseline:** `docs/AI_CAPABILITY_CORRIDOR_FORENSIC_GATE_V1_REPORT.md` (FORENSIC GATE v1.0, **HOLD**)  
**Scope:** REPO → REGISTERED → SELECTABLE → EXPOSED → EXECUTABLE → DISPATCH → VERIFY  
**Zakres zabroniony (nie ruszane):** BuilderDocument SSOT, Canvas UI, Workspace UI, model router, free-model strategy, Asset Corridor (search/insert AI), nowe Experience/Library/Inspector gates.

---

## 1. FAZA 1 — Surface reconciliation (reklama promptu)

**Plik:** `src/app/api/builder/copilot/route.ts` (systemPrompt)

Usunięto z promptu **11 tooli o zero surface** (F-04 repair):

| Usunięty tool | Powód |
|---|---|
| `inspect_parent` | C_NOT_SELECTABLE |
| `inspect_responsive` | C_NOT_SELECTABLE |
| `inspect_experience` | B — pokrywane przez `search_experiences` |
| `inspect_asset` | C — Asset Corridor Gate (poza scope) |
| `inspect_available_capabilities` | C_NOT_SELECTABLE |
| `insert_node` | C — future surface |
| `move_node` | C — future surface |
| `insert_section` (surowy) | B — publiczna ścieżka: `insert_section_from_library` |
| `set_background_color` | B — EDIT_NODE → `update_node_props` |
| `batch_execute` | C — surface exposure future gate |
| `get_experience_categories` | B — pokrywane przez `search_experiences` |

Dodatkowo:
- przepisano sekcję „PEŁNY DOSTĘP DO BUILDERA" (usunięto `inspect_available_capabilities`),
- RESPONSIVE: `inspect_responsive` → `inspect_node` + `set_node_styles`,
- BIBLIOTEKA/EXPERIENCE: usunięto nie-selectable discovery tools,
- uczciwa sekcja „UWAGA O ASSETACH" (brak AI asset corridor — bez obietnic).

**Dowód:** word-boundary grep systemPrompt (linie 64–263) — **0 trafień** dla wszystkich 11 banowanych tooli + bare `insert_section`.

**Reguła:** advertised ⊆ union(TOOL_SURFACES) = 25 tooli. REPO (37) ≠ ADVERTISED (25+test_echo nie w promptie).

---

## 2. FAZA 2 — Decyzje A/B/C (8 tooli)

| Tool | Decyzja | Rationale |
|---|:---:|---|
| `insert_section` | **B** | internal/legacy; public path = `insert_section_from_library` |
| `set_background_color` | **B** | superseded by `update_node_props` on EDIT_NODE (runtime proof TEST5) |
| `inspect_experience` | **B** | `search_experiences` covers discovery |
| `get_experience_categories` | **B** | covered by `search_experiences` |
| `insert_node` | **C** | needs parent validation + surface design (guard added) |
| `move_node` | **C** | needs orphan guard + surface design (guard added) |
| `inspect_asset` | **C** | belongs to Asset Corridor Gate |
| `batch_execute` | **C** surface / **REPAIR required** | handler F-03 fixed; surface exposure future gate |

REPO **nie jest czyszczone** — warstwy REPO i EXPOSED są rozdzielone (FAZA 1 rule).

---

## 3. FAZA 3 — `batch_execute` F-03 (obowiązkowa naprawa)

**Plik:** `src/lib/hacp/HacpBridge.ts`

| Przed | Po |
|---|---|
| EXECUTED bez `command` przy >0 operacji (dispatch drop) | Zbiera `collectedCommands[]`; zwraca `commands` + pierwszy `command` |
| 0 mutations → mogło dać EXECUTED | **0 commandów → `CLARIFY`/`FAILED`, nigdy `EXECUTED`** |
| brak walidacji `operations` | pusta/nie-tablica → `FAILED` |
| brak sekwencyjnego workingDoc | ewoluujący `workingDoc` dla kolejnych mutacji |

- Return type `executeToolCall` rozszerzony o `commands?: BuilderCommand[]`.
- `executePlan` zbiera `exec.commands` (batch multi-command nie jest dropowany przy dispatchu).

**Decyzja surface:** `batch_execute` pozostaje **nieadvertised** (C) — naprawa dotyczy uczciwości dispatchu, nie ekspozycji.

---

## 4. FAZA 4 — Uczciwość capability assetów

Prompt deklaruje **brak** AI asset corridor (search/insert).  
A_ABSENT (`search_assets_AI`, `insert_asset_AI`, `duplicate_section_AI`) — poza scope implementacji; usunięte z reklamy promptu.  
UI My Assets / Shutterstock API — poza promptem AI (osobny gate).

---

## 5. FAZA 5 — Orphan guards (F-06)

**Plik:** `src/lib/hacp/HacpBridge.ts`

1. **try/catch** na `applyCommandToDocument` w `verifyCommandExecution` → `INVALID_ARGUMENTS` w diffSummary zamiast throw.
2. **try/catch** wokół `executeToolCall` w pętli `executePlan` → FAILED + `INVALID_ARGUMENTS`.
3. Jawne guardy wymaganych argów (wzorzec `inspect_node`):
   - `move_node` → wymaga `nodeId`
   - `insert_node` → wymaga `parentId`
   - `remove_node` → wymaga `nodeId`
   - `set_node_styles` → wymaga `nodeId`

**Dowód:** orphan probes completed (FORENSIC_HACP_DONE) — zero crash `moveNode(undefined)`.

---

## 6. FAZA 6 — Regression / TEST / TSC / BUILD

| Gate | Wynik | Dowód |
|---|:---:|---|
| Targeted AI tests | **PASS** 440/440 | `npx vitest run src/lib/ai` — 24 files |
| Gate tests (inventory + nofake) | **PASS** 100/100 | ToolInventoryVerification + NoFakeSuccess + related |
| `tsc --noEmit` | **PASS** | czysty |
| `npm run build` (next build) | **PASS** | Compiled + TS + 57 static pages |
| Policy advertised ⊆ surface union | **PASS** | nowy test w ToolInventoryVerification |
| Advertised ∩ REPO_ONLY = ∅ | **PASS** | nowy test |
| REPO = ADVERTISED ∪ REPO_ONLY (disjoint) | **PASS** | inventory summary |
| `batch_execute` 0 cmds ≠ EXECUTED | **PASS** | NoFakeSuccess F-03 suite |
| Orphan guards no-throw | **PASS** | NoFakeSuccess F-06 suite |

### Testy regresyjne (dodane)

`NoFakeSuccess.test.ts`:
- batch mutations → `commands[]` + EXECUTED + dispatch mutates doc
- batch 0 mutations → CLARIFY (nie EXECUTED)
- batch empty/missing operations → FAILED
- `move_node` / `insert_node` / `remove_node` / `set_node_styles` brak args → FAILED no-throw
- valid `move_node` nadal działa

`ToolInventoryVerification.test.ts`:
- REPO_ONLY nigdy advertised
- advertised ⊆ union(TOOL_SURFACES)
- REPO partition: |definitions| = |advertised| + |repoOnly|

### Pre-existing (poza scope, nie blokuje gate)

- `HacpIntentEngine` T37: oczekuje „Cofnij" w CLARIFY, ale AI PROVIDER OFFLINE zwraca komunikat bez „Cofnij" — **potwierdzone stashed (fail bez naszych zmian)**.
- Pełny `npx vitest run` repo: ~456 faili z `.kilo/worktrees/colorful-close/**` (worktree + jsdom/env) — pre-existing, spoza gate scope.

---

## 7. FAZA 7 — Capability matrix (post-repair)

### 7.1 Policy matrix

| Kategoria | Count | Definicja |
|---|---:|---|
| REPO (`BUILDER_TOOL_DEFINITIONS`) | 37 | wszystkie zdefiniowane (w tym test_echo) |
| ADVERTISED (system prompt) | 30 w prose tool list | subset SELECTABLE |
| REPO_ONLY (nieadvertised) | 12 | test_echo + 11 banowanych z promptu |
| SELECTABLE (union surface) | 25 | ToolSurfaceSelector |
| A_ABSENT (capability, nie tool) | 3 | asset search/insert AI, duplicate_section_AI |

### 7.2 Corridor matrix (post-repair)

| Corridor | REPO | SELECTABLE | EXPOSED | EXECUTABLE | DISPATCH | VERIFY | Gate |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Library (search→insert section) | ✅ | ✅ | ✅ | ✅ | ✅ +1 section | ✅ | **PASS** |
| Experience (search→insert) | ✅ | ✅ | ✅ | ✅ | ✅ UPDATE_PROPS | ✅ | **PASS** |
| Inspector (inspect→resolve→edit) | ✅ | ✅ | ✅ | ✅ | ✅ UPDATE_PROPS | ✅ | **PASS** |
| Prompt honesty (advertised ⊆ surface) | n/a | ✅ | ✅ | n/a | n/a | n/a | **PASS** |
| `batch_execute` dispatch honesty | ✅ | ❌ C (nieadvertised) | — | ✅ uczciwy | ✅ `commands[]` / CLARIFY@0 | ✅ | **PASS (repaired)** |
| Orphan args (no crash) | ✅ | n/a | — | ✅ graceful FAILED | ✅ | ✅ | **PASS** |
| Assets AI search/insert | ❌ A | ❌ | — | — | — | — | **OUT OF SCOPE** |
| Content raw (`insert_node`/`move_node` surface) | ✅ | ❌ C (future) | — | guards ✅ | future gate | guards ✅ | **DEFERRED C** |

### 7.3 F-01…F-08 disposition

| ID | Finding | Disposition |
|---|---|---|
| F-01 | 8 tools 0 surface | **DECIDED** A/B/C — REPO kept, prompt cleaned; surfaces future |
| F-02 | 3 A_ABSENT assets | **OUT OF SCOPE** — not advertised |
| F-03 | batch_execute dispatch drop | **REPAIRED** — commands[] + CLARIFY@0 |
| F-04 | prompt advertises non-surface tools | **REPAIRED** — 11 tools removed |
| F-05 | primary free model timeout | pre-existing ops — not in gate code scope |
| F-06 | orphan empty args crash | **REPAIRED** — guards + try/catch |
| F-07 | set_background_color dead | **DECIDED B** — path via update_node_props proven |
| F-08 | CHAT 0 tools | intentional CHAT surface — unchanged |

---

## 8. FAZA 8 — Deploy pipeline

| Step | Status |
|---|---|
| CODE REVIEW (diff scope) | ✅ 4 src files + tests + docs |
| TEST (targeted) | ✅ 440 pass |
| TSC | ✅ |
| BUILD | ✅ next build |
| COMMIT | see git log below |
| PUSH origin/main | see git log below |
| VERCEL PROD | see production verify section |
| PRODUCTION VERIFY | see production verify section |

**Deploy:** `npx vercel --prod --yes` (project `solospot`, `prj_BmG5luviQgKMBZuhXozCYE288yxq`).  
Cel prod verify: `/api/builder/copilot` zdrowy; brak regression build.

---

## 9. SUCCESS CRITERIA

| Criterion | Result |
|---|:---:|
| Prompt nie reklamuje nieistniejących/niewystawionych capability | ✅ |
| `batch_execute` ≠ EXECUTED przy 0 commands | ✅ |
| Korytarze Library / Experience / Inspector działają | ✅ 3/3 |
| Invalid args nie crashują (orphan guards) | ✅ |
| Matrix spójny (advertised ⊆ surface; REPO partition) | ✅ |
| Production verify | ⏳ (w sekcji deploy status) |

---

## 10. Final recommendation

**Recommendation: PASS** (Agent 2 — bez formal ratification).

Zamknięte: F-03 (dispatch), F-04 (prompt honesty), F-06 (orphan crash), decyzje F-01/F-07 (B/C).  
Poza scope i jawnie HOLD/deferred: Asset Corridor (F-02), surface exposure batch/content raw tools, F-05 free-model timeout ops.

*Formal ratification (`FORMALLY RATIFIED 🔒`) — wyłącznie Architect (DECISION / Audit Authority Boundary).*
