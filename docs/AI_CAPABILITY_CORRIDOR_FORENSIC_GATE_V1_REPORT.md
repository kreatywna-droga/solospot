# SOLOSPOT — AI CAPABILITY CORRIDOR FORENSIC GATE v1.0

**Status gate:** **PARTIAL PASS** (korytarze Library / Experience / Inspector kompletne; Assets i batch_execute niekompletne)  
**Data audytu:** 2026-09-23  
**Charakter:** READ-ONLY forensic inventory — `codeChanged: false`, `commit: false`, `push: false`, `deploy: false`

---

## 1. Cel Gate

Udowodnić empirycznie, czy każda deklarowana capability AI w SOLOSPOT Builder przechodzi pełny **corridor**:

```
REPO (zdefiniowana) → SELECTABLE (wybrana przez ToolSurfaceSelector)
→ EXPOSED (wysłana w request.tools) → EXECUTABLE (HacpBridge)
→ MUTATION (BuilderCommand) → DISPATCH (BuilderDocument) → VERIFICATION
```

Failury klasyfikowane jako:

| Kod | Znaczenie |
|---|---|
| **A_ABSENT** | Brak toola w `BUILDER_TOOL_DEFINITIONS` |
| **C_NOT_SELECTABLE** | Tool w REPO i wykonywalny, ale **zero surface** w `ToolSurfaceSelector` |
| **dispatch drop** | Handler zwraca SUCCESS bez `command` → pusty dispatch |
| **PASS** | Pełny łańcuch + `verificationPassed` + zmiana dokumentu |

---

## 2. Artefakty dowodowe

| Artefakt | Rola |
|---|---|
| `scratch/capability-corridor-forensic.mjs` | TEST1 inventory statyczne + TEST1 runtime capture `request.tools` (interceptor `fetch` na `/chat/completions`) |
| `scratch/capability-hacp-corridors.mjs` | TEST3–TEST7 — wykonanie toolów na fixture `BuilderDocument` przez `HacpBridge` + `applyCommandToDocument` |
| `src/lib/ai/BuilderToolDefinitions.ts` | 37 zdefiniowanych toolów (REPO) |
| `src/lib/ai/ToolSurfaceSelector.ts` | Mapowanie intent → minimalny surface toolset |
| `src/lib/ai/AgentOrchestrator.ts` / `OpenCodeProvider.ts` | Ścieżka FREE + agent loop + fallback modeli |
| `src/lib/hacp/HacpBridge.ts` | Exec + `verifyCommandExecution` (FORENSIC GATE NO FAKE SUCCESS) |

---

## 3. TEST1 — Inventory statyczne

**Wynik:** `totalDefinitions: 37`

### 3.1 Grupy capability

| Grupa | Tools | Orphans (0 surface) |
|---|---|---|
| READ | 12 | `inspect_parent`, `inspect_responsive`, `inspect_available_capabilities` |
| LIBRARY | 3 | — |
| EXPERIENCE | 5 | `inspect_experience`, `get_experience_categories` |
| CONTENT | 5 | `insert_node`, `move_node` |
| DESIGN | 6 | `set_background_color`, `set_text`* |
| ASSETS | 1 | `inspect_asset` |
| PAGE | 6 | `insert_section`, `batch_execute` |
| VERIFICATION | 0 | *(to nie tool — protokół `HacpBridge.verifyCommandExecution`)* |

\* `set_text` nie występuje w `ALL_DEFINITIONS` (nazwa w inventory, brak w REPO).

### 3.2 Orphany nigdy nie wybierane przez żaden surface (12)

```
test_echo, insert_section, set_background_color, insert_node,
batch_execute, move_node, inspect_experience, get_experience_categories,
inspect_parent, inspect_responsive, inspect_asset,
inspect_available_capabilities
```

### 3.3 Matrix TEST2 — 30 capability

| Kategoria | Liczba | Lista |
|---|---:|---|
| **SELECTABLE** (kandydat na PASS) | 19 | `inspect_document_summary`, `inspect_page_structure`, `read_page_full`, `inspect_node`, `find_nodes`, `search_sections`, `insert_section_from_library`, `search_experiences`, `insert_experience_from_library`, `configure_experience`, `update_node_props`, `remove_node`, `set_node_styles`, `get_typography_presets`, `get_design_presets`, `update_theme`, `remove_section`, `move_section`, `resolve_target` |
| **C_NOT_SELECTABLE** | 8 | `inspect_experience`, `get_experience_categories`, `insert_node`, `move_node`, `set_background_color`, `inspect_asset`, `insert_section`, `batch_execute` |
| **A_ABSENT** | 3 | `search_assets_AI`, `insert_asset_AI`, `duplicate_section_AI` |

