# TEST-005-A — Queue Empty / Waiting State

TASK_ID: TEST-005-A

TYPE: QUEUE_WAIT_TEST

## OBJECTIVE

Verify that the Orchestrator correctly enters a WAITING state when the task queue contains no executable READY tasks.

## CONSTRAINTS

Do NOT modify production code.

Allowed modifications are limited to:

.agent-control/tasks/TEST-005-A/

## ACCEPTANCE CRITERIA

1. Orchestrator selects TEST-005-A.
2. Developer receives the task.
3. Developer produces TASK RESULT.
4. Auditor independently audits the result.
5. Auditor returns PASS.
6. Orchestrator marks TEST-005-A COMPLETE.
7. Orchestrator re-evaluates the queue.
8. No executable READY task remains.
9. Orchestrator enters an explicit WAITING state.
10. Orchestrator does not terminate with an error.
11. Orchestrator does not invent a new task.
12. No human intervention is required to acknowledge the empty queue.

## SUCCESS CONDITION

TEST-005-A reaches COMPLETE and the control plane enters WAITING because no executable task exists.