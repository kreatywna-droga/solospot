# AUDIT ARCHITEKTURY AGENT CONTROL — B13-REAL-3

TASK ID: B13-REAL-3
ROLE: DEVELOPER
TARGET: .agent-control/queue_watcher.mjs
DATA AUDYTU: 2026-08-16

---

## 1. Jak działa AgentExecutionBridge
`AgentExecutionBridge` (zdefiniowany w liniach 81–182 pliku `queue_watcher.mjs`) stanowi centralną warstwę abstrakcji dyspozytora zadań (execution dispatcher) w systemie Agent Control.
* Odczytuje konfigurację za pomocą `loadConfig()` (z pliku `runner_config.json` lub wartości domyślnych).
* Główna metoda `dispatch(task, context)` sprawdza wybraną strategię (`this.config.defaultStrategy || 'signal'`).
* Obsługuje rejestrację opcjonalnego callbacku testowego (`setCallback`) – jeśli jest ustawiony, wykonuje `customCallback(task, context)`.
* W trybie produkcyjnym kieruje zadanie do jednej z trzech strategii wykonawczych: `command`, `acp` lub domyślnej `signal`.

---

## 2. Jak działa strategia ACP
Strategia `acp` jest aktywowana, gdy `strategy === 'acp'` oraz `config.strategies.acp.enabled === true`.
* Wywołuje dedykowaną metodę asynchroniczną `dispatchAcp(task, context)`.
* Ekstrahuje treść promptu dla dewelopera z kontekstu (`context.developerTask || context.task || 'Execute task ${task.id}.'`).
* Wywołuje zintegrowany adapter `runAgent({ role: 'developer', task: developerTask, cwd })`.
* Zwraca ustrukturyzowany wynik dyspozycji:
  ```json
  {
    "dispatched": true,
    "strategy": "acp",
    "taskId": task.id,
    "role": "developer",
    "model": "opencode/deepseek-v4-flash-free",
    "sessionId": "<id-sesji>",
    "response": "<odpowiedz-agenta>",
    "result": { ... }
  }
  ```
* W przypadku błędu przechwytuje wyjątek i zwraca obiekt błędu `{ dispatched: false, strategy: 'acp', taskId, error }`, nie przerywając działania pętli głównej watchera.

---

## 3. Jak AgentExecutionBridge przekazuje zadanie do runAgent()
Przekazanie następuje bezpośrednio w metodzie `dispatchAcp`:
1. `AgentExecutionBridge` importuje funkcję `runAgent` z `./opencode-adapter.mjs`.
2. Przygotowuje parametry wejściowe:
   * `role`: `'developer'` (jawnie przypisana rola dewelopera),
   * `task`: treść zadania tekstowego,
   * `cwd`: katalog roboczy z konfiguracji `this.config.strategies?.acp?.cwd || process.cwd()`.
3. `runAgent()` uruchamia proces potomny `opencode acp` przez `node:child_process.spawn`.
4. Komunikacja odbywa się przez protokół JSON-RPC v1:
   * `initialize` $\rightarrow$ nawiązanie połączenia z serwerem ACP,
   * `session/new` $\rightarrow$ utworzenie nowej sesji wykonawczej,
   * `session/set_config_option` $\rightarrow$ dynamiczne ustawienie modelu dla roli `developer`,
   * `session/prompt` $\rightarrow$ wysłanie promptu zadania do modelu,
   * `session/update` $\rightarrow$ asynchroniczny odbiór strumienia chunków tekstu (`agent_message_chunk`),
   * `stopReason === 'end_turn'` $\rightarrow$ sfinalizowanie obietnicy i zwrócenie pełnej odpowiedzi.

---

## 4. Jaki model jest używany dla roli developer
Zgodnie ze słownikiem `MODELS` zdefiniowanym w `opencode-adapter.mjs` (linie 6–11):
* Dla roli **`developer`** używany jest model: **`opencode/deepseek-v4-flash-free`**.

---

## 5. Jakie są obecnie strategie dispatchu
System posiada 3 zaimplementowane strategie wykonawcze:
1. **`signal`** *(Domyślna)*: Tworzy plik zdarzenia kontrolnego `DISPATCH.json` z payloadem `DISPATCH_ORCHESTRATOR`. Pozwala na asynchroniczne odebranie zadania przez zewnętrzny proces bez bezpośredniego uruchamiania procesów potomnych.
2. **`command`**: Uruchamia lokalne polecenie powłoki na podstawie szablonu konfiguracyjnego `commandTemplate` (np. `opencode run --task {TASK_ID}`) za pośrednictwem `exec()`.
3. **`acp`**: Bezpośrednie, natywne wykonanie agenta przez protokół Agent Control Protocol (OpenCode ACP JSON-RPC) ze śledzeniem sesji i bezpośrednim zwrotem wygenerowanego tekstu.

---

## 6. Czy strategia signal pozostaje domyślna
**TAK.** 
* W pliku `runner_config.json` zdefiniowano: `"defaultStrategy": "signal"`.
* W kodzie `queue_watcher.mjs` (linia 36 i 92) domyślnym fallbackiem w przypadku braku lub uszkodzenia konfiguracji jest `signal`.

---

## 7. Ryzyka przed użyciem ACP jako rzeczywistej ścieżki Developer
Zidentyfikowano 3 kluczowe ryzyka:
1. **Sztywny limit czasu (Timeout 60s)**:
   * W `opencode-adapter.mjs` (linia 43) ustawiony jest sztywny timeout `60000ms`. Złożone zadania deweloperskie (analiza kodu, pisanie wielu plików, testy) mogą zająć powyżej 60s, co spowoduje błąd `OpenCode ACP timeout` (taki incydent odnotowano w `watcher.log` dla zadania `B13-REAL-1`).
2. **Statyczna ścieżka do pliku wykonywalnego**:
   * Ścieżka `C:\Users\HP\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe` jest zahardkodowana w adapterze, co uniemożliwia przenośność na inne maszyny lub środowiska CI/CD bez edycji kodu.
3. **Brak walidacji struktury odpowiedzi handoffu w adapterze**:
   * ACP zwraca surowy ciąg znaków `response`. Jeśli model nie wygeneruje wymaganej struktury `# TASK RESULT`, bridge zwróci `dispatched: true`, ale Orchestrator może nie być w stanie poprawnie zinterpretować statusu bez dodatkowego parsera.

---

## 8. Rekomendacja dotycząca następnego kroku
**Rekomendacja:**
Wprowadzić konfigurowalny timeout dla strategii `acp` w `runner_config.json` (zwiększając wartość domyślną z 60s do np. 180s–300s dla zadań deweloperskich) oraz przeprowadzić próbę z zadaniem wymagającym wygenerowania pełnego nagłówka `# TASK RESULT` w celu potwierdzenia bezproblemowego przekazania handoffu do Orchestratora.
