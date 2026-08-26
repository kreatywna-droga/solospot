import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STATE_PATH = path.join(__dirname, 'STATE.md');
export const QUEUE_PATH = path.join(__dirname, 'QUEUE.md');
export const LOG_PATH = path.join(__dirname, 'watcher.log');
export const CONFIG_PATH = path.join(__dirname, 'runner_config.json');
export const LOCK_PATH = path.join(__dirname, '.claim.lock');
export const DISPATCH_SIGNAL_PATH = path.join(__dirname, 'DISPATCH.json');

export function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [QUEUE_WATCHER] ${message}\n`;
  try {
    fs.appendFileSync(LOG_PATH, entry, 'utf8');
  } catch {}
  return entry;
}

export function loadConfig(configPath = CONFIG_PATH) {
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      log('Warning: Failed to parse runner_config.json, using defaults.');
    }
  }
  return {
    version: '1.0',
    defaultStrategy: 'signal',
strategies: {
      signal: { enabled: true, signalPath: DISPATCH_SIGNAL_PATH },
      command: { enabled: false, commandTemplate: 'opencode run --task {TASK_ID}' },
      acp: { enabled: false },
    },
    lockTimeoutMs: 30000,
  };
}

export function isLockStale(lockPath = LOCK_PATH, timeoutMs = 30000) {
  if (!fs.existsSync(lockPath)) return true;
  try {
    const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const age = Date.now() - lockData.timestamp;
    return age >= timeoutMs;
  } catch {
    return true;
  }
}

export function acquireLock(taskId, lockPath = LOCK_PATH, timeoutMs = 30000) {
  if (fs.existsSync(lockPath)) {
    try {
      const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      const age = Date.now() - lockData.timestamp;
      if (age < timeoutMs) {
        if (lockData.taskId === taskId && lockData.pid === process.pid) {
          return true;
        }
        log(`Lock already held for task ${lockData.taskId} by PID ${lockData.pid} (age ${age}ms).`);
        return false;
      }
      log(`Stale lock detected for task ${lockData.taskId} (age ${age}ms >= ${timeoutMs}ms). Overwriting.`);
    } catch {}
  }

  const claim = {
    taskId,
    pid: process.pid,
    timestamp: Date.now(),
  };

  try {
    fs.writeFileSync(lockPath, JSON.stringify(claim, null, 2), { flag: 'w', encoding: 'utf8' });
    return true;
  } catch (err) {
    log(`Failed to write claim lock: ${err.message}`);
    return false;
  }
}

export function releaseLock(lockPath = LOCK_PATH) {
  try {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  } catch {}
}

export class AgentExecutionBridge {
  constructor(config = loadConfig(), executionRuntime = null) {
    this.config = config;
    this.customCallback = null;
    this.executionRuntime = executionRuntime || config?.executionRuntime || null;
  }

  setCallback(callback) {
    this.customCallback = callback;
  }

  setExecutionRuntime(runtime) {
    this.executionRuntime = runtime;
  }

  getExecutionRuntime() {
    return this.executionRuntime;
  }

  async dispatch(task, context = {}, role = null) {
    const strategy = this.config.defaultStrategy || 'signal';
    const targetRole = role || context?.role || 'developer';
    log(`Dispatching execution bridge for ${task.id} (${targetRole}) using strategy: ${strategy}`);

    if (this.customCallback) {
      log(`Executing custom bridge callback for ${task.id} (${targetRole})`);
      const result = await this.customCallback(task, context, targetRole);
      return {
        dispatched: true,
        strategy: 'callback',
        taskId: task.id,
        role: targetRole,
        result,
      };
    }

    if (strategy === 'command' && this.config.strategies?.command?.enabled) {
      const cmdTemplate = this.config.strategies.command.commandTemplate;
      const cmd = cmdTemplate
        .replace('{TASK_ID}', task.id)
        .replace('{ROLE}', targetRole);
      log(`Spawning runner command: ${cmd}`);
      
      return new Promise((resolve) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            log(`Runner command error: ${error.message}`);
            resolve({ dispatched: false, strategy: 'command', error: error.message });
          } else {
            resolve({ dispatched: true, strategy: 'command', stdout: stdout.trim() });
          }
        });
      });
    }

    if ((strategy === 'acp' && this.config.strategies?.acp?.enabled !== false) || this.executionRuntime) {
      return this.dispatchAcp(task, context, targetRole);
    }

    // Default: Signal file dispatch (Control-Plane Event Emission)
    const signalPayload = {
      event: 'DISPATCH_ORCHESTRATOR',
      taskId: task.id,
      taskType: task.type,
      role: targetRole,
      timestamp: new Date().toISOString(),
      state: 'IN_PROGRESS',
      action: `Start ${task.id} with ${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)}`,
      context,
      runtimeIntegrationStatus: 'EVENT_DISPATCHED_AWAITING_RUNNER_INTEGRATION',
    };

    const targetSignalPath = this.config.strategies?.signal?.signalPath || DISPATCH_SIGNAL_PATH;
    fs.writeFileSync(targetSignalPath, JSON.stringify(signalPayload, null, 2), 'utf8');
    log(`Written dispatch signal to ${targetSignalPath} for task ${task.id} (${targetRole})`);

    return {
      dispatched: true,
      strategy: 'signal',
      taskId: task.id,
      role: targetRole,
      signalPath: targetSignalPath,
    };
  }

  async dispatchAcp(task, context = {}, role = null) {
    const targetRole = role || context?.role || 'developer';
    const taskContent =
      context?.task ||
      context?.[`${targetRole}Task`] ||
      context?.developerTask ||
      `Execute task ${task.id}.`;

    log(`Dispatching ${targetRole} task to execution runtime for ${task.id}`);

    if (!this.executionRuntime || typeof this.executionRuntime.execute !== 'function') {
      const errMsg = `No ExecutionRuntime configured for ACP strategy dispatch (${task.id}).`;
      log(`ACP dispatch error: ${errMsg}`);
      return {
        dispatched: false,
        strategy: 'acp',
        taskId: task.id,
        role: targetRole,
        error: errMsg,
      };
    }

    try {
      const runtimeResult = await this.executionRuntime.execute({
        taskId: task.id,
        role: targetRole,
        task: taskContent,
        context,
        cwd: this.config.strategies?.acp?.cwd || process.cwd(),
        timeoutMs: this.config.strategies?.acp?.timeoutMs,
      });

      return {
        dispatched: runtimeResult.success !== false && runtimeResult.dispatched !== false,
        strategy: 'acp',
        taskId: task.id,
        role: runtimeResult.role || targetRole,
        backend: runtimeResult.backend || 'opencode',
        model: runtimeResult.model,
        sessionId: runtimeResult.sessionId,
        response: runtimeResult.response,
        result: runtimeResult.result || runtimeResult,
        error: runtimeResult.error,
      };
    } catch (err) {
      log(`ExecutionRuntime error for ${task.id} (${targetRole}): ${err.message}`);
      return {
        dispatched: false,
        strategy: 'acp',
        taskId: task.id,
        role: targetRole,
        error: err.message,
      };
    }
  }
}

export function parseState(content) {
  const lines = content.split('\n');
  const result = {
    currentTask: null,
    state: null,
    lastAgent: null,
    retryCount: 0,
    developerStatus: null,
    auditorStatus: null,
    architectStatus: null,
    blocker: null,
    nextAction: null,
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('CURRENT_TASK:')) {
      result.currentTask = trimmed.replace('CURRENT_TASK:', '').trim();
    } else if (trimmed.startsWith('STATE:')) {
      result.state = trimmed.replace('STATE:', '').trim();
    } else if (trimmed.startsWith('LAST_AGENT:')) {
      result.lastAgent = trimmed.replace('LAST_AGENT:', '').trim();
    } else if (trimmed.startsWith('RETRY_COUNT:')) {
      result.retryCount = parseInt(trimmed.replace('RETRY_COUNT:', '').trim(), 10) || 0;
    } else if (trimmed.startsWith('DEVELOPER_STATUS:')) {
      result.developerStatus = trimmed.replace('DEVELOPER_STATUS:', '').trim();
    } else if (trimmed.startsWith('AUDITOR_STATUS:')) {
      result.auditorStatus = trimmed.replace('AUDITOR_STATUS:', '').trim();
    } else if (trimmed.startsWith('ARCHITECT_STATUS:')) {
      result.architectStatus = trimmed.replace('ARCHITECT_STATUS:', '').trim();
    } else if (trimmed.startsWith('BLOCKER:')) {
      result.blocker = trimmed.replace('BLOCKER:', '').trim();
    } else if (trimmed.startsWith('NEXT_ACTION:')) {
      result.nextAction = trimmed.replace('NEXT_ACTION:', '').trim();
    }
  }

  return result;
}

export function parseQueue(content) {
  const tasks = [];
  const lines = content.split('\n');
  let currentTask = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const taskHeaderMatch = line.match(/^#{2,3}\s+([A-Za-z0-9_\-\.]+)/);

    if (taskHeaderMatch) {
      const candidateId = taskHeaderMatch[1];
      if (!candidateId.toLowerCase().includes('queue') && !candidateId.toLowerCase().includes('active')) {
        if (currentTask) {
          tasks.push(currentTask);
        }
        currentTask = {
          id: candidateId,
          status: 'UNKNOWN',
          dependencies: [],
          type: 'UNKNOWN',
          nextStage: 'UNKNOWN',
        };
        continue;
      }
    }

    if (!currentTask) continue;

    if (line.startsWith('STATUS:')) {
      currentTask.status = line.replace('STATUS:', '').trim();
    } else if (line.startsWith('TYPE:')) {
      currentTask.type = line.replace('TYPE:', '').trim();
    } else if (line.startsWith('DEPENDENCIES:')) {
      const depStr = line.replace('DEPENDENCIES:', '').trim();
      if (depStr && depStr !== 'NONE') {
        currentTask.dependencies = depStr.split(',').map(d => d.trim()).filter(Boolean);
      } else {
        currentTask.dependencies = [];
      }
    } else if (line.startsWith('NEXT_STAGE:')) {
      currentTask.nextStage = line.replace('NEXT_STAGE:', '').trim();
    }
  }

  if (currentTask) {
    tasks.push(currentTask);
  }

  return tasks;
}

export function findNextExecutableTask(tasks) {
  const completedTaskIds = new Set(
    tasks.filter(t => t.status === 'COMPLETE').map(t => t.id)
  );

  for (const task of tasks) {
    if (task.status === 'READY') {
      const depsSatisfied = task.dependencies.every(dep => completedTaskIds.has(dep));
      if (depsSatisfied) {
        return task;
      }
    }
  }

  return null;
}

export function classifyResult(role, resultText) {
  const text = String(resultText || '');
  const normalizedRole = String(role || '').toLowerCase();

  const kind = (() => {
    if (normalizedRole === 'developer' && /TASK RESULT/i.test(text)) {
      return 'developer_complete';
    }

    if (normalizedRole === 'auditor') {
      if (/STATUS:\s*HOLD/i.test(text)) {
        return 'auditor_hold';
      }
      if (/STATUS:\s*PASS/i.test(text)) {
        return 'auditor_pass';
      }
    }

    if (normalizedRole === 'architect') {
      return 'architect_result';
    }

    return 'unknown';
  })();

  const requiresArchitectReview = (() => {
    if (kind === 'auditor_hold') {
      return /REQUIRES_ARCHITECT_REVIEW|ARCHITECT_REVIEW|ARCHITECTURAL_CHANGE_REQUIRED/i.test(text);
    }
    return false;
  })();

  return {
    role: normalizedRole === 'developer' || normalizedRole === 'auditor' || normalizedRole === 'architect'
      ? normalizedRole
      : 'unknown',
    kind,
    requiresArchitectReview,
    raw: resultText,
  };
}

function isPositiveFiniteInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function normalizeRetryCount(value) {
  const num = Number(value);
  if (Number.isInteger(num) && num >= 0) {
    return num;
  }
  return 0;
}

export function getRetryLimit(configPath = CONFIG_PATH, defaultLimit = 3) {
  const fallback = isPositiveFiniteInteger(defaultLimit) ? defaultLimit : 3;

  let raw = null;
  try {
    if (fs.existsSync(configPath)) {
      raw = fs.readFileSync(configPath, 'utf8');
    }
  } catch {
    return fallback;
  }

  if (raw === null || raw === undefined) {
    return fallback;
  }

  let config = null;
  try {
    config = JSON.parse(raw);
  } catch {
    return fallback;
  }

  if (config === null || typeof config !== 'object') {
    return fallback;
  }

  if (!isPositiveFiniteInteger(config.retryLimit)) {
    return fallback;
  }

  return config.retryLimit;
}

export function routeRetryDecision(kind, retryCount, retryLimit) {
  if (!isPositiveFiniteInteger(retryLimit)) {
    return {
      action: 'HUMAN_REVIEW',
      incrementRetry: false,
      terminal: true,
      reason: 'INVALID_RETRY_LIMIT',
    };
  }

  const normalizedKind = String(kind ?? '');
  const recognizedKinds = ['auditor_hold', 'execution_failure', 'architect_retry'];

  if (!recognizedKinds.includes(normalizedKind)) {
    return {
      action: 'HUMAN_REVIEW',
      incrementRetry: false,
      terminal: true,
      reason: 'UNKNOWN_RETRY_KIND',
    };
  }

  const normalizedCount = normalizeRetryCount(retryCount);

  if (normalizedCount < retryLimit) {
    return {
      action: 'RETRY_DEVELOPER',
      incrementRetry: true,
      terminal: false,
    };
  }

  return {
    action: 'HUMAN_REVIEW',
    incrementRetry: false,
    terminal: true,
  };
}

export function evaluateRetryDecision(kind, retryCount, configPath = CONFIG_PATH) {
  const retryLimit = getRetryLimit(configPath);
  const decision = routeRetryDecision(kind, retryCount, retryLimit);

  return {
    action: decision.action,
    incrementRetry: decision.incrementRetry,
    terminal: decision.terminal,
    reason: decision.reason ?? null,
    kind: String(kind ?? ''),
    retryCount: normalizeRetryCount(retryCount),
    retryLimit,
  };
}

export function createExecutionPlan(decision) {
  const action = String(decision?.action ?? '');

  if (action === 'RETRY_DEVELOPER') {
    return {
      execution: 'DISPATCH_DEVELOPER',
      shouldDispatch: true,
      shouldWriteState: true,
      shouldUpdateQueue: true,
      incrementRetry: true,
      terminal: false,
    };
  }

  if (action === 'HUMAN_REVIEW') {
    return {
      execution: 'PARK_HUMAN_REVIEW',
      shouldDispatch: false,
      shouldWriteState: true,
      shouldUpdateQueue: true,
      incrementRetry: false,
      terminal: true,
    };
  }

  return {
    execution: 'NOOP',
    shouldDispatch: false,
    shouldWriteState: false,
    shouldUpdateQueue: false,
    incrementRetry: false,
    terminal: true,
    reason: 'UNKNOWN_DECISION',
  };
}

const STATE_DEFAULTS = {
  currentTask: null,
  state: null,
  lastAgent: null,
  retryCount: 0,
  developerStatus: null,
  auditorStatus: null,
  architectStatus: null,
  lastHandoff: null,
  lastDecision: null,
  blocker: null,
  nextAction: null,
  humanReviewRequired: false,
};

function toSafeString(value) {
  return value === undefined || value === null ? '' : String(value);
}

function toSafeYesNo(value) {
  const normalized = toSafeString(value).trim().toUpperCase();
  return normalized === 'YES' || normalized === 'TRUE' || normalized === '1' ? 'YES' : 'NO';
}

function toSafeNumber(value) {
  const num = parseInt(toSafeString(value), 10);
  return Number.isFinite(num) ? num : 0;
}

export function writeState(statePath, nextState) {
  const state = { ...STATE_DEFAULTS, ...(nextState || {}) };

  const header = [
    '# WEB FACTOR â€” AGENT CONTROL STATE',
    '',
    'SYSTEM: WEB FACTOR AGENT CONTROL',
    'VERSION: 0.1',
    'MODE: TEST',
    '',
  ].join('\n');

  const currentTask = toSafeString(state.currentTask);
  const stateValue = toSafeString(state.state);
  const lastAgent = toSafeString(state.lastAgent);
  const retryCount = toSafeNumber(state.retryCount);
  const developerStatus = toSafeString(state.developerStatus);
  const auditorStatus = toSafeString(state.auditorStatus);
  const architectStatus = toSafeString(state.architectStatus);
  const lastHandoff = toSafeString(state.lastHandoff);
  const lastDecision = toSafeString(state.lastDecision);
  const blocker = toSafeString(state.blocker);
  const nextAction = toSafeString(state.nextAction);
  const humanReviewRequired = toSafeYesNo(state.humanReviewRequired);

  const body = [
    `CURRENT_TASK: ${currentTask}`,
    `STATE: ${stateValue}`,
    '',
    `LAST_AGENT: ${lastAgent}`,
    `RETRY_COUNT: ${retryCount}`,
    '',
    `DEVELOPER_STATUS: ${developerStatus}`,
    `AUDITOR_STATUS: ${auditorStatus}`,
    `ARCHITECT_STATUS: ${architectStatus}`,
    '',
    `LAST_HANDOFF: ${lastHandoff}`,
    `LAST_DECISION: ${lastDecision}`,
    `BLOCKER: ${blocker}`,
    '',
    'NEXT_ACTION:',
    nextAction || 'NONE',
    '',
    `HUMAN_REVIEW_REQUIRED: ${humanReviewRequired}`,
    '',
  ].join('\n');

  const content = header + body;

  const targetDir = path.dirname(statePath);
  const tempPath = path.join(
    targetDir,
    `.STATE.${process.pid}.${Date.now()}.tmp`
  );

  fs.writeFileSync(tempPath, content, 'utf8');
  try {
    fs.renameSync(tempPath, statePath);
  } catch (err) {
    try {
      fs.unlinkSync(tempPath);
    } catch {}
    throw err;
  }

  return statePath;
}

export function markQueueStatus(queuePath, taskId, status, nextStage) {
  if (!fs.existsSync(queuePath)) {
    throw new Error(`QUEUE_NOT_FOUND: ${queuePath}`);
  }

  const content = fs.readFileSync(queuePath, 'utf8');
  const lines = content.split('\n');
  const headerPattern = /^#{2,3}\s+([A-Za-z0-9_\-.]+)/;

  let targetStart = -1;
  let targetEnd = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].trim().match(headerPattern);

    if (!match) continue;

    if (match[1] === taskId) {
      targetStart = i;
      break;
    }
  }

  if (targetStart === -1) {
    throw new Error(`QUEUE_TASK_NOT_FOUND: ${taskId}`);
  }

  for (let i = targetStart + 1; i < lines.length; i++) {
    const match = lines[i].trim().match(headerPattern);

    if (match) {
      targetEnd = i;
      break;
    }
  }

  const statusValue = String(status ?? '').trim();
  const nextStageValue = String(nextStage ?? '').trim();

  if (!statusValue) {
    throw new Error(`QUEUE_INVALID_STATUS: ${taskId}`);
  }

  if (!nextStageValue) {
    throw new Error(`QUEUE_INVALID_NEXT_STAGE: ${taskId}`);
  }

  let statusFound = false;
  let nextStageFound = false;

  for (let i = targetStart + 1; i < targetEnd; i++) {
    const trimmed = lines[i].trim();

    if (/^STATUS:/i.test(trimmed)) {
      const indent = lines[i].match(/^\s*/)?.[0] ?? '';
      lines[i] = `${indent}STATUS: ${statusValue}`;
      statusFound = true;
      continue;
    }

    if (/^NEXT_STAGE:/i.test(trimmed)) {
      const indent = lines[i].match(/^\s*/)?.[0] ?? '';
      lines[i] = `${indent}NEXT_STAGE: ${nextStageValue}`;
      nextStageFound = true;
    }
  }

  if (!statusFound) {
    lines.splice(targetStart + 1, 0, `STATUS: ${statusValue}`);
    targetEnd++;
  }

  if (!nextStageFound) {
    lines.splice(targetEnd, 0, `NEXT_STAGE: ${nextStageValue}`);
  }

  const updatedContent = lines.join('\n');

  const targetDir = path.dirname(queuePath);
  const tempPath = path.join(
    targetDir,
    `.QUEUE.${process.pid}.${Date.now()}.tmp`
  );

  fs.writeFileSync(tempPath, updatedContent, 'utf8');

  try {
    fs.renameSync(tempPath, queuePath);
  } catch (err) {
    try {
      fs.unlinkSync(tempPath);
    } catch {}
    throw err;
  }

return {
    queuePath,
    taskId,
    status: statusValue,
    nextStage: nextStageValue,
  };
}

function readRetryCount(statePath) {
  let retryCount = 0;
  try {
    if (fs.existsSync(statePath)) {
      const parsed = parseState(fs.readFileSync(statePath, 'utf8'));
      retryCount = normalizeRetryCount(parsed.retryCount);
    }
  } catch {}
  return retryCount;
}

export function executeExecutionPlan(plan, context = {}) {
  const execution = String(plan?.execution ?? '');

  const statePath = context?.statePath;
  const queuePath = context?.queuePath;
  const taskId = context?.taskId;

  if (!statePath || !queuePath || !taskId) {
    return {
      executed: false,
      execution: 'NOOP',
      reason: 'MISSING_CONTEXT',
    };
  }

  if (execution === 'DISPATCH_DEVELOPER') {
    const developerTask = context?.developerTask;
    const developerRole = context?.developerRole;
    const developerModel = context?.developerModel;

    const dispatchRequest = createDeveloperDispatchRequest({
      taskId,
      task: developerTask,
      role: developerRole,
      model: developerModel,
    });

    if (!dispatchRequest.valid) {
      return {
        executed: false,
        execution: 'DISPATCH_DEVELOPER',
        dispatched: false,
        stateWritten: false,
        queueUpdated: false,
        lockAcquired: false,
        dispatchRequest,
      };
    }

    const currentRetryCount = readRetryCount(statePath);
    const nextRetryCount = currentRetryCount + 1;

    writeState(statePath, {
      currentTask: taskId,
      state: 'IN_PROGRESS',
      lastAgent: 'ORCHESTRATOR',
      retryCount: nextRetryCount,
      developerStatus: 'NOT_STARTED',
      auditorStatus: 'NOT_STARTED',
      architectStatus: 'NOT_REQUIRED',
      humanReviewRequired: false,
      nextAction: 'DISPATCH_DEVELOPER',
    });

    markQueueStatus(queuePath, taskId, 'IN_PROGRESS', 'DEVELOPER_RETRY');

    return {
      executed: true,
      execution: 'DISPATCH_DEVELOPER',
      dispatched: false,
      stateWritten: true,
      queueUpdated: true,
      lockAcquired: false,
      dispatchRequest,
    };
  }

  if (execution === 'PARK_HUMAN_REVIEW') {
    const currentRetryCount = readRetryCount(statePath);

    writeState(statePath, {
      currentTask: taskId,
      state: 'HUMAN_REVIEW',
      lastAgent: 'ORCHESTRATOR',
      retryCount: currentRetryCount,
      developerStatus: 'NOT_STARTED',
      auditorStatus: 'NOT_STARTED',
      architectStatus: 'NOT_REQUIRED',
      humanReviewRequired: true,
      nextAction: 'HUMAN_REVIEW',
    });

    markQueueStatus(queuePath, taskId, 'HUMAN_REVIEW', 'HUMAN_REVIEW');

    return {
      executed: true,
      execution: 'PARK_HUMAN_REVIEW',
      dispatched: false,
      stateWritten: true,
      queueUpdated: true,
      lockAcquired: false,
    };
  }

  return {
    executed: false,
    execution: 'NOOP',
    reason: 'UNKNOWN_EXECUTION_PLAN',
  };
}

export async function evaluateAndResume(
  statePath = STATE_PATH,
  queuePath = QUEUE_PATH,
  lockPath = LOCK_PATH,
  bridge = new AgentExecutionBridge(),
  options = {}
) {
  if (!fs.existsSync(statePath) || !fs.existsSync(queuePath)) {
    log('STATE.md or QUEUE.md does not exist.');
    return { action: 'NONE', reason: 'FILES_MISSING' };
  }

  const stateRaw = fs.readFileSync(statePath, 'utf8');
  const queueRaw = fs.readFileSync(queuePath, 'utf8');

  const state = parseState(stateRaw);

  const {
    decisionOnly = false,
    executionPlanOnly = false,
    executionOnly = false,
    decisionKind = null,
    decisionRetryCount = null,
    executionContext = null,
  } = options;

  if (decisionOnly) {
    // READ/PLAN-ONLY boundary. No writes, no dispatch, no lock, no state change.
    const kind = decisionKind ?? 'execution_failure';
    const retryCount = decisionRetryCount ?? normalizeRetryCount(state.retryCount);
    const decision = evaluateRetryDecision(kind, retryCount);

    if (executionPlanOnly) {
      // PLAN-ONLY. Compute the execution plan from the decision, but never execute it.
      const executionPlan = createExecutionPlan(decision);

      if (executionOnly) {
        // CONTROLLED EXECUTION MODE.
        // Only reachable when decisionOnly + executionPlanOnly + executionOnly are all true.
        // This is an explicit test/integration mode. It computes the decision, builds the plan,
        // executes the plan against the explicit executionContext, and returns the execution result.
        // The normal production/default path never reaches here.
        if (!executionContext || typeof executionContext !== 'object') {
          return {
            action: 'EXECUTION_RESULT_PROBE',
            readOnly: false,
            executed: false,
            reason: 'EXECUTION_CONTEXT_REQUIRED',
          };
        }

        const executionResult = executeExecutionPlan(executionPlan, executionContext);

        return {
          action: 'EXECUTION_RESULT_PROBE',
          readOnly: false,
          decision,
          executionPlan,
          executionResult,
        };
      }

      return {
        action: 'EXECUTION_PLAN_PROBE',
        readOnly: true,
        decision,
        executionPlan,
      };
    }

    return {
      action: 'RETRY_DECISION_PROBE',
      readOnly: true,
      decision,
    };
  }

  const tasks = parseQueue(queueRaw);

  if (state.state !== 'WAITING') {
    return { action: 'NONE', reason: `STATE_NOT_WAITING (${state.state})` };
  }

  const nextTask = findNextExecutableTask(tasks);

  if (!nextTask) {
    return { action: 'NONE', reason: 'NO_EXECUTABLE_READY_TASKS' };
  }

  // Atomic claim check
  const lockAcquired = acquireLock(nextTask.id, lockPath);
  if (!lockAcquired) {
    return { action: 'NONE', reason: `TASK_ALREADY_CLAIMED (${nextTask.id})` };
  }

  try {
    // Perform state transition
    const updatedStateContent = `# WEB FACTOR â€” AGENT CONTROL STATE

