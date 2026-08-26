# B14-ARCH-0: AGENT ROLE MODEL & RESPONSIBILITY MATRIX

**Data opracowania:** 2026-08-17  
**Zadanie:** B14-ARCH-0 (AGENT ROLE REARCHITECTURE)  
**Zakres:** WEB FACTOR / B13 / Agent Control  
**Status:** ARCHITECTURAL DESIGN (READ-ONLY BASELINE)

---

## 1. WERYFIKACJA STANU RZECZYWISTEGO (CODE EVIDENCE)

Analiza rzeczywistego kodu w repozytorium wykazała następujący stan faktyczny:

1. **Monolit wykonawczy w `.agent-control/queue_watcher.mjs` (1010 linii):**
   - Łączy w jednym pliku deterministyczne zarządzanie kolejką (`parseQueue`, `markQueueStatus`), maszynę stanu (`parseState`, `writeState`), mechanizm blokad (`acquireLock`, `releaseLock`), logikę retry (`getRetryLimit`, `routeRetryDecision`, `evaluateRetryDecision`), planowanie wykonania (`createExecutionPlan`, `executeExecutionPlan`) oraz mostek dispatchu (`AgentExecutionBridge`).
   - Klasa `AgentExecutionBridge` posiada bezpośredni, statyczny import `runAgent` z `./opencode-adapter.mjs` (linia 5), co narusza zasadę Dependency Inversion.

2. **Adapter OpenCode w `.agent-control/opencode-adapter.mjs` (230 linii):**
   - Implementuje protokół ACP (Agent Control Protocol, JSON-RPC 2.0 przez stdio) uruchamiający proces potomny `opencode.exe`.
   - Posiada zahardkodowaną ścieżkę do pliku wykonywalnego (`C:\Users\HP\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe`) oraz zahardkodowany słownik modeli (`MODELS`).

3. **Rozmycie pojęciowe w definicjach ról (`.agents/agents/`):**
   - W `.agents/agents/orchestrator/agent.md` zdefiniowano rolę Orchestratora ze sformułowaniem: *"You are the control plane of the agent system"* oraz powierzono mu zarządzanie maszyną stanów, sprawdzanie zależności i rejestrowanie retry.
   - W rzeczywistości te same operacje (zarządzanie stanem, retry limit, parsowanie kolejki) wykonuje deterministyczny skrypt `queue_watcher.mjs`.
   - Powoduje to konflikt: czy orkiestracją steruje model LLM (podatny na halucynacje i zużywający tokeny), czy deterministyczny silnik B13?

4. **Brak roli Planner w `.agents/agents/`:**
   - W `opencode-adapter.mjs` zdefiniowano model dla roli `planner` (`opencode/mimo-v2.5-free`), lecz w katalogu `.agents/agents/` rola ta nie posiadała dotąd formalnej definicji ani workflow.

---

## 2. TRZYPOZIOMOWY MODEL ODPOWIEDZIALNOŚCI (3-TIER ARCHITECTURE)

Docelowa architektura B14 wprowadza ścisły podział na 3 odrębne warstwy:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 2: EXPERT / ESCALATION PLANE                                      │
│ Antigravity (Google DeepMind Agentic AI)                                │
│ • Architektura bazowa, ADR, eskalacje krytyczne, decyzje człowieka       │
└─────────────────────────────────────────────────────────────────────────┘
                                ▲
                         ESCALATION / RESUME
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: AUTONOMOUS AI WORKERS PLANE                                    │
│ OpenCode Runtime (Local / Free Specialized LLMs)                        │
│ • Orchestrator Agent (synteza kontekstu, routing semantyczny)           │
│ • Developer Agent (implementacja kodu, lokalna walidacja)               │
│ • Auditor Agent (niezależna weryfikacja dowodowa, PASS/HOLD)            │
│ • Planner Agent (dekompozycja epików na atomowe zadania QUEUE)          │
└─────────────────────────────────────────────────────────────────────────┘
                                ▲
                      EXECUTION RUNTIME PORT
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 0: DETERMINISTIC CONTROL PLANE                                    │
│ B13 Control Engine (Pure Node.js Runtime — ZERO LLM TOKENS)            │
│ • Queue management (QUEUE.md) & State transitions (STATE.md)            │
│ • Dependency resolution & Atomic claim locks (.claim.lock)              │
│ • Retry policy enforcement & Lifecycle timeouts                         │
│ • Dispatch routing & Contract schema validation                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. SPECYFIKACJA WARSTW I RÓL

