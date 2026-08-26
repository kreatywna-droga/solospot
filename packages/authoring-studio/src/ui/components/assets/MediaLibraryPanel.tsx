'use client';

/**
 * MediaLibraryPanel.tsx — Sprint S25 Professional Media Library UX Panel
 *
 * Professional React surface: grid/list view, text search, deterministic
 * sorting, multi-selection, and asset operations (rename/duplicate/delete).
 * View-state math is headless in `MediaLibraryBrowser`; binary payload never
 * reaches BuilderDocument — only assetId references emit. Editor surface only.
 */

import * as React from 'react';
import type { AnimationAssetItem, AssetRegistryState } from '../../../assets/AnimationAssetRegistry';
import type { AssetBrowserState } from '../../../assets/AnimationAssetBrowser';
import type { MediaLibraryCollectionsState } from '../../../assets/MediaLibraryCollections';
import {
  type MediaLibraryViewState,
  createMediaLibraryViewState,
  resolveViewItems,
  selectAsset,
  selectRange,
  clearSelection,
  type MediaLibrarySortKey,
} from '../../../assets/MediaLibraryBrowser';
import {
  composePreviewBundle,
  formatAssetFileSize,
  formatAssetDuration,
} from '../../../assets/AssetPreviewDescriptors';
import { detectAssetMediaType, assetMediaTypeLabel } from '../../../assets/assetPayload';

export interface MediaLibraryPanelProps {
  readonly registryState: AssetRegistryState;
  readonly browserState?: AssetBrowserState;
  readonly collectionsState?: MediaLibraryCollectionsState;
  readonly initialView?: Partial<MediaLibraryViewState>;
  readonly onSelectAsset?: (item: AnimationAssetItem) => void;
  readonly onPlaceAsset?: (item: AnimationAssetItem) => void;
  readonly onRenameAsset?: (assetId: string, newName: string) => void;
  readonly onDuplicateAsset?: (assetId: string) => void;
  readonly onDeleteAsset?: (assetId: string) => void;
  readonly onToggleFavorite?: (assetId: string) => void;
  readonly onImportFiles?: (files: FileList | File[]) => void;
}

