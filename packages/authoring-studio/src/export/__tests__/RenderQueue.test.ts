/**
 * RenderQueue.test.ts — Sprint S27
 *
 * Tests for RenderQueueEngine pure functions:
 * enqueueRenderJob, cancelRenderJob, retryRenderJob, reorderRenderJob,
 * duplicateRenderJob, clearCompletedRenderJobs, updateJobProgressInQueue.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRenderQueueState,
  createRenderJob,
  enqueueRenderJob,
  cancelRenderJob,
  retryRenderJob,
  reorderRenderJob,
  duplicateRenderJob,
  clearCompletedRenderJobs,
  updateJobProgressInQueue,
  resetJobIdCounter,
} from '../RenderQueueEngine';
import { createExportWorkspaceConfig } from '../ExportWorkspaceModel';

const makeConfig = () => createExportWorkspaceConfig('proj-test');

describe('RenderQueueEngine', () => {
  beforeEach(() => {
    resetJobIdCounter();
  });

  // ── createRenderQueueState ──────────────────────────────────────────────
  it('createRenderQueueState returns empty immutable state', () => {
    const state = createRenderQueueState();
    expect(state.queue).toHaveLength(0);
    expect(state.history).toHaveLength(0);
    expect(state.isProcessing).toBe(false);
    expect(state.activeJobId).toBeUndefined();
  });

  // ── enqueueRenderJob ────────────────────────────────────────────────────
  it('enqueueRenderJob adds a job with status queued', () => {
    const state = createRenderQueueState();
    const { state: next, job } = enqueueRenderJob(state, 'proj-1', 'doc-1', makeConfig());
    expect(next.queue).toHaveLength(1);
    expect(next.queue[0].status).toBe('queued');
    expect(next.queue[0].jobId).toBe(job.jobId);
    expect(next.queue[0].retryCount).toBe(0);
  });

  it('enqueueRenderJob does not mutate original state', () => {
    const state = createRenderQueueState();
    enqueueRenderJob(state, 'proj-1', 'doc-1', makeConfig());
    expect(state.queue).toHaveLength(0); // original unchanged
  });

  it('job IDs are deterministic — no Math.random()', () => {
    const state = createRenderQueueState();
    const { job: job1 } = enqueueRenderJob(state, 'proj-1', 'doc-1', makeConfig());
    const { job: job2 } = enqueueRenderJob(state, 'proj-1', 'doc-1', makeConfig());
    // Counters increment — IDs differ but are not random
    expect(job1.jobId).toMatch(/^job-proj-1-\d+$/);
    expect(job2.jobId).toMatch(/^job-proj-1-\d+$/);
    expect(job1.jobId).not.toBe(job2.jobId);
  });

  // ── cancelRenderJob ─────────────────────────────────────────────────────
  it('cancelRenderJob moves job to history with cancelled status', () => {
    let state = createRenderQueueState();
    let job;
    ({ state, job } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    state = cancelRenderJob(state, job.jobId);
    expect(state.queue).toHaveLength(0);
    expect(state.history).toHaveLength(1);
    expect(state.history[0].status).toBe('cancelled');
  });

  it('cancelRenderJob on unknown id returns unchanged state', () => {
    const state = createRenderQueueState();
    const next = cancelRenderJob(state, 'no-such-id');
    expect(next).toBe(state);
  });

  // ── retryRenderJob ──────────────────────────────────────────────────────
  it('retryRenderJob re-enqueues failed job with incremented retryCount', () => {
    let state = createRenderQueueState();
    let job;
    ({ state, job } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    // Simulate failure
    const progress = { currentFrame: 0, totalFrames: 300, progressPercentage: 0, elapsedTimeMs: 0, renderingFps: 0, estimatedRemainingMs: 0 };
    state = updateJobProgressInQueue(state, job.jobId, 'failed', progress);
    expect(state.history).toHaveLength(1);

    const { state: retried, retriedJob } = retryRenderJob(state, job.jobId);
    expect(retriedJob).not.toBeNull();
    expect(retried.queue).toHaveLength(1);
    expect(retried.queue[0].retryCount).toBe(1);
    expect(retried.queue[0].status).toBe('queued');
    expect(retried.queue[0].startedAt).toBeUndefined();
    expect(retried.queue[0].errorDetails).toBeUndefined();
  });

  it('retryRenderJob does NOT re-enqueue when maxRetries exhausted', () => {
    let state = createRenderQueueState();
    let job;
    ({ state, job } = enqueueRenderJob(state, 'p', 'd', makeConfig(), { maxRetries: 0 }));
    const progress = { currentFrame: 0, totalFrames: 300, progressPercentage: 0, elapsedTimeMs: 0, renderingFps: 0, estimatedRemainingMs: 0 };
    state = updateJobProgressInQueue(state, job.jobId, 'failed', progress);
    const { retriedJob } = retryRenderJob(state, job.jobId);
    expect(retriedJob).toBeNull();
  });

  it('retry does not produce duplicate artifacts — new jobId assigned', () => {
    let state = createRenderQueueState();
    let job;
    ({ state, job } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    const progress = { currentFrame: 0, totalFrames: 300, progressPercentage: 0, elapsedTimeMs: 0, renderingFps: 0, estimatedRemainingMs: 0 };
    state = updateJobProgressInQueue(state, job.jobId, 'failed', progress);
    const { state: retried, retriedJob } = retryRenderJob(state, job.jobId);
    expect(retriedJob!.jobId).not.toBe(job.jobId);
    expect(retried.queue[0].outputMetadata).toBeUndefined();
  });

  // ── reorderRenderJob ─────────────────────────────────────────────────────
  it('reorderRenderJob moves job to target index', () => {
    let state = createRenderQueueState();
    let j1, j2, j3;
    ({ state, job: j1 } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    ({ state, job: j2 } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    ({ state, job: j3 } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    state = reorderRenderJob(state, j1.jobId, 2);
    expect(state.queue[0].jobId).toBe(j2.jobId);
    expect(state.queue[2].jobId).toBe(j1.jobId);
  });

  // ── duplicateRenderJob ───────────────────────────────────────────────────
  it('duplicateRenderJob adds a new queued job preserving config', () => {
    let state = createRenderQueueState();
    let job;
    ({ state, job } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    const { state: next, duplicatedJob } = duplicateRenderJob(state, job.jobId);
    expect(duplicatedJob).not.toBeNull();
    expect(next.queue).toHaveLength(2);
    expect(duplicatedJob!.jobId).not.toBe(job.jobId);
    expect(duplicatedJob!.exportConfig).toEqual(job.exportConfig);
  });

  // ── clearCompletedRenderJobs ─────────────────────────────────────────────
  it('clearCompletedRenderJobs removes completed/cancelled from history but keeps failed', () => {
    let state = createRenderQueueState();
    let j1, j2;
    ({ state, job: j1 } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    ({ state, job: j2 } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    const progress = { currentFrame: 0, totalFrames: 300, progressPercentage: 0, elapsedTimeMs: 0, renderingFps: 0, estimatedRemainingMs: 0 };
    state = updateJobProgressInQueue(state, j1.jobId, 'completed', progress);
    state = updateJobProgressInQueue(state, j2.jobId, 'failed', progress);
    state = clearCompletedRenderJobs(state);
    expect(state.history).toHaveLength(1);
    expect(state.history[0].status).toBe('failed');
  });

  // ── state machine transitions ────────────────────────────────────────────
  it('updateJobProgressInQueue → rendering sets activeJobId', () => {
    let state = createRenderQueueState();
    let job;
    ({ state, job } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    const progress = { currentFrame: 50, totalFrames: 300, progressPercentage: 16.67, elapsedTimeMs: 500, renderingFps: 100, estimatedRemainingMs: 2500 };
    state = updateJobProgressInQueue(state, job.jobId, 'rendering', progress);
    expect(state.activeJobId).toBe(job.jobId);
    expect(state.isProcessing).toBe(true);
    expect(state.queue[0].status).toBe('rendering');
  });

  it('updateJobProgressInQueue → completed moves to history', () => {
    let state = createRenderQueueState();
    let job;
    ({ state, job } = enqueueRenderJob(state, 'p', 'd', makeConfig()));
    const progress = { currentFrame: 300, totalFrames: 300, progressPercentage: 100, elapsedTimeMs: 3000, renderingFps: 100, estimatedRemainingMs: 0 };
    state = updateJobProgressInQueue(state, job.jobId, 'completed', progress);
    expect(state.queue).toHaveLength(0);
    expect(state.history[0].status).toBe('completed');
    expect(state.activeJobId).toBeUndefined();
  });
});
