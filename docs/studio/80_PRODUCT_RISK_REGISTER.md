# 80. WEB FACTOR Product Risk Register

> Maintained by Agent 2 (Platform Engineering Maintenance)  
> Date: 2026-07-31  
> Status: 🟢 ACTIVE

---

## 1. Active Risk Matrix

| Risk ID | Title & Description | Probability | Impact | Mitigation Strategy | Owner | Status |
|---------|---------------------|-------------|--------|---------------------|-------|--------|
| **RSK-001** | **DOM Leakage in Guides Overlay**: Presentation overlay code directly accessing canvas DOM elements during drag. | Low | High | Enforce `RULE-SG-001` & `RULE-SG-006` in `architecture-compliance-intelligence`. Render overlay via React portal or pure canvas layer. | Agent 1 | 🟢 MONITORED |
| **RSK-002** | **Runtime Preview Latency during Fast Drag**: High frequency `SNAP_TRIGGER` events overwhelming `PreviewChannel` postMessage. | Medium | Medium | Throttle/debounce guide alignment events to 60 FPS in `DragContext`. | Agent 1 | 🟢 MONITORED |
| **RSK-003** | **Constraint Engine Complexity**: CSS flex/grid conflicts when applying stretch & pinning constraints simultaneously. | Low | High | Enforce pure CSS variable output mapping verified by `RULE-CE-002`. | Agent 1 | 🟢 MONITORED |
| **RSK-004** | **Public API Breaking Change during Inspector 2.0 Refactor**: Property schema modifications breaking SDK contracts. | Low | Critical | Verify Public API via `@web-factor/api-surface-intelligence` before release approval. | Agent 2 | 🟢 MONITORED |
| **RSK-005** | **Circular Dependency in Subsystem Barrels**: Cross-importing between Canvas, Drag Engine, and Smart Guides. | Low | High | Continuous cycle detection via `@web-factor/dependency-intelligence`. | Agent 2 | 🟢 MONITORED |

---

## 2. Sprint 6C Constraint Engine Risks (PM3 Extension)

| Risk ID | Title & Description | Probability | Impact | Mitigation Strategy | Owner | Status |
|---------|---------------------|-------------|--------|---------------------|-------|--------|
| **RSK-006** | **Constraint Conflicts**: Contradictory pinning rules (e.g. Pin Left + Pin Right + fixed width conflict). | Medium | High | Enforce deterministic precedence order (Pinning > Stretch > Fixed Width) in solver. | Agent 1 | 🟢 PLANNED |
| **RSK-007** | **Recursive Constraints**: Circular parent-child constraint dependencies causing infinite layout re-renders. | Low | Critical | Validate constraint DAG structure before applying layout updates (`RULE-CE-003`). | Agent 1 | 🟢 PLANNED |
| **RSK-008** | **Layout Instability**: Canvas element flickering during drag resize under active constraint solving. | Medium | Medium | Calculate candidate bounds in virtual geometry space before DOM update commit. | Agent 1 | 🟢 PLANNED |
| **RSK-009** | **Performance Degradation**: Constraint solver execution exceeding frame budget (>5ms) for deep component trees. | Low | High | Memoize constraint resolution results per viewport width. | Agent 1 | 🟢 PLANNED |
| **RSK-010** | **Responsive Incompatibility**: Constraint rules breaking layout when switching between Mobile, Tablet, and Desktop break points. | Medium | High | Isolate constraint overrides per breakpoint schema. | Agent 1 | 🟢 PLANNED |

---

## 3. Sprint 6D Responsive Engine Risks (PM4 Extension)

| Risk ID | Title & Description | Probability | Impact | Mitigation Strategy | Owner | Status |
|---------|---------------------|-------------|--------|---------------------|-------|--------|
| **RSK-011** | **Breakpoint Conflicts**: Overlapping min-width/max-width media query definitions causing non-deterministic style precedence. | Medium | High | Enforce mobile-first media query order generation (`RULE-RE-003`). | Agent 1 | 🟢 PLANNED |
| **RSK-012** | **Layout Drift on Viewport Switch**: Component coordinates shifting unpredictably when resizing canvas viewport frame. | Low | High | Re-evaluate breakpoint overrides in pure function pipeline without DOM mutation. | Agent 1 | 🟢 PLANNED |
| **RSK-013** | **Breakpoint Flickering**: Visual flashing when rapidly toggling between Mobile, Tablet, and Desktop preview modes. | Medium | Medium | Synchronize CSS variable swaps in single animation frame before PreviewChannel dispatch. | Agent 1 | 🟢 PLANNED |
| **RSK-014** | **Responsive Recursion**: Nested responsive container queries triggering recursive width recalculations. | Low | Critical | Cap maximum nested responsive resolution depth to 4 levels. | Agent 1 | 🟢 PLANNED |
| **RSK-015** | **CSS Override Conflicts**: Breakpoint-specific style overrides clashing with active Constraint Engine rules. | Medium | High | Enforce strict cascade hierarchy: Global -> Breakpoint -> Local Constraint. | Agent 1 | 🟢 PLANNED |
| **RSK-016** | **Mobile/Desktop Divergence**: Unsynchronized state payloads causing Preview Runtime to render Desktop layout while Canvas displays Mobile frame. | Low | High | Transmit explicit `viewportId` in all `PreviewChannel` sync events (`RULE-RE-007`). | Agent 1 | 🟢 PLANNED |

---

## 4. Sprint 7 Inspector 2.0 Risks (PM5 Extension)

| Risk ID | Title & Description | Probability | Impact | Mitigation Strategy | Owner | Status |
|---------|---------------------|-------------|--------|---------------------|-------|--------|
| **RSK-017** | **Registry Desynchronization**: Component Registry schema updates not automatically updating Inspector form controls. | Medium | High | Construct Inspector controls strictly via Component Registry schema manifests (`RULE-INSP-005`). | Agent 1 | 🟢 PLANNED |
| **RSK-018** | **Property Update Race Conditions**: Multiple rapid property field edits emitting conflicting `UPDATE_PROPS` commands. | Low | Medium | Debounce Inspector control inputs and enqueue commands sequentially in Command Bus. | Agent 1 | 🟢 PLANNED |
| **RSK-019** | **Inspector Lag**: Rendering heavy property forms (e.g. complex gradient / shadow pickers) causing UI stutter. | Medium | Medium | Memoize property section sub-components and wrap pickers in React portals. | Agent 1 | 🟢 PLANNED |
| **RSK-020** | **Circular Property Updates**: Inspector property field update triggering state notification loop back to Inspector. | Low | Critical | Ensure unidirectional data flow: Inspector -> Command Bus -> State -> Preview (`RULE-INSP-007`). | Agent 1 | 🟢 PLANNED |
| **RSK-021** | **Panel Inconsistency**: Custom property sections using non-standard UI controls inconsistent with `@web-factor/ui-core`. | Low | Medium | Enforce UI Core component library usage for all Inspector form fields. | Agent 1 | 🟢 PLANNED |
| **RSK-022** | **Registry Fragmentation**: Splitting Component Registry schemas across packages creating missing prop control fields. | Low | High | Single registry barrel validation via `@web-factor/api-surface-intelligence`. | Agent 2 | 🟢 PLANNED |

---

## 5. Risk Severity Definitions

- **Critical**: Blocks build, breaks Public API, or causes data corruption in Builder Core.
- **High**: Degrades drag-and-drop frame rate below 30 FPS or violates layer architectural rules.
- **Medium**: Minor UI visual glitch in Guides Overlay without breaking state.
- **Low**: Non-critical documentation delay or minor styling inconsistency.
