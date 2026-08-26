import { runAgent } from "./opencode-adapter.mjs";

console.log("B11: START");

const taskId = "TEST-007";

// --------------------------------------------------
// 1. FIRST AUDIT — must return HOLD
// --------------------------------------------------

console.log("B11: AUDIT ATTEMPT 1");

const firstAudit = await runAgent({
  role: "auditor",
  task: `
You are the WEB FACTOR Auditor.

Task: ${taskId}

Audit this Developer result.

The Developer incorrectly claims that a file was created.
The task is READ_ONLY, therefore this is a defect.

Developer result:

TASK RESULT
OBJECTIVE:
Inspect TEST-007.

FILES_CHANGED:
Created discovery.md

VALIDATION:
Inspection completed.

Return exactly:

AUDITOR RESULT
STATUS: HOLD
TASK_ID: TEST-007
FINDINGS:
The Developer violated READ_ONLY requirements.
NEXT_ACTION:
Retry Developer.
HANDOFF:
Return task to Developer.
`,
  cwd: process.cwd(),
});

console.log("");
console.log("B11: FIRST AUDITOR RESULT");
console.log(JSON.stringify(firstAudit, null, 2));

if (firstAudit.model !== "opencode/nemotron-3-ultra-free") {
  throw new Error(
    `B11: WRONG_AUDITOR_MODEL_1: ${firstAudit.model}`
  );
}

if (!firstAudit.response) {
  throw new Error("B11: NO_FIRST_AUDIT_RESPONSE");
}

if (!/STATUS:\s*HOLD/i.test(firstAudit.response)) {
  throw new Error("B11: EXPECTED_HOLD");
}

console.log("B11_HOLD_OK");

// --------------------------------------------------
// 2. RETRY — Developer receives HOLD and corrects it
// --------------------------------------------------

console.log("");
console.log("B11: DEVELOPER RETRY");

const retryDeveloper = await runAgent({
  role: "developer",
  task: `
You are the WEB FACTOR Developer.

Task: ${taskId}

This is a RETRY after Auditor returned HOLD.

Correct the previous defect.

Requirements:
- READ_ONLY
- Do not modify files
- Do not create files
- FILES_CHANGED must be None
- Return a structured TASK RESULT

Return:

TASK RESULT
OBJECTIVE:
IMPLEMENTATION:
FILES_CHANGED:
DECISIONS:
VALIDATION:
ACCEPTANCE_CRITERIA:
RISKS:
BLOCKERS:
ARCHITECTURE_IMPACT:
NEXT_ACTION:
HANDOFF:

Do not perform unnecessary repository exploration.
`,
  cwd: process.cwd(),
});

console.log("");
console.log("B11: RETRIED DEVELOPER RESULT");
console.log(JSON.stringify(retryDeveloper, null, 2));

if (retryDeveloper.model !== "opencode/deepseek-v4-flash-free") {
  throw new Error(
    `B11: WRONG_DEVELOPER_MODEL_RETRY: ${retryDeveloper.model}`
  );
}

if (!retryDeveloper.response) {
  throw new Error("B11: NO_RETRY_DEVELOPER_RESPONSE");
}

console.log("B11_RETRY_OK");

// --------------------------------------------------
// 3. SECOND AUDIT — must return PASS
// --------------------------------------------------

console.log("");
console.log("B11: AUDIT ATTEMPT 2");

const secondAudit = await runAgent({
  role: "auditor",
  task: `
You are the WEB FACTOR Auditor.

Task: ${taskId}

Independently audit the corrected Developer result below.

Acceptance criteria:
- READ_ONLY respected
- No files created
- No files modified
- Structured TASK RESULT present
- No blocker preventing completion

Developer retry result:

${retryDeveloper.response}

Return exactly:

AUDITOR RESULT
STATUS: PASS or HOLD
TASK_ID: TEST-007
FINDINGS:
ACCEPTANCE_CRITERIA:
BLOCKERS:
NEXT_ACTION:
HANDOFF:

Do not perform unnecessary repository exploration.
`,
  cwd: process.cwd(),
});

console.log("");
console.log("B11: SECOND AUDITOR RESULT");
console.log(JSON.stringify(secondAudit, null, 2));

if (secondAudit.model !== "opencode/nemotron-3-ultra-free") {
  throw new Error(
    `B11: WRONG_AUDITOR_MODEL_2: ${secondAudit.model}`
  );
}

if (!secondAudit.response) {
  throw new Error("B11: NO_SECOND_AUDIT_RESPONSE");
}

if (!/STATUS:\s*PASS/i.test(secondAudit.response)) {
  throw new Error(
    "B11: EXPECTED_PASS_AFTER_RETRY"
  );
}

console.log("");
console.log("B11_HOLD_OK");
console.log("B11_RETRY_OK");
console.log("B11_DEVELOPER_RETRY_OK");
console.log("B11_AUDITOR_PASS_OK");
console.log("TEST_007_B11_OK");