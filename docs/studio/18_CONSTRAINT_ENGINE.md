# C16.18 — WEB FACTOR Studio Constraint Engine

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 18_CONSTRAINT_ENGINE.md  
> **Status:** Draft  
> **Zależności:** 06_LAYOUT_ENGINE.md, 12_RESPONSIVE_ENGINE.md

---

## 1. Cel

Constraint Engine to system, który pozwala zdefiniować jak element zachowuje się względem rodzica przy zmianie rozmiaru. Zamiast ręcznego ustawiania pozycji na każdym breakpoincie, użytkownik ustawia **constraints** (więzy) i reszta dzieje się automatycznie.

To jest kluczowa różnica między CSS a profesjonalnym builderem (Figma, Webflow, Framer).

---

## 2. Koncepcja

```
┌─────────────────────────────────────────────┐
│                 KONTENER                      │
│                                               │
│  ┌─────────────────────────────────┐        │
│  │         ELEMENT                  │        │
│  │                                  │        │
│  │  ← Left: 20px                    │        │
│  │  → Right: 20px                   │        │
│  │  ↑ Top: 40px                     │        │
│  │  ↓ Bottom: auto                  │        │
│  │                                  │        │
│  └─────────────────────────────────┘        │
│                                               │
│  Przy zmianie rozmiaru kontenera:             │
│  - Left 20px → zawsze 20px od lewej           │
│  - Right 20px → zawsze 20px od prawej         │
│  - Szerokość → auto (rozciąga się)            │
│  - Top 40px → zawsze 40px od góry             │
└─────────────────────────────────────────────┘
```

---

## 3. Typy constraintów

### 3.1 Horizontal constraints

```
LEFT        → element pinned do lewej krawędzi
RIGHT       → element pinned do prawej krawędzi
LEFT+RIGHT  → element rozciąga się (szerokość = kontener - left - right)
CENTER      → element wyśrodkowany (pozycja = 50% - width/2)
SCALE       → element skaluje się proporcjonalnie do rodzica
STRETCH     → element rozciąga się na całą szerokość (left=0, right=0)
```

### 3.2 Vertical constraints

```
TOP         → element pinned do górnej krawędzi
BOTTOM      → element pinned do dolnej krawędzi
TOP+BOTTOM  → element rozciąga się (wysokość = kontener - top - bottom)
MIDDLE      → element wyśrodkowany pionowo
SCALE       → element skaluje się proporcjonalnie
STRETCH     → element rozciąga się na całą wysokość
```

### 3.3 Pin

```
PIN_LEFT    → left: 20px, right: auto, width: fixed
PIN_RIGHT   → right: 20px, left: auto, width: fixed
PIN_TOP     → top: 20px, bottom: auto, height: fixed
PIN_BOTTOM  → bottom: 20px, top: auto, height: fixed
PIN_ALL     → wszystkie krawędzie pinned (fixed margin)
```

---

## 4. Constraint UI

### 4.1 Visual editor

```
┌──────────────────────────────────────┐
│  CONSTRAINTS                          │
│                                       │
│          ┌─────┬─────┐               │
│          │  ↑   │  ↑  │               │
│          │ Top  │ Bot │               │
│          │ 40px │ auto│               │
│          ├─────┼─────┤               │
│          │  ←   │  →  │               │
│          │ Left │ Right│              │
│          │ 20px │ 20px│               │
│          ├─────┼─────┤               │
│          │  ⇔   │  ↕  │               │
│          │Fixed │Fixed│               │
│          │ 300px│ 200 │               │
│          └─────┴─────┘               │
│                                       │
│  Preview:                             │
│  ┌──────────────────────────────┐    │
│  │          KONTENER             │    │
│  │  ┌──────────────────────┐   │    │
│  │  │     ELEMENT           │   │    │
│  │  │     (auto width)     │   │    │
│  │  └──────────────────────┘   │    │
│  │  ← 20px       20px →       │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### 4.2 Diagram constraints (jak Figma)

```
┌──────────────────────────────┐
│         KONTENER              │
│  ┌─┬──────────────────────┬─┐│
│  │↑│                      │↑││
│  │││                      ││││
│  │││      ELEMENT         ││││
│  │││                      ││││
│  │↓│                      │↓││
│  └─┴──────────────────────┴─┘│
│  ←─ 20px ─→         ←─ 20px ─→│
└──────────────────────────────┘

Linie:
- Czerwona ←→ pokazuje pinned distance
- Przerywana → auto (element będzie się rozciągał)
- Kropkowana → fixed (wymiar stały)
```

---

## 5. Implementacja

```typescript
interface Constraints {
  // Horizontal
  horizontal: 'LEFT' | 'RIGHT' | 'LEFT_RIGHT' | 'CENTER' | 'SCALE' | 'STRETCH';
  left?: number;           // px
  right?: number;          // px
  
  // Vertical
  vertical: 'TOP' | 'BOTTOM' | 'TOP_BOTTOM' | 'MIDDLE' | 'SCALE' | 'STRETCH';
  top?: number;            // px
  bottom?: number;         // px
  
