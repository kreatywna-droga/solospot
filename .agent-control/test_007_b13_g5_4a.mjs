import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

import { executeExecutionPlan } from "./queue_watcher.mjs";

console.log("B13-G5-4A: START");
console.log("B13-G5-4A: ISOLATED EXECUTION TEST");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g5-4a-")
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
STATE: AWAITING_AUDIT

LAST_AGENT: AUDITOR
RETRY_COUNT: 0

DEVELOPER_STATUS: COMPLETE
AUDITOR_STATUS: HOLD
ARCHITECT_STATUS: NOT_REQUIRED

LAST_HANDOFF: DEVELOPER -> AUDITOR
LAST_DECISION: AUDITOR_HOLD
BLOCKER: NONE

NEXT_ACTION:
RETRY_DEVELOPER

HUMAN_REVIEW_REQUIRED: NO
`;

const initialQueue = `# WEB FACTOR QUEUE

## TEST-007
STATUS: IN_PROGRESS
NEXT_STAGE: AUDITOR
`;

try {
  fs.writeFileSync(statePath, initialState, "utf8");
  fs.writeFileSync(queuePath, initialQueue, "utf8");

  const dispatchBefore = JSON.stringify({
    result: "must remain untouched"
  });

  fs.writeFileSync(
    dispatchPath,
    dispatchBefore,
    "utf8"
  );

  // ------------------------------------------------------------
  // TEST 1 — RETRY_DEVELOPER
  // ------------------------------------------------------------

  {
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
        taskId: "TEST-007",
      }
    );

    assert.equal(
      result.executed,
      true
    );

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

    const state = fs.readFileSync(
      statePath,
      "utf8"
    );

    assert.match(
      state,
      /STATE:\s*IN_PROGRESS/
    );

    assert.match(
      state,
      /RETRY_COUNT:\s*1/
    );

    assert.match(
      state,
      /DEVELOPER_STATUS:\s*NOT_STARTED/
    );

    assert.match(
      state,
      /AUDITOR_STATUS:\s*NOT_STARTED/
    );

    assert.match(
      state,
      /ARCHITECT_STATUS:\s*NOT_REQUIRED/
    );

    assert.match(
      state,
      /HUMAN_REVIEW_REQUIRED:\s*NO/
    );

    assert.match(
      state,
      /NEXT_ACTION:\s*[\r\n]+DISPATCH_DEVELOPER/
    );

    const queue = fs.readFileSync(
      queuePath,
      "utf8"
    );

    assert.match(
      queue,
      /STATUS:\s*IN_PROGRESS/
    );

    assert.match(
      queue,
      /NEXT_STAGE:\s*DEVELOPER_RETRY/
    );

    console.log(
      "TEST 1 PASS — DISPATCH_DEVELOPER updates STATE/QUEUE without dispatch"
    );
  }

  // ------------------------------------------------------------
  // TEST 2 — no actual dispatch
  // ------------------------------------------------------------

  {
    assert.equal(
      fs.existsSync(lockPath),
      false
    );

    console.log(
      "TEST 2 PASS — no lock acquired"
    );
  }

  // ------------------------------------------------------------
  // TEST 3 — DISPATCH.json untouched
  // ------------------------------------------------------------

  {
    const dispatchAfter = fs.readFileSync(
      dispatchPath,
      "utf8"
    );

    assert.equal(
      dispatchAfter,
      dispatchBefore
    );

    console.log(
      "TEST 3 PASS — DISPATCH.json unchanged"
    );
  }

  // ------------------------------------------------------------
  // TEST 4 — HUMAN_REVIEW
  // ------------------------------------------------------------

  {
    const humanState = `# WEB FACTOR — AGENT CONTROL STATE

SYSTEM: WEB FACTOR AGENT CONTROL
VERSION: 0.1
MODE: TEST

CURRENT_TASK: TEST-007
STATE: IN_PROGRESS

LAST_AGENT: DEVELOPER
RETRY_COUNT: 2

DEVELOPER_STATUS: COMPLETE
AUDITOR_STATUS: HOLD
ARCHITECT_STATUS: NOT_REQUIRED

LAST_HANDOFF: DEVELOPER -> AUDITOR
LAST_DECISION: AUDITOR_HOLD
BLOCKER: NONE

NEXT_ACTION:
AUDITOR_REVIEW

