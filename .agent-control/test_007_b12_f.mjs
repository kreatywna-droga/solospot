import { runAgent } from "./opencode-adapter.mjs";

console.log("B12-F: START");
console.log("B12-F: READ-ONLY OWNER DISCOVERY");

const task = `
WEB FACTOR READ-ONLY OWNER DISCOVERY

TASK_ID: TEST-007

PURPOSE:

Architect escalated TEST-007 to HUMAN_REVIEW because no lifecycle owner
could be established.

Do a READ-ONLY repository investigation.

Find whether an EXISTING component already owns or implements any part of:

- agent execution lifecycle
- Developer execution
- Auditor execution
- Architect escalation
- Developer -> Auditor handoff
- retry handling
- state transitions
- QUEUE/STATE updates
- DISPATCH consumption
- execution bridge integration

Known facts:

1. queue_watcher.mjs performs:
   QUEUE discovery
   dependency checking
   lock acquisition
   WAITING -> IN_PROGRESS
   AgentExecutionBridge dispatch

2. AgentExecutionBridge exists in:
   .agent-control/opencode-adapter.mjs
   and .agent-control/queue_watcher.mjs

3. DISPATCH.json has no known production consumer.

4. PlatformOrchestrator.ts currently contains audit/aggregation methods,
   but no known lifecycle-closure method.

IMPORTANT:

READ-ONLY ONLY.
Do not modify files.
Do not create files.
Do not propose a new architecture.
Do not assume a component is an owner merely because its name suggests it.

Only report repository evidence.

Return exactly:

OWNER DISCOVERY RESULT
STATUS: FOUND / NOT_FOUND / AMBIGUOUS

CANDIDATES:
- <component>: <evidence>
- <component>: <evidence>

BEST_SUPPORTED_OWNER:
<component or NONE>

EVIDENCE:
<short summary>

MISSING_CAPABILITY:
<short summary>

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
  console.log("B12-F: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B12-F: NO_AUDITOR_RESPONSE");
  }

  if (!/OWNER DISCOVERY RESULT/i.test(result.response)) {
    throw new Error("B12-F: INVALID_DISCOVERY_RESULT");
  }

  console.log("");
  console.log("B12_F_RESPONSE_OK");
  console.log("TEST_007_B12_F_OK");
} catch (error) {
  console.error("B12-F: ERROR");
  console.error(error);
  process.exitCode = 1;
}