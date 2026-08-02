# C16.19 — WEB FACTOR Studio Smart Guides

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 19_SMART_GUIDES.md  
> **Status:** Draft  
> **Zależności:** 03_CANVAS_ENGINE.md, 04_SELECTION_SYSTEM.md, 05_DRAG_DROP_ENGINE.md

---

## 1. Cel

Smart Guides to system inteligentnych prowadnic, które pojawiają się podczas przeciągania i pozycjonowania elementów. Działają dokładnie jak w Figmie — czerwone linie, odstępy, wyrównanie, wykrywanie środka.

**Obecnie:** GridSystem.ts z snap to grid.  
**Docelowo:** Pełny system smart guides jak w Figmie.

---

## 2. Typy prowadnic

### 2.1 Alignment Guides (czerwone linie)

```
Przeciągam element:

1. Wyrównanie do lewej krawędzi innego elementu:
   ┌───┐       ┌───┐
   │ A │       │ B │ ← przeciągam
   └───┘       └───┘
   ──── czerwona linia ────
   
2. Wyrównanie do środka:
   ┌─────┐ ┌─────┐
   │  A  │ │  B  │ ← przeciągam
   └─────┘ └─────┘
      ↑ czerwona linia przez środek

3. Wyrównanie do prawej:
   ┌───┐         ┌───┐
   │ A │         │ B │ ← przeciągam
   └───┘         └───┘
                 ──── czerwona linia ────
```

### 2.2 Distance Guides (odstępy)

```
Przeciągam między dwa elementy:

┌───┐              ┌───┐
│ A │    ← 20px →  │ B │ ← przeciągam
└───┘              └───┘
     ── strzałka + "20px" ──

System pokazuje:
- Odstęp od najbliższego elementu
- Odstęp od krawędzi kontenera
- Równe odstępy (gdy element jest idealnie między dwoma)
```

### 2.3 Center Detection

```
┌──────────────────────────────┐
│           KONTENER            │
│                               │
│               ┌───┐          │
│               │ B │          │
│               └───┘          │
│               ↑              │
│          czerwona linia       │
│          przez środek         │
└──────────────────────────────┘

Pionowa i pozioma linia przez środek kontenera
Pokazuje się gdy element jest w okolicy środka (±10px)
```

### 2.4 Margin/Padding Detection

```
┌──────────────────────────────┐
│  ← margin: 24px →            │
│  ┌────────────────────────┐  │
│  │  ← padding: 16px →     │  │
│  │  ┌──────────────────┐  │  │
│  │  │    ELEMENT        │  │  │
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘

- Wykrywa istniejące marginesy/paddingi
- Pokazuje je jako przerywane linie z wartościami
- Przy przeciąganiu: "Snap to margin" / "Snap to padding"
```

### 2.5 Equal Spacing Distribution

```
┌───┐     ┌───┐     ┌───┐
│ A │ ←─→ │ B │ ←─→ │ C │
└───┘ 24px└───┘ 24px└───┘
       ── równy odstęp ──

Gdy element jest przeciągany między dwa inne,
system wykrywa "idealny środek" z równymi odstępami.
```

---

## 3. Smart Guide Engine

