# B14-ARCH-0: ARCHITECTURAL DECISION & ADAPTER BOUNDARY SPECIFICATION

**Data opracowania:** 2026-08-17  
**Zadanie:** B14-ARCH-0 (AGENT ROLE REARCHITECTURE)  
**Zakres:** WEB FACTOR / B13 / Agent Control  
**Status:** ARCHITECTURAL DECISION RECOMMENDATION (READ-ONLY BASELINE)

---

## 1. ANALIZA I OCENA MAPOWANIA MODELI

### 1.1 Ocena obecnego mapowania ról na modele

W `opencode-adapter.mjs` (linie 13–18) zdefiniowano:
- `developer` $\rightarrow$ `opencode/deepseek-v4-flash-free`
- `auditor` $\rightarrow$ `opencode/nemotron-3-ultra-free`
- `planner` $\rightarrow$ `opencode/mimo-v2.5-free`
- `fallback` $\rightarrow$ `opencode/big-pickle`

**Ocena merytoryczna:**
1. **Developer (`deepseek-v4-flash-free`):** Wybór w pełni uzasadniony. DeepSeek V4 cechuje się wysoką sprawnością w generowaniu kodu, refaktoryzacji oraz obsłudze narzędzi programistycznych.
2. **Auditor (`nemotron-3-ultra-free`):** Wybór optymalny. Modele z rodziny Nemotron wykazują dużą dyscyplinę w analizie faktograficznej, krytycznej ocenie kryteriów i niewpadaniu w nadmierną uległość (sycophancy), co jest kluczowe dla bezkompromisowego audytu.
3. **Planner (`mimo-v2.5-free`):** Logiczny wybór do dekompozycji zadań i tworzenia struktur markdown z relacjami zależności.
4. **Fallback (`big-pickle`):** Poprawny mechanizm zabezpieczający w przypadku niedostępności modelu dedykowanego.

### 1.2 Zasada niezależności ról od modeli i separacja konfiguracji

1. **Rola $\neq$ Model:** Rola agenta jest kontraktem semantycznym i domenowym w systemie B13. Nazwy konkretnych modeli dostawców (np. `deepseek-v4-flash-free`) są szczegółem technicznym adaptera wykonawczego.
2. **B13 CORE nie może znać modeli:** Silnik B13 przekazuje do portu wykonawczego wyłącznie nazwę roli (`role: 'developer'`).
3. **Lokalizacja mapowania:** Słownik mapowania `role -> model` musi znajdować się w konfiguracji adaptera (`runner_config.json` lub dedykowanym pliku konfiguracyjnym adaptera), a **nie na stałe w kodzie źródłowym**.

---

## 2. RELACJA B13 CORE $\leftrightarrow$ ADAPTER ORAZ WYMAGANIA DLA AURA FACES

### 2.1 Architektura portu `ExecutionRuntime`

Zgodnie z zasadami czystej architektury (Ports & Adapters / Hexagonal Architecture):

```
┌────────────────────────────────────────────────────────┐
│ B13 CORE (Level 0)                                     │
│ • Deterministic Control Engine                         │
│ • Konsumuje interfejs portu: ExecutionRuntime          │
└───────────────────────────┬────────────────────────────┘
                            │ (Inversion of Control)
                            ▼
┌────────────────────────────────────────────────────────┐
│ <<interface>> ExecutionRuntime                         │
│ + execute(request: ExecutionRequest): Promise<Result>  │
│ + isAvailable(): Promise<boolean>                      │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ OpenCodeAdapter (B13 / L1)   │ │ AuraFacesAdapter (Przyszły)  │
│ • Implementacja ACP JSON-RPC │ │ • Implementacja AURA Runtime │
│ • Zarządzanie opencode.exe   │ │ • Zgodność z ExecutionRuntime│
└──────────────────────────────┘ └──────────────────────────────┘
```

### 2.2 Wymagania kontraktowe dla przyszłego adaptera AURA FACES

Adapter AURA FACES **nie został utworzony** i nie jest częścią obecnego zadania. Aby w przyszłości mógł zostać bezproblemowo zintegrowany z B13 CORE, musi spełnić następujące kryteria:

1. **Implementacja kontraktu `ExecutionRuntime`:** Zapewnienie metody asynchronicznej przyjmującej `{ role, task, context, timeoutMs, cwd }` i zwracającej ustrukturyzowany obiekt `{ success, role, model, sessionId, response, rawOutput, error }`.
2. **Pełna asynchroniczność i obsługa timeoutów:** Wewnętrzne zarządzanie czasem wykonania z respektowaniem limitu `timeoutMs` i czystym zwalnianiem zasobów.
3. **Izolacja od stanu B13:** Adapter nie może bezpośrednio modyfikować `STATE.md`, `QUEUE.md` ani `.claim.lock`. Wszystkie zmiany stanu wykonuje wyłącznie B13 CORE po odebraniu odpowiedzi.
4. **Brak wpływu na protokoły wyższych warstw:** Zapewnienie transparentnego przekazywania nagłówków `# TASK RESULT`, `# AUDIT RESULT`, `# ARCHITECTURE REVIEW`.

---

## 3. ARCHITECTURE DECISION: REKOMENDACJA

Wydaje się jednoznaczną rekomendację architektoniczną:

### **WYBÓR: OPCJA C — Przebudować role + rozdzielić Control Engine od Orchestrator Agent**

---

### Uzasadnienie w oparciu o stan rzeczywisty repozytorium:

1. **Usunięcie krytycznego konfliktu pojęciowego i wykonawczego:**
   - W obecnym kodzie `queue_watcher.mjs` zawiera 1010 linii deterministycznej logiki (zarządzanie kolejką, atomowy zapis stanu, blokady claim-lock, deterministyczny algorytm retry `routeRetryDecision`).
   - Jednocześnie plik `.agents/agents/orchestrator/agent.md` deklarował, że to Orchestrator (agent LLM) jest *"control plane"* i zarządza maszyną stanów.
   - Rozdzielenie tych ról eliminuje ryzyko halucynacji LLM przy przejściach stanów i zwalnia model z konieczności mechanicznego odpytywania stanu.

2. **Gwarancja 0-tokenowej pętli bazowej (Zero-Token Baseline):**
   - Pozostawienie sterowania pętlą po stronie deterministycznego B13 Control Engine (Level 0) sprawia, że system może pracować w trybie ciągłym (24/7 / nocne runy) bez zużywania ani jednego tokena w stanie oczekiwania na zadania.

3. **Optymalizacja kosztów i ochrona limitów Antigravity:**
   - Modele wysokiego rzędu (Antigravity) są chronione przed mechanicznym kodowaniem i testowaniem.
   - Zadania poziomu 1 wykonują bezpłatne/lokalne wyspecjalizowane modele OpenCode.
   - Antigravity wkracza wyłącznie w sytuacjach sporów architektonicznych, wyczerpania retry lub zmian w bezpieczeństwie.

4. **Czysta modularność pod kątem B14:**
   - Rozdzielenie silnika B13 od agenta orkiestracji umożliwia bezproblemową ekstrakcję pakietu `packages/agent-control-core` i podłączanie dowolnych adapterów wykonawczych (OpenCode, a w przyszłości AURA FACES).
