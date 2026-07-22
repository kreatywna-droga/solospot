// FolderTree.tsx
// C8.5: Media Manager — folder tree component

'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, FolderOpen } from 'lucide-react'
import { MediaFolder } from '../../../packages/asset-manager-core/src/AssetTypes'

interface FolderTreeProps {
  folders: MediaFolder[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onCreate?: () => void
}

export function FolderTree({ folders, selectedId, onSelect, onCreate }: FolderTreeProps) {
  const rootFolders = folders.filter(f => f.parentId === null)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Foldery</span>
        {onCreate && (
          <button
            onClick={onCreate}
            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
            title="Nowy folder"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all text-left ${
            selectedId === null ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Wszystkie</span>
        </button>
        {rootFolders.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            folders={folders}
            selectedId={selectedId}
            onSelect={onSelect}
            depth={0}
          />
        ))}
      </div>
    </div>
  )
}

function FolderItem({
  folder,
  folders,
  selectedId,
  onSelect,
  depth = 0,
}: {
  folder: MediaFolder
  folders: MediaFolder[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const children = folders.filter(f => f.parentId === folder.id)

  return (
    <div>
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(folder.id) }}
        className={`w-full flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all text-left ${
          selectedId === folder.id ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {children.length > 0 && (
          <span onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}>
            {expanded ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
          </span>
        )}
        <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{folder.name}</span>
      </button>
      {expanded && children.map(child => (
        <FolderItem
          key={child.id}
          folder={child}
          folders={folders}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}
