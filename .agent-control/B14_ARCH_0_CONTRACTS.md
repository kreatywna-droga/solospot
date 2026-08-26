# B14-ARCH-0: INTER-AGENT & ENGINE CONTRACTS SPECIFICATION

**Data opracowania:** 2026-08-17  
**Zadanie:** B14-ARCH-0 (AGENT ROLE REARCHITECTURE)  
**Zakres:** WEB FACTOR / B13 / Agent Control  
**Status:** ARCHITECTURAL DESIGN (READ-ONLY BASELINE)

---

## 1. STRUKTURA KONTRAKTÓW MIĘDZYAGENTOWYCH

Wszystkie interakcje w architekturze B14 opierają się na sformalizowanych, minimalnych kontraktach danych (zarówno w formacie Markdown dla czytelności i promptingu, jak i JSON dla komunikacji maszynowej w portach wykonawczych).

---

### 1.1 TASK CONTRACT (B13 Engine $\rightarrow$ Orchestrator / Developer)

Kontrakt przekazujący zadanie do wykonania z kolejki do agenta wykonawczego.

- **Źródło:** B13 Control Engine (`QUEUE.md` / `STATE.md`).
- **Następny konsument:** Orchestrator Agent / Developer Agent.
- **Wymagane pola:**
  - `taskId` (string): Identyfikator zadania (np. `TASK-001`).
  - `type` (string): Typ zadania (np. `DEV`, `FEATURE`, `BUGFIX`, `REFACTOR`).
  - `objective` (string): Precyzyjny cel zadania.
  - `acceptanceCriteria` (array<string>): Lista jednoznacznych, weryfikowalnych kryteriów sukcesu.
  - `dependencies` (array<string>): Lista zadań, które musiały zostać ukończone przed startem.
  - `retryCount` (number): Aktualna liczba wykonanych prób.
  - `retryLimit` (number): Maksymalna dopuszczalna liczba prób przed eskalacją.
- **Opcjonalne pola:**
  - `targetFiles` (array<string>): Sugerowana lista plików podlegających zmianom.
  - `previousDefects` (array<object>): W przypadku retry — lista defektów wskazanych przez Audytora.
  - `architecturalGuidance` (string): Wytyczne od Architekta/Antigravity (jeśli zadanie wraca po eskalacji).
- **Statusy:** `READY`, `IN_PROGRESS`, `RETRY`.

---

### 1.2 DEVELOPER RESULT (Developer $\rightarrow$ B13 Engine / Auditor)

Ustrukturyzowany raport wykonawczy generowany przez Developer Agent po zakończeniu implementacji.

- **Źródło:** Developer Agent (OpenCode).
- **Następny konsument:** B13 Control Engine (walidacja nagłówka) $\rightarrow$ Auditor Agent (weryfikacja).
- **Wymagane pola (Format: `# TASK RESULT`):**
  - `TASK_ID` (string): Identyfikator zadania.
  - `STATUS` (enum): `COMPLETE` | `BLOCKED` | `ESCALATE` | `FAILED`.
  - `OBJECTIVE` (string): Podsumowanie zrealizowanego celu.
  - `IMPLEMENTATION` (string): Opis wprowadzonych modyfikacji.
  - `FILES_CHANGED` (array<string>): Kompletna lista zmienionych plików.
  - `VALIDATION` (array<{ command, result, evidence }>): Zestawienie uruchomionych poleceń testowych/linterów.
  - `ACCEPTANCE_CRITERIA` (array<{ criterion, result, evidence }>): Weryfikacja każdego kryterium akceptacji.
  - `ARCHITECTURE_IMPACT` (enum): `NONE` | `LOW` | `MATERIAL` | `REQUIRES_ARCHITECT_REVIEW`.
  - `NEXT_ACTION` (string): Dokładnie jedno zalecane działanie.
  - `HANDOFF` (string): Zwięzłe podsumowanie dla kolejnego agenta.
- **Opcjonalne pola:**
  - `DECISIONS` (array<string>): Istotne decyzje implementacyjne.
  - `RISKS` (array<string>): Zidentyfikowane ryzyka i dług techniczny.
  - `BLOCKERS` (string): Opis zewnętrznych blokerów (jeśli status `BLOCKED`).

---

### 1.3 AUDIT RESULT (Auditor $\rightarrow$ B13 Engine / Orchestrator)

Niezależny raport weryfikacji dowodowej generowany przez Auditor Agent.

