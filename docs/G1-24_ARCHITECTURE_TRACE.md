# G1-24 ARCHITECTURE TRACE

## Current State Analysis

Based on extensive codebase analysis, here is the exact trace of the existing architecture related to Vector Boolean operations and the missing UI flow.

### A. VectorToolbar
- **Location**: `packages/authoring-studio/src/ui/components/vector/VectorToolbar.tsx`
- **State**: Exists as a purely stateless React UI component. It currently exposes the `onBooleanOperation` prop, but it is **not mounted anywhere** in the actual runtime application (no `VectorWorkspace` exists yet).

### B. VectorInspectorPanel / VectorWorkspace
- **Location**: `packages/authoring-studio/src/ui/components/vector/VectorInspectorPanel.tsx`
- **State**: Exists as a stateless React component for property edits. 
- **VectorWorkspace**: Does **not exist**. There is no React component acting as the state container or root for the vector editor.

### C. Document Store
- **Location**: In tests, represented simply as `let documentNodes: VectorNode[] = []`.
- **State**: There is **no persistent runtime document store** for `VectorNode[]`. The `BuilderDocument` (used for the layout engine) strictly uses `SectionNode` and has zero references to `VectorNode`. Vector graphics operates in its own isolated domain model (`packages/authoring-studio/src/vector/VectorDomainModel.ts`).

### D. Command Dispatcher
- **Location**: **Does not exist** for Vector objects. The `ViewportInteractionController` exists for the layout engine, and `TimelineInteractionPipeline` exists for animations. However, there is no generic Command Dispatcher or Controller that wraps Vector Editing engine functions into `HistoryStack` transactions.

### E. BuilderDocument / SceneGraphModel
- **State**: `BuilderDocument` is the SSOT for the main layout product, but Vector is a separate subsystem. The Vector SSOT is simply an array of `VectorNode[]` objects representing the layer stack/scene graph.

### F. HistoryStack
- **Location**: `packages/builder-core/src/HistoryStack.ts`
- **State**: The `HistoryStack` is a generic generic class `HistoryStack<T>`. In vector integration tests, it is instantiated as `HistoryStack<VectorNode[]>()`. This proves the architecture allows the Vector subsystem to maintain its own independent undo/redo stack.

### G. Rendering Bridge
- **Location**: `packages/authoring-studio/src/rendering/VectorRenderingBridge.ts`
- **State**: Transforms `VectorNode` instances into `RendererCommand` objects (e.g., `DRAW_PATH`, `DRAW_RECT`). Tested and fully integrated headless-ly.

### H. Renderer
- **Location**: Handled downstream by the `RenderingEngine` which consumes the generic `RendererCommand`s.

---

## Architectural Audit (Agent 2)

**1. Gdzie powinno zostać wykonane Boolean Operation?**
W dedykowanym kontrolerze interakcji dla wektorów (np. `VectorInteractionController.ts` lub bezpośrednio w stanie `VectorWorkspace.tsx`), który wywoła `VectorBooleanEngine` i zbuduje nową ramkę historii.

**2. Czy UI powinno bezpośrednio mutować dokument?**
Nie. Zgodnie ze standardami projektu, UI jest "głupie" i bezstanowe. Powinno wywoływać intencję (dispatch/event), która jest przetwarzana przez czysty kontroler logiki, by stworzyć nowy niemutowalny stan i odłożyć go na `HistoryStack`.

**3. Czy potrzebny jest command?**
Tak. Wzorce ze studia (np. `TimelineInteractionPipeline`) pokazują, że intencje powinny przechodzić przez "command" lub funkcję dyspozytora. Stworzymy czystą funkcję typu `executeBooleanCommand(state, operation)`.

**4. Czy operacja musi przejść przez HistoryStack?**
Tak. Jest to wymóg `G1-24` oraz standard SSOT (DECISION-061).

**5. Jaki obiekt powinien być źródłem prawdy?**
Zbiór `VectorNode[]` zarządzany przez nową strukturę `VectorWorkspaceState`. Nie integrujemy na siłę `VectorNode` z `BuilderDocument`, ponieważ ich architektura jest rozdzielona na poziomie domeny.

**6. Jak powinno działać Undo/Redo?**
HistoryStack zapisze dokładną, niemutowalną migawkę `VectorNode[]`. Cofnięcie operacji (Undo) musi dokładnie przywrócić listę węzłów wektorowych do stanu sprzed kliknięcia (wraz z IDs, order i selection).

**7. Jak zachować immutability?**
Operacje na silnikach (`VectorEditingEngine`, `VectorBooleanEngine`) już zwracają nowe struktury i nie modyfikują oryginalnych. Dispatcher skopiuje tablicę `VectorNode[]`, zamieni złączone obiekty na wynik operacji boolean, i zapisze nową tablicę.

**8. Selection**
Selection jest krytyczne dla Boolean Operations (wymaga co najmniej dwóch obiektów). Stan Selection (tablica wybranych ID) musi być traktowany jako część głównego stanu edytora lub przechowywany równolegle. Po wykonaniu Boolean, wszystkie wejściowe figury znikają, a ich miejsce zajmuje nowa ścieżka. Dlatego w momencie sukcesu operacji, selekcja musi zostać zaktualizowana tak, aby wskazywała **tylko** na nowo utworzony obiekt wynikowy.

**9. Zapewnienie renderowania**
Renderowanie (wykorzystujące `VectorRenderingBridge`) jest pochodną od głównego stanu dokumentu. Gdy zaktualizowany zostanie stan w React (po odtworzeniu lub dispatchu), React automatycznie sprocesuje zmienione `VectorNode[]` do postaci komend, jeśli zaimplementujemy ten mostek w `VectorWorkspace`.

**Decyzja Architektoniczna:**
Zbudujemy `VectorWorkspaceController.ts` działający w oparciu o czysty TypeScript (bez React), a następnie zepniemy to w testowalnym i działającym React'owym `VectorWorkspace.tsx`, udowadniając w 100% integrację G1-24.
