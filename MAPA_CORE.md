# MAPA_CORE — B14-ARCH-1 Core Extraction Audit

Data audytu: 2026-08-17
Zakres: `.agent-control/` (READ-ONLY, bez zmian w plikach produkcyjnych)
Status: AUDYT — nic nie zostało przeniesione ani utworzone poza raportami.

---

## 1. Kandydaci CORE (logika domenowa control-plane, niezależna od środowiska)

### 1.1 `queue_watcher.mjs` (1010 linii) — CORE z zagnieżdżonym mostkiem dispatchu

Plik jest **monolitem o mieszanych odpowiedzialnościach**. W ramach ekstrakcji wymaga rozcięcia na warstwy. Poniżej klasyfikacja na poziomie modułów/eksportów:

| Element (eksport) | Klasyfikacja | Uzasadnienie |
|---|---|---|
| `parseState()` | CORE | Czysty parser formatu STATE.md, zero IO, zero zależności środowiskowych |
| `parseQueue()` | CORE | Czysty parser QUEUE.md (nagłówki `##`/`###`, STATUS/TYPE/DEPENDENCIES/NEXT_STAGE) |
| `findNextExecutableTask()` | CORE | Czysta funkcja wyboru zadania READY z spełnionymi zależnościami |
| `classifyResult()` | CORE | Klasyfikacja wyników agentów (developer_complete / auditor_pass / auditor_hold / architect_result) — kontrakt cyklu życia B13 |
| `getRetryLimit()` / `routeRetryDecision()` / `evaluateRetryDecision()` | CORE | Polityka retry (RETRY_DEVELOPER vs HUMAN_REVIEW), czysta logika decyzyjna; `getRetryLimit` czyta config (IO — do oddzielenia) |
| `createExecutionPlan()` | CORE | Mapowanie decyzji na plan wykonania (DISPATCH_DEVELOPER / PARK_HUMAN_REVIEW / NOOP) |
| `writeState()` / `markQueueStatus()` | CORE (warstwa persystencji) | Atomowy zapis przez plik tymczasowy + rename; format plików jest kontraktem CORE, ale operacje fs to IO — kandydat na port/repozytorium |
| `acquireLock()` / `releaseLock()` | CORE (mechanizm) | Claim-lock przez plik `.claim.lock` — mechanizm koordynacji, IO do wydzielenia |
| `executeExecutionPlan()` | CORE (orkiestracja) | Wykonanie planu: zapis stanu + aktualizacja kolejki; deleguje dispatch |
| `evaluateAndResume()` | CORE (orkiestracja) | Główna pętla decyzyjna WAITING→IN_PROGRESS; zawiera tryby read-only (decisionOnly/executionPlanOnly) |
| `createDeveloperDispatchRequest()` | CORE | Walidacja żądania dispatchu developera |
| `AgentExecutionBridge` (klasa, linie 81–182) | **MIESZANY — granica CORE/ADAPTER** | Abstrakcja dispatchu jest CORE, ale strategie `command` (exec) i `acp` (import `runAgent`) to zachowania adapterowe; strategia `signal` (zapis DISPATCH.json) to emisja zdarzenia control-plane |
| `log()` | CORE (infrastruktura) | Append do watcher.log — IO, trywialny |
| CLI runner (linie 979–1010) | CORE (entry point) | Tryb ciągły / `--single-run` |

**Kluczowe spostrzeżenie:** CORE jest obecny, ale spleciony z IO i dispatchiem w jednym pliku. Ekstrakcja = rozcięcie, nie przeniesienie.

### 1.2 `runner_config.json` (19 linii) — konfiguracja CORE (częściowo projektowa)

- `defaultStrategy`, `strategies.*.enabled`, `lockTimeoutMs` → konfiguracja CORE.
- `strategies.signal.signalPath = ".agent-control/DISPATCH.json"` → **ścieżka względna, zależna od cwd** — element projektowy w konfiguracji CORE (UNCERTAIN: rozszczepić na config core + config projektu).
- `strategies.command.commandTemplate = "opencode run --task {TASK_ID}"` → referencja do konkretnego runtime (adapterowe).
- `strategies.acp.timeoutMs = 180000` → konfiguracja adaptera ACP.

### 1.3 Elementy NIE będące CORE (dla kompletności granicy)

- `opencode-adapter.mjs` → ADAPTER (patrz MAPA_ADAPTER.md).
- `queue_watcher.ps1` → alternatywna implementacja/runtime host — patrz MAPA_ADAPTER.md.
- `STATE.md`, `QUEUE.md`, `DISPATCH.json`, `watcher.log` → PROJECT STATE.
- `B13_REAL_*.md`, `tasks/` → GOVERNANCE / TEST.
- `test_007_*.mjs`, `acp_*.mjs`, `test_adapter.mjs` → TEST / B13-SPECIFIC.

---

## 2. Charakterystyka CORE

- **Zależności zewnętrzne CORE:** wyłącznie `node:fs`, `node:path`, `node:url`, `node:child_process` (exec — strategia command). Zero zależności npm. Zero importów z reszty projektu (`src/`, `packages/`).
- **Coupling wychodzący:** bezpośredni import `./opencode-adapter.mjs` (runAgent) w strategii ACP — **CORE zależy od ADAPTERA statycznie**; docelowo adapter powinien być wstrzykiwany (inversion).
- **Coupling przychodzący:** 18 plików testowych importuje eksporty `queue_watcher.mjs` wprost (lista w MAPA_ZALEŻNOŚCI.md) — powierzchnia eksportów jest de facto kontraktem testowym.
- **Brak referencji z zewnątrz `.agent-control/`** — potwierdzone grep całego repo (włącznie z package.json): zero skryptów/importów. Ekstrakcja ma zerowy blast radius poza katalogiem.

## 3. Ownership

- Właściciel domenowy: warstwa Orchestrator (control plane) — zgodnie z `.agents/agents/orchestrator/agent.md` ("You are the control plane of the agent system").
- Autorstwo zmian dotychczas: zadania B13/TEST-006/TEST-007 (Developer pod nadzorem Auditora, protokół z AGENTS.md).
- Formalna ratyfikacja granic CORE: **Architect** (zgodnie z Code Evidence Audit Protocol v2.8 — audytor wydaje tylko rekomendację).

## 4. Proponowana lokalizacja docelowa (PROPOZYCJA — wymaga ratyfikacji Architecta)

Zgodnie z konwencją monorepo (`packages/`):

- `packages/agent-control-core/` — parsery, polityka retry, maszyna stanu, model kolejki, planowanie wykonania, interfejs `ExecutionBridge` + porty (state store, lock, event emitter).
- `packages/agent-control-core/src/bridge/` — `AgentExecutionBridge` po odcięciu od strategii środowiskowych.
- Entry point CLI (continuous watch / single-run) → `packages/agent-control-core/bin/` lub pozostawienie cienkiego runnera w `.agent-control/`.

## 5. Migration risk (CORE)

- **HIGH** — nie z powodu zależności zewnętrznych (ich brak), lecz z powodu: (a) monolitycznego splotu CORE+IO+dispatch w jednym pliku 1010 linii, (b) 18 testów importujących dokładny kształt eksportów, (c) mieszanych końców linii CRLF/LF w pliku (ryzyko mechaniczne przy rozcinaniu), (d) braku zautomatyzowanego runnera testów (regresja wykrywana ręcznie).
