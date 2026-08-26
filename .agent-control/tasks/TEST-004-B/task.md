# TEST-004-B — Queue Transition B

TASK_ID: TEST-004-B

TYPE: QUEUE_TRANSITION_TEST

## OBJECTIVE

Verify that a second READY task can be automatically selected and executed after TEST-004-A reaches COMPLETE.

## CONSTRAINTS

This is a control-plane test.

Do NOT modify:

- src/
- apps/
- packages/
- database migrations
- production configuration

Only files inside:

.agent-control/tasks/TEST-004-B/

may be modified.

## ACCEPTANCE CRITERIA

1. TEST-004-B remains READY while TEST-004-A is executing.
2. Orchestrator selects TEST-004-B after TEST-004-A reaches COMPLETE.
3. Developer receives the complete TEST-004-B context.
4. Developer produces TASK RESULT.
5. No production files are modified.
6. Auditor independently verifies the result.
7. Auditor returns PASS.
8. Orchestrator marks TEST-004-B COMPLETE.
9. No human instruction is required between TEST-004-A and TEST-004-B.

## SUCCESS CONDITION

TEST-004-B reaches COMPLETE as the automatically selected successor of TEST-004-A.