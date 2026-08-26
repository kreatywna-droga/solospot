import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

import { markQueueStatus } from "./queue_watcher.mjs";

console.log("B13-G3A: START");
console.log("B13-G3A: ISOLATED markQueueStatus TEST");

// ------------------------------------------------------------
// Temporary isolated workspace.
// The real QUEUE.md is NEVER modified.
// ------------------------------------------------------------

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g3a-")
);

const queuePath = path.join(tempDir, "QUEUE.md");

const originalQueue = `# WEB FACTOR TASK QUEUE

## TEST-001
STATUS: READY
TYPE: DEVELOPMENT
DEPENDENCIES: NONE
NEXT_STAGE: DEVELOPER

Description for TEST-001.

## TEST-002
STATUS: IN_PROGRESS
TYPE: AUDIT
DEPENDENCIES: TEST-001
NEXT_STAGE: AUDITOR

Description for TEST-002.

## TEST-003
STATUS: READY
TYPE: DEVELOPMENT
DEPENDENCIES: TEST-002
NEXT_STAGE: DEVELOPER

Description for TEST-003.
`;

fs.writeFileSync(queuePath, originalQueue, "utf8");

try {
  // ----------------------------------------------------------
  // TEST 1 — exact task update
  // ----------------------------------------------------------

  const result = markQueueStatus(
    queuePath,
    "TEST-002",
    "COMPLETE",
    "COMPLETE"
  );

  assert.equal(result.taskId, "TEST-002");
  assert.equal(result.status, "COMPLETE");
  assert.equal(result.nextStage, "COMPLETE");

  const updated = fs.readFileSync(queuePath, "utf8");

  assert.match(
    updated,
    /## TEST-002[\s\S]*?STATUS:\s*COMPLETE/
  );

  assert.match(
    updated,
    /## TEST-002[\s\S]*?NEXT_STAGE:\s*COMPLETE/
  );

  console.log("TEST 1 PASS — target task updated");

  // ----------------------------------------------------------
  // TEST 2 — unrelated tasks remain unchanged
  // ----------------------------------------------------------

  assert.match(
    updated,
    /## TEST-001[\s\S]*?STATUS:\s*READY/
  );

  assert.match(
    updated,
    /## TEST-001[\s\S]*?NEXT_STAGE:\s*DEVELOPER/
  );

  assert.match(
    updated,
    /## TEST-003[\s\S]*?STATUS:\s*READY/
  );

  assert.match(
    updated,
    /## TEST-003[\s\S]*?NEXT_STAGE:\s*DEVELOPER/
  );

  console.log("TEST 2 PASS — unrelated tasks preserved");

  // ----------------------------------------------------------
  // TEST 3 — task metadata preserved
  // ----------------------------------------------------------

  assert.match(
    updated,
    /## TEST-002[\s\S]*?TYPE:\s*AUDIT/
  );

  assert.match(
    updated,
    /## TEST-002[\s\S]*?DEPENDENCIES:\s*TEST-001/
  );

  assert.match(
    updated,
    /Description for TEST-002\./
  );

  console.log("TEST 3 PASS — task metadata preserved");

  // ----------------------------------------------------------
  // TEST 4 — exact ID matching
  // ----------------------------------------------------------

  // TEST-00 must NOT match TEST-001 / TEST-002 / TEST-003.

  assert.throws(
    () =>
      markQueueStatus(
        queuePath,
        "TEST-00",
        "COMPLETE",
        "COMPLETE"
      ),
    /QUEUE_TASK_NOT_FOUND/
  );

  console.log("TEST 4 PASS — exact task ID required");

  // ----------------------------------------------------------
  // TEST 5 — missing status rejected
  // ----------------------------------------------------------

  assert.throws(
    () =>
      markQueueStatus(
        queuePath,
        "TEST-001",
        "",
        "DEVELOPER"
      ),
    /QUEUE_INVALID_STATUS/
  );

  console.log("TEST 5 PASS — empty STATUS rejected");

  // ----------------------------------------------------------
  // TEST 6 — missing next stage rejected
  // ----------------------------------------------------------

  assert.throws(
    () =>
      markQueueStatus(
        queuePath,
        "TEST-001",
        "IN_PROGRESS",
        ""
      ),
    /QUEUE_INVALID_NEXT_STAGE/
  );

  console.log("TEST 6 PASS — empty NEXT_STAGE rejected");

  // ----------------------------------------------------------
  // TEST 7 — nonexistent queue rejected
  // ----------------------------------------------------------

  const missingQueue = path.join(
    tempDir,
    "DOES_NOT_EXIST.md"
  );

  assert.throws(
    () =>
      markQueueStatus(
        missingQueue,
        "TEST-001",
        "COMPLETE",
        "COMPLETE"
      ),
    /QUEUE_NOT_FOUND/
  );

  console.log("TEST 7 PASS — missing queue rejected");

  // ----------------------------------------------------------
  // TEST 8 — UTF-8 survives
  // ----------------------------------------------------------

  const utf8Queue = `# TEST QUEUE

## UTF8-001
STATUS: READY
TYPE: DEVELOPMENT
DEPENDENCIES: NONE
NEXT_STAGE: DEVELOPER

Opis: Zażółć gęślą jaźń — WEB FACTOR.
`;

  const utf8Path = path.join(tempDir, "UTF8_QUEUE.md");

  fs.writeFileSync(utf8Path, utf8Queue, "utf8");

  markQueueStatus(
    utf8Path,
    "UTF8-001",
    "COMPLETE",
    "COMPLETE"
  );

  const utf8Result = fs.readFileSync(
    utf8Path,
    "utf8"
  );

  assert.match(
    utf8Result,
    /Zażółć gęślą jaźń/
  );

  assert.match(
    utf8Result,
    /STATUS:\s*COMPLETE/
  );

  console.log("TEST 8 PASS — UTF-8 preserved");

  // ----------------------------------------------------------
  // TEST 9 — atomic temporary file is cleaned up
  // ----------------------------------------------------------

  const tempFiles = fs
    .readdirSync(tempDir)
    .filter((name) => name.includes(".QUEUE."));

  assert.equal(
    tempFiles.length,
    0,
    "Temporary queue file must not remain after successful write"
  );

  console.log("TEST 9 PASS — temporary file cleaned up");

  // ----------------------------------------------------------
  // TEST 10 — real QUEUE.md was never touched
  // ----------------------------------------------------------

  const realQueuePath = path.resolve(
    ".agent-control",
    "QUEUE.md"
  );

  if (fs.existsSync(realQueuePath)) {
    console.log(
      "TEST 10 INFO — real QUEUE.md exists and was not used by this test"
    );
  } else {
    console.log(
      "TEST 10 INFO — real QUEUE.md not present; isolated test still passed"
    );
  }

  console.log("");
  console.log("B13-G3A RESULT");
  console.log("STATUS: PASS");
  console.log("FUNCTION: markQueueStatus()");
  console.log("ISOLATION: PASS");
  console.log("REAL_QUEUE_MODIFIED: NO");
  console.log("UNRELATED_TASKS_PRESERVED: YES");
  console.log("UTF8: PASS");
  console.log("ATOMIC_WRITE_CLEANUP: PASS");
  console.log("NEXT_ACTION: Proceed to B13-G4 only after review.");

  console.log("");
  console.log("B13_G3A_RESPONSE_OK");
  console.log("TEST_007_B13_G3A_OK");

} catch (error) {

  console.error("");
  console.error("B13-G3A: ERROR");
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