HUMAN_REVIEW_REQUIRED: NO
`;

    fs.writeFileSync(
      statePath,
      humanState,
      "utf8"
    );

    fs.writeFileSync(
      queuePath,
      initialQueue,
      "utf8"
    );

    const result = executeExecutionPlan(
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
        taskId: "TEST-007",
      }
    );

    assert.equal(
      result.executed,
      true
    );

    assert.equal(
      result.execution,
      "PARK_HUMAN_REVIEW"
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

    const state = fs.readFileSync(
      statePath,
      "utf8"
    );

    assert.match(
      state,
      /STATE:\s*HUMAN_REVIEW/
    );

    assert.match(
      state,
      /RETRY_COUNT:\s*2/
    );

    assert.match(
      state,
      /HUMAN_REVIEW_REQUIRED:\s*YES/
    );

    assert.match(
      state,
      /NEXT_ACTION:\s*[\r\n]+HUMAN_REVIEW/
    );

    const queue = fs.readFileSync(
      queuePath,
      "utf8"
    );

    assert.match(
      queue,
      /STATUS:\s*HUMAN_REVIEW/
    );

    assert.match(
      queue,
      /NEXT_STAGE:\s*HUMAN_REVIEW/
    );

    console.log(
      "TEST 4 PASS — HUMAN_REVIEW parks lifecycle correctly"
    );
  }

  // ------------------------------------------------------------
  // TEST 5 — HUMAN_REVIEW does not increment retry
  // ------------------------------------------------------------

  {
    const state = fs.readFileSync(
      statePath,
      "utf8"
    );

    assert.match(
      state,
      /RETRY_COUNT:\s*2/
    );

    console.log(
      "TEST 5 PASS — HUMAN_REVIEW preserves RETRY_COUNT"
    );
  }

  // ------------------------------------------------------------
  // TEST 6 — unknown execution plan
  // ------------------------------------------------------------

  {
    const result = executeExecutionPlan(
      {
        execution: "UNKNOWN_EXECUTION",
        shouldDispatch: true,
        shouldWriteState: true,
        shouldUpdateQueue: true,
        incrementRetry: true,
        terminal: false,
      },
      {
        statePath,
        queuePath,
        taskId: "TEST-007",
      }
    );

    assert.equal(
      result.executed,
      false
    );

    assert.equal(
      result.execution,
      "NOOP"
    );

    assert.equal(
      result.reason,
      "UNKNOWN_EXECUTION_PLAN"
    );

    console.log(
      "TEST 6 PASS — unknown execution plan fails safely"
    );
  }

  // ------------------------------------------------------------
  // TEST 7 — missing context
  // ------------------------------------------------------------

  {
    const result = executeExecutionPlan(
      {
        execution: "DISPATCH_DEVELOPER",
        shouldDispatch: true,
        shouldWriteState: true,
        shouldUpdateQueue: true,
        incrementRetry: true,
        terminal: false,
      },
      {}
    );

    assert.equal(
      result.executed,
      false
    );

    console.log(
      "TEST 7 PASS — missing context fails safely"
    );
  }

  // ------------------------------------------------------------
  // TEST 8 — no AgentExecutionBridge / no dispatch
  // ------------------------------------------------------------

  {
    assert.equal(
      fs.existsSync(lockPath),
      false
    );

    const dispatchAfter = fs.readFileSync(
      dispatchPath,
      "utf8"
    );

    assert.equal(
      dispatchAfter,
      dispatchBefore
    );

    console.log(
      "TEST 8 PASS — no dispatch and no lock"
    );
  }

  console.log("");
  console.log("B13-G5-4A RESULT");
  console.log("STATUS: PASS");
  console.log("DISPATCH_DEVELOPER_EXECUTION: PASS");
  console.log("STATE_UPDATE: PASS");
  console.log("QUEUE_UPDATE: PASS");
  console.log("RETRY_INCREMENT: PASS");
  console.log("HUMAN_REVIEW_EXECUTION: PASS");
  console.log("RETRY_PRESERVATION: PASS");
  console.log("UNKNOWN_PLAN_SAFETY: PASS");
  console.log("MISSING_CONTEXT_SAFETY: PASS");
  console.log("NO_DISPATCH: PASS");
  console.log("NO_LOCK: PASS");
  console.log("DISPATCH_JSON_UNCHANGED: PASS");
  console.log("ISOLATION: PASS");

  console.log("");
  console.log("B13_G5_4A_RESPONSE_OK");
  console.log("TEST_007_B13_G5_4A_OK");

} catch (error) {
  console.error("");
  console.error("B13-G5-4A: ERROR");
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