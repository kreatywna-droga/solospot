import { describe, it, expect } from 'vitest';
import { WorkerPool } from './WorkerPool';

describe('WorkerPool', () => {
  const pool = new WorkerPool();

  it('should create queue', () => {
    const queue = pool.createQueue('publish');
    expect(queue.name).toBe('publish');
    expect(queue.tasks).toHaveLength(0);
  });

  it('should enqueue task', () => {
    pool.enqueue('publish', {
      id: 'task-1',
      type: 'deploy',
      payload: { storeId: 's-1' },
      priority: 1,
      attempts: 0,
      maxAttempts: 3
    });

    const queue = pool.getQueue('publish');
    expect(queue?.tasks.length).toBe(1);
  });

  it('should create worker', () => {
    const worker = pool.createWorker('publisher');
    expect(worker.id).toMatch(/^worker-/);
    expect(worker.status).toBe('idle');
  });
});