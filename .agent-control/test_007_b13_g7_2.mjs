import assert from "node:assert/strict";
import {
  AgentExecutionBridge,
} from "./queue_watcher.mjs";

console.log("B13-G7-2: START");
console.log("B13-G7-2: ISOLATED AGENT EXECUTION BRIDGE TEST");

const task = {
  id: "TEST-007",
  type: "DEVELOPER",
};

const context = {
  role: "developer",
  taskId: "TEST-007",
  task: "Execute controlled Developer retry",
  model: "opencode/deepseek-v4-flash-free",
};

try {
  // ============================================================
  // TEST 1 — bridge can be instantiated with isolated config
  // ============================================================

  const bridge =
    new AgentExecutionBridge({
      defaultStrategy: "signal",
      strategies: {
        signal: {
          signalPath: "__B13_G7_2_UNUSED_SIGNAL__.json",
        },
      },
    });

  assert.ok(bridge);

  console.log(
    "TEST 1 PASS — AgentExecutionBridge instantiated"
  );

  // ============================================================
  // TEST 2 — custom callback can be registered
  // ============================================================

  let callbackCalled = false;
  let callbackTask = null;
  let callbackContext = null;

  bridge.setCallback(
    async (receivedTask, receivedContext) => {
      callbackCalled = true;
      callbackTask = receivedTask;
      callbackContext = receivedContext;

      return {
        status: "DEVELOPER_REQUEST_ACCEPTED",
        taskId: receivedTask.id,
      };
    }
  );

  console.log(
    "TEST 2 PASS — isolated callback registered"
  );

  // ============================================================
  // TEST 3 — dispatch uses callback strategy
  // ============================================================

  const result =
    await bridge.dispatch(
      task,
      context
    );

  assert.equal(
    callbackCalled,
    true
  );

  assert.equal(
    result.dispatched,
    true
  );

  assert.equal(
    result.strategy,
    "callback"
  );

  assert.equal(
    result.taskId,
    "TEST-007"
  );

  console.log(
    "TEST 3 PASS — dispatch reached isolated callback"
  );

  // ============================================================
  // TEST 4 — task preserved
  // ============================================================

  assert.deepEqual(
    callbackTask,
    task
  );

  console.log(
    "TEST 4 PASS — task preserved"
  );

  // ============================================================
  // TEST 5 — context preserved
  // ============================================================

  assert.deepEqual(
    callbackContext,
    context
  );

  console.log(
    "TEST 5 PASS — Developer context preserved"
  );

  // ============================================================
  // TEST 6 — callback result preserved
  // ============================================================

  assert.deepEqual(
    result.result,
    {
      status: "DEVELOPER_REQUEST_ACCEPTED",
      taskId: "TEST-007",
    }
  );

  console.log(
    "TEST 6 PASS — callback result preserved"
  );

  // ============================================================
  // TEST 7 — no ACP/OpenCode execution
  // ============================================================

  assert.equal(
    result.strategy,
    "callback"
  );

  console.log(
    "TEST 7 PASS — no ACP/OpenCode strategy used"
  );

  // ============================================================
  // TEST 8 — callback receives exact Developer model
  // ============================================================

  assert.equal(
    callbackContext.model,
    "opencode/deepseek-v4-flash-free"
  );

  console.log(
    "TEST 8 PASS — Developer model preserved"
  );

  // ============================================================
  // TEST 9 — callback receives exact role
  // ============================================================

  assert.equal(
    callbackContext.role,
    "developer"
  );

  console.log(
    "TEST 9 PASS — Developer role preserved"
  );

  // ============================================================
  // TEST 10 — deterministic second dispatch
  // ============================================================

  callbackCalled = false;

  const secondResult =
    await bridge.dispatch(
      task,
      context
    );

  assert.equal(
    callbackCalled,
    true
  );

  assert.deepEqual(
    secondResult,
    result
  );

  console.log(
    "TEST 10 PASS — repeated dispatch is deterministic"
  );

  // ============================================================
  // RESULT
  // ============================================================

  console.log("");
  console.log("B13-G7-2 RESULT");
  console.log("STATUS: PASS");
  console.log("BRIDGE_INSTANTIATION: PASS");
  console.log("CALLBACK_BOUNDARY: PASS");
  console.log("DISPATCH_CONTRACT: PASS");
  console.log("TASK_PRESERVATION: PASS");
  console.log("CONTEXT_PRESERVATION: PASS");
  console.log("RESULT_PRESERVATION: PASS");
  console.log("NO_REAL_ACP: PASS");
  console.log("MODEL_PRESERVATION: PASS");
  console.log("ROLE_PRESERVATION: PASS");
  console.log("DETERMINISM: PASS");
  console.log("ISOLATION: PASS");

  console.log("");
  console.log("B13_G7_2_RESPONSE_OK");
  console.log("TEST_007_B13_G7_2_OK");

} catch (error) {
  console.error("");
  console.error("B13-G7-2: ERROR");
  console.error(error);
  process.exitCode = 1;
}