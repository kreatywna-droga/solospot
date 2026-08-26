import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  createDeveloperDispatchRequest,
  executeExecutionPlan,
} from "./queue_watcher.mjs";

console.log("B13-G6-6: START");
console.log("B13-G6-6: FINAL CONTROLLED DISPATCH BOUNDARY TEST");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g6-6-")
);

const statePath = path.join(tempDir, "STATE.md");
const queuePath = path.join(tempDir, "QUEUE.md");
const lockPath = path.join(tempDir, ".claim.lock");

const taskId = "TEST-007";
const developerTask = "Execute controlled Developer retry";
const developerModel = "opencode/deepseek-v4-flash-free";

const initialState = `# WEB FACTOR — AGENT CONTROL STATE

SYSTEM: WEB FACTOR AGENT CONTROL
VERSION: 0.1
MODE: TEST

CURRENT_TASK: TEST-007
STATE: WAITING

LAST_AGENT: AUDITOR
RETRY_COUNT: 0

DEVELOPER_STATUS: COMPLETE
AUDITOR_STATUS: HOLD
ARCHITECT_STATUS: NOT_REQUIRED

LAST_HANDOFF: AUDITOR -> DEVELOPER
LAST_DECISION: AUDITOR_HOLD
BLOCKER: NONE

NEXT_ACTION:
RETRY_DEVELOPER

HUMAN_REVIEW_REQUIRED: NO
`;

const initialQueue = `# WEB FACTOR QUEUE

## TEST-007
STATUS: READY
NEXT_STAGE: DEVELOPER
`;

function resetFiles() {
  fs.writeFileSync(statePath, initialState, "utf8");
  fs.writeFileSync(queuePath, initialQueue, "utf8");

  try {
    fs.unlinkSync(lockPath);
  } catch {}
}

