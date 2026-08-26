import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseState,
  parseQueue,
  findNextExecutableTask,
  evaluateAndResume,
  AgentExecutionBridge,
  acquireLock,
  releaseLock,
} from '../../queue_watcher.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, 'temp_test_env');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const mockStateFile = path.join(tempDir, 'STATE.md');
const mockQueueFile = path.join(tempDir, 'QUEUE.md');
const mockLockFile = path.join(tempDir, '.claim.lock');
const mockSignalFile = path.join(tempDir, 'DISPATCH.json');

console.log('================================================================');
console.log(' RUNNING TEST-006 CONTROL PLANE TEST SUITE (9 DEDICATED TESTS)');
console.log('================================================================');

// Test 1: parseState
console.log('1. [UNIT] Testing parseState...');
const sampleState = `
CURRENT_TASK: NONE
STATE: WAITING
LAST_AGENT: ORCHESTRATOR
RETRY_COUNT: 0
DEVELOPER_STATUS: COMPLETE
AUDITOR_STATUS: PASS
BLOCKER: QUEUE_EMPTY
NEXT_ACTION: WAIT_FOR_NEW_TASK
`;
const parsedState = parseState(sampleState);
assert.strictEqual(parsedState.state, 'WAITING');
assert.strictEqual(parsedState.blocker, 'QUEUE_EMPTY');
assert.strictEqual(parsedState.currentTask, 'NONE');
console.log('   ✓ Test 1 Passed: parseState correctly parsed all control fields.');

// Test 2: parseQueue with multiple tasks and dependencies
console.log('2. [UNIT] Testing parseQueue...');
const sampleQueue = `
# QUEUE
## TEST-001
STATUS: COMPLETE
DEPENDENCIES: NONE

## TEST-002
STATUS: NOT_AVAILABLE
DEPENDENCIES: TEST-001

## TEST-003
STATUS: READY
DEPENDENCIES: TEST-001

## TEST-004
STATUS: READY
DEPENDENCIES: TEST-002
`;
const tasks = parseQueue(sampleQueue);
assert.strictEqual(tasks.length, 4);
assert.strictEqual(tasks[0].id, 'TEST-001');
assert.strictEqual(tasks[0].status, 'COMPLETE');
assert.strictEqual(tasks[1].status, 'NOT_AVAILABLE');
assert.strictEqual(tasks[2].id, 'TEST-003');
assert.strictEqual(tasks[2].status, 'READY');
console.log('   ✓ Test 2 Passed: parseQueue correctly extracted tasks and statuses.');

// Test 3: findNextExecutableTask dependency check
console.log('3. [UNIT] Testing findNextExecutableTask...');
const executable = findNextExecutableTask(tasks);
assert.strictEqual(executable.id, 'TEST-003', 'TEST-003 should be selected since TEST-001 is COMPLETE');
console.log('   ✓ Test 3 Passed: findNextExecutableTask resolved task dependencies.');

// Test 4: evaluateAndResume when WAITING and no executable tasks
console.log('4. [INTEGRATION] Testing evaluateAndResume during passive WAITING...');
fs.writeFileSync(mockStateFile, `# STATE\nSTATE: WAITING\nCURRENT_TASK: NONE\nBLOCKER: QUEUE_EMPTY\n`, 'utf8');
fs.writeFileSync(mockQueueFile, `## TEST-X\nSTATUS: NOT_AVAILABLE\n`, 'utf8');
releaseLock(mockLockFile);

const resEmpty = await evaluateAndResume(mockStateFile, mockQueueFile, mockLockFile);
assert.strictEqual(resEmpty.action, 'NONE');
assert.strictEqual(resEmpty.reason, 'NO_EXECUTABLE_READY_TASKS');
console.log('   ✓ Test 4 Passed: Passive waiting maintained without spurious transitions.');

// Test 5: evaluateAndResume with Execution Bridge Invocation & Lock Release on Success
console.log('5. [INTEGRATION] Testing Execution Bridge invocation and lock release on success...');
fs.writeFileSync(
  mockQueueFile,
  `## PREV-001\nSTATUS: COMPLETE\n\n## TEST-005-B\nSTATUS: READY\nDEPENDENCIES: PREV-001\n`,
  'utf8'
);

let callbackInvoked = false;
let callbackTask = null;

const testBridge = new AgentExecutionBridge({
  defaultStrategy: 'callback',
  strategies: { signal: { enabled: true, signalPath: mockSignalFile } },
});
testBridge.setCallback(async (task, ctx) => {
  callbackInvoked = true;
  callbackTask = task.id;
  // Assert lock is held DURING dispatch
  assert.strictEqual(fs.existsSync(mockLockFile), true, 'Lock must be held during dispatch execution');
  return { status: 'DISPATCHED_TO_RUNNER' };
});

