# TASK WF-HACP-PROD-005 — MODEL SELECTION MATRIX & INTELLIGENCE JUSTIFICATION

**TASK ID:** WF-HACP-PROD-005  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## MODEL SELECTION MATRIX

| Role | Selected Model | Provider | Primary Capability | Why Selected | Fallback Model |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Orchestrator** | `gemini-3.6-flash-high` | Google DeepMind | High Context & DAG Execution | Superior DAG step tracking across 26 execution phases without dropping context | `opencode/claude-3-5-sonnet` |
| **Architect** | `opencode/claude-3-5-sonnet` | Anthropic / OpenCode | System Design & ADR | Deep multi-package architectural boundary analysis & SSOT rules | `gemini-3.6-flash-high` |
| **Developer** | `opencode/deepseek-v4-flash-free` | DeepSeek / OpenCode | Fast TypeScript Coding | Proven speed and accuracy on monorepo imports, interfaces, and stages | `opencode/claude-3-5-sonnet` |
| **Tester** | `opencode/nemotron-3-ultra-free` | NVIDIA / OpenCode | Adversarial & Edge Cases | Specialized in boundary value generation, stage rollback & failure injection | `opencode/claude-3-5-sonnet` |
| **Security Reviewer** | `opencode/claude-3-5-sonnet` | Anthropic / OpenCode | Security Pattern Audit | Deep security audit, tenant RLS isolation & existence masking verification | `gemini-3.6-flash-high` |
| **Auditor** | `opencode/nemotron-3-ultra-free` | NVIDIA / OpenCode | Read-Only Forensic Audit | Strict read-only audit capability without modifying working tree state | `opencode/claude-3-5-sonnet` |

---

## FALLBACK POLICY

If any selected primary model seat becomes unavailable or hits API quota limits, HACP automatically switches to the designated deterministic fallback model seat specified above, logs the fallback event in `WF-HACP-PROD-005_PROGRESS.md`, and continues execution without requiring human steering.
