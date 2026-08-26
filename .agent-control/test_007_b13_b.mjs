import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-B: START");
console.log("B13-B: AUDITOR CONTRACT REVIEW");

const task = `
WEB FACTOR B13-B

TASK_ID: TEST-007

AUDIT THE FOLLOWING ARCHITECT CONTRACT ONLY.

OWNER:
queue_watcher / Control Plane

CONTRACT:

DEVELOPER_COMPLETE:
STATE=AWAITING_AUDIT
QUEUE=IN_PROGRESS
queue_watcher dispatches Auditor
no retry

AUDITOR_PASS:
STATE=COMPLETE
QUEUE=COMPLETE
task closes and returns toward WAITING
no retry

AUDITOR_HOLD:
STATE=IN_PROGRESS
QUEUE=IN_PROGRESS
RETRY_COUNT + 1
Developer retry while under limit
otherwise HUMAN_REVIEW

ARCHITECT_REVIEW:
STATE=ARCHITECT_REVIEW
QUEUE=IN_PROGRESS
Architect decides Developer retry or HUMAN_REVIEW

HUMAN_REVIEW:
STATE=HUMAN_REVIEW
QUEUE=IN_PROGRESS
HUMAN_REVIEW_REQUIRED=YES
no automatic dispatch

EXECUTION_FAILURE:
STATE=IN_PROGRESS
QUEUE=IN_PROGRESS
bounded retry
after limit -> HUMAN_REVIEW

LOCK:
claim lock exists only during one dispatch cycle
always released through finally
never held while waiting for agent result

IMPORTANT:

Audit only this contract.
Do not modify files.
Do not redesign the architecture.
Do not search the repository.
Check whether the state transitions are internally coherent and compatible with the agreed ownership:
queue_watcher / Control Plane.

Return exactly:

AUDITOR B13 RESULT
STATUS: PASS / HOLD
FINDING: <one concise paragraph>
REQUIRED_CHANGE: <NONE or one concise sentence>
NEXT_ACTION: <one sentence>
HANDOFF: <one sentence>
`;

try {
  const result = await runAgent({
    role: "auditor",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B13-B: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-B: NO_AUDITOR_RESPONSE");
  }

  if (!/AUDITOR B13 RESULT/i.test(result.response)) {
    throw new Error("B13-B: INVALID_AUDITOR_RESULT");
  }

  console.log("");
  console.log("B13_B_RESPONSE_OK");
  console.log("TEST_007_B13_B_OK");
} catch (error) {
  console.error("B13-B: ERROR");
  console.error(error);
  process.exitCode = 1;
}