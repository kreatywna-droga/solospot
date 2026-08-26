import assert from "node:assert/strict";

import {
  createDeveloperDispatchRequest,
} from "./queue_watcher.mjs";

console.log("B13-G6-2: START");
console.log("B13-G6-2: ISOLATED DEVELOPER DISPATCH CONTRACT TEST");

// TEST 1 — minimal valid request
{
  const result = createDeveloperDispatchRequest({
    taskId: "TEST-007",
    task: "Execute developer retry task",
  });

  assert.deepEqual(result, {
    valid: true,
    role: "developer",
    taskId: "TEST-007",
    task: "Execute developer retry task",
    model: null,
  });

  console.log("TEST 1 PASS — minimal valid Developer request");
}

// TEST 2 — optional model
{
  const result = createDeveloperDispatchRequest({
    taskId: "TEST-007",
    task: "Execute developer retry task",
    model: "opencode/deepseek-v4-flash-free",
  });

  assert.equal(result.valid, true);
  assert.equal(result.role, "developer");
  assert.equal(result.model, "opencode/deepseek-v4-flash-free");

  console.log("TEST 2 PASS — optional model preserved");
}

// TEST 3 — role normalization
{
  const result = createDeveloperDispatchRequest({
    taskId: "TEST-007",
    task: "Developer task",
    role: "DEVELOPER",
  });

  assert.equal(result.valid, true);
  assert.equal(result.role, "developer");

  console.log("TEST 3 PASS — Developer role normalized");
}

// TEST 4 — auditor rejected
{
  const result = createDeveloperDispatchRequest({
    taskId: "TEST-007",
    task: "Invalid role test",
    role: "auditor",
  });

  assert.deepEqual(result, {
    valid: false,
    reason: "INVALID_ROLE",
  });

  console.log("TEST 4 PASS — auditor role rejected");
}

// TEST 5 — architect rejected
{
  const result = createDeveloperDispatchRequest({
    taskId: "TEST-007",
    task: "Invalid role test",
    role: "architect",
  });

  assert.deepEqual(result, {
    valid: false,
    reason: "INVALID_ROLE",
  });

  console.log("TEST 5 PASS — architect role rejected");
}

// TEST 6 — missing taskId
{
  const result = createDeveloperDispatchRequest({
    task: "Developer task",
  });

  assert.deepEqual(result, {
    valid: false,
    reason: "MISSING_TASK_ID",
  });

  console.log("TEST 6 PASS — missing taskId rejected");
}

// TEST 7 — empty taskId
{
  const result = createDeveloperDispatchRequest({
    taskId: "   ",
    task: "Developer task",
  });

  assert.equal(result.valid, false);
  assert.equal(result.reason, "MISSING_TASK_ID");

  console.log("TEST 7 PASS — empty taskId rejected");
}

// TEST 8 — missing task
{
  const result = createDeveloperDispatchRequest({
    taskId: "TEST-007",
  });

  assert.deepEqual(result, {
    valid: false,
    reason: "MISSING_TASK",
  });

  console.log("TEST 8 PASS — missing task rejected");
}

// TEST 9 — empty task
{
  const result = createDeveloperDispatchRequest({
    taskId: "TEST-007",
    task: "   ",
  });

  assert.equal(result.valid, false);
  assert.equal(result.reason, "MISSING_TASK");

  console.log("TEST 9 PASS — empty task rejected");
}

// TEST 10 — invalid model type
{
  const result = createDeveloperDispatchRequest({
    taskId: "TEST-007",
    task: "Developer task",
    model: 12345,
  });

  assert.deepEqual(result, {
    valid: false,
    reason: "INVALID_MODEL",
  });

  console.log("TEST 10 PASS — invalid model type rejected");
}

// TEST 11 — input immutability
{
  const input = {
    taskId: "TEST-007",
    task: "Developer task",
    role: "DEVELOPER",
    model: "model-x",
  };

  const before = JSON.stringify(input);

  const result = createDeveloperDispatchRequest(input);

  assert.equal(result.valid, true);
  assert.equal(JSON.stringify(input), before);

  console.log("TEST 11 PASS — input object unchanged");
}

// TEST 12 — deterministic result
{
  const input = {
    taskId: "TEST-007",
    task: "Developer task",
    role: "developer",
    model: "model-x",
  };

  const first = createDeveloperDispatchRequest(input);
  const second = createDeveloperDispatchRequest(input);

  assert.deepEqual(first, second);

  console.log("TEST 12 PASS — deterministic output");
}

// TEST 13 — arbitrary role rejected
{
  const result = createDeveloperDispatchRequest({
    taskId: "TEST-007",
    task: "Developer task",
    role: "admin",
  });

  assert.deepEqual(result, {
    valid: false,
    reason: "INVALID_ROLE",
  });

  console.log("TEST 13 PASS — arbitrary role rejected");
}

// TEST 14 — null input fails safely
{
  const result = createDeveloperDispatchRequest(null);

  assert.equal(result.valid, false);
  assert.ok(result.reason);

  console.log("TEST 14 PASS — null input fails safely");
}

// TEST 15 — undefined input fails safely
{
  const result = createDeveloperDispatchRequest(undefined);

  assert.equal(result.valid, false);
  assert.ok(result.reason);

  console.log("TEST 15 PASS — undefined input fails safely");
}

// TEST 16 — no dispatch capability exposed
{
  const result = createDeveloperDispatchRequest({
    taskId: "TEST-007",
    task: "Developer task",
  });

  assert.equal(result.valid, true);

  assert.equal(
    Object.prototype.hasOwnProperty.call(result, "dispatch"),
    false
  );

  assert.equal(
    Object.prototype.hasOwnProperty.call(result, "bridge"),
    false
  );

  console.log(
    "TEST 16 PASS — request contains no dispatch capability"
  );
}

console.log("");
console.log("B13-G6-2 RESULT");
console.log("STATUS: PASS");
console.log("VALID_REQUEST: PASS");
console.log("OPTIONAL_MODEL: PASS");
console.log("ROLE_NORMALIZATION: PASS");
console.log("ROLE_BOUNDARY: PASS");
console.log("MISSING_INPUT_SAFETY: PASS");
console.log("INVALID_INPUT_SAFETY: PASS");
console.log("IMMUTABILITY: PASS");
console.log("DETERMINISM: PASS");
console.log("NO_DISPATCH_CAPABILITY: PASS");
console.log("ISOLATION: PASS");

console.log("");
console.log("B13_G6_2_RESPONSE_OK");
console.log("TEST_007_B13_G6_2_OK");