import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { executeExecutionPlan } from "./queue_watcher.mjs";

console.log("B13-G6-4A: START");
console.log("B13-G6-4A: DEVELOPER REQUEST INTEGRATION TEST");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g6-4a-")
);

const statePath = path.join(tempDir, "STATE.md");
const queuePath = path.join(tempDir, "QUEUE.md");
const dispatchPath = path.join(tempDir, "DISPATCH.json");
const lockPath = path.join(tempDir, ".claim.lock");

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

const initialDispatch = JSON.stringify(
  {
    status: "UNCHANGED",
    dispatched: false,
  },
  null,
  2
);

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

  fs.writeFileSync(
    dispatchPath,
    initialDispatch,
    "utf8"
  );

  try {
    fs.unlinkSync(lockPath);
  } catch {}
}

try {
  // ============================================================
  // TEST 1 — valid Developer request
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
      dispatchPath,
      taskId: "TEST-007",
      developerTask: "Execute Developer retry",
      developerRole: "developer",
      developerModel: "opencode/deepseek-v4-flash-free",
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

  assert.equal(
    result.stateWritten,
    true
  );

  assert.equal(
    result.queueUpdated,
    true
  );

  assert.equal(
    result.lockAcquired,
    false
  );

  assert.ok(result.dispatchRequest);

  assert.deepEqual(
    result.dispatchRequest,
    {
      valid: true,
      role: "developer",
      taskId: "TEST-007",
      task: "Execute Developer retry",
      model: "opencode/deepseek-v4-flash-free",
    }
  );

  console.log(
    "TEST 1 PASS — valid Developer request created"
  );

  // ============================================================
  // TEST 2 — no real dispatch
  // ============================================================

  assert.equal(
    result.dispatched,
    false
  );

  const dispatchAfter = fs.readFileSync(
    dispatchPath,
    "utf8"
  );

  assert.equal(
    dispatchAfter,
    initialDispatch
  );

  console.log(
    "TEST 2 PASS — no real dispatch performed"
  );

  // ============================================================
  // TEST 3 — no lock
  // ============================================================

  assert.equal(
    fs.existsSync(lockPath),
    false
  );

  console.log(
    "TEST 3 PASS — no lifecycle lock"
  );

  // ============================================================
  // TEST 4 — missing Developer task
  // ============================================================

  resetFiles();

  const stateBeforeMissingTask =
    fs.readFileSync(
      statePath,
      "utf8"
    );

  const queueBeforeMissingTask =
    fs.readFileSync(
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
        dispatchPath,
        taskId: "TEST-007",
        developerRole: "developer",
        developerModel: "model-x",
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

  assert.equal(
    missingTaskResult.stateWritten,
    false
  );

  assert.equal(
    missingTaskResult.queueUpdated,
    false
  );

  assert.equal(
    missingTaskResult.lockAcquired,
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
    fs.readFileSync(statePath, "utf8"),
    stateBeforeMissingTask
  );

  assert.equal(
    fs.readFileSync(queuePath, "utf8"),
    queueBeforeMissingTask
  );

  console.log(
    "TEST 4 PASS — missing task blocks lifecycle writes"
  );

  // ============================================================
  // TEST 5 — invalid role
  // ============================================================

  resetFiles();

  const stateBeforeRole =
    fs.readFileSync(
      statePath,
      "utf8"
    );

  const queueBeforeRole =
    fs.readFileSync(
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
        dispatchPath,
        taskId: "TEST-007",
        developerTask: "Developer task",
        developerRole: "auditor",
        developerModel: "model-x",
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
    "TEST 5 PASS — invalid role blocks lifecycle writes"
  );

  // ============================================================
  // TEST 6 — invalid model
  // ============================================================

  resetFiles();

  const stateBeforeModel =
    fs.readFileSync(
      statePath,
      "utf8"
    );

  const queueBeforeModel =
    fs.readFileSync(
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
        dispatchPath,
        taskId: "TEST-007",
        developerTask: "Developer task",
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
    "TEST 6 PASS — invalid model blocks lifecycle writes"
  );

  // ============================================================
  // TEST 7 — HUMAN_REVIEW does not create Developer request
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
        dispatchPath,
        taskId: "TEST-007",
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
    "TEST 7 PASS — HUMAN_REVIEW creates no Developer request"
  );

  // ============================================================
  // TEST 8 — DISPATCH.json unchanged
  // ============================================================

  assert.equal(
    fs.readFileSync(
      dispatchPath,
      "utf8"
    ),
    initialDispatch
  );

  console.log(
    "TEST 8 PASS — DISPATCH.json unchanged"
  );

  // ============================================================
  // TEST 9 — no lock after HUMAN_REVIEW
  // ============================================================

  assert.equal(
    fs.existsSync(lockPath),
    false
  );

  console.log(
    "TEST 9 PASS — no lock acquisition"
  );

  // ============================================================
  // RESULT
  // ============================================================

  console.log("");
  console.log("B13-G6-4A RESULT");
  console.log("STATUS: PASS");
  console.log("VALID_DEVELOPER_REQUEST: PASS");
  console.log("NO_REAL_DISPATCH: PASS");
  console.log("NO_LOCK: PASS");
  console.log("MISSING_TASK_SAFETY: PASS");
  console.log("INVALID_ROLE_SAFETY: PASS");
  console.log("INVALID_MODEL_SAFETY: PASS");
  console.log("LIFECYCLE_WRITE_ORDER: PASS");
  console.log("HUMAN_REVIEW_BOUNDARY: PASS");
  console.log("DISPATCH_JSON_UNCHANGED: PASS");
  console.log("ISOLATION: PASS");

  console.log("");
  console.log("B13_G6_4A_RESPONSE_OK");
  console.log("TEST_007_B13_G6_4A_OK");

} catch (error) {
  console.error("");
  console.error("B13-G6-4A: ERROR");
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