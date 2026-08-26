import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G5-4: START");
console.log("B13-G5-4: CONTROLLED EXECUTION IMPLEMENTATION");

const task = `
WEB FACTOR — B13-G5-4

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Implement the first controlled execution layer for B13 execution plans.

B13-G5-1:
createExecutionPlan() PASS

B13-G5-2:
isolated execution-plan test PASS

B13-G5-3:
execution-plan integration PASS

B13-G5-3A:
8/8 PASS

NOW:
Implement a PURELY LOCAL execution helper that executes the
execution plan's STATE/QUEUE effects.

IMPORTANT:
This is NOT full lifecycle integration.

DO NOT dispatch agents yet.

TARGET:
.agent-control/queue_watcher.mjs

STRICT SCOPE:
Modify ONLY:
.agent-control/queue_watcher.mjs

DO NOT MODIFY:
- .agent-control/opencode-adapter.mjs
- runner_config.json
- STATE.md
- QUEUE.md
- DISPATCH.json
- existing tests
- PlatformOrchestrator
- external packages

NEW HELPER:

Implement:

executeExecutionPlan(plan, context)

The helper must execute ONLY these two supported plans:

1. DISPATCH_DEVELOPER

2. PARK_HUMAN_REVIEW

IMPORTANT:
Despite the name DISPATCH_DEVELOPER, this step MUST NOT actually
dispatch the Developer.

It only prepares the lifecycle state required before a future
dispatch.

==================================================
DISPATCH_DEVELOPER
==================================================

Input plan:

{
  execution: "DISPATCH_DEVELOPER",
  shouldDispatch: true,
  shouldWriteState: true,
  shouldUpdateQueue: true,
  incrementRetry: true,
  terminal: false
}

Expected behavior:

1. Read current STATE.md.

2. Determine current RETRY_COUNT.

3. Increment RETRY_COUNT by exactly 1.

4. Write STATE.md using the existing writeState() helper.

Resulting state must contain:

STATE: IN_PROGRESS

RETRY_COUNT:
previous value + 1

DEVELOPER_STATUS:
NOT_STARTED

AUDITOR_STATUS:
NOT_STARTED

ARCHITECT_STATUS:
NOT_REQUIRED

HUMAN_REVIEW_REQUIRED:
NO

NEXT_ACTION:
DISPATCH_DEVELOPER

5. Update QUEUE.md using markQueueStatus():

STATUS:
IN_PROGRESS

NEXT_STAGE:
DEVELOPER_RETRY

6. DO NOT dispatch.

7. DO NOT acquire a lifecycle lock.

8. DO NOT modify DISPATCH.json.

==================================================
PARK_HUMAN_REVIEW
==================================================

Input plan:

{
  execution: "PARK_HUMAN_REVIEW",
  shouldDispatch: false,
  shouldWriteState: true,
  shouldUpdateQueue: true,
  incrementRetry: false,
  terminal: true
}

Expected behavior:

1. Read current STATE.md.

2. Preserve RETRY_COUNT.

3. Write STATE.md using writeState().

Result:

STATE:
HUMAN_REVIEW

HUMAN_REVIEW_REQUIRED:
YES

NEXT_ACTION:
HUMAN_REVIEW

4. Update QUEUE.md using markQueueStatus():

STATUS:
HUMAN_REVIEW

NEXT_STAGE:
HUMAN_REVIEW

5. DO NOT dispatch.

6. DO NOT acquire a lock.

7. DO NOT modify DISPATCH.json.

==================================================
CONTEXT
==================================================

Use an explicit context object rather than hidden globals.

Preferred context:

{
  statePath,
  queuePath,
  taskId
}

The helper must validate required paths.

If context is missing or invalid:
fail safely with a deterministic error.

==================================================
IMPORTANT ARCHITECTURAL RULE
==================================================

queue_watcher remains the ONLY lifecycle owner.

Do not create:

- ExecutionRunner
- RetryRunner
- LifecycleRunner
- new orchestration layer
- new dispatcher abstraction

Do not move lifecycle ownership elsewhere.

==================================================
NO ACTUAL DISPATCH
==================================================

Even though the plan says:

DISPATCH_DEVELOPER

the helper MUST NOT call:

AgentExecutionBridge.dispatch()

and MUST NOT instantiate AgentExecutionBridge.

The actual dispatch will be implemented in a later B13 step.

==================================================
NO LOCK
==================================================

executeExecutionPlan() must NOT call:

acquireLock()
releaseLock()

Lock lifecycle will be integrated later.

==================================================
ATOMIC WRITES
==================================================

Use the existing:

writeState()

and:

markQueueStatus()

helpers.

Do not duplicate their file-writing logic.

==================================================
ERROR SAFETY
==================================================

Unknown execution type must fail safely.

Preferred result:

{
  executed: false,
  execution: "NOOP",
  reason: "UNKNOWN_EXECUTION_PLAN"
}

Do not silently perform a different operation.

Missing context must also fail safely.

==================================================
RETURN VALUE
==================================================

Preferred successful result:

{
  executed: true,
  execution: "DISPATCH_DEVELOPER",
  dispatched: false,
  stateWritten: true,
  queueUpdated: true,
  lockAcquired: false
}

For HUMAN_REVIEW:

{
  executed: true,
  execution: "PARK_HUMAN_REVIEW",
  dispatched: false,
  stateWritten: true,
  queueUpdated: true,
  lockAcquired: false
}

==================================================
DO NOT MODIFY evaluateAndResume()
==================================================

This step creates the execution helper only.

Do NOT integrate it into evaluateAndResume() yet.

==================================================
VALIDATION
==================================================

Run:

node --check .agent-control/queue_watcher.mjs

Verify:

createExecutionPlan() still exists.

executeExecutionPlan() exists.

writeState() still exists.

markQueueStatus() still exists.

routeRetryDecision() still exists.

getRetryLimit() still exists.

classifyResult() still exists.

evaluateRetryDecision() still exists.

Verify no changes to:

STATE.md

QUEUE.md

DISPATCH.json

runner_config.json

Verify no AgentExecutionBridge dispatch.

Verify no lock operations.

==================================================
FINAL RESPONSE
==================================================

B13-G5-4 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

HELPER:
executeExecutionPlan()

DISPATCH_DEVELOPER:
<describe state/queue changes>

PARK_HUMAN_REVIEW:
<describe state/queue changes>

ACTUAL_DISPATCH:
<confirm none>

LOCK:
<confirm none>

DISPATCH_JSON:
<confirm unchanged>

STATE:
<describe>

QUEUE:
<describe>

UNKNOWN_PLAN:
<describe safe behavior>

EXISTING_HELPERS:
<confirm preserved>

EVALUATE_AND_RESUME:
<confirm unchanged>

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
  console.log("B13-G5-4: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G5-4: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G5-4 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G5-4: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G5_4_RESPONSE_OK");
  console.log("TEST_007_B13_G5_4_OK");

} catch (error) {
  console.error("");
  console.error("B13-G5-4: ERROR");
  console.error(error);
  process.exitCode = 1;
}