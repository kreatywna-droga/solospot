import { runAgent } from "./opencode-adapter.mjs";

console.log("B13-G6-3: START");
console.log("B13-G6-3: FIX MODEL TYPE VALIDATION");

const task = `
WEB FACTOR — B13-G6-3

TASK_ID: TEST-007

ROLE: DEVELOPER
MODE: WRITE

OBJECTIVE:
Fix the model type validation in createDeveloperDispatchRequest().

TARGET:
.agent-control/queue_watcher.mjs

STRICT SCOPE:
Modify ONLY:
.agent-control/queue_watcher.mjs

CURRENT PROBLEM:
createDeveloperDispatchRequest() currently accepts non-string model
values by coercing them with String().

Example:

{
  taskId: "TEST-007",
  task: "Developer task",
  model: 12345
}

currently produces:

{
  valid: true,
  role: "developer",
  taskId: "TEST-007",
  task: "Developer task",
  model: "12345"
}

THIS IS WRONG.

==================================================
REQUIRED CONTRACT
==================================================

model is OPTIONAL.

If model is omitted:
    model: null

If model is null:
    model: null

If model is a non-empty string:
    preserve the trimmed string.

If model is an empty or whitespace-only string:
    model: null

If model is ANY OTHER TYPE:
    return:

{
  valid: false,
  reason: "INVALID_MODEL"
}

Therefore:

model: 12345
→ INVALID_MODEL

model: true
→ INVALID_MODEL

model: {}
→ INVALID_MODEL

model: []
→ INVALID_MODEL

model: ["model"]
→ INVALID_MODEL

model: null
→ valid with model: null

model: ""
→ valid with model: null

model: "   "
→ valid with model: null

model: " model-x "
→ valid with model: "model-x"

==================================================
IMPORTANT
==================================================

Do NOT change the existing taskId validation.

Do NOT change the existing task validation.

Do NOT change role validation.

Do NOT change role normalization.

Do NOT change output structure.

Do NOT change lifecycle behavior.

Do NOT modify evaluateAndResume().

Do NOT modify executeExecutionPlan().

Do NOT modify createExecutionPlan().

Do NOT modify routeRetryDecision().

Do NOT add dispatch.

Do NOT instantiate AgentExecutionBridge.

Do NOT write STATE.md.

Do NOT write QUEUE.md.

Do NOT modify DISPATCH.json.

Do NOT acquire or release locks.

==================================================
IMPLEMENTATION RULE
==================================================

Do NOT use:

String(model)

before validating the type.

First determine whether model is:

undefined
null
string
or invalid type.

Only strings may be trimmed.

==================================================
REGRESSION REQUIREMENTS
==================================================

Existing valid request must continue to produce:

{
  valid: true,
  role: "developer",
  taskId: "TEST-007",
  task: "Developer task",
  model: null
}

Existing model string must continue to work.

Existing uppercase Developer role must continue to normalize.

Auditor and architect must remain rejected.

Existing helpers must remain present.

==================================================
VALIDATION
==================================================

Run:

node --check .agent-control/queue_watcher.mjs

Then verify the helper with at least:

1. omitted model
2. null model
3. empty string
4. whitespace model
5. valid string
6. numeric model
7. boolean model
8. object model
9. array model

The numeric/boolean/object/array cases MUST return:

valid: false
reason: INVALID_MODEL

==================================================
FINAL RESPONSE
==================================================

B13-G6-3 IMPLEMENTATION RESULT

STATUS: PASS or BLOCKED

FILES_CHANGED:
- <exact files>

MODEL_VALIDATION:
<describe corrected behavior>

NUMBER_MODEL:
<result>

BOOLEAN_MODEL:
<result>

OBJECT_MODEL:
<result>

ARRAY_MODEL:
<result>

NULL_MODEL:
<result>

EMPTY_STRING_MODEL:
<result>

VALID_STRING_MODEL:
<result>

REGRESSION:
<confirm existing behavior preserved>

REAL_DISPATCH:
<confirm none>

STATE:
<confirm untouched>

QUEUE:
<confirm untouched>

DISPATCH_JSON:
<confirm untouched>

LOCK:
<confirm none>

VALIDATION:
<commands/results>

BLOCKERS:
<none or exact blocker>

NEXT_ACTION:
<one sentence>
`;

try {
  const result = await runAgent({
    role: "developer",
    task,
    cwd: process.cwd(),
  });

  console.log("");
  console.log("B13-G6-3: RESULT");
  console.log(JSON.stringify(result, null, 2));

  if (!result?.response) {
    throw new Error("B13-G6-3: NO_DEVELOPER_RESPONSE");
  }

  if (!/B13-G6-3 IMPLEMENTATION RESULT/i.test(result.response)) {
    throw new Error("B13-G6-3: INVALID_IMPLEMENTATION_RESULT");
  }

  console.log("");
  console.log("B13_G6_3_RESPONSE_OK");
  console.log("TEST_007_B13_G6_3_OK");

} catch (error) {
  console.error("");
  console.error("B13-G6-3: ERROR");
  console.error(error);
  process.exitCode = 1;
}