- **Źródło:** Auditor Agent (OpenCode).
- **Następny konsument:** B13 Control Engine $\rightarrow$ Orchestrator Agent (przy HOLD) lub State Finalizer (przy PASS).
- **Wymagane pola (Format: `# AUDIT RESULT`):**
  - `TASK_ID` (string): Identyfikator zadania.
  - `RECOMMENDATION` (enum): `PASS` | `HOLD`.
  - `EVIDENCE_REVIEW` (string): Zestawienie zbadanego materiału dowodowego (Git diff, stan plików).
  - `ACCEPTANCE_CRITERIA` (array<{ criterion, result: PASS|FAIL, evidence }>): Niezależna ocena kryteriów.
  - `TEST_VALIDATION` (array<{ command, result: PASS|FAIL, evidence }>): Wyniki niezależnie uruchomionych testów.
  - `ARCHITECTURE_REVIEW` (enum): `COMPLIANT` | `NON_COMPLIANT` | `ARCHITECT_ESCALATION`.
  - `SCOPE_REVIEW` (enum): `IN_SCOPE` | `OUT_OF_SCOPE`.
  - `DEFECTS` (array<{ severity: HIGH|MEDIUM|LOW, file, problem, evidence, requiredCorrection }>): Lista defektów (lub `NONE`).
  - `ARCHITECT_ESCALATION` (enum): `YES` | `NO`.
  - `NEXT_ACTION` (string): Dokładnie jedna akcja dla orkiestracji.
  - `HANDOFF` (string): Podsumowanie audytowe.
- **Opcjonalne pola:**
  - `RISKS` (array<string>): Ryzyka regresji lub wydajnościowe.

---

### 1.4 ORCHESTRATOR DECISION (Orchestrator $\rightarrow$ B13 Engine)

Decyzja semantyczna i pakiet dyspozycji przygotowany przez Orchestrator Agent.

- **Źródło:** Orchestrator Agent (OpenCode).
- **Następny konsument:** B13 Control Engine.
- **Wymagane pola:**
  - `taskId` (string): Identyfikator zadania.
  - `action` (enum): `DISPATCH_DEVELOPER` | `DISPATCH_AUDITOR` | `ESCALATE_ARCHITECT` | `PARK_HUMAN`.
  - `targetAgent` (enum): `developer` | `auditor` | `architect`.
  - `preparedContext` (object): Precyzyjnie przygotowany prompt i kontekst dla wybranego agenta.
  - `reason` (string): Uzasadnienie podjętej decyzji routingowej.
- **Opcjonalne pola:**
  - `subtasks` (array<object>): W przypadku wewnętrznej dekompozycji w locie.

---

### 1.5 ARCHITECT DECISION (Architect / Antigravity $\rightarrow$ B13 Engine)

Formalna decyzja architektoniczna i rozstrzygnięcie sporu eskalacyjnego.

- **Źródło:** Architect Agent (OpenCode) lub Antigravity (Level 2).
- **Następny konsument:** B13 Control Engine $\rightarrow$ Developer Agent.
- **Wymagane pola (Format: `# ARCHITECTURE REVIEW`):**
  - `TASK_ID` (string): Identyfikator zadania.
  - `DECISION` (enum): `APPROVE` | `RETURN_TO_DEVELOPER` | `ARCHITECTURAL_CHANGE_REQUIRED` | `HUMAN_APPROVAL_REQUIRED`.
  - `ARCHITECTURAL_IMPACT` (enum): `NONE` | `LOW` | `MATERIAL` | `HUMAN_REQUIRED`.
  - `COMPLIANCE` (string): Stan zgodności z architekturą platformy i ADR.
  - `EVIDENCE` (array<string>): Dokumenty, ADRy i pliki będące podstawą decyzji.
  - `REQUIRED_ACTION` (string): Konkretne wytyczne architektoniczne i ograniczenia naprawcze.
  - `HUMAN_DECISION_REQUIRED` (enum): `YES` | `NO`.
  - `HANDOFF` (string): Maszynowe podsumowanie decyzji.
- **Opcjonalne pola:**
  - `ADR_REFERENCE` (string): Identyfikator odnośnego ADR (np. `DECISION-042`).
  - `DOWNSTREAM_IMPACT` (string): Konsekwencje dla innych modułów i domen.

---

### 1.6 ESCALATION REQUEST (B13 Engine / Orchestrator $\rightarrow$ Antigravity)

Zwarty pakiet danych generowany w momencie eskalacji do najwyższego poziomu kognitywnego.

- **Źródło:** B13 Control Engine.
- **Następny konsument:** Antigravity (Level 2).
- **Wymagane pola:**
  - `taskId` (string): Identyfikator zadania.
  - `escalationType` (enum): `RETRY_EXHAUSTED` | `ARCHITECTURAL_CONFLICT` | `BREAKING_CONTRACT_CHANGE` | `SECURITY_BOUNDARY_VIOLATION` | `UNRESOLVED_AMBIGUITY`.
  - `summary` (string): Zwięzły opis problemu (max 3–5 zdań).
  - `question` (string): Precyzyjne pytanie architektoniczne wymagające rozstrzygnięcia.
  - `gitDiff` (string): Skrócony diff ostatniej próby implementacji.
  - `auditDefects` (array<object>): Wyciąg z tabeli defektów audytu.
  - `relevantAdrReferences` (array<string>): Wskazanie powiązanych zasad projektowych.
- **Opcjonalne pola:**
  - `developerRationale` (string): Uzasadnienie wyboru technicznego przedstawione przez Developera.
