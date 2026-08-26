import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G5-3: START");
console.log("B13-G5-3: CONTROLLED EXECUTION-PLAN INTEGRATION");

const task = `
WEB FACTOR — B13-G5-3

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Integrate createExecutionPlan() into evaluateAndResume() as a
READ/PLAN-ONLY boundary.

This is NOT real execution.

The purpose is to prove that evaluateAndResume() can:

1. obtain the retry decision,
2. pass that decision into createExecutionPlan(),
3. return the resulting execution plan,

WITHOUT executing the plan.

ALREADY VERIFIED:

B13-G1:
classifyResult() PASS

B13-G2:
writeState() PASS

B13-G3:
markQueueStatus() PASS

B13-G3A:
isolated markQueueStatus PASS

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
READ/DECISION integration PASS

B13-G4-4A:
decision-only lifecycle PASS

B13-G4-4B:
decision result collision FIX PASS

B13-G5-1:
createExecutionPlan() PASS

B13-G5-2:
createExecutionPlan() isolated test PASS

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
- any existing test file
- PlatformOrchestrator
- any external package

CURRENT FLOW:

evaluateAndResume()
    ↓
evaluateRetryDecision()
    ↓
routeRetryDecision()
    ↓
decision

createExecutionPlan() currently exists as a pure helper.

NEW FLOW FOR THIS STEP:

evaluateAndResume()
    ↓
evaluateRetryDecision()
    ↓
decision
    ↓
createExecutionPlan()
    ↓
executionPlan
    ↓
RETURN ONLY

STRICT REQUIREMENT:

The new path must be PLAN-ONLY.

It MUST NOT execute the returned plan.

FORBIDDEN:

- writeState()
- markQueueStatus()
- fs.writeFileSync()
- fs.renameSync()
- fs.unlinkSync()
- STATE.md modification
- QUEUE.md modification
- DISPATCH.json modification
- AgentExecutionBridge.dispatch()
- acquireLock()
- releaseLock()
- retry counter modification
- state transition
- queue transition
- actual Developer dispatch
- actual Auditor dispatch
- actual Architect dispatch
- HUMAN_REVIEW transition

Do NOT implement the real retry lifecycle yet.

Do NOT modify the existing normal WAITING -> IN_PROGRESS path.

DESIGN:

Extend the existing decisionOnly mechanism with a second explicit
option that requests the execution plan.

Preferred option structure:

{
  decisionOnly: true,
  executionPlanOnly: true,
  decisionKind: "auditor_hold",
  decisionRetryCount: 0
}

When executionPlanOnly is true:

1. calculate the retry decision using evaluateRetryDecision()
2. call createExecutionPlan(decision)
3. return both decision and executionPlan

Preferred result shape:

{
  action: "EXECUTION_PLAN_PROBE",
  readOnly: true,
  decision: {
    action: "RETRY_DEVELOPER",
    ...
  },
  executionPlan: {
    execution: "DISPATCH_DEVELOPER",
    shouldDispatch: true,
    shouldWriteState: true,
    shouldUpdateQueue: true,
    incrementRetry: true,
    terminal: false
  }
}

For HUMAN_REVIEW:

decision.action:
"HUMAN_REVIEW"

executionPlan.execution:
"PARK_HUMAN_REVIEW"

The exact structure may differ slightly if needed for compatibility,
but the following must be true:

- outer action identifies this as a probe
- decision remains intact
- executionPlan remains intact
- readOnly is true
- no side effects occur

IMPORTANT:

Do not spread decision or executionPlan into the outer object in a
way that can overwrite the outer action.

For example, DO NOT do:

{
  action: "EXECUTION_PLAN_PROBE",
  ...decision,
  ...executionPlan
}

Use explicit nested objects.

EXISTING DECISION-ONLY PATH:

Preserve the existing B13-G4-4 behavior.

Do not break:

decisionOnly: true

The existing decision-only probe must continue to work.

PREFERRED BEHAVIOR:

decisionOnly === true
executionPlanOnly !== true

→ return existing RETRY_DECISION_PROBE

decisionOnly === true
executionPlanOnly === true

→ return EXECUTION_PLAN_PROBE

Normal evaluateAndResume() calls:

→ unchanged

NO NEW ORCHESTRATION LAYER.

queue_watcher remains the lifecycle owner.

VALIDATION REQUIRED:

1. node --check .agent-control/queue_watcher.mjs

2. Verify createExecutionPlan() remains present.

3. Verify evaluateRetryDecision() remains present.

4. Verify routeRetryDecision() remains present.

5. Verify getRetryLimit() remains present.

6. Verify existing decisionOnly behavior remains intact.

7. Verify executionPlanOnly returns an execution plan.

8. Verify RETRY_DEVELOPER produces:
   execution = DISPATCH_DEVELOPER

9. Verify HUMAN_REVIEW produces:
   execution = PARK_HUMAN_REVIEW

10. Verify no STATE.md write.

11. Verify no QUEUE.md write.

12. Verify no DISPATCH.json write.

13. Verify no lock acquisition.

14. Verify no AgentExecutionBridge dispatch.

15. Verify normal WAITING -> IN_PROGRESS path remains unchanged.

16. Do not create or modify any test files from the implementation.

FINAL RESPONSE:

B13-G5-3 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

INTEGRATION:
<describe decision → createExecutionPlan integration>

DECISION_ONLY:
<confirm existing behavior preserved>

EXECUTION_PLAN_ONLY:
<describe behavior>

RETRY_DEVELOPER:
<describe plan>

HUMAN_REVIEW:
<describe plan>

SIDE_EFFECTS:
<confirm none>

DISPATCH:
<confirm none>

LOCK:
<confirm none>

STATE:
<confirm unchanged>

QUEUE:
<confirm unchanged>

DISPATCH_JSON:
<confirm unchanged>

EXISTING_PATH:
<confirm WAITING -> IN_PROGRESS preserved>

HELPERS_PRESERVED:
<confirm all existing helpers remain>

VALIDATION:
<commands and results>

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
  console.log("B13-G5-3: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G5-3: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G5-3 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G5-3: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G5_3_RESPONSE_OK");
  console.log("TEST_007_B13_G5_3_OK");

} catch (error) {
  console.error("");
  console.error("B13-G5-3: ERROR");
  console.error(error);
  process.exitCode = 1;
}