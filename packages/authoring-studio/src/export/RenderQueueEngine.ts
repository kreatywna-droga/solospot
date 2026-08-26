/**
 * RenderQueueEngine.ts — Sprint S27 Render Queue Domain Engine & State Management
 *
 * Manages render job lifecycles: Project -> Queue -> Rendering -> Completed / Failed / Cancelled.
 * Supports enqueue, cancel, retry, reorder, duplicate, clear completed, and immutable job history log.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { ExportWorkspaceConfig } from './ExportWorkspaceModel';

/**
 * Deterministic, monotonic job counter.
 * Exposed for test isolation via resetJobIdCounter().
 */
let _jobIdCounter = 0;
export function resetJobIdCounter(): void { _jobIdCounter = 0; }
export function nextJobId(prefix: string): string { return `${prefix}-${++_jobIdCounter}`; }

export type RenderJobStatus = 'queued' | 'rendering' | 'completed' | 'failed' | 'cancelled';

export interface RenderJobProgress {
  readonly currentFrame: number;
  readonly totalFrames: number;
  readonly progressPercentage: number; // 0..100
  readonly elapsedTimeMs: number;
  readonly renderingFps: number;
  readonly estimatedRemainingMs: number;
}

export interface RenderJobOutputMetadata {
  readonly artifactId: string;
  readonly filename: string;
  readonly format: string;
  readonly checksum: string;
  readonly sizeBytes: number;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly totalFrames: number;
  readonly durationMs: number;
  readonly generatedAt: number;
}

export interface RenderJobErrorDetails {
  readonly errorCode: string;
  readonly message: string;
  readonly phase: string;
  readonly timestamp: number;
  readonly stackTrace?: string;
  readonly isRetryable: boolean;
}

export interface RenderJob {
  readonly jobId: string;
  readonly projectId: string;
  readonly documentId: string;
  readonly exportConfig: ExportWorkspaceConfig;
  readonly status: RenderJobStatus;
  readonly progress: RenderJobProgress;
  readonly priority: number; // Lower index / higher number = higher priority
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly enqueuedAt: number;
  readonly startedAt?: number;
  readonly completedAt?: number;
  readonly outputMetadata?: RenderJobOutputMetadata;
  readonly errorDetails?: RenderJobErrorDetails;
}

export interface RenderQueueState {
  readonly activeJobId?: string;
  readonly queue: ReadonlyArray<RenderJob>;
  readonly history: ReadonlyArray<RenderJob>;
  readonly isProcessing: boolean;
  readonly updatedAt: number;
}

/**
 * Creates an initial empty RenderQueueState.
 */
export function createRenderQueueState(): RenderQueueState {
  return {
    queue: [],
    history: [],
    isProcessing: false,
    updatedAt: Date.now(),
  };
}

/**
 * Creates a default RenderJob DTO in 'queued' status.
 */
export function createRenderJob(
  projectId: string,
  documentId: string,
  exportConfig: ExportWorkspaceConfig,
  overrides?: Partial<RenderJob>
): RenderJob {
  const now = Date.now();
  const totalFrames = overrides?.progress?.totalFrames ?? 300; // default 10s at 30fps if uncalculated

  return {
    jobId: overrides?.jobId ?? nextJobId(`job-${projectId}`),
    projectId,
    documentId,
    exportConfig,
    status: overrides?.status ?? 'queued',
    progress: overrides?.progress ?? {
      currentFrame: 0,
      totalFrames,
      progressPercentage: 0,
      elapsedTimeMs: 0,
      renderingFps: 0,
      estimatedRemainingMs: 0,
    },
    priority: overrides?.priority ?? 1,
    retryCount: overrides?.retryCount ?? 0,
    maxRetries: overrides?.maxRetries ?? 3,
    enqueuedAt: overrides?.enqueuedAt ?? now,
    startedAt: overrides?.startedAt,
    completedAt: overrides?.completedAt,
    outputMetadata: overrides?.outputMetadata,
    errorDetails: overrides?.errorDetails,
  };
}

/**
 * Enqueues a new render job to the queue.
 */
export function enqueueRenderJob(
  state: RenderQueueState,
  projectId: string,
  documentId: string,
  exportConfig: ExportWorkspaceConfig,
  overrides?: Partial<RenderJob>
): { state: RenderQueueState; job: RenderJob } {
  const job = createRenderJob(projectId, documentId, exportConfig, overrides);
  const nextQueue = [...state.queue, job];

  return {
    state: {
      ...state,
      queue: nextQueue,
      updatedAt: Date.now(),
    },
    job,
  };
}

/**
 * Cancels a job by ID (if queued or currently rendering).
 */
export function cancelRenderJob(state: RenderQueueState, jobId: string): RenderQueueState {
  const jobIndex = state.queue.findIndex((j) => j.jobId === jobId);
  if (jobIndex === -1) {
    return state;
  }

  const targetJob = state.queue[jobIndex];
  const cancelledJob: RenderJob = {
    ...targetJob,
    status: 'cancelled',
    completedAt: Date.now(),
  };

  const nextQueue = state.queue.filter((j) => j.jobId !== jobId);
  const nextHistory = [cancelledJob, ...state.history];
  const activeJobId = state.activeJobId === jobId ? undefined : state.activeJobId;
  const isProcessing = activeJobId ? state.isProcessing : false;

  return {
    ...state,
    activeJobId,
    queue: nextQueue,
    history: nextHistory,
    isProcessing,
    updatedAt: Date.now(),
  };
}

