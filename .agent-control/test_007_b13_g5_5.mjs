import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G5-5: START");
console.log("B13-G5-5: CONTROLLED LIFECYCLE INTEGRATION");

const task = `
WEB FACTOR — B13-G5-5

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Integrate executeExecutionPlan() into evaluateAndResume() through an
explicit controlled execution mode.

IMPORTANT:
This is the FIRST lifecycle integration of the execution layer.

The execution must remain explicitly controlled.

DO NOT enable execution for the normal production/default path yet.

ALREADY VERIFIED:

B13-G1:
classifyResult() PASS

B13-G2:
writeState() PASS

B13-G3:
markQueueStatus() PASS

B13-G3A:
isolated test PASS

B13-G4-1:
routeRetryDecision() PASS

B13-G4-1A:
15/15 PASS

B13-G4-2:
getRetryLimit() PASS

B13-G4-2A:
16/16 PASS

B13-G4-3:
configuration boundary PASS

B13-G4-4:
decision-only integration PASS

B13-G4-4A:
decision-only lifecycle PASS

B13-G4-4B:
collision fix PASS

B13-G5-1:
createExecutionPlan() PASS

B13-G5-2:
isolated execution-plan test PASS

B13-G5-3:
execution-plan integration PASS

B13-G5-3A:
8/8 PASS

B13-G5-4:
executeExecutionPlan() PASS

B13-G5-4A:
isolated execution test PASS

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

==================================================
CURRENT ARCHITECTURE
==================================================

Current decision flow:

evaluateAndResume()
        ↓
evaluateRetryDecision()
        ↓
createExecutionPlan()
        ↓
RETURN PLAN

The execution helper now exists:

executeExecutionPlan(plan, context)

It has already been tested in isolation.

==================================================
OBJECTIVE OF G5-5
==================================================

Add a controlled lifecycle option to evaluateAndResume():

executionOnly: true

When BOTH are true:

decisionOnly: true
executionPlanOnly: true
executionOnly: true

the lifecycle should:

1. calculate the retry decision
2. create the execution plan
3. execute the execution plan
4. return the execution result

This mode is ONLY a controlled test/integration mode.

==================================================
REQUIRED RESULT
==================================================

For:

decisionKind:
"auditor_hold"

decisionRetryCount:
0

Expected:

decision.action:
"RETRY_DEVELOPER"

executionPlan.execution:
"DISPATCH_DEVELOPER"

executionResult.executed:
true

executionResult.execution:
"DISPATCH_DEVELOPER"

executionResult.dispatched:
false

executionResult.stateWritten:
true

executionResult.queueUpdated:
true

executionResult.lockAcquired:
false

The result should clearly expose:

{
  action: "EXECUTION_RESULT_PROBE",
  readOnly: false,
  decision: {...},
  executionPlan: {...},
  executionResult: {...}
}

The exact property ordering is not important.

Do NOT spread decision, executionPlan or executionResult into the
outer object in a way that can overwrite action.

==================================================
ISOLATED CONTEXT
==================================================

The controlled execution mode MUST accept explicit paths through
options.

Preferred:

{
  decisionOnly: true,
  executionPlanOnly: true,
  executionOnly: true,

  decisionKind: "auditor_hold",
  decisionRetryCount: 0,

  executionContext: {
    statePath,
    queuePath,
    taskId
  }
}

evaluateAndResume() should pass this explicit context into:

executeExecutionPlan(
  executionPlan,
  executionContext
)

Do NOT use hidden temporary files.

Do NOT modify the real STATE.md or QUEUE.md during the test.

==================================================
HUMAN REVIEW
==================================================

Also support:

decisionKind:
"auditor_hold"

decisionRetryCount:
3

Expected:

decision.action:
"HUMAN_REVIEW"

executionPlan.execution:
"PARK_HUMAN_REVIEW"

executionResult.executed:
true

executionResult.execution:
"PARK_HUMAN_REVIEW"

executionResult.dispatched:
false

executionResult.stateWritten:
true

executionResult.queueUpdated:
true

executionResult.lockAcquired:
false

==================================================
NORMAL PATH MUST REMAIN SAFE
==================================================

This is critical.

If:

executionOnly !== true

then evaluateAndResume() MUST NOT execute the plan.

Existing behavior must remain unchanged.

In particular:

decisionOnly: true
executionPlanOnly: true

without:

executionOnly: true

must remain PLAN ONLY.

No STATE write.
No QUEUE write.
No dispatch.
No lock.

==================================================
NO REAL DISPATCH
==================================================

Even in executionOnly mode:

executeExecutionPlan()

must remain the only execution function.

DO NOT call:

AgentExecutionBridge.dispatch()

DO NOT instantiate AgentExecutionBridge.

No Developer dispatch.

No Auditor dispatch.

No Architect dispatch.

==================================================
NO LOCK
==================================================

G5-5 must NOT introduce lock handling.

Do NOT call:

acquireLock()
releaseLock()

The lock lifecycle will be integrated separately.

==================================================
DISPATCH.JSON
==================================================

Do NOT read or modify DISPATCH.json in this step.

==================================================
STATE / QUEUE
==================================================

The controlled execution mode is allowed to write the explicit
executionContext STATE.md and QUEUE.md files.

It must NOT write the real project STATE.md or QUEUE.md during the
test.

The execution helper already owns these writes.

Do NOT duplicate writeState() or markQueueStatus() logic.

==================================================
ERROR SAFETY
==================================================

If:

executionOnly === true

but:

executionContext is missing,

return a safe deterministic error/result.

Do not silently use global STATE_PATH / QUEUE_PATH.

Preferred:

{
  action: "EXECUTION_RESULT_PROBE",
  readOnly: false,
  executed: false,
  reason: "EXECUTION_CONTEXT_REQUIRED"
}

No writes.

==================================================
PRESERVE EXISTING MODES
==================================================

Preserve:

1. normal evaluateAndResume()
2. decisionOnly mode
3. executionPlanOnly mode

Do not change their existing semantics.

New mode:

decisionOnly + executionPlanOnly + executionOnly

is the ONLY mode that performs executeExecutionPlan().

==================================================
NO NEW ORCHESTRATION
==================================================

queue_watcher remains the lifecycle owner.

Do NOT create:

- ExecutionRunner
- LifecycleRunner
- RetryRunner
- new orchestrator
- new dispatcher abstraction

==================================================
VALIDATION
==================================================

Run:

node --check .agent-control/queue_watcher.mjs

Verify:

classifyResult() remains.

getRetryLimit() remains.

routeRetryDecision() remains.

evaluateRetryDecision() remains.

createExecutionPlan() remains.

executeExecutionPlan() remains.

Verify:

decisionOnly remains read-only.

executionPlanOnly remains plan-only.

executionOnly requires explicit executionContext.

Verify no AgentExecutionBridge dispatch.

Verify no lock acquisition.

Verify DISPATCH.json remains untouched.

Verify normal lifecycle path is unchanged.

==================================================
FINAL RESPONSE
==================================================

B13-G5-5 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

INTEGRATION:
<describe evaluateAndResume -> decision -> plan -> execution>

EXECUTION_ONLY:
<describe controlled execution mode>

RETRY_DEVELOPER:
<describe result>

HUMAN_REVIEW:
<describe result>

DECISION_ONLY:
<confirm preserved>

EXECUTION_PLAN_ONLY:
<confirm preserved>

CONTEXT_REQUIRED:
<confirm explicit context requirement>

REAL_DISPATCH:
<confirm none>

LOCK:
<confirm none>

DISPATCH_JSON:
<confirm unchanged>

REAL_STATE:
<confirm untouched>

REAL_QUEUE:
<confirm untouched>

EXISTING_HELPERS:
<confirm preserved>

NORMAL_PATH:
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
  console.log("B13-G5-5: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G5-5: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G5-5 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G5-5: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G5_5_RESPONSE_OK");
  console.log("TEST_007_B13_G5_5_OK");

} catch (error) {
  console.error("");
  console.error("B13-G5-5: ERROR");
  console.error(error);
  process.exitCode = 1;
}