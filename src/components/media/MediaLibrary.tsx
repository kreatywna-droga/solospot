// MediaLibrary.tsx
// C8.5: Media Manager — media library UI

'use client'

import { useState, useCallback, useMemo } from 'react'
import { Upload } from 'lucide-react'
import { MediaDocument, MediaFolder, MediaAsset, AssetType } from '../../../packages/asset-manager-core/src/AssetTypes'
import { FolderTree } from './FolderTree'
import { AssetGrid } from './AssetGrid'
import { AssetList } from './AssetList'
import { AssetPreview } from './AssetPreview'
import { SearchBar } from './SearchBar'
import { FilterPanel } from './FilterPanel'
import { BulkActions } from './BulkActions'

export type ViewMode = 'grid' | 'list'
export type FilterType = 'all' | AssetType
export type SortField = 'name' | 'date' | 'size'
export type SortDirection = 'asc' | 'desc'

interface MediaLibraryProps {
  document: MediaDocument
  onSelect?: (asset: MediaAsset) => void
  onUpload?: (files: File[]) => void
}

export function MediaLibrary({ document, onSelect, onUpload }: MediaLibraryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [showPreview, setShowPreview] = useState<MediaAsset | null>(null)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const folders = useMemo(() => {
    if (selectedFolderId === null) {
      return document.folders.filter((f: MediaFolder) => f.parentId === null)
    }
    return document.folders.filter((f: MediaFolder) => f.parentId === selectedFolderId)
  }, [document.folders, selectedFolderId])

  const assets = useMemo(() => {
    let results: MediaAsset[] = document.assets
    if (selectedFolderId !== null) {
      results = results.filter((a: MediaAsset) => a.metadata.folderId === selectedFolderId)
    }
    if (filterType !== 'all') {
      results = results.filter((a: MediaAsset) => a.type === filterType)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter((a: MediaAsset) => a.name.toLowerCase().includes(q))
    }
    results = [...results].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'date':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'size':
          cmp = (a.metadata.fileSize || 0) - (b.metadata.fileSize || 0)
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return results
  }, [document.assets, selectedFolderId, filterType, searchQuery, sortField, sortDirection])

  const handleSelectAsset = useCallback((asset: MediaAsset) => {
    setSelectedAssets(prev => {
      const next = new Set(prev)
      if (next.has(asset.id)) next.delete(asset.id)
      else next.add(asset.id)
      return next
    })
    onSelect?.(asset)
  }, [onSelect])

  const handleDeleteSelected = useCallback(() => {
    setSelectedAssets(new Set())
  }, [])

  const handleMoveSelected = useCallback(() => {
    setSelectedAssets(new Set())
  }, [])

  const handleTagSelected = useCallback(() => {
    setSelectedAssets(new Set())
  }, [])

  const handleDownloadSelected = useCallback(() => {
    setSelectedAssets(new Set())
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <button
            onClick={() => onUpload?.([])}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-violet-500/20 text-violet-400' : 'text-slate-500 hover:text-white'}`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-violet-500/20 text-violet-400' : 'text-slate-500 hover:text-white'}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>

          <FilterPanel activeFilter={filterType} onFilterChange={setFilterType} />

          <select
            value={sortField}
            onChange={e => setSortField(e.target.value as SortField)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
          >
            <option value="date">Data</option>
            <option value="name">Nazwa</option>
            <option value="size">Rozmiar</option>
          </select>

          <button
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs transition-colors"
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 border-r border-white/10">
          <FolderTree folders={document.folders} selectedId={selectedFolderId} onSelect={setSelectedFolderId} />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 text-sm">
              <Upload className="w-12 h-12 mb-3 opacity-50" />
              <p>Brak mediów</p>
              <p className="text-xs mt-1">Przeciągnij pliki tutaj lub kliknij Upload</p>
            </div>
          ) : viewMode === 'grid' ? (
            <AssetGrid assets={assets} selectedIds={selectedAssets} onSelect={handleSelectAsset} onPreview={setShowPreview} />
          ) : (
            <AssetList assets={assets} selectedIds={selectedAssets} onSelect={handleSelectAsset} onPreview={setShowPreview} />
          )}
        </div>
      </div>

      <BulkActions selectedCount={selectedAssets.size} onDelete={handleDeleteSelected} onMove={handleMoveSelected} onTag={handleTagSelected} onDownload={handleDownloadSelected} />

      {showPreview && <AssetPreview asset={showPreview} onClose={() => setShowPreview(null)} />}
    </div>
  )
}
