# 94. WEB FACTOR Platform Operations Guide

> Maintained by Agent 2 (Platform Engineering Maintenance)  
> Date: 2026-07-31  
> Status: 🟢 APPROVED

---

## 1. Operating Instructions for Running Audits

To run a standard Platform Engineering Audit after Agent 1 completes a sprint, execute the Orchestrator CLI parser:

```bash
# Execute Sprint 6B Audit Profile
npx tsx packages/platform-intelligence-orchestrator/src/cli/PlatformCLI.ts report --target . --format markdown --out docs/studio/77_SPRINT6B_AUDIT_REPORT.md

# Execute Production Release Profile
npx tsx packages/platform-intelligence-orchestrator/src/cli/PlatformCLI.ts report --target . --format json --out release-audit.json
```

---

## 2. Preset Selection Rules

| Situation | Recommended Preset | Reason |
|-----------|--------------------|--------|
| **Local Feature Branch Commit** | `QUICK_AUDIT` | Instant feedback on security secrets and syntax syntax errors. |
| **End of Sprint (6B, 6C, 6D, 7)** | `PRODUCT_AUDIT` | Evaluates feature Quality Gates, subsystem regression, and layer boundaries. |
| **Architecture Refactoring** | `ARCHITECTURE_AUDIT` | Verifies ADR compliance (ADR-001, ADR-002, ADR-003) and layer isolation. |
| **Pre-Release Candidate Build** | `RELEASE_AUDIT` | Comprehensive 10-module master audit verifying 100% release criteria. |

---

## 3. Interpreting Results & Escalation

- **Verdict = READY & Score >= 80**: Proceed to merge feature branch and approve Architecture Freeze.
- **Verdict = NOT_READY / Score < 80**: Inspect `Unified Systemic Risks` table in generated report, resolve P1 items, and re-run audit.
