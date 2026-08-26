/**
 * RenderErrorRecovery.ts — Sprint S27 Error Handling, Diagnostics & Queue Recovery
 *
 * Classifies render/export/connector errors, evaluates retry eligibility with exponential backoff,
 * and maintains serializable queue recovery state snapshots (RenderRecoveryState) for crash recovery.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { RenderJob, RenderJobErrorDetails, RenderQueueState } from './RenderQueueEngine';

export type ErrorCategory = 'failed_render' | 'failed_export' | 'failed_connector' | 'interrupted_job' | 'unknown';

export interface ClassifiedRenderError {
  readonly category: ErrorCategory;
  readonly message: string;
  readonly isRetryable: boolean;
  readonly recommendedBackoffMs: number;
  readonly rawError?: unknown;
}

export interface RenderRecoverySnapshot {
  readonly snapshotId: string;
  readonly timestamp: number;
  readonly activeJobId?: string;
  readonly queuedJobs: ReadonlyArray<RenderJob>;
  readonly interruptedJobId?: string;
  readonly recoveryReason: string;
}

/**
 * Classifies an error into a structured ClassifiedRenderError DTO.
 */
export function classifyRenderError(error: unknown, retryAttempt: number = 0): ClassifiedRenderError {
  const message = error instanceof Error ? error.message : String(error);
  let category: ErrorCategory = 'unknown';
  let isRetryable = true;

  if (message.includes('Render') || message.includes('frame') || message.includes('canvas')) {
    category = 'failed_render';
  } else if (message.includes('Export') || message.includes('format') || message.includes('encode')) {
    category = 'failed_export';
  } else if (message.includes('Connector') || message.includes('upload') || message.includes('network') || message.includes('cloud')) {
    category = 'failed_connector';
  } else if (message.includes('interrupted') || message.includes('cancel') || message.includes('timeout')) {
    category = 'interrupted_job';
  }

  // Calculate exponential backoff delay (1s, 2s, 4s, 8s...)
  const baseDelayMs = 1000;
  const recommendedBackoffMs = baseDelayMs * Math.pow(2, Math.max(0, retryAttempt));

  return {
    category,
    message,
    isRetryable,
    recommendedBackoffMs,
    rawError: error,
  };
}

/**
 * Converts ClassifiedRenderError to RenderJobErrorDetails DTO.
 */
export function createJobErrorDetails(
  error: unknown,
  phase: string,
  retryAttempt: number = 0
): RenderJobErrorDetails {
  const classified = classifyRenderError(error, retryAttempt);
  return {
    errorCode: `ERR_${classified.category.toUpperCase()}`,
    message: classified.message,
    phase,
    timestamp: Date.now(),
    stackTrace: error instanceof Error ? error.stack : undefined,
    isRetryable: classified.isRetryable,
  };
}

/**
 * Creates a crash/interruption recovery snapshot from RenderQueueState.
 */
export function createQueueRecoverySnapshot(
  queueState: RenderQueueState,
  recoveryReason: string = 'Interrupted due to session restart'
): RenderRecoverySnapshot {
  const now = Date.now();
  return {
    snapshotId: `snap-${now}`,
    timestamp: now,
    activeJobId: queueState.activeJobId,
    queuedJobs: [...queueState.queue],
    interruptedJobId: queueState.activeJobId,
    recoveryReason,
  };
}

/**
 * Restores a RenderQueueState from a RenderRecoverySnapshot.
 * Resets any active/interrupted job back to 'queued' status so it can safely retry.
 */
export function restoreQueueFromRecoverySnapshot(
  snapshot: RenderRecoverySnapshot,
  currentState?: RenderQueueState
): RenderQueueState {
  const now = Date.now();

  const restoredQueue: RenderJob[] = snapshot.queuedJobs.map((job) => {
    if (job.jobId === snapshot.interruptedJobId || job.status === 'rendering') {
      return {
        ...job,
        status: 'queued',
        startedAt: undefined,
        errorDetails: {
          errorCode: 'ERR_INTERRUPTED_JOB',
          message: snapshot.recoveryReason,
          phase: 'processing',
          timestamp: now,
          isRetryable: true,
        },
      };
    }
    return job;
  });

  return {
    activeJobId: undefined,
    queue: restoredQueue,
    history: currentState?.history ?? [],
    isProcessing: false,
    updatedAt: now,
  };
}
