# Sprint 5C — Canvas Test Strategy

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 57_CANVAS_TEST_STRATEGY.md  
> **Status:** Draft — Architecture Specification (Sprint 5C)  
> **Sprint:** 5C — Canvas Completion  
> **Zależności:** 53_CANVAS_COMPLETION_SPECIFICATION.md, 54_CANVAS_INTEGRATION_PLAN.md, 15_PERFORMANCE.md  
>  
> **Proces:** Faza 5 z 8 — Quality & Test Strategy

---

## 1. Cel Strategii Testów Canvasu

Niniejszy dokument definiuje kompleksowy plan weryfikacji i strategię testowania dla domkniętego silnika **Canvas Engine** w Sprincie 5C. Plan obejmuje testy jednostkowe, integracyjne, wydajnościowe oraz testy doświadczeń użytkownika (UX).

---

## 2. Obszary i Poziomy Testowania

### 2.1 Testy Jednostkowe (Unit Tests)

* **Przetwarzanie Wiadomości Mostka (`canvas-bridge.test.ts`):**
  * Weryfikacja poprawności parsowania i walidacji komunikatów `postMessage`.
  * Odrzucanie nieznanych zdarzeń oraz zdarzeń bez prawidłowego podpisu źródła.
* **Kalkulacje Matematyczne Nakładek (`overlay-math.test.ts`):**
  * Weryfikacja przeliczania współrzędnych `getBoundingClientRect()` z uwzględnieniem skalowania Zoom (np. 50%, 100%, 150%) oraz przewijania ekranu ScrollOffset.
  * Test zachowania wyliczania granic dla elementów o zerowych wymiarach (`width: 0` lub `height: 0`).
* **Reducer Stanu Zaznaczenia (`selectionReducer.test.ts`):**
  * Weryfikacja poprawnego ustawiania `selectedNodeId` oraz `hoveredNodeId`.
  * Czyszczenie stanu przy wywołaniu akcji `CLEAR_SELECTION`.

### 2.2 Testy Integracyjne (Integration Tests)

* **Pętla Reaktywna Canvas ➔ Inspector ➔ Preview:**
  * Symulacja kliknięcia w element Iframe i weryfikacja, czy dane w panelu Inspectora zostały natychmiast zaktualizowane.
  * Zmiana wartości w Inspectorze i sprawdzenie, czy odpowiednia reguła CSS została dostarczona do ramki Iframe.
* **Test Integracji ze Stosem Historii (Undo / Redo):**
  * Wykonanie zmiany rozmiaru elementu za pomocą uchwytu nakładki.
  * Wywołanie akcji Undo (`Ctrl+Z`) i sprawdzanie, czy nakładka zaznaczenia powróciła na pierwotne współrzędne.

### 2.3 Testy Wydajnościowe (Performance & Memory Tests)

* **Kryterium Opóźnienia (< 16ms / 60 FPS):**
  * Pomiary płynności podczas ciągłego przeciągania uchwytu zmiana rozmiaru (Resize Handle). Czas przetwarzania pojedynczej klatki nie może przekraczać 16.6ms.
* **Wycieki Pamięci (Memory Leak Protection):**
  * Weryfikacja sprzątania listenerów zdarzeń (`removeEventListener`) przy wielokrotnym przełączaniu stron oraz przeładowywaniu podglądu Iframe.

### 2.4 Testy UX i Responsywności (UX Tests)

* **Przełączanie Viewportów:** Sprawdzenie poprawności skalowania Canvasu przy zmianie trybów Desktop (1280px), Tablet (768px), Mobile (375px).
* **Poprawność Paska Narzędzi (Toolbar):** Sprawdzenie czy przyciski Duplikuj, Usuń, Przesuń w górę/dół wykonują właściwe komendy Reducera.
