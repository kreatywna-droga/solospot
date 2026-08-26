# B14-ARCH-0: TOKEN ECONOMY & NIGHT RUN ARCHITECTURE

**Data opracowania:** 2026-08-17  
**Zadanie:** B14-ARCH-0 (AGENT ROLE REARCHITECTURE)  
**Zakres:** WEB FACTOR / B13 / Agent Control  
**Status:** ARCHITECTURAL DESIGN (READ-ONLY BASELINE)

---

## 1. ANALIZA OBECNEGO MODELU ZUŻYCIA TOKENÓW

W dotychczasowym modelu pracy istniały istotne nieefektywności kosztowe i limitowe:
1. **Nadużywanie Antigravity do zadań niskopoziomowych:** Antigravity (model o bardzo wysokiej pojemności kognitywnej i ograniczonych limitach zapytań) było angażowane do mechanicznego pisania kodu, uruchamiania testów, analizowania prostych błędów składniowych czy pętlowego sprawdzania statusu zadań.
2. **Puchnięcie kontekstu (Context Bloat):** Przekazywanie całych historii konwersacji, setek linii logów z testów oraz zbędnych plików źródłowych drastycznie zwiększało liczbę tokenów wejściowych przy każdym zapytaniu.
3. **Brak beztokenowego nadzoru pętli:** Monitorowanie kolejki i stanu zadań odbywało się w sposób wymagający ciągłych interwencji i odpytywań.

---

## 2. ZASADA BAZOWA B14: "ANTIGRAVITY BY EXCEPTION"

Główny filar ekonomii tokenów w architekturze B14 brzmi:

> **"Antigravity is invoked by exception, not by default."**  
> *(Antigravity jest wywoływane wyłącznie w drodze wyjątku, nigdy jako domyślny wykonawca).*

### Podział obciążenia tokenowego:

1. **Warstwa 0 (B13 Engine) — 0 TOKENÓW (0% LLM):**
   - Wszystkie operacje kolejkowania, zapisu/odczytu stanu, weryfikacji blokad, sprawdzania zależności i routingu wykonują się w 100% deterministycznym kodzie Node.js bez użycia jakichkolwiek tokenów.

2. **Warstwa 1 (OpenCode Workers) — COMMODITY / FREE / LOCAL LLM:**
   - 100% standardowych zadań implementacyjnych (Developer), audytowych (Auditor), planistycznych (Planner) i koordynacyjnych (Orchestrator) realizowane jest przez wyspecjalizowane modele OpenCode (`deepseek-v4-flash-free`, `nemotron-3-ultra-free`, `mimo-v2.5-free`).
   - Brak zużycia limitów tokenowych Antigravity w standardowym cyklu życia zadania.

3. **Warstwa 2 (Antigravity) — WYSOKORZĘDOWY EXPERT / ARBITER:**
   - Uruchamiany wyłącznie przy wyczerpaniu polityki retry (np. po 3 nieudanych próbach), wykryciu naruszeń ADR, zmianach w architekturze bezpieczeństwa lub izolacji Multi-Tenant.

---

## 3. PROTOKÓŁ MINIMALIZACJI KONTEKSTU ESKALACYJNEGO

Gdy następuje eskalacja do Antigravity, B13 Engine **NIE przekazuje** pełnego kontekstu repozytorium ani historii konwersacji. Przekazywany jest wyłącznie zwięzły, ustrukturyzowany **Pakiet Eskalacyjny (Escalation Bundle)**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MINIMALNY PAKIET ESKALACYJNY DLA ANTIGRAVITY                            │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. TASK_ID & KRYTERIA AKCEPTACJI (tylko treść z QUEUE.md)               │
│ 2. PRECYZYJNE PYTANIE ARCHITEKTONICZNE (co wymaga rozstrzygnięcia)      │
│ 3. DIFF OSTATNIEJ PRÓBY (wyłącznie pliki dotknięte zmianą)             │
│ 4. LISTA DEFEKTÓW Z AUDYTU (syntetyczna tabela niezgodności)           │
│ 5. RELEWANTNE ADR / FRAGMENTY DOKUMENTACJI (wyciąg, nie całe pliki)     │
└─────────────────────────────────────────────────────────────────────────┘
```

Dzięki temu rozmiar promptu wejściowego dla Antigravity jest zredukowany do niezbędnego minimum (zamiast setek tysięcy tokenów — kilka tysięcy tokenów precyzyjnego kontekstu).

---

## 4. ARCHITEKTURA WIELOGODZINNEGO NOCNEGO RUNU (AUTONOMOUS NIGHT RUN)

Architektura B14 umożliwia w pełni autonomiczne, wielogodzinne wykonywanie kolejek zadań bez udziału człowieka i bez drenowania limitów Antigravity:

```
[START NIGHT RUN]
       │
       ▼
