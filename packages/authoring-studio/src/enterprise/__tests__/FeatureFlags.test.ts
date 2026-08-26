import { describe, it, expect } from 'vitest';
import { isFeatureGateEnabled, type FeatureFlagModel } from '../FeatureFlags';

const mockFlag: FeatureFlagModel = {
  flagId: 'ff-ai-beta',
  key: 'ai_assistance_beta',
  name: 'AI Assistance Beta',
  description: 'Enables AI features in Studio',
  defaultValue: false,
  strategy: { type: 'boolean' },
  environmentOverrides: {
    staging: true,
    production: false,
  },
};

describe('FeatureFlags (PM46, ETAP 2 & DECISION-096)', () => {
  it('evaluates feature gates and environment overrides independently of Runtime Engine (DECISION-096)', () => {
    expect(isFeatureGateEnabled(mockFlag, 'staging')).toBe(true);
    expect(isFeatureGateEnabled(mockFlag, 'production')).toBe(false);
  });
});