const resResume = await evaluateAndResume(mockStateFile, mockQueueFile, mockLockFile, testBridge);
assert.strictEqual(resResume.action, 'RESUMED');
assert.strictEqual(resResume.task, 'TEST-005-B');
assert.strictEqual(callbackInvoked, true);
assert.strictEqual(callbackTask, 'TEST-005-B');
// Assert lock is released AFTER dispatch completes
assert.strictEqual(fs.existsSync(mockLockFile), false, 'Lock must be released after dispatch');

const updatedState = parseState(fs.readFileSync(mockStateFile, 'utf8'));
assert.strictEqual(updatedState.state, 'IN_PROGRESS');
assert.strictEqual(updatedState.currentTask, 'TEST-005-B');
console.log('   ✓ Test 5 Passed: Execution Bridge invoked and lock released deterministically.');

// Test 6: Lock release on dispatch exception
console.log('6. [INTEGRATION] Testing lock release on dispatch failure / exception...');
fs.writeFileSync(mockStateFile, `# STATE\nSTATE: WAITING\nCURRENT_TASK: NONE\nBLOCKER: QUEUE_EMPTY\n`, 'utf8');

const errorBridge = new AgentExecutionBridge({ defaultStrategy: 'callback' });
errorBridge.setCallback(async () => {
  throw new Error('Simulated runner failure');
});

try {
  await evaluateAndResume(mockStateFile, mockQueueFile, mockLockFile, errorBridge);
  assert.fail('Should have thrown error');
} catch (err) {
  assert.strictEqual(err.message, 'Simulated runner failure');
  // Lock must be released even after thrown exception
  assert.strictEqual(fs.existsSync(mockLockFile), false, 'Lock must be released on exception');
}
console.log('   ✓ Test 6 Passed: Lock released on exception via try/finally.');

// Test 7: Duplicate dispatch & atomic lock collision protection
console.log('7. [INTEGRATION] Testing active lock collision protection...');
// Reset state to WAITING and manually acquire lock for TEST-005-B
fs.writeFileSync(mockStateFile, `# STATE\nSTATE: WAITING\nCURRENT_TASK: NONE\nBLOCKER: QUEUE_EMPTY\n`, 'utf8');
acquireLock('TEST-005-B', mockLockFile);
assert.strictEqual(fs.existsSync(mockLockFile), true);

const resCollision = await evaluateAndResume(mockStateFile, mockQueueFile, mockLockFile, testBridge);
assert.strictEqual(resCollision.action, 'NONE');
assert.strictEqual(resCollision.reason, 'TASK_ALREADY_CLAIMED (TEST-005-B)');
releaseLock(mockLockFile);
console.log('   ✓ Test 7 Passed: Active claim lock prevented duplicate task dispatch.');

// Test 8: Stale lock recovery
console.log('8. [INTEGRATION] Testing stale lock timeout recovery...');
// Write stale lock (timestamp 60 seconds ago)
const staleLock = {
  taskId: 'TEST-005-B',
  pid: 99999,
  timestamp: Date.now() - 60000,
};
fs.writeFileSync(mockLockFile, JSON.stringify(staleLock, null, 2), 'utf8');

// evaluateAndResume with 30s timeout should take over stale lock
const resStale = await evaluateAndResume(mockStateFile, mockQueueFile, mockLockFile, testBridge);
assert.strictEqual(resStale.action, 'RESUMED');
assert.strictEqual(resStale.task, 'TEST-005-B');
assert.strictEqual(fs.existsSync(mockLockFile), false);
console.log('   ✓ Test 8 Passed: Stale lock correctly recovered and released.');

// Test 9: Signal file dispatch payload generation
console.log('9. [INTEGRATION] Testing Signal file dispatch strategy...');
fs.writeFileSync(mockStateFile, `# STATE\nSTATE: WAITING\nCURRENT_TASK: NONE\nBLOCKER: QUEUE_EMPTY\n`, 'utf8');
const signalBridge = new AgentExecutionBridge({
  defaultStrategy: 'signal',
  strategies: { signal: { enabled: true, signalPath: mockSignalFile } },
});
const resSignal = await evaluateAndResume(mockStateFile, mockQueueFile, mockLockFile, signalBridge);
assert.strictEqual(resSignal.action, 'RESUMED');
assert.strictEqual(fs.existsSync(mockSignalFile), true);
const signalContent = JSON.parse(fs.readFileSync(mockSignalFile, 'utf8'));
assert.strictEqual(signalContent.event, 'DISPATCH_ORCHESTRATOR');
assert.strictEqual(signalContent.taskId, 'TEST-005-B');
assert.strictEqual(signalContent.runtimeIntegrationStatus, 'EVENT_DISPATCHED_AWAITING_RUNNER_INTEGRATION');
console.log('   ✓ Test 9 Passed: DISPATCH.json signal payload written accurately with integration status.');

// Clean up temp test environment
releaseLock(mockLockFile);
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('================================================================');
console.log(' ALL 9 CONTROL PLANE TESTS PASSED SUCCESSFULLY (100%)');
console.log('================================================================');