SYSTEM: WEB FACTOR AGENT CONTROL
VERSION: 0.1
MODE: TEST

CURRENT_TASK: ${nextTask.id}
STATE: IN_PROGRESS

LAST_AGENT: ORCHESTRATOR
RETRY_COUNT: 0

DEVELOPER_STATUS: NOT_STARTED
AUDITOR_STATUS: NOT_STARTED
ARCHITECT_STATUS: NOT_REQUIRED

LAST_HANDOFF: QUEUE_WATCHER_AUTO_RESUME
LAST_DECISION: RESUME_FROM_WAITING
BLOCKER: NONE

NEXT_ACTION:
Start ${nextTask.id} with Developer.

HUMAN_REVIEW_REQUIRED: NO
`;

    fs.writeFileSync(statePath, updatedStateContent, 'utf8');
    log(`Successfully transitioned state from WAITING to IN_PROGRESS for task ${nextTask.id}.`);

    // Invoke Execution Bridge
    const dispatchResult = await bridge.dispatch(nextTask, {
      previousState: 'WAITING',
      resumedAt: new Date().toISOString(),
    });

    return {
      action: 'RESUMED',
      task: nextTask.id,
      previousState: 'WAITING',
      newState: 'IN_PROGRESS',
      dispatchResult,
    };
  } finally {
    releaseLock(lockPath);
    log(`Released claim lock for ${nextTask.id}.`);
  }
}

export function createDeveloperDispatchRequest(context = {}) {
  const raw = context === null || context === undefined ? {} : context;

  const rawTaskId = raw.taskId;
  const rawTask = raw.task;
  const rawRole = raw.role;
  const rawModel = raw.model;

  if (rawTaskId === undefined || rawTaskId === null || String(rawTaskId).trim() === '') {
    return { valid: false, reason: 'MISSING_TASK_ID' };
  }
  const taskId = String(rawTaskId).trim();

  if (taskId === '') {
    return { valid: false, reason: 'INVALID_TASK_ID' };
  }

  if (rawTask === undefined || rawTask === null || String(rawTask).trim() === '') {
    return { valid: false, reason: 'MISSING_TASK' };
  }
  const task = String(rawTask).trim();
  if (task === '') {
    return { valid: false, reason: 'INVALID_TASK' };
  }

  let role = 'developer';
  if (rawRole !== undefined && rawRole !== null && String(rawRole).trim() !== '') {
    const normalizedRole = String(rawRole).trim().toLowerCase();
    if (normalizedRole !== 'developer') {
      return { valid: false, reason: 'INVALID_ROLE' };
    }
    role = 'developer';
  }

  let model = null;
  if (rawModel !== undefined && rawModel !== null) {
    if (typeof rawModel !== 'string') {
      return { valid: false, reason: 'INVALID_MODEL' };
    }
    const normalizedModel = rawModel.trim();
    if (normalizedModel !== '') {
      model = normalizedModel;
    }
  }

  return {
    valid: true,
    role,
    taskId,
    task,
    model,
  };
}

export function validateTaskResult(resultText) {
  const text = String(resultText || '');
  const hasTaskId = /TASK\s*ID\s*:/i.test(text);
  const hasStatus = /STATUS\s*:/i.test(text);
  const hasFilesChanged = /FILES_CHANGED\s*:/i.test(text);
  const hasValidation = /VALIDATION\s*:/i.test(text);
  const hasBlockers = /BLOCKERS\s*:/i.test(text);

  const valid = hasTaskId && hasStatus && hasFilesChanged && hasValidation && hasBlockers;
  return {
    valid,
    hasTaskId,
    hasStatus,
    hasFilesChanged,
    hasValidation,
    hasBlockers,
    raw: resultText,
  };
}

export function validateAuditResult(resultText) {
  const text = String(resultText || '');
  const hasTaskId = /TASK\s*ID\s*:/i.test(text);
  const hasStatus = /STATUS\s*:/i.test(text);
  const hasAuditedFiles = /AUDITED_FILES\s*:/i.test(text);
  const hasValidation = /VALIDATION\s*:/i.test(text);
  const hasRegression = /REGRESSION\s*:/i.test(text);
  const hasUnauthorizedChanges = /UNAUTHORIZED_CHANGES\s*:/i.test(text);
  const hasBlockers = /BLOCKERS\s*:/i.test(text);
  const hasRecommendation = /RECOMMENDATION\s*:/i.test(text);

  const recommendationMatch = text.match(/RECOMMENDATION\s*:\s*(APPROVE|PASS|HOLD|FAIL|REJECT)/i);
  const recommendation = recommendationMatch ? recommendationMatch[1].toUpperCase() : null;

  const valid =
    hasTaskId &&
    hasStatus &&
    hasAuditedFiles &&
    hasValidation &&
    hasRegression &&
    hasUnauthorizedChanges &&
    hasBlockers &&
    hasRecommendation;

  return {
    valid,
    hasTaskId,
    hasStatus,
    hasAuditedFiles,
    hasValidation,
    hasRegression,
    hasUnauthorizedChanges,
    hasBlockers,
    hasRecommendation,
    isApproved: recommendation === 'APPROVE' || recommendation === 'PASS',
    raw: resultText,
  };
}

export async function executeAutonomousTaskCycle({
  task,
  statePath = STATE_PATH,
  queuePath = QUEUE_PATH,
  lockPath = LOCK_PATH,
  bridge,
  configPath = CONFIG_PATH,
  options = {},
}) {
  const effectiveBridge = bridge || new AgentExecutionBridge(loadConfig(configPath));
  const retryLimit = getRetryLimit(configPath, 3);
  let currentRetry = readRetryCount(statePath);

  log(`[AUTONOMOUS_CYCLE] Starting execution cycle for task ${task.id} (retry ${currentRetry}/${retryLimit})`);

  // Step 1: Orchestrator briefing
  writeState(statePath, {
    currentTask: task.id,
    state: 'IN_PROGRESS',
    lastAgent: 'ORCHESTRATOR',
    retryCount: currentRetry,
    developerStatus: 'NOT_STARTED',
    auditorStatus: 'NOT_STARTED',
    architectStatus: 'NOT_REQUIRED',
    humanReviewRequired: false,
    nextAction: `Orchestrating task ${task.id}`,
  });
  markQueueStatus(queuePath, task.id, 'IN_PROGRESS', 'ORCHESTRATOR');

  const orchestratorPrompt = `You are the ORCHESTRATOR agent.
