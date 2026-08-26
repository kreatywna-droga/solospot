import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G: START");
console.log("B13-G: LIFECYCLE IMPLEMENTATION");

const task = `
WEB FACTOR — B13-G

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Implement the MINIMUM lifecycle-closure required by the ratified
B13 contract in the existing Control Plane.

PRIMARY FILE:
.agent-control/queue_watcher.mjs

OPTIONAL CONFIG:
.agent-control/runner_config.json
Only modify this file if a retry-limit configuration is genuinely
required and cannot safely use an existing value.

IMPORTANT ARCHITECTURAL RULES:

1. queue_watcher / Control Plane remains the sole lifecycle owner.

2. DO NOT create an Agent Execution Runner.

3. DO NOT move lifecycle ownership to PlatformOrchestrator.

4. DO NOT modify:
   .agent-control/opencode-adapter.mjs

5. DO NOT modify:
   packages/platform-intelligence-orchestrator

6. DO NOT modify unrelated packages.

7. Preserve the existing AgentExecutionBridge.

8. Preserve the existing WAITING -> IN_PROGRESS automatic resume path.

9. Preserve the existing claim-lock behavior:
   acquire for one dispatch cycle and ALWAYS release in finally.
   Never hold the lock while waiting for an agent result.

10. DO NOT treat DISPATCH.json as a guaranteed response channel.
    The current signal payload represents dispatch metadata.
    Do not invent a response protocol based on fields that do not exist.

11. Use the actual dispatch/callback result already available to the
    Control Plane where possible.

RATIFIED B13 CONTRACT:

DEVELOPER_COMPLETE:
Developer result causes:
STATE = AWAITING_AUDIT
QUEUE remains IN_PROGRESS
next action = Auditor

AUDITOR_PASS:
Auditor PASS causes:
task STATUS = COMPLETE
lifecycle closes
STATE = WAITING
CURRENT_TASK = NONE
HUMAN_REVIEW_REQUIRED = NO

AUDITOR_HOLD:
Auditor HOLD without architectural escalation causes:
RETRY_COUNT += 1
Developer retry while retry limit is not exceeded.

AUDITOR_ARCHITECTURAL_ESCALATION:
Auditor HOLD containing architectural escalation /
REQUIRES_ARCHITECT_REVIEW causes:
STATE = ARCHITECT_REVIEW
QUEUE = IN_PROGRESS
Architect is dispatched.

ARCHITECT_RETRY:
Architect requests Developer retry:
RETRY_COUNT += 1
Developer is dispatched again while below retry limit.

ARCHITECT_HUMAN_REVIEW:
Architect requests HUMAN_REVIEW or architectural rejection:
STATE = HUMAN_REVIEW
HUMAN_REVIEW_REQUIRED = YES
No automatic dispatch.

EXECUTION_FAILURE:
If an active Developer dispatch throws or returns a failure result:
RETRY_COUNT += 1
Developer retry while below retry limit.
After retry limit:
STATE = HUMAN_REVIEW
HUMAN_REVIEW_REQUIRED = YES

HUMAN_REVIEW:
Park the task.
Do not automatically dispatch another agent.

LOCK:
Lock must always be released through finally.
Never keep it across agent execution/waiting.

IMPLEMENTATION REQUIREMENTS:

A. Inspect the existing queue_watcher.mjs before editing.

B. Add only the smallest helpers necessary.

C. Prefer small, explicit functions such as:
   - state writer
   - queue status updater
   - result classifier
   - lifecycle router

D. Do not create a second orchestration layer.

E. Do not assume that DISPATCH.json contains the final agent answer.

F. Keep existing public/exported functions compatible with the current
test suite wherever possible.

G. Do not rewrite the entire queue_watcher.mjs.

H. Do not alter unrelated formatting or architecture.

RETRY LIMIT:

Use an existing retry limit if one already exists.
If none exists, add a minimal bounded value, preferably:
RETRY_LIMIT = 3

Do not introduce a complex configuration system.

RESULT CLASSIFICATION:

The implementation should recognize the existing structured agent
responses already used by this project, including:

Developer:
TASK RESULT

Auditor:
AUDITOR RESULT
STATUS: PASS / HOLD

Architect:
ARCHITECT RESULT
STATUS / DECISION

Do not require an exact prose format beyond what is necessary to
route the lifecycle safely.

FAILURE SAFETY:

Any unexpected dispatch exception must not leave the task silently
claimed or the lock permanently held.

The implementation must fail closed:
if the result cannot safely be classified, do not mark the task
COMPLETE. Route to a safe retry or HUMAN_REVIEW according to the
bounded retry policy.

VALIDATION REQUIRED AFTER EDITING:

1. Run syntax validation on the modified JavaScript.

2. Run the existing relevant TEST-007 tests that are available.

3. If a test fails because the implementation exposes an existing
contract mismatch, report the exact failure rather than weakening
the test.

4. Confirm git diff / repository diff for the modified files.

5. Confirm no protected files were modified.

6. Do not modify tests merely to make them pass.

REQUIRED FINAL RESPONSE:

Return exactly:

B13-G IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <file>
- <file>

IMPLEMENTED:
1. <change>
2. <change>

STATE_MACHINE:
<concise description of implemented transitions>

RESULT_FLOW:
<how actual agent results reach lifecycle routing>

RETRY_LIMIT:
<value and behavior>

LOCK_VALIDATION:
<result>

TESTS:
1. <command> — PASS/FAIL
2. <command> — PASS/FAIL

DIFF_SUMMARY:
<concise summary>

RISKS:
<remaining risks>

BLOCKERS:
<none or exact blocker>

NEXT_ACTION:
<one sentence>

HANDOFF:
<one sentence>
`;

try {
  const result = await runAgent({
    role: "developer",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B13-G: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G_RESPONSE_OK");
  console.log("TEST_007_B13_G_OK");
} catch (error) {
  console.error("B13-G: ERROR");
  console.error(error);
  process.exitCode = 1;
}