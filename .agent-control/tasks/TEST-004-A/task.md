# TEST-004-A — Queue Transition A

TASK_ID: TEST-004-A

TYPE: QUEUE_TRANSITION_TEST

## OBJECTIVE

Verify that the Orchestrator can execute a READY task through Developer and Auditor, mark it COMPLETE, and automatically select the next eligible READY task from the queue.

## CONSTRAINTS

This is a control-plane test.

Do NOT modify:

- src/
- apps/
- packages/
- database migrations
- production configuration

Only files inside:

.agent-control/tasks/TEST-004-A/

may be modified.

## ACCEPTANCE CRITERIA

1. Orchestrator selects TEST-004-A because it is READY.
2. Developer receives the complete task context.
3. Developer produces TASK RESULT.
4. No production files are modified.
5. Auditor independently verifies the result.
6. Auditor returns PASS.
7. Orchestrator marks TEST-004-A COMPLETE.
8. Orchestrator does NOT wait for a new human instruction before selecting the next eligible task.
9. Orchestrator identifies TEST-004-B as the next READY task.

## SUCCESS CONDITION

TEST-004-A reaches COMPLETE and the Orchestrator identifies TEST-004-B as the next eligible task automatically.