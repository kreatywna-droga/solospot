import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G5-1: START");
console.log("B13-G5-1: CONTROLLED DECISION EXECUTION PLAN");

const task = `
WEB FACTOR — B13-G5-1

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Prepare the first controlled execution layer for B13 retry decisions.

IMPORTANT:
This is NOT full lifecycle integration yet.

The current system already has:

B13-G1:
classifyResult() PASS

B13-G2:
writeState() PASS

B13-G3:
markQueueStatus() PASS

B13-G3A:
markQueueStatus isolated test PASS

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
- any external package

CURRENT ARCHITECTURE:

classifyResult()
        ↓
evaluateRetryDecision()
        ↓
routeRetryDecision()
        ↓
decision

The decision-only path is already proven.

NOW:
Create the smallest possible PURE EXECUTION DECISION HELPER.

PURPOSE:

Translate a retry decision into an execution instruction,
WITHOUT actually executing it.

The helper should accept a decision object and return a structured
execution plan.

Preferred conceptual shape:

createExecutionPlan(decision)

Input:

{
  action: "RETRY_DEVELOPER",
  incrementRetry: true,
  terminal: false
}

Output:

{
  execution: "DISPATCH_DEVELOPER",
  shouldDispatch: true,
  shouldWriteState: true,
  shouldUpdateQueue: true,
  incrementRetry: true
}

For HUMAN_REVIEW:

Input:

{
  action: "HUMAN_REVIEW",
  incrementRetry: false,
  terminal: true
}

Output should represent:

{
  execution: "PARK_HUMAN_REVIEW",
  shouldDispatch: false,
  shouldWriteState: true,
  shouldUpdateQueue: true,
  incrementRetry: false
}

IMPORTANT:

This helper is ONLY an execution PLAN.

It must NOT perform any side effect.

FORBIDDEN:

- no fs.writeFileSync()
- no fs.renameSync()
- no STATE.md modification
- no QUEUE.md modification
- no DISPATCH.json modification
- no AgentExecutionBridge
- no dispatch
- no lock acquisition
- no retry counter modification
- no state transition
- no queue transition

The helper must be pure/deterministic.

Do NOT duplicate routeRetryDecision() logic.

Do NOT change routeRetryDecision().

Do NOT change getRetryLimit().

Do NOT change classifyResult().

Do NOT change writeState().

Do NOT change markQueueStatus().

Do NOT modify evaluateAndResume() yet.

This step creates ONLY the execution-plan boundary.

SUPPORTED DECISIONS:

1. RETRY_DEVELOPER

Expected plan:
- execution = DISPATCH_DEVELOPER
- shouldDispatch = true
- shouldWriteState = true
- shouldUpdateQueue = true
- incrementRetry = true
- terminal = false

2. HUMAN_REVIEW

Expected plan:
- execution = PARK_HUMAN_REVIEW
- shouldDispatch = false
- shouldWriteState = true
- shouldUpdateQueue = true
- incrementRetry = false
- terminal = true

3. Unknown action

Must fail safely.

Preferred:

{
  execution: "NOOP",
  shouldDispatch: false,
  shouldWriteState: false,
  shouldUpdateQueue: false,
  incrementRetry: false,
  terminal: true,
  reason: "UNKNOWN_DECISION"
}

Do not throw for ordinary unknown decision input.

VALIDATION:

Run:

node --check .agent-control/queue_watcher.mjs

Verify the new helper exists.

Verify the helper performs no file I/O.

Verify existing helpers remain present.

Verify evaluateAndResume() remains unchanged except for any absolutely
necessary export/import-free addition of the helper.

Prefer adding the helper without changing evaluateAndResume().

FINAL RESPONSE:

B13-G5-1 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

HELPER:
<name>

PURE_EXECUTION_PLAN:
<describe>

RETRY_DEVELOPER:
<describe resulting plan>

HUMAN_REVIEW:
<describe resulting plan>

UNKNOWN_DECISION:
<describe safe behavior>

SIDE_EFFECTS:
<confirm none>

DISPATCH:
<confirm none>

STATE:
<confirm unchanged>

QUEUE:
<confirm unchanged>

LOCK:
<confirm none>

EXISTING_HELPERS:
<confirm preserved>

EVALUATE_AND_RESUME:
<confirm unchanged>

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
  console.log("B13-G5-1: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G5-1: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G5-1 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G5-1: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G5_1_RESPONSE_OK");
  console.log("TEST_007_B13_G5_1_OK");

} catch (error) {
  console.error("");
  console.error("B13-G5-1: ERROR");
  console.error(error);
  process.exitCode = 1;
}