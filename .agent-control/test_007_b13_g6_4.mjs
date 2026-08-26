import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G6-4: START");
console.log("B13-G6-4: CONTROLLED DEVELOPER REQUEST INTEGRATION");

const task = `
WEB FACTOR — B13-G6-4

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Integrate createDeveloperDispatchRequest() into the controlled
Developer execution boundary.

This step MUST NOT perform a real Developer dispatch.

The purpose is to verify:

execution plan
    ↓
controlled execution
    ↓
Developer dispatch request
    ↓
request returned

without sending the request to ACP/OpenCode.

==================================================
TARGET
==================================================

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
EXISTING HELPERS
==================================================

Preserve all existing helpers:

classifyResult()
writeState()
markQueueStatus()
routeRetryDecision()
getRetryLimit()
evaluateRetryDecision()
createExecutionPlan()
executeExecutionPlan()
createDeveloperDispatchRequest()

==================================================
OBJECTIVE
==================================================

Extend executeExecutionPlan() so that the:

DISPATCH_DEVELOPER

execution can prepare a Developer dispatch request.

The request must be created using:

createDeveloperDispatchRequest()

Do NOT duplicate its validation logic.

==================================================
INPUT
==================================================

The execution context may contain:

{
  statePath,
  queuePath,
  taskId,
  developerTask,
  developerRole,
  developerModel
}

For example:

{
  statePath,
  queuePath,
  taskId: "TEST-007",
  developerTask: "Execute Developer retry",
  developerRole: "developer",
  developerModel: "opencode/deepseek-v4-flash-free"
}

==================================================
DISPATCH_DEVELOPER
==================================================

When:

plan.execution === "DISPATCH_DEVELOPER"

the helper must:

1. Perform the existing STATE update.

2. Perform the existing QUEUE update.

3. Create a Developer dispatch request using:

createDeveloperDispatchRequest({
  taskId,
  task: developerTask,
  role: developerRole,
  model: developerModel
})

4. Return the request in the execution result.

Example:

{
  executed: true,
  execution: "DISPATCH_DEVELOPER",
  dispatched: false,
  stateWritten: true,
  queueUpdated: true,
  lockAcquired: false,
  dispatchRequest: {
    valid: true,
    role: "developer",
    taskId: "TEST-007",
    task: "Execute Developer retry",
    model: "opencode/deepseek-v4-flash-free"
  }
}

==================================================
CRITICAL DISPATCH RULE
==================================================

The request is ONLY constructed.

DO NOT call:

AgentExecutionBridge.dispatch()

DO NOT instantiate:

AgentExecutionBridge

DO NOT call:

runAgent()

DO NOT access ACP.

DO NOT write DISPATCH.json.

DO NOT create a subprocess.

==================================================
MISSING DEVELOPER TASK
==================================================

If:

developerTask

is missing or invalid, the helper must fail safely.

Do NOT dispatch.

Do NOT fabricate a task.

Do NOT use a hidden default task.

Return the dispatch-request validation result.

Preferred:

{
  executed: false,
  execution: "DISPATCH_DEVELOPER",
  dispatched: false,
  stateWritten: false,
  queueUpdated: false,
  lockAcquired: false,
  dispatchRequest: {
    valid: false,
    reason: "MISSING_TASK"
  }
}

IMPORTANT:

For an invalid Developer dispatch request, do not write STATE or
QUEUE first.

Validate the Developer dispatch request BEFORE lifecycle writes.

==================================================
INVALID ROLE
==================================================

If:

developerRole === "auditor"

or:

developerRole === "architect"

then:

dispatchRequest.valid === false

reason:

INVALID_ROLE

No STATE write.

No QUEUE write.

No dispatch.

==================================================
INVALID MODEL
==================================================

If developerModel is an invalid type:

dispatchRequest.valid === false

reason:

INVALID_MODEL

No dispatch.

No lifecycle write caused by the invalid request.

==================================================
VALID MODEL
==================================================

If developerModel is omitted:

dispatchRequest.model === null

If it is a valid non-empty string:

preserve the trimmed string.

==================================================
IMMUTABILITY
==================================================

Do not mutate the execution context.

==================================================
HUMAN REVIEW
==================================================

PARK_HUMAN_REVIEW must NOT create a Developer dispatch request.

Its behavior must remain unchanged.

Expected:

{
  executed: true,
  execution: "PARK_HUMAN_REVIEW",
  dispatched: false,
  stateWritten: true,
  queueUpdated: true,
  lockAcquired: false
}

No dispatchRequest is required for HUMAN_REVIEW.

==================================================
LOCK
==================================================

No lock operations.

Do NOT call:

acquireLock()
releaseLock()

==================================================
LIFECYCLE
==================================================

Do NOT modify evaluateAndResume() in this step.

The existing controlled execution mode must continue working.

==================================================
REAL FILES
==================================================

Do NOT modify the real:

STATE.md
QUEUE.md
DISPATCH.json

The test will provide isolated paths.

==================================================
VALIDATION
==================================================

Run:

node --check .agent-control/queue_watcher.mjs

Verify:

1. Valid Developer context creates dispatchRequest.

2. dispatchRequest.valid === true.

3. dispatchRequest.role === "developer".

4. dispatchRequest.taskId is preserved.

5. dispatchRequest.task is preserved.

6. dispatchRequest.model is preserved or null.

7. Invalid task prevents lifecycle writes.

8. Invalid role prevents lifecycle writes.

9. Invalid model prevents lifecycle writes.

10. HUMAN_REVIEW does not create dispatchRequest.

11. No AgentExecutionBridge dispatch.

12. No lock.

13. DISPATCH.json untouched.

14. Existing helpers preserved.

==================================================
FINAL RESPONSE
==================================================

B13-G6-4 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

DEVELOPER_REQUEST:
<describe>

VALID_REQUEST:
<describe>

MISSING_TASK:
<describe>

INVALID_ROLE:
<describe>

INVALID_MODEL:
<describe>

STATE_ORDER:
<confirm request validation occurs before STATE/QUEUE writes>

HUMAN_REVIEW:
<confirm unchanged>

REAL_DISPATCH:
<confirm none>

ACP:
<confirm none>

LOCK:
<confirm none>

DISPATCH_JSON:
<confirm unchanged>

EVALUATE_AND_RESUME:
<confirm unchanged>

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
  console.log("B13-G6-4: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G6-4: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G6-4 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G6-4: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G6_4_RESPONSE_OK");
  console.log("TEST_007_B13_G6_4_OK");

} catch (error) {
  console.error("");
  console.error("B13-G6-4: ERROR");
  console.error(error);
  process.exitCode = 1;
}