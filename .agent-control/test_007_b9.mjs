import { AgentExecutionBridge } from "./queue_watcher.mjs";
import { runAgent } from "./opencode-adapter.mjs";

console.log("B9: START");

const task = {
  id: "TEST-007",
  type: "RUNTIME_HOST_DISCOVERY_TEST",
  status: "READY",
  nextStage: "DEVELOPER",
};

const context = {
  role: "developer",
  target: "packages/runtime-core/src/RuntimeEngine.ts",
  mode: "READ_ONLY",
};

const bridge = new AgentExecutionBridge({
  defaultStrategy: "signal",
  strategies: {
    signal: {
      enabled: true,
      signalPath: ".agent-control/DISPATCH.json",
    },
    command: {
      enabled: false,
    },
  },
});

bridge.setCallback(async (task, context) => {
  console.log("B9: CALLBACK START");
  console.log("B9: TASK =", task.id);
  console.log("B9: ROLE =", context.role);

  const prompt = `
You are the Developer agent for WEB FACTOR.

TASK_ID: ${task.id}
TASK_TYPE: ${task.type}
ROLE: ${context.role}
MODE: ${context.mode}

OBJECTIVE:
Perform a READ-ONLY repository inspection for this task.

TARGET:
${context.target}

Do not modify any files.

Inspect the repository and return a concise structured TASK RESULT containing:

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

Important:
- This is READ-ONLY.
- Do not create or modify files.
- Actually inspect the repository.
- Report the real result.
`;

  const result = await runAgent({
    role: context.role,
    task: prompt,
    cwd: process.cwd(),
  });

  console.log("B9: AGENT RESPONSE RECEIVED");

  return result;
});

const result = await bridge.dispatch(task, context);

console.log("");
console.log("B9: BRIDGE RESULT");
console.log(JSON.stringify(result, null, 2));

if (!result.dispatched) {
  throw new Error("B9: DISPATCH_FAILED");
}

if (result.strategy !== "callback") {
  throw new Error(
    `B9: WRONG_STRATEGY: ${result.strategy}`
  );
}

if (!result.result) {
  throw new Error("B9: NO_AGENT_RESULT");
}

if (!result.result.sessionId) {
  throw new Error("B9: NO_SESSION_ID");
}

if (!result.result.response) {
  throw new Error("B9: NO_AGENT_RESPONSE");
}

if (
  !result.result.response.includes("TASK RESULT")
) {
  throw new Error(
    "B9: RESPONSE_IS_NOT_STRUCTURED_TASK_RESULT"
  );
}

console.log("");
console.log("B9_BRIDGE_OK");
console.log("B9_OPENCODE_OK");
console.log("B9_MODEL_OK");
console.log("B9_AGENT_RESPONSE_OK");
console.log("B9_TASK_RESULT_OK");
console.log("TEST_007_B9_OK");