Task ID: ${task.id}
Type: ${task.type || 'TASK'}
Dependencies: ${(task.dependencies || []).join(', ') || 'NONE'}

Briefing:
Provide a concise execution briefing for Developer and acceptance criteria for Auditor. Keep response under 100 words.`;
  
  let orchestratorResult;
  try {
    orchestratorResult = await effectiveBridge.dispatch(
      task,
      { role: 'orchestrator', task: orchestratorPrompt },
      'orchestrator'
    );
  } catch (err) {
    orchestratorResult = { dispatched: false, error: err.message };
  }

  // Loop Developer -> Auditor until PASS, or retryLimit reached
  while (true) {
    // Step 2: Developer execution
    writeState(statePath, {
      currentTask: task.id,
      state: 'IN_PROGRESS',
      lastAgent: 'DEVELOPER',
      retryCount: currentRetry,
      developerStatus: 'IN_PROGRESS',
      auditorStatus: 'NOT_STARTED',
      architectStatus: 'NOT_REQUIRED',
      humanReviewRequired: false,
      nextAction: `Executing task ${task.id} with Developer`,
    });
    markQueueStatus(queuePath, task.id, 'IN_PROGRESS', 'DEVELOPER');

    const developerPrompt = `You are the DEVELOPER agent.
Task ID: ${task.id}
Orchestrator Context: ${orchestratorResult?.response || 'Standard execution.'}

