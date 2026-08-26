import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G4-1: START");
console.log("B13-G4-1: IMPLEMENT RETRY DECISION ONLY");

const task = `
WEB FACTOR — B13-G4-1

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Implement ONLY the pure retry decision helper required by the
ratified B13 lifecycle contract.

TARGET FILE:
.agent-control/queue_watcher.mjs

CURRENT VERIFIED COMPONENTS:

B13-G1:
classifyResult(role, resultText)

B13-G2:
writeState(statePath, nextState)

B13-G3:
markQueueStatus(queuePath, taskId, status, nextStage)

B13-G3A:
isolated functional test PASS

Do not remove, replace, or redesign any of them.

STRICT SCOPE:
Modify ONLY:
.agent-control/queue_watcher.mjs

DO NOT MODIFY:
- .agent-control/opencode-adapter.mjs
- .agent-control/runner_config.json
- any test file
- PlatformOrchestrator
- any package outside queue_watcher.mjs

DO NOT IMPLEMENT YET:
- evaluateAndResume integration
- DISPATCH.json consumption
- AgentExecutionBridge changes
- actual agent dispatch
- Architect dispatch
- Auditor dispatch
- HUMAN_REVIEW state mutation
- QUEUE.md mutation
- writeState() calls
- markQueueStatus() calls
- lock changes
- new orchestration layer

ONLY IMPLEMENT:

A PURE FUNCTION:

routeRetryDecision(kind, retryCount, retryLimit)

The function must NOT perform I/O.
The function must NOT modify files.
The function must NOT dispatch agents.
The function must NOT mutate global state.

INPUT:

kind:
- auditor_hold
- execution_failure
- architect_retry
- any other value

retryCount:
current numeric retry count

retryLimit:
maximum allowed retries

OUTPUT:
Return a small structured decision object.

REQUIRED SEMANTICS:

1. auditor_hold

If retryCount < retryLimit:
return a decision equivalent to:

{
  action: "RETRY_DEVELOPER",
  incrementRetry: true,
  terminal: false
}

If retryCount >= retryLimit:
return:

{
  action: "HUMAN_REVIEW",
  incrementRetry: false,
  terminal: true
}

2. execution_failure

Same bounded behavior:

retryCount < retryLimit:
RETRY_DEVELOPER

retryCount >= retryLimit:
HUMAN_REVIEW

3. architect_retry

Same bounded retry behavior:

retryCount < retryLimit:
RETRY_DEVELOPER

retryCount >= retryLimit:
HUMAN_REVIEW

4. Unknown kind

Do NOT silently convert an unknown result into a developer retry.

Return a safe terminal decision equivalent to:

{
  action: "HUMAN_REVIEW",
  incrementRetry: false,
  terminal: true,
  reason: "UNKNOWN_RETRY_KIND"
}

5. Invalid retryLimit

If retryLimit is not a positive finite integer,
use a safe terminal HUMAN_REVIEW decision.

6. Invalid retryCount

Normalize invalid retryCount to 0 only if this does not create
an unsafe retry loop. Otherwise return HUMAN_REVIEW.

Prefer a safe deterministic implementation.

IMPORTANT:
The function is pure.

Calling it twice with the same arguments must produce the same
logical result.

It must not read:
- STATE.md
- QUEUE.md
- DISPATCH.json
- runner_config.json

It must not write any file.

It must not call:
- AgentExecutionBridge
- writeState
- markQueueStatus
- classifyResult

PLACEMENT:
Place the helper near the existing pure helper functions,
without disrupting classifyResult(), writeState(), or
markQueueStatus().

DO NOT CONNECT IT TO evaluateAndResume() YET.

VALIDATION:

Run:

node --check .agent-control/queue_watcher.mjs

Then manually verify the function for at least:

routeRetryDecision("auditor_hold", 0, 3)
→ RETRY_DEVELOPER

routeRetryDecision("auditor_hold", 2, 3)
→ RETRY_DEVELOPER

routeRetryDecision("auditor_hold", 3, 3)
→ HUMAN_REVIEW

routeRetryDecision("execution_failure", 0, 3)
→ RETRY_DEVELOPER

routeRetryDecision("execution_failure", 3, 3)
→ HUMAN_REVIEW

routeRetryDecision("architect_retry", 1, 3)
→ RETRY_DEVELOPER

routeRetryDecision("architect_retry", 3, 3)
→ HUMAN_REVIEW

routeRetryDecision("unknown", 0, 3)
→ HUMAN_REVIEW with UNKNOWN_RETRY_KIND

Do not modify any tests.

FINAL RESPONSE:

Return exactly:

B13-G4-1 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

IMPLEMENTED:
<what was implemented>

PURITY:
<confirm no I/O or dispatch>

BOUNDARY:
<confirm retry-limit behavior>

UNKNOWN_KIND:
<confirm safe HUMAN_REVIEW behavior>

VALIDATION:
<commands and results>

G1_G2_G3_PRESERVED:
<confirm all three previous helpers remain>

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
  console.log("B13-G4-1: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G4-1: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G4-1 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G4-1: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G4_1_RESPONSE_OK");
  console.log("TEST_007_B13_G4_1_OK");
} catch (error) {
  console.error("B13-G4-1: ERROR");
  console.error(error);
  process.exitCode = 1;
}