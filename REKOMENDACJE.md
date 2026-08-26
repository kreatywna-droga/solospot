# REKOMENDACJE — B14-ARCH-1 Core Extraction Audit

Data audytu: 2026-08-17
Charakter: rekomendacje audytowe. Zgodnie z Code Evidence Audit Protocol v2.8 formalna ratyfikacja (`FORMALLY RATIFIED`) należy wyłącznie do Architecta. **Nie implementowano żadnych zmian.**

---

## 1. Klasyfikacja — podsumowanie (106 plików)

| Kategoria | Pliki | Liczba |
|---|---|---|
| CORE | `queue_watcher.mjs` (moduły czyste + orkiestracja; wymaga rozcięcia), `runner_config.json` (częściowo) | 2 |
| ADAPTER | `opencode-adapter.mjs`, strategie `command`/`acp` w bridgu (do wyniesienia), `queue_watcher.ps1` (UNCERTAIN) | 2 + elementy |
| PROJECT STATE | `STATE.md`, `QUEUE.md`, `DISPATCH.json`, `watcher.log`, `.claim.lock` (runtime, obecnie nieobecny), `queue_watcher.mjs.b13-g7-5-backup` | 6 |
| PROJECT GOVERNANCE | `B13_REAL_2_RESULT.md`, `B13_REAL_3_AUDIT.md`, `tasks/` (29 rekordów md w 9 katalogach TEST-001…TEST-007) | 31 |
| TEST / B13-SPECIFIC | 65 skryptów `.mjs` (61× `test_007_*` + `acp_test` + `acp_session_test` + `acp_execution_test` + `test_adapter`) + `tasks/TEST-006/test_watcher.mjs` | 66 |

Suma > 106, bo `queue_watcher.mjs` liczony jest raz jako plik CORE, a jego wewnętrzne elementy adapterowe wskazane są osobno do wyniesienia.

## 2. Rekomendowana kolejność ekstrakcji (gdy B14 zostanie zatwierdzone)

1. **Ratyfikacja granic** — Architect zatwierdza podział z MAPA_CORE/MAPA_ADAPTER oraz docelowe lokalizacje (propozycja: `packages/agent-control-core/`, `packages/agent-control-adapter-opencode/`). Bez tego nie ruszać plików.
2. **Safety net przed ruchem** — dodać minimalny runner uruchamiający kluczowe testy (g1–g7) jako skrypt npm; inaczej regresja będzie niewidoczna (R2).
3. **Decyzja o `queue_watcher.ps1`** — potwierdzić status u właściciela; utrzymać jako port albo wycofać do `archive/` (R4). Nie zgadywać.
4. **Ekstrakcja czystych funkcji CORE** — parsery, `classifyResult`, polityka retry, `createExecutionPlan`, `findNextExecutableTask`; bez zmiany sygnatur; shim re-export w `queue_watcher.mjs` na czas przejścia (R1).
5. **Wydzielenie portów IO** — state store (STATE/QUEUE), lock, event emitter (DISPATCH.json) za interfejsy; schemat zdarzenia `DISPATCH_ORCHESTRATOR` do CORE (R6).
6. **Parametryzacja i ruch adaptera** — `executablePath` i `models` do konfiguracji; wstrzykiwanie adaptera do `AgentExecutionBridge` zamiast importu statycznego (R3).
7. **Rozszczepienie konfiguracji** — `runner_config.json` → config CORE + config adaptera + ścieżki projektu; `signalPath` absolutny lub względny do pliku configu, nie do cwd (R5).
8. **Stan i governance** — artefakty runtime zostają w `.agent-control/` (lub `.agent-control/state/`); rekordy `tasks/` i `B13_REAL_*` → archiwum governance po zakończeniu programu B13; `tasks/TEST-005-B` oznaczyć jako niekompletny (R9).
9. **Testy** — przenieść 65 skryptów do katalogu testów pakietu dopiero po ustabilizowaniu nowych importów; testy z własnymi kopiami ACP oznaczyć jako testy protokołu, nie adaptera (R8).
10. **AURA FACES** — dopiero po punkach 1–7: nowy adapter za portem `ExecutionRuntime`. Obecnie brak specyfikacji — **nie projektować w ciemno**.

## 3. Czego NIE robić

- Nie przenosić `queue_watcher.mjs` w całości jako „CORE" — przeniesie splot IO/dispatch do warstwy domenowej.
- Nie usuwać ani nie „naprawiać" `queue_watcher.ps1` bez decyzji właściciela.
- Nie traktować backupu `b13-g7-5-backup` jako źródła ekstrakcji (dryf 132 linie).
- Nie zmieniać formatów STATE.md / QUEUE.md / DISPATCH.json podczas migracji — to kontrakty konsumowane przez testy i (deklaratywnie) zewnętrzny runner.
- Nie tworzyć adaptera AURA FACES (zgodnie z zadaniem i z braku specyfikacji).

## 4. Blokery przed startem ekstrakcji

1. **Brak specyfikacji B14 w repo** — grep `B14`: 0 trafień; docelowe lokalizacje są propozycją audytu, wymagają ratyfikacji.
2. **Status `queue_watcher.ps1`** — UNCERTAIN.
3. **Brak automatycznego runnera testów** — warunek bezpiecznej migracji.
4. **Brak specyfikacji AURA FACES** — blokuje jedynie projekt przyszłego adaptera, nie ekstrakcję CORE.

## 5. Rekomendacja końcowa

**Recommendation: PASS do fazy planowania ekstrakcji; HOLD na wykonanie (przenosiny plików) do czasu: (a) ratyfikacji granic przez Architecta, (b) rozstrzygnięcia statusu `queue_watcher.ps1`, (c) dodania runnera testów.**

Struktura `.agent-control` jest zdrowym kandydatem do ekstrakcji: zero konsumentów zewnętrznych, zero zależności npm, jasno wydzielony adapter. Główne ryzyko leży wewnątrz — w monolitycznym watcherze i ręcznym trybie testowania.