### 3.1 LEVEL 0 — DETERMINISTIC CONTROL (B13 Control Engine)

B13 Control Engine jest **deterministycznym silnikiem wykonawczym i zarządczym**, działającym bez udziału modeli językowych (0 tokenów LLM).

- **Odpowiedzialność:**
  1. *Queue Management:* Parsowanie `QUEUE.md`, identyfikacja zadań `READY`, weryfikacja spełnienia zależności `DEPENDENCIES` (`parseQueue`, `findNextExecutableTask`).
  2. *State Machine:* Atomowe przejścia stanów w `STATE.md` (`parseState`, `writeState`) z wykorzystaniem bezpiecznego zapisu przez pliki tymczasowe `.tmp` i operację `rename`.
  3. *Concurrency & Locking:* Zarządzanie blokadami wyłączności (`acquireLock`, `releaseLock`) na zasobach zadania.
  4. *Retry Enforcement:* Deterministyczne zliczanie prób, porównywanie z limitem (`getRetryLimit`, `routeRetryDecision`, `evaluateRetryDecision`), blokada pętli nieskończonych.
  5. *Execution Planning:* Tworzenie planów wykonawczych (`createExecutionPlan`, `executeExecutionPlan`) określających akcje dyspozytora.
  6. *Dispatch Routing:* Emisja zdarzeń `DISPATCH.json` (dla zewnętrznych runnerów) lub wywołanie portu `ExecutionRuntime`.
  7. *Contract Syntax Validation:* Deterministyczna walidacja poprawności nagłówków (`# TASK RESULT`, `# AUDIT RESULT`, pól `STATUS`, `RECOMMENDATION`) przed dopuszczeniem do kolejnego etapu.
  8. *Timeout & Watchdog:* Nadzór nad czasem wykonania agentów i ubijanie zawieszonych procesów.

- **Czego B13 Engine NIE robi:**
  - Nie generuje promptów ani kodu.
  - Nie ocenia jakości semantycznej implementacji (to zadanie Auditora).
  - Nie podejmuje uznaniowych decyzji architektonicznych.

---

### 3.2 LEVEL 1 — AUTONOMOUS AI WORKERS (OpenCode Runtime)

Wszystkie role Level 1 są agentami AI uruchamianymi w środowisku OpenCode przez port `ExecutionRuntime`.

#### A. ORCHESTRATOR AGENT
- **Cel:** Semantyczna koordynacja zadania, synteza precyzyjnego kontekstu dla Developera/Auditora, dekompozycja podzadań na poziomie kontekstowym.
- **Wejście:** Definicja zadania z B13, stan repozytorium, historia poprzednich audytów (w przypadku retry).
- **Wyjście:** Ustrukturyzowany pakiet wykonawczy dla Developera lub żądanie eskalacji.
- **Odpowiedzialność:** Przygotowanie precyzyjnego promptu, mapowanie plików kontekstowych, analiza przyczyn błędów na poziomie semantycznym.
- **Czego NIE wolno robić:** Nie mutuje bezpośrednio `STATE.md` ani `QUEUE.md` (to rola silnika B13); nie pisze kodu produkcyjnego; nie omija Auditora.
- **Kiedy uruchamiany:** Na początku cyklu zadania lub po otrzymaniu raportu audytu wymagającego interpretacji semantycznej.
- **Sugerowany model:** `opencode/mimo-v2.5-free` lub `opencode/deepseek-v4-flash-free`.
- **Informacje zwracane do B13:** Wynik orkiestracji (`ORCHESTRATION DECISION`).

#### B. DEVELOPER AGENT
- **Cel:** Implementacja pojedynczego zadania zgodnie z kontraktem i zatwierdzoną architekturą.
- **Wejście:** Opis zadania, kryteria akceptacji, wskazania architektoniczne, lista defektów z audytu (przy retry).
- **Wyjście:** Zmiany w kodzie/plikach oraz raport `# TASK RESULT`.
- **Odpowiedzialność:** Edycja plików, wykonanie lokalnych testów jednostkowych, weryfikacja typów TypeScript, analiza własnego diffa.
- **Czego NIE wolno robić:** Nie modyfikuje architektury platformy; nie zmienia publicznych kontraktów; nie decyduje o zakończeniu zadania (wymaga audytu).
- **Kiedy uruchamiany:** W stanie `IN_PROGRESS` lub `RETRY`.
- **Sugerowany model:** `opencode/deepseek-v4-flash-free`.
- **Informacje zwracane do B13:** Raport `# TASK RESULT` (STATUS: COMPLETE | BLOCKED | ESCALATE | FAILED).

