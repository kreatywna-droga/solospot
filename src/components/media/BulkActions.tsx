// BulkActions.tsx
// C8.5: Media Manager — bulk actions bar

'use client'

import { Trash2, Move, Tag, Download } from 'lucide-react'

interface BulkActionsProps {
  selectedCount: number
  onDelete: () => void
  onMove: () => void
  onTag: () => void
  onDownload: () => void
}

export function BulkActions({ selectedCount, onDelete, onMove, onTag, onDownload }: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="h-12 border-t border-white/10 flex items-center justify-between px-4 bg-[#08080f]">
      <span className="text-xs text-slate-400">Wybrano {selectedCount} elementów</span>
      <div className="flex items-center gap-2">
        <button
          onClick={onMove}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs transition-colors"
        >
          <Move className="w-3.5 h-3.5" />
          Przenieś
        </button>
        <button
          onClick={onTag}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs transition-colors"
        >
          <Tag className="w-3.5 h-3.5" />
          Tag
        </button>
        <button
          onClick={onDownload}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Pobierz
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Usuń
        </button>
      </div>
    </div>
  )
}
