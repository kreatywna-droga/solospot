import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-C: START");
console.log("B13-C: ARCHITECT REVISION");

const task = `
WEB FACTOR B13-C

TASK_ID: TEST-007

AUDITOR HOLD:

1. ARCHITECT_REVIEW has no defined incoming transition.
2. EXECUTION_FAILURE has no defined trigger condition.

Keep lifecycle ownership in queue_watcher / Control Plane.

Define ONLY these two corrections.

Return exactly:

B13 REVISION
ARCHITECT_REVIEW_ENTRY: <one sentence>
EXECUTION_FAILURE_TRIGGER: <one sentence>
FAILURE_ROUTE: <one sentence>
NEXT_ACTION: <one sentence>

Do not modify files.
Do not redesign the architecture.
`;

try {
  const result = await runAgent({
    role: "architect",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B13-C: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-C: NO_ARCHITECT_RESPONSE");
  }

  if (!/B13 REVISION/i.test(result.response)) {
    throw new Error("B13-C: INVALID_REVISION");
  }

  console.log("B13_C_RESPONSE_OK");
  console.log("TEST_007_B13_C_OK");
} catch (error) {
  console.error("B13-C: ERROR");
  console.error(error);
  process.exitCode = 1;
}