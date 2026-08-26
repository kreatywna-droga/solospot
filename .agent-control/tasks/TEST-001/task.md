# TASK-001 — Agent System Smoke Test

TASK_ID: TASK-001

## OBJECTIVE

Verify the basic handoff mechanism between the WEB FACTOR agents.

This is a SYSTEM TEST.

No production implementation changes are allowed.

## ACCEPTANCE CRITERIA

1. Developer receives this task.
2. Developer produces a structured TASK RESULT.
3. Developer does not modify production code.
4. Auditor receives the Developer result.
5. Auditor independently reviews the result.
6. Auditor produces an AUDIT RESULT.
7. Orchestrator receives the final routing information.
8. No production source files are modified.

## CONSTRAINTS

READ-ONLY WITH RESPECT TO PRODUCTION CODE.

Do not modify:
- src/
- apps/
- packages/
- database migrations
- production configuration

Allowed changes:
- .agent-control/
- agent artifacts required for this test

## EXPECTED FLOW

READY
→ DEVELOPER
→ TASK RESULT
→ AUDITOR
→ AUDIT RESULT
→ ORCHESTRATOR

## SUCCESS CONDITION

The complete handoff chain is demonstrated with evidence.

No production code changes are required.