┌──────────────┐
│ B13 ENGINE   │ ◄─── Pętla ciągła (0 tokenów)
└──────┬───────┘
       │
       ├──────────────────────────────────────────────────────────┐
       │ (Zadanie standardowe)                                   │ (Błąd implementacji)
       ▼                                                         ▼
┌──────────────┐                                          ┌──────────────┐
│ DEVELOPER    │ (OpenCode / DeepSeek)                    │ DEVELOPER    │ (Retry z listą defektów)
└──────┬───────┘                                          └──────┬───────┘
       │                                                         │
       ▼                                                         ▼
┌──────────────┐                                          ┌──────────────┐
│ AUDITOR      │ (OpenCode / Nemotron)                    │ AUDITOR      │ (Focused Delta Audit)
└──────┬───────┘                                          └──────┬───────┘
       │                                                         │
       ├─────────────────┬───────────────────────────────────────┤
       │ (PASS)          │ (HOLD - retry < 3)                    │ (Krytyczny błąd / limit wyczerpany)
       ▼                 ▼                                       ▼
┌──────────────┐   [Powrót do Dev]                       ┌──────────────┐
│ B13: COMPLETE│                                         │ B13 ENGINE   │
└──────┬───────┘                                         └──────┬───────┘
       │                                                        │
       ▼                                                        ├────────────────────────┐
[Następne zadanie w QUEUE]                                      │ (Tryb unattended)      │ (Eskalacja aktywna)
                                                                ▼                        ▼
                                                         ┌──────────────┐         ┌──────────────┐
                                                         │ PARK TASK    │         │ WAKE UP      │
                                                         │ STATE:       │         │ ANTIGRAVITY  │
                                                         │ HUMAN_REVIEW │         │ (Expert L2)  │
                                                         │ Przejście do │         └──────┬───────┘
                                                         │ kolejnego    │                │
                                                         │ niezależnego │                ▼
                                                         │ zadania      │         ┌──────────────┐
                                                         └──────────────┘         │ DECISION     │
                                                                                  │ & RESUME     │
                                                                                  └──────────────┘
```

### Zasady zachowania w trybie nocnym:

1. **Bezkolizyjne przechodzenie do kolejnych zadań:** Po zakończeniu zadania ze statusem `PASS`, B13 natychmiast odblokowuje zadania zależne i przechodzi do kolejnego zadania `READY`.
2. **Automatyczne samoleczenie (Auto-Recovery):** Drobne błędy testów są naprawiane autonomicznie w pętli Developer $\leftrightarrow$ Auditor (do limitu `retryLimit`).
3. **Izolacja awarii (Failure Isolation):** Jeśli zadanie wyczerpie limit retry lub napotka bloker architektoniczny:
   - W trybie bezobsługowym zadanie jest oznaczane jako `HUMAN_REVIEW` lub `BLOCKED`, a B13 sprawdza, czy w kolejce znajdują się inne, niezależne zadania `READY`.
   - Jeśli istnieją niezależne zadania — system kontynuuje pracę nad nimi, nie blokując całego nocnego runu.
4. **Wznowienie po decyzji (Clean Resume):** Stan w `STATE.md` i `QUEUE.md` jest zawsze spójny na dysku. Człowiek lub Antigravity może w dowolnym momencie rozstrzygnąć problematyczne zadanie, a B13 podejmie pracę dokładnie od punktu zatrzymania.
