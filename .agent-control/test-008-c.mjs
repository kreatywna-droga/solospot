import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  executeAutonomousTaskCycle,
} from "./queue_watcher.mjs";

const TASK_ID = "TASK-008-C";
const DEPENDENCY_ID = "TASK-008-B";

console.log("TASK-008-C: START");
console.log("TASK-008-C: AUTONOMOUS TASK CYCLE VERIFICATION (multi-task batch, task 3)");

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "web-factor-008-c-")
);

const statePath = path.join(tempDir, "STATE.md");
const queuePath = path.join(tempDir, "QUEUE.md");
const lockPath = path.join(tempDir, ".claim.lock");

const task = {
  id: TASK_ID,
  type: "SYSTEM_INTEGRATION_TEST",
  dependencies: [DEPENDENCY_ID],
};

const devReport = `# TASK RESULT
TASK ID: ${TASK_ID}
STATUS: COMPLETE
FILES_CHANGED: NONE
VALIDATION: Verified
BLOCKERS: NONE
NEXT_ACTION: AUDIT`;

const auditReport = `# AUDIT RESULT
TASK ID: ${TASK_ID}
STATUS: PASS
AUDITED_FILES: NONE
VALIDATION: Verified
REGRESSION: NONE
UNAUTHORIZED_CHANGES: NONE
BLOCKERS: NONE
RECOMMENDATION: APPROVE`;

const dispatchOrder = [];
const orchestratorPrompts = [];

const mockBridge = {
  async dispatch(taskParam, context = {}, role = null) {
    const targetRole = role || context?.role || "developer";
    dispatchOrder.push(targetRole);
    if (targetRole === "orchestrator") {
      orchestratorPrompts.push(context?.task || "");
      return {
        dispatched: true,
        role: targetRole,
        response: `# ORCHESTRATOR RESULT\nTASK ID: ${taskParam.id}\nSTATUS: READY`,
      };
    }
    if (targetRole === "developer") {
      return { dispatched: true, role: targetRole, response: devReport };
    }
    if (targetRole === "auditor") {
      return { dispatched: true, role: targetRole, response: auditReport };
    }
    return {
      dispatched: true,
      role: targetRole,
      response: `# ORCHESTRATOR RESULT\nTASK ID: ${taskParam.id}\nSTATUS: READY`,
    };
  },
};

fs.writeFileSync(
  queuePath,
  `# TASK QUEUE

## ${DEPENDENCY_ID}
STATUS: COMPLETE
TYPE: SYSTEM_INTEGRATION_TEST
DEPENDENCIES: NONE
NEXT_STAGE: DONE

## ${TASK_ID}
STATUS: READY
TYPE: SYSTEM_INTEGRATION_TEST
DEPENDENCIES: ${DEPENDENCY_ID}
NEXT_STAGE: IN_PROGRESS
`,
  "utf8"
);

let cycleResult;
try {
  cycleResult = await executeAutonomousTaskCycle({
    task,
    statePath,
    queuePath,
    lockPath,
    bridge: mockBridge,
  });
} catch (err) {
  console.error("TASK-008-C: CYCLE ERROR:", err.message);
  process.exitCode = 1;
  throw err;
}

// ---- Assertion 1: cycle returns COMPLETE for the task ----
assert.equal(cycleResult.status, "COMPLETE", "cycle must complete");
assert.equal(cycleResult.taskId, TASK_ID, "taskId must match");

// ---- Assertion 2: state file reflects COMPLETE / AUDITOR / NO human review ----
const stateText = fs.readFileSync(statePath, "utf8");
const state = parseStateLines(stateText);
assert.equal(state.currentTask, TASK_ID, "state currentTask must match");
assert.equal(state.state, "COMPLETE", "final state must be COMPLETE");
assert.equal(state.lastAgent, "AUDITOR", "final lastAgent must be AUDITOR");
assert.equal(state.humanReviewRequired, "NO", "no human review required");

// ---- Assertion 3: queue status updated to COMPLETE ----
const queueText = fs.readFileSync(queuePath, "utf8");
const queueEntry = extractQueueEntry(queueText, TASK_ID);
assert.equal(queueEntry.status, "COMPLETE", "queue status must be COMPLETE");

// ---- Assertion 4: transitions ORCHESTRATOR -> DEVELOPER -> AUDITOR -> COMPLETE ----
assert.deepEqual(
  dispatchOrder,
  ["orchestrator", "developer", "auditor"],
  "cycle must dispatch in ORCHESTRATOR -> DEVELOPER -> AUDITOR order"
);
assert.equal(
  cycleResult.status,
  "COMPLETE",
  "cycle must conclude with COMPLETE transition"
);

// ---- Assertion 5: dependencies propagated to orchestrator prompt ----
assert.ok(orchestratorPrompts.length > 0, "orchestrator must be dispatched");
const depsExposed = orchestratorPrompts[0].includes(DEPENDENCY_ID);
assert.ok(depsExposed, "dependencies must be surfaced to orchestrator");
assert.ok(
  Array.isArray(task.dependencies) && task.dependencies.includes(DEPENDENCY_ID),
  "task dependencies array must include TASK-008-B"
);
const depStatus = extractQueueEntry(queueText, DEPENDENCY_ID);
assert.equal(
  depStatus.status,
  "COMPLETE",
  "dependency TASK-008-B must be resolved/COMPLETE"
);

console.log("TASK-008-C: DISPATCH ORDER:", JSON.stringify(dispatchOrder));
console.log("TASK-008-C: DEPENDENCIES:", JSON.stringify(task.dependencies));
console.log("TASK-008-C: FINAL STATE:", JSON.stringify(state));
console.log("TASK-008-C: QUEUE ENTRY:", JSON.stringify(queueEntry));
console.log("TASK-008-C: DEPENDENCY STATUS:", JSON.stringify(depStatus));
console.log("TASK-008-C: CYCLE RESULT:", JSON.stringify(cycleResult));
console.log("TASK-008-C: ALL ASSERTIONS PASSED");
console.log("TASK-008-C: COMPLETE");

function parseStateLines(text) {
  const out = {
    currentTask: null,
    state: null,
    lastAgent: null,
    humanReviewRequired: null,
  };
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.startsWith("CURRENT_TASK:")) out.currentTask = t.slice("CURRENT_TASK:".length).trim();
    else if (t.startsWith("STATE:")) out.state = t.slice("STATE:".length).trim();
    else if (t.startsWith("LAST_AGENT:")) out.lastAgent = t.slice("LAST_AGENT:".length).trim();
    else if (t.startsWith("HUMAN_REVIEW_REQUIRED:")) out.humanReviewRequired = t.slice("HUMAN_REVIEW_REQUIRED:".length).trim();
  }
  return out;
}

function extractQueueEntry(text, id) {
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => l.trim() === `## ${id}`);
  const entry = { status: null };
  for (let i = idx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (/^#{2,3}\s/.test(t)) break;
    if (t.startsWith("STATUS:")) entry.status = t.slice("STATUS:".length).trim();
  }
  return entry;
}
