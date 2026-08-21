# TASK WF-HACP-STUDIO-G1-40 — ARCHITECTURE DECISION LOG

**TASK ID:** WF-HACP-STUDIO-G1-40-SNAPPING-ENGINE-DYNAMIC-GUIDES
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**MODE:** HACP NIGHT SHIFT TRAINING — LEVEL 2
**MILESTONE:** G1-40 — Vector Snapping Engine & Dynamic Alignment Guides

---

## Decision ADR-G1-40-01 — Vector Snapping Engine Architecture & Transient Overlay Isolation

### Context
Interactive shape movement and resizing in Authoring Studio require real-time snapping to adjacent object edges, centers, canvas boundaries, and canvas grid lines with visual guide line overlays.

### Decision
1. **SSOT Preservation:** `VectorDocumentSnapshot` remains single source of truth for persistent document geometry in document space.
2. **Transient Overlay Isolation:** `activeGuideLines` are editor overlays attached to workspace state (`VectorWorkspaceState.activeGuideLines`). They are NOT stored in `VectorDocumentSnapshot` or `HistoryStack`.
3. **Snapping Threshold Default:** Snapping threshold defaults to `5px` in document space. Values `<= 0` fall back to `5px`.
4. **Grid Snapping Default:** Grid snapping uses `20px` grid size by default. Values `<= 0` fall back to `20px`.
5. **Locked Shape Protection:** Locked shapes (`locked: true`) act as snap reference nodes but are never moved by snapping actions.
6. **Transactionality:** Intermediate drag snaps produce 0 history entries; finalizing the drag operation commits 1 transaction to `HistoryStack`.

---

— END OF ARCHITECTURE DECISION LOG —
