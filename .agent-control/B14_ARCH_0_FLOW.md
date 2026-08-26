# B14-ARCH-0: EXECUTION FLOW & ESCALATION LIFECYCLE

**Data opracowania:** 2026-08-17  
**Zadanie:** B14-ARCH-0 (AGENT ROLE REARCHITECTURE)  
**Zakres:** WEB FACTOR / B13 / Agent Control  
**Status:** ARCHITECTURAL DESIGN (READ-ONLY BASELINE)

---

## 1. PRZEPŁYW STANDARDOWY (HAPPY PATH)

Standardowy cykl bezbłędnej realizacji zadania opiera się na naprzemiennej pracy deterministycznego silnika B13 (Level 0) oraz autonomicznych agentów OpenCode (Level 1):

```
┌─────────────────┐
│ QUEUE.md        │
│ Task: READY     │
└────────┬────────┘
         │
         ▼ (1. Deterministyczne sprawdzenie zależności)
┌─────────────────┐
│ B13 ENGINE      │ ──► Blokada .claim.lock
│ Level 0         │ ──► Zapis STATE.md (IN_PROGRESS)
└────────┬────────┘
         │
         ▼ (2. Dispatch zadania do wykonawcy)
┌─────────────────┐
│ DEVELOPER       │ ──► Analiza kodu, modyfikacja plików
│ Level 1         │ ──► Uruchomienie testów lokalnych / lint
└────────┬────────┘ ──► Wygenerowanie # TASK RESULT (COMPLETE)
         │
         ▼ (3. Walidacja syntaktyczna nagłówka)
┌─────────────────┐
│ B13 ENGINE      │ ──► Zapis STATE.md (AUDIT)
│ Level 0         │ ──► Przygotowanie pakietu dla Audytora
└────────┬────────┘
         │
         ▼ (4. Dispatch do niezależnego audytora)
┌─────────────────┐
│ AUDITOR         │ ──► Niezależne uruchomienie testów
│ Level 1         │ ──► Weryfikacja kryteriów akceptacji & diff
└────────┬────────┘ ──► Wygenerowanie # AUDIT RESULT (PASS)
         │
         ▼ (5. Finalizacja deterministyczna)
┌─────────────────┐
│ B13 ENGINE      │ ──► Zapis QUEUE.md (STATUS: COMPLETE)
│ Level 0         │ ──► Zapis STATE.md (STATE: WAITING)
└────────┬────────┘ ──► Zwolnienie .claim.lock
         │
         ▼
[Pobranie kolejnego zadania READY z QUEUE.md]
```

---

## 2. PRZEPŁYW OBSŁUGI BŁĘDÓW I PĘTLI RETRY (DEFECT RECOVERY)

Gdy Developer zgłosi błąd lub Auditor wyda rekomendację `HOLD` (defekt implementacyjny):

```
┌─────────────────────────────────────────────────────────┐
│ AUDITOR (Level 1) zwraca:                               │
│ RECOMMENDATION: HOLD                                    │
│ ARCHITECT_ESCALATION: NO                                │
│ DEFECTS: [Lista wykrytych niezgodności i błędów testów]  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ B13 ENGINE (Level 0)                                    │
│ 1. Odczytuje retryCount z STATE.md                      │
│ 2. Sprawdza: retryCount < retryLimit (np. count < 3)    │
└──────────────┬───────────────────────────┬──────────────┘
               │ (TAK: count < limit)      │ (NIE: limit wyczerpany)
               ▼                           ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│ B13 ENGINE                    │ │ B13 ENGINE                    │
│ • Inkrementacja retryCount    │ │ • Przejście do ESCALATION     │
│ • STATE.md: IN_PROGRESS       │ │ • STATE.md: ARCHITECT_REVIEW  │
│ • QUEUE.md: DEVELOPER_RETRY   │ │   lub HUMAN_REVIEW            │
│ • Dispatch do DEVELOPERA      │ │ • Wywołanie Antigravity (L2)  │
│   z dołączoną listą defektów  │ └───────────────────────────────┘
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ DEVELOPER (Level 1)           │
│ • Naprawa wskazanych defektów │
│ • Re-walidacja testów         │
│ • Nowy # TASK RESULT          │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ AUDITOR (Level 1)             │
│ • Focused Delta Audit         │
│ • Weryfikacja poprawki        │
└───────────────────────────────┘
```

