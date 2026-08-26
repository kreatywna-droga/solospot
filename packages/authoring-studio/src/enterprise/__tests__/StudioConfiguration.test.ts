import { describe, it, expect } from 'vitest';
import { validateStudioConfiguration, type StudioConfiguration } from '../StudioConfiguration';

const mockConfig: StudioConfiguration = {
  profile: {
    profileId: 'prof-dev',
    name: 'Development Profile',
    environment: 'development',
    settings: {
      enableTelemetry: true,
      apiEndpoint: 'http://localhost:3000',
    },
  },
  schema: {
    schemaVersion: '1.0.0',
    requiredKeys: ['enableTelemetry', 'apiEndpoint'],
  },
};

describe('StudioConfiguration (PM46, ETAP 7 & DECISION-099)', () => {
  it('validates studio configuration profiles passively (DECISION-099)', () => {
    const report = validateStudioConfiguration(mockConfig);
    expect(report.isValid).toBe(true);
    expect(report.missingKeys).toHaveLength(0);
  });
});
