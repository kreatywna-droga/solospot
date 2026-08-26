import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  createDeveloperDispatchRequest,
  executeExecutionPlan,
} from "./queue_watcher.mjs";

console.log("B13-G6-5: START");
console.log("B13-G6-5: CONTROLLED DISPATCH HANDOFF TEST");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g6-5-")
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
  fs.writeFileSync(
    statePath,
    initialState,
    "utf8"
  );

  fs.writeFileSync(
    queuePath,
    initialQueue,
    "utf8"
  );

  try {
    fs.unlinkSync(lockPath);
  } catch {}
}

try {
  // ============================================================
  // TEST 1 — construct valid Developer dispatch request
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
    "TEST 1 PASS — valid Developer dispatch request"
  );

  // ============================================================
  // TEST 2 — request contains no dispatch result
  // ============================================================

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      request,
      "dispatched"
    ),
    false
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      request,
      "dispatch"
    ),
    false
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      request,
      "bridge"
    ),
    false
  );

  console.log(
    "TEST 2 PASS — request contains no dispatch capability"
  );

  // ============================================================
  // TEST 3 — controlled execution returns request
  // ============================================================

  resetFiles();

  const executionResult = executeExecutionPlan(
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

  assert.equal(
    executionResult.executed,
    true
  );

  assert.equal(
    executionResult.execution,
    "DISPATCH_DEVELOPER"
  );

  assert.equal(
    executionResult.dispatched,
    false
  );

  assert.equal(
    executionResult.stateWritten,
    true
  );

  assert.equal(
    executionResult.queueUpdated,
    true
  );

  assert.equal(
    executionResult.lockAcquired,
    false
  );

  assert.deepEqual(
    executionResult.dispatchRequest,
    request
  );

  console.log(
    "TEST 3 PASS — execution boundary returns Developer request"
  );

  // ============================================================
  // TEST 4 — lifecycle state was updated
  // ============================================================

  const updatedState = fs.readFileSync(
    statePath,
    "utf8"
  );

  assert.match(
    updatedState,
    /STATE:\s*IN_PROGRESS/
  );

  assert.match(
    updatedState,
    /RETRY_COUNT:\s*1/
  );

  assert.match(
    updatedState,
    /NEXT_ACTION:\s*[\r\n]+DISPATCH_DEVELOPER/
  );

  console.log(
    "TEST 4 PASS — STATE updated correctly"
  );

  // ============================================================
  // TEST 5 — lifecycle queue was updated
  // ============================================================

  const updatedQueue = fs.readFileSync(
    queuePath,
    "utf8"
  );

  assert.match(
    updatedQueue,
    /STATUS:\s*IN_PROGRESS/
  );

  assert.match(
    updatedQueue,
    /NEXT_STAGE:\s*DEVELOPER_RETRY/
  );

  console.log(
    "TEST 5 PASS — QUEUE updated correctly"
  );

  // ============================================================
  // TEST 6 — no real dispatch
  // ============================================================

  assert.equal(
    executionResult.dispatched,
    false
  );

  console.log(
    "TEST 6 PASS — no real Developer dispatch"
  );

  // ============================================================
  // TEST 7 — no lock
  // ============================================================

  assert.equal(
    fs.existsSync(lockPath),
    false
  );

  console.log(
    "TEST 7 PASS — no lifecycle lock"
  );

  // ============================================================
  // TEST 8 — invalid role rejected before writes
  // ============================================================

  resetFiles();

  const stateBeforeRole = fs.readFileSync(
    statePath,
    "utf8"
  );

  const queueBeforeRole = fs.readFileSync(
    queuePath,
    "utf8"
  );

  const invalidRoleResult =
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
        developerRole: "auditor",
        developerModel,
      }
    );

  assert.equal(
    invalidRoleResult.executed,
    false
  );

  assert.equal(
    invalidRoleResult.dispatched,
    false
  );

  assert.deepEqual(
    invalidRoleResult.dispatchRequest,
    {
      valid: false,
      reason: "INVALID_ROLE",
    }
  );

  assert.equal(
    invalidRoleResult.stateWritten,
    false
  );

  assert.equal(
    invalidRoleResult.queueUpdated,
    false
  );

  assert.equal(
    fs.readFileSync(statePath, "utf8"),
    stateBeforeRole
  );

  assert.equal(
    fs.readFileSync(queuePath, "utf8"),
    queueBeforeRole
  );

  console.log(
    "TEST 8 PASS — invalid role rejected before lifecycle writes"
  );

  // ============================================================
  // TEST 9 — invalid model rejected before writes
  // ============================================================

  resetFiles();

  const stateBeforeModel = fs.readFileSync(
    statePath,
    "utf8"
  );

  const queueBeforeModel = fs.readFileSync(
    queuePath,
    "utf8"
  );

  const invalidModelResult =
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
        developerRole: "developer",
        developerModel: 12345,
      }
    );

  assert.equal(
    invalidModelResult.executed,
    false
  );

  assert.equal(
    invalidModelResult.dispatched,
    false
  );

  assert.deepEqual(
    invalidModelResult.dispatchRequest,
    {
      valid: false,
      reason: "INVALID_MODEL",
    }
  );

  assert.equal(
    invalidModelResult.stateWritten,
    false
  );

  assert.equal(
    invalidModelResult.queueUpdated,
    false
  );

  assert.equal(
    fs.readFileSync(statePath, "utf8"),
    stateBeforeModel
  );

  assert.equal(
    fs.readFileSync(queuePath, "utf8"),
    queueBeforeModel
  );

  console.log(
    "TEST 9 PASS — invalid model rejected before lifecycle writes"
  );

  // ============================================================
  // TEST 10 — missing task rejected before writes
  // ============================================================

  resetFiles();

  const stateBeforeTask = fs.readFileSync(
    statePath,
    "utf8"
  );

  const queueBeforeTask = fs.readFileSync(
    queuePath,
    "utf8"
  );

  const missingTaskResult =
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
        developerRole: "developer",
        developerModel,
      }
    );

  assert.equal(
    missingTaskResult.executed,
    false
  );

  assert.equal(
    missingTaskResult.dispatched,
    false
  );

  assert.deepEqual(
    missingTaskResult.dispatchRequest,
    {
      valid: false,
      reason: "MISSING_TASK",
    }
  );

  assert.equal(
    missingTaskResult.stateWritten,
    false
  );

  assert.equal(
    missingTaskResult.queueUpdated,
    false
  );

  assert.equal(
    fs.readFileSync(statePath, "utf8"),
    stateBeforeTask
  );

  assert.equal(
    fs.readFileSync(queuePath, "utf8"),
    queueBeforeTask
  );

  console.log(
    "TEST 10 PASS — missing task rejected before lifecycle writes"
  );

  // ============================================================
  // TEST 11 — HUMAN_REVIEW remains isolated
  // ============================================================

  resetFiles();

  const humanResult = executeExecutionPlan(
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
    humanResult.stateWritten,
    true
  );

  assert.equal(
    humanResult.queueUpdated,
    true
  );

  assert.equal(
    humanResult.lockAcquired,
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
    "TEST 11 PASS — HUMAN_REVIEW remains dispatch-free"
  );

  // ============================================================
  // TEST 12 — final lock check
  // ============================================================

  assert.equal(
    fs.existsSync(lockPath),
    false
  );

  console.log(
    "TEST 12 PASS — no lock acquisition"
  );

  // ============================================================
  // RESULT
  // ============================================================

  console.log("");
  console.log("B13-G6-5 RESULT");
  console.log("STATUS: PASS");
  console.log("REQUEST_CONTRACT: PASS");
  console.log("CONTROLLED_HANDOFF: PASS");
  console.log("STATE_UPDATE: PASS");
  console.log("QUEUE_UPDATE: PASS");
  console.log("NO_REAL_DISPATCH: PASS");
  console.log("NO_LOCK: PASS");
  console.log("INVALID_ROLE_SAFETY: PASS");
  console.log("INVALID_MODEL_SAFETY: PASS");
  console.log("MISSING_TASK_SAFETY: PASS");
  console.log("HUMAN_REVIEW_BOUNDARY: PASS");
  console.log("ISOLATION: PASS");

  console.log("");
  console.log("B13_G6_5_RESPONSE_OK");
  console.log("TEST_007_B13_G6_5_OK");

} catch (error) {
  console.error("");
  console.error("B13-G6-5: ERROR");
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