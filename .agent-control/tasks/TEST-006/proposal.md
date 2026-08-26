# TEST-006: Control-Plane Queue Watcher & Autonomous Resume Proposal

## 1. Objective
Enable the Orchestrator to automatically resume from `STATE: WAITING` whenever an executable `READY` task appears in `.agent-control/QUEUE.md`, without requiring human intervention or altering any production code.

## 2. Architecture & Design Specification

### 2.1. Component Location
- Script: `.agent-control/queue_watcher.mjs`
- Test Suite: `.agent-control/tasks/TEST-006/test_watcher.mjs`
- Log Destination: `.agent-control/watcher.log`

### 2.2. Watcher / Trigger Strategy
- Hybrid Strategy: Uses polling (e.g. 500ms intervals) combined with sha256 checksum tracking of `QUEUE.md` and `STATE.md`.
- Prevents CPU spinning and eliminates race conditions.

### 2.3. Queue Parsing & Dependency Resolution Algorithm
1. Read `.agent-control/STATE.md`:
   - If `STATE !== 'WAITING'`, watcher remains in passive monitoring mode.
2. Read `.agent-control/QUEUE.md`:
   - Tokenize task sections (e.g. `### TASK_ID` or `## TASK_ID`).
   - Extract `STATUS`, `DEPENDENCIES`, and `TYPE`.
3. Filter tasks:
   - Exclude tasks where `STATUS !== 'READY'`.
   - For each `READY` task, verify that all declared `DEPENDENCIES` are currently marked `COMPLETE` in `QUEUE.md`.
4. Selection:
   - Select the first valid `READY` task whose dependencies are satisfied.

### 2.4. Duplicate Execution Protection & Idempotency
- Before updating `STATE.md`, check if the selected task is already `COMPLETE` or currently `IN_PROGRESS`.
- If `CURRENT_TASK` matches the candidate task and `STATE` is not `WAITING`, no action is taken.

### 2.5. State Transition Rules
- If an eligible `READY` task (e.g. `TEST-005-B`) is found while `STATE: WAITING`:
  - `STATE` becomes `IN_PROGRESS` (or dispatches Developer).
  - `CURRENT_TASK` is set to `<TASK_ID>`.
  - `LAST_AGENT` is set to `ORCHESTRATOR`.
  - `BLOCKER` is cleared from `QUEUE_EMPTY` to `NONE`.
  - `NEXT_ACTION` is set to `Start <TASK_ID> with Developer.`.
  - Event is appended to `.agent-control/watcher.log`.

### 2.6. Failure & Exception Handling
- Syntax Error: If markdown parsing fails due to incomplete file write, watcher retries after debounce delay without crashing.
- File lock protection: Gracefully handles concurrent read/write.

### 2.7. Execution Modes
- `--single-run`: Evaluates current state once and exits (ideal for deterministic test runners).
- `--watch`: Runs continuously as a background daemon process.
