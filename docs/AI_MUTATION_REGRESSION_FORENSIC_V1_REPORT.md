# SOLOSPOT — AI MUTATION REGRESSION FORENSIC v1.0

**Status:** **CHAIN: FAIL** · **REGRESSION: YES**  
**Data:** 2026-09-23  
**Charakter:** READ-ONLY forensic — `codeChanged: false`, `commit: false`, `push: false`, `deploy: false`  
**Baseline porównawczy:** `docs/AI_END_TO_END_EXECUTION_CHAIN_GATE_V1_REPORT.md` (E2E GATE v1.0, PASS)  
**HEAD:** `278d600` (bez naszych zmian w `src` / `packages`)

**Objaw (raportowany):**

> Wykonałem narzędzia: insert_section_from_library.  
> Nie wprowadziłem zmian w BuilderDocument — liczba sekcji bez zmian, brak nowego węzła.  
> Brakuje kroku mutacji (np. insert_section_from_library). Spróbuj ponownie lub wskaż konkretny szablon z wyników wyszukiwania.

---

## 0. Verdict (Definition of Done — skrót)

| Pole | Wynik |
|---|---|
| **CHAIN** | **FAIL** |
| **FIRST BREAK** | **HACP `insert_section_from_library` handler → `BuilderCommand` (command nie powstaje)** |
| **ROOT CAUSE** | Tool wywołany **bez prawidłowego `sectionTemplateId`** (missing / empty / unknown) → handler zwraca `FAILED` **bez** `command` → `commands.length === 0` → `resolveToolExecutionOutcome` → `CLARIFY` + szablon komunikatu `HacpBridge.ts:1560-1565` |
| **REGRESSION** | **YES** (vs PASS gate I1, które użyło `sectionTemplateId: "testimonials-cards"`) |
| **Klasyfikacja** | **B** — mutation tool wywołany, ale nie zwrócił command |

Dokładne odtworzenie objawu: **S1 / S2 / S4 / S7** (`exactSymptom: true`, message 1:1).

Artefakt: `scratch/mutation-regression-forensic.mjs` → `scratch/mutation-regression-proof/result.json`.

---

## 1. FAZA 1 — Exact reproduction