  // Fixed dimensions (gdy nie ma stretch)
  fixedWidth?: number;     // px
  fixedHeight?: number;    // px
  
  // Responsive
  responsiveScale?: boolean;  // czy skala zmienia się z breakpointem
}

function applyConstraints(
  element: { x: number; y: number; width: number; height: number },
  container: { width: number; height: number },
  constraints: Constraints
): { x: number; y: number; width: number; height: number } {
  let { x, y, width, height } = element;
  
  // Horizontal
  switch (constraints.horizontal) {
    case 'LEFT':
      x = constraints.left ?? x;
      width = constraints.fixedWidth ?? width;
      break;
    case 'RIGHT':
      x = container.width - (constraints.right ?? 0) - (constraints.fixedWidth ?? width);
      width = constraints.fixedWidth ?? width;
      break;
    case 'LEFT_RIGHT':
      x = constraints.left ?? 0;
      width = container.width - (constraints.left ?? 0) - (constraints.right ?? 0);
      break;
    case 'CENTER':
      x = (container.width - width) / 2;
      break;
    case 'SCALE':
      width = container.width * (width / container.width);
      break;
    case 'STRETCH':
      x = 0;
      width = container.width;
      break;
  }
  
  // Vertical
  switch (constraints.vertical) {
    case 'TOP':
      y = constraints.top ?? y;
      height = constraints.fixedHeight ?? height;
      break;
    case 'BOTTOM':
      y = container.height - (constraints.bottom ?? 0) - (constraints.fixedHeight ?? height);
      height = constraints.fixedHeight ?? height;
      break;
    case 'TOP_BOTTOM':
      y = constraints.top ?? 0;
      height = container.height - (constraints.top ?? 0) - (constraints.bottom ?? 0);
      break;
    case 'MIDDLE':
      y = (container.height - height) / 2;
      break;
    case 'SCALE':
      height = container.height * (height / container.height);
      break;
    case 'STRETCH':
      y = 0;
      height = container.height;
      break;
  }
  
  return { x, y, width, height };
}
```

---

## 6. Responsive constraints

```typescript
// Przykład: Przycisk w hero
// Desktop: left=20px, right=20px → rozciąga się
// Mobile: left=10px, right=10px → rozciąga się, ale mniejszy margines
// Tablet: center → wyśrodkowany

const buttonConstraints: ResponsiveValue<Constraints> = {
  desktop: { horizontal: 'LEFT_RIGHT', left: 20, right: 20, vertical: 'TOP', top: 40 },
  tablet: { horizontal: 'LEFT_RIGHT', left: 16, right: 16, vertical: 'TOP', top: 32 },
  mobile: { horizontal: 'CENTER', width: 200, vertical: 'TOP', top: 24 },
};
```

---

## 7. Automatyczne constraints (AI)

```typescript
// AI może sugerować constraints na podstawie layoutu
function suggestConstraints(element: SectionNode, parent: SectionNode): Constraints {
  const parentWidth = parent.props.width ?? 1200;
  const elWidth = element.props.width ?? 300;
  const elLeft = element.props.x ?? 0;
  const elRight = parentWidth - elLeft - elWidth;
  
  // Jeśli element jest blisko lewej i prawej → LEFT_RIGHT
  if (elLeft < 20 && elRight < 20) {
    return { horizontal: 'LEFT_RIGHT', left: elLeft, right: elRight, vertical: 'TOP', top: element.props.y ?? 0 };
  }
  
  // Jeśli element jest blisko lewej → LEFT
  if (elLeft < 20) {
    return { horizontal: 'LEFT', left: elLeft, vertical: 'TOP', top: element.props.y ?? 0 };
  }
  
  // Jeśli element jest na środku → CENTER
  if (Math.abs(elLeft - (parentWidth - elWidth) / 2) < 10) {
    return { horizontal: 'CENTER', vertical: 'TOP', top: element.props.y ?? 0 };
  }
  
  // Domyślnie → LEFT + TOP
  return { horizontal: 'LEFT', left: elLeft, vertical: 'TOP', top: element.props.y ?? 0 };
}
```

---

## 8. Zależności

| Moduł | Zależność |
|-------|-----------|
| ConstraintEngine | LayoutEngine (kompatybilność z flex/grid) |
| CanvasEngine | ConstraintEngine (renderowanie w preview) |
| Inspector | ConstraintEditor UI |
| ResponsiveEngine | Per-breakpoint constraints |
| DragEngine | Auto-constraint podczas przeciągania |
| AIEngine | Sugestia constraintów |

---

## 9. Decision Record

### DR-CON-001: Constraints jako osobny engine, nie część LayoutEngine
**Status:** Proposed  
**Uzasadnienie:** Constraints działają na innym poziomie abstrakcji niż flex/grid. Flex definiuje relacje między dziećmi, a constraints definiują pozycję względem rodzica. Oba systemy współistnieją.

