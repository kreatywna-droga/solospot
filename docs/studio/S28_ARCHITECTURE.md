# S28 Architecture Specification — Responsive & Adaptive Breakpoint Layout System

> **Subsystem:** Authoring Studio — Responsive & Adaptive Breakpoint Layout Subsystem (Sprint S28)  
> **Author:** Senior Architect & Lead Engineer  
> **Status:** APPROVED & FROZEN FOR S28 IMPLEMENTATION  
> **Dependencies:** `builder-core`, S4 Layout Engine, S21 Camera & Viewport System, S22 Selection System  

---

## 1. Executive Summary & Objective

Sprint S28 introduces the **Responsive & Adaptive Breakpoint Layout Subsystem** (`packages/authoring-studio/src/responsive/`).

### Problem Statement
Modern multi-device design workflows require authoring interfaces that seamlessly adapt across Desktop, Laptop, Tablet, Mobile, and Custom viewports. Prior to S28, element layouts evaluated static dimensions. S28 establishes a headless, pure-domain responsive engine that manages:
1. Multi-tier Breakpoint Definitions (Desktop-first hierarchy with fallback chain: `desktop` → `laptop` → `tablet` → `mobile`).
2. Per-Breakpoint Node Property Overrides (styles, dimensions, flex/grid properties, visibility, padding/margin).
3. Responsive Value Resolution Engine (cascading fallback evaluation for effective property values).
4. Adaptive Fluid Sizing & Fluid Typography (min/max bounds, viewport-relative `vw`/`vh` interpolation).
5. Breakpoint Viewport Controller (headlessly mapping target breakpoints to S21 Viewport dimensions).
6. Command-Based History Integration (`HistoryStack<BuilderDocument>` commands for undo/redo).

---

## 2. Governance & Architectural Rules

- **DECISION-044 (SSOT):** `BuilderDocument` remains the single source of truth. Per-breakpoint property overrides are stored immutably in node metadata DTOs (`node.responsiveOverrides`). Zero second document models are created.
- **DECISION-042 (No Engine Duplication):** S28 creates ZERO duplicate layout engines, rendering engines, timeline engines, or history stacks.
- **Domain Isolation:** `src/responsive/` is 100% pure TypeScript. ZERO imports of DOM (`window`, `document`, `React`, `HTMLCanvasElement`), `requestAnimationFrame`, `PlaybackController`, or browser audio/video APIs.
- **Desktop-First Fallback Model:**  
  $$\text{EffectiveValue}(p, b) = \text{Override}(p, b) \mathbin{\mathrel{\vec{\leftarrow}}} \text{Override}(p, \text{Parent}(b)) \mathbin{\mathrel{\vec{\leftarrow}}} \text{BaseValue}(p, \text{desktop})$$

---

## 3. Component Architecture & Module Decomposition

```
packages/authoring-studio/src/responsive/
├── ResponsiveValueModel.ts         # Breakpoint DTOs, ResponsiveValue<T>, fallback resolution logic
├── BreakpointRegistry.ts           # Built-in presets (Desktop 1440, Laptop 1024, Tablet 768, Mobile 375, etc.)
├── ResponsiveOverrideEngine.ts     # Immutable get/set/clear per-breakpoint property overrides on BuilderDocumentNode
├── FluidSizingEngine.ts            # Fluid typography & dimensions (clamp, vw/vh interpolation, min/max bounds)
├── ResponsiveVisibilityRules.ts    # Per-breakpoint visibility toggles, hideOnMobile, hideOnTablet rules
├── ResponsiveViewportController.ts  # Maps active breakpoint to S21 Viewport / Camera bounds for headless canvas frame
├── ResponsiveCommands.ts           # HistoryStack<BuilderDocument>-compatible commands (SetBreakpointOverrideCommand, etc.)
└── index.ts                        # Public barrel exports (exposes WorkspaceResponsiveFormat / S28 exports)
```

---

## 4. Subsystem Integration Graph

```
               [ S15/S25 Asset Registry ]
                          ↓
[ S21 Camera/Viewport ] → [ S28 Responsive Subsystem ] ← [ S22 Selection System ]
                          ↓
                 [ BuilderDocument SSOT ]
                          ↓
             [ S1-S6 Layout & Rendering Engine ]
```

---

## 5. Module Detailed Specifications

### 5.1 `ResponsiveValueModel.ts`
- `BreakpointId`: `'desktop'` | `'laptop'` | `'tablet'` | `'mobile'` | string (custom).
- `Breakpoint`: DTO containing `id`, `name`, `minWidthPx`, `maxWidthPx`, `icon`, `isDefault`.
- `ResponsiveValue<T>`: Map/Record of `BreakpointId` to partial value of `T`.
- `resolveEffectiveValue<T>(responsiveValue, targetBreakpointId, fallbackChain)`: Cascades through fallback chain until a defined value is resolved.

### 5.2 `BreakpointRegistry.ts`
- Standard Presets:
  - `desktop` (1440px+ base)
  - `laptop` (1024px - 1439px)
  - `tablet` (768px - 1023px)
  - `mobile` (375px - 767px)
  - `mobile_small` (320px - 374px)
- Presets lookup, custom breakpoint registration, active breakpoint resolution from numeric viewport width.

### 5.3 `ResponsiveOverrideEngine.ts`
- Immutably applies/removes per-breakpoint node property overrides on `BuilderDocumentNode`.
- Overridable property categories: `dimensions` (width, height), `position` (x, y), `typography` (fontSize, lineHeight), `layout` (flexDirection, gap, padding, margin), `visual` (opacity, display).

### 5.4 `FluidSizingEngine.ts`
- `FluidSizeConfig`: `minSizePx`, `maxSizePx`, `minViewportPx`, `maxViewportPx`, `unit`.
- `computeFluidSize(config, currentViewportWidthPx)`: Returns calculated size in pixels using linear interpolation clamped between `minSizePx` and `maxSizePx`.
- Generates CSS-compatible `clamp(min, preferred, max)` string expressions.

### 5.5 `ResponsiveVisibilityRules.ts`
- Manages visibility rules per node: `hiddenBreakpoints: ReadonlyArray<BreakpointId>`.
- `isNodeVisibleAtBreakpoint(node, breakpointId)`: Returns boolean indicating whether element is visible at target breakpoint.

### 5.6 `ResponsiveViewportController.ts`
- Coordinates headless active breakpoint switching with S21 `Viewport` bounds.
- Calculates canvas container scaling and viewport center offsets for crisp, frame-accurate responsive previewing.

### 5.7 `ResponsiveCommands.ts`
- `SetBreakpointOverrideCommand`: Updates responsive override for a node, supporting undo/redo on `HistoryStack<BuilderDocument>`.
- `RemoveBreakpointOverrideCommand`: Clears a specific breakpoint override.
- `ToggleBreakpointVisibilityCommand`: Hides/shows node at target breakpoint.

---

## 6. Definition of Done (DoD)

1. **Architecture Compliance:** 100% adherence to `BuilderDocument` SSOT, 0 duplicate engines.
2. **Domain Isolation:** Pure TypeScript in `src/responsive/` (0 DOM/React dependencies).
3. **Test Coverage:** Complete unit, integration, history, determinism, and E2E workflow test suites in `src/responsive/__tests__/`.
4. **TypeScript Quality Gate:** `npx tsc --noEmit` produces 0 S27/S28 errors.
5. **Vitest Quality Gate:** 100% PASS across all S28 test files.
6. **Build Quality Gate:** `npm run build` succeeds (exit 0).
