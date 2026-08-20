# TASK WF-HACP-PROD-005 — WORKFORCE STRUCTURE & ASSIGNMENTS

**TASK ID:** WF-HACP-PROD-005  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## WORKFORCE ROLE ASSIGNMENTS & CAPABILITY REQUIREMENTS

### Role 1: Governor / Orchestrator
- **RESPONSIBILITY:** Manages 26-phase execution DAG, verifies gate transitions, coordinates workforce handoffs.
- **CAPABILITY REQUIREMENTS:** Large context window, multi-phase DAG tracking, zero hallucination, strict rule compliance.
- **ASSIGNED MODEL SEAT:** `gemini-3.6-flash-high` (Google DeepMind)
- **SELECTION REASON:** Superior capability in executing complex multi-phase DAG task graphs accurately.

### Role 2: Architect
- **RESPONSIBILITY:** Formulates 6-layer ADR, verifies 5-package boundary constraints, defines SSOT ownership and conflict rules.
- **CAPABILITY REQUIREMENTS:** Deep software architecture design knowledge, multi-package boundary analysis.
- **ASSIGNED MODEL SEAT:** `opencode/claude-3-5-sonnet` (Anthropic / OpenCode)
- **SELECTION REASON:** Unmatched software architectural analysis and clean design pattern enforcement.

### Role 3: Developer
- **RESPONSIBILITY:** Implements multi-stage pipeline stages and API gateway across target packages.
- **CAPABILITY REQUIREMENTS:** Rapid, accurate TypeScript coding across monorepo packages.
- **ASSIGNED MODEL SEAT:** `opencode/deepseek-v4-flash-free` (DeepSeek / OpenCode)
- **SELECTION REASON:** Fast, accurate code generation across monorepo imports and interfaces.

### Role 4: Test Engineer & Adversarial Tester
- **RESPONSIBILITY:** Writes feature tests, 5 E2E vertical slices, 10 adversarial scenarios, and multi-stage failure injection tests.
- **CAPABILITY REQUIREMENTS:** Adversarial testing mindset, boundary value detection, stage rollback verification.
- **ASSIGNED MODEL SEAT:** `opencode/nemotron-3-ultra-free` (NVIDIA / OpenCode)
- **SELECTION REASON:** Specialized in edge-case generation, falsification testing, and failure injection.

### Role 5: Security Reviewer
- **RESPONSIBILITY:** Performs explicit security audit covering multi-tenant RLS isolation, plan quota bounds, sensitive data leakage, and existence masking.
- **CAPABILITY REQUIREMENTS:** Deep security pattern audit, tenant isolation boundary verification.
- **ASSIGNED MODEL SEAT:** `opencode/claude-3-5-sonnet` (Anthropic / OpenCode)
- **SELECTION REASON:** Excellent at identifying security vulnerabilities and cross-tenant leakage paths.

### Role 6: Independent Auditor
- **RESPONSIBILITY:** Read-only forensic audit of git diffs, test inventory reconciliation, suppression search, and B13 gate decision.
- **CAPABILITY REQUIREMENTS:** Read-only audit enforcement, evidence-over-narrative verification.
- **ASSIGNED MODEL SEAT:** `opencode/nemotron-3-ultra-free` (NVIDIA / OpenCode)
- **SELECTION REASON:** Proven track record in strict forensic ratification audit without modifying working tree state.
