# TASK WF-HACP-PROD-006 — DYNAMIC MODEL SEAT ROUTING MATRIX

**TASK ID:** WF-HACP-PROD-006  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## DYNAMIC MODEL SEAT ROUTING MATRIX

| Role | Primary Model | Provider | Primary Capability | Why Selected | Fallback Model | Stage Assignment |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Orchestrator** | `gemini-3.6-flash-high` | Google DeepMind | High Context & DAG Execution | Superior DAG step tracking across long-running multi-stage executions | `opencode/claude-3-5-sonnet` | Stages 0, 1, 2, 3, 4, 5 |
| **Architect** | `opencode/claude-3-5-sonnet` | Anthropic / OpenCode | System Design & ADR | Deep multi-package architectural boundary analysis & SSOT rules | `gemini-3.6-flash-high` | Stages 0, 1, 2, 3, 4, 5 |
| **Domain Developer** | `opencode/deepseek-v4-flash-free` | DeepSeek / OpenCode | Fast TypeScript Domain Coding | Proven speed and accuracy on domain state machine implementation | `opencode/claude-3-5-sonnet` | Stage 1 (Domain SSOT) |
| **Integration Developer** | `opencode/deepseek-v4-flash-free` | DeepSeek / OpenCode | Multi-Package Integration | Fast, accurate multi-package integration across deployment & readiness engines | `opencode/claude-3-5-sonnet` | Stages 2, 3, 4 |
| **Tester** | `opencode/nemotron-3-ultra-free` | NVIDIA / OpenCode | Adversarial & Edge Cases | Specialized in boundary value generation, multi-stage rollback & failure injection | `opencode/claude-3-5-sonnet` | Stages 1, 2, 3, 4, 5 |
| **Security Reviewer** | `opencode/claude-3-5-sonnet` | Anthropic / OpenCode | Security Pattern Audit | Deep security audit, tenant RLS isolation & existence masking verification | `gemini-3.6-flash-high` | Stages 3, 4, 5 |
| **Auditor** | `opencode/nemotron-3-ultra-free` | NVIDIA / OpenCode | Read-Only Forensic Audit | Strict read-only audit capability without modifying working tree state | `opencode/claude-3-5-sonnet` | Stage 5 (Final Audit) |

---

## DYNAMIC CAPABILITY REASSESSMENT LOG

1. **Stage 1 Reassessment:** Domain Developer (`opencode/deepseek-v4-flash-free`) evaluated for `DeploymentEngine` state machine implementation. Verified capability $\rightarrow$ Retained.
2. **Stage 2 Reassessment:** Integration Developer (`opencode/deepseek-v4-flash-free`) evaluated for cross-package integration between `packages/deployment-core` and `packages/release-readiness-intelligence`. Verified capability $\rightarrow$ Retained with Architect review.
3. **Stage 3 & 4 Reassessment:** Security Reviewer (`opencode/claude-3-5-sonnet`) and Adversarial Tester (`opencode/nemotron-3-ultra-free`) dynamically assigned to verify multi-tenant API gateway RLS boundaries and multi-stage failure injection.