```typescript
interface SmartGuide {
  type: 'ALIGNMENT' | 'DISTANCE' | 'CENTER' | 'MARGIN' | 'PADDING' | 'EQUAL_SPACING';
  axis: 'HORIZONTAL' | 'VERTICAL';
  position: number;           // pozycja w px
  start: number;              // początek linii
  end: number;                // koniec linii
  label?: string;             // "24px", "Center", "Equal"
  color: string;              // '#ff0000' (alignment), '#00ff00' (distance)
  opacity: number;            // 0.3 - 1.0
  threshold: number;          // dystans w px (im bliżej, tym bardziej przezroczyste)
}

class SmartGuideEngine {
  private threshold = 8;      // px do aktywacji prowadnicy
  private elements: ElementBounds[];
  
  computeGuides(
    draggingElement: ElementBounds,
    allElements: ElementBounds[],
    container: ContainerBounds
  ): SmartGuide[] {
    const guides: SmartGuide[] = [];
    
    // 1. Alignment guides (równaj do innych elementów)
    guides.push(...this.computeAlignmentGuides(draggingElement, allElements));
    
    // 2. Distance guides (odstępy)
    guides.push(...this.computeDistanceGuides(draggingElement, allElements));
    
    // 3. Center guides (środek kontenera)
    guides.push(...this.computeCenterGuides(draggingElement, container));
    
    // 4. Margin/Padding guides
    guides.push(...this.computeMarginGuides(draggingElement, container));
    
    // 5. Equal spacing
    guides.push(...this.computeEqualSpacingGuides(draggingElement, allElements));
    
    return guides;
  }
  
  private computeAlignmentGuides(
    drag: ElementBounds,
    elements: ElementBounds[]
  ): SmartGuide[] {
    const guides: SmartGuide[] = [];
    
    for (const el of elements) {
      if (el.id === drag.id) continue;
      
      // Lewa krawędź do lewej
      if (Math.abs(drag.x - el.x) < this.threshold) {
        guides.push({
          type: 'ALIGNMENT',
          axis: 'VERTICAL',
          position: el.x,
          start: Math.min(drag.y, el.y),
          end: Math.max(drag.y + drag.height, el.y + el.height),
          label: undefined,
          color: '#ff0000',
          opacity: 1 - Math.abs(drag.x - el.x) / this.threshold,
          threshold: this.threshold,
        });
      }
      
      // Prawa krawędź do prawej
      const dragRight = drag.x + drag.width;
      const elRight = el.x + el.width;
      if (Math.abs(dragRight - elRight) < this.threshold) {
        // ... podobnie
      }
      
      // Środek do środka
      const dragCenter = drag.x + drag.width / 2;
      const elCenter = el.x + el.width / 2;
      if (Math.abs(dragCenter - elCenter) < this.threshold) {
        // ... linia przez środek
      }
    }
    
    return guides;
  }
  
  private computeDistanceGuides(
    drag: ElementBounds,
    elements: ElementBounds[]
  ): SmartGuide[] {
    const guides: SmartGuide[] = [];
    
    for (const el of elements) {
      if (el.id === drag.id) continue;
      
      // Odległość między krawędziami
      const distance = Math.abs(drag.x - (el.x + el.width));
      if (distance < 50) {  // tylko bliskie elementy
        guides.push({
          type: 'DISTANCE',
          axis: 'HORIZONTAL',
          position: (drag.x + el.x + el.width) / 2,
          start: el.x + el.width,
          end: drag.x,
          label: `${Math.round(distance)}px`,
          color: '#00ff00',
          opacity: 0.8,
          threshold: this.threshold,
        });
      }
    }
    
    return guides;
  }
  
  private computeCenterGuides(
    drag: ElementBounds,
    container: ContainerBounds
  ): SmartGuide[] {
    const guides: SmartGuide[] = [];
    
    // Środek poziomy
    const containerCenter = container.width / 2;
    const elementCenter = drag.x + drag.width / 2;
    if (Math.abs(elementCenter - containerCenter) < this.threshold) {
      guides.push({
        type: 'CENTER',
        axis: 'VERTICAL',
        position: containerCenter,
        start: 0,
        end: container.height,
        label: 'Center',
        color: '#ff0000',
        opacity: 0.8,
        threshold: this.threshold,
      });
    }
    
    // Środek pionowy
    // ... podobnie
    
    return guides;
  }
}
```

---

## 4. Renderowanie prowadnic

```typescript
// SmartGuidesOverlay.tsx
// Osobna warstwa canvasu (z-index: 15, między gridem a overlayem)

function SmartGuidesOverlay({ guides }: { guides: SmartGuide[] }) {
  return (
    <svg className="absolute inset-0 pointer-events-none z-15">
      {guides.map((guide, i) => (
        <React.Fragment key={i}>
          {guide.axis === 'VERTICAL' ? (
            <line
              x1={guide.position}
              y1={guide.start}
              x2={guide.position}
              y2={guide.end}
              stroke={guide.color}
              strokeOpacity={guide.opacity}
              strokeWidth={1}
              strokeDasharray={guide.type === 'DISTANCE' ? '4 2' : undefined}
            />
          ) : (
            <line
              x1={guide.start}
              y1={guide.position}
              x2={guide.end}
              y2={guide.position}
              stroke={guide.color}
              strokeOpacity={guide.opacity}
              strokeWidth={1}
            />
          )}
          
          {/* Etykieta dla distance */}
          {guide.label && (
            <text
              x={(guide.start + guide.end) / 2}
              y={guide.position - 8}
              fill={guide.color}
              fontSize={11}
              textAnchor="middle"
              className="font-mono"
            >
              {guide.label}
            </text>
          )}
        </React.Fragment>
      ))}
    </svg>
  );
}
```

---

## 5. Integracja z Drag Engine

```typescript
// Podczas dragu, SmartGuideEngine oblicza prowadnice
// DragEngine używa ich do snapowania

function onDragUpdate(position: { x: number; y: number }) {
  const guides = smartGuideEngine.computeGuides(
    { ...position, width: dragElement.width, height: dragElement.height },
    allElements,
    container
  );
  
  // Snap do najbliższej prowadnicy
  const snappedPosition = snapToGuides(position, guides);
  
  // Wyślij do overlay
  setActiveGuides(guides);
  
  // Update pozycji
  updateElementPosition(snappedPosition);
}
```

---

## 6. UI Settings

```
▼ SMART GUIDES
  [● Show alignment guides]
  [● Show distance guides]
  [● Snap to guides]
  [○ Show center guides]
  Threshold: [8] px
  [Reset]
```

---

## 7. Pliki

```
src/components/builder/canvas/guides/
├── SmartGuideEngine.ts       — engine obliczający prowadnice
├── SmartGuidesOverlay.tsx    — warstwa SVG z prowadnicami
├── AlignmentGuide.tsx        — prowadnica wyrównania
├── DistanceGuide.tsx         — prowadnica odstępu
├── CenterGuide.tsx           — prowadnica środka
└── MarginGuide.tsx           — prowadnica marginesu/padding
```

