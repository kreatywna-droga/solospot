import { runAgent } from "./opencode-adapter.mjs";

console.log("B10: START");

const developerResult = `
TASK RESULT

OBJECTIVE:
Perform a READ_ONLY inspection of TEST-007.

IMPLEMENTATION:
The target repository file was inspected without modification.

FILES_CHANGED:
None.

DECISIONS:
The inspected RuntimeEngine surface is contract-only.

VALIDATION:
Repository inspection completed successfully.
No files were created or modified.

ACCEPTANCE_CRITERIA:
- Target inspected
- READ_ONLY respected
- No modifications made

RISKS:
Concrete runtime implementation may exist elsewhere.

BLOCKERS:
The target file itself contains no concrete runtime implementation.

ARCHITECTURE_IMPACT:
None.

NEXT_ACTION:
Locate the concrete RuntimeEngine implementation.

HANDOFF:
Developer inspection complete.
`;

const auditorPrompt = `
You are the Auditor agent for WEB FACTOR.

Your job is to independently audit the Developer TASK RESULT below.

Do NOT modify files.

Determine whether the Developer result satisfies the stated acceptance criteria.

Return exactly this structure:

AUDITOR RESULT
STATUS: PASS or HOLD
TASK_ID: TEST-007
FINDINGS:
ACCEPTANCE_CRITERIA:
RISKS:
BLOCKERS:
NEXT_ACTION:
HANDOFF:

Developer TASK RESULT:
${developerResult}
`;

console.log("B10: SENDING DEVELOPER RESULT TO AUDITOR");

const result = await runAgent({
  role: "auditor",
  task: auditorPrompt,
  cwd: process.cwd(),
});

console.log("");
console.log("B10: AUDITOR RESULT");
console.log(JSON.stringify(result, null, 2));

if (result.model !== "opencode/nemotron-3-ultra-free") {
  throw new Error(
    `B10: WRONG_AUDITOR_MODEL: ${result.model}`
  );
}

if (!result.sessionId) {
  throw new Error("B10: NO_SESSION_ID");
}

if (!result.response) {
  throw new Error("B10: NO_AUDITOR_RESPONSE");
}

if (!result.response.includes("AUDITOR RESULT")) {
  throw new Error("B10: INVALID_AUDITOR_RESULT");
}

if (!/STATUS:\s*(PASS|HOLD)/i.test(result.response)) {
  throw new Error("B10: NO_AUDITOR_STATUS");
}

console.log("");
console.log("B10_AUDITOR_MODEL_OK");
console.log("B10_AUDITOR_RESPONSE_OK");
console.log("B10_STATUS_OK");
console.log("TEST_007_B10_OK");