import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G6-1: START");
console.log("B13-G6-1: DEVELOPER DISPATCH CONTRACT");

const task = `
WEB FACTOR — B13-G6-1

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Implement a PURE dispatch-contract helper for the Developer execution
boundary.

This step prepares the contract for a future real Developer dispatch.

IMPORTANT:
DO NOT connect this helper to evaluateAndResume().

DO NOT perform a real dispatch.

DO NOT modify lifecycle behavior.

TARGET:
.agent-control/queue_watcher.mjs

STRICT SCOPE:
Modify ONLY:
.agent-control/queue_watcher.mjs

DO NOT MODIFY:
- .agent-control/opencode-adapter.mjs
- STATE.md
- QUEUE.md
- DISPATCH.json
- runner_config.json
- existing tests
- PlatformOrchestrator
- external packages

==================================================
NEW HELPER
==================================================

Implement:

createDeveloperDispatchRequest(context)

The helper must be PURE.

It must NOT:

- call AgentExecutionBridge.dispatch()
- instantiate AgentExecutionBridge
- write files
- modify STATE.md
- modify QUEUE.md
- modify DISPATCH.json
- acquire locks
- release locks
- change lifecycle state
- perform network/ACP operations

==================================================
INPUT
==================================================

The helper accepts:

{
  taskId,
  task,
  role,
  model
}

Only taskId and task are mandatory.

role must resolve to:

"developer"

If role is omitted, default to:

"developer"

model may be omitted.

==================================================
OUTPUT
==================================================

For valid input return:

{
  valid: true,
  role: "developer",
  taskId: "<taskId>",
  task: "<task>",
  model: "<model or null>"
}

The object must be deterministic.

==================================================
VALIDATION
==================================================

taskId:

- required
- non-empty string
- trim whitespace

task:

- required
- non-empty string
- trim whitespace

role:

- optional
- if supplied must equal "developer"
- case-insensitive input may be normalized to "developer"

model:

- optional
- if supplied must be a non-empty string
- otherwise null

==================================================
INVALID INPUT
==================================================

Do NOT throw for ordinary invalid input.

Return:

{
  valid: false,
  reason: "<deterministic reason>"
}

Use these reasons:

MISSING_TASK_ID
INVALID_TASK_ID
MISSING_TASK
INVALID_TASK
INVALID_ROLE
INVALID_MODEL

Examples:

{}
→
{
  valid: false,
  reason: "MISSING_TASK_ID"
}

{
  taskId: "TEST-007"
}
→
{
  valid: false,
  reason: "MISSING_TASK"
}

{
  taskId: "TEST-007",
  task: "hello",
  role: "auditor"
}
→
{
  valid: false,
  reason: "INVALID_ROLE"
}

==================================================
SECURITY / OWNERSHIP
==================================================

The helper must NOT accept arbitrary roles.

Only:

developer

is valid.

Do not silently convert auditor or architect into developer.

==================================================
IMMUTABILITY
==================================================

Do not mutate the input context.

Return a new object.

==================================================
NO DISPATCH
==================================================

The name contains "DispatchRequest", but this is ONLY a request
constructor.

It must NOT call:

AgentExecutionBridge.dispatch()

==================================================
NO LIFECYCLE INTEGRATION
==================================================

Do NOT modify:

evaluateAndResume()

Do NOT call the helper from:

executeExecutionPlan()

Do NOT change:

createExecutionPlan()

Do NOT change:

routeRetryDecision()

==================================================
PRESERVE EXISTING HELPERS
==================================================

These must remain:

classifyResult()
writeState()
markQueueStatus()
routeRetryDecision()
getRetryLimit()
evaluateRetryDecision()
createExecutionPlan()
executeExecutionPlan()

==================================================
VALIDATION
==================================================

Run:

node --check .agent-control/queue_watcher.mjs

Verify the helper exists and is exported.

Verify no existing helper was removed.

Verify no file writes occur.

Verify no lock operations occur.

Verify no dispatch occurs.

Verify evaluateAndResume() remains unchanged.

==================================================
FINAL RESPONSE
==================================================

B13-G6-1 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

HELPER:
createDeveloperDispatchRequest()

VALID_INPUT:
<describe>

INVALID_INPUT:
<describe>

ROLE_BOUNDARY:
<describe>

IMMUTABILITY:
<describe>

REAL_DISPATCH:
<confirm none>

STATE_WRITE:
<confirm none>

QUEUE_WRITE:
<confirm none>

DISPATCH_JSON:
<confirm unchanged>

LOCK:
<confirm none>

LIFECYCLE_INTEGRATION:
<confirm none>

EXISTING_HELPERS:
<confirm preserved>

VALIDATION:
<commands/results>

BLOCKERS:
<none or exact blocker>

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
  console.log("B13-G6-1: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G6-1: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G6-1 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G6-1: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G6_1_RESPONSE_OK");
  console.log("TEST_007_B13_G6_1_OK");

} catch (error) {
  console.error("");
  console.error("B13-G6-1: ERROR");
  console.error(error);
  process.exitCode = 1;
}