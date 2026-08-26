import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

import { getRetryLimit } from "./queue_watcher.mjs";

console.log("B13-G4-3: START");
console.log("B13-G4-3: CONFIGURATION/LIFECYCLE BOUNDARY TEST");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g4-3-")
);

function writeConfig(name, value) {
  const filePath = path.join(tempDir, name);
  fs.writeFileSync(filePath, value, "utf8");
  return filePath;
}

try {
  // ----------------------------------------------------------
  // TEST 1 — configured retry limit is readable
  // ----------------------------------------------------------

  {
    const configPath = writeConfig(
      "runner_config_valid.json",
      JSON.stringify({
        retryLimit: 5,
      })
    );

    const result = getRetryLimit(configPath, 3);

    assert.equal(result, 5);

    console.log(
      "TEST 1 PASS — lifecycle config boundary reads retryLimit=5"
    );
  }

  // ----------------------------------------------------------
  // TEST 2 — missing config falls back safely
  // ----------------------------------------------------------

  {
    const configPath = path.join(
      tempDir,
      "runner_config_missing.json"
    );

    const result = getRetryLimit(configPath, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 2 PASS — missing config → fallback 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 3 — malformed config falls back safely
  // ----------------------------------------------------------

  {
    const configPath = writeConfig(
      "runner_config_bad.json",
      '{"retryLimit":'
    );

    const result = getRetryLimit(configPath, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 3 PASS — malformed config → fallback 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 4 — invalid configured value cannot disable safety
  // ----------------------------------------------------------

  {
    const configPath = writeConfig(
      "runner_config_zero.json",
      JSON.stringify({
        retryLimit: 0,
      })
    );

    const result = getRetryLimit(configPath, 3);

    assert.equal(result, 3);
    assert.ok(result > 0);

    console.log(
      "TEST 4 PASS — retryLimit=0 cannot disable retry safety"
    );
  }

  // ----------------------------------------------------------
  // TEST 5 — string value is not coerced
  // ----------------------------------------------------------

  {
    const configPath = writeConfig(
      "runner_config_string.json",
      JSON.stringify({
        retryLimit: "5",
      })
    );

    const result = getRetryLimit(configPath, 3);

    assert.equal(result, 3);
    assert.equal(typeof result, "number");

    console.log(
      "TEST 5 PASS — string retryLimit rejected"
    );
  }

  // ----------------------------------------------------------
  // TEST 6 — custom fallback remains positive
  // ----------------------------------------------------------

  {
    const configPath = writeConfig(
      "runner_config_custom_default.json",
      JSON.stringify({})
    );

    const result = getRetryLimit(configPath, 7);

    assert.equal(result, 7);
    assert.ok(Number.isInteger(result));
    assert.ok(result > 0);

    console.log(
      "TEST 6 PASS — custom fallback 7 preserved"
    );
  }

  // ----------------------------------------------------------
  // TEST 7 — invalid default gets safe fallback
  // ----------------------------------------------------------

  {
    const configPath = writeConfig(
      "runner_config_invalid_default.json",
      JSON.stringify({})
    );

    const result = getRetryLimit(configPath, 0);

    assert.equal(result, 3);
    assert.ok(Number.isInteger(result));
    assert.ok(result > 0);

    console.log(
      "TEST 7 PASS — invalid default → safe 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 8 — config reader is read-only
  // ----------------------------------------------------------

  {
    const original = JSON.stringify(
      {
        retryLimit: 4,
      },
      null,
      2
    );

    const configPath = writeConfig(
      "runner_config_readonly.json",
      original
    );

    const before = fs.readFileSync(
      configPath,
      "utf8"
    );

    const result = getRetryLimit(configPath, 3);

    const after = fs.readFileSync(
      configPath,
      "utf8"
    );

    assert.equal(result, 4);
    assert.equal(after, before);

    console.log(
      "TEST 8 PASS — runner_config remains unchanged"
    );
  }

  // ----------------------------------------------------------
  // TEST 9 — no STATE.md mutation
  // ----------------------------------------------------------

  {
    const statePath = path.join(
      tempDir,
      "STATE.md"
    );

    const stateContent =
      "STATE: WAITING\nCURRENT_TASK: TEST-007\n";

    fs.writeFileSync(
      statePath,
      stateContent,
      "utf8"
    );

    const configPath = writeConfig(
      "runner_config_state_check.json",
      JSON.stringify({
        retryLimit: 6,
      })
    );

    const result = getRetryLimit(configPath, 3);

    const after = fs.readFileSync(
      statePath,
      "utf8"
    );

    assert.equal(result, 6);
    assert.equal(after, stateContent);

    console.log(
      "TEST 9 PASS — STATE.md untouched"
    );
  }

  // ----------------------------------------------------------
  // TEST 10 — no QUEUE.md mutation
  // ----------------------------------------------------------

  {
    const queuePath = path.join(
      tempDir,
      "QUEUE.md"
    );

    const queueContent =
      "## TEST-007\nSTATUS: READY\n";

    fs.writeFileSync(
      queuePath,
      queueContent,
      "utf8"
    );

    const configPath = writeConfig(
      "runner_config_queue_check.json",
      JSON.stringify({
        retryLimit: 8,
      })
    );

    const result = getRetryLimit(configPath, 3);

    const after = fs.readFileSync(
      queuePath,
      "utf8"
    );

    assert.equal(result, 8);
    assert.equal(after, queueContent);

    console.log(
      "TEST 10 PASS — QUEUE.md untouched"
    );
  }

  // ----------------------------------------------------------
  // TEST 11 — no DISPATCH.json mutation
  // ----------------------------------------------------------

  {
    const dispatchPath = path.join(
      tempDir,
      "DISPATCH.json"
    );

    const dispatchContent =
      '{"event":"TEST","state":"IN_PROGRESS"}';

    fs.writeFileSync(
      dispatchPath,
      dispatchContent,
      "utf8"
    );

    const configPath = writeConfig(
      "runner_config_dispatch_check.json",
      JSON.stringify({
        retryLimit: 2,
      })
    );

    const result = getRetryLimit(configPath, 3);

    const after = fs.readFileSync(
      dispatchPath,
      "utf8"
    );

    assert.equal(result, 2);
    assert.equal(after, dispatchContent);

    console.log(
      "TEST 11 PASS — DISPATCH.json untouched"
    );
  }

  // ----------------------------------------------------------
  // TEST 12 — deterministic read
  // ----------------------------------------------------------

  {
    const configPath = writeConfig(
      "runner_config_deterministic.json",
      JSON.stringify({
        retryLimit: 9,
      })
    );

    const a = getRetryLimit(configPath, 3);
    const b = getRetryLimit(configPath, 3);

    assert.equal(a, 9);
    assert.equal(b, 9);
    assert.equal(a, b);

    console.log(
      "TEST 12 PASS — deterministic configuration read"
    );
  }

  // ----------------------------------------------------------
  // TEST 13 — boundary remains separate from routing
  // ----------------------------------------------------------

  {
    const configPath = writeConfig(
      "runner_config_routing_boundary.json",
      JSON.stringify({
        retryLimit: 3,
      })
    );

    const result = getRetryLimit(configPath, 3);

    assert.equal(result, 3);

    /*
      This test intentionally does NOT call:
      - routeRetryDecision()
      - evaluateAndResume()
      - AgentExecutionBridge
      - writeState()
      - markQueueStatus()

      G4-3 only establishes the configuration boundary.
    */

    console.log(
      "TEST 13 PASS — configuration boundary remains isolated from routing"
    );
  }

  console.log("");
  console.log("B13-G4-3 RESULT");
  console.log("STATUS: PASS");
  console.log("CONFIG_READ: PASS");
  console.log("SAFE_FALLBACK: PASS");
  console.log("INVALID_CONFIG_SAFETY: PASS");
  console.log("CONFIG_WRITE: NO");
  console.log("STATE_WRITE: NO");
  console.log("QUEUE_WRITE: NO");
  console.log("DISPATCH_WRITE: NO");
  console.log("ROUTING: NOT_INTEGRATED");
  console.log("DISPATCH: NOT_INTEGRATED");
  console.log("ISOLATION: PASS");
  console.log("DETERMINISM: PASS");

  console.log("");
  console.log("B13_G4_3_RESPONSE_OK");
  console.log("TEST_007_B13_G4_3_OK");

} catch (error) {

  console.error("");
  console.error("B13-G4-3: ERROR");
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