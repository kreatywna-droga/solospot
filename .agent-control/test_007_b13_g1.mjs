import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G1: START");
console.log("B13-G1: IMPLEMENT CLASSIFY RESULT ONLY");

const task = `
WEB FACTOR — B13-G1

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Implement ONLY the minimal result-classification helper required
for the B13 lifecycle contract.

TARGET FILE:
.agent-control/queue_watcher.mjs

STRICT SCOPE:
Modify ONLY queue_watcher.mjs.

DO NOT MODIFY:
- .agent-control/opencode-adapter.mjs
- .agent-control/runner_config.json
- PlatformOrchestrator
- any package outside .agent-control/queue_watcher.mjs
- any test file

DO NOT IMPLEMENT YET:
- retry logic
- state transitions
- queue transitions
- DISPATCH.json consumption
- lifecycle routing
- Architect dispatch
- HUMAN_REVIEW routing
- lock changes
- new execution runner
- new orchestration layer

ONLY IMPLEMENT:
A small helper:

classifyResult(role, resultText)

Its sole responsibility is to inspect an already-returned agent
response and classify it into a small, safe structured object.

It must recognize at minimum:

Developer:
TASK RESULT

Auditor:
AUDITOR RESULT
STATUS: PASS
STATUS: HOLD

Architect:
ARCHITECT RESULT
STATUS / DECISION

The classifier must be tolerant of surrounding prose.

Recommended result shape:

{
  role: "developer" | "auditor" | "architect",
  kind: "developer_complete"
      | "auditor_pass"
      | "auditor_hold"
      | "architect_result"
      | "unknown",
  requiresArchitectReview: boolean,
  raw: resultText
}

Do not invent information that is not present in resultText.

For Auditor HOLD, detect architectural escalation when the response
contains a clear architectural-review signal such as:

REQUIRES_ARCHITECT_REVIEW
ARCHITECT_REVIEW
ARCHITECTURAL_CHANGE_REQUIRED

For Architect responses, preserve the relevant decision/status
information without performing routing.

UNKNOWN / INVALID:
If the response cannot safely be classified, return:

kind: "unknown"

Do NOT mark anything complete.
Do NOT throw merely because the result is unknown.

IMPORTANT:
If queue_watcher.mjs already contains a suitable classification
helper, do not duplicate it. Reuse or minimally extend it.

Do not rewrite the file.

Do not change existing exported functions unless absolutely
necessary.

VALIDATION:
After editing:

1. Run syntax validation:
   node --check .agent-control/queue_watcher.mjs

2. Inspect the diff:
   git diff -- .agent-control/queue_watcher.mjs

3. Confirm no other files were modified.

4. Do not modify tests.

FINAL RESPONSE:

Return exactly:

B13-G1 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

IMPLEMENTED:
<what was implemented>

CLASSIFICATION:
<supported result kinds>

VALIDATION:
<commands and results>

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
    console.log("B13-G1: RESULT");
    console.log(JSON.stringify(result, null, 2));

    if (!result?.response) {
        throw new Error("B13-G1: NO_DEVELOPER_RESPONSE");
    }

    if (!/B13-G1 IMPLEMENTATION RESULT/i.test(result.response)) {
        throw new Error("B13-G1: INVALID_IMPLEMENTATION_RESULT");
    }

    console.log("");
    console.log("B13_G1_RESPONSE_OK");
    console.log("TEST_007_B13_G1_OK");
} catch (error) {
    console.error("B13-G1: ERROR");
    console.error(error);
    process.exitCode = 1;
}