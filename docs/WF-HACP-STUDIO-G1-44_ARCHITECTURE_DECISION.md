# WF-HACP-STUDIO-G1-44 Architecture Decisions & Checkpoints

## Architectural Decisions Log (ADR)
- **DECISION-052**: `VectorCompoundPathEngine` encapsulates sub-path combine/release operations, sub-path metadata parsing, Non-Zero / Even-Odd winding rule hit testing, and sub-path hole clipping.
- **DECISION-053**: `PathNode` extends domain model with optional `fillRule?: 'nonzero' | 'evenodd'` and `subPaths?: SubPathData[]`.
- **DECISION-054**: `VectorSvgExporter` renders `fill-rule="evenodd"` or `fill-rule="nonzero"` on `<path>` SVG elements when `fillRule` property is present.

## 12 Stage Checkpoints (12/12 Verified)
- `CP-01`: HEAD `20698b5` & baseline verified; `SCOPE_BOUNDARY.md` created.
- `CP-02`: Candidate 1 selected (Compound Path & Winding Rule Engine).
- `CP-03`: Scope isolation verified (`WEB_FACTOR_SCOPE_VIOLATIONS = 0`).
- `CP-04`: `VectorCompoundPathEngine.ts` contract and DTOs designed.
- `CP-05`: Core compound path implementation completed.
- `CP-06`: Subsystem integration into command system, orchestrator, serializer, and SVG exporter verified.
- `CP-07`: Workflow integration & keyboard dispatch verified.
- `CP-08`: 7 failure injection scenarios verified.
- `CP-09`: `VectorCompoundPathG144.test.ts` (85/85 PASS) verified.
- `CP-10`: Cross-stage regression verified (1,063 PASS / 3 pre-existing FAIL out of 1,066 tests).
- `CP-11`: Independent Audit passed (Readiness Score: 10.0 / 10.0, B13 = COMMIT).
- `CP-12`: Post-commit verification complete. Controlled stop executed.