### 3.4 Intent → tools (ścieżka FREE, klasyfikator + surface)

| Prompt | Klasyfikacja | conf. | # tools | Zawiera mutację? |
|---|---|---:|---:|---|
| „Dodaj sekcję testimonials.” | INSERT_SECTION | 0.90 | 4 | library insert |
| „Dodaj experience mesh gradient na Hero.” | INSERT_EXPERIENCE | 0.85 | 4 | experience insert |
| „Zmień tytuł istniejącego Hero…” | EDIT_NODE | 0.85 | 7 | `update_node_props` |
| „Przenieś testimonials na górę.” | MOVE_SECTION | 0.85 | 4 | `move_section` |
| „Usuń sekcję testimonials.” | DELETE | 0.90 | 5 | `remove_*` |
| „Zmień kolor tła sekcji na czerwony.” | **EDIT_NODE** (nie STYLE) | 0.85 | 7 | `update_node_props` |
| „Użyj typography presets premium.” | **STYLE** (nie DESIGN_SYSTEM) | 0.80 | 5 | `set_node_styles` / `update_theme` |
| „Pokaż strukturę strony.” | INSPECT | 0.80 | 5 | read-only |
| „Hej, co potrafisz?” | CHAT | 0.50 | **0** | brak tools |

**Uwaga:** system prompt w `route.ts` reklamuje tooly, których surface nigdy nie wysyła (m.in. `inspect_parent`, `inspect_asset`, `batch_execute`, `set_background_color`) — ryzyko halucynacji modelu wołającego nieistniejący w request.tools tool.

---

## 4. TEST1 — Runtime (capture `request.tools`)

Łańcuch: `AgentOrchestrator` → `OpenCodeProvider.generateWithTools` → interceptor `fetch` na `*/chat/completions`.

| Prompt | Status | Model final | tools w 1. req | toolCalls (mutacje) | Corridor |
|---|---|---|---|---|---|
| Dodaj sekcję testimonials | SUCCESS | `nex-agi/nex-n2.5-pro:free` | 4 (INSERT_SECTION surface) | `insert_section_from_library` | EXPOSED→EXECUTABLE ✅ |
| Dodaj experience mesh gradient | SUCCESS | `nex-agi/nex-n2.5-mini:free` | 4 (INSERT_EXPERIENCE) | `insert_experience_from_library` | EXPOSED→EXECUTABLE ✅ |
| Zmień tytuł Hero | SUCCESS | `nex-agi/nex-n2.5-mini:free` | 7 (EDIT_NODE) | `update_node_props` | EXPOSED→EXECUTABLE ✅ |
| Zmień kolor tła na czerwony | SUCCESS | `nex-agi/nex-n2.5-mini:free` | 7 (EDIT_NODE) | `update_node_props` | EXPOSED→EXECUTABLE ✅ |
| Pokaż strukturę strony | *(przerwany timeout audytu)* | — | — | — | — |
| Hej, co potrafisz? | *(przerwany timeout audytu)* | — | — | — | — |

**Obserwacje runtime:**

1. Primary model `nvidia/nemotron-3.5-lightning:free` — **timeout 15 s** w każdym requestcie; fallback działa (`nex-n2.5-pro` → `nex-n2.5-mini`).
2. Wysłane tools **zgodne** z surface klasyfikatora (EXPOSED = SELECTABLE dla intent).
3. Agent loop kończy się realnym **mutationToolCalls** (INSERT_* / `update_node_props`) — brak fake SUCCESS na tekstowej odpowiedzi.
4. Kolor tła idzie przez **`update_node_props`**, nie `set_background_color` (ten jest C_NOT_SELECTABLE) — ścieżka działa, ale tool dedykowany jest martwy na powierzchni.

---

## 5. TEST3–7 — Korytarze HACP (wykonanie na fixture)

### TEST3 — Library corridor ✅ **COMPLETE**

```
AI → search_sections → Library → insert_section_from_library
  → HACP ADD_SECTION → applyCommandToDocument → dispatch → verify
```

