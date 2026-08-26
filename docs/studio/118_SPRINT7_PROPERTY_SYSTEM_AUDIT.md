# 118. Sprint 7.2 — Property System Audit Plan & Template (PM23)

> **Wykonawca:** Agent 2 (Reactive Maintenance)  
> **Typ Dokumentu:** Szablon i Plan Audytu (Audit Readiness Plan)  
> **Target:** Sprint 7.2 — Property System & Extended Inspector Fields  
> **Status:** ⏳ PENDING AGENT 1 IMPLEMENTATION COMPLETION  

---

## 1. Executive Summary (Szablon)

*Tabela i opis zostaną uzupełnione po przekazaniu wyników przez Agenta 1 oraz otrzymaniu logów z komend `vitest`, `tsc` i `build`.*

- **Data Audytu:** `[RRRR-MM-DD]`
- **Weryfikowany Diff:** Sprint 7.2 (`PropertyRegistry`, edytory właściwości, dziedziczenie responsywne)
- **Status Audytu:** `[🟢 PASS / 🔴 FAIL]`

---

## 2. Checklista Audytowa (Scope Checklist)

Audyt zostanie przeprowadzony rygorystycznie według poniższych 8 obszarów weryfikacji:

### 2.1 PropertyRegistry
- [ ] Rejestr jest jedynym źródłem prawdy dla definicji renderowania właściwości.
- [ ] Brak lokalnych lub zduplikowanych definicji pól w panelach UI.
- [ ] Czyste rozdzielenie interfejsu w `builder-core` od komponentów Reactowych.

### 2.2 Property Panels (Interfejs Użytkownika)
- [ ] Komponenty paneli pełnią wyłącznie funkcję prezentacyjną (Pure Render Components).
- [ ] Brak jakiejkolwiek logiki biznesowej, przeliczeniowej czy domenowej w React UI.
- [ ] Zmiany właściwości są delegowane wyłącznie do szyny komend (`UPDATE_PROPS`).

### 2.3 Breakpoint Inheritance (Dziedziczenie Responsywne)
- [ ] Przełączanie kontekstów urządzeń (`DESKTOP`, `TABLET`, `MOBILE`) zachowuje prawidłową kaskadę dziedziczenia stylów.
- [ ] Wartości breakpointów nie nadpisują bezpośrednio parametrów bazowych bez jawnej akcji użytkownika.
- [ ] Obiekty wartości responsywnych zgadzają się z modelem `ResponsiveValueModel`.

### 2.4 Inspector Runtime
- [ ] Walidacja typów oraz wartości granicznych odbywa się silnikowo w `InspectorRuntime`.
- [ ] Silnik generuje poprawne obiekty komend `BuilderCommand`.
- [ ] Brak wycieków logiki do warstwy prezentacji.

### 2.5 Runtime Preview Synchronization
- [ ] Propagacja zmian ze stanu Buildera do podglądu iframe odbywa się wyłącznie przez `RuntimePreviewChannel` (`postMessage`).
- [ ] Brak bezpośredniej manipulacji drzwem DOM iframe.
- [ ] Brak użycia `querySelector` wewnątrz dokumentu podglądu.

### 2.6 Public API Compatibility
- [ ] Eksporty z pakietów monorepo są w 100% kompatybilne z dotychczasowym API.
- [ ] Brak wprowadzonych zmian łamiących (No Breaking Changes).
- [ ] Umowy i kontrakty typów TypeScript zachowują stabilność.

### 2.7 Architecture Delta
- [ ] Wartość oczekiwana: `Architecture Delta: NONE`.
- [ ] Ewentualne przesunięcia odpowiedzialności muszą być uzasadnione i udokumentowane.

### 2.8 Technical Debt Review
- [ ] Brak słów kluczowych: `TODO`, `FIXME`, `HACK`, `temporary`, `workaround` w nowym kodzie.
- [ ] Klasyfikacja każdego znaleziska wg rang: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- [ ] Oznaczenie każdego wpisu `CRITICAL` jako **Release Blocking Technical Debt**.

### 2.9 Property Registry Growth (Rozwój Rejestru Właściwości)
- [ ] Nowe właściwości nie są kopiowane ani powielane między panelami.
- [ ] Wszystkie nowe pola posiadają komplet metadanych (label, description, validation rules, default values).
- [ ] Nowe właściwości posiadają dokładnie jedno, unikalne miejsce rejestracji.

