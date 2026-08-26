'use client';

import * as React from 'react';
import type { AnimationAssetItem, AssetRegistryState } from '../../../assets/AnimationAssetRegistry';
import {
  AssetBrowserState,
  INITIAL_ASSET_BROWSER_STATE,
  toggleFavoriteAsset,
  touchRecentAsset,
} from '../../../assets/AnimationAssetBrowser';

export interface AssetBrowserPanelProps {
  /** Current asset registry state containing metadata. */
  readonly registryState: AssetRegistryState;
  /** Callback fired when user selects an asset or drags an asset to Canvas. */
  readonly onSelectAsset?: (assetItem: AnimationAssetItem) => void;
  readonly onPlaceAsset?: (assetItem: AnimationAssetItem) => void;
}

export const AssetBrowserPanel: React.FC<AssetBrowserPanelProps> = ({
  registryState,
  onSelectAsset,
  onPlaceAsset,
}) => {
  const [browserState, setBrowserState] = React.useState<AssetBrowserState>(INITIAL_ASSET_BROWSER_STATE);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [activeCategory, setActiveCategory] = React.useState<string>('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  // Filtered Assets Computation
  const filteredAssets = React.useMemo(() => {
    return registryState.assets.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.metadata.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        activeCategory === 'all' ||
        (activeCategory === 'favorites' && browserState.favoriteAssetIds.includes(item.metadata.assetId)) ||
        (activeCategory === 'recent' && browserState.recentAssetIds.includes(item.metadata.assetId)) ||
        item.metadata.category === activeCategory ||
        item.metadata.tags.includes(activeCategory);

      return matchesSearch && matchesCategory;
    });
  }, [registryState.assets, searchQuery, activeCategory, browserState]);

  const handleAssetClick = (item: AnimationAssetItem) => {
    setBrowserState((prev) => touchRecentAsset(prev, item.metadata.assetId));
    if (onSelectAsset) onSelectAsset(item);
  };

  const handleFavoriteClick = (e: React.MouseEvent, assetId: string) => {
    e.stopPropagation();
    setBrowserState((prev) => toggleFavoriteAsset(prev, assetId));
  };

  return (
    <div className="asset-browser-panel flex flex-col h-full bg-slate-950 text-slate-100 border-r border-slate-800 p-3 select-none" data-testid="asset-browser-panel">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <span className="text-sm font-bold text-slate-200">Asset Library</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`text-xs px-2 py-1 rounded ${viewMode === 'grid' ? 'bg-indigo-600 font-medium' : 'bg-slate-800'}`}
            data-testid="view-mode-grid"
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`text-xs px-2 py-1 rounded ${viewMode === 'list' ? 'bg-indigo-600 font-medium' : 'bg-slate-800'}`}
            data-testid="view-mode-list"
          >
            List
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mt-3">
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
          data-testid="asset-search-input"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs">
        {(['all', 'favorites', 'recent', 'vector_graphics', 'sound_effect', 'custom'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded capitalize whitespace-nowrap ${
              activeCategory === cat ? 'bg-indigo-600 font-medium' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
            data-testid={`cat-tab-${cat}`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Asset Items Container */}
      <div className="flex-1 overflow-y-auto mt-3">
        {filteredAssets.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-8">No assets found</div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-1.5'}>
            {filteredAssets.map((item) => {
              const isFav = browserState.favoriteAssetIds.includes(item.metadata.assetId);

              return (
                <div
                  key={item.metadata.assetId}
                  onClick={() => handleAssetClick(item)}
                  onDoubleClick={() => onPlaceAsset && onPlaceAsset(item)}
                  className="asset-item-card relative group p-2 rounded border border-slate-800 bg-slate-900 hover:border-indigo-500 cursor-pointer transition-colors"
                  data-testid={`asset-card-${item.metadata.assetId}`}
                >
                  {/* Thumbnail / Icon */}
                  <div className="w-full h-20 rounded bg-slate-950 flex items-center justify-center overflow-hidden mb-1.5 border border-slate-850">
                    {item.metadata.preview.thumbnailUri ? (
                      <img src={item.metadata.preview.thumbnailUri} alt={item.metadata.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg text-indigo-400 font-bold uppercase">{item.metadata.category.substring(0, 2)}</span>
                    )}
                  </div>

                  {/* Asset Name & Meta */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 truncate" title={item.metadata.name}>
                      {item.metadata.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleFavoriteClick(e, item.metadata.assetId)}
                      className={`text-xs ${isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
                      data-testid={`fav-btn-${item.metadata.assetId}`}
                    >
                      ★
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetBrowserPanel;
