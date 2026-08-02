# 81. WEB FACTOR Product Sprints — Definition of Done (DoD)

> Maintained by Agent 2 (Platform Engineering Maintenance)  
> Date: 2026-07-31  
> Status: 🟢 APPROVED

---

## 1. Universal Sprint Completion Criteria (DoD)

Every Product Sprint (Sprint 6B through Sprint 9) MUST satisfy the following criteria to be declared **CLOSED**:

### A. Functional Implementation (Agent 1)
- [ ] All sprint scope items implemented in `src/components/builder/` or relevant packages.
- [ ] No direct state mutations outside `Command Bus`.
- [ ] Zero DOM leakage in domain or calculation layers.
- [ ] Dwukierunkowa komunikacja w czasie rzeczywistym z Preview Runtime przez `PreviewChannel` contracts.

### B. Documentation & Specifications (Agent 1 & Agent 2)
- [ ] Subsystem Architecture Specification created (`docs/studio/XX_SUBSYSTEM_NAME.md`).
- [ ] Integration Review completed with 100% Quality Gates PASS.
- [ ] Dedicated Architecture Freeze specification published and marked **APPROVED** (`docs/studio/XX_FREEZE.md`).
- [ ] `docs/studio/99_IMPLEMENTATION_CHECKLIST.md` updated with `[x]` completion tags.

### C. Platform Quality & Governance (Agent 2 Audit)
- [ ] **Architecture Compliance**: 0 Critical / 0 Error layer violations (`@web-factor/architecture-compliance-intelligence`).
- [ ] **Public API Stability**: 0 Breaking changes in `@web-factor/builder-sdk` exports.
- [ ] **Security Compliance**: 0 Critical security findings or hardcoded secrets.
- [ ] **Dependency Health**: 0 Circular dependencies detected across workspace packages.
- [ ] **Regression Baseline**: All 10 frozen Studio Foundation subsystems pass 100% without regression.
- [ ] **Release Readiness**: Overall status evaluated as **Ready** in `@web-factor/release-readiness-intelligence`.
- [ ] **Platform Health Score**: Overall score >= 80 in `@web-factor/platform-intelligence-orchestrator`.

---

## 2. Sprint 6C Constraint Engine Specific DoD (PM3 Extension)

- [ ] **Constraint Data Model**: `ConstraintModel`, `PinningType`, `StretchMode`, `AnchorPoint` contracts fully specified.
- [ ] **Constraint Solver Pure Logic**: Solves geometry without window/document/DOM calls (`RULE-CE-006`).
- [ ] **CSS Mapping**: Outputs pure CSS style variables (`RULE-CE-002`, `RULE-CE-005`).
- [ ] **Inspector Controls**: Inspector 2.0 accordion fields bound to Command Bus.
- [ ] **Quality Gates**: `CONSTRAINT_MODEL_COMPLETE`, `CONSTRAINT_SOLVER_COMPLETE`, `CONSTRAINT_INSPECTOR_COMPLETE`, `CONSTRAINT_RUNTIME_COMPLETE`, `CONSTRAINT_FREEZE_APPROVED`, `NO_LAYOUT_REGRESSION` all PASS.

---

## 3. Sprint 6D Responsive Engine Specific DoD (PM4 Extension)

- [ ] **Responsive Data Model**: Viewport Breakpoints (`mobile`, `tablet`, `desktop`, `wide`), Media Query mappings, and Breakpoint Overrides specified.
- [ ] **Breakpoint Solver Pure Logic**: Resolves styles without `window.matchMedia` or DOM mutation (`RULE-RE-004`, `RULE-RE-006`).
- [ ] **Responsive CSS Generation**: Produces clean, mobile-first media query rules (`RULE-RE-005`).
- [ ] **Inspector Breakpoint Switcher**: Inspector UI allows switching active viewport and overriding props per breakpoint.
- [ ] **Quality Gates**: `RESPONSIVE_MODEL_COMPLETE`, `BREAKPOINT_ENGINE_COMPLETE`, `RESPONSIVE_INSPECTOR_COMPLETE`, `RESPONSIVE_RUNTIME_COMPLETE`, `RESPONSIVE_FREEZE_APPROVED`, `NO_BREAKPOINT_REGRESSION` all PASS.

---

## 4. Sprint 7 Inspector 2.0 Specific DoD (PM5 Extension)

- [ ] **Inspector Panel Shell**: Modular accordion panel architecture implemented in presentation layer (`RULE-INSP-001`).
- [ ] **Registry-Based Property Rendering**: Property forms dynamically constructed from Component Registry manifests (`RULE-INSP-005`).
- [ ] **Command Bus Synchronization**: Property edits dispatch `UPDATE_PROPS` commands exclusively (`RULE-INSP-003`).
- [ ] **Runtime Preview Coupling Prevention**: Zero direct iframe DOM mutations (`RULE-INSP-004`).
- [ ] **Unidirectional Cycle Prevention**: Zero circular update dependencies between Inspector, Canvas, and Runtime (`RULE-INSP-007`).
- [ ] **Quality Gates**: `INSPECTOR_CORE_COMPLETE`, `PROPERTY_PANEL_COMPLETE`, `PROPERTY_REGISTRY_COMPLETE`, `PROPERTY_SYNC_COMPLETE`, `INSPECTOR_FREEZE_APPROVED`, `NO_REGISTRY_REGRESSION` all PASS.