try {
  // ============================================================
  // TEST 1 — valid request is structurally complete
  // ============================================================

  const request = createDeveloperDispatchRequest({
    taskId,
    task: developerTask,
    role: "developer",
    model: developerModel,
  });

  assert.deepEqual(request, {
    valid: true,
    role: "developer",
    taskId,
    task: developerTask,
    model: developerModel,
  });

  console.log(
    "TEST 1 PASS — Developer request structurally complete"
  );

  // ============================================================
  // TEST 2 — controlled execution returns request only
  // ============================================================

  resetFiles();

  const result = executeExecutionPlan(
    {
      execution: "DISPATCH_DEVELOPER",
      shouldDispatch: true,
      shouldWriteState: true,
      shouldUpdateQueue: true,
      incrementRetry: true,
      terminal: false,
    },
    {
      statePath,
      queuePath,
      lockPath,
      taskId,
      developerTask,
      developerRole: "developer",
      developerModel,
    }
  );

  assert.equal(result.executed, true);
  assert.equal(
    result.execution,
    "DISPATCH_DEVELOPER"
  );

  assert.equal(
    result.dispatched,
    false
  );

  assert.deepEqual(
    result.dispatchRequest,
    request
  );

  console.log(
    "TEST 2 PASS — controlled execution returns request without dispatch"
  );

  // ============================================================
  // TEST 3 — dispatch request has no execution capability
  // ============================================================

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.dispatchRequest,
      "bridge"
    ),
    false
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.dispatchRequest,
      "dispatch"
    ),
    false
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.dispatchRequest,
      "runAgent"
    ),
    false
  );

  console.log(
    "TEST 3 PASS — request exposes no execution capability"
  );

  // ============================================================
  // TEST 4 — lifecycle state is committed only after validation
  // ============================================================

  const stateAfterValid =
    fs.readFileSync(statePath, "utf8");

  const queueAfterValid =
    fs.readFileSync(queuePath, "utf8");

  assert.match(
    stateAfterValid,
    /STATE:\s*IN_PROGRESS/
  );

  assert.match(
    stateAfterValid,
    /RETRY_COUNT:\s*1/
  );

  assert.match(
    queueAfterValid,
    /STATUS:\s*IN_PROGRESS/
  );

  assert.match(
    queueAfterValid,
    /NEXT_STAGE:\s*DEVELOPER_RETRY/
  );

  console.log(
    "TEST 4 PASS — lifecycle committed after request validation"
  );

  // ============================================================
  // TEST 5 — invalid request cannot reach lifecycle
  // ============================================================

  resetFiles();

  const stateBeforeInvalid =
    fs.readFileSync(statePath, "utf8");

  const queueBeforeInvalid =
    fs.readFileSync(queuePath, "utf8");

  const invalidResult =
    executeExecutionPlan(
      {
        execution: "DISPATCH_DEVELOPER",
        shouldDispatch: true,
        shouldWriteState: true,
        shouldUpdateQueue: true,
        incrementRetry: true,
        terminal: false,
      },
      {
        statePath,
        queuePath,
        lockPath,
        taskId,
        developerTask,
        developerRole: "architect",
        developerModel,
      }
    );

  assert.equal(
    invalidResult.executed,
    false
  );

  assert.equal(
    invalidResult.dispatched,
    false
  );

  assert.deepEqual(
    invalidResult.dispatchRequest,
    {
      valid: false,
      reason: "INVALID_ROLE",
    }
  );

  assert.equal(
    invalidResult.stateWritten,
    false
  );

  assert.equal(
    invalidResult.queueUpdated,
    false
  );

  assert.equal(
    fs.readFileSync(statePath, "utf8"),
    stateBeforeInvalid
  );

  assert.equal(
    fs.readFileSync(queuePath, "utf8"),
    queueBeforeInvalid
  );

  console.log(
    "TEST 5 PASS — invalid request cannot reach lifecycle"
  );

  // ============================================================
  // TEST 6 — no lock at controlled boundary
  // ============================================================

  assert.equal(
    fs.existsSync(lockPath),
    false
  );

  console.log(
    "TEST 6 PASS — no lock at dispatch boundary"
  );

  // ============================================================
  // TEST 7 — HUMAN_REVIEW cannot create Developer request
  // ============================================================

  resetFiles();

  const humanResult =
    executeExecutionPlan(
      {
        execution: "PARK_HUMAN_REVIEW",
        shouldDispatch: false,
        shouldWriteState: true,
        shouldUpdateQueue: true,
        incrementRetry: false,
        terminal: true,
      },
      {
        statePath,
        queuePath,
        lockPath,
        taskId,
      }
    );

  assert.equal(
    humanResult.executed,
    true
  );

  assert.equal(
    humanResult.execution,
    "PARK_HUMAN_REVIEW"
  );

  assert.equal(
    humanResult.dispatched,
    false
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      humanResult,
      "dispatchRequest"
    ),
    false
  );

  console.log(
    "TEST 7 PASS — HUMAN_REVIEW cannot create Developer request"
  );

  // ============================================================
  // TEST 8 — execution boundary remains ACP-free
  // ============================================================

  assert.equal(
    humanResult.lockAcquired,
    false
  );

  console.log(
    "TEST 8 PASS — controlled boundary remains ACP-free"
  );

  // ============================================================
  // TEST 9 — deterministic request construction
  // ============================================================

  const requestA =
    createDeveloperDispatchRequest({
      taskId,
      task: developerTask,
      role: "developer",
      model: developerModel,
    });

  const requestB =
    createDeveloperDispatchRequest({
      taskId,
      task: developerTask,
      role: "developer",
      model: developerModel,
    });

  assert.deepEqual(
    requestA,
    requestB
  );

  console.log(
    "TEST 9 PASS — deterministic Developer request"
  );

  // ============================================================
  // TEST 10 — no mutation of caller context
  // ============================================================

  const context = {
    taskId,
    task: developerTask,
    role: "developer",
    model: developerModel,
  };

  const contextBefore =
    JSON.stringify(context);

  createDeveloperDispatchRequest(context);

  assert.equal(
    JSON.stringify(context),
    contextBefore
  );

  console.log(
    "TEST 10 PASS — caller context remains unchanged"
  );

  // ============================================================
  // RESULT
  // ============================================================

  console.log("");
  console.log("B13-G6-6 RESULT");
  console.log("STATUS: PASS");
  console.log("REQUEST_CONTRACT: PASS");
  console.log("CONTROLLED_EXECUTION: PASS");
  console.log("VALIDATION_ORDER: PASS");
  console.log("LIFECYCLE_BOUNDARY: PASS");
  console.log("INVALID_REQUEST_SAFETY: PASS");
  console.log("NO_REAL_DISPATCH: PASS");
  console.log("NO_LOCK: PASS");
  console.log("HUMAN_REVIEW_BOUNDARY: PASS");
  console.log("ACP_FREE: PASS");
  console.log("DETERMINISM: PASS");
  console.log("IMMUTABILITY: PASS");
  console.log("ISOLATION: PASS");

  console.log("");
  console.log("B13_G6_6_RESPONSE_OK");
  console.log("TEST_007_B13_G6_6_OK");

} catch (error) {
  console.error("");
  console.error("B13-G6-6: ERROR");
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