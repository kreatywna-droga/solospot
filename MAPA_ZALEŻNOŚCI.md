# MAPA_ZALEŻNOŚCI — B14-ARCH-1 Core Extraction Audit

Data audytu: 2026-08-17
Zakres: `.agent-control/` (106 plików) + referencje zewnętrzne z całego repo.

---

## 1. Graf zależności produkcyjnych (rdzeń)

```
queue_watcher.mjs
 ├── import: ./opencode-adapter.mjs  (runAgent — strategia ACP, import STATYCZNY)
 ├── odczyt/zapis: runner_config.json
 ├── odczyt/zapis: STATE.md          (parseState / writeState — atomowy rename)
 ├── odczyt/zapis: QUEUE.md          (parseQueue / markQueueStatus — atomowy rename)
 ├── zapis:      DISPATCH.json       (strategia signal — kontrakt zdarzenia)
 ├── zapis:      watcher.log         (log append)
 ├── odczyt/zapis/usuwanie: .claim.lock (claim-lock; obecnie nieobecny na dysku — artefakt runtime)
 └── node builtins: fs, path, url, child_process (exec — strategia command)

opencode-adapter.mjs
 ├── spawn: C:\Users\HP\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe  [HARDcoded, maszynowo-zależne]
 ├── odczyt: runner_config.json (strategies.acp.timeoutMs)
 └── node builtins: child_process, fs, path, url

queue_watcher.ps1
 ├── samodzielny (zero importów); duplikuje logikę .mjs (podzbiór)
 ├── odczyt/zapis: STATE.md, QUEUE.md, DISPATCH.json, watcher.log, .claim.lock, runner_config.json
 └── status: UNCERTAIN (brak referencji w repo)

runner_config.json ── konsumowany przez: queue_watcher.mjs, opencode-adapter.mjs, queue_watcher.ps1
```

**Brak zależności npm** we wszystkich plikach produkcyjnych `.agent-control` — wyłącznie `node:*` builtins.

## 2. Referencje z zewnątrz katalogu

- Grep całego repo po `agent-control`, `queue_watcher`, `opencode-adapter`: **trafienia wyłącznie wewnątrz `.agent-control/`** (52 pliki, wszystkie self-reference).
- `package.json` (root): **brak skryptów** odwołujących się do `.agent-control`.
- `src/`, `packages/` (78 pakietów), `docs/`: **brak importów/referencji**.
- Powiązanie procesowe (nie kodowe): `.agents/agents/{orchestrator,developer,auditor,architect}/agent.md` + `.agents/workflows/*.md` — definicje ról governance, do których STATE.md odwołuje się semantycznie (`LAST_AGENT: ORCHESTRATOR` itd.). To powiązanie **koncepcyjne, nie importowe**.

**Wniosek:** blast radius ekstrakcji ogranicza się do `.agent-control/` — zero konsumentów zewnętrznych.

## 3. Coupling testowe (największe źródło ryzyka migracyjnego)

| Konsument | Cel | Liczba plików | Charakter |
|---|---|---|---|
| `test_007_*.mjs` + `tasks/TEST-006/test_watcher.mjs` | import z `queue_watcher.mjs` | **18** | importują eksporty wprost (`parseState`, `parseQueue`, `findNextExecutableTask`, `classifyResult`, `evaluateAndResume`, `AgentExecutionBridge`, `acquireLock`, `releaseLock`, funkcje retry itd.) — powierzchnia eksportów = de facto kontrakt |
| `test_007_*.mjs`, `test_adapter.mjs` | import z `opencode-adapter.mjs` | **39** | wywołują `runAgent()` wprost |
| `acp_test.mjs`, `acp_session_test.mjs`, `acp_execution_test.mjs`, część `test_007_*` | spawn `opencode.exe` bezpośrednio | **10** | własne kopie sekwencji JSON-RPC ACP — **duplikacja logiki adaptera w testach** |
| `test_007_b13_g*.mjs` | spawn `node` z promptami implementacyjnymi | część serii g* | testy-drivery zadań B13 (prompt → wynik), nie unit-testy |

Uwaga metodologiczna: klasyfikacja 65 skryptów testowych oparta na pełnym odczycie próbki (m.in. `test_007_b13_g1`, `test_007_b13_g7_5`, `test_adapter`, `acp_execution_test`, nagłówki `acp_test`/`acp_session_test`) oraz analizie importów grepem dla całości. Nie czytano w całości każdego z 65 plików — klasyfikacja TEST/B13-SPECIFIC jest dla nich bezpieczna ze względu na nazewnictwo i strukturę importów, ale pojedyncze pliki nie były weryfikowane linia po linii.

## 4. Macierz coupling (pliki produkcyjne)

| Plik | Afferent (kto mnie używa) | Efferent (kogo używam) | Sprzężenie |
|---|---|---|---|
| `queue_watcher.mjs` | 18 testów; zero zewn. | opencode-adapter, config, 5 artefaktów stanu, node builtins | **HIGH** — centralny hub |
| `opencode-adapter.mjs` | queue_watcher + 39 testów | opencode.exe (absolutna ścieżka), config | **HIGH** — vendor/machine lock |
| `runner_config.json` | watcher, adapter, ps1 | — | MEDIUM — współdzielony przez 3 konsumentów |
| `STATE.md` / `QUEUE.md` | watcher (mjs + ps1), testy | — | MEDIUM — kontrakt formatu tekstowego |
| `DISPATCH.json` | watcher (zapis), hipotetyczny zewn. runner (odczyt) | — | MEDIUM — kontrakt zdarzenia, konsument zewnętrzny nieobecny w repo |
| `watcher.log` | watcher (append) | — | LOW |
| `queue_watcher.ps1` | nikt (brak referencji) | artefakty stanu | LOW technicznie / HIGH procesowo (duplikacja logiki) |
| `queue_watcher.mjs.b13-g7-5-backup` | nikt | — | LOW — backup, rozjazd 132 linie diff z aktualnym |

## 5. Zależności czasowe / środowiskowe

- `runner_config.json::strategies.signal.signalPath = ".agent-control/DISPATCH.json"` — **ścieżka względna, zależna od cwd** procesu watchera.
- `watcher.log` potwierdza uruchomienia strategii `command` z `node -e` (testy B13-G7) — watcher był realnie wykonywany w trybie testowym.
- `queue_watcher.mjs` ma **mieszane końcówki linii CRLF/LF** — mechaniczne ryzyko przy rozcinaniu pliku (narzędzia diff/patch).
- Zależność od konkretnej maszyny: absolutna ścieżka `C:\Users\HP\...` w adapterze i w 10 testach.
