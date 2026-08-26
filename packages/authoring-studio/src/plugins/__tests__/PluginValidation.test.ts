import { describe, it, expect } from 'vitest';
import { validatePluginCompatibility } from '../PluginValidator';
import type { PluginManifest } from '../PluginManifest';

const mockManifest: PluginManifest = {
  metadata: {
    pluginId: 'plugin-v1',
    name: 'Plugin V1',
    version: '1.0.0',
    apiVersion: '1.2.0',
    author: 'Author',
    description: 'Desc',
  },
  capabilities: ['timeline:read'],
  permissions: { declaredCapabilities: ['timeline:read'], grantedCapabilities: ['timeline:read'] },
  compatibility: { minStudioVersion: '1.0.0' },
  entryPoint: 'index.js',
};

describe('PluginValidation (PM43, ETAP 2 & DECISION-084)', () => {
  it('validates plugin API version compatibility independently (DECISION-084)', () => {
    const report = validatePluginCompatibility(mockManifest, '1.0.0');
    expect(report.isCompatible).toBe(true);

    const incompatibleManifest: PluginManifest = {
      ...mockManifest,
      metadata: { ...mockManifest.metadata, apiVersion: '2.0.0' },
    };

    const incompReport = validatePluginCompatibility(incompatibleManifest, '1.0.0');
    expect(incompReport.isCompatible).toBe(false);
  });
});
