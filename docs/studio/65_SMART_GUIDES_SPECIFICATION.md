# Sprint 6B — Smart Guides Specification

> **Status:** ✅ Draft
> **Sprint:** 6B — Smart Guides Foundation
> **Cel:** Specyfikacja systemu Smart Guides — inteligentnych prowadnic wyrównania dla Canvas Studio
> **Zależności:** 19_SMART_GUIDES.md, 01_STUDIO_ARCHITECTURE.md, 61_DRAG_DROP_ARCHITECTURE.md

---

## 1. Cel

Smart Guides to system inteligentnych prowadnic, które pojawiają się podczas przeciągania elementów na Canvasie. Pomagają użytkownikowi precyzyjnie pozycjonować elementy względem siebie i kontenera.

**Kluczowe zasady:**
- Prowadnice są wyłącznie wizualną wskazówką — nie modyfikują dokumentu
- Logika obliczeniowa jest w SmartGuideEngine (builder-core, pure TypeScript)
- Renderowanie jest w SmartGuidesOverlay (React, SVG)
- Snap (przyciąganie) jest delegowane do DragEngine przez SnapGuidance

---

## 2. Typy prowadnic

| Typ | Kolor | Opis | Warunek aktywacji |
|-----|-------|------|-------------------|
| **ALIGNMENT** | Czerwony (#ff0000) | Wyrównanie krawędzi/centrum elementów | Odległość < threshold (8px) |
| **CENTER** | Czerwony (#ff0000) | Linie centrum kontenera | Odległość < threshold × 2 |
| **DISTANCE** | Zielony (#00cc00) | Odległość w px między elementami | Odległość < maxDistance (100px) |
| **MARGIN** | Pomarańczowy (#ff8800) | Wskazanie marginesów/paddingu | Zależne od konfiguracji |
| **SPACING** | Niebieski (#00ccff) | Równomierne rozmieszczenie | Różnica odstępów < threshold |

### 2.1 Alignment

Prowadnice wyrównania testują 6 punktów dla każdej pary elementów:

```
Pionowe (X):
  - Lewa krawędź do lewej krawędzi
  - Prawa krawędź do prawej krawędzi
  - Centrum X do centrum X
  - Lewa do prawej (element left do innego right)
  - Prawa do lewej (element right do innego left)

Poziome (Y):
  - Górna krawędź do górnej krawędzi
  - Dolna krawędź do dolnej krawędzi
  - Centrum Y do centrum Y
  - Góra do dołu (element top do innego bottom)
  - Dół do góry (element bottom do innego top)
```

### 2.2 Distance

Wskaźniki odległości pokazują dystans w pikselach między:
- Przeciąganym elementem a sąsiednimi elementami
- Przeciąganym elementem a krawędziami kontenera

### 2.3 Center

Linie centrum kontenera (pozioma i pionowa) pojawiają się, gdy przeciągany element znajduje się w pobliżu centrum.

### 2.4 Spacing

Prowadnice równomiernego rozmieszczenia pojawiają się, gdy przeciągany element znajduje się pomiędzy dwoma innymi elementami, a odstępy po obu stronach są równe (z dokładnością do threshold).

---

## 3. Architektura

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BUILDER STUDIO                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     Canvas                                     │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  BuilderCanvas.tsx                                     │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌────────────────────────────────────────────────┐   │  │  │
│  │  │  │  useSmartGuides (hook)                         │   │  │  │
│  │  │  │  - DragContext → SmartGuideEngine              │   │  │  │
│  │  │  │  - Zwraca: guides + snapGuidance               │   │  │  │
│  │  │  └────────────┬───────────────────────────────────┘   │  │  │
│  │  │               │                                       │  │  │
│  │  │  ┌────────────▼──────────────────────────────────┐   │  │  │
│  │  │  │  SmartGuidesOverlay (SVG)                     │   │  │  │
│  │  │  │  - Renderuje prowadnice jako SVG              │   │  │  │
│  │  │  │  - Pure presentation, zero logiki             │   │  │  │
│  │  │  └───────────────────────────────────────────────┘   │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌────────────────────────────────────────────────┐   │  │  │
│  │  │  │  DragEngine (DragContext)                      │   │  │  │
│  │  │  │  - Nakłada snap offset na pozycję              │   │  │  │
│  │  │  │  - Deleguje snap do SmartGuideEngine           │   │  │  │
│  │  │  └────────────────────────────────────────────────┘   │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  BuilderBottomBar.tsx                                        │  │
│  │  ┌──────────────────┐                                       │  │
│  │  │  GuidesToggle    │                                       │  │
│  │  └──────────────────┘                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ useSmartGuides
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BUILDER CORE (builder-core)                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SmartGuideTypes.ts                                          │  │
│  │  - GuideType, GuideSource, GuideOrientation, GuidePriority   │  │
│  │  - ElementBounds, ContainerBounds, SmartGuide, SnapGuidance  │  │
│  │  - SmartGuideConfig, CalculatorInput, GuideCalculator        │  │
│  │  - AggregatedGuideResult                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SmartGuideEngine.ts                                         │  │
│  │  ├── AlignmentCalculator   — wyrównanie krawędzi             │  │
│  │  ├── CenterCalculator     — centrum kontenera                │  │
│  │  ├── DistanceCalculator   — odległości między elementami     │  │
│  │  ├── SpacingCalculator    — równomierne rozmieszczenie       │  │
│  │  ├── SnapCalculator       — snap-to-guide                    │  │
│  │  └── GuideAggregator      — deduplikacja + sortowanie        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Modele danych

### 4.1 ElementBounds (wejście)

```typescript
interface ElementBounds {
  id: string;
  x: number;      // px, względem kontenera
  y: number;      // px, względem kontenera
  width: number;  // px
  height: number; // px
}
```

### 4.2 SmartGuide (wyjście)

```typescript
interface SmartGuide {
  type: GuideType;         // ALIGNMENT | DISTANCE | CENTER | MARGIN | SPACING | ...
  source: GuideSource;     // GRID | ELEMENT | CONTAINER | CONSTRAINT | ...
  orientation: GuideOrientation; // HORIZONTAL | VERTICAL
  priority: GuidePriority; // 0-30, wyższy = renderowany na wierzchu
  position: number;        // pozycja na osi prostopadłej (px)
  start: number;           // początek linii (px)
  end: number;             // koniec linii (px)
  label?: string;          // np. "24px", "Center"
  color: string;           // kolor CSS
  opacity: number;         // 0.0 – 1.0
  threshold: number;       // dystans aktywacji (px)
  distance: number;        // rzeczywista odległość od elementu (px)
}
```

### 4.3 SnapGuidance (wyjście dla DragEngine)

```typescript
interface SnapGuidance {
  x: number;           // pozycja po snapie
  y: number;           // pozycja po snapie
  snapped: boolean;    // czy nastąpił snap
  snapAxis: 'X' | 'Y' | 'BOTH' | 'NONE';
  guides: SmartGuide[]; // aktywne prowadnice
  offsetX: number;     // przesunięcie X
  offsetY: number;     // przesunięcie Y
}
```

---

## 5. Konfiguracja

```typescript
interface SmartGuideConfig {
  showAlignmentGuides: boolean;  // default: true
  showDistanceGuides: boolean;   // default: true
  showCenterGuides: boolean;     // default: true
  showMarginGuides: boolean;     // default: true
  showSpacingGuides: boolean;    // default: true
  snapToGuides: boolean;         // default: true
  threshold: number;             // default: 8px
  maxDistance: number;           // default: 100px
  guideOpacity: number;          // default: 0.85
  alignmentColor: string;        // default: '#ff0000'
  distanceColor: string;         // default: '#00cc00'
  centerColor: string;           // default: '#ff0000'
  marginColor: string;           // default: '#ff8800'
  spacingColor: string;          // default: '#00ccff'
}
```

---

## 6. Decision Records

### DR-SMARTGUIDE-001: Pure computation engine
**Status:** Accepted
**Uzasadnienie:** SmartGuideEngine jest w 100% pure TypeScript — zero zależności od React, DOM, Canvas. Każdy kalkulator to osobna klasa implementująca GuideCalculator interface.

### DR-SMARTGUIDE-002: SVG overlay zamiast Canvas API
**Status:** Accepted
**Uzasadnienie:** SVG jest deklaratywny, łatwy do testowania, nie wymaga zarządzania kontekstem renderowania. Idealny dla prowadnic, które są renderowane na żądanie.

### DR-SMARTGUIDE-003: Delegacja snapa do DragEngine
**Status:** Accepted
**Uzasadnienie:** SmartGuideEngine oblicza snap guidance, ale nie aplikuje go. DragEngine jest odpowiedzialny za nałożenie offsetu na pozycję. To utrzymuje czystą separację odpowiedzialności.

### DR-SMARTGUIDE-004: Extensible przez rejestrację kalkulatorów
**Status:** Accepted
**Uzasadnienie:** Nowe typy prowadnic (np. ANCHOR dla Constraint Engine) mogą być dodane przez implementację GuideCalculator i dodanie do konstruktora SmartGuideEngine.

### DR-SMARTGUIDE-005: Canvas nie zawiera logiki prowadnic
**Status:** Accepted
**Uzasadnienie:** Canvas (BuilderCanvas.tsx) tylko renderuje overlay. Cała logika obliczeniowa jest w builder-core. Zgodne z DR-CANVAS-COMP-001.
