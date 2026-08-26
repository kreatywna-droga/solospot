import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G4-2: START");
console.log("B13-G4-2: IMPLEMENT RETRY LIMIT CONFIG READER ONLY");

const task = `
WEB FACTOR — B13-G4-2

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Implement ONLY a pure/safe configuration reader for the retry limit.

TARGET FILE:
.agent-control/queue_watcher.mjs

PREVIOUS VERIFIED COMPONENTS:

B13-G1:
classifyResult()

B13-G2:
writeState()

B13-G3:
markQueueStatus()

B13-G3A:
markQueueStatus isolated test PASS

B13-G4-1:
routeRetryDecision()

B13-G4-1A:
routeRetryDecision isolated test PASS

DO NOT BREAK OR REPLACE ANY OF THESE.

STRICT SCOPE:
Modify ONLY:
.agent-control/queue_watcher.mjs

DO NOT MODIFY:
- .agent-control/opencode-adapter.mjs
- any test file
- PlatformOrchestrator
- any package outside queue_watcher.mjs

DO NOT IMPLEMENT:
- evaluateAndResume integration
- DISPATCH.json consumption
- AgentExecutionBridge changes
- lifecycle routing
- retry dispatch
- HUMAN_REVIEW transitions
- QUEUE.md mutation
- STATE.md mutation
- lock changes
- new orchestration layer

ONLY IMPLEMENT:

A helper:

getRetryLimit(configPath, defaultLimit = 3)

PURPOSE:
Read the retry limit from runner_config.json safely.

EXPECTED CONFIG:
The configuration may contain:

{
  "retryLimit": 3
}

The property name must be:

retryLimit

REQUIRED BEHAVIOR:

1. If configPath exists and contains valid JSON with a valid
positive integer retryLimit:

return that integer.

Example:
retryLimit = 5
→ 5

2. If retryLimit is missing:

return defaultLimit.

3. If retryLimit is zero:

return defaultLimit.

4. If retryLimit is negative:

return defaultLimit.

5. If retryLimit is fractional:

return defaultLimit.

6. If retryLimit is a string such as "5":

DO NOT silently coerce it.
Treat it as invalid and return defaultLimit.

7. If JSON is malformed:

return defaultLimit.

8. If configPath does not exist:

return defaultLimit.

9. If defaultLimit itself is invalid:

Use a safe internal fallback of 3.

10. The helper must not throw for ordinary configuration errors.

11. The helper must not modify runner_config.json.

12. The helper must not modify STATE.md.

13. The helper must not modify QUEUE.md.

14. The helper must not dispatch any agent.

15. The helper must be deterministic.

16. The helper may use filesystem READ operations because this
helper's explicit purpose is reading configuration.

IMPORTANT:
Do NOT integrate getRetryLimit() into evaluateAndResume() yet.

Do NOT change routeRetryDecision().

Do NOT change classifyResult().

Do NOT change writeState().

Do NOT change markQueueStatus().

PLACEMENT:
Place getRetryLimit() near the existing retry helper functions,
preferably before routeRetryDecision().

EXPORT:
Export the function so the isolated test can import it.

VALIDATION:
Run:

node --check .agent-control/queue_watcher.mjs

The developer should also verify that the existing helpers remain
present.

FINAL RESPONSE:

Return exactly:

B13-G4-2 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

IMPLEMENTED:
<what was implemented>

DEFAULT:
<default behavior>

INVALID_CONFIG:
<invalid configuration behavior>

VALID_CONFIG:
<valid configuration behavior>

SIDE_EFFECTS:
<confirm no config/state/queue writes and no dispatch>

EXISTING_HELPERS:
<confirm G1/G2/G3/G4-1 remain intact>

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
  console.log("B13-G4-2: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G4-2: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G4-2 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G4-2: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G4_2_RESPONSE_OK");
  console.log("TEST_007_B13_G4_2_OK");

} catch (error) {
  console.error("B13-G4-2: ERROR");
  console.error(error);
  process.exitCode = 1;
}