#### C. AUDITOR AGENT
- **Cel:** Niezależna, obiektywna weryfikacja dowodowa wykonanego zadania (Read-Only).
- **Wejście:** Treść zadania, raport Developera, Git diff, wyniki testów.
- **Wyjście:** Ustrukturyzowany raport `# AUDIT RESULT`.
- **Odpowiedzialność:** Samodzielne uruchomienie testów/linterów, weryfikacja każdego kryterium akceptacji, analiza zakresu (in-scope vs out-of-scope), wykrywanie regresji.
- **Czego NIE wolno robić:** Nie modyfikuje kodu źródłowego; nie naprawia błędów za Developera; nie wydaje statusu PASS bez twardych dowodów.
- **Kiedy uruchamiany:** W stanie `AUDIT` po zgłoszeniu `COMPLETE` przez Developera.
- **Sugerowany model:** `opencode/nemotron-3-ultra-free` (wysoka skrupulatność w analizie faktów i logiki).
- **Informacje zwracane do B13:** Raport `# AUDIT RESULT` (RECOMMENDATION: PASS | HOLD, ARCHITECT_ESCALATION: YES | NO).

#### D. PLANNER AGENT
- **Cel:** Dekompozycja złożonych wymagań/funkcjonalności na sekwencję atomowych zadań dla kolejki B13.
- **Wejście:** Specyfikacja funkcjonalna, architektura modułu, stan repozytorium.
- **Wyjście:** Zestaw zadań w formacie `QUEUE.md` z jawnymi kryteriami akceptacji i grafem zależności `DEPENDENCIES`.
- **Odpowiedzialność:** Zapewnienie atomowości zadań, poprawność grafu DAG (brak cykli), precyzyjne określenie kryteriów testowych.
- **Czego NIE wolno robić:** Nie implementuje kodu; nie steruje bieżącym wykonaniem pętli B13.
- **Kiedy uruchamiany:** Przed rozpoczęciem nowego pakietu prac lub na żądanie dekompozycji złożonego epiku.
- **Sugerowany model:** `opencode/mimo-v2.5-free`.
- **Informacje zwracane do B13:** Gotowa struktura zadań do dopisania do `QUEUE.md`.

---

### 3.3 LEVEL 2 — EXPERT / ESCALATION (Antigravity)

Antigravity jest instancją nadrzędną, pełniącą rolę **Głównego Architekta i Trybunału Eskalacyjnego**.

- **Zasada działania:** *"Antigravity is invoked by exception, not by default."*
- **Warunki wywołania eskalacji do Antigravity:**
  1. `RETRY_EXHAUSTED`: Wyczerpanie limitu prób retry (np. 3 nieudane próby z tym samym defektem).
  2. `ARCHITECTURAL_CONFLICT`: Wykrycie naruszenia granic domenowych, izolacji Multi-Tenant lub reguł SSOT (`ARCHITECT_ESCALATION: YES`).
  3. `BREAKING_CONTRACT_CHANGE`: Konieczność modyfikacji publicznego API, interfejsu rdzennego pakietu lub ratyfikowanego ADR.
  4. `SECURITY_BOUNDARY_VIOLATION`: Zagrożenie dla architektury bezpieczeństwa.
  5. `UNRESOLVED_AMBIGUITY`: Sprzeczność w dokumentacji projektowej uniemożliwiająca jednoznaczną interpretację.
  6. `HUMAN_REVIEW_REQUIRED`: Decyzje wymagające autoryzacji człowieka (wpływ na produkcję, zmiana Master Planu).

- **Odpowiedzialność Antigravity:**
  - Wydanie wiążącej decyzji architektonicznej (`ARCHITECTURE REVIEW`).
  - Uzupełnienie/ratyfikacja ADR.
  - Sformułowanie precyzyjnych wytycznych naprawczych dla Developera lub wstrzymanie zadania i zaparkowanie stanu w `HUMAN_REVIEW`.
  - Po wydaniu decyzji sterowanie wraca do deterministycznego silnika B13.
