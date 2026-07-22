// AssetGrid.tsx
// C8.5: Media Manager — asset grid view

'use client'

import { MediaAsset, AssetType } from '../../../packages/asset-manager-core/src/AssetTypes'
import { Eye } from 'lucide-react'

function assetIcon(type: AssetType) {
  switch (type) {
    case 'image': return <span className="text-2xl">🖼️</span>
    case 'video': return <span className="text-2xl">🎬</span>
    case 'audio': return <span className="text-2xl">🎵</span>
    case 'document': return <span className="text-2xl">📄</span>
    default: return <span className="text-2xl">📎</span>
  }
}

interface AssetGridProps {
  assets: MediaAsset[]
  selectedIds: Set<string>
  onSelect: (asset: MediaAsset) => void
  onPreview: (asset: MediaAsset) => void
}

export function AssetGrid({ assets, selectedIds, onSelect, onPreview }: AssetGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {assets.map(asset => (
        <div
          key={asset.id}
          onClick={() => onSelect(asset)}
          className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
            selectedIds.has(asset.id) ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-transparent hover:border-white/20'
          }`}
        >
          <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
            {assetIcon(asset.type)}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-xs text-white truncate">{asset.name}</p>
            <p className="text-[10px] text-slate-400">{(asset.metadata.fileSize || 0 / 1024).toFixed(1)} KB</p>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(asset) }}
              className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
