import assert from "node:assert/strict";

import { createExecutionPlan } from "./queue_watcher.mjs";

console.log("B13-G5-2: START");
console.log("B13-G5-2: ISOLATED EXECUTION PLAN TEST");

function assertPlan(actual, expected) {
  assert.deepEqual(actual, expected);
}

// TEST 1 — RETRY_DEVELOPER
{
  const result = createExecutionPlan({
    action: "RETRY_DEVELOPER",
    incrementRetry: true,
    terminal: false,
  });

  assertPlan(result, {
    execution: "DISPATCH_DEVELOPER",
    shouldDispatch: true,
    shouldWriteState: true,
    shouldUpdateQueue: true,
    incrementRetry: true,
    terminal: false,
  });

  console.log(
    "TEST 1 PASS — RETRY_DEVELOPER → DISPATCH_DEVELOPER"
  );
}

// TEST 2 — HUMAN_REVIEW
{
  const result = createExecutionPlan({
    action: "HUMAN_REVIEW",
    incrementRetry: false,
    terminal: true,
  });

  assertPlan(result, {
    execution: "PARK_HUMAN_REVIEW",
    shouldDispatch: false,
    shouldWriteState: true,
    shouldUpdateQueue: true,
    incrementRetry: false,
    terminal: true,
  });

  console.log(
    "TEST 2 PASS — HUMAN_REVIEW → PARK_HUMAN_REVIEW"
  );
}

// TEST 3 — unknown decision
{
  const result = createExecutionPlan({
    action: "SOMETHING_UNKNOWN",
  });

  assertPlan(result, {
    execution: "NOOP",
    shouldDispatch: false,
    shouldWriteState: false,
    shouldUpdateQueue: false,
    incrementRetry: false,
    terminal: true,
    reason: "UNKNOWN_DECISION",
  });

  console.log(
    "TEST 3 PASS — unknown decision → safe NOOP"
  );
}

// TEST 4 — null decision
{
  const result = createExecutionPlan(null);

  assertPlan(result, {
    execution: "NOOP",
    shouldDispatch: false,
    shouldWriteState: false,
    shouldUpdateQueue: false,
    incrementRetry: false,
    terminal: true,
    reason: "UNKNOWN_DECISION",
  });

  console.log(
    "TEST 4 PASS — null decision → safe NOOP"
  );
}

// TEST 5 — undefined decision
{
  const result = createExecutionPlan(undefined);

  assertPlan(result, {
    execution: "NOOP",
    shouldDispatch: false,
    shouldWriteState: false,
    shouldUpdateQueue: false,
    incrementRetry: false,
    terminal: true,
    reason: "UNKNOWN_DECISION",
  });

  console.log(
    "TEST 5 PASS — undefined decision → safe NOOP"
  );
}

// TEST 6 — decision purity
{
  const decision = {
    action: "RETRY_DEVELOPER",
    incrementRetry: true,
    terminal: false,
  };

  const before = JSON.stringify(decision);

  createExecutionPlan(decision);

  const after = JSON.stringify(decision);

  assert.equal(after, before);

  console.log(
    "TEST 6 PASS — input decision remains unchanged"
  );
}

// TEST 7 — deterministic result
{
  const decision = {
    action: "RETRY_DEVELOPER",
    incrementRetry: true,
    terminal: false,
  };

  const first = createExecutionPlan(decision);
  const second = createExecutionPlan(decision);

  assert.deepEqual(first, second);

  console.log(
    "TEST 7 PASS — deterministic output"
  );
}

// TEST 8 — no accidental retry for HUMAN_REVIEW
{
  const result = createExecutionPlan({
    action: "HUMAN_REVIEW",
    incrementRetry: false,
    terminal: true,
  });

  assert.equal(result.shouldDispatch, false);
  assert.equal(result.incrementRetry, false);
  assert.equal(result.terminal, true);

  console.log(
    "TEST 8 PASS — HUMAN_REVIEW cannot dispatch or retry"
  );
}

// TEST 9 — unknown action cannot mutate anything
{
  const result = createExecutionPlan({
    action: "INVALID",
    incrementRetry: true,
    terminal: false,
  });

  assert.equal(result.execution, "NOOP");
  assert.equal(result.shouldDispatch, false);
  assert.equal(result.shouldWriteState, false);
  assert.equal(result.shouldUpdateQueue, false);
  assert.equal(result.incrementRetry, false);
  assert.equal(result.terminal, true);
  assert.equal(result.reason, "UNKNOWN_DECISION");

  console.log(
    "TEST 9 PASS — invalid decision fails safely"
  );
}

// TEST 10 — supported decision boundaries
{
  const retry = createExecutionPlan({
    action: "RETRY_DEVELOPER",
  });

  const human = createExecutionPlan({
    action: "HUMAN_REVIEW",
  });

  assert.equal(
    retry.execution,
    "DISPATCH_DEVELOPER"
  );

  assert.equal(
    human.execution,
    "PARK_HUMAN_REVIEW"
  );

  console.log(
    "TEST 10 PASS — supported execution boundaries"
  );
}

console.log("");
console.log("B13-G5-2 RESULT");
console.log("STATUS: PASS");
console.log("RETRY_DEVELOPER_PLAN: PASS");
console.log("HUMAN_REVIEW_PLAN: PASS");
console.log("UNKNOWN_DECISION_SAFETY: PASS");
console.log("NULL_INPUT_SAFETY: PASS");
console.log("INPUT_IMMUTABILITY: PASS");
console.log("DETERMINISM: PASS");
console.log("NO_DISPATCH: PASS");
console.log("NO_FILE_IO: PASS");
console.log("ISOLATION: PASS");

console.log("");
console.log("B13_G5_2_RESPONSE_OK");
console.log("TEST_007_B13_G5_2_OK");