import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

import { getRetryLimit } from "./queue_watcher.mjs";

console.log("B13-G4-2A: START");
console.log("B13-G4-2A: ISOLATED getRetryLimit TEST");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-b13-g4-2a-")
);

function writeConfig(name, value) {
  const filePath = path.join(tempDir, name);
  fs.writeFileSync(filePath, value, "utf8");
  return filePath;
}

try {
  // ----------------------------------------------------------
  // TEST 1 — valid positive integer
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "valid.json",
      JSON.stringify({ retryLimit: 5 })
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 5);

    console.log(
      "TEST 1 PASS — valid retryLimit 5 → 5"
    );
  }

  // ----------------------------------------------------------
  // TEST 2 — missing retryLimit
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "missing.json",
      JSON.stringify({ otherSetting: true })
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 2 PASS — missing retryLimit → default 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 3 — zero
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "zero.json",
      JSON.stringify({ retryLimit: 0 })
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 3 PASS — retryLimit 0 → default 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 4 — negative
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "negative.json",
      JSON.stringify({ retryLimit: -2 })
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 4 PASS — negative retryLimit → default 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 5 — fractional
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "fractional.json",
      JSON.stringify({ retryLimit: 2.5 })
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 5 PASS — fractional retryLimit → default 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 6 — string must NOT be coerced
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "string.json",
      JSON.stringify({ retryLimit: "5" })
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 3);

    console.log(
      'TEST 6 PASS — string "5" → default 3'
    );
  }

  // ----------------------------------------------------------
  // TEST 7 — malformed JSON
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "malformed.json",
      '{"retryLimit":'
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 7 PASS — malformed JSON → default 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 8 — nonexistent config
  // ----------------------------------------------------------

  {
    const config = path.join(
      tempDir,
      "does-not-exist.json"
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 8 PASS — missing file → default 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 9 — custom default
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "custom-default.json",
      JSON.stringify({ otherSetting: true })
    );

    const result = getRetryLimit(config, 7);

    assert.equal(result, 7);

    console.log(
      "TEST 9 PASS — custom default 7 preserved"
    );
  }

  // ----------------------------------------------------------
  // TEST 10 — invalid default
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "invalid-default.json",
      JSON.stringify({ otherSetting: true })
    );

    const result = getRetryLimit(config, 0);

    assert.equal(result, 3);

    console.log(
      "TEST 10 PASS — invalid default → internal fallback 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 11 — valid config overrides custom default
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "override.json",
      JSON.stringify({ retryLimit: 9 })
    );

    const result = getRetryLimit(config, 4);

    assert.equal(result, 9);

    console.log(
      "TEST 11 PASS — config value 9 overrides default 4"
    );
  }

  // ----------------------------------------------------------
  // TEST 12 — boolean is invalid
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "boolean.json",
      JSON.stringify({ retryLimit: true })
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 12 PASS — boolean retryLimit → default 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 13 — null is invalid
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "null.json",
      JSON.stringify({ retryLimit: null })
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 13 PASS — null retryLimit → default 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 14 — Infinity cannot come from JSON as a number
  // JSON parses it as invalid syntax, therefore default.
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "infinity.json",
      '{"retryLimit":Infinity}'
    );

    const result = getRetryLimit(config, 3);

    assert.equal(result, 3);

    console.log(
      "TEST 14 PASS — invalid Infinity JSON → default 3"
    );
  }

  // ----------------------------------------------------------
  // TEST 15 — helper does not modify config
  // ----------------------------------------------------------

  {
    const original = JSON.stringify(
      { retryLimit: 6 },
      null,
      2
    );

    const config = writeConfig(
      "readonly.json",
      original
    );

    const before = fs.readFileSync(
      config,
      "utf8"
    );

    const result = getRetryLimit(config, 3);

    const after = fs.readFileSync(
      config,
      "utf8"
    );

    assert.equal(result, 6);
    assert.equal(after, before);

    console.log(
      "TEST 15 PASS — configuration file unchanged"
    );
  }

  // ----------------------------------------------------------
  // TEST 16 — deterministic result
  // ----------------------------------------------------------

  {
    const config = writeConfig(
      "deterministic.json",
      JSON.stringify({ retryLimit: 8 })
    );

    const a = getRetryLimit(config, 3);
    const b = getRetryLimit(config, 3);

    assert.equal(a, 8);
    assert.equal(b, 8);
    assert.equal(a, b);

    console.log(
      "TEST 16 PASS — deterministic result"
    );
  }

  console.log("");
  console.log("B13-G4-2A RESULT");
  console.log("STATUS: PASS");
  console.log("FUNCTION: getRetryLimit()");
  console.log("VALID_CONFIG: PASS");
  console.log("DEFAULT_FALLBACK: PASS");
  console.log("INVALID_CONFIG: PASS");
  console.log("TYPE_VALIDATION: PASS");
  console.log("MALFORMED_JSON: PASS");
  console.log("MISSING_FILE: PASS");
  console.log("CUSTOM_DEFAULT: PASS");
  console.log("NO_CONFIG_WRITE: PASS");
  console.log("DETERMINISM: PASS");
  console.log("ISOLATION: PASS");

  console.log("");
  console.log("B13_G4_2A_RESPONSE_OK");
  console.log("TEST_007_B13_G4_2A_OK");

} catch (error) {

  console.error("");
  console.error("B13-G4-2A: ERROR");
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