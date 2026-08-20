# TASK WF-HACP-STUDIO-G1-34 — ADVERSARIAL VERIFICATION EVIDENCE

**TASK ID:** WF-HACP-STUDIO-G1-34  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## ADVERSARIAL VERIFICATION MATRIX (ADV-01 .. ADV-15)

| Scenario ID | Category | Description | Expected Behavior | Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **ADV-01** | Boundary | Single-click path with insufficient nodes | Generates valid `M x y` SVG path | Single anchor path generated | **PASS** |
| **ADV-02** | Session | Cancel immediately after first anchor | Leaves 0 committed document mutation | Snapshot remains empty | **PASS** |
| **ADV-03** | Performance | Rapid repeated pointer events | Preview updates without history pollution | `canUndo` is true for 1 finish commit | **PASS** |
| **ADV-04** | Geometry | Extremely small Bezier handle (`0.0001`) | Precise float formatting without loss | Format preserved in SVG path `d` | **PASS** |
| **ADV-05** | Geometry | Extremely large Bezier handle (`1e8`) | Large coordinate handling without crash | Format preserved in SVG path `d` | **PASS** |
| **ADV-06** | Topology | Coincident anchors | Valid 2-anchor path generated | Valid path data created | **PASS** |
| **ADV-07** | Deletion | Delete node from minimum-valid path | Reduces anchor count; deleting last removes node | Node cleanly removed when empty | **PASS** |
| **ADV-08** | Deletion | Delete multiple nodes rapidly | Sequential anchor removal without error | Anchors reduced cleanly | **PASS** |
| **ADV-09** | Conversion | Close path and convert node type | Updates node type to `smooth` with handles | Node converted to `smooth` | **PASS** |
| **ADV-10** | History | Complex multi-step undo/redo chain | Multi-level history playback | Pre- and post-states restored | **PASS** |
| **ADV-11** | Serialization | Legacy/malformed SVG path data | Restores path cleanly via serializer | Legacy path restored | **PASS** |
| **ADV-12** | Selection | Marquee selection over path geometry | Integrates with G1-33 marquee engine | Path selected correctly | **PASS** |
| **ADV-13** | Security | Locked path node move attempt | Rejects mutation on locked nodes | Node position unchanged | **PASS** |
| **ADV-14** | Rendering | Hidden path node rendering check | Returns 0 render commands for hidden path | Render commands array length = 0 | **PASS** |
| **ADV-15** | Input Safety | `NaN` / `Infinity` coordinate protection | Rejects non-finite inputs cleanly | Session ignores bad coordinates | **PASS** |
