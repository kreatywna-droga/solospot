import { describe, it, expect } from 'vitest';
import { ALL_BETA_SCENARIOS, SCENARIO_CREATE_PROJECT } from '../EndToEndScenarios';

describe('EndToEndValidation (PM48, ETAP 1 & DECISION-107)', () => {
  it('validates all 10 end-to-end user scenarios for Beta release (DECISION-107)', () => {
    expect(ALL_BETA_SCENARIOS).toHaveLength(10);
    expect(ALL_BETA_SCENARIOS.every((s) => s.isVerified)).toBe(true);
    expect(SCENARIO_CREATE_PROJECT.scenarioKey).toBe('CreateProject');
  });
});
