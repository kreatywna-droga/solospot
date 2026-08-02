# Architecture Glossary — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 75_ARCHITECTURE_GLOSSARY.md  
> **Status:** Standard Terminology Reference  
> **Zależności:** Wszystkie dokumenty w `docs/studio/`  
>  
> **Proces:** Oficjalny Słownik Pojęć Architektonicznych

---

## 1. Słownik Pojęć Architektonicznych

### 1. Runtime (Silnik Wykonawczy)
* **Definicja:** Lekkie, zoptymalizowane środowisko wykonawcze renderujące stronę internetową na podstawie dokumentu JSON. Działa zarówno wewnątrz Iframe na Canvasie edytora, jak i na opublikowanych serwisach klientów.
* **Zastosowanie:** Generowanie wynikowego kodu HTML/CSS w 60 FPS.
* **Powiązane Dokumenty:** `28_RUNTIME_EXECUTION_MODEL.md`, `53_CANVAS_COMPLETION_SPECIFICATION.md`.

### 2. Registry (Rejestr Komponentów i Pól)
* **Definicja:** Centralny magazyn przechowujący definicje typów komponentów (`ComponentRegistry`) oraz schematy edytowalnych pól Inspectora (`propertyFieldRegistry`).
* **Zastosowanie:** Rozszerzalność edytora i dynamiczne generowanie formantów UI.
* **Powiązane Dokumenty:** `08_COMPONENT_SYSTEM.md`, `62_BUILDER_TRACEABILITY_MATRIX.md`.

### 3. Property (Właściwość)
* **Definicja:** Pojedynczy atrybut opisujący wygląd, układ lub zachowanie węzła w drzewie dokumentu (np. `borderRadius`, `overflowX`, `gridTemplateColumns`).
* **Zastosowanie:** Edycja właściwości w Inspectorze i mapowanie na reguły stylów CSS.
* **Powiązane Dokumenty:** `31_LAYOUT_PROPERTY_SPECIFICATION.md`, `61_PROPERTY_DESIGN_GUIDELINES.md`.

### 4. Snapshot (Migawka Stanu)
* **Definicja:** Zamrożona w czasie, pełna reprezentacja dokumentu `BuilderDocument` przechowana na stosie historii `HistoryStack`.
* **Zastosowanie:** Obsługa operacji cofania i ponawiania zmian (Undo / Redo).
* **Powiązane Dokumenty:** `02_BUILDER_CORE.md`, `14_HISTORY_ENGINE.md`.

### 5. ResponsiveValue<T> (Wartość Reaktywna)
* **Definicja:** Generyczny kontener opakowujący wartość właściwości dla 3 głównych breakpointów: `desktop`, `tablet`, `mobile`.
* **Zastosowanie:** Tworzenie responsywnych layoutów dopasowujących się do szerokości ekranu.
* **Powiązane Dokumenty:** `12_RESPONSIVE_ENGINE.md`, `32_RESPONSIVE_VALUE_MODEL.md`.

### 6. Builder (Edytor Wizualny)
* **Definicja:** Całość aplikacji edytora wizualnego WEB FACTOR Studio 2.0 (obejmuje Shell, Canvas, Inspector, Left Sidebar oraz Store).
* **Zastosowanie:** Interfejs do budowania i edycji stron bez konieczności pisania kodu.
* **Powiązane Dokumenty:** `00_STUDIO_VISION.md`, `01_STUDIO_ARCHITECTURE.md`.

### 7. Canvas (Obszar Roboczy)
* **Definicja:** Centralny widok edytora prezentujący podgląd na żywo wewnątrz ramki Iframe z warstwą wizualnych nakładek (Overlays, Selection Bounding Box).
* **Zastosowanie:** Bezpośrednia wizualizacja i interakcja z budowaną stroną.
* **Powiązane Dokumenty:** `03_CANVAS_ENGINE.md`, `53_CANVAS_COMPLETION_SPECIFICATION.md`.

### 8. Inspector (Panel Właściwości)
* **Definicja:** Prawy panel boczny edytora wyświetlający edytowalne kategorie i formularze właściwości dla zaznaczonego elementu.
* **Zastosowanie:** Zmiana wartości styli i ustawień komponentów.
* **Powiązane Dokumenty:** `07_INSPECTOR.md`, `66_PROPERTY_EVOLUTION_GUIDE.md`.

### 9. ADR (Architectural Decision Record)
* **Definicja:** Dokument rejestrujący kluczową decyzję architektoniczną wraz z jej kontekstem, konsekwencjami i alternatywami.
* **Zastosowanie:** Trwałe zapisywanie wyznaczonych standardów technicznych.
* **Powiązane Dokumenty:** `62_BUILDER_TRACEABILITY_MATRIX.md`, ADR-VISUAL-001.

### 10. Integration Review (Przegląd Integracyjny)
* **Definicja:** Etap odbioru jakościowego, w którym weryfikuje się poprawne przesyłanie komend i współprace nowego subsystemu ze Store'em i Canvasem.
* **Zastosowanie:** Faza 7 z 8 w cyklu wytwórczym.
* **Powiązane Dokumenty:** `36_STUDIO_ENGINEERING_PROCESS.md`, `60_SUBSYSTEM_CHECKLIST.md`.

### 11. Architecture Freeze (Zamrożenie Architektury)
* **Definicja:** Formalny stan zamrożenia kodu i specyfikacji po pomyślnym odbiorze integracyjnym.
* **Zastosowanie:** Blokada przed niekontrolowanymi zmianami w zatwierdzonym subsystemie.
* **Powiązane Dokumenty:** `35_LAYOUT_ENGINE_ARCHITECTURE_FREEZE.md`, `42_GRID_ENGINE_ARCHITECTURE_FREEZE.md`.

### 12. Domain Model (Model Domenowy)
* **Definicja:** Czyste typy TypeScript definiujące niezmienne struktury danych reprezentujące stronę, sekcje i ich atrybuty.
* **Zastosowanie:** Jednoznaczne określenie schematu danych bez zależności od UI.
* **Powiązane Dokumenty:** `61_PROPERTY_DESIGN_GUIDELINES.md`, `74_MODULE_DEPENDENCY_GUIDE.md`.

### 13. Property Field (Pole Formularza Inspectora)
* **Definicja:** Komponent React zarejestrowany w `propertyFieldRegistry` (np. `FlexField`, `GridField`, `OverflowField`), renderujący dany zestaw właściwości.
* **Zastosowanie:** Interfejs do wprowadzania wartości przez użytkownika.
* **Powiązane Dokumenty:** `07_INSPECTOR.md`, `59_BUILDER_SUBSYSTEM_TEMPLATE.md`.
