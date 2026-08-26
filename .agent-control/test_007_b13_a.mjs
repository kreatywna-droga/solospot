import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-A: START");

const task = `
WEB FACTOR B13-A

TASK_ID: TEST-007

ARCHITECTURAL DECISION:
Lifecycle ownership = queue_watcher / Control Plane.

Define the MINIMAL lifecycle closure contract.

Required transitions:

1. Developer completes.
2. Auditor returns PASS.
3. Auditor returns HOLD.
4. Architect review is required.
5. Human review is required.
6. Execution fails or times out.

For each, define:
- resulting STATE
- resulting QUEUE status
- whether retry occurs
- when the claim lock is released

Rules:
- queue_watcher remains lifecycle owner
- do not use PlatformOrchestrator
- do not create a new Runner
- design only
- do not modify files

Return only:

B13 CONTRACT
DEVELOPER_COMPLETE: <state/status/action>
AUDITOR_PASS: <state/status/action>
AUDITOR_HOLD: <state/status/action>
ARCHITECT_REVIEW: <state/status/action>
HUMAN_REVIEW: <state/status/action>
EXECUTION_FAILURE: <state/status/action>
LOCK: <one sentence>
NEXT_ACTION: <one sentence>
`;

try {
  const result = await runAgent({
    role: "architect",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B13-A: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("NO_ARCHITECT_RESPONSE");
  }

  if (!/B13 CONTRACT/i.test(result.response)) {
    throw new Error("INVALID_B13_CONTRACT");
  }

  console.log("B13_A_RESPONSE_OK");
  console.log("TEST_007_B13_A_OK");
} catch (error) {
  console.error("B13-A: ERROR");
  console.error(error);
  process.exitCode = 1;
}