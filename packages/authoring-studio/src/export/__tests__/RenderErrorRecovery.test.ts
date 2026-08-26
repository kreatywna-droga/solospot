/**
 * RenderErrorRecovery.test.ts — Sprint S27
 *
 * Tests for RenderErrorRecovery:
 * classifyRenderError, createJobErrorDetails,
 * createQueueRecoverySnapshot, restoreQueueFromRecoverySnapshot.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyRenderError,
  createJobErrorDetails,
  createQueueRecoverySnapshot,
  restoreQueueFromRecoverySnapshot,
} from '../RenderErrorRecovery';
import {
  createRenderQueueState,
  enqueueRenderJob,
  updateJobProgressInQueue,
  resetJobIdCounter,
} from '../RenderQueueEngine';
import { createExportWorkspaceConfig } from '../ExportWorkspaceModel';

const makeConfig = () => createExportWorkspaceConfig('proj-err');
const mockProgress = { currentFrame: 50, totalFrames: 300, progressPercentage: 16.67, elapsedTimeMs: 500, renderingFps: 100, estimatedRemainingMs: 2500 };

describe('classifyRenderError', () => {
  it('classifies Render-related errors as failed_render', () => {
    const result = classifyRenderError(new Error('Render failed on frame 50'));
    expect(result.category).toBe('failed_render');
    expect(result.isRetryable).toBe(true);
  });

  it('classifies export/format errors as failed_export', () => {
    const result = classifyRenderError(new Error('Export format encode error'));
    expect(result.category).toBe('failed_export');
  });

  it('classifies network/cloud errors as failed_connector', () => {
    const result = classifyRenderError(new Error('Connector network timeout'));
    expect(result.category).toBe('failed_connector');
  });

  it('classifies cancelled/interrupted as interrupted_job', () => {
    const result = classifyRenderError(new Error('Job was interrupted by user cancel'));
    expect(result.category).toBe('interrupted_job');
  });

  it('classifies unknown errors as unknown', () => {
    const result = classifyRenderError(new Error('Something completely unexpected'));
    expect(result.category).toBe('unknown');
  });

  it('computes exponential backoff correctly', () => {
    const r0 = classifyRenderError(new Error('err'), 0);
    const r1 = classifyRenderError(new Error('err'), 1);
    const r2 = classifyRenderError(new Error('err'), 2);
    expect(r0.recommendedBackoffMs).toBe(1000);
    expect(r1.recommendedBackoffMs).toBe(2000);
    expect(r2.recommendedBackoffMs).toBe(4000);
  });

  it('handles non-Error objects gracefully', () => {
    const result = classifyRenderError('plain string error');
    expect(result.message).toBe('plain string error');
  });
});

describe('createJobErrorDetails', () => {
  it('produces a RenderJobErrorDetails DTO with correct fields', () => {
    const details = createJobErrorDetails(new Error('Export encode error'), 'encoding', 1);
    expect(details.errorCode).toBe('ERR_FAILED_EXPORT');
    expect(details.phase).toBe('encoding');
    expect(details.isRetryable).toBe(true);
    expect(details.timestamp).toBeGreaterThan(0);
  });

  it('includes stack trace for Error instances', () => {
    const err = new Error('test');
    const details = createJobErrorDetails(err, 'render');
    expect(details.stackTrace).toBeTruthy();
  });

  it('omits stack trace for non-Error values', () => {
    const details = createJobErrorDetails('plain string', 'render');
    expect(details.stackTrace).toBeUndefined();
  });
});

describe('createQueueRecoverySnapshot', () => {
  beforeEach(() => {
    resetJobIdCounter();
  });

  it('snapshot captures queued jobs and active job ID', () => {
    let state = createRenderQueueState();
    let job;
    ({ state, job } = enqueueRenderJob(state, 'proj-err', 'doc-1', makeConfig()));
    state = updateJobProgressInQueue(state, job.jobId, 'rendering', mockProgress);

    const snapshot = createQueueRecoverySnapshot(state, 'Session crashed');
    expect(snapshot.activeJobId).toBe(job.jobId);
    expect(snapshot.interruptedJobId).toBe(job.jobId);
    expect(snapshot.queuedJobs).toHaveLength(1);
    expect(snapshot.recoveryReason).toBe('Session crashed');
    expect(snapshot.snapshotId).toMatch(/^snap-/);
  });
});

describe('restoreQueueFromRecoverySnapshot', () => {
  beforeEach(() => {
    resetJobIdCounter();
  });

  it('restores queue with interrupted job reset to queued status', () => {
    let state = createRenderQueueState();
    let job;
    ({ state, job } = enqueueRenderJob(state, 'proj-err', 'doc-1', makeConfig()));
    state = updateJobProgressInQueue(state, job.jobId, 'rendering', mockProgress);

    const snapshot = createQueueRecoverySnapshot(state, 'Crashed');
    const restored = restoreQueueFromRecoverySnapshot(snapshot);

    expect(restored.queue).toHaveLength(1);
    expect(restored.queue[0].status).toBe('queued');
    expect(restored.queue[0].startedAt).toBeUndefined();
    expect(restored.queue[0].errorDetails?.errorCode).toBe('ERR_INTERRUPTED_JOB');
    expect(restored.activeJobId).toBeUndefined();
    expect(restored.isProcessing).toBe(false);
  });

  it('non-interrupted jobs in snapshot keep their original status', () => {
    let state = createRenderQueueState();
    let j1, j2;
    ({ state, job: j1 } = enqueueRenderJob(state, 'proj-err', 'doc-1', makeConfig()));
    ({ state, job: j2 } = enqueueRenderJob(state, 'proj-err', 'doc-1', makeConfig()));
    // j1 is rendering (interrupted), j2 is just queued
    state = updateJobProgressInQueue(state, j1.jobId, 'rendering', mockProgress);

    const snapshot = createQueueRecoverySnapshot(state, 'Crash');
    const restored = restoreQueueFromRecoverySnapshot(snapshot);

    const restoredJ1 = restored.queue.find((j) => j.jobId === j1.jobId);
    const restoredJ2 = restored.queue.find((j) => j.jobId === j2.jobId);

    expect(restoredJ1?.status).toBe('queued'); // reset from rendering
    expect(restoredJ2?.status).toBe('queued'); // unchanged
  });

  it('preserves history from currentState during restore', () => {
    let state = createRenderQueueState();
    let job;
    ({ state, job } = enqueueRenderJob(state, 'proj-err', 'doc-1', makeConfig()));
    const progress = { currentFrame: 300, totalFrames: 300, progressPercentage: 100, elapsedTimeMs: 3000, renderingFps: 100, estimatedRemainingMs: 0 };
    state = updateJobProgressInQueue(state, job.jobId, 'completed', progress);

    // Now there is 1 completed job in history
    const snapshot = createQueueRecoverySnapshot(state, 'Restart');
    // snapshotted queue is empty (all in history), but we pass currentState to preserve history
    const restored = restoreQueueFromRecoverySnapshot(snapshot, state);
    expect(restored.history).toHaveLength(1);
    expect(restored.history[0].status).toBe('completed');
  });
});
