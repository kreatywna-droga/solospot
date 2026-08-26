import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

import { evaluateAndResume } from "./queue_watcher.mjs";

console.log("B13-G5-5A: START");
console.log("B13-G5-5A: CONTROLLED LIFECYCLE EXECUTION TEST");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g5-5a-")
);

const statePath = path.join(tempDir, "STATE.md");
const queuePath = path.join(tempDir, "QUEUE.md");
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

  // TEST 1 — controlled RETRY_DEVELOPER execution
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: true,
        executionOnly: true,
        decisionKind: "auditor_hold",
        decisionRetryCount: 0,
        executionContext: {
          statePath,
          queuePath,
          taskId: "TEST-007",
        },
      }
    );

    assert.equal(result.action, "EXECUTION_RESULT_PROBE");
    assert.equal(result.readOnly, false);

    assert.ok(result.decision);
    assert.equal(result.decision.action, "RETRY_DEVELOPER");

    assert.ok(result.executionPlan);
    assert.equal(
      result.executionPlan.execution,
      "DISPATCH_DEVELOPER"
    );

    assert.ok(result.executionResult);
    assert.equal(result.executionResult.executed, true);
    assert.equal(
      result.executionResult.execution,
      "DISPATCH_DEVELOPER"
    );
    assert.equal(result.executionResult.dispatched, false);
    assert.equal(result.executionResult.stateWritten, true);
    assert.equal(result.executionResult.queueUpdated, true);
    assert.equal(result.executionResult.lockAcquired, false);

    const state = fs.readFileSync(statePath, "utf8");

    assert.match(state, /STATE:\s*IN_PROGRESS/);
    assert.match(state, /RETRY_COUNT:\s*1/);
    assert.match(state, /HUMAN_REVIEW_REQUIRED:\s*NO/);
    assert.match(
      state,
      /NEXT_ACTION:\s*[\r\n]+DISPATCH_DEVELOPER/
    );

    const queue = fs.readFileSync(queuePath, "utf8");

    assert.match(queue, /STATUS:\s*IN_PROGRESS/);
    assert.match(queue, /NEXT_STAGE:\s*DEVELOPER_RETRY/);

    console.log(
      "TEST 1 PASS — controlled RETRY_DEVELOPER lifecycle"
    );
  }

  // TEST 2 — no lock
  {
    assert.equal(fs.existsSync(lockPath), false);

    console.log("TEST 2 PASS — no lifecycle lock");
  }

  // TEST 3 — reset isolated files
  {
    fs.writeFileSync(statePath, initialState, "utf8");
    fs.writeFileSync(queuePath, initialQueue, "utf8");

    console.log("TEST 3 PASS — isolated lifecycle reset");
  }

  // TEST 4 — controlled HUMAN_REVIEW execution
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: true,
        executionOnly: true,
        decisionKind: "auditor_hold",
        decisionRetryCount: 3,
        executionContext: {
          statePath,
          queuePath,
          taskId: "TEST-007",
        },
      }
    );

    assert.equal(result.action, "EXECUTION_RESULT_PROBE");
    assert.equal(result.readOnly, false);

    assert.equal(
      result.decision.action,
      "HUMAN_REVIEW"
    );

    assert.equal(
      result.executionPlan.execution,
      "PARK_HUMAN_REVIEW"
    );

    assert.equal(result.executionResult.executed, true);
    assert.equal(
      result.executionResult.execution,
      "PARK_HUMAN_REVIEW"
    );
    assert.equal(result.executionResult.dispatched, false);
    assert.equal(result.executionResult.stateWritten, true);
    assert.equal(result.executionResult.queueUpdated, true);
    assert.equal(result.executionResult.lockAcquired, false);

    const state = fs.readFileSync(statePath, "utf8");

    assert.match(state, /STATE:\s*HUMAN_REVIEW/);
    assert.match(state, /RETRY_COUNT:\s*0/);
    assert.match(state, /HUMAN_REVIEW_REQUIRED:\s*YES/);
    assert.match(
      state,
      /NEXT_ACTION:\s*[\r\n]+HUMAN_REVIEW/
    );

    const queue = fs.readFileSync(queuePath, "utf8");

    assert.match(queue, /STATUS:\s*HUMAN_REVIEW/);
    assert.match(queue, /NEXT_STAGE:\s*HUMAN_REVIEW/);

    console.log(
      "TEST 4 PASS — controlled HUMAN_REVIEW lifecycle"
    );
  }

  // TEST 5 — executionPlanOnly remains read-only
  {
    fs.writeFileSync(statePath, initialState, "utf8");
    fs.writeFileSync(queuePath, initialQueue, "utf8");

    const stateBefore = fs.readFileSync(
      statePath,
      "utf8"
    );

    const queueBefore = fs.readFileSync(
      queuePath,
      "utf8"
    );

    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: true,
        executionOnly: false,
        decisionKind: "auditor_hold",
        decisionRetryCount: 0,
        executionContext: {
          statePath,
          queuePath,
          taskId: "TEST-007",
        },
      }
    );

    assert.equal(
      result.action,
      "EXECUTION_PLAN_PROBE"
    );

    assert.equal(result.readOnly, true);

    assert.ok(result.executionPlan);

    assert.equal(
      result.executionPlan.execution,
      "DISPATCH_DEVELOPER"
    );

    assert.equal(
      fs.readFileSync(statePath, "utf8"),
      stateBefore
    );

    assert.equal(
      fs.readFileSync(queuePath, "utf8"),
      queueBefore
    );

    console.log(
      "TEST 5 PASS — executionPlanOnly remains read-only"
    );
  }

  // TEST 6 — missing execution context
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: true,
        executionOnly: true,
        decisionKind: "auditor_hold",
        decisionRetryCount: 0,
      }
    );

    assert.equal(
      result.action,
      "EXECUTION_RESULT_PROBE"
    );

    assert.equal(result.readOnly, false);
    assert.equal(result.executed, false);
    assert.equal(
      result.reason,
      "EXECUTION_CONTEXT_REQUIRED"
    );

    console.log(
      "TEST 6 PASS — missing execution context fails safely"
    );
  }

  // TEST 7 — no lock
  {
    assert.equal(fs.existsSync(lockPath), false);

    console.log("TEST 7 PASS — no lock acquisition");
  }

  console.log("");
  console.log("B13-G5-5A RESULT");
  console.log("STATUS: PASS");
  console.log("CONTROLLED_EXECUTION: PASS");
  console.log("RETRY_DEVELOPER: PASS");
  console.log("HUMAN_REVIEW: PASS");
  console.log("PLAN_ONLY_PRESERVED: PASS");
  console.log("CONTEXT_REQUIRED: PASS");
  console.log("NO_LOCK: PASS");
  console.log("NO_REAL_DISPATCH: PASS");
  console.log("ISOLATION: PASS");

  console.log("");
  console.log("B13_G5_5A_RESPONSE_OK");
  console.log("TEST_007_B13_G5_5A_OK");

} catch (error) {
  console.error("");
  console.error("B13-G5-5A: ERROR");
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