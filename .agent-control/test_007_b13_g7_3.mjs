import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  AgentExecutionBridge,
} from "./queue_watcher.mjs";

console.log("B13-G7-3: START");
console.log("B13-G7-3: ISOLATED COMMAND STRATEGY TEST");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g7-3-")
);

const signalPath = path.join(
  tempDir,
  "UNUSED_SIGNAL.json"
);

const successCommand =
  'node -e "process.stdout.write(\'B13_G7_3_SUCCESS\')"';

const failureCommand =
  'node -e "process.stderr.write(\'B13_G7_3_FAILURE\'); process.exit(7)"';

try {
  // ============================================================
  // TEST 1 — command strategy can be instantiated
  // ============================================================

  const bridge =
    new AgentExecutionBridge({
      defaultStrategy: "command",
      strategies: {
        command: {
          enabled: true,
          commandTemplate: successCommand,
        },
        signal: {
          signalPath,
        },
      },
    });

  assert.ok(bridge);

  console.log(
    "TEST 1 PASS — command strategy instantiated"
  );

  // ============================================================
  // TEST 2 — successful command dispatch
  // ============================================================

  const successResult =
    await bridge.dispatch(
      {
        id: "TEST-007",
        type: "DEVELOPER",
      },
      {
        role: "developer",
        taskId: "TEST-007",
        task: "Controlled command test",
      }
    );

  assert.equal(
    successResult.dispatched,
    true
  );

  assert.equal(
    successResult.strategy,
    "command"
  );

  assert.equal(
    successResult.stdout,
    "B13_G7_3_SUCCESS"
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      successResult,
      "taskId"
    ),
    false
  );

  console.log(
    "TEST 2 PASS — successful command dispatch"
  );

  // ============================================================
  // TEST 3 — TASK_ID substitution works through stdout
  // ============================================================

  const taskIdCommand =
    'node -e "process.stdout.write(\'{TASK_ID}\')"';

  const taskIdBridge =
    new AgentExecutionBridge({
      defaultStrategy: "command",
      strategies: {
        command: {
          enabled: true,
          commandTemplate: taskIdCommand,
        },
      },
    });

  const taskIdResult =
    await taskIdBridge.dispatch(
      {
        id: "B13-G7-3-TASK",
        type: "DEVELOPER",
      },
      {
        role: "developer",
      }
    );

  assert.equal(
    taskIdResult.dispatched,
    true
  );

  assert.equal(
    taskIdResult.strategy,
    "command"
  );

  assert.equal(
    taskIdResult.stdout,
    "B13-G7-3-TASK"
  );

  console.log(
    "TEST 3 PASS — TASK_ID substitution works"
  );

  // ============================================================
  // TEST 4 — failing command does not throw
  // ============================================================

  const failureBridge =
    new AgentExecutionBridge({
      defaultStrategy: "command",
      strategies: {
        command: {
          enabled: true,
          commandTemplate: failureCommand,
        },
      },
    });

  let failureResult;

  try {
    failureResult =
      await failureBridge.dispatch(
        {
          id: "TEST-007-FAIL",
          type: "DEVELOPER",
        },
        {
          role: "developer",
          taskId: "TEST-007-FAIL",
        }
      );
  } catch (error) {
    throw new Error(
      `COMMAND_FAILURE_THROWN: ${error.message}`
    );
  }

  assert.equal(
    failureResult.dispatched,
    false
  );

  assert.equal(
    failureResult.strategy,
    "command"
  );

  assert.match(
    String(failureResult.error),
    /Command failed|exit|7/i
  );

  console.log(
    "TEST 4 PASS — command failure returns safely"
  );

  // ============================================================
  // TEST 5 — failed command never reports success
  // ============================================================

  assert.notEqual(
    failureResult.dispatched,
    true
  );

  console.log(
    "TEST 5 PASS — failed command never reports dispatch success"
  );

  // ============================================================
  // TEST 6 — signal strategy was not used
  // ============================================================

  assert.equal(
    fs.existsSync(signalPath),
    false
  );

  console.log(
    "TEST 6 PASS — signal strategy not invoked"
  );

  // ============================================================
  // TEST 7 — Developer context does not break command boundary
  // ============================================================

  const contextResult =
    await bridge.dispatch(
      {
        id: "TEST-007-CONTEXT",
        type: "DEVELOPER",
      },
      {
        role: "developer",
        taskId: "TEST-007-CONTEXT",
        task: "Developer task",
        model: "opencode/deepseek-v4-flash-free",
      }
    );

  assert.equal(
    contextResult.dispatched,
    true
  );

  assert.equal(
    contextResult.strategy,
    "command"
  );

  assert.equal(
    contextResult.stdout,
    "B13_G7_3_SUCCESS"
  );

  console.log(
    "TEST 7 PASS — Developer context does not break command boundary"
  );

  // ============================================================
  // TEST 8 — deterministic successful command
  // ============================================================

  const repeatA =
    await bridge.dispatch(
      {
        id: "TEST-007-REPEAT",
        type: "DEVELOPER",
      },
      {}
    );

  const repeatB =
    await bridge.dispatch(
      {
        id: "TEST-007-REPEAT",
        type: "DEVELOPER",
      },
      {}
    );

  assert.equal(
    repeatA.dispatched,
    true
  );

  assert.equal(
    repeatB.dispatched,
    true
  );

  assert.deepEqual(
    repeatA,
    repeatB
  );

  console.log(
    "TEST 8 PASS — successful command is deterministic"
  );

  // ============================================================
  // TEST 9 — no lifecycle files touched
  // ============================================================

  assert.equal(
    fs.existsSync(
      path.join(tempDir, "STATE.md")
    ),
    false
  );

  assert.equal(
    fs.existsSync(
      path.join(tempDir, "QUEUE.md")
    ),
    false
  );

  console.log(
    "TEST 9 PASS — no STATE/QUEUE lifecycle writes"
  );

  // ============================================================
  // TEST 10 — command strategy remains isolated
  // ============================================================

  assert.equal(
    bridge.config.defaultStrategy,
    "command"
  );

  assert.equal(
    bridge.config.strategies.command.enabled,
    true
  );

  console.log(
    "TEST 10 PASS — command boundary remains isolated"
  );

  // ============================================================
  // RESULT
  // ============================================================

  console.log("");
  console.log("B13-G7-3 RESULT");
  console.log("STATUS: PASS");
  console.log("COMMAND_STRATEGY: PASS");
  console.log("SUCCESS_DISPATCH: PASS");
  console.log("TASK_ID_SUBSTITUTION: PASS");
  console.log("FAILURE_SAFETY: PASS");
  console.log("NO_FALSE_SUCCESS: PASS");
  console.log("SIGNAL_ISOLATION: PASS");
  console.log("CONTEXT_BOUNDARY: PASS");
  console.log("DETERMINISM: PASS");
  console.log("NO_LIFECYCLE_WRITES: PASS");
  console.log("ISOLATION: PASS");

  console.log("");
  console.log("B13_G7_3_RESPONSE_OK");
  console.log("TEST_007_B13_G7_3_OK");

} catch (error) {
  console.error("");
  console.error("B13-G7-3: ERROR");
  console.error(error);
  process.exitCode = 1;
} finally {
  try {
    fs.rmSync(tempDir, {
      recursive: true,
      force: true,
    });
  } catch {}
}