/**
 * Reorders a job in the queue to a new target index.
 */
export function reorderRenderJob(state: RenderQueueState, jobId: string, targetIndex: number): RenderQueueState {
  const jobIndex = state.queue.findIndex((j) => j.jobId === jobId);
  if (jobIndex === -1 || targetIndex < 0 || targetIndex >= state.queue.length) {
    return state;
  }

  const nextQueue = [...state.queue];
  const [removed] = nextQueue.splice(jobIndex, 1);
  nextQueue.splice(targetIndex, 0, removed);

  return {
    ...state,
    queue: nextQueue,
    updatedAt: Date.now(),
  };
}

/**
 * Duplicates an existing job in the queue or history to re-run with same configuration.
 */
export function duplicateRenderJob(state: RenderQueueState, jobId: string): { state: RenderQueueState; duplicatedJob: RenderJob | null } {
  const existingJob = state.queue.find((j) => j.jobId === jobId) ?? state.history.find((j) => j.jobId === jobId);
  if (!existingJob) {
    return { state, duplicatedJob: null };
  }

  const { state: nextState, job: duplicatedJob } = enqueueRenderJob(
    state,
    existingJob.projectId,
    existingJob.documentId,
    existingJob.exportConfig,
    { priority: existingJob.priority }
  );

  return { state: nextState, duplicatedJob };
}

/**
 * Retries a failed or cancelled job.
 */
export function retryRenderJob(state: RenderQueueState, jobId: string): { state: RenderQueueState; retriedJob: RenderJob | null } {
  const historyIndex = state.history.findIndex((j) => j.jobId === jobId);
  if (historyIndex === -1) {
    return { state, retriedJob: null };
  }

  const failedJob = state.history[historyIndex];
  if (failedJob.retryCount >= failedJob.maxRetries) {
    return { state, retriedJob: null };
  }

  const retriedJob: RenderJob = {
    ...failedJob,
    jobId: nextJobId(`job-retry-${failedJob.projectId}`),
    status: 'queued',
    retryCount: failedJob.retryCount + 1,
    enqueuedAt: Date.now(),
    startedAt: undefined,
    completedAt: undefined,
    errorDetails: undefined,
    progress: {
      currentFrame: 0,
      totalFrames: failedJob.progress.totalFrames,
      progressPercentage: 0,
      elapsedTimeMs: 0,
      renderingFps: 0,
      estimatedRemainingMs: 0,
    },
  };

  const nextHistory = state.history.filter((_, idx) => idx !== historyIndex);
  const nextQueue = [...state.queue, retriedJob];

  return {
    state: {
      ...state,
      queue: nextQueue,
      history: nextHistory,
      updatedAt: Date.now(),
    },
    retriedJob,
  };
}

/**
 * Clears all completed / cancelled jobs from history.
 */
export function clearCompletedRenderJobs(state: RenderQueueState): RenderQueueState {
  const nextHistory = state.history.filter((j) => j.status === 'failed');
  return {
    ...state,
    history: nextHistory,
    updatedAt: Date.now(),
  };
}

/**
 * Updates status and progress for a target job in the queue.
 */
export function updateJobProgressInQueue(
  state: RenderQueueState,
  jobId: string,
  status: RenderJobStatus,
  progress: RenderJobProgress,
  outputMetadata?: RenderJobOutputMetadata,
  errorDetails?: RenderJobErrorDetails
): RenderQueueState {
  const jobIndex = state.queue.findIndex((j) => j.jobId === jobId);
  if (jobIndex === -1) {
    return state;
  }

  const currentJob = state.queue[jobIndex];
  const now = Date.now();
  const isTerminal = status === 'completed' || status === 'failed' || status === 'cancelled';

  const updatedJob: RenderJob = {
    ...currentJob,
    status,
    progress,
    startedAt: currentJob.startedAt ?? (status === 'rendering' ? now : undefined),
    completedAt: isTerminal ? now : undefined,
    outputMetadata: outputMetadata ?? currentJob.outputMetadata,
    errorDetails: errorDetails ?? currentJob.errorDetails,
  };

  if (isTerminal) {
    const nextQueue = state.queue.filter((j) => j.jobId !== jobId);
    const nextHistory = [updatedJob, ...state.history];
    const activeJobId = state.activeJobId === jobId ? undefined : state.activeJobId;
    const isProcessing = activeJobId !== undefined;

    return {
      ...state,
      activeJobId,
      queue: nextQueue,
      history: nextHistory,
      isProcessing,
      updatedAt: now,
    };
  }

  const nextQueue = [...state.queue];
  nextQueue[jobIndex] = updatedJob;

  return {
    ...state,
    activeJobId: status === 'rendering' ? jobId : state.activeJobId,
    queue: nextQueue,
    isProcessing: true,
    updatedAt: now,
  };
}
