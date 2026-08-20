# TASK WF-HACP-STUDIO-G1-34 — MODEL SELECTION MATRIX

**TASK ID:** WF-HACP-STUDIO-G1-34  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## MODEL_SELECTION_MATRIX

| ROLE | MODEL | CAPABILITY_REASON | FALLBACK | SEAT_STATUS |
| :--- | :--- | :--- | :--- | :---: |
| **Orchestrator** | `gemini-3.6-flash-high` | Multi-stage DAG tracking and long-running state management | `opencode/claude-3-5-sonnet` | **ACTIVE** |
| **Architect** | `opencode/claude-3-5-sonnet` | Unmatched vector architecture analysis & clean ADR formulation | `gemini-3.6-flash-high` | **ACTIVE** |
| **Developer** | `opencode/deepseek-v4-flash-free` | Rapid, precise TypeScript domain engine and controller implementation | `opencode/claude-3-5-sonnet` | **ACTIVE** |
| **Test Engineer** | `opencode/nemotron-3-ultra-free` | Thorough E2E and unit test suite construction | `opencode/claude-3-5-sonnet` | **ACTIVE** |
| **Adversarial Tester** | `opencode/nemotron-3-ultra-free` | Specialized in boundary value detection, edge case generation & failure injection | `opencode/claude-3-5-sonnet` | **ACTIVE** |
| **Independent Auditor** | `opencode/nemotron-3-ultra-free` | Strict read-only forensic audit and evidence-over-narrative enforcement | `opencode/claude-3-5-sonnet` | **ACTIVE** |
