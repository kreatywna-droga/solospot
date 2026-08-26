import { describe, it, expect } from 'vitest';
import { validateDeploymentArtifacts } from '../DeploymentPipeline';

describe('DeploymentPipeline (PM44, ETAP 5 & DECISION-088)', () => {
  it('enforces verified artifacts rule for deployment (DECISION-088)', () => {
    const verifiedArtifacts = [
      {
        artifactId: 'art-bundle-1',
        type: 'bundle' as const,
        checksum: 'chk-123',
        payload: {},
        isVerified: true,
      },
    ];

    const report = validateDeploymentArtifacts(verifiedArtifacts);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);

    const unverifiedArtifacts = [
      {
        artifactId: 'art-bundle-2',
        type: 'bundle' as const,
        checksum: 'chk-456',
        payload: {},
        isVerified: false,
      },
    ];

    const invalidReport = validateDeploymentArtifacts(unverifiedArtifacts);
    expect(invalidReport.isValid).toBe(false);
    expect(invalidReport.unverifiedArtifactIds).toContain('art-bundle-2');
  });
});
