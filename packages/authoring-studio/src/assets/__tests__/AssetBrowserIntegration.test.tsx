import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetBrowserPanel } from '../../ui/components/assets/AssetBrowserPanel';
import { createAssetRegistryState, AnimationAssetItem } from '../AnimationAssetRegistry';

describe('AssetBrowserPanel (S15 ETAP 4)', () => {
  const mockAsset: AnimationAssetItem = {
    metadata: {
      assetId: 'asset_1',
      name: 'Background.png',
      description: 'Image',
      category: 'vector_graphics',
      tags: ['png', 'background'],
      preview: { thumbnailUri: 'bg.png' },
      version: '1.0.0',
      author: 'user',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    payloadRef: {},
  };

  it('renders asset browser with search and view toggles', () => {
    const regState = createAssetRegistryState([mockAsset]);
    render(<AssetBrowserPanel registryState={regState} />);

    expect(screen.getByTestId('asset-browser-panel')).toBeDefined();
    expect(screen.getByTestId('asset-search-input')).toBeDefined();
    expect(screen.getByTestId('asset-card-asset_1')).toBeDefined();

    // Toggle view mode to list
    const listBtn = screen.getByTestId('view-mode-list');
    fireEvent.click(listBtn);
    expect(listBtn.className).toContain('bg-indigo-600');
  });

  it('filters assets by search query', () => {
    const regState = createAssetRegistryState([mockAsset]);
    render(<AssetBrowserPanel registryState={regState} />);

    const searchInput = screen.getByTestId('asset-search-input');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.queryByTestId('asset-card-asset_1')).toBeNull();
  });
});
