import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

import { evaluateAndResume } from "./queue_watcher.mjs";

console.log("B13-G4-4A: START");
console.log("B13-G4-4A: DECISION-ONLY LIFECYCLE TEST");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g4-4a-")
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

  // TEST 1
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
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

    assert.ok(
      result.decision,
      "decision object must exist"
    );

    console.log(
      "TEST 1 PASS — decision-only probe returned safely"
    );
  }

  // TEST 2
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
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

    assert.equal(
      result.decision.incrementRetry,
      true
    );

    assert.equal(
      result.decision.terminal,
      false
    );

    console.log(
      "TEST 2 PASS — auditor_hold below limit → RETRY_DEVELOPER"
    );
  }

  // TEST 3
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        decisionKind: "auditor_hold",
        decisionRetryCount: 3,
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
      "HUMAN_REVIEW"
    );

    assert.equal(
      result.decision.incrementRetry,
      false
    );

    assert.equal(
      result.decision.terminal,
      true
    );

    console.log(
      "TEST 3 PASS — retry limit → HUMAN_REVIEW"
    );
  }

  // TEST 4
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        decisionKind: "unknown_kind",
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
      "HUMAN_REVIEW"
    );

    assert.equal(
      result.decision.reason,
      "UNKNOWN_RETRY_KIND"
    );

    console.log(
      "TEST 4 PASS — unknown kind → safe terminal decision"
    );
  }

  // TEST 5
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
      "TEST 5 PASS — STATE.md unchanged"
    );
  }

  // TEST 6
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
      "TEST 6 PASS — QUEUE.md unchanged"
    );
  }

  // TEST 7
  {
    assert.equal(
      fs.existsSync(lockPath),
      false
    );

    console.log(
      "TEST 7 PASS — no lifecycle lock created"
    );
  }

  // TEST 8
  {
    const result = await evaluateAndResume(
      statePath,
      queuePath,
      lockPath,
      null,
      {
        decisionOnly: true,
        decisionKind: "execution_failure",
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
      fs.existsSync(lockPath),
      false
    );

    console.log(
      "TEST 8 PASS — decision-only path performs no dispatch"
    );
  }

  // TEST 9
  {
    const kinds = [
      "auditor_hold",
      "execution_failure",
      "architect_retry",
    ];

    for (const kind of kinds) {
      const result = await evaluateAndResume(
        statePath,
        queuePath,
        lockPath,
        null,
        {
          decisionOnly: true,
          decisionKind: kind,
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

      assert.equal(
        result.decision.incrementRetry,
        true
      );

      assert.equal(
        result.decision.terminal,
        false
      );
    }

    console.log(
      "TEST 9 PASS — all retry kinds reach decision boundary"
    );
  }

  console.log("");
  console.log("B13-G4-4A RESULT");
  console.log("STATUS: PASS");
  console.log("EVALUATE_AND_RESUME_INTEGRATION: PASS");
  console.log("GET_RETRY_LIMIT: PASS");
  console.log("ROUTE_RETRY_DECISION: PASS");
  console.log("READ_ONLY: PASS");
  console.log("STATE_UNCHANGED: PASS");
  console.log("QUEUE_UNCHANGED: PASS");
  console.log("NO_LOCK: PASS");
  console.log("NO_DISPATCH: PASS");
  console.log("ISOLATION: PASS");

  console.log("");
  console.log("B13_G4_4A_RESPONSE_OK");
  console.log("TEST_007_B13_G4_4A_OK");

} catch (error) {
  console.error("");
  console.error("B13-G4-4A: ERROR");
  console.error(error);

  process.exitCode = 1;

} finally {
  try {
    fs.rmSync(tempDir, {
      recursive: true,
      force: true,
    });
  } catch { }
}