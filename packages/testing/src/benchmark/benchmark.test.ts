import { describe, it, expect } from 'vitest';
import { BenchmarkRunner } from './BenchmarkRunner';

describe('Benchmark Helpers', () => {
  it('should run benchmark and calculate iterations, average, median, and P95', () => {
    const res = BenchmarkRunner.run('test_task', () => {
      let sum = 0;
      for (let i = 0; i < 100; i++) sum += i;
    }, 50);

    expect(res.name).toBe('test_task');
    expect(res.iterations).toBe(50);
    expect(res.averageTimeMs).toBeGreaterThanOrEqual(0);
    expect(res.medianMs).toBeGreaterThanOrEqual(0);
    expect(res.p95Ms).toBeGreaterThanOrEqual(res.medianMs);
  });
});
