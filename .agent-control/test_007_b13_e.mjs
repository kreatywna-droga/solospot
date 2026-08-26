import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-E: START");
console.log("B13-E: IMPLEMENTATION PLAN");

const task = `
WEB FACTOR — B13-E

TASK_ID: TEST-007

MODE: READ_ONLY

OBJECTIVE:
Inspect the existing .agent-control/queue_watcher.mjs and produce
a MINIMAL implementation plan for the already-ratified B13 lifecycle
contract.

RATIFIED CONTRACT:

1. DEVELOPER_COMPLETE
   STATE=AWAITING_AUDIT
   queue_watcher dispatches Auditor.

2. AUDITOR_PASS
   STATE=COMPLETE
   QUEUE=COMPLETE
   task lifecycle closes and returns toward WAITING.

3. AUDITOR_HOLD
   STATE=IN_PROGRESS
   RETRY_COUNT increments.
   Developer is retried while below bounded retry limit.
   After limit -> HUMAN_REVIEW.

4. ARCHITECT_REVIEW
   Entry occurs when Auditor returns HOLD with architectural
   escalation / REQUIRES_ARCHITECT_REVIEW.
   queue_watcher remains lifecycle owner.
   Architect is dispatched.
   Architect result routes to Developer retry or HUMAN_REVIEW.

5. HUMAN_REVIEW
   STATE=HUMAN_REVIEW
   HUMAN_REVIEW_REQUIRED=YES.
   No automatic dispatch while parked.

6. EXECUTION_FAILURE
   Trigger:
   Developer execution throws an error OR returns a failure result
   during an active dispatch cycle.
   queue_watcher retries within the bounded retry limit.
   After the limit -> HUMAN_REVIEW.

7. LOCK
   Claim lock exists only for one dispatch cycle.
   It must always be released through finally.
   It must never remain held while waiting for an agent result.

ARCHITECTURAL CONSTRAINTS:

- Lifecycle owner remains queue_watcher / Control Plane.
- Do NOT move lifecycle ownership to PlatformOrchestrator.
- Do NOT create Agent Execution Runner.
- Do NOT introduce another orchestration layer.
- Do NOT redesign AgentExecutionBridge unless strictly required.
- Do NOT modify files.
- Do NOT implement anything.
- READ_ONLY inspection only.

INSPECT:
.agent-control/queue_watcher.mjs

Determine:

A. Which existing functions already support the contract.
B. Which exact functions require modification.
C. Which new minimal function(s), if any, are required.
D. How STATE.md must be updated for every lifecycle transition.
E. How QUEUE.md must be updated for COMPLETE / retry / HUMAN_REVIEW.
F. How DISPATCH.json consumption/result handling should connect
   to the existing lifecycle without inventing a new runner.
G. How lock handling remains safe.
H. How bounded RETRY_COUNT should be enforced.
I. How Developer, Auditor and Architect results should be represented.
J. What tests must be added before declaring the lifecycle complete.

IMPORTANT:
This is an implementation PLAN ONLY.
Do not edit or create files.
Do not propose speculative architecture.
Prefer modifying the smallest possible surface.

Return exactly:

B13-E IMPLEMENTATION PLAN

CURRENT_SUPPORT:
<what queue_watcher already supports>

REQUIRED_CHANGES:
1. <file/function/change>
2. <file/function/change>
...

NEW_MINIMAL_FUNCTIONS:
<None or exact function names and responsibility>

STATE_TRANSITIONS:
<concise transition list>

QUEUE_TRANSITIONS:
<concise transition list>

DISPATCH_RESULT_FLOW:
<concise explanation>

LOCK_STRATEGY:
<concise explanation>

RETRY_STRATEGY:
<concise explanation>

TESTS_REQUIRED:
1. <test>
2. <test>
...

FILES_TO_MODIFY:
<exact files>

FILES_NOT_TO_MODIFY:
<important protected files>

RISKS:
<concise list>

NEXT_ACTION:
<one sentence>
`;

try {
  const result = await runAgent({
    role: "developer",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B13-E: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-E: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-E IMPLEMENTATION PLAN/i.test(result.response)) {
    throw new Error("B13-E: INVALID_IMPLEMENTATION_PLAN");
  }

  console.log("");
  console.log("B13_E_RESPONSE_OK");
  console.log("TEST_007_B13_E_OK");
} catch (error) {
  console.error("B13-E: ERROR");
  console.error(error);
  process.exitCode = 1;
}