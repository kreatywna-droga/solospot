import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G4-4B: START");
console.log("B13-G4-4B: FIX DECISION-ONLY RESULT COLLISION");

const task = `
WEB FACTOR — B13-G4-4B

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Fix the result-field collision in the B13-G4-4 decision-only
integration.

TARGET:
.agent-control/queue_watcher.mjs

CURRENT PROBLEM:

evaluateAndResume() contains a decisionOnly branch equivalent to:

return {
  action: 'RETRY_DECISION_PROBE',
  readOnly: true,
  ...decision,
};

Because decision contains its own "action" field, the spread
overwrites RETRY_DECISION_PROBE.

Observed failure:

EXPECTED:
RETRY_DECISION_PROBE

ACTUAL:
RETRY_DEVELOPER

REQUIRED FIX:

Preserve the outer action:

action: 'RETRY_DECISION_PROBE'

Expose the routing decision separately.

Preferred result shape:

{
  action: 'RETRY_DECISION_PROBE',
  readOnly: true,
  decision: {
    action: 'RETRY_DEVELOPER',
    incrementRetry: true,
    terminal: false
  }
}

Equivalent structure is acceptable if:

1. action remains exactly RETRY_DECISION_PROBE
2. the underlying routeRetryDecision result remains available
3. readOnly remains true

IMPORTANT:

Do NOT change:
- routeRetryDecision()
- getRetryLimit()
- classifyResult()
- writeState()
- markQueueStatus()

Do NOT change normal lifecycle behavior.

Do NOT add:
- dispatch
- retry execution
- state writes
- queue writes
- lock acquisition
- DISPATCH.json handling

ONLY fix the result-object collision.

The decisionOnly branch must remain:
- read-only
- no dispatch
- no writes
- no lock

VALIDATION:

Run:

node --check .agent-control/queue_watcher.mjs

Then verify the decisionOnly result has:

action === 'RETRY_DECISION_PROBE'

and contains the actual routing decision separately.

Verify existing helpers remain present.

FINAL RESPONSE:

B13-G4-4B IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

FIX:
<describe collision fix>

RESULT_SHAPE:
<describe returned structure>

ROUTING_DECISION:
<confirm original decision preserved>

SIDE_EFFECTS:
<confirm no writes, dispatch or lock>

HELPERS_PRESERVED:
<confirm existing helpers unchanged>

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
  console.log("B13-G4-4B: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G4-4B: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G4-4B IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G4-4B: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G4_4B_RESPONSE_OK");
  console.log("TEST_007_B13_G4_4B_OK");

} catch (error) {
  console.error("B13-G4-4B: ERROR");
  console.error(error);
  process.exitCode = 1;
}