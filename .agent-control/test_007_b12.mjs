import { runAgent } from "./opencode-adapter.mjs";

console.log("B12: START");
console.log("B12: ARCHITECT REVIEW");

const task = `
WEB FACTOR ARCHITECT REVIEW

TASK_ID: TEST-007

CONTEXT:

The Agent Control system has been audited.

Confirmed working:

1. B6 — role-to-model routing:
   developer -> opencode/deepseek-v4-flash-free
   auditor -> opencode/nemotron-3-ultra-free
   planner -> opencode/mimo-v2.5-free

2. B7 — Developer task execution through the adapter.

3. B8/B9 — repository task dispatch and OpenCode ACP execution.

4. B10 — Developer result can be independently sent to Auditor.

5. B11 — full manual lifecycle:
   Developer -> Auditor HOLD -> Developer RETRY -> Auditor PASS.

6. queue_watcher.mjs and queue_watcher.ps1 correctly implement:
   QUEUE -> READY task discovery -> dependency check -> lock -> STATE WAITING -> IN_PROGRESS -> AgentExecutionBridge.

7. AgentExecutionBridge currently supports callback, command and signal strategies.

8. runner_config.json currently uses:
   defaultStrategy = signal

9. The signal payload contains:
   event = DISPATCH_ORCHESTRATOR
   taskId
   taskType
   state = IN_PROGRESS
   action = Start <task> with Developer
   runtimeIntegrationStatus =
     EVENT_DISPATCHED_AWAITING_RUNNER_INTEGRATION

10. A repository-wide search found no production consumer of:
    DISPATCH.json
    DISPATCH_ORCHESTRATOR
    EVENT_DISPATCHED_AWAITING_RUNNER_INTEGRATION

11. Therefore the current implemented runtime path appears to stop at:
    QUEUE -> queue_watcher -> AgentExecutionBridge -> DISPATCH.json

12. The Orchestrator documentation requires a controlled lifecycle:
    Developer -> Auditor -> PASS/HOLD
    HOLD -> Developer retry
    architectural escalation -> Architect
    successful audit -> COMPLETE
    and persistent project state updates.

ARCHITECTURAL QUESTION:

Should WEB FACTOR introduce a separate Agent Execution Runner responsible for consuming the dispatch event and executing the complete agent lifecycle?

If YES, define:

A. Runner responsibility boundary.
B. Exact input contract from queue_watcher / DISPATCH.
C. Exact output/result contract.
D. Location/module boundary in the repository.
E. Integration with opencode-adapter.mjs.
F. Developer -> Auditor -> Architect routing.
G. HOLD/retry behavior.
H. retry limit and HUMAN_REVIEW behavior.
I. STATE.md update ownership.
J. QUEUE.md update ownership.
K. Lock ownership and release semantics.
L. Failure/timeout handling.
M. Whether queue_watcher remains dispatcher-only.
N. Security requirements.
O. Required tests before implementation.

If NO, explain where the missing lifecycle is supposed to be implemented and identify the existing component responsible for consuming DISPATCH.json.

IMPORTANT:

This is ARCHITECTURE REVIEW ONLY.

Do NOT modify files.
Do NOT implement a Runner.
Do NOT invent an implementation without identifying the architectural responsibility.
Return a structured ARCHITECT RESULT.

Required format:

ARCHITECT RESULT
STATUS: APPROVE / RETURN_TO_DEVELOPER / ARCHITECTURAL_CHANGE_REQUIRED / HUMAN_REVIEW
TASK_ID: TEST-007

ARCHITECTURE_DECISION:
...

RESPONSIBILITY_BOUNDARY:
...

INPUT_CONTRACT:
...

OUTPUT_CONTRACT:
...

STATE_OWNERSHIP:
...

ROUTING:
...

RETRY_POLICY:
...

FAILURE_POLICY:
...

SECURITY:
...

TEST_REQUIREMENTS:
...

FILES_EXPECTED_TO_CHANGE:
...

RISKS:
...

BLOCKERS:
...

NEXT_ACTION:
...

HANDOFF:
...
`;

try {
  const result = await runAgent({
    role: "architect",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B12: ARCHITECT RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (result?.role !== "architect") {
    throw new Error(
      `B12: WRONG_ROLE: ${result?.role}`
    );
  }

  if (result?.model !== "opencode/mimo-v2.5-free") {
    throw new Error(
      `B12: WRONG_MODEL: ${result?.model}`
    );
  }

  if (!result?.response) {
    throw new Error("B12: NO_ARCHITECT_RESPONSE");
  }

  if (!/ARCHITECT RESULT/i.test(result.response)) {
    throw new Error(
      "B12: INVALID_ARCHITECT_RESULT"
    );
  }

  console.log("");
  console.log("B12_ARCHITECT_MODEL_OK");
  console.log("B12_ARCHITECT_RESPONSE_OK");
  console.log("TEST_007_B12_OK");
} catch (error) {
  console.error("");
  console.error("B12: ERROR");
  console.error(error);
  process.exitCode = 1;
}