# TASK WF-HACP-STUDIO-G1-38 — WORKFORCE SELECTION

**TASK ID:** WF-HACP-STUDIO-G1-38-VECTOR-ALIGNMENT-ENGINE
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-38 — Vector Alignment Engine Expansion

---

## 1. Role Assignment

| Role | Seat Assignment | Responsibility |
|:---|:---|:---|
| **Orchestrator** | HACP Autonomous Control Plane | Subsystem orchestration, task graph execution, governance enforcement. |
| **Architect** | Lead Architect (Gemini 3.6 Flash High) | Architectural contract, alignment primitives design, `VectorEditingEngine` and `VectorWorkspaceController` implementation. |
| **Test Engineer** | Lead Test Engineer | Creation of deterministic unit, integration, E2E, adversarial, and failure injection tests in `VectorAlignmentG138.test.ts`. |
| **Independent Auditor** | Agent 2 (Read-Only Subagent) | Read-only audit of code changes, test coverage, regression reconciliation, and governance rules. |
| **B13 Governance** | B13 Release Authority | Gate verification and final commit ratification (`FORMALLY RATIFIED 🔒`). |

## 2. Independence Boundary

- The Lead Architect / Developer executes code changes and test creation.
- The Independent Auditor operates strictly read-only and validates the final diff, test logs, and regression state before B13 commit authorization.

---

— END OF WORKFORCE SELECTION —
