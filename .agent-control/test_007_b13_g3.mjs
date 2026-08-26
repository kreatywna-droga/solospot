import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G3: START");
console.log("B13-G3: IMPLEMENT QUEUE STATUS ONLY");

const task = `
WEB FACTOR — B13-G3

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Implement ONLY the minimal queue-state helper required by the
ratified B13 lifecycle contract.

TARGET FILE:
.agent-control/queue_watcher.mjs

CURRENT CONTEXT:
B13-G1 added:
classifyResult(role, resultText)

B13-G2 added:
writeState(statePath, nextState)

Do not remove, replace, or redesign either implementation.

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
- retry logic
- lifecycle routing
- state transitions
- DISPATCH.json consumption
- Architect dispatch
- HUMAN_REVIEW routing
- lock changes
- Agent Execution Runner
- new orchestration layer

ONLY IMPLEMENT:

markQueueStatus(queuePath, taskId, status, nextStage)

Purpose:
Update the STATUS and NEXT_STAGE fields of exactly one task in
QUEUE.md without changing unrelated tasks or unrelated queue content.

SUPPORTED STATUS VALUES:
- READY
- IN_PROGRESS
- COMPLETE
- HUMAN_REVIEW

SUPPORTED NEXT_STAGE VALUES MAY INCLUDE:
- DEVELOPER
- AUDITOR
- DEVELOPER_RETRY
- ARCHITECT_REVIEW
- HUMAN_REVIEW
- COMPLETE
- WAITING

Do not create an unnecessarily strict enum if the existing queue
format uses additional values. Preserve compatibility with the
existing queue.

REQUIRED BEHAVIOR:

1. Read the existing QUEUE.md.

2. Locate the task whose heading ID exactly matches taskId.

3. Change ONLY that task's:
   STATUS:
   NEXT_STAGE:

4. Preserve:
   - task heading
   - TYPE:
   - DEPENDENCIES:
   - descriptions
   - acceptance criteria
   - all other tasks
   - comments
   - ordering

5. If STATUS or NEXT_STAGE already exists, replace its value.

6. If one of the fields is missing inside the target task, add it
inside that task without changing unrelated tasks.

7. Do not accidentally update another task whose ID merely contains
the same string.

8. If taskId does not exist:
   - do not create a new task
   - do not modify QUEUE.md
   - return a safe failure value or throw a clear error.
   Prefer a clear Error because silently pretending success would
   corrupt lifecycle accounting.

9. Preserve UTF-8 encoding.

10. Prefer an atomic write:
    temporary file → rename into place.

11. Do not redesign parseQueue().

12. Do not change findNextExecutableTask().

13. Do not connect markQueueStatus() to evaluateAndResume() yet.

14. Do not change lifecycle behavior yet.

IMPORTANT:
This task creates the primitive only.
It must NOT call writeState().
It must NOT call classifyResult().
It must NOT dispatch an agent.

VALIDATION:

Run:

node --check .agent-control/queue_watcher.mjs

Then inspect the function and verify:

- only one task can be targeted
- missing task fails safely
- unrelated tasks remain unchanged
- atomic write behavior exists
- UTF-8 is preserved

Also verify:

- classifyResult() from B13-G1 remains present
- writeState() from B13-G2 remains present

Do not modify tests.

FINAL RESPONSE:

Return exactly:

B13-G3 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

IMPLEMENTED:
<what was implemented>

QUEUE_BEHAVIOR:
<how the target task is located and updated>

ATOMIC_WRITE:
<how atomicity is handled>

G1_G2_PRESERVED:
<confirm classifyResult and writeState remain intact>

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
  console.log("B13-G3: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G3: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G3 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G3: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G3_RESPONSE_OK");
  console.log("TEST_007_B13_G3_OK");
} catch (error) {
  console.error("B13-G3: ERROR");
  console.error(error);
  process.exitCode = 1;
}