**User input (klasa requestu):** `Dodaj sekcję testimonials.`  
**Intent:** `INSERT_SECTION` (confidence 0.9) — `IntentClassifier.classify`  
**Capability surface:** `search_sections`, `insert_section_from_library`, `inspect_document_summary`, `inspect_page_structure`  
**Model (kontekst produkcyjny z poprzedniego gate'u):** `OpenCodeProvider` / free-model chain (`nex-agi/…`)  
**Metoda reprodukcji:** izolacja warstwy HACP — `executePlan` z przechwyconym `fetch(/api/builder/copilot)` zwracającym `SUCCESS` + modelowe `toolCalls` (bez realnego LLM; eliminuje flak free-model, nie zmienia kodu app).

### 1.1 Scenariusze i wynik

| ID | toolCalls (model) | Arguments | exactSymptom | commandCount | Document |
|---|---|---|:---:|---:|---|
| **S1** | `insert_section_from_library` | `{ pageId }` (**brak** `sectionTemplateId`) | **YES** | 0 | BEFORE==AFTER |
| **S2** | `insert_section_from_library` | `{ sectionTemplateId: "testimonials-pricing-xyz" }` (unknown) | **YES** | 0 | unchanged |
| S3 | `search_sections` only | `{ query }` | YES* | 0 | unchanged |
| **S4** | `search_sections` + `insert_section_from_library` | insert `{}` | **YES** | 0 | unchanged |
| S5† | insert valid template | wrong `pageId` (harness) | no | 1 | FAILED verify (nie ten objaw) |
| S6† | search + insert valid | wrong `pageId` (harness) | no | 1 | FAILED verify |
| **S7** | `insert_section_from_library` | `{ sectionTemplateId: "" }` | **YES** | 0 | unchanged |

\*S3: lista tooli = `search_sections`, ale **stały** suffix `Brakuje kroku mutacji (np. insert_section_from_library)` — dodatkowa myląca warstwa komunikatu.  
†S5/S6: artefakt harnessa (pageId ≠ document.pageId) — **nie** objaw użytkownika; prawidłowa ścieżka z `testimonials-cards` + correct page → FAZA 2 case C / poprzedni PASS gate.

**Dokładny message (S1/S2/S7)** — 1:1 z objawem:

```text
Wykonałem narzędzia: insert_section_from_library. Nie wprowadziłem zmian w BuilderDocument — liczba sekcji bez zmian, brak nowego węzła. Brakuje kroku mutacji (np. insert_section_from_library). Spróbuj ponownie lub wskaż konkretny szablon z wyników wyszukiwania.
```

---

## 2. FAZA 2 — TRACE `insert_section_from_library` (INPUT → OUTPUT → STATUS)

Handler: `src/lib/hacp/HacpBridge.ts:609-689`  
`executeToolCall` entry: `HacpBridge.ts:235`

| Case | INPUT arguments | STATUS | `command` | OUTPUT message |
|---|---|---|:---:|---|
| A missing templateId | `{}` | **FAILED** | **∅** | `insert_section_from_library wymaga parametru sectionTemplateId…` |
| B unknown template | `{ sectionTemplateId: "does-not-exist-xyz" }` | **FAILED** | **∅** | `Nie znaleziono szablonu sekcji o ID "…"…` |
| C valid template | `{ sectionTemplateId: "testimonials-cards", pageId }` | **EXECUTED** | **ADD_SECTION** | `Wstawiłem sekcję **Testimonials: 3 Star Cards**…` · verify 0→1 PASS |
| D valid + wrong page | `{ sectionTemplateId: "testimonials-cards", pageId: "page-does-not-exist" }` | FAILED | **ADD_SECTION** (jest!) | verify fail — **nie** ten objaw (commands ≠ 0) |
| E search only | `{ query: "testimonials" }` | EXECUTED | **∅** | JSON library results |

**Klucz:** tylko ścieżki **A / B / (exception)** zwracają `FAILED` **bez** `command`.  
Ścieżka D zwraca `command` mimo FAILED → `commands.length > 0` → **inny** komunikat (normalizer / EXECUTE-FAILED), **nie** objaw z raportu.

---

## 3. FAZA 3 — COMMAND FORENSICS

### 3.1 Czy mamy `toolCall → command → dispatch`?

| Scenariusz | toolCall | command | dispatch | Wzorzec |
|---|---|---|---|---|
| S1 / S2 / S4 / S7 (objaw) | ✅ `insert_section_from_library` | **∅** | **∅** | **`toolCall → result → NO command`** |
| FAZA2 case C (kontrast) | ✅ | ✅ `ADD_SECTION` | would dispatch | `toolCall → command → dispatch` |
| S3 (search only) | ✅ search | ∅ | ∅ | read-only → 0 commands (oczekiwane) |

### 3.2 Pola command (gdy powstaje — case C)

| Pole | Wartość |
|---|---|
| `type` | `ADD_SECTION` |
| `pageId` | z args lub `activePageId` |
| `sectionId` | `sectionNode.id` (pre-mint) |
| `children` | pełne poddrzewo template |
| `styles` | `padding`, `backgroundColor`, `textAlign` |
| `createdNodeId` | = `sectionId` |

W objawie (S1/S2/S4/S7) **żadne z tych pól nie istnieje** — handler wraca wcześniej (`HacpBridge.ts:611-628`) bez budowania `cmd`.

### 3.3 Kolekcja w `executePlan` (`HacpBridge.ts:1517-1522`)

```ts
if (exec.commands?.length) commands.push(...exec.commands);
else if (exec.command) commands.push(exec.command);
// FAILED bez command → commands[] pozostaje puste
```

**Odpowiedź na kluczowe pytanie:**  
**`toolCall → result → brak command`** — **NIE** `toolCall → command → dispatch`.

---

## 4. FAZA 4 — BEFORE / AFTER

Dla objawu (S1 jako reprezentant):

| | sectionCount | nodeCount | version |
|---|---:|---:|---:|
| **BEFORE** | 0 | 0 | 1 |
| **COMMAND** | — | — | — |
| **DISPATCH** | — | — | — |
| **AFTER** | **0** | **0** | **1** |

**BEFORE == AFTER**, bo:
1. handler nie wygenerował `BuilderCommand`,
2. `commandsToDispatch = []`,
3. `AiCopilotWorkspace.tsx:692` dispatchuje **tylko** gdy `intent === 'EXECUTE' && commandsToDispatch.length > 0` — przy `CLARIFY` + pusta tablica **nie dispatchuje** (poprawnie — nie ma co dispatchować).

---

## 5. FAZA 5 — STATUS SEMANTICS (generator komunikatu)

**Funkcja:** `HacpBridge.executePlan`  
**Plik:** `src/lib/hacp/HacpBridge.ts:1559-1565`  
**Warunek wejścia:** `commands.length === 0` po pętli tool calls.

```ts
if (commands.length === 0) {
  const executedNames = toolCalls.map((tc) => tc.name).join(', ');
  cleanToolMsg =
    `Wykonałem narzędzia: ${executedNames}. ` +
    `Nie wprowadziłem zmian w BuilderDocument — liczba sekcji bez zmian, brak nowego węzła. ` +
    `Brakuje kroku mutacji (np. insert_section_from_library). Spróbuj ponownie…`;
}
```

| Pytanie | Odpowiedź |
|---|---|
| Jaki status? | `resolveToolExecutionOutcome(false\|true, 0)` → `{ success: true, intent: 'CHAT', executionStatus: 'CLARIFY' }` (`HacpBridge.ts:50-61`) |
| Jakie toolCalls uznane za „wykonane"? | **Wszystkie** z tablicy `toolCalls` (sam fakt obecności + zwrotu z `executeToolCall`), **bez** rozróżnienia SUCCESS/FAILED |
| Dlaczego „brak mutacji"? | `commands.length === 0` → brak `commandsToDispatch` |
| Czy tool result zawierał command? | **NIE** (S1/S2/S4/S7: `hasCommand: false`, `EXECUTION_TRACE TOOL_RESULT`) |
| Czy command odrzucony? | N/A — nigdy nie powstał |
| Verification expected state? | Dla A/B: `verification.passed=false`, operation=`insert_section_from_library`, target=`none` / unknown id — **nie** porównywano BEFORE/AFTER sekcji (brak command) |

### Semantyka `toolExecuted / commandDispatched / mutationVerified`

| Flaga | Wartość w objawie |
|---|:---:|
| `toolExecuted` | **true** (tool był w `toolCalls` i `executeToolCall` zwrócił) |
| `commandDispatched` | **false** (`commands[]` empty) |
| `mutationVerified` | **false** (CLARIFY, document unchanged) |

### Źródło sprzeczności UX (nie fake SUCCESS — zły wording)

1. **`executedNames`** listuje **wywołane** toolCall-y (także `FAILED` bez command) → „Wykonałem narzędzia: insert_section_from_library".  
2. **Static suffix** `Brakuje kroku mutacji (np. insert_section_from_library)` jest **zawsze** doklejany przy `commands.length === 0` — nawet gdy insert w ogóle nie padł (S3: tylko `search_sections` w executedNames, a suffix nadal sugeruje insert).  
3. Stan jest **uczciwy** co do mutacji (CLARIFY, brak dispatch), ale **sprzeczny** w warstwie językowej.

**Nie jest to:** `mutation_ok + response lies` (kat. F).  
**Jest to:** `toolCalled + noCommand + poorly worded honest CLARIFY` (kat. B + defect komunikatu).

---

## 6. FAZA 6 — PORÓWNANIE Z PASS GATE (E2E v1.0)

| Warstwa | PASS gate I1 | Ten regression |
|---|---|---|
| input | `Dodaj sekcję testimonials.` | ta sama klasa requestu |
| model / tools surface | INSERT_SECTION + 4 tools | **identyczne** |
| tool arguments | **`sectionTemplateId: "testimonials-cards"`**, `pageId: "page-home"`, `atIndex: 5` | **brak / empty / unknown** `sectionTemplateId` |
| HACP handler | ten sam kod → EXECUTED + command | ten sam kod → **FAILED bez command** |
| command | `ADD_SECTION` + children | **∅** |
| dispatch | applied | skipped (`CLARIFY`) |
| document | v1→v2, sections 2→3 | **unchanged** |
| verification | PASS | FAIL / no mutation check |
| outcome | `EXECUTED`, chainComplete | **`CLARIFY`**, exactSymptom |

**Nie zakładamy identyczności:** poprzedni PASS szedł fixtures z **poprawnymi argumentami**; ten przypadek łamie się **na argumentach modelu**, nie na zmianie kodu HACP/BuilderDocument.

Dodatkowo (pośredni status, nie first break):  
`AgentOrchestrator.ts:172-175` — obecność **jakiegokolwiek** mutation toolCall (nawet z bad args) → status **SUCCESS** na froncie API. Dopiero HACP w `executePlan` zamyka do CLARIFY. Stąd API może wyglądać „SUCCESS", a user widzi „brak mutacji".

---

## 7. FAZA 7 — CLASSIFICATION

| Kat. | Opis | Pasuje? |
|---|---|:---:|
| A | model nie wywołał mutation tool | **NIE** — message listuje `insert_section_from_library` w `executedNames` ⇒ toolCall istniał |
| **B** | **mutation tool wywołany, ale nie zwrócił command** | **TAK** |
| C | command powstał, brak dispatch | NIE — brak command |
| D | dispatch, document się nie zmienił | NIE |
| E | document zmieniony, verification miss | NIE |
| F | mutacja OK, response kłamie | NIE — mutacji nie było; response co do faktów mówi „brak zmian" |
| G | inny | — |

**Wybrana: B.**

**Mechanizm (dokładnie):**

1. Model/orchestrator umieszcza w `toolCalls`: `insert_section_from_library` **bez** prawidłowego `sectionTemplateId` (lub z nieistniejącym ID).  
2. `HacpBridge.executeToolCall` (`609-628`):  
   - missing/empty → `FAILED`, **brak** `command`;  
   - unknown template → `FAILED`, **brak** `command`.  
3. `executePlan` nie dodaje nic do `commands[]`.  
4. `resolveToolExecutionOutcome(…, 0)` → `CLARIFY`.  
5. Generator `1560-1565` drukuje executed names + stały suffix → **sprzeczny** komunikat.  
6. Workspace nie dispatchuje → **BEFORE == AFTER**.

**Skąd w produkcji bad args?** (hipotezy spójne z kodem, nie mutually exclusive)  
- model hallucinuje/nie kopiuje ID z `search_sections` (prompt `route.ts:195-209` wymusza insert, nie waliduje args);  
- free-model continuation/timeout (`OpenCodeProvider` 15s) — insert z niepełnymi args po partial search;  
- `AgentOrchestrator.createToolCallFromMutation` wstrzykuje insert tylko gdy `extractTemplateId` trafi — inaczej null; **nie** jest głównym źródłem pustego args przy obecnym modelu (wstrzyknięcie wymaga ID).

---

## 8. FAZA 8 — REGRESSION VERDICT

```text
CHAIN:        FAIL
FIRST BREAK:  HACP insert_section_from_library → BuilderCommand
              (HacpBridge.ts:609-628 returns FAILED, no command)
ROOT CAUSE:   insert_section_from_library invoked without a valid
              sectionTemplateId → no BuilderCommand → commands.length===0
              → CLARIFY + contradictory static message (HacpBridge.ts:1560-1565)
              → no dispatch → BuilderDocument unchanged
REGRESSION:   YES
```

| Definition of Done | Dowód |
|---|---|
| 1. exact reproduction | S1/S2/S4/S7 message == objaw |
| 2. actual tool call | `EXECUTION_TRACE TOOL_CALLS_RECEIVED` / `EXECUTING_TOOL` |
| 3. tool result | `TOOL_RESULT` status FAILED, `hasCommand: false`, message handlera |
| 4. command evidence | `command: null`, `commandsToDispatch: []` |
| 5. HACP evidence | `executeToolCall` + `resolveToolExecutionOutcome` + executionCard FAIL |
| 6. dispatch evidence | `dispatchResults: []`; workspace gate `692` nie trafiony |
| 7. BEFORE/AFTER | sectionCount 0→0, nodeCount 0→0, version 1→1 |
| 8. verification | `passed: false`, `operation: insert_section_from_library`, `target: none` |
| 9. final response path | `HacpBridge.ts:1559-1565` (`commands.length === 0` branch) |
| 10. comparison vs PASS | FAZA 6 — delta = **tool arguments** |
| 11. first break | FAZA 2/3 — handler bez command |
| 12. classification | **B** |

---

## 9. Compliance

| Check | Result |
|---|---|
| ZERO code changes (`src`, `packages`) | ✅ clean vs HEAD |
| ZERO commit / push / deploy | ✅ |
| Forensic only under `scratch/` | `mutation-regression-forensic.mjs`, `mutation-regression-proof/result.json` |
| Prompt / surface / HACP / Document / verification **nie ruszane** | ✅ |

**Nie naprawiano** — zgodnie z briefem: najpierw dowód, gdzie łańcuch się zerwał.

---

## 10. Artefakty

| Artefakt | Rola |
|---|---|
| `scratch/mutation-regression-forensic.mjs` | FAZY 1–8, traces + executePlan scenarios |
| `scratch/mutation-regression-proof/result.json` | wektor scenariuszy + classification |
| `src/lib/hacp/HacpBridge.ts:609-689` | handler insert (brak command @ bad args) |
| `src/lib/hacp/HacpBridge.ts:50-61, 1557-1565` | outcome + generator komunikatu |
| `src/components/builder/ai/AiCopilotWorkspace.tsx:692` | dispatch gate |
| `docs/AI_END_TO_END_EXECUTION_CHAIN_GATE_V1_REPORT.md` | baseline PASS |
