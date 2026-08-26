import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-F: START");
console.log("B13-F: AUDITOR REVIEW OF IMPLEMENTATION PLAN");

const task = `
WEB FACTOR — B13-F

TASK_ID: TEST-007

ROLE: AUDITOR
MODE: READ_ONLY

Audit the B13-E implementation plan against the already-ratified
B13 lifecycle contract.

IMPORTANT:
Do not implement anything.
Do not modify files.

FOCUS ONLY ON THESE QUESTIONS:

1. Is queue_watcher.mjs the correct lifecycle owner?

2. Is it correct to add lifecycle routing to queue_watcher rather
than creating a new Agent Execution Runner or modifying
PlatformOrchestrator?

3. CRITICAL DISPATCH RESULT QUESTION:

The current AgentExecutionBridge signal strategy writes DISPATCH.json
with dispatch metadata such as:

event
taskId
taskType
timestamp
state
action
context
runtimeIntegrationStatus

The signal payload does NOT inherently contain the final Developer,
Auditor, or Architect response.

The current opencode-adapter returns the actual agent response through
runAgent(), and the callback strategy can return that result.

Determine whether the B13-E proposal to create:

consumeDispatchResult()

and read agent results from DISPATCH.json

is technically valid with the CURRENT architecture.

4. If DISPATCH.json does not contain the agent result, identify the
MINIMAL correction required.

Do NOT invent a new Runner.
Do NOT redesign the ACP architecture.

5. Verify the proposed lifecycle transitions:

Developer result
→ AWAITING_AUDIT

Auditor PASS
→ COMPLETE
→ WAITING

Auditor HOLD
→ Developer retry

Auditor architectural escalation
→ ARCHITECT_REVIEW
→ Architect

Architect retry
→ Developer

Architect HUMAN_REVIEW / architectural rejection
→ HUMAN_REVIEW

Execution failure
→ bounded retry
→ HUMAN_REVIEW

6. Verify that the lock remains released while agents are executing.

7. Verify that retry counting is bounded.

8. Verify that HUMAN_REVIEW is a parked state with no automatic
dispatch.

9. Determine the MINIMUM set of files that should actually change.

10. Explicitly reject unnecessary changes to:

- opencode-adapter.mjs
- PlatformOrchestrator
- new Agent Execution Runner
- unrelated packages

Return exactly:

B13-F AUDIT

STATUS: PASS or HOLD

FINDINGS:
1. <finding>
2. <finding>

DISPATCH_RESULT_VERDICT:
<one concise paragraph explaining whether DISPATCH.json can actually
carry the agent result in the current architecture>

REQUIRED_CHANGES:
<minimal corrections only>

FILES_ALLOWED_TO_MODIFY:
<exact files>

FILES_PROTECTED:
<exact files that must remain unchanged>

NEXT_ACTION:
<one sentence>

HANDOFF:
<one sentence>
`;

try {
  const result = await runAgent({
    role: "auditor",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B13-F: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-F: NO_AUDITOR_RESPONSE");
  }

  if (!/B13-F AUDIT/i.test(result.response)) {
    throw new Error("B13-F: INVALID_AUDIT_RESULT");
  }

  console.log("");
  console.log("B13_F_RESPONSE_OK");
  console.log("TEST_007_B13_F_OK");
} catch (error) {
  console.error("B13-F: ERROR");
  console.error(error);
  process.exitCode = 1;
}