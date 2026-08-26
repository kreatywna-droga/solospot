import { runAgent } from "./opencode-adapter.mjs";

console.log("B11-B: START");

const developerResult = `
TASK RESULT

OBJECTIVE:
Perform READ_ONLY inspection for TEST-007.

IMPLEMENTATION:
The target was inspected.

FILES_CHANGED:
Created discovery.md

VALIDATION:
Inspection completed.

ACCEPTANCE_CRITERIA:
Target inspected.

NEXT_ACTION:
Complete task.
`;

const prompt = `
Audit this Developer result for TEST-007.

Return:

AUDITOR RESULT
STATUS: PASS or HOLD
TASK_ID: TEST-007
FINDINGS:
NEXT_ACTION:
HANDOFF:

Developer result:

${developerResult}
`;

console.log("B11-B: DEVELOPER_RESULT_CHARS =", developerResult.length);
console.log("B11-B: PROMPT_CHARS =", prompt.length);

const result = await runAgent({
  role: "auditor",
  task: prompt,
  cwd: process.cwd(),
});

console.log("");
console.log("B11-B: RESULT");
console.log(JSON.stringify(result, null, 2));

if (result.model !== "opencode/nemotron-3-ultra-free") {
  throw new Error(`B11-B: WRONG_MODEL: ${result.model}`);
}

if (!result.response) {
  throw new Error("B11-B: NO_RESPONSE");
}

if (!/AUDITOR RESULT/i.test(result.response)) {
  throw new Error("B11-B: INVALID_RESULT");
}

if (!/STATUS:\s*HOLD/i.test(result.response)) {
  throw new Error("B11-B: EXPECTED_HOLD");
}

console.log("");
console.log("B11_B_AUDITOR_OK");
console.log("B11_B_DEVELOPER_RESULT_TRANSFER_OK");
console.log("B11_B_HOLD_OK");
console.log("TEST_007_B11_B_OK");