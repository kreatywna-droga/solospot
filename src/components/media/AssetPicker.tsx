// AssetPicker.tsx
// C8.7: Media Manager — builder integration

'use client'

import { useState, useCallback } from 'react'
import { X, Search, Image as ImageIcon, Upload } from 'lucide-react'
import { MediaLibrary } from '../media/MediaLibrary'
import { MediaAsset, MediaDocument } from '../../../packages/asset-manager-core/src/AssetTypes'

interface AssetPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (asset: MediaAsset) => void
  document: MediaDocument
  accept?: string[]
}

export function AssetPicker({ isOpen, onClose, onSelect, document, accept }: AssetPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[80vh] bg-[#0a0a14] rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-bold text-white">Wybierz obraz</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Szukaj obrazów..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>
        </div>

        {/* Media Library */}
        <div className="flex-1 overflow-hidden">
          <MediaLibrary
            document={document}
            onSelect={onSelect}
          />
        </div>
      </div>
    </div>
  )
}
