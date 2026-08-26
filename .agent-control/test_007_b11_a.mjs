import { runAgent } from "./opencode-adapter.mjs";

console.log("B11-A: START");

const result = await runAgent({
  role: "auditor",
  task: `
You are the WEB FACTOR Auditor.

Audit TEST-007.

The Developer result is intentionally incomplete.

Return exactly:

AUDITOR RESULT
STATUS: HOLD
TASK_ID: TEST-007
FINDINGS:
Developer result is incomplete.
NEXT_ACTION:
Retry Developer.
HANDOFF:
Return task to Developer.
`,
  cwd: process.cwd(),
});

console.log("");
console.log("B11-A: RESULT");
console.log(JSON.stringify(result, null, 2));

if (result.model !== "opencode/nemotron-3-ultra-free") {
  throw new Error(`WRONG_MODEL: ${result.model}`);
}

if (!result.response) {
  throw new Error("NO_RESPONSE");
}

if (!/AUDITOR RESULT/i.test(result.response)) {
  throw new Error("INVALID_AUDITOR_RESULT");
}

if (!/STATUS:\s*HOLD/i.test(result.response)) {
  throw new Error("AUDITOR_DID_NOT_RETURN_HOLD");
}

console.log("");
console.log("B11_A_SHORT_AUDIT_OK");
console.log("TEST_007_B11_A_OK");