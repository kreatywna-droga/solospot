import { describe, it, expect } from 'vitest';
import {
  createPluginRegistryState,
  registerPlugin,
  setPluginStatus,
  getPluginById,
} from '../PluginRegistry';
import { resolvePluginConflicts } from '../PluginResolver';
import type { PluginManifest } from '../PluginManifest';

const mockManifest: PluginManifest = {
  metadata: {
    pluginId: 'plugin-test-1',
    name: 'Test Plugin 1',
    version: '1.0.0',
    apiVersion: '1.0.0',
    author: 'Author',
    description: 'Desc',
  },
  capabilities: ['timeline:read'],
  permissions: { declaredCapabilities: ['timeline:read'], grantedCapabilities: ['timeline:read'] },
  compatibility: { minStudioVersion: '1.0.0' },
  entryPoint: 'main.js',
};

describe('PluginRegistry (PM43, ETAP 2)', () => {
  it('registers and manages plugin statuses immutably', () => {
    let state = createPluginRegistryState();
    state = registerPlugin(state, mockManifest);

    expect(state.plugins).toHaveLength(1);
    expect(state.plugins[0].status).toBe('installed');

    state = setPluginStatus(state, 'plugin-test-1', 'active');
    const record = getPluginById(state, 'plugin-test-1');

    expect(record).not.toBeNull();
    expect(record?.status).toBe('active');
  });

  it('detects duplicate plugin ID conflicts', () => {
    const registryState = {
      plugins: [
        { manifest: mockManifest, status: 'installed' as const, installedAt: 100 },
        { manifest: mockManifest, status: 'installed' as const, installedAt: 200 },
      ],
    };

    const conflictRes = resolvePluginConflicts(registryState);
    expect(conflictRes.hasConflicts).toBe(true);
  });
});
