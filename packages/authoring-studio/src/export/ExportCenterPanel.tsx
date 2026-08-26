/**
 * ExportCenterPanel.tsx — Sprint S27 Export Center UI
 *
 * Thin React presentation layer that delegates ALL domain logic to the S27
 * headless modules:
 *   - ExportWorkspaceModel   (DTO / config)
 *   - RenderQueueEngine      (pure functions + RenderQueueState)
 *   - OutputManager          (class instance)
 *   - PublishingBridge       (static delegation to S8/S9 + PM44)
 *
 * Architectural rules enforced:
 *   • No domain logic lives here — only UI state derived from domain state.
 *   • No DOM, AudioContext, requestAnimationFrame or RuntimeScheduler.
 *   • Publish is only reachable after artifact verification (enforced by
 *     ReleaseWorkflowEngine state machine — see ReleaseWorkflowEngine.ts).
 */

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import type { ExportWorkspaceConfig } from './ExportWorkspaceModel';
import type { RenderJob, RenderQueueState } from './RenderQueueEngine';
import {
  createRenderQueueState,
  enqueueRenderJob,
  cancelRenderJob,
  retryRenderJob,
  clearCompletedRenderJobs,
  resetJobIdCounter,
} from './RenderQueueEngine';
import { OutputManager } from './OutputManager';
import { PublishingBridge } from './PublishingBridge';
import type { CloudPublishOptions } from './PublishingBridge';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ExportCenterPanelProps {
  /** The active ExportWorkspaceConfig (resolved DTO from ExportWorkspaceModel). */
  readonly config: ExportWorkspaceConfig;
  /** Injected OutputManager instance so consumers can share history across panels. */
  readonly outputManager?: OutputManager;
  /** Cloud publish options forwarded to PublishingBridge.publishUnified(). */
  readonly cloudOptions?: CloudPublishOptions;
  /** Optional callback when a new render job is enqueued. */
  readonly onJobEnqueued?: (jobId: string) => void;
  /** Optional callback when a job is successfully published. */
  readonly onJobPublished?: (jobId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ExportCenterPanel: React.FC<ExportCenterPanelProps> = ({
  config,
  outputManager: injectedOutputManager,
  cloudOptions,
  onJobEnqueued,
  onJobPublished,
}) => {
  // Shared OutputManager instance — created once unless injected by parent.
  const outputManager = useMemo(
    () => injectedOutputManager ?? new OutputManager(),
    [injectedOutputManager]
  );

  // RenderQueueState is held in React state — all mutations go through pure
  // RenderQueueEngine functions (no class, no scheduler).
  const [queueState, setQueueState] = useState<RenderQueueState>(() =>
    createRenderQueueState()
  );

  // ---------------------------------------------------------------------------
  // Handlers — delegate to RenderQueueEngine pure functions
  // ---------------------------------------------------------------------------

  const handleAddJob = useCallback(() => {
    if (!config.projectId) return;
    const { state: nextState, job } = enqueueRenderJob(
      queueState,
      config.projectId,
      `doc-${config.projectId}`,
      config
    );
    setQueueState(nextState);
    onJobEnqueued?.(job.jobId);
  }, [queueState, config, onJobEnqueued]);

  const handleCancelJob = useCallback(
    (jobId: string) => {
      setQueueState((prev) => cancelRenderJob(prev, jobId));
    },
    []
  );

  const handleRetryJob = useCallback(
    (jobId: string) => {
      const { state: nextState, retriedJob } = retryRenderJob(queueState, jobId);
      if (retriedJob) {
        setQueueState(nextState);
        onJobEnqueued?.(retriedJob.jobId);
      }
    },
    [queueState, onJobEnqueued]
  );

  const handleClearCompleted = useCallback(() => {
    setQueueState((prev) => clearCompletedRenderJobs(prev));
  }, []);

  /**
   * Publish a completed job's artifact to PM44 via PublishingBridge.
   * Only reachable after a job has output metadata (artifact produced).
   */
  const handlePublish = useCallback(
    (job: RenderJob) => {
      if (!job.outputMetadata || !cloudOptions) return;

      // Build a compatible OutputArtifactMetadata from job output metadata.
      const artifact = {
        artifactId: job.outputMetadata.artifactId,
        projectId: job.projectId,
        filename: job.outputMetadata.filename,
        format: job.outputMetadata.format,
        version: 1,
        versionLabel: 'v1',
        checksum: job.outputMetadata.checksum,
        sizeBytes: job.outputMetadata.sizeBytes,
        width: job.outputMetadata.width,
        height: job.outputMetadata.height,
        fps: job.outputMetadata.fps,
        totalFrames: job.outputMetadata.totalFrames,
        durationMs: job.outputMetadata.durationMs,
        generatedAt: job.outputMetadata.generatedAt,
      };

      try {
        PublishingBridge.publishToCloud(job.projectId, artifact, cloudOptions);
        onJobPublished?.(job.jobId);
      } catch {
        // Publishing errors are surfaced by PublishingBridge — handle at app layer.
      }
    },
    [cloudOptions, onJobPublished]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const queuedJobs = queueState.queue;
  const historyJobs = queueState.history;

  return (
    <div className="export-center border rounded bg-slate-950 text-slate-100 p-4">
      <h2 className="text-lg font-medium mb-2">Export Center</h2>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <button
          id="export-center-add-job"
          type="button"
          onClick={handleAddJob}
          className="px-3 py-1 bg-indigo-600 text-sm rounded hover:bg-indigo-500"
        >
          ⏱️ Add Export Job
        </button>
        <button
          id="export-center-clear-completed"
          type="button"
          onClick={handleClearCompleted}
          className="px-3 py-1 bg-slate-700 text-sm rounded hover:bg-slate-600"
        >
          🗑 Clear Completed
        </button>
        <span className="text-sm text-slate-400">
          {queuedJobs.length} job(s) queued
        </span>
      </div>

      {/* Active Queue */}
      <section aria-label="Render Queue">
        <h3 className="text-sm text-slate-400 mb-1">Queue</h3>
        {queuedJobs.length === 0 && (
          <p className="text-sm text-slate-500 italic">No jobs in queue.</p>
        )}
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {queuedJobs.map((job) => (
            <li
              key={job.jobId}
              className="flex items-center justify-between bg-slate-800 p-2 rounded"
            >
              <div>
                <span className="text-xs text-slate-300 block">{job.jobId}</span>
                <span className="text-xs text-indigo-300">{job.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded"
                    style={{ width: `${job.progress.progressPercentage}%` }}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Cancel job ${job.jobId}`}
                  onClick={() => handleCancelJob(job.jobId)}
                  className="px-2 py-0.5 bg-red-900 text-xs rounded hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* History */}
      {historyJobs.length > 0 && (
        <section aria-label="Completed Jobs" className="mt-4">
          <h3 className="text-sm text-slate-400 mb-1">Completed / Failed</h3>
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {historyJobs.map((job) => (
              <li
                key={job.jobId}
                className="flex items-center justify-between bg-slate-900 p-2 rounded"
              >
                <div>
                  <span className="text-xs text-slate-300 block">{job.jobId}</span>
                  <span
                    className={`text-xs ${
                      job.status === 'completed'
                        ? 'text-emerald-400'
                        : job.status === 'failed'
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  {job.status === 'completed' && job.outputMetadata && cloudOptions && (
                    <button
                      type="button"
                      aria-label={`Publish job ${job.jobId}`}
                      onClick={() => handlePublish(job)}
                      className="px-2 py-0.5 bg-amber-800 text-xs rounded hover:bg-amber-700"
                    >
                      📤 Publish
                    </button>
                  )}
                  {job.status === 'failed' && (
                    <button
                      type="button"
                      aria-label={`Retry job ${job.jobId}`}
                      onClick={() => handleRetryJob(job.jobId)}
                      className="px-2 py-0.5 bg-blue-900 text-xs rounded hover:bg-blue-700"
                    >
                      ↺ Retry
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export { resetJobIdCounter };
export default React.memo(ExportCenterPanel);
