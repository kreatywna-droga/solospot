// RecentAssets.tsx
// C8.7.5: Asset UX Layer — recently used assets

'use client'

import { MediaAsset } from '../../../packages/asset-manager-core/src/AssetTypes'
import { Clock } from 'lucide-react'

interface RecentAssetsProps {
  assets: MediaAsset[]
  onSelect: (asset: MediaAsset) => void
  maxItems?: number
}

export function RecentAssets({ assets, onSelect, maxItems = 6 }: RecentAssetsProps) {
  if (assets.length === 0) {
    return (
      <div className="text-xs text-slate-600 italic">Brak ostatnio używanych assetów</div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
        <Clock className="w-3 h-3" />
        Ostatnio używane
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
              {new Date(asset.createdAt).toLocaleDateString('pl-PL')}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
