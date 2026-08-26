import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-D: START");

const task = `
B13-D — CONTRACT-ONLY AUDIT

Audit the following architectural corrections as a DESIGN CONTRACT.
Do not verify implementation. Do not inspect repository files.

CORRECTION 1:
ARCHITECT_REVIEW is entered when Auditor returns HOLD
with architectural escalation / REQUIRES_ARCHITECT_REVIEW.
queue_watcher remains lifecycle owner and dispatches Architect.

CORRECTION 2:
EXECUTION_FAILURE occurs when Developer execution throws
or returns failure during an active dispatch cycle.
queue_watcher retries within the bounded retry limit.
After the limit, route to HUMAN_REVIEW.

Question:
Are these two corrections internally coherent and sufficient
to remove the two findings from the previous audit?

Return exactly:

B13-D AUDIT
STATUS: PASS or HOLD
FINDING: <one sentence>
NEXT_ACTION: <one sentence>
`;

try {
  const result = await runAgent({
    role: "auditor",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B13-D: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("NO_AUDITOR_RESPONSE");
  }

  if (!/B13-D AUDIT/i.test(result.response)) {
    throw new Error("INVALID_B13_D_RESULT");
  }

  console.log("B13_D_RESPONSE_OK");
  console.log("TEST_007_B13_D_OK");
} catch (error) {
  console.error("B13-D: ERROR");
  console.error(error);
  process.exitCode = 1;
}