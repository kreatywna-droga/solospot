# TASK-006 — Queue Watcher & Autonomous Resume Control Test

TASK_ID: TASK-006

TYPE: CONTROL_PLANE_IMPLEMENTATION_TEST

## OBJECTIVE
Design and implement a minimal, safe, and deterministic queue watcher mechanism within `.agent-control/` that detects when `.agent-control/QUEUE.md` transitions from no READY tasks to having an executable READY task, automatically resuming the Orchestrator from the WAITING state.

## CONSTRAINTS
- READ-ONLY with respect to production code (`src/`, `packages/`, etc.).
- Work strictly within `.agent-control/` and `.agent-control/tasks/TEST-006/`.
- No architectural deviations, no modifications to agent definitions or workflows.
- Prevent duplicate execution and infinite loops.
- Support deterministic test validation.

## ACCEPTANCE CRITERIA
1. Proposal created and documented.
2. Queue watcher implementation created inside `.agent-control/`.
3. Validates queue parsing, dependency resolution, and status verification (`READY` vs `NOT_AVAILABLE`/`BLOCKED`/`COMPLETE`).
4. Successfully detects when `STATE: WAITING` and `QUEUE.md` contains an eligible `READY` task.
5. Safely transitions `STATE.md` from `WAITING` to `IN_PROGRESS` (or dispatches `CURRENT_TASK`).
6. Re-tested with simulated `TEST-005-B` queue addition.
7. Produces `developer_result.md` with complete evidence.
