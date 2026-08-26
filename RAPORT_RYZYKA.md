# RAPORT_RYZYKA — B14-ARCH-1 Core Extraction Audit

Data audytu: 2026-08-17
Zakres: `.agent-control/` (READ-ONLY). Skala: LOW / MEDIUM / HIGH.

---

## HIGH

### R1 — Rozcięcie monolitu `queue_watcher.mjs`
- 1010 linii, splot CORE (parsery, polityka retry, maszyna stanu) + IO (fs) + dispatch (bridge z exec/spawn) + CLI runner w jednym pliku.
- Mieszane końcówki linii CRLF/LF utrudniają mechaniczne rozcinanie i review diffów.
- 18 plików testowych importuje dokładny kształt eksportów — każda zmiana sygnatur/psucie kolejności eksportów psuje zestaw testów.
- Łagodzenie: ekstrakcja krokami (najpierw czyste funkcje, potem IO, na końcu bridge), bez zmiany nazw eksportów w trakcie przejścia (re-export shim).

### R2 — Brak zautomatyzowanego runnera testów
- 65 skryptów testowych to ad-hoc `.mjs` z ręcznie odczytywanym PASS/FAIL w konsoli; zero integracji z `package.json` / CI.
- Podczas migracji regresja będzie wykrywana ręcznie → ryzyko cichych złamań kontraktu (`classifyResult`, format STATE.md/QUEUE.md, schemat DISPATCH.json).

### R3 — Vendor/machine lock w adapterze
- `opencode-adapter.mjs`: zahardkodowana absolutna ścieżka `C:\Users\HP\AppData\Roaming\npm\...\opencode.exe` + zahardkodowane identyfikatory modeli. Ta sama ścieżka powielona w 10 testach.
- Ekstrakcja bez parametryzacji przeniesie lock-in do nowej struktury.

### R4 — Duplikacja logiki watchera w `queue_watcher.ps1` (UNCERTAIN status)
- Druga implementacja maszyny stanu (podzbiór: brak retry, command, acp, classifyResult). Zero referencji — niepotwierdzone, czy używana.
- Jeśli utrzymać bez decyzji: dwa rozbiegające się źródła prawdy dla STATE/QUEUE.

## MEDIUM

### R5 — Konfiguracja mieszana CORE/projekt w `runner_config.json`
- Współdzielona przez 3 konsumentów (mjs, adapter, ps1); zawiera zarówno politykę CORE (defaultStrategy, lockTimeoutMs), jak i dane adapterów (acp.timeoutMs, commandTemplate) oraz ścieżkę projektową (signalPath, względną — zależną od cwd).

### R6 — Kontrakt zdarzenia `DISPATCH.json` bez konsumenta w repo
- Zdarzenie `DISPATCH_ORCHESTRATOR` jest zapisywane, ale żaden runner w repo go nie konsumuje (`runtimeIntegrationStatus: EVENT_DISPATCHED_AWAITING_RUNNER_INTEGRATION`). Przy ekstrakcji schemat musi trafić do CORE mimo braku żywego konsumenta — inaczej kontrakt zaginie.

### R7 — Dryf backupu `queue_watcher.mjs.b13-g7-5-backup`
- 132 linie diff względem aktualnego watchera. Jako artefakt testowy OK, ale przy sprzątaniu łatwo pomylić wersje (ryzyko omyłkowego użycia starej kopii jako źródła ekstrakcji).

### R8 — Duplikacja protokołu ACP w testach
- 10 testów z własnymi kopiami sekwencji JSON-RPC zamiast użycia adaptera. Po przeniesieniu adaptera testy te nie zweryfikują nowej lokalizacji — fałszywe poczucie pokrycia.

### R9 — Niekompletne rekordy zadań
- `tasks/TEST-005-B/` zawiera wyłącznie `task.md` (brak wyników). Governance trail jest niepełny — przy archiwizacji oznaczyć jako niekompletny, nie usuwać.

## LOW

### R10 — Artefakty runtime (`watcher.log`, `.claim.lock`, `DISPATCH.json`, `STATE.md`, `QUEUE.md`)
- Zawartość to dane testowe (MODE: TEST, zadania TEST-*/TASK-00*). Przeniesienie/reset trywialny; format plików to jedyny trwały kontrakt.

### R11 — Dokumenty B13 (`B13_REAL_2_RESULT.md`, `B13_REAL_3_AUDIT.md`)
- Rekordy audytowe; archiwizacja bez ryzyka technicznego.

### R12 — Brak zależności npm i brak konsumentów zewnętrznych
- Pozytyw: ekstrakcja nie wymaga zmian w `src/`, `packages/`, `package.json` ani CI.

---

## Elementy UNCERTAIN (nie zgadywać — wymagają decyzji/potwierdzenia)

| Element | Niepewność |
|---|---|
| `queue_watcher.ps1` | legacy/porzucony czy aktywnie używany — brak referencji nie dowodzi porzucenia (mógł być uruchamiany ręcznie) |
| `runner_config.json` | proporcja CORE vs projekt — `signalPath` i `commandTemplate` to elementy projektowe w pliku CORE |
| Docelowa struktura katalogów | brak specyfikacji B14 w repo (grep `B14`: 0 trafień) — lokalizacje w tych raportach są PROPOZYCJĄ, wymagają ratyfikacji Architecta |
| AURA FACES | brak jakiejkolwiek specyfikacji w repo — zakres przyszłego adaptera nieznany |
| `tasks/TEST-005-B` | zadanie nigdy nie wykonane czy wyniki utracone — nieustalone |
