# Operational Runbook — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 98_OPERATIONAL_RUNBOOK.md  
> **Status:** Operational Standard  
> **Zależności:** Wszystkie dokumenty procesowe (60-97) w `docs/studio/`  
>  
> **Proces:** Operacyjny Podręcznik Prowadzenia i Nadzorowania Projektu (Runbook)

---

## 1. Operacyjne Procedury Prowadzenia Projektu

Podręcznik opisuje krok po kroku procedury postępowania dla 8 kluczowych zdarzeń operacyjnych w projekcie WEB FACTOR Studio 2.0.

---

## 2. Instrukcje Krok po Kroku

### 1. Rozpoczęcie Sprintu (Sprint Start Procedure)
1. Sprawdź i potwierdź specyfikację z `docs/studio/` dla danego sprintu.
2. Upewnij się, że dokument posiada status `Approved ✅`.
3. Przydziel zadania implementacyjne (Agent 1) i architektoniczne (Agent 2).

### 2. Zakończenie Sprintu (Sprint End Procedure)
1. Uruchom pełny zestaw testów Vitest (`npm run test`).
2. Sporządź dokument `XX_INTEGRATION_REVIEW.md`.
3. Sporządź dokument `XX_ARCHITECTURE_FREEZE.md`.
4. Wykonaj kroki z checklisty `98_OPERATIONAL_RUNBOOK.md` i zaktualizuj `37_STUDIO_SUBSYSTEM_ROADMAP.md`.

### 3. Architecture Review Procedure
1. Otwórz dokument `70_ARCHITECTURE_REVIEW_CHECKLIST.md`.
2. Przejdź przez 10 sekcji kontrolnych.
3. Wpisz decyzję do `80_DECISION_LOG.md` oraz dodaj rekord w `77_ADR_INDEX.md`.

### 4. Integration Review Procedure
1. Sprawdź płynność podglądu Canvasu.
2. Potwierdź bezprzeładowaniową iniekcję CSS.
3. Sprawdź wsparcie dla stosu Undo/Redo (`HistoryStack`).

### 5. Release Review Procedure
1. Otwórz `64_RELEASE_READINESS.md` i sprawdź 7 filarów.
2. Zweryfikuj, że zero otwartych błędów P1/P2 blokuje wdrożenie.

### 6. Governance Review Procedure
1. Raz w miesiącu przelicz wskaźniki z `63_ENGINEERING_METRICS.md`.
2. Zaktualizuj `82_PROJECT_HEALTH_DASHBOARD.md`.

### 7. Procedure Aktualizacji Roadmapy
1. Zmień status subsystemu z `📝 Planned` lub `🚧 In Progress` na `🔒 Frozen` w `37_STUDIO_SUBSYSTEM_ROADMAP.md`.

### 8. Procedure Aktualizacji ADR
1. Utwórz plik specyfikacji, przypisz kolejny numer ADR i dopisz rekord w `77_ADR_INDEX.md`.
