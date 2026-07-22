import { UsageEngine } from './UsageEngine';
import { describe, it, expect } from 'vitest';

describe('UsageEngine', () => {
  const engine = new UsageEngine();

  it('should record usage', () => {
    const record = engine.recordUsage('org-1', 'storage', 10);
    expect(record.organizationId).toBe('org-1');
    expect(record.metric).toBe('storage');
    expect(record.value).toBe(10);
    expect(record.id).toMatch(/^usage-/);
  });

  it('should get total usage', () => {
    engine.recordUsage('org-2', 'apiCalls', 100);
    engine.recordUsage('org-2', 'apiCalls', 50);
    expect(engine.getTotalUsage('org-2', 'apiCalls')).toBe(150);
  });

  it('should return zero for no usage', () => {
    expect(engine.getTotalUsage('org-xyz', 'bandwidth')).toBe(0);
  });

  it('should get daily usage', () => {
    const today = new Date().toISOString().split('T')[0];
    engine.recordUsage('org-3', 'aiCredits', 10);
    const daily = engine.getDailyUsage('org-3', 'aiCredits');
    expect(daily[today]).toBe(10);
  });

  it('should reset daily usage', () => {
    engine.recordUsage('org-4', 'storage', 100);
    engine.resetDailyUsage('org-4', 'storage');
    expect(engine.getTotalUsage('org-4', 'storage')).toBe(0);
  });
});