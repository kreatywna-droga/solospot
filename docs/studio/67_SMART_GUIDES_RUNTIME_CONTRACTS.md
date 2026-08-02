# Sprint 6B — Smart Guide Runtime Contracts

> **Status:** ✅ Draft
> **Sprint:** 6B — Smart Guides Foundation
> **Cel:** Kontrakty runtime dla Smart Guides — definicja przepływu danych pomiędzy komponentami w trakcie przeciągania

---

## 1. Render Flow (Smart Guide → Overlay)

```
DragEngine.updateDrag(position)
  → useSmartGuides hook
    → SmartGuideEngine.computeAll(input)
      → AlignmentCalculator.compute()
      → CenterCalculator.compute()
      → DistanceCalculator.compute()
      → SpacingCalculator.compute()
      → GuideAggregator.aggregate()
    → AggregatedGuideResult { guides, snapGuidance, ... }
  → SmartGuidesOverlay (SVG)
    → renderuje każdą prowadnicę jako <line> + <text>
```

### 1.1 Input Contract

```typescript
interface CalculatorInput {
  draggingElement: ElementBounds;  // przeciągany element
  allElements: ElementBounds[];    // wszystkie inne elementy na canvasie
  container: ContainerBounds;      // kontener (canvas frame)
  config: SmartGuideConfig;        // konfiguracja użytkownika
}
```

### 1.2 Output Contract

```typescript
interface AggregatedGuideResult {
  guides: SmartGuide[];            // prowadnice do wyrenderowania
  snapGuidance: SnapGuidance;      // wskazówki snap dla DragEngine
  activeGuideCount: number;        // liczba aktywnych prowadnic
  alignmentCount: number;          // liczba prowadnic wyrównania
  distanceCount: number;           // liczba wskaźników odległości
  centerCount: number;             // liczba prowadnic centrum
  marginCount: number;             // liczba prowadnic marginesu
  spacingCount: number;            // liczba prowadnic odstępów
}
```

---

## 2. Selection Flow (Canvas → Smart Guide)

```
Użytkownik klika na element
  → dispatch(CANVAS SELECT_SECTION)
    → SelectionEngine aktualizuje selectedSectionId
      → useSmartGuides: allElements są pobierane z DOM

Użytkownik rozpoczyna przeciąganie
  → mousedown na SectionBlock
    → dispatch(CANVAS BEGIN_DRAG)
      → CanvasState.dragState = { isDragging: true, ... }
        → useSmartGuides: enabled = true
```

---

## 3. Update Flow (Drag → Guide → Snap → Preview)

```
Każdy frame dragu:

1. DragEngine.updateDrag(clientX, clientY)
2. useSmartGuides.recompute(dragPosition, dragSize)
3. SmartGuideEngine.computeAll(input)
4. AggregatedGuideResult
5. SmartGuidesOverlay.re-render(guides)
6. DragEngine.applySnap(snapGuidance)
7. dispatch(CANVAS UPDATE_DRAG, currentIndex)
8. Jeśli element zmienił pozycję:
   → sendSectionUpdate(preview, pageId, sectionId, props)
```

---

## 4. Property Synchronization (Config)

Smart Guide config jest synchronizowany przez CanvasState:

```
GuidesToggle.onChange(enabled)
  → dispatch(CANVAS TOGGLE_SMART_GUIDES, enabled)
    → CanvasState.showSmartGuides = enabled
      → useSmartGuides: showGuides = enabled
        → SmartGuidesOverlay: visible = enabled && guides.length > 0
```

---

## 5. Runtime Refresh (Breakpoint Change)

```
Użytkownik zmienia breakpoint
  → dispatch(CANVAS SET_BREAKPOINT, breakpoint)
    → CanvasState.viewport = nowy rozmiar
      → ContainerBounds zmienia się
        → useSmartGuides: container = nowy rozmiar
          → SmartGuideEngine.computeAll() z nowym kontenerem
            → Prowadnice dostosowują się do nowego viewportu
```

---

## 6. Event Flow

```
mousedown (na elemencie)
  → BEGIN_DRAG → guides enabled

mousemove (na canvasie)
  → UPDATE_DRAG → guides computed → rendered → snap applied

mouseup
  → END_DRAG → guides disabled → if moved: MOVE_SECTION

keydown (Escape podczas dragu)
  → END_DRAG { committed: false } → cancel drag → guides disabled

keydown (Shift podczas dragu)
  → disable snap → guides visible but no snap applied

GuidesToggle.click
  → TOGGLE_SMART_GUIDES → guides shown/hidden
```

---

## 7. Error Handling

| Scenariusz | Zachowanie |
|-----------|------------|
| Brak elementów na canvasie | guides = [], snap = false |
| Przeciągany element jedyny na stronie | tylko center guides + container distance |
| Element przeciągany poza kontenerem | guides = [], snap = false |
| Konfiguracja z wyłączonymi wszystkimi guidami | guides = [], snap = false |
| Błąd w kalkulatorze | Łapany w SmartGuideEngine, pomijany dla danego kalkulatora |

---

## 8. Performance

| Aspekt | Optymalizacja |
|--------|--------------|
| Częstotliwość obliczeń | Tylko podczas dragu (enabled = false poza dragiem) |
| Memoizacja | SmartGuideEngine tworzony raz, config memoizowany |
| Deduplikacja | GuideAggregator usuwa duplikaty na tej samej pozycji |
| Renderowanie | SVG jest lekkie — <line> + <text>, brak DOM nodes |
| Liczba elementów | Maksymalnie 100 elementów na canvasie |

---

## 9. Decision Records

### DR-SG-RT-001: Obliczenia tylko podczas dragu
**Status:** Accepted
**Uzasadnienie:** SmartGuideEngine.computeAll() jest wywoływane tylko gdy enabled = true (czyli podczas dragu). Poza dragiem guides = [].

### DR-SG-RT-002: ElementBounds z DOM przez data-section-id
**Status:** Accepted
**Uzasadnienie:** Pozycje elementów są pobierane z DOM przez querySelectorAll('[data-section-id]'). To zapewnia, że pozycje są zawsze aktualne.

### DR-SG-RT-003: SVG z pointer-events: none
**Status:** Accepted
**Uzasadnienie:** Overlay ma pointer-events: none, aby nie przeszkadzać w dragu i klikaniu. Prowadnice są tylko wizualne.

### DR-SG-RT-004: Shift podczas dragu wyłącza snap
**Status:** Proposed
**Uzasadnienie:** Standardowe zachowanie w profesjonalnych narzędziach (Figma, Webflow). Shift tymczasowo wyłącza snap.
