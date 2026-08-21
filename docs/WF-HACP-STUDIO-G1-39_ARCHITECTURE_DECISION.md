# TASK WF-HACP-STUDIO-G1-39 — ARCHITECTURE DECISION LOG

**TASK ID:** WF-HACP-STUDIO-G1-39-SELECTION-TRANSFORM-SYSTEM
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-39 — Professional Selection & Transform System

---

## Decision ADR-G1-39-01 — Professional Selection & Transform Engine Architecture

### Context
Authoring Studio requires selection management and multi-object transform operations. Transforms can be applied via individual move/scale/rotate actions or composed matrix transformations in document space.

### Decision
1. **SSOT Enforcement:** `VectorDocumentSnapshot` remains the single source of truth for persistent document geometry in document space.
2. **Selection State Ownership:** Selection state is maintained as an editor property inside `VectorDocumentSnapshot.selectedIds` and workspace controller state.
3. **Transient Preview vs Persistent Commit:** Intermediate transform drag previews are transient and do NOT push entries to `HistoryStack`. Only finalized user transform operations push 1 transaction to `HistoryStack`.
4. **Transform Center & Custom Origin:** Scaling and rotation compute the selection bounding box center $(cx, cy)$ as the default transform origin, or use an explicit custom origin $(ox, oy)$ if provided.
5. **Zero / Near-Zero Scale Safeguard:** Near-zero scale factors are clamped (`Math.abs(scale) >= 1e-6`) to prevent NaN geometry corruption.
6. **Locked Shapes Protection:** Locked shapes (`locked: true`) are skipped during multi-selection transforms.

---

— END OF ARCHITECTURE DECISION LOG —
