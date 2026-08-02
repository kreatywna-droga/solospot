# Sprint 5C — Canvas Integration Plan

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 54_CANVAS_INTEGRATION_PLAN.md  
> **Status:** Draft — Architecture Plan (Sprint 5C)  
> **Sprint:** 5C — Canvas Completion  
> **Zależności:** 53_CANVAS_COMPLETION_SPECIFICATION.md, 28_RUNTIME_EXECUTION_MODEL.md, 03_CANVAS_ENGINE.md  
>  
> **Proces:** Faza 2 z 8 — Contracts & Integration Pipeline

---

## 1. Przepływ Danych i Pętla Reaktywna (End-to-End Reactive Loop)

W WEB FACTOR Studio zmiana dowolnej właściwości wizualnej lub strukturalnej przechodzi przez jednokierunkowy, przewidywalny cykl przetwarzania. Poniższy schemat ilustruje pełną pętlę integracyjną:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             PIPELINE PRZEPŁYWU                           │
│                                                                          │
│  1. CANVAS (User Click / Drag / Interakcja)                              │
│       │                                                                  │
│       ▼                                                                  │
│  2. RUNTIME (Przechwycenie Zdarzenia Pointer ➔ Wyliczenie Rect)          │
│       │                                                                  │
│       ▼                                                                  │
│  3. INSPECTOR (Odczyt Nowych Props ➔ Edycja wartości w UI)               │
│       │                                                                  │
│       ▼                                                                  │
│  4. HISTORY (Zapis Snapshotu na Stosie HistoryStack - Undo/Redo)         │
│       │                                                                  │
│       ▼                                                                  │
│  5. PREVIEW (Redukcja Dokumentu ➔ Re-kompilacja CSS/HTML)                 │
│       │                                                                  │
│       ▼                                                                  │
│  6. REGISTRY (Weryfikacja ze Schema ComponentRegistry ➔ Render Iframe)   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Szczegółowy Opis Ogniw Pipeline'u

### Faza 1: Canvas (Przechwycenie Interakcji)
* Użytkownik najeżdża kursorem na element wewnątrz obszaru roboczego lub klika w sekcję.
* Przeglądarka przechwytuje zdarzenie `pointermove` / `pointerdown`.
* Jeśli element jest zablokowany, przechwytywanie zostaje zignorowane.

### Faza 2: Runtime (Wyliczenie Bounding Box i Nadanie Zdarzenia)
* Skrypt mostka umieszczony wewnątrz ramki Iframe (`runtime-bridge.js`) lokalizuje element DOM pod kursorem.
* Wyliczane są wyjściowe wymiary oraz pozycja przestrzenna względem okna podglądu: `getBoundingClientRect()`.
* Przesyłana jest wiadomość IPC/PostMessage:
  ```json
  {
    "type": "CANVAS_NODE_SELECTED",
    "payload": {
      "nodeId": "sec_hero_123",
      "rect": { "top": 120, "left": 40, "width": 1200, "height": 450 }
    }
  }
  ```

### Faza 3: Inspector (Aktualizacja UI i Dyspatczowanie Komend)
* Po odebraniu identyfikatora węzła, Store edytora aktualizuje stan `selectedNodeId`.
* Panel Inspectora odczytuje definicję typu komponentu z `ComponentRegistry` i pobiera aktualne właściwości `props` dla wybranego elementu.
* Zmiana wartości pola numerycznego lub suwaka w Inspectorze natychmiast generuje komendę `UPDATE_PROPS`.

### Faza 4: History (Stos Undo/Redo)
* Zanim nowa komenda zmodyfikuje dokument, obecny stan `BuilderDocument` jest pakowany w niezmienny snapshot i umieszczany w `HistoryStack`.
* Obsługiwane są skróty klawiszowe `Ctrl+Z` (Undo) oraz `Ctrl+Shift+Z` / `Ctrl+Y` (Redo), natychmiastowo przywracające poprzednie stany dokumentu.

### Faza 5: Preview (Kompilacja w Czasie Rzeczywistym)
* Zmodyfikowany `BuilderDocument` przechodzi przez funkcję `compileDocument()`.
* Silnik wylicza minimalną różnicę styli (CSS Delta) oraz aktualizuje obiekt stanu widoku.
* Przesyłany jest komunikat do ramki podglądu Iframe.

### Faza 6: Registry (Rejestr Komponentów i Dynamiczny Redraw)
* Weryfikacja, czy nowe właściwości są zgodne ze schematem `PropSchema` zdefiniowanym w `ComponentRegistry`.
* Ramka Iframe podmienia zmodyfikowane reguły stylów w nagłówku `<style id="studio-live-styles">`, zapewniając płynną modyfikację wyglądu w 60 FPS bez przeładowywania drzewa DOM.

---

## 3. Protokół Komunikacji (PostMessage Channel Protocol)

| Nazwa Komunikatu | Nadawca ➔ Odbiorca | Payload (Dane) | Cel |
|------------------|-------------------|----------------|-----|
| `STUDIO_INIT` | Canvas ➔ Iframe | `{ mode: 'EDIT', viewport: 'desktop' }` | Inicjalizacja połączenia i aktywacja nakładek edycyjnych w Iframe. |
| `DOCUMENT_SYNC` | Canvas ➔ Iframe | `{ document: BuilderDocument }` | Przesłanie pełnego stanu dokumentu przy pierwszym załadowaniu. |
| `STYLE_PATCH` | Canvas ➔ Iframe | `{ nodeId: string, css: Record<string, string> }` | Natychmiastowa aplikacja zmodyfikowanych reguł stylów CSS. |
| `NODE_CLICKED` | Iframe ➔ Canvas | `{ nodeId: string, rect: DOMRect }` | Poinformowanie edytora o kliknięciu elementu w celu aktywacji w Inspectorze. |
| `NODE_RESIZED` | Canvas ➔ Iframe | `{ nodeId: string, width: number, height: number }` | Zgłoszenie fizycznej zmiany wymiaru z uchwytu nakładki. |
