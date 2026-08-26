# G1-26 Architecture Map — Vector Subsystem

## Subsystem Architectural Layers & Dependency Graph

```mermaid
graph TD
    UI_Toolbar["VectorToolbar (React View)"]
    UI_Inspector["VectorInspectorPanel (React View)"]
    UI_Workspace["VectorWorkspace (React Container)"]
    
    Controller["VectorWorkspaceController (Pure Functional State Transformer)"]
    DomainModel["VectorDomainModel (Pure TS DTOs)"]
    EditingEngine["VectorEditingEngine (Shape Operations)"]
    BooleanEngine["VectorBooleanEngine (CSG Operations)"]
    Geometry["VectorGeometry (2D Math & Bounding Boxes)"]
    
    History["HistoryStack<VectorDocumentSnapshot> (builder-core)"]
    
    Bridge["VectorRenderingBridge (DTO Compiler)"]
    Executor["RenderCommandExecutor (Command Dispatcher)"]
    Surface["CanvasRenderSurface (Canvas Adapter)"]
    Renderer["CanvasRenderer (Canvas 2D Backend)"]

    %% Flow connections
    UI_Toolbar -->|onBooleanOperation / onUndo / onRedo| UI_Workspace
    UI_Inspector -->|onUpdateNode| UI_Workspace
    UI_Workspace -->|state & dispatchers| Controller
    
    Controller -->|mutate snapshot & push entry| History
    Controller -->|perform boolean op| BooleanEngine
    Controller -->|transform / align shapes| EditingEngine
    
    BooleanEngine -->|compute path string & bounds| Geometry
    BooleanEngine -->|create PathNode| DomainModel
    EditingEngine -->|bounds & constraints| Geometry
    EditingEngine -->|create / edit node DTOs| DomainModel
    
    UI_Workspace -->|useEffect snapshot update| Bridge
    Bridge -->|VectorNode → RendererCommand[]| Executor
    Executor -->|executeCommands| Renderer
    Renderer -->|draw on surface| Surface
```

## Dependency Direction Rules

1. **UI Layer (`src/ui/components/vector/`)**: Depends on Controller, Domain Model, Geometry, and Rendering Bridge. Must remain thin view adapters.
2. **Controller Layer (`src/vector/VectorWorkspaceController.ts`)**: Depends ONLY on Domain Model, Boolean/Editing Engine, and `HistoryStack`. ZERO React, ZERO DOM, ZERO window API.
3. **Domain & Engines Layer (`src/vector/`)**: Pure TypeScript DTOs and pure functions. ZERO state, ZERO side effects, ZERO DOM dependencies.
4. **Rendering Layer (`src/rendering/`)**: Pure command compilation and surface abstraction. Decoupled from React UI.

## Document & State Ownership

- **Single Source of Truth (SSOT):** `VectorWorkspaceState` holding `snapshot` (`VectorDocumentSnapshot`: `nodes`, `selectedIds`) and `historyStack` (`HistoryStack<VectorDocumentSnapshot>`).
- **Immutability:** All mutations return a brand new `VectorWorkspaceState` with frozen/immutable DTO snapshots.