| Metryka | Wartość |
|---|---|
| search | EXECUTED, 8 wyników (`testimonials-cards`…) |
| insert | EXECUTED, `hasCommand: true`, `ADD_SECTION`, `sectionId: section_mue93gof_jq90l` |
| verificationPassed | **true** |
| sectionCount | **2 → 3** |
| `resolveToolExecutionOutcome` | `{ success: true, intent: EXECUTE, executionStatus: EXECUTED }` |
| **corridorComplete** | **true** |

### TEST4 — Experience corridor ✅ **COMPLETE**

```
AI → search_experiences → get_experience_categories
  → insert_experience_from_library → HACP UPDATE_PROPS
  → experienceConfig → Canvas runtime
```

| Metryka | Wartość |
|---|---|
| search | count=20 (`flagship-mirror-hall`…) |
| insert | `UPDATE_PROPS` z `experienceConfig` (background `ambient-blobs` + motion `float`) |
| verificationPassed | **true** |
| document `changed` | **true** |
| **corridorComplete** | **true** |

### TEST5 — Inspector corridor ✅ **COMPLETE**

```
AI → inspect_node → resolve_target → update_node_props
  → UPDATE_PROPS → BuilderDocument → Canvas → verification
```

| Metryka | Wartość |
|---|---|
| inspect | node `sec_hero` odczytany |
| resolve | `direct-name-match`, confidence 0.8 |
| mutate | `backgroundColor: #FF0000`, verification **true** |
| doc after | hero props zmienione; **styles niezmienione** (osobna ścieżka `set_node_styles`) |
| `set_background_color` selectable | **false** (C_NOT_SELECTABLE) |
| **corridorComplete** | **true** |

### TEST6 — Asset corridor ❌ **INCOMPLETE**

| Element | Stan |
|---|---|
| `inspect_asset` | EXECUTED (read-only, węzeł nie-media) — ale **C_NOT_SELECTABLE** |
| `search_assets_AI` | **A_ABSENT** |
| `insert_asset_AI` | **A_ABSENT** |
| UI My Assets / SOLOSPOT Library / Shutterstock API | istnieją po stronie produktu |
| **corridorComplete** | **false** |

**Wniosek:** UI+API istnieją, ale AI HACP ma tylko `inspect_asset` i to niewidoczny dla surface → pełny korytarz AI→asset **nie istnieje**.

### TEST7 — `batch_execute` ❌ **BROKEN (dispatch drop)**

| Metryka | Wartość |
|---|---|
| status | EXECUTED, message „Wykonano 2 operacji” |
| **hasCommand** | **false** (*handler porzuca `res.command` pod-toolów*) |
| selectable in any surface | **false** (C_NOT_SELECTABLE) |
| dispatchWouldBeEmpty | **true** |
| `resolveToolExecutionOutcome(…, 0)` | `{ success: true, intent: CHAT, status: CLARIFY }` |
| Przyjmuje surowe BuilderCommands | nie — tylko `tool`+`args` |
| **Wniosek** | Handler „szeroki”, ale **nigdy wysyłany do modelu** i **nie zwraca command do dispatchu** → fałszywy EXECUTED bez mutacji dokumentu |

### Orphan probes — **AUDYT PRZERWANY**

Pierwszy probe z pustymi argumentami (`move_node` / `insert_node` / …)：

```
Error: Cannot move: Node with ID "undefined" does not exist
  at NodeTree.moveNode (packages/builder-core/src/NodeTree.ts:261)
  at applyCommandToDocument (BuilderCommands.ts:584)
  at HacpBridge.verifyCommandExecution (HacpBridge.ts:157)
  at HacpBridge.executeToolCall (HacpBridge.ts:1202)
```

Skrypt **nie doszedł** do `ORPHAN_TOOL_PROBES` ani `FORENSIC_HACP_DONE`.  
Dowód pośredni: orphany są **wykonywalne** przez `HacpBridge.executeToolCall` (bug jest wewnątrz verify/dispatch, nie „UNSUPPORTED”) → potwierdza model **REPO + EXECUTABLE bez SELECTABLE**.

---

## 6. Zbiorczy matrix korytarzy

