# TASK WF-HACP-STUDIO-G1-35 — ARCHITECTURE DECISION RECORD

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE

---

## 1. DECISIONS

### AD-001 — Pure headless exporter
**Decision:** `VectorSvgExporter` is a static, pure class with zero DOM/React/Browser API dependencies.
**Rationale:** matches the existing Vector module contract ("NO DOM, NO React, NO Browser API").
**Consequence:** the exporter can be tested in vitest with no environment mocks.

### AD-002 — Group rendering must NOT re-apply the group transform onto children
**Decision:** In the domain model (G1-26+), `groupShapes` stores children with ABSOLUTE transforms and
uses the group transform as the visual bounding-box origin. `VectorRenderingBridge` renders group
children with their own absolute transforms and does NOT apply the group transform on top. The SVG
exporter mirrors this: the `<g>` element is an opacity/visibility container only.
**Rationale:** emitting the group transform AND child transforms would double-translate children
(e.g., group at (10,20) + child at (10,20) → wrong position (20,40)). Verified by E2E test 8.
**Consequence:** group-level rotation/scale of the group wrapper is not applied to children — consistent
with the existing render bridge contract.

### AD-003 — Cycle detection throws a controlled error
**Decision:** circular group references are detected via an ancestor-id `Set` and throw
`Error("VectorSvgExporter: circular group reference detected at node ...")`.
**Rationale:** a cycle in a pure function is a programming error, not valid input; a controlled throw is
more diagnosable than a stack overflow. `buildDefs` traversal is also cycle-guarded.
**Consequence:** failure-injection test 3 asserts the controlled error.

### AD-004 — Null-safety over strictness for corrupted input
**Decision:** missing `transform`, `fill`, `stroke`, `sides`, or `d` degrade to safe defaults instead of
throwing. Corrupted nodes render best-effort (or are skipped) without crashing the exporter.
**Rationale:** adversarial robustness is a mandatory test category; the exporter must never crash on
malformed snapshots.

### AD-005 — Persistence roundtrip as a first-class E2E
**Decision:** SVG export is verified against `VectorDocumentSerializer.serializeVectorDocument` →
`restoreVectorDocument` → export, asserting byte-identical SVG (3 E2E workflows).
**Rationale:** Candidate B is "Document Persistence UI & SVG Exporter"; export and persistence must be
proven compatible end-to-end.

### AD-006 — G1-33 compatibility fix is import-only
**Decision:** `VectorMarqueeSelectionG133.test.ts` changed `bun:test` → `vitest` ONLY (no test semantics
changed). This is necessary compatibility with the repo's canonical runner (vitest).
**Rationale:** the file could not load under vitest; G1-34's claimed "57/57 PASS" for it was physically
unverifiable under the repo runner.

## 2. COMMITMENT TO ADR DECISIONS

- AD-002 preserves DECISION-044 (BuilderDocument SSOT) semantics: the exporter reads, never writes.
- AD-003/AD-004 are consistent with DECISION-042/043: exporter contains no playback/scheduler logic.
- No `PlaybackController`, `RuntimeScheduler`, `RuntimeBridge`, or `requestAnimationFrame` imports exist
  in `packages/authoring-studio`'s vector/export layer — Editor/Runtime separation is intact.