Complete the task and return a structured report in the exact format:
# TASK RESULT
TASK ID: ${task.id}
STATUS: COMPLETE
FILES_CHANGED: NONE
VALIDATION: Verified
BLOCKERS: NONE
NEXT_ACTION: AUDIT`;

    let devResult;
    try {
      devResult = await effectiveBridge.dispatch(
        task,
        { role: 'developer', task: developerPrompt, developerTask: developerPrompt },
        'developer'
      );
    } catch (err) {
      devResult = { dispatched: false, error: err.message };
    }

    const taskValidation = validateTaskResult(devResult?.response);
    if (!devResult?.dispatched || !taskValidation.valid) {
      log(`[AUTONOMOUS_CYCLE] Developer output invalid or dispatch failed for ${task.id}`);
      currentRetry++;
      const decision = evaluateRetryDecision('execution_failure', currentRetry, configPath);
      
      if (decision.action === 'HUMAN_REVIEW' || currentRetry >= retryLimit) {
        log(`[AUTONOMOUS_CYCLE] Retry limit reached for ${task.id}. Parking in HUMAN_REVIEW.`);
        writeState(statePath, {
          currentTask: task.id,
          state: 'HUMAN_REVIEW',
          lastAgent: 'DEVELOPER',
          retryCount: currentRetry,
          developerStatus: 'FAILED',
          auditorStatus: 'NOT_STARTED',
          architectStatus: 'NOT_REQUIRED',
          humanReviewRequired: true,
          nextAction: 'HUMAN_REVIEW',
          blocker: 'DEV_EXECUTION_FAILURE_RETRY_EXHAUSTED',
        });
        markQueueStatus(queuePath, task.id, 'HUMAN_REVIEW', 'HUMAN_REVIEW');
        return {
          taskId: task.id,
          status: 'HUMAN_REVIEW',
          retryCount: currentRetry,
          reason: 'DEV_EXECUTION_FAILURE_RETRY_EXHAUSTED',
          devResult,
        };
      }

      writeState(statePath, {
        currentTask: task.id,
        state: 'IN_PROGRESS',
        lastAgent: 'DEVELOPER',
        retryCount: currentRetry,
        developerStatus: 'FAILED',
        auditorStatus: 'NOT_STARTED',
        architectStatus: 'NOT_REQUIRED',
        humanReviewRequired: false,
        nextAction: `Retry Developer for ${task.id}`,
      });
      continue;
    }

    // Step 3: Auditor verification
    writeState(statePath, {
      currentTask: task.id,
      state: 'AUDIT',
      lastAgent: 'AUDITOR',
      retryCount: currentRetry,
      developerStatus: 'COMPLETE',
      auditorStatus: 'IN_PROGRESS',
      architectStatus: 'NOT_REQUIRED',
      humanReviewRequired: false,
      nextAction: `Auditing task ${task.id}`,
    });
    markQueueStatus(queuePath, task.id, 'IN_PROGRESS', 'AUDITOR');

    const auditorPrompt = `You are the AUDITOR agent.
