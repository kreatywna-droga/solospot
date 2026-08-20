# TASK WF-HACP-PROD-006 — WORKFORCE STRUCTURE & ASSIGNMENTS

**TASK ID:** WF-HACP-PROD-006  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## WORKFORCE ROLE ASSIGNMENTS & CAPABILITY REQUIREMENTS

### Role 1: Orchestrator
- **RESPONSIBILITY:** Manages 26-phase execution DAG, 4-stage checkpoint creation, context retention verification, stage resume test.
- **CAPABILITY REQUIREMENTS:** Large context window, multi-phase DAG tracking, checkpoint state verification.
- **ASSIGNED MODEL SEAT:** `gemini-3.6-flash-high` (Google DeepMind)
- **SELECTION REASON:** Superior DAG tracking capability across long-running multi-stage executions.

### Role 2: Architect
- **RESPONSIBILITY:** Formulates Mission Contract, 5-layer ADR, verifies 4-package boundary constraints, defines SSOT ownership and conflict rules.
- **CAPABILITY REQUIREMENTS:** Deep software architecture design knowledge, multi-package boundary analysis.
- **ASSIGNED MODEL SEAT:** `opencode/claude-3-5-sonnet` (Anthropic / OpenCode)
- **SELECTION REASON:** Unmatched software architectural analysis and clean design pattern enforcement.

### Role 3: Domain Developer
- **RESPONSIBILITY:** Implements Stage 1 (`DeploymentEngine` state machine in `packages/deployment-core`).
- **CAPABILITY REQUIREMENTS:** Rapid, accurate TypeScript domain model implementation.
- **ASSIGNED MODEL SEAT:** `opencode/deepseek-v4-flash-free` (DeepSeek / OpenCode)
- **SELECTION REASON:** Fast, accurate code generation across domain state machine interfaces.

### Role 4: Integration Developer
- **RESPONSIBILITY:** Implements Stage 2 (`ReleasePipelineOrchestrator` in `packages/deployment-core`), Stage 3 (`DeploymentApiGateway`), and Stage 4 (`ObservabilityTelemetryStage`).
- **CAPABILITY REQUIREMENTS:** Multi-package integration across `packages/release-readiness-intelligence` and `packages/observability`.
- **ASSIGNED MODEL SEAT:** `opencode/deepseek-v4-flash-free` (DeepSeek / OpenCode)
- **SELECTION REASON:** Proven speed and accuracy on monorepo package imports and pipeline orchestration.

### Role 5: Test Engineer & Adversarial Tester
- **RESPONSIBILITY:** Writes feature tests, 7 E2E vertical slice workflows, 15 adversarial scenarios, and 3 failure injection tests.
- **CAPABILITY REQUIREMENTS:** Adversarial testing mindset, boundary value detection, stage rollback verification.
- **ASSIGNED MODEL SEAT:** `opencode/nemotron-3-ultra-free` (NVIDIA / OpenCode)
- **SELECTION REASON:** Specialized in edge-case generation, falsification testing, and multi-stage failure injection.

### Role 6: Security Reviewer
- **RESPONSIBILITY:** Performs explicit security audit covering multi-tenant RLS isolation, release authorization bounds, sensitive token masking.
- **CAPABILITY REQUIREMENTS:** Deep security pattern audit, tenant isolation boundary verification.
- **ASSIGNED MODEL SEAT:** `opencode/claude-3-5-sonnet` (Anthropic / OpenCode)
- **SELECTION REASON:** Excellent at identifying security vulnerabilities and cross-tenant leakage paths.

### Role 7: Independent Auditor
- **RESPONSIBILITY:** Read-only forensic audit of git history, stage checkpoints, test inventory reconciliation, suppression search, and B13 gate decision.
- **CAPABILITY REQUIREMENTS:** Read-only audit enforcement, evidence-over-narrative verification.
- **ASSIGNED MODEL SEAT:** `opencode/nemotron-3-ultra-free` (NVIDIA / OpenCode)
- **SELECTION REASON:** Proven track record in strict forensic ratification audit without modifying working tree state.