export const MediaLibraryPanel: React.FC<MediaLibraryPanelProps> = ({
  registryState,
  browserState: browserStateProp,
  collectionsState,
  initialView,
  onSelectAsset,
  onPlaceAsset,
  onRenameAsset,
  onDuplicateAsset,
  onDeleteAsset,
  onToggleFavorite,
  onImportFiles,
}) => {
  const [view, setView] = React.useState<MediaLibraryViewState>(
    createMediaLibraryViewState({
      ...initialView,
      sort: initialView?.sort ?? { key: 'updatedAt', order: 'desc' },
    })
  );
  const favorites = browserStateProp ?? {
    activeFolderId: null,
    folders: [],
    favoriteAssetIds: [],
    recentAssetIds: [],
    activeCategoryFilter: null,
  };
  const collectionsSlice = collectionsState ? { collections: collectionsState.collections } : undefined;
  const items = resolveViewItems(registryState, view, favorites, collectionsSlice);

  const handleSort = (key: MediaLibrarySortKey) => {
    setView((prev) => ({
      ...prev,
      sort: { key, order: prev.sort.key === key && prev.sort.order === 'asc' ? 'desc' : 'asc' },
    }));
  };
  const handleSelect = (item: AnimationAssetItem, multi: boolean) => {
    const ordered = items.map((i) => i.metadata.assetId);
    setView((prev) => ({
      ...prev,
      selection: multi
        ? selectRange(prev.selection, item.metadata.assetId, ordered)
        : selectAsset(prev.selection, item.metadata.assetId, false),
    }));
    if (onSelectAsset) onSelectAsset(item);
  };
  const handleToggleFavorite = (e: React.MouseEvent, assetId: string) => {
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(assetId);
  };
  const handlePlace = (item: AnimationAssetItem) => {
    if (onPlaceAsset) onPlaceAsset(item);
  };
  const handleRename = (assetId: string, currentName: string) => {
    const nextName = window.prompt('Rename asset', currentName);
    if (nextName && nextName.trim().length > 0 && onRenameAsset) {
      onRenameAsset(assetId, nextName.trim());
    }
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onImportFiles) onImportFiles(e.target.files);
  };
  const clearAllSelection = () => {
    setView((prev) => ({ ...prev, selection: clearSelection() }));
  };
  const selectedCount = view.selection.selectedAssetIds.length;
  const selectedSet = new Set(view.selection.selectedAssetIds);

  return (
    <div className="media-library-panel" data-testid="media-library-panel">
      <div className="toolbar">
        <input type="text" placeholder="Search assets..." value={view.filter.query ?? ''}
          onChange={(e) => setView((p) => ({ ...p, filter: { ...p.filter, query: e.target.value } }))}
          data-testid="media-library-search" />
        <label data-testid="media-library-import">Import<input type="file" multiple hidden onChange={handleImport} /></label>
        <div className="view-toggle">
          <button type="button" onClick={() => setView((p) => ({ ...p, viewMode: 'grid' }))} data-testid="media-view-grid">Grid</button>
          <button type="button" onClick={() => setView((p) => ({ ...p, viewMode: 'list' }))} data-testid="media-view-list">List</button>
        </div>
      </div>
      <div className="sort-bar">
        {([['name', 'Name'], ['createdAt', 'Created'], ['fileSize', 'Size'], ['duration', 'Duration'], ['type', 'Type']] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => handleSort(key)} data-testid={`media-sort-${key}`}>
            {label} {view.sort.key === key ? (view.sort.order === 'asc' ? '▲' : '▼') : ''}
          </button>
        ))}
        {selectedCount > 0 && (
          <button type="button" onClick={clearAllSelection} data-testid="media-clear-selection">Clear ({selectedCount})</button>
        )}
      </div>
            <div className="items" data-testid="media-library-list">
        {items.length === 0 ? (
          <div data-testid="media-library-empty">No assets match your filters</div>
        ) : view.viewMode === 'grid' ? (
          <div className="grid">
            {items.map((item) => (
              <MediaLibraryGridCard
                key={item.metadata.assetId}
                item={item}
                isSelected={selectedSet.has(item.metadata.assetId)}
                handleSelect={handleSelect}
                handlePlace={handlePlace}
                handleToggleFavorite={handleToggleFavorite}
                onRename={handleRename}
                onDuplicate={onDuplicateAsset}
                onDelete={onDeleteAsset}
              />
            ))}
          </div>
        ) : (
          <div className="list">
            {items.map((item) => (
              <MediaLibraryListRow
                key={item.metadata.assetId}
                item={item}
                handleSelect={handleSelect}
                handlePlace={handlePlace}
                handleToggleFavorite={handleToggleFavorite}
                onRename={handleRename}
                onDuplicate={onDuplicateAsset}
                onDelete={onDeleteAsset}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface MediaCardProps {
  readonly item: AnimationAssetItem;
  readonly isSelected?: boolean;
  readonly handleSelect: (item: AnimationAssetItem, multi: boolean) => void;
  readonly handlePlace: (item: AnimationAssetItem) => void;
  readonly handleToggleFavorite: (e: React.MouseEvent, assetId: string) => void;
  readonly onRename?: (assetId: string, name: string) => void;
  readonly onDuplicate?: (assetId: string) => void;
  readonly onDelete?: (assetId: string) => void;
}

export const MediaLibraryGridCard: React.FC<MediaCardProps> = ({
  item,
  isSelected,
  handleSelect,
  handlePlace,
  handleToggleFavorite,
  onRename,
  onDuplicate,
  onDelete,
}) => {
  const { preview } = composePreviewBundle(item);
  const meta = item.metadata;
  return (
    <div
      className={`card ${isSelected ? 'selected' : ''}`}
      data-testid={`media-grid-card-${meta.assetId}`}
      onClick={(e) => handleSelect(item, e.ctrlKey || e.metaKey)}
      onDoubleClick={() => handlePlace(item)}
    >
      <div className="thumb">
        {preview.thumbnailUri ? (
          <img src={preview.thumbnailUri} alt={meta.name} />
        ) : (
          <span className="fallback">{String(meta.category).substring(0, 2)}</span>
        )}
      </div>
      <div className="label">
        <span className="name" title={meta.name}>{meta.name}</span>
        <span className="meta">{assetMediaTypeLabel(detectAssetMediaType(item))}</span>
      </div>
      <div className="actions">
        <button type="button" onClick={(e) => handleToggleFavorite(e, meta.assetId)} data-testid={`media-fav-${meta.assetId}`}>★</button>
        {onDelete && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(meta.assetId); }} data-testid={`media-delete-${meta.assetId}`}>✕</button>
        )}
        {onRename && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onRename(meta.assetId, meta.name); }} data-testid={`media-rename-${meta.assetId}`}>Rename</button>
        )}
        {onDuplicate && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(meta.assetId); }} data-testid={`media-dup-${meta.assetId}`}>Dup</button>
        )}
      </div>
    </div>
  );
};

export const MediaLibraryListRow: React.FC<Omit<MediaCardProps, 'isSelected'>> = ({
  item,
  handleSelect,
  handlePlace,
  handleToggleFavorite,
  onRename,
  onDuplicate,
  onDelete,
}) => {
  const { preview } = composePreviewBundle(item);
  const { fileInfo, metrics } = preview;
  const meta = item.metadata;
  return (
    <div
      className="row"
      data-testid={`media-list-row-${meta.assetId}`}
      onClick={(e) => handleSelect(item, e.ctrlKey || e.metaKey)}
      onDoubleClick={() => handlePlace(item)}
    >
      <div className="thumb">
        {preview.thumbnailUri ? (
          <img src={preview.thumbnailUri} alt={meta.name} />
        ) : (
          <span className="fallback">{String(meta.category).substring(0, 2)}</span>
        )}
      </div>
      <div className="row-body">
        <span className="name" title={meta.name}>{meta.name}</span>
        <span className="meta">
          {assetMediaTypeLabel(detectAssetMediaType(item))} · {formatAssetFileSize(fileInfo.fileSizeBytes)}
          {metrics.widthPx && metrics.heightPx ? ` · ${metrics.widthPx}×${metrics.heightPx}` : ''}
          {metrics.durationMs ? ` · ${formatAssetDuration(metrics.durationMs)}` : ''}
        </span>
      </div>
      <div className="actions">
        <button type="button" onClick={(e) => handleToggleFavorite(e, meta.assetId)} data-testid={`media-fav-${meta.assetId}`}>★</button>
        {onDelete && <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(meta.assetId); }} data-testid={`media-delete-${meta.assetId}`}>✕</button>}
      </div>
    </div>
  );
}
export default MediaLibraryPanel;
