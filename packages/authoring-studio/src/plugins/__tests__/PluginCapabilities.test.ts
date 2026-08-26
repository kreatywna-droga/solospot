import { describe, it, expect } from 'vitest';
import { KNOWN_CAPABILITIES } from '../PluginCapabilities';
import { auditPluginSecurity } from '../PluginSecurity';
import type { PluginManifest } from '../PluginManifest';

const mockManifest: PluginManifest = {
  metadata: {
    pluginId: 'plugin-cap-test',
    name: 'Capability Test Plugin',
    version: '1.0.0',
    apiVersion: '1.0.0',
    author: 'Author',
    description: 'Desc',
  },
  capabilities: ['timeline:read'],
  permissions: {
    declaredCapabilities: ['timeline:read'],
    grantedCapabilities: ['timeline:read'],
  },
  compatibility: { minStudioVersion: '1.0.0' },
  entryPoint: 'index.js',
};

describe('PluginCapabilities & Security (PM43, ETAP 1, ETAP 6 & DECISION-081)', () => {
  it('provides known capability descriptors (DECISION-081)', () => {
    expect(KNOWN_CAPABILITIES.length).toBeGreaterThanOrEqual(10);
    const readTimelineCap = KNOWN_CAPABILITIES.find((c) => c.capability === 'timeline:read');
    expect(readTimelineCap).toBeDefined();
  });

  it('audits plugin security compliance against declared permissions', () => {
    const report = auditPluginSecurity(mockManifest);
    expect(report.isSecured).toBe(true);
    expect(report.violations).toHaveLength(0);
  });
});
