# Architecture Principles — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 65_ARCHITECTURE_PRINCIPLES.md  
> **Status:** Governance Standard  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 29_STUDIO_ENGINEERING_GUIDELINES.md, ADR-VISUAL-001  
>  
> **Proces:** Nadrzędne Zasady Architektoniczne Buildera

---

## 1. Cel i Ramy Zarządzania Architekturą

Niniejszy dokument definiuje 10 fundamentów architektonicznych obowiązujących wszystkich deweloperów, agentów AI oraz kontrybutorów rozwijających WEB FACTOR Studio 2.0. Każda decyzja projektowa i każdy wprowadzany subsystem musi być bezwzględnie zgodny z poniższymi zasadami.

---

## 2. Dziesięć Nadrzędnych Zasad Architektonicznych

### 1. Separation of Concerns (Rozdzielenie Odpowiedzialności)
* **Zasada:** Edytor (Studio UI), Silnik Wykonawczy (Runtime), Rejestr (Component Registry) oraz Model Domenowy (BuilderDocument) są odizolowane od siebie.
* **Uzasadnienie:** Zapobiega powiązaniom typu spagetti code i umożliwia niezależny rozwój paneli UI bez ryzyka uszkodzenia generatora stron.
* **Przykład:** Komponent Inspectora `FlexField.tsx` odpowiada wyłącznie za edycję wartości i wysłanie komendy — nie zajmuje się bezpośrednią manipulacją DOM w iframe.

### 2. Single Responsibility (Jednoznaczna Odpowiedzialność)
* **Zasada:** Każdy moduł, klasa, funkcja czy typ odpowiada za jedną wyodrębnioną funkcję w systemie.
* **Uzasadnienie:** Łatwość testowania jednostkowego i przewidywalność zachowań.
* **Przykład:** Funkcja `borderToCSS()` zajmuje się wyłącznie przekształcaniem właściwości obramowania na CSS — nie waliduje jednostek ani nie pobiera stanu z Reducera.

### 3. Immutable Domain (Niezmienny Model Domenowy)
* **Zasada:** Stan dokumentu `BuilderDocument` jest zamrożony i modyfikowalny wyłącznie poprzez czyste transformacje i tworzenie nowych kopii obiektów.
* **Uzasadnienie:** Bezproblemowe działanie silnika Undo/Redo na stosie `HistoryStack` oraz ochrona przed wyciekami pamięci i niekontrolowanymi efektami ubocznymi.
* **Przykład:** Każe wywołanie `applyCommandToDocument(doc, cmd)` zwraca nowy obiekt `BuilderDocument` bez nadpisywania pól obiektu wejściowego.

### 4. Pure Functions (Czyste Funkcje)
* **Zasada:** Transformatory danych (np. `radiusToCSS`, `validateOverflowProps`) są czystymi funkcjami bez efektów ubocznych (bez dostępu do zmiennych globalnych czy I/O).
* **Uzasadnienie:** Gwarancja determinizmu oraz najwyższa wydajność podczas kompilacji podglądu.

### 5. Deterministic Runtime (Deterministyczny Silnik Wykonawczy)
* **Zasada:** Identyczny stan dokumentu `BuilderDocument` wygeneruje zawsze dokładnie ten sam kod HTML/CSS w silniku Runtime.
* **Uzasadnienie:** Pewność, że podgląd widziany w edytorze jest w 100% tożsamy z opublikowanym sklepem produkcyjnym.

### 6. Registry as Extension Point (Rejestr jako Punkt Rozszerzeń)
* **Zasada:** Wszystkie komponenty, sekcje i pola Inspectora muszą być rejestrowane deklaratywnie w `ComponentRegistry` i `propertyFieldRegistry`.
* **Uzasadnienie:** Umożliwia pisanie wtyczek, nowych szablonów i rozszerzeń bez edytowania core'owego kodu aplikacji.

### 7. Composition over Inheritance (Kompozycja ponad Dziedziczenie)
* **Zasada:** Komponenty i właściwości budowane są z małych, składalnych klocków (np. `ResponsiveValue<T>`, `BorderProps`, `RadiusProps`).
* **Uzasadnienie:** Wyeliminowanie sztywnych hierarchii klas na rzecz elastycznego dopasowania właściwości.

### 8. Documentation First (Dokumentacja Przed Kodem)
* **Zasada:** Żaden kod nie powstaje przed sporządzeniem i zatwierdzeniem specyfikacji w `docs/studio/` (zgodnie z 8-fazowym procesem inżynieryjnym).
* **Uzasadnienie:** Wyeliminowanie nieprzemyślanych decyzji architektonicznych i konfliktów w repozytorium.

### 9. Fail Fast Validation (Szybkie Wykrywanie Błędów)
* **Zasada:** Niepoprawne dane i wartości ujemne są odrzucane na poziomie walidatora Inspectora zanim trafią do Reducera lub Runtime.
* **Uzasadnienie:** Ochrona silnika podglądu przed awariami i wyrenderowaniem uszkodzonych stylów CSS.

### 10. Backward Compatibility (Wsteczna Kompatybilność)
* **Zasada:** Ewolucja struktury dokumentów i typów nie może psuć istniejących projektów użytkowników. Zmiany wprowadza się poprzez dodawanie opcjonalnych pól lub wersjonowanie schematów.
