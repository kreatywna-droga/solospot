/**
 * JobScheduling.ts — PM45 Job Scheduling & Retry Policy (ETAP 5)
 *
 * Job descriptors, job queues, retry policies, and execution metadata models.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

export interface RetryPolicy {
  readonly maxRetries: number;
  readonly backoffMultiplierMs: number;
}

export interface JobDescriptor {
  readonly jobId: string;
  readonly name: string;
  readonly payload: Record<string, unknown>;
  readonly retryPolicy: RetryPolicy;
  readonly scheduledAt: number;
}

export interface JobExecutionRecord {
  readonly job: JobDescriptor;
  readonly status: JobStatus;
  readonly attempts: number;
  readonly lastError?: string;
  readonly updatedTimestamp: number;
}

export interface JobQueueState {
  readonly jobs: ReadonlyArray<JobExecutionRecord>;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  backoffMultiplierMs: 1000,
};

export function createJobQueueState(initialJobs: ReadonlyArray<JobExecutionRecord> = []): JobQueueState {
  return { jobs: [...initialJobs] };
}

export function enqueueJob(
  state: JobQueueState,
  job: JobDescriptor
): JobQueueState {
  const record: JobExecutionRecord = {
    job,
    status: 'pending',
    attempts: 0,
    updatedTimestamp: Date.now(),
  };

  return {
    jobs: [...state.jobs, record],
  };
}
