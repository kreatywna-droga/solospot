# B14 ARCHITECTURE RATIFICATION

**TASK ID:** B14-ARCH-0-RATIFICATION  
**DATA RATYFIKACJI:** 2026-08-17  
**TRYB:** READ-ONLY AUDIT & FORMAL ARCHITECTURE RATIFICATION  
**ZAKRES:** WEB FACTOR / B13 / B14 / Agent Control  

---

## STATUS: RATIFIED (APPROVE_WITH_CONDITIONS)

---

## 1. ARCHITECTURE_DECISION

### Ocena Głównej Decyzji Architektonicznej (OPTION C)

**Decyzja:** Rozdzielenie **B13 Control Engine** (deterministyczny silnik sterowania) od **Orchestrator Agent** (agent kognitywny AI) oraz ustanowienie 3-poziomowego modelu odpowiedzialności:
- **LEVEL 0 — DETERMINISTIC CONTROL:** B13 Control Engine (0 tokenów LLM, 100% kod Node.js).
- **LEVEL 1 — AUTONOMOUS AI WORKERS:** OpenCode Workers (Orchestrator, Developer, Auditor, Planner).
- **LEVEL 2 — EXPERT / ESCALATION:** Antigravity (Google DeepMind Agentic AI).

**Werdykt audytowy:** **PASS**

### Uzasadnienie w oparciu o stan rzeczywisty repozytorium:
1. Weryfikacja kodu `queue_watcher.mjs` (1010 linii) potwierdza, że mechanizmy blokad atomowych (`acquireLock`, `releaseLock`), atomowego zapisu stanu (`writeState` przez `.tmp` + `renameSync`), parsowania kolejki (`parseQueue`, `markQueueStatus`) oraz obliczania retry (`getRetryLimit`, `routeRetryDecision`, `evaluateRetryDecision`) są już w 100% zaimplementowane deterministycznie w kodzie JavaScript.
2. Poprzednia definicja w `.agents/agents/orchestrator/agent.md` błędnie przypisywała agentowi LLM rolę „control plane”, co tworzyło niebezpieczny dualizm decyzyjny (konflikt między deterministycznym kodem a podatnym na halucynacje modelem LLM) oraz generowało zbędne zużycie tokenów na mechaniczny nadzór pętli.
3. Rekomendacja Opcji C usuwa ten konflikt i przywraca czystą separację odpowiedzialności.

---

## 2. ROLE_SEPARATION

Zweryfikowano formalny podział odpowiedzialności między poszczególnymi rolami:

| Rola / Komponent | Warstwa | Odpowiedzialności w B14 | Status weryfikacji |
|---|---|---|---|
| **B13 Control Engine** | Level 0 | State (`STATE.md`), Queue (`QUEUE.md`), Locks (`.claim.lock`), Retry policy (`routeRetryDecision`), Dispatch (`AgentExecutionBridge`), Lifecycle timeouts, Contract syntax validation. Zero operacji LLM. | **PASS** |
| **Orchestrator Agent** | Level 1 | Semantyczna orkiestracja, synteza kontekstu zadania, precyzyjne przygotowanie promptów, analiza semantyczna przyczyn błędów, pakietowanie eskalacji. Brak bezpośrednich mutacji plików stanu. | **PASS** |
| **Planner Agent** | Level 1 | Dekompozycja złożonych epików i wymagań na atomowe zadania z grafem zależności `DEPENDENCIES` zasilające `QUEUE.md`. Brak implementacji kodu. | **PASS** |
| **Developer Agent** | Level 1 | Implementacja kodu w ramach zatwierdzonej architektury, uruchamianie lokalnej walidacji (`test`, `tsc`, `lint`), generowanie raportu `# TASK RESULT`. Brak prawa do samodzielnej zmiany architektury. | **PASS** |
| **Auditor Agent** | Level 1 | Niezależna, dowodowa weryfikacja (Read-Only), samodzielne uruchomienie testów, weryfikacja kryteriów akceptacji i diffa, wystawienie rekomendacji `# AUDIT RESULT` (`PASS` / `HOLD`). Brak naprawiania kodu. | **PASS** |
| **Antigravity** | Level 2 | Najwyższa instancja architektoniczna i eskalacyjna. Rozstrzyganie sporów domenowych, ratyfikacja ADR, decyzje krytyczne dla bezpieczeństwa/izolacji, decyzje przy wyczerpaniu retry, kierowanie do człowieka (`HUMAN_REVIEW`). | **PASS** |

---

## 3. TOKEN_MODEL

### Weryfikacja zasady: *"Antigravity by exception, not by default"*

**Ocena wykonalności:** **WYKONALNE I ZGODNE Z KODEM**

