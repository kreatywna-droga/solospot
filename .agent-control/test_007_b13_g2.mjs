import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G2: START");
console.log("B13-G2: IMPLEMENT WRITE STATE ONLY");

const task = `
WEB FACTOR — B13-G2

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Implement ONLY the minimal state-writing helper required for the
B13 lifecycle contract.

TARGET FILE:
.agent-control/queue_watcher.mjs

CURRENT CONTEXT:
B13-G1 already added:
classifyResult(role, resultText)

Do not modify or replace that implementation.

STRICT SCOPE:
Modify ONLY:
.agent-control/queue_watcher.mjs

DO NOT MODIFY:
- .agent-control/opencode-adapter.mjs
- .agent-control/runner_config.json
- any test file
- PlatformOrchestrator
- any package outside queue_watcher.mjs

DO NOT IMPLEMENT:
- lifecycle routing
- retry logic
- queue status updates
- DISPATCH.json consumption
- Architect dispatch
- HUMAN_REVIEW routing
- lock changes
- Agent Execution Runner
- new orchestration layer

ONLY IMPLEMENT:
A small helper:

writeState(statePath, nextState)

Purpose:
Serialize a complete STATE.md snapshot from an explicit state
object and write it safely.

The helper should support the fields already used by the existing
Control Plane:

CURRENT_TASK
STATE
LAST_AGENT
RETRY_COUNT
DEVELOPER_STATUS
AUDITOR_STATUS
ARCHITECT_STATUS
LAST_HANDOFF
LAST_DECISION
BLOCKER
NEXT_ACTION
HUMAN_REVIEW_REQUIRED

Compatibility requirements:

1. Preserve the existing STATE.md format and field names.

2. Do not silently remove existing fields.

3. Missing optional values should receive safe defaults rather than
producing malformed STATE.md.

4. RETRY_COUNT must remain numeric.

5. HUMAN_REVIEW_REQUIRED must serialize as YES or NO.

6. NEXT_ACTION may contain multiple lines if required by the existing
format, but do not redesign the format.

7. The helper must not perform lifecycle decisions.
It only serializes and writes the state supplied to it.

8. Prefer an atomic write:
   write temporary file → rename into place.
Do not introduce an external dependency.

9. Preserve UTF-8 encoding.

10. If the existing queue_watcher already has a suitable state writer,
do not duplicate it. Reuse or minimally extend it.

11. Do not rewrite queue_watcher.mjs.

12. Do not alter classifyResult() from B13-G1.

VALIDATION:

Run:

node --check .agent-control/queue_watcher.mjs

Then inspect:

git status --short -- .agent-control/queue_watcher.mjs

Then verify no other project files were modified.

Because .agent-control may be untracked, do not rely solely on git diff
to prove the change. Inspect the resulting file directly if necessary.

Do not modify tests.

FINAL RESPONSE:

Return exactly:

B13-G2 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

IMPLEMENTED:
<what was implemented>

STATE_FIELDS:
<fields supported>

ATOMIC_WRITE:
<how atomicity is handled>

VALIDATION:
<commands and results>

G1_PRESERVED:
<confirm classifyResult remains intact>

DIFF_SUMMARY:
<short summary>

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
  console.log("B13-G2: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G2: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G2 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G2: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G2_RESPONSE_OK");
  console.log("TEST_007_B13_G2_OK");
} catch (error) {
  console.error("B13-G2: ERROR");
  console.error(error);
  process.exitCode = 1;
}