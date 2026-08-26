import { describe, it, expect } from 'vitest';
import { createPluginSandbox } from '../PluginSandbox';
import { createPublicExtensionAPI } from '../PublicExtensionAPI';
import type { PluginManifest } from '../PluginManifest';

const mockManifest: PluginManifest = {
  metadata: {
    pluginId: 'plugin-sandbox-test',
    name: 'Sandbox Plugin',
    version: '1.0.0',
    apiVersion: '1.0.0',
    author: 'Author',
    description: 'Desc',
  },
  capabilities: ['timeline:read'],
  permissions: {
    declaredCapabilities: ['timeline:read'],
    grantedCapabilities: ['timeline:read'], // timeline:write not granted
  },
  compatibility: { minStudioVersion: '1.0.0' },
  entryPoint: 'main.js',
};

describe('PluginSandbox (PM43, ETAP 6 & DECISION-080, DECISION-082, DECISION-083)', () => {
  it('enforces sandbox capability isolation (DECISION-083)', () => {
    const baseAPI = createPublicExtensionAPI({
      timelineAPI: { inspectTimeline: () => null, applyTimeline: (d) => d },
      inspectorAPI: { registerPropertyEditor: () => {} },
      assetsAPI: { getAssetById: () => null, registerAsset: () => {} },
      productionAPI: { exportTimeline: () => null, validateTimeline: () => null },
      commandsAPI: { registerCommand: () => {} },
    });

    const sandbox = createPluginSandbox(mockManifest, baseAPI);

    // Permitted capability execution
    const readResult = sandbox.executeGuarded('timeline:read', () => 'success_read');
    expect(readResult).toBe('success_read');

    // Unpermitted capability execution throws Error
    expect(() =>
      sandbox.executeGuarded('timeline:write', () => 'should_fail')
    ).toThrow(/permission denied/i);
  });
});
