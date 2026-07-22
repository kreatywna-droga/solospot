// Favorites.tsx
// C8.7.5: Asset UX Layer — favorite assets

'use client'

import { MediaAsset } from '../../../packages/asset-manager-core/src/AssetTypes'
import { Star } from 'lucide-react'

interface FavoritesProps {
  assets: MediaAsset[]
  onSelect: (asset: MediaAsset) => void
  onToggleFavorite?: (assetId: string) => void
  maxItems?: number
}

export function Favorites({ assets, onSelect, onToggleFavorite, maxItems = 6 }: FavoritesProps) {
  if (assets.length === 0) {
    return (
      <div className="text-xs text-slate-600 italic">Brak ulubionych assetów</div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
        <Star className="w-3 h-3 text-amber-400" />
        Ulubione
      </div>
      {assets.slice(0, maxItems).map(asset => (
        <button
          key={asset.id}
          onClick={() => onSelect(asset)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">🖼️</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{asset.name}</p>
            <p className="text-[10px] text-slate-500">
              {(asset.metadata.fileSize || 0 / 1024).toFixed(1)} KB
            </p>
          </div>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(asset.id) }}
              className="p-1 rounded hover:bg-white/10 text-amber-400"
            >
              <Star className="w-3 h-3 fill-current" />
            </button>
          )}
        </button>
      ))}
    </div>
  )
}