| Corridor | REPO | SELECTABLE | EXPOSED (runtime) | EXECUTABLE | DISPATCH | VERIFY | Gate |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Library (insert section) | ✅ | ✅ | ✅ | ✅ | ✅ (+1 sekcja) | ✅ | **PASS** |
| Experience (insert) | ✅ | ✅ | ✅ | ✅ | ✅ (UPDATE_PROPS) | ✅ | **PASS** |
| Inspector (edit node / bg) | ✅ | ✅ | ✅ | ✅ | ✅ (props) | ✅ | **PASS** |
| Content raw (`insert_node`, `move_node`) | ✅ | ❌ C | — | (tak wprost) | n/d | crash przy empty args | **HOLD** |
| Direct `insert_section` / `set_background_color` | ✅ | ❌ C | — | (tak wprost) | n/d | n/d | **HOLD** |
| Assets search/insert AI | ❌ A | ❌ | — | — | — | — | **FAIL A_ABSENT** |
| Assets inspect only | ✅ | ❌ C | — | (tak wprost) | — | read-only | **HOLD** |
| `batch_execute` | ✅ | ❌ C | — | ✅ (fałszywy) | ❌ drop | CLARIFY z 0 cmd | **FAIL dispatch** |
| Verification | protokół HacpBridge (nie tool) | n/a | n/a | ✅ | n/a | ✅ | **PASS** |

---

## 7. Findings (priorytet)

| ID | Finding | Sev. | Dowód |
|---|---|:---:|---|
| **F-01** | 8 capability w REPO i wykonywalnych, **0 surface** (C_NOT_SELECTABLE) — m.in. `set_background_color`, `insert_node`, `move_node`, `inspect_asset`, `batch_execute` | HIGH | TEST2 + ToolSurfaceSelector |
| **F-02** | 3 capability **w ogóle nie istnieją** (A_ABSENT): AI asset search/insert, `duplicate_section_AI` | HIGH | TEST2 matrix |
| **F-03** | `batch_execute` zwraca EXECUTED **bez command** → dispatch pusty; nie jest selectable | HIGH | TEST7 |
| **F-04** | System prompt reklamuje tooly spoza surface → model może halucynować wywołania | MED | TEST1 advertisedInPrompt |
| **F-05** | Primary free model (`nemotron-3.5-lightning:free`) stale timeout 15 s;靠 fallback | MED | TEST1 runtime UPSTREAM |
| **F-06** | Orphan probe z empty args → crash `moveNode(undefined)` weryfikacji zamiast graceful FAIL | MED | TRACE_ERROR w TEST5+ |
| **F-07** | Kolor tła działa only via `update_node_props`; dedykowany `set_background_color` martwy na surface | LOW | TEST5 note |
| **F-08** | CHAT → 0 tools (zamierzone? „co potrafisz?” bez `inspect_available_capabilities`) | LOW | TEST1 CHAT row |

---

## 8. Rekomendacje (poza scope zmian tego audytu)

1. **Dopiąć surface** lub **usunąć z REPO** dla F-01 — zero stanu „istnieje ale niedostępne”.
2. **Zaimplementować** `search_assets_AI` / `insert_asset_AI` albo oficjalnie zdeklarować brak (A_ABSENT → wykreślić z system prompt).
3. **Naprawić `batch_execute`**: zwrócić scalony `command[]` / outer command **albo** usunąć tool z REPO; nie zgłaszać EXECUTED przy 0 mutations.
4. Wyczyścić system prompt z toolów spoza surface (F-04).
5. Orphan probes: guarda na wymagane args → graceful `FAILED` zamiast throw w `moveNode` (F-06).

---

## 9. Werdykt Gate

```
FORENSIC_STATIC_DONE   codeChanged=false  commit=false  push=false  deploy=false
FORENSIC_HACP_DONE     NIE ZALOGOWANE (przerwany po F-06)
```

| Gate criterion | Wynik |
|---|:---:|
| Inventory statyczny 37 toolów + matrix 30 capability | ✅ |
| Runtime EXPOSED = surface dla 4/6 promptów (2 przerwane timeoutem audytu) | ✅ partial |
| Library / Experience / Inspector corridors | ✅ 3/3 COMPLETE |
| Assets corridor | ❌ |
| batch_execute dispatch | ❌ |
| Orphan probe suite completeness | ❌ (crash) |
| Zero zmian kodu / zero commit / zero deploy | ✅ |

### **Recommendation: HOLD** (Agent 2 style — bez formal ratification)

Pełne PASS niemożliwe: otwarte F-01…F-03 + niekompletny suite orphan.  
Trzy główne korytarze użytkownika (biblioteka, experience, edycja węzła) — **dowodowo sprawne end-to-end z verification**.

*Formal ratification (`FORMALLY RATIFIED 🔒`) — wyłącznie Architect (DECISION / Audit Authority Boundary).*
