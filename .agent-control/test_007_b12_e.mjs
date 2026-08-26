import { runAgent } from "./opencode-adapter.mjs";

console.log("B12-E: START");
console.log("B12-E: ARCHITECT REVISION");

const task = `
WEB FACTOR ARCHITECT REVISION

TASK_ID: TEST-007

Auditor HOLD:

PlatformOrchestrator was proposed as lifecycle owner,
but it currently has no lifecycle-closure method and
DISPATCH.json has no production consumer.

Question:

What is the correct architectural decision now?

Choose exactly ONE:

A = use another EXISTING component as lifecycle owner
B = extend PlatformOrchestrator with lifecycle closure
C = HUMAN_REVIEW because ownership cannot be determined

Return exactly:

ARCHITECT REVISION
CHOICE: A / B / C
OWNER: <name or NONE>
REASON: <one sentence>
NEXT_ACTION: <one sentence>

Do not inspect files.
Do not modify files.
`;

try {
  const result = await runAgent({
    role: "architect",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B12-E: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("NO_ARCHITECT_RESPONSE");
  }

  if (!/ARCHITECT REVISION/i.test(result.response)) {
    throw new Error("INVALID_ARCHITECT_RESPONSE");
  }

  console.log("");
  console.log("B12_E_RESPONSE_OK");
  console.log("TEST_007_B12_E_OK");
} catch (error) {
  console.error("B12-E: ERROR");
  console.error(error);
  process.exitCode = 1;
}