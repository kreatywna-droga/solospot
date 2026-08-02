import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor } from './PerformanceMonitor';

describe('PerformanceMonitor Foundation', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should measure sync function execution time', () => {
    const result = monitor.measure('sync_task', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    });

    expect(result).toBeGreaterThan(0);
    const metrics = monitor.getMetrics('sync_task');
    expect(metrics.length).toBe(1);
    expect(metrics[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should measure between marks', () => {
    monitor.mark('start');
    monitor.mark('end');
    const duration = monitor.measureBetween('start', 'end', 'between_test');

    expect(duration).toBeGreaterThanOrEqual(0);
    const metrics = monitor.getMetrics('between_test');
    expect(metrics.length).toBe(1);
  });

  it('should record frames and calculate FPS', () => {
    monitor.recordFrame(1000);
    monitor.recordFrame(1016.6); // 16.6ms frame delta (~60 FPS)
    monitor.recordFrame(1033.2);

    expect(monitor.getFPS()).toBe(60);
  });

  it('should calculate average duration for a metric', () => {
    monitor.recordMetric('render', 10);
    monitor.recordMetric('render', 20);
    monitor.recordMetric('render', 30);

    const avg = monitor.getAverageDuration('render');
    expect(avg).toBe(20);
  });

  it('should handle memory usage safely if performance.memory is undefined or present', () => {
    const mem = monitor.getMemoryUsage();
    // In node environment without memory object, should return null safely
    expect(mem === null || typeof mem.usedJSHeapSize === 'number').toBe(true);
  });
});
