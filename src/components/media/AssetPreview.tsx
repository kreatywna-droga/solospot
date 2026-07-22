// AssetPreview.tsx
// C8.5: Media Manager — asset preview modal

'use client'

import { MediaAsset, AssetType } from '../../../packages/asset-manager-core/src/AssetTypes'
import { X, Download, Trash2 } from 'lucide-react'

function assetIcon(type: AssetType) {
  switch (type) {
    case 'image': return <span className="text-6xl">🖼️</span>
    case 'video': return <span className="text-6xl">🎬</span>
    case 'audio': return <span className="text-6xl">🎵</span>
    case 'document': return <span className="text-6xl">📄</span>
    default: return <span className="text-6xl">📎</span>
  }
}

interface AssetPreviewProps {
  asset: MediaAsset
  onClose: () => void
  onDelete?: () => void
  onDownload?: () => void
}

export function AssetPreview({ asset, onClose, onDelete, onDownload }: AssetPreviewProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={e => e.stopPropagation()}>
        <div className="bg-[#0a0a14] rounded-2xl border border-white/10 overflow-hidden">
          <div className="aspect-video bg-white/5 flex items-center justify-center">
            {assetIcon(asset.type)}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-white">{asset.name}</h3>
                <p className="text-sm text-slate-400">{(asset.metadata.fileSize || 0 / 1024).toFixed(1)} KB</p>
                {asset.metadata.mimeType && (
                  <p className="text-xs text-slate-500">{asset.metadata.mimeType}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Pobierz"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
