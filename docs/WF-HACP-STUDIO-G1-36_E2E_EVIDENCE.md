# TASK WF-HACP-STUDIO-G1-36 — E2E EVIDENCE

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## E2E Workflow Coverage (7/7 PASS)

All E2E workflows use only TRACKED modules (`VectorWorkspaceController`, `VectorRenderingBridge`,
`VectorSvgExporter`, `VectorDomainModel` factories) so the committed suite runs at HEAD.

| # | Workflow | Steps | Assertions | Result |
|:---:|:---|:---|:---|:---:|
| 1 | create → rotate → render → SVG export parity | create rect, select, rotate 45°, render via bridge, export SVG | canvas matrix b = sin(45°) AND SVG contains `rotate(45 50 50)` | PASS |
| 2 | move → render preserves translation | create rect at (10,20), move by (30,40) | matrix tx=40, ty=60 | PASS |
| 3 | resize (handle drag) → render | create rect, resize via 'se' handle by (50,25) | draw bounds width=150, height=75 | PASS |
| 4 | undo → redo → render stable | create, rotate 90°, undo, redo | undo matrix b=0; redo matrix b≈1 | PASS |
| 5 | combined rotate+scale+skew canvas↔SVG parity | rotate 90°, render, export | canvas `[~0,1,-1,~0,100,~0]` AND SVG `rotate(90 50 50)` | PASS |
| 6 | styled scene pipeline (stroke/fill fidelity to canvas DTOs + SVG) | two styled nodes (dash, opacity, join, cap), export SVG, compile DTOs | SVG contains `fill-opacity`, `stroke-dasharray="8,4"`, `stroke-dashoffset="2"`, `stroke-linejoin`, `stroke-opacity`, `stroke-linecap`; DTOs carry same values | PASS |
| 7 | mixed scene (gradient rect + dashed line + rotated polygon) | build 3-node scene, compile each, export | all compile non-empty; SVG contains `<defs>` (gradient) | PASS |

## Why This Is E2E (not unit)

Each workflow drives the real editor controller functions (`createVectorWorkspaceState`,
`rotateSelectedNodes`, `moveSelectedNodes`, `resizeSelectedNodes`, `undoVectorAction`,
`redoVectorAction`) and the real export path (`VectorSvgExporter.exportToSvgString`), then compares
the canvas-facing DTO output against the export-facing SVG output — exercising the full create-edit-render-export
pipeline end to end through the SSOT `VectorDocumentSnapshot`.

— END OF E2E EVIDENCE —