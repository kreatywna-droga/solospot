import { describe, it, expect } from 'vitest';
import { auditStudioStability } from '../StabilityChecklist';

describe('StabilityChecklist (PM48, ETAP 4 & DECISION-106)', () => {
  it('audits studio stability without modifying runtime modules (DECISION-106)', () => {
    const report = auditStudioStability();
    expect(report.isStable).toBe(true);
    expect(report.items.every((i) => i.isPassing)).toBe(true);
  });
});
