import { describe, it, expect } from 'vitest';
import { analyzeAssetDependencies } from '../AnimationDependencyGraph';
import { createAssetRegistryState, type AnimationAssetItem } from '../AnimationAssetRegistry';

const mockAssets: ReadonlyArray<AnimationAssetItem> = [
  {
    metadata: {
      assetId: 'asset-parent',
      name: 'Parent Template',
      description: '',
      category: 'template',
      tags: [],
      preview: {},
      version: '1.0.0',
      author: 'Author',
      createdAt: 100,
      updatedAt: 100,
    },
    payloadRef: {},
  },
  {
    metadata: {
      assetId: 'asset-child-preset',
      name: 'Child Preset',
      description: '',
      category: 'preset',
      tags: [],
      preview: {},
      version: '1.0.0',
      author: 'Author',
      createdAt: 100,
      updatedAt: 100,
    },
    payloadRef: {},
  },
  {
    metadata: {
      assetId: 'asset-orphan',
      name: 'Orphan Preset',
      description: '',
      category: 'preset',
      tags: [],
      preview: {},
      version: '1.0.0',
      author: 'Author',
      createdAt: 100,
      updatedAt: 100,
    },
    payloadRef: {},
  },
];

describe('AnimationDependencyGraph (PM42, ETAP 4)', () => {
  it('analyzes asset dependency graph for orphans and reference counts', () => {
    const registryState = createAssetRegistryState(mockAssets);

    const edges = [
      {
        parentAssetId: 'asset-parent',
        childAssetId: 'asset-child-preset',
        relationship: 'uses_preset' as const,
      },
    ];

    const report = analyzeAssetDependencies(registryState, edges);

    expect(report.referenceCounts['asset-child-preset']).toBe(1);
    expect(report.referenceCounts['asset-parent']).toBe(0);

    expect(report.orphanAssetIds).toContain('asset-orphan');
    expect(report.orphanAssetIds).toContain('asset-parent');
    expect(report.orphanAssetIds).not.toContain('asset-child-preset');
  });
});
