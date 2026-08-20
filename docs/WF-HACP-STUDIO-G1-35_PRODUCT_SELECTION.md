# TASK WF-HACP-STUDIO-G1-35 — PRODUCT SELECTION

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE

---

## 1. CANDIDATE EVALUATION

### Candidate A — Canvas Zoom & Pan
| Dimension | Finding |
|:---|:---|
| Existing infrastructure | Rich: `camera/CameraModel.ts`, `CameraOperationsEngine.ts` (pan/zoom/rotate/fit), `CoordinateSystems.ts`, `ViewportModel.ts`, `viewport-preview/ViewportInteractionController.ts`, `ui/components/viewport/ZoomControls.tsx` |
| Tests | `packages/authoring-studio/src/camera` + `src/viewport-preview` → **35/35 PASS** |
| Gap to close | Operations target `BuilderDocument` preview, not the Vector workspace; would require new controller + UI wiring |
| Evidence of prior G1-35 start | None found in working tree |

### Candidate B — Document Persistence UI & SVG Exporter
| Dimension | Finding |
|:---|:---|
| Existing infrastructure | `VectorDocumentSerializer.ts` (G1-29, untracked), `HistoryStack` (builder-core), `VectorGeometry.parsePathGeometry/svgPathToPathData` (SVG import capability), `VectorWorkspaceController` snapshot model |
| Tests | Draft `VectorSvgExporterG135.test.ts` (35 tests) existed at discovery; after completion → **38/38 PASS** |
| Gap to close | Headless SVG exporter (drafted, uncommitted) + persistence roundtrip E2E + barrel integration |
| **Evidence of prior G1-35 start** | **`VectorSvgExporter.ts` header "Sprint G1-35" + `VectorSvgExporterG135.test.ts` created 2026-08-20 18:31–18:32, immediately after G1-34 commit (18:12). Strong physical evidence of prior selection.** |

## 2. SELECTION DECISION

**SELECTED: Candidate B — Document Persistence UI & SVG Exporter Vertical Slice**

Rationale:
1. **Physical evidence**: a prior HACP run already created `VectorSvgExporter.ts` (header "Sprint G1-35")
   and `VectorSvgExporterG135.test.ts` in the working tree right after the G1-34 commit. The selection was
   already made; the implementation was incomplete and never committed.
2. **Architectural fit**: the exporter integrates with the existing `VectorDocumentSnapshot` SSOT,
   `VectorDocumentSerializer`, and `VectorRenderingBridge` — a coherent Document Persistence + Export slice.
3. **No test removal**: G1-34's final inventory and the working tree both contain 3 pre-existing
   ShapeGrouping/ShapeTransform baseline failures; these are documented and preserved (no suppression, no removal).

## 3. DECISION RECORD

- Decision: Candidate B
- Evidence file: `docs/WF-HACP-STUDIO-G1-35_EVIDENCE.md`
- Contract: `docs/WF-HACP-STUDIO-G1-35_PLAN.md`
- NOT selected: Candidate A (no evidence of prior start; scope is BuilderDocument preview, not Vector workspace)