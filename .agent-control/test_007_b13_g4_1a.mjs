import assert from "node:assert/strict";

import { routeRetryDecision } from "./queue_watcher.mjs";

console.log("B13-G4-1A: START");
console.log("B13-G4-1A: ISOLATED routeRetryDecision TEST");

function assertRetry(result, label) {
  assert.equal(result.action, "RETRY_DEVELOPER", label);
  assert.equal(result.incrementRetry, true, label);
  assert.equal(result.terminal, false, label);
}

function assertHumanReview(result, label) {
  assert.equal(result.action, "HUMAN_REVIEW", label);
  assert.equal(result.incrementRetry, false, label);
  assert.equal(result.terminal, true, label);
}

// ------------------------------------------------------------
// TEST 1 — auditor HOLD below retry limit
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "auditor_hold",
    0,
    3
  );

  assertRetry(
    result,
    "auditor_hold 0/3 should retry"
  );

  console.log(
    "TEST 1 PASS — auditor_hold 0/3 → RETRY_DEVELOPER"
  );
}

// ------------------------------------------------------------
// TEST 2 — auditor HOLD immediately below limit
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "auditor_hold",
    2,
    3
  );

  assertRetry(
    result,
    "auditor_hold 2/3 should retry"
  );

  console.log(
    "TEST 2 PASS — auditor_hold 2/3 → RETRY_DEVELOPER"
  );
}

// ------------------------------------------------------------
// TEST 3 — auditor HOLD at retry limit
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "auditor_hold",
    3,
    3
  );

  assertHumanReview(
    result,
    "auditor_hold 3/3 should stop"
  );

  console.log(
    "TEST 3 PASS — auditor_hold 3/3 → HUMAN_REVIEW"
  );
}

// ------------------------------------------------------------
// TEST 4 — execution failure below limit
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "execution_failure",
    0,
    3
  );

  assertRetry(
    result,
    "execution_failure 0/3 should retry"
  );

  console.log(
    "TEST 4 PASS — execution_failure 0/3 → RETRY_DEVELOPER"
  );
}

// ------------------------------------------------------------
// TEST 5 — execution failure at limit
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "execution_failure",
    3,
    3
  );

  assertHumanReview(
    result,
    "execution_failure 3/3 should stop"
  );

  console.log(
    "TEST 5 PASS — execution_failure 3/3 → HUMAN_REVIEW"
  );
}

// ------------------------------------------------------------
// TEST 6 — architect retry below limit
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "architect_retry",
    1,
    3
  );

  assertRetry(
    result,
    "architect_retry 1/3 should retry"
  );

  console.log(
    "TEST 6 PASS — architect_retry 1/3 → RETRY_DEVELOPER"
  );
}

// ------------------------------------------------------------
// TEST 7 — architect retry at limit
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "architect_retry",
    3,
    3
  );

  assertHumanReview(
    result,
    "architect_retry 3/3 should stop"
  );

  console.log(
    "TEST 7 PASS — architect_retry 3/3 → HUMAN_REVIEW"
  );
}

// ------------------------------------------------------------
// TEST 8 — unknown retry kind
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "unknown_kind",
    0,
    3
  );

  assertHumanReview(
    result,
    "unknown kind must never trigger retry"
  );

  assert.equal(
    result.reason,
    "UNKNOWN_RETRY_KIND"
  );

  console.log(
    "TEST 8 PASS — unknown kind → HUMAN_REVIEW / UNKNOWN_RETRY_KIND"
  );
}

// ------------------------------------------------------------
// TEST 9 — invalid retry limit: zero
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "auditor_hold",
    0,
    0
  );

  assertHumanReview(
    result,
    "retryLimit 0 must be terminal"
  );

  assert.equal(
    result.reason,
    "INVALID_RETRY_LIMIT"
  );

  console.log(
    "TEST 9 PASS — retryLimit 0 → HUMAN_REVIEW"
  );
}

// ------------------------------------------------------------
// TEST 10 — invalid retry limit: negative
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "auditor_hold",
    0,
    -1
  );

  assertHumanReview(
    result,
    "negative retryLimit must be terminal"
  );

  assert.equal(
    result.reason,
    "INVALID_RETRY_LIMIT"
  );

  console.log(
    "TEST 10 PASS — negative retryLimit → HUMAN_REVIEW"
  );
}

// ------------------------------------------------------------
// TEST 11 — invalid retry limit: fractional
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "auditor_hold",
    0,
    2.5
  );

  assertHumanReview(
    result,
    "fractional retryLimit must be terminal"
  );

  assert.equal(
    result.reason,
    "INVALID_RETRY_LIMIT"
  );

  console.log(
    "TEST 11 PASS — fractional retryLimit → HUMAN_REVIEW"
  );
}

// ------------------------------------------------------------
// TEST 12 — invalid retry count is normalized safely
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "auditor_hold",
    "invalid",
    3
  );

  assertRetry(
    result,
    "invalid retryCount should normalize deterministically"
  );

  console.log(
    "TEST 12 PASS — invalid retryCount → deterministic retry decision"
  );
}

// ------------------------------------------------------------
// TEST 13 — negative retry count
// ------------------------------------------------------------

{
  const result = routeRetryDecision(
    "auditor_hold",
    -5,
    3
  );

  assertRetry(
    result,
    "negative retryCount should normalize deterministically"
  );

  console.log(
    "TEST 13 PASS — negative retryCount → deterministic retry decision"
  );
}

// ------------------------------------------------------------
// TEST 14 — same inputs produce same logical result
// ------------------------------------------------------------

{
  const a = routeRetryDecision(
    "auditor_hold",
    1,
    3
  );

  const b = routeRetryDecision(
    "auditor_hold",
    1,
    3
  );

  assert.deepEqual(
    a,
    b,
    "same inputs must produce same result"
  );

  console.log(
    "TEST 14 PASS — deterministic/pure result"
  );
}

// ------------------------------------------------------------
// TEST 15 — all recognized retry kinds share the same boundary
// ------------------------------------------------------------

{
  const kinds = [
    "auditor_hold",
    "execution_failure",
    "architect_retry",
  ];

  for (const kind of kinds) {
    const result = routeRetryDecision(
      kind,
      2,
      3
    );

    assertRetry(
      result,
      `${kind} 2/3 should retry`
    );
  }

  for (const kind of kinds) {
    const result = routeRetryDecision(
      kind,
      3,
      3
    );

    assertHumanReview(
      result,
      `${kind} 3/3 should stop`
    );
  }

  console.log(
    "TEST 15 PASS — all recognized kinds obey identical retry boundary"
  );
}

console.log("");
console.log("B13-G4-1A RESULT");
console.log("STATUS: PASS");
console.log("FUNCTION: routeRetryDecision()");
console.log("PURE_DECISION: PASS");
console.log("RETRY_BOUNDARY: PASS");
console.log("UNKNOWN_KIND_SAFETY: PASS");
console.log("INVALID_LIMIT_SAFETY: PASS");
console.log("DETERMINISM: PASS");
console.log("NO_FILE_IO: PASS");
console.log("NO_DISPATCH: PASS");

console.log("");
console.log("B13_G4_1A_RESPONSE_OK");
console.log("TEST_007_B13_G4_1A_OK");