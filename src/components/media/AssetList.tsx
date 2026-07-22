// AssetList.tsx
// C8.5: Media Manager — asset list view

'use client'

import { MediaAsset, AssetType } from '../../../packages/asset-manager-core/src/AssetTypes'
import { Eye } from 'lucide-react'

function assetIcon(type: AssetType) {
  switch (type) {
    case 'image': return <span className="text-lg">🖼️</span>
    case 'video': return <span className="text-lg">🎬</span>
    case 'audio': return <span className="text-lg">🎵</span>
    case 'document': return <span className="text-lg">📄</span>
    default: return <span className="text-lg">📎</span>
  }
}

interface AssetListProps {
  assets: MediaAsset[]
  selectedIds: Set<string>
  onSelect: (asset: MediaAsset) => void
  onPreview: (asset: MediaAsset) => void
}

export function AssetList({ assets, selectedIds, onSelect, onPreview }: AssetListProps) {
  return (
    <div className="space-y-1">
      {assets.map(asset => (
        <div
          key={asset.id}
          onClick={() => onSelect(asset)}
          className={`group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
            selectedIds.has(asset.id) ? 'bg-violet-500/20 border border-violet-500/30' : 'hover:bg-white/5 border border-transparent'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            {assetIcon(asset.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{asset.name}</p>
            <p className="text-[11px] text-slate-500">{(asset.metadata.fileSize || 0 / 1024).toFixed(1)} KB</p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(asset) }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
