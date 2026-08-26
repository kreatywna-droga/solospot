import { describe, it, expect } from 'vitest';
import { validateStudioArchitecture } from '../ArchitectureValidator';

describe('ArchitectureValidator (Sprint S1, ETAP 4)', () => {
  it('validates studio architecture across all freeze and boundary rules', () => {
    const res = validateStudioArchitecture();
    expect(res.isValid).toBe(true);
    expect(res.rules).toHaveLength(5);
    expect(res.rules.every((r) => r.isPassing)).toBe(true);
  });
});
