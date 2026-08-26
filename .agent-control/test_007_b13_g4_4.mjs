import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G4-4: START");
console.log("B13-G4-4: CONTROLLED LIFECYCLE DECISION INTEGRATION");

const task = `
WEB FACTOR — B13-G4-4

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Integrate getRetryLimit() and routeRetryDecision() into the
existing evaluateAndResume() lifecycle as a READ/DECISION boundary
ONLY.

This is the first controlled lifecycle integration.

ALREADY VERIFIED:

B13-G1:
classifyResult() PASS

B13-G2:
writeState() PASS

B13-G3:
markQueueStatus() PASS

B13-G3A:
isolated markQueueStatus test PASS

B13-G4-1:
routeRetryDecision() PASS

B13-G4-1A:
15/15 tests PASS

B13-G4-2:
getRetryLimit() PASS

B13-G4-2A:
16/16 tests PASS

B13-G4-3:
configuration/lifecycle boundary PASS

TARGET FILE:
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
- any test file
- PlatformOrchestrator
- any package outside queue_watcher.mjs

IMPORTANT:
Preserve all existing helpers exactly in behavior:
- classifyResult()
- routeRetryDecision()
- getRetryLimit()
- writeState()
- markQueueStatus()

DO NOT redesign them.

INTEGRATION OBJECTIVE:

Inside evaluateAndResume(), establish a controlled decision boundary
that can obtain:

1. retryLimit via:
   getRetryLimit()

2. retry decision via:
   routeRetryDecision(
     kind,
     retryCount,
     retryLimit
   )

The integration must be READ/DECISION ONLY.

ALLOWED:
- read current state
- read current queue
- read retry configuration
- determine current retry count
- classify an already available result if the existing lifecycle
  provides one
- calculate a retry decision
- return/log the decision for controlled verification

FORBIDDEN AT THIS STAGE:

DO NOT:
- write STATE.md
- write QUEUE.md
- write DISPATCH.json
- clear DISPATCH.json
- call writeState()
- call markQueueStatus()
- dispatch Developer
- dispatch Auditor
- dispatch Architect
- invoke AgentExecutionBridge
- acquire a new lifecycle lock for the decision-only path
- increment RETRY_COUNT
- change STATE
- change QUEUE STATUS
- change NEXT_STAGE
- enter HUMAN_REVIEW
- perform actual retry
- modify runner_config.json

The purpose is ONLY to prove that evaluateAndResume() can reach
the retry decision function safely.

IMPORTANT:
Do not invent a new orchestration layer.

Do not create another lifecycle controller.

queue_watcher remains the lifecycle owner.

REQUIRED DESIGN:

Add the smallest possible integration.

Prefer a small internal/pure helper if needed, for example:

evaluateRetryDecision(kind, retryCount, configPath)

which:

- obtains retryLimit using getRetryLimit()
- calls routeRetryDecision()
- returns the resulting decision

However, do not duplicate routeRetryDecision() logic.

The actual evaluateAndResume() integration must be minimal.

RESULT OBJECT:

The decision-only path should expose enough information for testing,
for example:

{
  action: "RETRY_DEVELOPER",
  incrementRetry: true,
  terminal: false,
  retryCount: 0,
  retryLimit: 3
}

or an equivalent structured result.

Do not require this exact shape if the existing architecture has a
better compatible structure.

CRITICAL:
Existing WAITING -> IN_PROGRESS behavior must remain intact.

Do not break the current queue selection or lock behavior.

If evaluateAndResume() currently exits early for non-WAITING states,
do NOT remove that behavior wholesale.

Instead, introduce the smallest controlled entry point necessary
for testing the decision boundary.

VALIDATION REQUIRED:

1. node --check .agent-control/queue_watcher.mjs

2. Verify:
   classifyResult() remains present.

3. Verify:
   writeState() remains present.

4. Verify:
   markQueueStatus() remains present.

5. Verify:
   routeRetryDecision() remains present.

6. Verify:
   getRetryLimit() remains present.

7. Verify:
   no writes to STATE.md / QUEUE.md / DISPATCH.json occur
   from the new decision-only path.

8. Verify:
   no AgentExecutionBridge dispatch occurs from the new path.

9. Verify:
   retryLimit is actually obtained from getRetryLimit(),
   not hard-coded.

10. Verify:
   routeRetryDecision() is actually called,
   not duplicated.

11. Verify:
   existing WAITING -> IN_PROGRESS path remains syntactically
   and structurally intact.

DO NOT CREATE A FULL LIFECYCLE TEST YET.

DO NOT CONNECT RETRY EXECUTION YET.

FINAL RESPONSE:

Return exactly:

B13-G4-4 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

INTEGRATION:
<describe the controlled READ/DECISION integration>

GET_RETRY_LIMIT:
<confirm actual usage>

ROUTE_RETRY_DECISION:
<confirm actual usage>

SIDE_EFFECTS:
<confirm STATE/QUEUE/DISPATCH writes are absent>

DISPATCH:
<confirm no agent dispatch>

LOCK:
<confirm no unsafe lock expansion>

EXISTING_PATH:
<confirm WAITING -> IN_PROGRESS preserved>

VALIDATION:
<commands and results>

HELPERS_PRESERVED:
<confirm G1/G2/G3/G4-1/G4-2 remain>

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
  console.log("B13-G4-4: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G4-4: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G4-4 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G4-4: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G4_4_RESPONSE_OK");
  console.log("TEST_007_B13_G4_4_OK");

} catch (error) {
  console.error("B13-G4-4: ERROR");
  console.error(error);
  process.exitCode = 1;
}