Task ID: ${task.id}
Developer Result:
${devResult.response}

Perform audit and return a structured report in the exact format:
# AUDIT RESULT
TASK ID: ${task.id}
STATUS: PASS
AUDITED_FILES: NONE
VALIDATION: Verified
REGRESSION: NONE
UNAUTHORIZED_CHANGES: NONE
BLOCKERS: NONE
RECOMMENDATION: APPROVE`;

    let auditResult;
    try {
      auditResult = await effectiveBridge.dispatch(
        task,
        { role: 'auditor', task: auditorPrompt, developerResponse: devResult.response },
        'auditor'
      );
    } catch (err) {
      auditResult = { dispatched: false, error: err.message };
    }

    const auditValidation = validateAuditResult(auditResult?.response);

    // Step 4: B13 Deterministic Decision
    if (auditResult?.dispatched && auditValidation.valid && auditValidation.isApproved) {
      log(`[AUTONOMOUS_CYCLE] Audit APPROVED for task ${task.id}. Marking COMPLETE.`);
      writeState(statePath, {
        currentTask: task.id,
        state: 'COMPLETE',
        lastAgent: 'AUDITOR',
        retryCount: currentRetry,
        developerStatus: 'COMPLETE',
        auditorStatus: 'PASS',
        architectStatus: 'NOT_REQUIRED',
        humanReviewRequired: false,
        lastDecision: 'APPROVE',
        nextAction: 'NEXT_TASK',
      });
      markQueueStatus(queuePath, task.id, 'COMPLETE', 'DONE');
      return {
        taskId: task.id,
        status: 'COMPLETE',
        retryCount: currentRetry,
        devResult,
        auditResult,
      };
    }

    // Audit failed or requested HOLD -> Retry or HUMAN_REVIEW
    currentRetry++;
    const retryDecision = evaluateRetryDecision('auditor_hold', currentRetry, configPath);
    log(`[AUTONOMOUS_CYCLE] Audit HOLD/FAIL for ${task.id}. Decision: ${retryDecision.action}, retry: ${currentRetry}/${retryLimit}`);

    if (retryDecision.action === 'HUMAN_REVIEW' || currentRetry >= retryLimit) {
      log(`[AUTONOMOUS_CYCLE] Retry limit reached for ${task.id}. Parking in HUMAN_REVIEW.`);
      writeState(statePath, {
        currentTask: task.id,
        state: 'HUMAN_REVIEW',
        lastAgent: 'AUDITOR',
        retryCount: currentRetry,
        developerStatus: 'COMPLETE',
        auditorStatus: 'HOLD',
        architectStatus: 'NOT_REQUIRED',
        humanReviewRequired: true,
        lastDecision: 'HOLD',
        blocker: 'AUDIT_HOLD_RETRY_EXHAUSTED',
        nextAction: 'HUMAN_REVIEW',
      });
      markQueueStatus(queuePath, task.id, 'HUMAN_REVIEW', 'HUMAN_REVIEW');
      return {
        taskId: task.id,
        status: 'HUMAN_REVIEW',
        retryCount: currentRetry,
        reason: 'AUDIT_HOLD_RETRY_EXHAUSTED',
        devResult,
        auditResult,
      };
    }

    writeState(statePath, {
      currentTask: task.id,
      state: 'IN_PROGRESS',
      lastAgent: 'ORCHESTRATOR',
      retryCount: currentRetry,
      developerStatus: 'NOT_STARTED',
      auditorStatus: 'HOLD',
      architectStatus: 'NOT_REQUIRED',
      humanReviewRequired: false,
      lastDecision: 'RETRY_DEVELOPER',
      nextAction: `Retry Developer for ${task.id}`,
    });
    markQueueStatus(queuePath, task.id, 'IN_PROGRESS', 'DEVELOPER_RETRY');
  }
}

export async function runContinuousNightRun({
  statePath = STATE_PATH,
  queuePath = QUEUE_PATH,
  lockPath = LOCK_PATH,
  bridge = new AgentExecutionBridge(),
  configPath = CONFIG_PATH,
  maxIterations = 100,
} = {}) {
  const summary = {
    totalProcessed: 0,
    completed: [],
    humanReview: [],
    blockedByDependencies: [],
    iterations: 0,
    status: 'IDLE',
  };

  log('[NIGHT_RUN] Starting Continuous Autonomous Night Run.');

  while (summary.iterations < maxIterations) {
    summary.iterations++;

    if (!fs.existsSync(statePath) || !fs.existsSync(queuePath)) {
      log('[NIGHT_RUN] STATE.md or QUEUE.md missing. Exiting run.');
      summary.status = 'ERROR_FILES_MISSING';
      break;
    }

    const queueRaw = fs.readFileSync(queuePath, 'utf8');
    const tasks = parseQueue(queueRaw);

    const nextTask = findNextExecutableTask(tasks);

    if (!nextTask) {
      const allDone = tasks.length > 0 && tasks.every(t => t.status === 'COMPLETE');
      const uncompleted = tasks.filter(t => t.status !== 'COMPLETE');
      const allParked = uncompleted.length > 0 && uncompleted.every(t => t.status === 'HUMAN_REVIEW');
      const blocked = uncompleted.filter(t => t.status === 'READY' || t.status === 'UNKNOWN');

      if (allDone) {
        log('[NIGHT_RUN] All tasks in queue are COMPLETE. Night run finished successfully.');
        summary.status = 'ALL_TASKS_COMPLETE';
      } else if (allParked) {
        log('[NIGHT_RUN] All remaining tasks are parked in HUMAN_REVIEW. Night run paused.');
        summary.status = 'ALL_REMAINING_PARKED_HUMAN_REVIEW';
      } else if (blocked.length > 0) {
        log(`[NIGHT_RUN] ${blocked.length} tasks blocked by unsatisfied dependencies. Night run ended.`);
        summary.status = 'BLOCKED_BY_DEPENDENCIES';
        summary.blockedByDependencies = blocked.map(t => t.id);
      } else {
        log('[NIGHT_RUN] Queue is empty or no executable tasks found. Night run complete.');
        summary.status = 'QUEUE_EMPTY';
      }
      break;
    }

    // Atomic claim lock
    const lockAcquired = acquireLock(nextTask.id, lockPath);
    if (!lockAcquired) {
      log(`[NIGHT_RUN] Task ${nextTask.id} already claimed by another process. Skipping.`);
      summary.status = 'TASK_CLAIM_LOCKED';
      break;
    }

    try {
      summary.totalProcessed++;
      const cycleResult = await executeAutonomousTaskCycle({
        task: nextTask,
        statePath,
        queuePath,
        lockPath,
        bridge,
        configPath,
      });

      if (cycleResult.status === 'COMPLETE') {
        summary.completed.push(nextTask.id);
      } else if (cycleResult.status === 'HUMAN_REVIEW') {
        summary.humanReview.push(nextTask.id);
      }
    } catch (err) {
      log(`[NIGHT_RUN] Uncaught error during cycle for ${nextTask.id}: ${err.message}`);
      summary.humanReview.push(nextTask.id);
    } finally {
      releaseLock(lockPath);
    }
  }

  log(`[NIGHT_RUN] Finished. Processed: ${summary.totalProcessed}, Complete: ${summary.completed.length}, HumanReview: ${summary.humanReview.length}, Status: ${summary.status}`);
  return summary;
}

// CLI runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isNightRun = process.argv.includes('--night-run') || process.argv.includes('--continuous');
  const isSingleRun = process.argv.includes('--single-run') || process.argv.includes('--check-now');
  
  if (isNightRun) {
    runContinuousNightRun().then((summary) => {
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    });
  } else if (isSingleRun) {
    evaluateAndResume().then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    });
  } else {
    console.log('[QUEUE_WATCHER] Started in continuous watch mode with AgentExecutionBridge.');
    log('Queue watcher started.');

    const interval = setInterval(async () => {
      try {
        const res = await evaluateAndResume();
        if (res.action === 'RESUMED') {
          console.log(`[QUEUE_WATCHER] ${res.task} automatically resumed and dispatched.`);
        }
      } catch (err) {
        log(`Error evaluating queue: ${err.message}`);
      }
    }, 1000);

    process.on('SIGINT', () => {
      clearInterval(interval);
      log('Queue watcher stopped.');
      process.exit(0);
    });
  }
}
