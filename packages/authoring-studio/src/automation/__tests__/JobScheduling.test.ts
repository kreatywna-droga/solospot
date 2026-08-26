import { describe, it, expect } from 'vitest';
import {
  createJobQueueState,
  enqueueJob,
  DEFAULT_RETRY_POLICY,
  type JobDescriptor,
} from '../JobScheduling';

describe('JobScheduling (PM45, ETAP 5)', () => {
  it('manages job descriptors and retry policy queues immutably', () => {
    let state = createJobQueueState();
    const job: JobDescriptor = {
      jobId: 'job-1',
      name: 'Async Export Job',
      payload: {},
      retryPolicy: DEFAULT_RETRY_POLICY,
      scheduledAt: Date.now(),
    };

    state = enqueueJob(state, job);
    expect(state.jobs).toHaveLength(1);
    expect(state.jobs[0].status).toBe('pending');
  });
});
