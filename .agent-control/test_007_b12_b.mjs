import { runAgent } from "./opencode-adapter.mjs";

console.log("B12-B: START");
console.log("B12-B: ARCHITECT SHORT REVIEW");

const task = `
WEB FACTOR ARCHITECT SHORT REVIEW

TASK_ID: TEST-007

Facts established by repository inspection:

- queue_watcher emits a DISPATCH.json signal.
- AgentExecutionBridge supports signal dispatch.
- Repository-wide search found no production consumer of DISPATCH.json.
- Orchestrator documentation requires controlled Developer -> Auditor -> Architect lifecycle and persistent state updates.
- The current signal contains:
  event = DISPATCH_ORCHESTRATOR
  taskId
  taskType
  state = IN_PROGRESS
  action = Start <task> with Developer
  runtimeIntegrationStatus =
    EVENT_DISPATCHED_AWAITING_RUNNER_INTEGRATION

Question:

Does this evidence justify introducing a separate Agent Execution Runner between queue_watcher and the Developer/Auditor lifecycle?

Answer in exactly this format:

ARCHITECT RESULT
STATUS: APPROVE / ARCHITECTURAL_CHANGE_REQUIRED / HUMAN_REVIEW
DECISION: YES / NO
REASON: one short paragraph
NEXT_ACTION: one sentence

Do not inspect files.
Do not modify files.
Do not propose implementation details.
`;

try {
  const result = await runAgent({
    role: "architect",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B12-B: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B12-B: NO_ARCHITECT_RESPONSE");
  }

  if (!/ARCHITECT RESULT/i.test(result.response)) {
    throw new Error("B12-B: INVALID_ARCHITECT_RESULT");
  }

  console.log("");
  console.log("B12_B_RESPONSE_OK");
  console.log("TEST_007_B12_B_OK");
} catch (error) {
  console.error("");
  console.error("B12-B: ERROR");
  console.error(error);
  process.exitCode = 1;
}
