// FilterPanel.tsx
// C8.5: Media Manager — filter panel

'use client'

import { AssetType } from '../../../packages/asset-manager-core/src/AssetTypes'

type FilterType = 'all' | AssetType

interface FilterPanelProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function FilterPanel({ activeFilter, onFilterChange }: FilterPanelProps) {
  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'image', label: 'Obrazy' },
    { value: 'video', label: 'Wideo' },
    { value: 'audio', label: 'Audio' },
    { value: 'document', label: 'Dokumenty' },
  ]

  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
      {filters.map(filter => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-2.5 py-1 rounded text-xs transition-all ${
            activeFilter === filter.value ? 'bg-violet-500/20 text-violet-400' : 'text-slate-500 hover:text-white'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
