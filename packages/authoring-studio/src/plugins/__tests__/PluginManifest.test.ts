import { describe, it, expect } from 'vitest';
import { validatePluginManifest, type PluginManifest } from '../PluginManifest';
import { validatePluginMetadata } from '../PluginMetadata';

const mockManifest: PluginManifest = {
  metadata: {
    pluginId: 'plugin-sample-exporter',
    name: 'Sample Exporter Plugin',
    version: '1.0.0',
    apiVersion: '1.0.0',
    author: 'PluginDev',
    description: 'Sample exporter plugin description',
  },
  capabilities: ['timeline:read', 'production:export'],
  permissions: {
    declaredCapabilities: ['timeline:read', 'production:export'],
    grantedCapabilities: ['timeline:read', 'production:export'],
  },
  compatibility: {
    minStudioVersion: '1.0.0',
  },
  entryPoint: 'index.js',
};

describe('PluginManifest (PM43, ETAP 1)', () => {
  it('validates plugin metadata and manifest structure', () => {
    expect(validatePluginMetadata(mockManifest.metadata)).toBe(true);
    expect(validatePluginMetadata(null)).toBe(false);

    const report = validatePluginManifest(mockManifest);
    expect(report.isValid).toBe(true);

    const invalidReport = validatePluginManifest({});
    expect(invalidReport.isValid).toBe(false);
  });
});