---

## 3. PRZEPŁYW ESKALACJI ARCHITEKTONICZNEJ (ESCALATION TO ANTIGRAVITY)

Eskalacja na Poziom 2 (Antigravity) następuje wyłącznie w sytuacjach wyjątkowych, gdy autonomiczny Poziom 1 nie ma uprawnień lub możliwości bezpiecznego kontynuowania prac:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ WYZWALACZ ESKALACJI:                                                    │
│ • Auditor: ARCHITECT_ESCALATION: YES (naruszenie granic/ADR)             │
│ • Developer: STATUS: ESCALATE (niejednoznaczność / konflikt arch.)      │
│ • B13 Engine: Wyczerpanie limitu retry (retryCount >= retryLimit)       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ B13 ENGINE (Level 0)                                                    │
│ • Ustawienie STATE.md: STATE: ARCHITECT_REVIEW                          │
│ • Wygenerowanie zwięzłego pakietu eskalacji (ESCALATION REQUEST)        │
│ • Wstrzymanie dispatchu do OpenCode                                     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ ANTIGRAVITY (Level 2 — Expert Architect)                                │
│ • Analiza sporu architektonicznego w oparciu o ADR i Master Plan        │
│ • Ocena dowodów z Git diff i raportu audytu                             │
│ • Wydanie formalnej decyzji:                                            │
│   1. APPROVE ──► Zatwierdzenie odstępstwa / aktualizacja ADR            │
│   2. RETURN_TO_DEVELOPER ──► Ścisłe wytyczne architektoniczne naprawy   │
│   3. ARCHITECTURAL_CHANGE_REQUIRED ──► Zmiana specyfikacji zadania      │
│   4. HUMAN_APPROVAL_REQUIRED ──► Zaparkowanie w HUMAN_REVIEW            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ B13 ENGINE (Level 0)                                                    │
│ • Przyjęcie decyzji Antigravity                                         │
│ • Aktualizacja stanu STATE.md                                           │
│ • Wznowienie pętli autonomicznej lub oczekiwanie na człowieka           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. DEMARKACJA: DETERMINIZM (KOD) VS ROZUMOWANIE (LLM)

Poniższa tabela przedstawia ścisłą granicę pomiędzy operacjami deterministycznymi (B13 Engine) a zadaniami kognitywnymi (Modele AI):

| Etap cyklu życia | Kto wykonuje | Charakter | Mechanizm wykonania |
|---|---|---|---|
| Parsowanie `QUEUE.md` | B13 Engine | **Deterministyczny** | Regex / AST parsing, 0 tokenów |
| Wybór zadania `READY` | B13 Engine | **Deterministyczny** | Sprawdzenie relacji w grafie DAG |
| Blokada współbieżności | B13 Engine | **Deterministyczny** | Atomowy plik `.claim.lock` (PID + timestamp) |
| Zmiana stanu w `STATE.md` | B13 Engine | **Deterministyczny** | Atomowy zapis przez plik `.tmp` + `renameSync` |
| Synteza kontekstu zadania | Orchestrator | **Kognitywny (LLM)** | Model OpenCode (`mimo-v2.5` / `deepseek`) |
| Implementacja kodu | Developer | **Kognitywny (LLM)** | Model OpenCode (`deepseek-v4-flash`) |
| Walidacja testów w dev | Developer | **Deterministyczny (CLI)** | Uruchomienie `npm test`, `tsc`, `eslint` |
| Weryfikacja dowodowa | Auditor | **Kognitywny + CLI** | Model OpenCode (`nemotron-3-ultra`) + CLI |
| Sprawdzenie limitu retry | B13 Engine | **Deterministyczny** | Porównanie liczb całkowitych (`count < limit`) |
| Routing decyzji retry | B13 Engine | **Deterministyczny** | Tabela decyzyjna w kodzie (`routeRetryDecision`) |
| Rozstrzygnięcie sporu arch. | Antigravity | **Kognitywny (High-LLM)** | Google DeepMind Agentic Reasoning |
| Oznaczenie `COMPLETE` | B13 Engine | **Deterministyczny** | Modyfikacja sekcji w `QUEUE.md` |
