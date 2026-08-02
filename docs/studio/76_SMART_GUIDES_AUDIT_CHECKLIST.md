# 76. Smart Guides Audit Checklist — Sprint 6B

> Prepared by Agent 2 (Platform Engineering Maintenance)
> Date: 2026-07-31
> Target Subsystem: Sprint 6B — Smart Guides Foundation

---

## 1. Architecture & Layering Checklist

- [ ] **RULE-SG-001**: Smart Guides Overlay contains zero business / calculation logic in UI layer.
- [ ] **RULE-SG-002**: Smart Guides communicate with Runtime Preview exclusively via `PreviewChannel` contracts (postMessage).
- [ ] **RULE-SG-003**: Alignment & distance calculations are implemented as pure, stateless functions.
- [ ] **RULE-SG-004**: Presentation overlay does not mutate Builder State directly.
- [ ] **RULE-SG-005**: Snap Engine does not communicate directly with Runtime.
- [ ] **RULE-SG-006**: Canvas Overlay contains no domain logic.
- [ ] **RULE-SG-007**: Smart Guides depend solely on `DragContext` contracts.

---

## 2. Subsystem Quality Gates

| Gate ID | Name | Category | Mandatory | Status |
|---------|------|----------|-----------|--------|
| `ALIGNMENT_ENGINE_COMPLETE` | Alignment Engine Implementation | Code Quality | Yes | ⏳ Pending |
| `SMART_SPACING_COMPLETE` | Smart Spacing Detection | Code Quality | Yes | ⏳ Pending |
| `DISTANCE_INDICATORS_COMPLETE` | Distance Indicators Presentation | Code Quality | Yes | ⏳ Pending |
| `GRID_SNAPPING_COMPLETE` | Grid Snapping Calculation | Code Quality | Yes | ⏳ Pending |
| `SMART_GUIDES_FREEZE_APPROVED` | Smart Guides Freeze Approval | Arch Freeze | Yes | ⏳ Pending |
| `NO_CANVAS_DOMAIN_LOGIC` | Zero Domain Logic in Canvas | Arch Compliance | Yes | ⏳ Pending |
| `NO_RUNTIME_COUPLING` | Zero Direct Runtime Coupling | Arch Compliance | Yes | ⏳ Pending |

---

## 3. Regression Baseline Verification (10 Frozen Subsystems)

- [ ] **Studio Shell**: Zero contract regressions or layout shift.
- [ ] **Builder Core**: Command Bus remains single mutation path.
- [ ] **Component Registry**: Manifest resolution unmodified.
- [ ] **Canvas Foundation**: Pure rendering pipeline preserved.
- [ ] **Layout Engine**: Flexbox & Flow calculations unmodified.
- [ ] **Grid Engine**: CSS Grid calculations unmodified.
- [ ] **Overflow Engine**: Scroll/Clip boundaries preserved.
- [ ] **Border Engine**: Frame borders & stroke calculations clean.
- [ ] **Radius Engine**: Corner radius calculations clean.
- [ ] **Drag & Drop Foundation**: DragSession state machine (IDLE -> VALIDATING -> STARTING -> DRAGGING -> COMMITTING/CANCELLING -> IDLE) intact.

---

## 4. Public API & Inspector Consistency

- [ ] No breaking changes in `@web-factor/builder-sdk` exports.
- [ ] Inspector 2.0 properties binding intact.
- [ ] Undo / Redo history stack correctly receives commands generated during Smart Guide snaps.
