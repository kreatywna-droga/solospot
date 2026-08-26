import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

import { evaluateAndResume } from "./queue_watcher.mjs";

console.log("B13-G5-3A: START");
console.log("B13-G5-3A: EXECUTION-PLAN INTEGRATION TEST");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g5-3a-")
);

const statePath = path.join(tempDir, "STATE.md");
const queuePath = path.join(tempDir, "QUEUE.md");
const lockPath = path.join(tempDir, ".claim.lock");

const stateContent = `# WEB FACTOR — AGENT CONTROL STATE

SYSTEM: WEB FACTOR AGENT CONTROL
VERSION: 0.1
MODE: TEST

CURRENT_TASK: TEST-007
STATE: IN_PROGRESS

LAST_AGENT: DEVELOPER
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

const queueContent = `# WEB FACTOR QUEUE

## TEST-007
STATUS: IN_PROGRESS
NEXT_STAGE: AUDITOR
`;

try {
  fs.writeFileSync(statePath, stateContent, "utf8");
  fs.writeFileSync(queuePath, queueContent, "utf8");

  // TEST 1 — RETRY_DEVELOPER execution plan
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: true,
        decisionKind: "auditor_hold",
        decisionRetryCount: 0,
      }
    );

    assert.equal(
      result.action,
      "EXECUTION_PLAN_PROBE"
    );

    assert.equal(
      result.readOnly,
      true
    );

    assert.ok(
      result.decision
    );

    assert.equal(
      result.decision.action,
      "RETRY_DEVELOPER"
    );

    assert.ok(
      result.executionPlan
    );

    assert.equal(
      result.executionPlan.execution,
      "DISPATCH_DEVELOPER"
    );

    assert.equal(
      result.executionPlan.shouldDispatch,
      true
    );

    assert.equal(
      result.executionPlan.shouldWriteState,
      true
    );

    assert.equal(
      result.executionPlan.shouldUpdateQueue,
      true
    );

    assert.equal(
      result.executionPlan.incrementRetry,
      true
    );

    assert.equal(
      result.executionPlan.terminal,
      false
    );

    console.log(
      "TEST 1 PASS — RETRY_DEVELOPER → DISPATCH_DEVELOPER plan"
    );
  }

  // TEST 2 — HUMAN_REVIEW execution plan
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: true,
        decisionKind: "auditor_hold",
        decisionRetryCount: 3,
      }
    );

    assert.equal(
      result.action,
      "EXECUTION_PLAN_PROBE"
    );

    assert.equal(
      result.readOnly,
      true
    );

    assert.equal(
      result.decision.action,
      "HUMAN_REVIEW"
    );

    assert.equal(
      result.executionPlan.execution,
      "PARK_HUMAN_REVIEW"
    );

    assert.equal(
      result.executionPlan.shouldDispatch,
      false
    );

    assert.equal(
      result.executionPlan.shouldWriteState,
      true
    );

    assert.equal(
      result.executionPlan.shouldUpdateQueue,
      true
    );

    assert.equal(
      result.executionPlan.incrementRetry,
      false
    );

    assert.equal(
      result.executionPlan.terminal,
      true
    );

    console.log(
      "TEST 2 PASS — HUMAN_REVIEW → PARK_HUMAN_REVIEW plan"
    );
  }

  // TEST 3 — unknown retry kind safely escalates to HUMAN_REVIEW
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: true,
        decisionKind: "unknown_kind",
        decisionRetryCount: 0,
      }
    );

    assert.equal(
      result.action,
      "EXECUTION_PLAN_PROBE"
    );

    assert.equal(
      result.readOnly,
      true
    );

    assert.ok(
      result.decision
    );

    assert.equal(
      result.decision.action,
      "HUMAN_REVIEW"
    );

    assert.equal(
      result.decision.reason,
      "UNKNOWN_RETRY_KIND"
    );

    assert.ok(
      result.executionPlan
    );

    assert.equal(
      result.executionPlan.execution,
      "PARK_HUMAN_REVIEW"
    );

    assert.equal(
      result.executionPlan.shouldDispatch,
      false
    );

    assert.equal(
      result.executionPlan.shouldWriteState,
      true
    );

    assert.equal(
      result.executionPlan.shouldUpdateQueue,
      true
    );

    assert.equal(
      result.executionPlan.incrementRetry,
      false
    );

    assert.equal(
      result.executionPlan.terminal,
      true
    );

    console.log(
      "TEST 3 PASS — unknown retry kind → safe HUMAN_REVIEW plan"
    );
  }

  // TEST 4 — STATE unchanged
  {
    const before = fs.readFileSync(
      statePath,
      "utf8"
    );

    await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: true,
        decisionKind: "execution_failure",
        decisionRetryCount: 0,
      }
    );

    const after = fs.readFileSync(
      statePath,
      "utf8"
    );

    assert.equal(
      after,
      before
    );

    console.log(
      "TEST 4 PASS — STATE.md unchanged"
    );
  }

  // TEST 5 — QUEUE unchanged
  {
    const before = fs.readFileSync(
      queuePath,
      "utf8"
    );

    await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: true,
        decisionKind: "execution_failure",
        decisionRetryCount: 0,
      }
    );

    const after = fs.readFileSync(
      queuePath,
      "utf8"
    );

    assert.equal(
      after,
      before
    );

    console.log(
      "TEST 5 PASS — QUEUE.md unchanged"
    );
  }

  // TEST 6 — no lock
  {
    assert.equal(
      fs.existsSync(lockPath),
      false
    );

    console.log(
      "TEST 6 PASS — no lifecycle lock created"
    );
  }

  // TEST 7 — plan can request dispatch without performing dispatch
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: true,
        decisionKind: "auditor_hold",
        decisionRetryCount: 0,
      }
    );

    assert.equal(
      result.readOnly,
      true
    );

    assert.equal(
      result.executionPlan.shouldDispatch,
      true
    );

    assert.equal(
      result.executionPlan.execution,
      "DISPATCH_DEVELOPER"
    );

    assert.equal(
      fs.existsSync(lockPath),
      false
    );

    console.log(
      "TEST 7 PASS — plan requests dispatch but performs no dispatch"
    );
  }

  // TEST 8 — existing decision-only behavior preserved
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        executionPlanOnly: false,
        decisionKind: "auditor_hold",
        decisionRetryCount: 0,
      }
    );

    assert.equal(
      result.action,
      "RETRY_DECISION_PROBE"
    );

    assert.equal(
      result.readOnly,
      true
    );

    assert.equal(
      result.decision.action,
      "RETRY_DEVELOPER"
    );

    console.log(
      "TEST 8 PASS — existing decision-only path preserved"
    );
  }

  console.log("");
  console.log("B13-G5-3A RESULT");
  console.log("STATUS: PASS");
  console.log("EXECUTION_PLAN_INTEGRATION: PASS");
  console.log("RETRY_DEVELOPER_PLAN: PASS");
  console.log("HUMAN_REVIEW_PLAN: PASS");
  console.log("UNKNOWN_DECISION_SAFETY: PASS");
  console.log("STATE_UNCHANGED: PASS");
  console.log("QUEUE_UNCHANGED: PASS");
  console.log("NO_LOCK: PASS");
  console.log("NO_DISPATCH: PASS");
  console.log("DECISION_ONLY_PRESERVED: PASS");
  console.log("ISOLATION: PASS");

  console.log("");
  console.log("B13_G5_3A_RESPONSE_OK");
  console.log("TEST_007_B13_G5_3A_OK");

} catch (error) {
  console.error("");
  console.error("B13-G5-3A: ERROR");
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