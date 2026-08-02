# Sprint 5C — Selection Engine Specification

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 55_SELECTION_ENGINE_SPEC.md  
> **Status:** Draft — Architecture Specification (Sprint 5C)  
> **Sprint:** 5C — Canvas Completion  
> **Zależności:** 04_SELECTION_SYSTEM.md, 53_CANVAS_COMPLETION_SPECIFICATION.md  
>  
> **Proces:** Faza 3 z 8 — Domain Model & Contracts

---

## 1. Cel Silnika Zaznaczania (Selection Engine 2.0)

Silnik Zaznaczania (Selection Engine) jest subsystemem odpowiedzialnym za zarządzanie stany aktywnego wyboru elementów na Canvasie, obsługę reakcji na najechanie kursorem (Hover), śledzenie pozycji przestrzennej węzłów oraz udostępnianie spójnego interfejsu API dla paneli edytora (Inspector, Layers Tree, Canvas Overlays).

---

## 2. Model Zaznaczenia (Selection Model)

### 2.1 Struktura Stanu Zaznaczenia (`SelectionState`)

Model stanu zaznaczenia w `CanvasState` zdefiniowany jest w sposób jednoznaczny i niezmienny:

```typescript
export interface SelectionState {
  selectedNodeId: string | null;     // Identyfikator aktualnie wybranego węzła
  hoveredNodeId: string | null;      // Identyfikator węzła pod kursorem
  selectionBounds: DOMRect | null;   // Fizyczne wymiary i pozycja zaznaczonego elementu
  hoverBounds: DOMRect | null;      // Wymiary i pozycja elementu pod kursorem
  isDragging: boolean;               // Czy trwa operacja przeciągania
  isResizing: boolean;               // Czy trwa operacja zmiany rozmiaru
}
```

### 2.2 Zasady Działania Aktywnego Elementu (Active Element Rules)

1. **Jednoznaczność (Single Selection MVP):** W sprincie 5C aktywny może być tylko jeden element naraz (`selectedNodeId`).
2. **Kaskadowość Wyboru:**
   * Kliknięcie w dowolny komponent (np. Przycisk w Hero) zaznacza bezpośrednio ten komponent.
   * Ponowne kliknięcie z klawiszem `Escape` przesuwa zaznaczenie poziom wyżej do kontenera nadrzędnego (`parentSectionId`).
3. **Persystencja Zaznaczenia:** Zaznaczenie elementu pozostaje aktywne podczas modyfikacji dowolnej właściwości w Inspectorze (np. zmiana koloru tła, marginesu czy promienia narożnika).
4. **Automatyczne Czyszczenie:** Usunięcie wybranego węzła (komenda `DELETE_SECTION` / `DELETE_NODE`) automatycznie resetuje `selectedNodeId` do `null` lub przenosi zaznaczenie na węzeł sąsiedni.

---

## 3. Stan Hover i Podświetlanie (Hover System)

1. **Reakcja na kursor (`hoveredNodeId`):** Gdy kursor myszy przemieszcza się nad powierzchnią Iframe, silnik wysyła identyfikator elementu znajdującego się pod wskaźnikiem.
2. **Eliminacja Duplikacji:** Jeśli `hoveredNodeId === selectedNodeId`, nakładka Hover jest ukrywana, a widoczna pozostaje wyłącznie pełna nakładka Zaznaczenia (Selection Overlay).
3. **Etykieta Typu Komponentu:** Nakładka Hover wyświetla niebieskie delikatne obramowanie (`1px solid #3b82f6`) oraz plakietkę z nazwą typu elementu (np. `HeroSection`, `GridContainer`).

---

## 4. Przyszłościowa Architektura Multi-Selection (Future API)

Mimo że MVP Sprintu 5C skupia się na zaznaczaniu pojedynczych elementów, model danych został zaprojektowany z myślą o bezproblemowym rozszerzeniu o Multi-Selection (Sprint 9):

```typescript
// Przyszłościowe rozszerzenie (Sprint 9)
export interface MultiSelectionState extends SelectionState {
  selectedNodeIds: string[];        // Tablica wybranych identyfikatorów
  primaryNodeId: string | null;     // Główny węzeł odniesienia dla wyrównań (Anchor Element)
  groupBounds: DOMRect | null;      // Ograniczający prostokąt zbiorczy dla grupy
}
```

---

## 5. Propozycja API Silnika Zaznaczania (Selection API Proposal)

```typescript
export interface ISelectionEngine {
  selectNode(nodeId: string): void;
  clearSelection(): void;
  hoverNode(nodeId: string | null): void;
  updateBounds(nodeId: string, rect: DOMRect): void;
  getSelectedNode(): SectionNode | null;
  getParentNode(nodeId: string): SectionNode | null;
}
```
