# Sprint 5C — Overlay Architecture Specification

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 56_OVERLAY_ARCHITECTURE.md  
> **Status:** Draft — Architecture Specification (Sprint 5C)  
> **Sprint:** 5C — Canvas Completion  
> **Zależności:** 03_CANVAS_ENGINE.md, 53_CANVAS_COMPLETION_SPECIFICATION.md, 55_SELECTION_ENGINE_SPEC.md  
>  
> **Proces:** Faza 4 z 8 — Overlays & Interactivity

---

## 1. Architektura Warstw Nakładek (Overlays System Architecture)

Warstwa nakładek edycyjnych (Overlays Layer) znajduje się bezpośrednio nad ramką Iframe w oknie Canvasu edytora. Jej zadaniem jest dostarczanie wizualnych informacji o granicach elementów, punktach kontrolnych oraz udostępnianie przycisków akcji bez ingerowania w samą treść HTML wyrenderowanej strony.

```
┌─────────────────────────────────────────────────────────┐
│ CANVAS CONTAINER (Parent React Window)                  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ OVERLAY LAYER (Absolute Positioned Pointer-Events)│  │
│  │  - Selection Bounding Box (Violet Border)         │  │
│  │  - 8-Point Resize Handles (Corners + Edges)       │  │
│  │  - Floating Action Toolbar (Delete, Dup, Nav)     │  │
│  └─────────────────────────┬─────────────────────────┘  │
│                            │ Absolute Coordinates Sync  │
│  ┌─────────────────────────▼─────────────────────────┐  │
│  │ IFRAME DOM CONTENT (Isolated Page Preview)        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Nakładka Zaznaczenia i Ramka Ograniczająca (Bounding Box & Selection Overlay)

### 2.1 Specyfikacja Ramki Zaznaczenia
* **Kolorystyka:** Fiolet akcentujący (`#7c3aed` / `violet-600`) o grubości `2px`.
* **Kalkulacja Współrzędnych:** Pozycja ramki wyliczana jest na podstawie prostokąta `getBoundingClientRect()` zaznaczonego elementu z uwzględnieniem aktualnego przesunięcia przewijania (Scroll Offset) i skali Zoomu Canvasu:
  $$\text{OverlayTop} = (\text{ElementTop} - \text{IframeScrollY}) \times \text{ZoomFactor}$$
  $$\text{OverlayLeft} = (\text{ElementLeft} - \text{IframeScrollX}) \times \text{ZoomFactor}$$

### 2.2 Floating Action Toolbar (Pływający Pasek Narzędzi)
Doki na górnej krawędzi nakładki zaznaczenia i wyświetla:
1. **Etykietę Nazwy Komponentu:** Np. `Hero Section` / `Product Grid`.
2. **Ścieżkę Nadrzędną (Breadcrumb Parent):** Ikona przejścia do kontenera nadrzędnego.
3. **Przycisk Przesunięcia w Górę / w Dół:** Szybka zmiana kolejności sekcji.
4. **Przycisk Duplikacji:** Wywołanie komendy `DUPLICATE_SECTION`.
5. **Przycisk Usuwania (Kosz):** Wywołanie komendy `DELETE_SECTION`.

---

## 3. Uchwyty Zmiany Rozmiaru (Resize Handles)

W Sprincie 5C specyfikujemy układ 8-punktowych uchwytów zmiany rozmiaru rozmieszczonych na krawędziach i narożnikach zaznaczonego Bounding Boxa:

```
(NW) ┌─────── (N) ───────┐ (NE)
     │                   │
 (W) │  SELECTED ELEMENT │ (E)
     │                   │
(SW) └─────── (S) ───────┘ (SE)
```

| Uchwyt | Kursor Myszki | Właściwość Modyfikowana |
|--------|---------------|-------------------------|
| **E / W** (Prawy / Lewy) | `ew-resize` | Szerokość (`width` / `flex-basis`) |
| **N / S** (Górny / Dolny) | `ns-resize` | Wysokość (`height` / `min-height`) |
| **NW / NE / SW / SE** | `nwse-resize` / `nesw-resize` | Proporcjonalna zmiana szerokości i wysokości |

---

## 4. Przyszłościowa Nakładka Rotacji (Rotation Handle - Future Architecture)

W przyszłych wersjach Visual Advanced na górnej krawędzi nakładki dodany zostanie dedykowany uchwyt rotacji (okrągły punkt wysunięty o 24px nad krawędź N):

```
       ( ↺ Rotation Handle )
                 │
(NW) ┌───────────┴───────────┐ (NE)
     │                       │
```

Wyliczenie kąta rotacji opiera się na funkcji `Math.atan2(deltaY, deltaX)` przeliczającej wektor przesunięcia kursora względem środka ciężkości elementu.
