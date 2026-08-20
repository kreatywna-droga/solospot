# TASK WF-HACP-STUDIO-G1-35 — MODEL SELECTION

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE

---

## 1. ARCHITECTURAL MODEL

**Selected model: Pure Functional Exporter + Existing SSOT Snapshot + Document Serializer Roundtrip**

```
VectorWorkspaceState (SSOT)
   │  snapshot: VectorDocumentSnapshot { nodes, selectedIds }
   ▼
VectorSvgExporter.exportToSvgString(snapshot, w, h)   ← pure, headless
   │
   ├─ buildDefs()        → gradient <defs> (dedup, cycle-guarded)
   ├─ renderNode()       → element strings (null-safe, cycle-guarded)
   └─ getTransformAttribute() → translate/rotate/scale/skew
   ▼
SVG string

Document Persistence Roundtrip:
VectorDocumentSerializer.serializeVectorDocument(snapshot) → JSON
   → restoreVectorDocument(json) → snapshot → exportToSvgString → identical SVG
```

## 2. WHY THIS MODEL

| Alternative | Rejected because |
|:---|:---|
| DOM-based export (document.createElement) | Violates "NO DOM" contract; not testable headlessly |
| Custom serializer for export | `VectorDocumentSerializer` already exists (G1-29); reuse is the SSOT principle |
| Import-only (parse SVG → nodes) | Out of scope; Candidate B is export + persistence |
| BuilderDocument-based exporter | Vector workspace uses `VectorDocumentSnapshot`, not BuilderDocument |

## 3. STATE HANDLING

- The exporter is stateless: each call reads `snapshot.nodes`, produces a string, mutates nothing.
- Failure injection verifies zero residual mutation (snapshot deep-equal after export).
- History/selection are irrelevant to output (E2E test 2 proves selection does not affect export).

## 4. MODEL SELECTION: PASS