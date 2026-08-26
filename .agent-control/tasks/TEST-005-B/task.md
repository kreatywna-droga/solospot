## TEST-005-B

STATUS: READY
PRIORITY: TEST
TYPE: QUEUE_RESUME_TEST

DEPENDENCIES:
TEST-005-A

NEXT_STAGE:
DEVELOPER
# TEST-005-B — Automatic Resume

TASK_ID: TEST-005-B

TYPE: QUEUE_RESUME_TEST

## OBJECTIVE

Verify that a new READY task appearing after the queue entered WAITING can be automatically detected and executed.

## CONSTRAINTS

Do NOT modify production code.

Allowed modifications are limited to:

.agent-control/tasks/TEST-005-B/

## ACCEPTANCE CRITERIA

1. TEST-005-B initially does not exist in the executable queue.
2. The control plane reaches WAITING after TEST-005-A.
3. TEST-005-B is subsequently added to the queue with STATUS: READY.
4. Orchestrator detects the newly available READY task.
5. Orchestrator exits WAITING.
6. Orchestrator starts TEST-005-B without a new human instruction.
7. Developer receives TEST-005-B.
8. Developer produces TASK RESULT.
9. Auditor independently audits TEST-005-B.
10. Auditor returns PASS.
11. Orchestrator marks TEST-005-B COMPLETE.
12. No production files are modified.

## SUCCESS CONDITION

A newly available READY task automatically resumes the control-plane execution cycle.