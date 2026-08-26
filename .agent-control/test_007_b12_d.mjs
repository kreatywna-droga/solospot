import { runAgent } from "./opencode-adapter.mjs";

console.log("B12-D: START");
console.log("B12-D: AUDITOR REVIEW");

const task = `
WEB FACTOR AUDITOR REVIEW

TASK_ID: TEST-007

ARCHITECT DECISION FROM B12-C:

ARCHITECT CONTRACT
OWNER: Orchestrator
REASON: It is the sole domain controller responsible for agent execution lifecycle and delegates the bridge's writes after DISPATCH.json.
NEXT_ACTION: Have queue_watcher invoke Orchestrator's lifecycle-closure method once DISPATCH.json is consumed.

REPOSITORY EVIDENCE:

1. queue_watcher currently:
   - reads QUEUE.md and STATE.md
   - finds READY tasks
   - checks dependencies
   - acquires a claim lock
   - transitions WAITING -> IN_PROGRESS
   - calls AgentExecutionBridge
   - emits DISPATCH.json when using signal strategy

2. AgentExecutionBridge currently supports callback, command and signal strategies.

3. Signal mode produces:
   event = DISPATCH_ORCHESTRATOR
   taskId
   taskType
   state = IN_PROGRESS
   action = Start <task> with Developer
   runtimeIntegrationStatus =
     EVENT_DISPATCHED_AWAITING_RUNNER_INTEGRATION

4. Repository-wide search found no production consumer of DISPATCH.json.

5. Existing PlatformOrchestrator.ts was inspected and currently exposes:
   normalizeSeverity
   deriveExecutiveStatus
   aggregateReports
   calculatePlatformScore
   correlateCrossModuleRisks
   deduplicateIssues

6. No lifecycle-closure method has yet been identified in PlatformOrchestrator.ts.

AUDIT QUESTION:

Is the Architect's B12-C decision sufficiently supported by the evidence to proceed to an implementation-design task?

Important:
- Do NOT modify files.
- Do NOT implement anything.
- Do NOT invent missing methods.
- Independently judge only the architectural ownership decision.

Return exactly:

AUDITOR RESULT
STATUS: PASS / HOLD / ARCHITECT_ESCALATION
FINDING: <one concise paragraph>
NEXT_ACTION: <one sentence>
HANDOFF: <one sentence>
`;

try {
  const result = await runAgent({
    role: "auditor",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B12-D: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B12-D: NO_AUDITOR_RESPONSE");
  }

  if (!/AUDITOR RESULT/i.test(result.response)) {
    throw new Error("B12-D: INVALID_AUDITOR_RESULT");
  }

  console.log("");
  console.log("B12_D_RESPONSE_OK");
  console.log("TEST_007_B12_D_OK");
} catch (error) {
  console.error("");
  console.error("B12-D: ERROR");
  console.error(error);
  process.exitCode = 1;
}