1. **Kto obecnie uruchamia agentów:** W kodzie `queue_watcher.mjs` wywołanie agentów realizuje `AgentExecutionBridge` (linie 81–182). W trybie `acp` bridge wywołuje lokalny proces OpenCode przez `runAgent()` z `opencode-adapter.mjs`.
2. **Gdzie znajduje się decyzja o dispatchu:** W deterministycznych funkcjach `evaluateAndResume()` i `executeExecutionPlan()` w `queue_watcher.mjs`.
3. **Gdzie znajduje się polityka retry:** W deterministycznej funkcji `routeRetryDecision()` w `queue_watcher.mjs`.
4. **Gdzie znajduje się cykl życia (lifecycle):** W deterministycznej maszynie stanów `queue_watcher.mjs`.
5. **Ukryte zależności od Antigravity:** 
   - W dotychczasowej strategii `signal` (domyślnej w `runner_config.json`) tworzony był plik `DISPATCH.json`, na który musiał reagować zewnętrzny runner/człowiek/Antigravity.
   - W strategii `acp` (przetestowanej w zadaniach B13-REAL-2 i B13-REAL-3) wykonanie odbywa się w 100% lokalnie w OpenCode bez udziału Antigravity.
   - B13 Engine w trybie oczekiwania (polling/watchdog) działa w pętli zdarzeń Node.js, zużywając **0 tokenów LLM**.

---

## 4. NIGHT_RUN

### Klasyfikacja gotowości mechanizmów autonomicznego biegu nocnego:

| Funkcjonalność Nocnego Runu | Status w obecnym kodzie | Szczegóły techniczne i dowody z kodu |
|---|---|---|
| **Autonomous Task Chaining** | **PARTIALLY SUPPORTED** | `evaluateAndResume()` automatycznie wykrywa stan `WAITING`, pobiera kolejne zadanie `READY` z spełnionymi zależnościami i przestawia stan na `IN_PROGRESS`. *Luka:* Automatyczne domknięcie pętli `Developer COMPLETE -> Auditor AUDIT -> Next Task` w trybie ciągłym wymaga zintegrowania wywołania audytu w pętli wykonawczej. |
| **Developer $\leftrightarrow$ Auditor Retry** | **PARTIALLY SUPPORTED** | Deterministyczny licznik retry, algorytm `routeRetryDecision()`, limit prób `getRetryLimit()` oraz oznaczanie `DEVELOPER_RETRY` w kolejce są w pełni zaimplementowane. *Luka:* W `AgentExecutionBridge.dispatchAcp()` zahardkodowano wywołanie wyłącznie `role: 'developer'`. |
| **Escalation Trigger** | **DESIGN ONLY / PARTIAL** | Klasyfikacja `ARCHITECT_REVIEW` w `classifyResult()` jest zaimplementowana, lecz automatyczny wyzwalacz powiadomienia sesji Antigravity z poziomu Node.js wymaga wdrożenia mechanizmu IPC/sygnału. |
| **HUMAN_REVIEW Parking** | **ALREADY SUPPORTED** | `executeExecutionPlan()` poprawnie zapisuje stan `HUMAN_REVIEW` w `STATE.md` i `QUEUE.md` oraz ustawia `HUMAN_REVIEW_REQUIRED: YES`. |
| **Clean Resume** | **ALREADY SUPPORTED** | `evaluateAndResume()` bezproblemowo podejmuje pracę po restarcie procesu z zachowaniem stanu w `STATE.md`. |
| **Parkowanie i omijanie zablokowanych zadań** | **DESIGN ONLY** | `findNextExecutableTask()` iteruje liniowo po zadaniach `READY` ze spełnionymi zależnościami; zaawansowane dynamiczne szeregowanie DAG jest zaprojektowane, lecz wymaga rozszerzenia parsera. |

---

## 5. CONTRACT_STATUS

### Status wdrożenia 6 minimalnych kontraktów B14:

| Kontrakt | Status w kodzie | Analiza implementacyjna |
|---|---|---|
| **TASK CONTRACT** | **PARTIAL** | Format tekstowy w `QUEUE.md` (`STATUS`, `TYPE`, `DEPENDENCIES`, `NEXT_STAGE`) jest parsowany przez `parseQueue()`. Formalna walidacja schematu JSON jest na etapie projektu. |
| **DEVELOPER RESULT** | **PARTIAL** | Format `# TASK RESULT` jest zdefiniowany w `.agents/agents/developer/agent.md` i rozpoznawany przez `classifyResult()`. Walidacja pełnej struktury pól jest na etapie projektu. |
| **AUDIT RESULT** | **PARTIAL** | Format `# AUDIT RESULT` jest zdefiniowany w `.agents/agents/auditor/agent.md`, a `classifyResult()` weryfikuje statusy `PASS`/`HOLD` oraz flagę `ARCHITECT_ESCALATION`. |
| **ORCHESTRATOR DECISION** | **DESIGN ONLY** | Zdefiniowany w dokumentacji ról, brak dedykowanego parsera w `queue_watcher.mjs`. |
| **ARCHITECT DECISION** | **PARTIAL** | Format `# ARCHITECTURE REVIEW` jest zdefiniowany w `.agents/agents/architect/agent.md` i rozpoznawany jako `architect_result` w `classifyResult()`. |
| **ESCALATION REQUEST** | **DESIGN ONLY** | Zaprojektowany w `B14_ARCH_0_CONTRACTS.md`; wymaga implementacji generatora pakietu w B13 CORE. |

