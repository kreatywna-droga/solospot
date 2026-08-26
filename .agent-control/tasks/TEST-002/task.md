# TASK-002 — Controlled HOLD / RETRY Smoke Test

TASK_ID: TASK-002

## OBJECTIVE

Verify that the WEB FACTOR agent control system can detect an audit failure, route the task back to Developer, perform a controlled retry, and reach PASS without modifying production code.

This is a CONTROL-PLANE TEST.

## IMPORTANT

Do NOT modify production code.

Do NOT modify:

- src/
- apps/
- packages/
- database migrations
- production configuration

Only files inside:

.agent-control/tasks/TEST-002/

may be created or modified.

## TEST DESIGN

The first Developer attempt MUST intentionally produce an incomplete test artifact.

The artifact must contain a clearly identifiable missing requirement so that the Auditor can legitimately return:

RECOMMENDATION: HOLD

The Developer must NOT be told the exact missing requirement in advance.

The Auditor must identify the missing requirement independently.

## ACCEPTANCE CRITERIA

### Attempt 1

1. Developer receives TASK-002.
2. Developer creates the allowed test artifact.
3. Developer produces TASK RESULT.
4. Developer reports the first attempt as COMPLETE only if its own workflow considers the task complete.
5. Auditor independently audits the result.
6. Auditor detects the intentionally missing requirement.
7. Auditor returns HOLD.
8. Auditor records exact evidence explaining the failure.

### Routing

9. Orchestrator receives HOLD.
10. Orchestrator increments RETRY_COUNT from 0 to 1.
11. Orchestrator changes task state to RETRY / IN_PROGRESS.
12. Orchestrator sends the complete Auditor findings to Developer.
13. No production files are modified.

### Attempt 2

14. Developer corrects the artifact based on the Auditor findings.
15. Developer produces a new TASK RESULT.
16. Auditor independently re-audits the corrected artifact.
17. Auditor returns PASS.

### Completion

18. Orchestrator changes TASK-002 state to COMPLETE.
19. RETRY_COUNT equals 1.
20. Final state contains evidence of:
    - first attempt,
    - HOLD,
    - retry,
    - corrected attempt,
    - PASS.
21. No production source files were modified.

## EXPECTED STATE MACHINE

READY
→ IN_PROGRESS
→ AUDIT
→ HOLD
→ RETRY
→ IN_PROGRESS
→ AUDIT
→ PASS
→ COMPLETE

## SUCCESS CONDITION

The complete HOLD → RETRY → PASS loop is demonstrated with persistent evidence.

No production code changes are permitted.