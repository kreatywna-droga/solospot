# MAPA_ADAPTER — B14-ARCH-1 Core Extraction Audit

Data audytu: 2026-08-17
Zakres: `.agent-control/` (READ-ONLY)
Uwaga: adapter AURA FACES **nie istnieje** w repo i zgodnie z zadaniem **nie został utworzony**. Grep całego repo po `AURA FACES|AURA_FACES|aura-faces`: 0 trafień — jest to pojęcie planowane, poza obecnym stanem kodu.

---

## 1. Kandydaci ADAPTER

### 1.1 `opencode-adapter.mjs` (230 linii) — ADAPTER (czysty kandydat)

**Rola:** klient ACP (Agent Client Protocol, JSON-RPC 2.0 po stdio) do runtime `opencode.exe`.

**Odpowiedzialności:**
- `runAgent({ role, task, cwd, timeoutMs, configPath })` — spawn procesu `opencode acp`, sekwencja `initialize` → `session/new` → `session/set_config_option` (model) → `session/prompt` → zbieranie `session/update`/`agent_message_chunk` → resolve na `stopReason === "end_turn"`.
- `getAcpTimeout()` — odczyt timeoutu z `runner_config.json` (fallback 60000 ms).
- Mapowanie ról na modele (`MODELS`): developer → `opencode/deepseek-v4-flash-free`, auditor → `opencode/nemotron-3-ultra-free`, planner → `opencode/mimo-v2.5-free`, fallback → `opencode/big-pickle`.

**Coupling / lock-in:**
- **HIGH — ścieżka maszynowa zahardkodowana:** `C:\Users\HP\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe` (linie 10–11). Brak przenośności (CI/CD, inne stacje) bez edycji kodu. Odnotowane także w `.agent-control/B13_REAL_3_AUDIT.md` jako ryzyko.
- **MEDIUM — identyfikatory modeli zahardkodowane** w kodzie zamiast w konfiguracji.
- **LOW — protokół:** czysty JSON-RPC po stdio, zero zależności npm; warstwa transportowa samodzielna.

**Zależności:** `node:child_process`, `node:fs`, `node:path`, `node:url`; odczyt `runner_config.json` (coupling do pliku konfiguracyjnego CORE).

**Konsumenci:** `queue_watcher.mjs` (strategia `acp`, import statyczny) + 39 plików testowych importujących `runAgent` wprost + 10 testów spawnuje `opencode.exe` bezpośrednio, z własnymi kopiami sekwencji ACP (pomijając adapter).

**Ownership:** tor integracji ACP (B13/TEST-007), wykonawczo Developer; granica interfejsu podlega ratyfikacji Architecta.

**Migration risk: MEDIUM.** Plik funkcjonalnie odseparowany (jeden główny eksport), ale: hardcoded path, hardcoded modele, 39 bezpośrednich importerów testowych oraz zduplikowane implementacje ACP w testach (`acp_execution_test.mjs`, `acp_session_test.mjs`).

**Proponowana lokalizacja docelowa (PROPOZYCJA):** `packages/agent-control-adapter-opencode/` z `executablePath` i `models` wstrzykiwanymi przez konfigurację; interfejs zgodny z portem `ExecutionRuntime` definiowanym w CORE.

### 1.2 Strategie dispatchu w `AgentExecutionBridge` (wewnątrz `queue_watcher.mjs`, linie 81–182) — elementy adapterowe do wyniesienia

| Strategia | Charakter | Ocena |
|---|---|---|
| `signal` | zapis `DISPATCH.json` (emisja zdarzenia control-plane) | **CORE** (kontrakt zdarzenia), zapis pliku → port IO |
| `command` | `exec(commandTemplate)` — szablon `opencode run --task {TASK_ID}` | **ADAPTER** (generyczny runner komend; szablon wskazuje konkretny runtime) |
| `acp` | delegacja do `runAgent()` | **ADAPTER** (poprawna delegacja bez duplikacji logiki, zgodnie z B13-G7-5) |
| `customCallback` | haczyk testowy (`setCallback`) | TEST |

### 1.3 `queue_watcher.ps1` (223 linie) — ALTERNATYWNY RUNTIME HOST / duplikat — **UNCERTAIN**

- PowerShellowa re-implementacja watchera: parsing STATE/QUEUE, claim-lock, strategia `signal`, pętla ciągła / `-SingleRun`.
- **Brak strategii `command`/`acp`, brak polityki retry, brak `classifyResult`** — funkcjonalnie podzbiór wersji `.mjs`.
- Zero referencji w repo (skrypty, package.json, testy). Ostatnia modyfikacja 2026-08-15 23:18 (wcześniej niż `.mjs`). **UNCERTAIN: legacy/porzucony czy używany ręcznie — wymaga potwierdzenia u właściciela, nie zgadywać.**
- Klasyfikacja: ADAPTER-host (duplikat platformowy) albo TEST/legacy. **Ryzyko rozbieżności logiki: HIGH** — dwa źródła prawdy dla tej samej maszyny stanu.
- Migration risk: **MEDIUM** (nie blokuje ekstrakcji CORE, ale wymaga decyzji: utrzymać jako port czy wycofać).
- Proponowana lokalizacja: decyzja Architecta — `packages/agent-control-host-powershell/` (jeśli utrzymany) lub `archive/` (jeśli legacy).

### 1.4 Artefakty pełniące rolę kontraktu adaptera

- `DISPATCH.json` — artefakt PROJECT STATE, ale jednocześnie **kontrakt zdarzenia** `DISPATCH_ORCHESTRATOR` dla zewnętrznego runnera. Przy ekstrakcji: schemat zdarzenia → CORE, plik → STATE.
- `runner_config.json::strategies.acp.timeoutMs` (180000) — konfiguracja adaptera ACP rezydująca w pliku CORE (do przeniesienia do konfiguracji adaptera).
- `runner_config.json::strategies.command.commandTemplate` — szablon dla adaptera `command` rezydujący w konfiguracji CORE.

---

## 2. Podsumowanie granicy ADAPTER

- Jeden realny adapter produkcyjny: **OpenCode ACP** (`opencode-adapter.mjs`).
- Jeden generyczny adapter komend: strategia `command` (obecnie osadzona w bridgu).
- Jeden host platformowy o niepotwierdzonym statusie: `queue_watcher.ps1` (UNCERTAIN).
- Adapter **AURA FACES: nieobecny, nie tworzyć** — przyszły punkt integracji dla portu `ExecutionRuntime` po ekstrakcji CORE.

## 3. Rekomendowana kolejność (szczegóły w REKOMENDACJE.md)

1. Zdefiniować port `ExecutionRuntime` w CORE.
2. Wynieść `opencode-adapter.mjs` bez zmiany zachowania, z `executablePath`/`models` z konfiguracji.
3. Podpiąć adapter do bridgu przez wstrzykiwanie (usunąć import statyczny z CORE).
4. Dopiero potem rozważyć adapter AURA FACES.