---

## 6. EXECUTION_RUNTIME

### Ocena granicy: `B13 CORE` $\rightarrow$ `ExecutionRuntime` $\rightarrow$ `Adapter`

**Werdykt:** **APPROVE_WITH_CONDITIONS**

Granica portu jest poprawna architektonicznie i umożliwia pełną wymienność adapterów (`OpenCodeAdapter`, a w przyszłości `AuraFacesAdapter`). 

### Wymagania uzupełniające kontrakt `ExecutionRuntime` przed fizyczną ekstrakcją:
1. **Dynamiczne przekazywanie roli:** Usunięcie hardcodowania `role: 'developer'` w adapterze i bridgu na rzecz dynamicznego `execute({ role, task, context, timeoutMs, cwd })`.
2. **Sygnał anulowania (AbortSignal):** Dodanie obsługi `AbortSignal` w celu natychmiastowego i czystego ubijania zawieszonych procesów potomnych.
3. **Strumieniowanie / Event Callbacki:** Opcjonalny callback zdarzeń (`onProgress` / `onChunk`) umożliwiający logowanie postępów bez naruszania izolacji stanu.
4. **Zunifikowana taksonomia błędów:** Rozróżnienie błędów infrastrukturalnych (timeout, brak pliku binarnego, błąd JSON-RPC) od błędów wykonawczych modelu.

---

## 7. IMPLEMENTATION_GAPS

Przed przystąpieniem do pełnej autonomii wielogodzinnej zidentyfikowano następujące luki implementacyjne do zrealizowania w kolejnych zadaniach:
1. **GAP-1 (Bridge Role Decoupling):** W `queue_watcher.mjs` metoda `dispatchAcp` posiada sztywne odwołanie do `role: 'developer'`. Należy sparametryzować wywołanie dla wszystkich ról Level 1 (`orchestrator`, `developer`, `auditor`, `planner`).
2. **GAP-2 (Static Import Inversion):** Statyczny import `import { runAgent } from './opencode-adapter.mjs'` w linii 5 `queue_watcher.mjs` musi zostać zastąpiony wstrzykiwaniem instancji `ExecutionRuntime` do konstruktora `AgentExecutionBridge`.
3. **GAP-3 (Configuration Decoupling):** Zahardkodowane ścieżki i słownik modeli w `opencode-adapter.mjs` muszą zostać przeniesione do konfiguracji.
4. **GAP-4 (Closed-Loop Continuous Execution):** Połączenie w pętli watchera pełnego łańcucha: pobranie zadania $\rightarrow$ Developer $\rightarrow$ Auditor $\rightarrow$ (Retry / Complete / Escalate) $\rightarrow$ kolejne zadanie.

---

## 8. CRITICAL_RISKS

1. **Brak zautomatyzowanego test harnessa:** W repozytorium znajduje się 65 skryptów testowych `test_007_*.mjs`, lecz brak jednego polecenia `npm test`, co stwarza ryzyko przeoczenia regresji podczas fizycznej ekstrakcji.
2. **Zależność maszynowa ścieżki OpenCode:** Zahardkodowana ścieżka `C:\Users\HP\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe` uniemożliwia uruchomienie w środowiskach CI/CD bez parametryzacji.
3. **Status `queue_watcher.ps1`:** Plik PowerShell stanowi niepotwierdzony duplikat logiki; zaleca się jego formalną archiwizację lub zamrożenie.

---

## 9. BLOCKERS

**Brak blokerów architektonicznych.**  
Architektura B14 jest spójna, logicznie domknięta i gotowa do fazy implementacyjnej.

---

## 10. RECOMMENDATION

# **APPROVE_WITH_CONDITIONS**

### Warunki ratyfikacji (Mandatory Conditions):
1. **Warunek 1:** Fizyczna ekstrakcja B13 CORE (`packages/agent-control-core`) musi zachować pełną niezależność od tokenów (0 tokenów w Level 0).
2. **Warunek 2:** Port `ExecutionRuntime` musi zostać zaimplementowany zgodnie z zasadą Dependency Inversion (brak statycznego importu adaptera w kodzie CORE).
3. **Warunek 3:** Luki implementacyjne GAP-1 do GAP-4 muszą zostać zaplanowane jako dedykowane zadania realizacyjne przed uruchomieniem wielogodzinnych biegów nocnych.
4. **Warunek 4:** Adapter AURA FACES nie może być tworzony przed ukończeniem i przetestowaniem portu `ExecutionRuntime` na adapterze OpenCode.