### 2.10 Inspector Performance (Wydajność Paneli & Podglądu)
- [ ] Zmiana pojedynczej właściwości w panelu nie powoduje pełnego rerenderowania całego inspektora / wszystkich paneli.
- [ ] Aktualizuje się wyłącznie zmieniony panel/komponent UI.
- [ ] Podgląd `Runtime Preview` nie przeładowuje całej strony ani nie wykonuje pełnego rerenderu drzewa po zmianie pojedynczego parametru.

### 2.11 State Consistency Review (Spójność Przejść Stanu & Brak Pętli)
- [ ] Zmiana pojedynczej właściwości powoduje dokładnie jeden atomowy dispatch stanu (`UPDATE_PROPS` → `BuilderState`), brak podwójnych wywołań.
- [ ] Podgląd `Runtime Preview` nie odsyła zmian z powrotem do Inspectora (brak pętli zwrotnych `Inspector → Preview → Inspector → Preview`).
- [ ] Wszystkie zmiany przechodzą przez jednolitą magistralę komend: `PropertyField → Inspector Runtime → Builder Command → Builder State → Preview` (nigdy `PropertyField → Builder State` z pominięciem Runtime/Commands).

---

## 3. Kryteria Przyznania Statusu PASS (Quality Gate Criteria)

Dla przyznania oceny **🟢 PM23 PASS** po zakończeniu prac Agenta 1 wymagana jest 100% zgodność ze wszystkimi poniższymi kryteriami:

1. ✅ **Brak logiki biznesowej w panelach UI.**
2. ✅ **`PropertyRegistry` stanowi jedyne źródło definicji właściwości bez duplikowania pól.**
3. ✅ **Wszystkie nowe pola mają komplet metadanych i jedno miejsce rejestracji (Property Registry Growth).**
4. ✅ **Synchronizacja podglądu odbywa się wyłącznie przez `RuntimePreviewChannel` bez przeładowywania całej strony (Inspector Performance).**
5. ✅ **Ścieżka komend jest jednokierunkowa i atomowa: `PropertyField → Inspector Runtime → Builder Command → Builder State → Preview`, brak pętli zwrotnych oraz podwójnych wywołań (State Consistency Review).**
6. ✅ **Brak nowych zależności cyklicznych w monorepo.**
7. ✅ **Brak zmian łamiących Public API (No Breaking Changes).**
8. ✅ **Brak długu technologicznego rzędu `CRITICAL` (Zero Release Blocking Debt).**
9. ✅ **`Architecture Delta: NONE` (lub formalnie zatwierdzone wyjątki).**

---

## 4. Szablon Struktury Raportu Audytowego

Po przesłaniu kodu przez Agenta 1, finalny raport zostanie wygenerowany z zachowaniem poniższej struktury:

```markdown
# 118. Sprint 7.2 — Property System Audit Report

> **Audytor:** Agent 2 (Reactive Maintenance)
> **Data:** [Data Audytu]
> **Status Audytu:** [PASS / FAIL]

## 1. Executive Summary
## 2. Property Registry Audit
## 3. Property Panels Audit
## 4. Runtime Synchronization
## 5. Breakpoint System
## 6. Public API Review
## 7. Architecture Delta
## 8. Technical Debt Review
## 9. Recommendations
## 10. Final Verdict
```

### Format Dowodowy (Obowiązkowy dla Każdego Ustalenia):
```text
Plik: <sciezka_do_pliku>
Linia: <numer_linii>
Opis: <szczegolowy_opis_problemu>
Złamana reguła/ADR: <identyfikator_reguly_lub_ADR>
Wpływ: <LOW / MEDIUM / HIGH / CRITICAL>
```

---

## 5. Stan Audytora (Auditor Operational Status)

- 🛑 **Analiza Kodu:** Wstrzymana (Oczekiwanie na deliverable Agenta 1)
- 🛑 **Uruchamianie Terminala:** Wyłączone
- 🛑 **Modyfikacja Kodu / Pakietów:** Wyłączone
- 🟢 **Gotowość do Audytu:** 100% (Szablon i plan odebrany)

---

> **Plan Zatwierdzony do Realizacji po Przekazaniu Sprintu 7.2 przez Agenta 1.**
