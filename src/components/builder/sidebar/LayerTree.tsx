'use client'

/**
 * LayerTree — C6.2-D
 *
 * Left-panel section hierarchy viewer.
 * Renders the recursive SectionNode tree for the active page.
 *
 * Operations:
 *   - click to select
 *   - rename (double-click label)
 *   - toggle visibility
 *   - delete
 *   - move up/down (buttons)
 *   - duplicate
 *   - expand/collapse containers
 */

import { useState, useCallback } from 'react'
import {
  Eye, EyeOff, Trash2, Copy, ChevronRight, ChevronDown,
  GripVertical, Lock, Unlock, Filter,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import { SectionNode } from '../../../../packages/builder-core/src/BuilderDocument'

// ---------------------------------------------------------------------------
// Layer row
// ---------------------------------------------------------------------------

interface LayerRowProps {
  node: SectionNode
  depth: number
  pageId: string
  isSelected: boolean
  onSelect: (id: string) => void
}

function LayerRow({ node, depth, pageId, isSelected, onSelect }: LayerRowProps) {
  const { dispatch } = useBuilder()
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0

  const handleToggleVisibility = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'TOGGLE_VISIBILITY', pageId, sectionId: node.id })
  }, [dispatch, pageId, node.id])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'REMOVE_SECTION', pageId, sectionId: node.id })
  }, [dispatch, pageId, node.id])

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'DUPLICATE_SECTION', pageId, sectionId: node.id })
  }, [dispatch, pageId, node.id])

  const handleToggleLock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'TOGGLE_LOCK', pageId, sectionId: node.id })
  }, [dispatch, pageId, node.id])

  const typeIcon = hasChildren ? '⬡' : '▣'

  return (
    <div>
      <div
        onClick={() => onSelect(node.id)}
        className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-sm select-none
          ${isSelected
            ? 'bg-violet-500/20 border border-violet-500/30 text-white'
            : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
          }
          ${!node.visible ? 'opacity-40' : ''}
        `}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {/* Expand/collapse for containers */}
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
            className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
          >
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />
            }
          </button>
        ) : (
          <span className="w-3.5 h-3.5 flex-shrink-0 text-slate-600 text-xs flex items-center justify-center">
            {typeIcon}
          </span>
        )}

        {/* Drag handle */}
        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />

        {/* Label */}
        <span className={`flex-1 text-xs font-medium truncate ${node.locked ? 'text-amber-400/70' : ''}`}>
          {node.label}
        </span>

        {/* Type badge */}
        <span className="text-[10px] text-slate-600 font-mono hidden group-hover:block flex-shrink-0">
          {node.type}
        </span>

        {/* Action buttons — show on hover or selection */}
        <div className={`flex items-center gap-0.5 flex-shrink-0 ${isSelected ? 'flex' : 'hidden group-hover:flex'}`}>
          <button
            onClick={handleToggleLock}
            className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-amber-400 transition-colors"
            title={node.locked ? 'Odblokuj' : 'Zablokuj'}
          >
            {node.locked
              ? <Lock className="w-3 h-3" />
              : <Unlock className="w-3 h-3" />
            }
          </button>
          <button
            onClick={handleToggleVisibility}
            className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
            title={node.visible ? 'Ukryj' : 'Pokaż'}
          >
            {node.visible
              ? <Eye className="w-3 h-3" />
              : <EyeOff className="w-3 h-3" />
            }
          </button>
          <button
            onClick={handleDuplicate}
            className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-violet-400 transition-colors"
            title="Duplikuj"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            className="p-0.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
            title="Usuń"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <LayerRow
              key={child.id}
              node={child}
              depth={depth + 1}
              pageId={pageId}
              isSelected={isSelected && false /* children have own selection */}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LayerTree root
// ---------------------------------------------------------------------------

export function LayerTree() {
  const { document, canvas, dispatch } = useBuilder()
  const [showVisibleOnly, setShowVisibleOnly] = useState(false)
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)

  const activePage = document.pages.find(p =>
    canvas.selectedPageId ? p.id === canvas.selectedPageId : p.isHome
  ) ?? document.pages[0]

  const handleSelect = useCallback((sectionId: string) => {
    const parentId = findParent(activePage.sections, sectionId)
    const targetId = parentId || sectionId
    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: targetId, pageId: activePage?.id ?? null },
    })
  }, [dispatch, activePage])

  function findParent(sections: SectionNode[], childId: string): string | null {
    for (const section of sections) {
      if (section.children.some(child => child.id === childId)) {
        return section.id
      }
      const found = findParent(section.children, childId)
      if (found) return found
    }
    return null
  }

  if (!activePage) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
        Brak stron
      </div>
    )
  }

  const sections = activePage.sections.filter(node => {
    if (showVisibleOnly && !node.visible) return false
    if (showUnlockedOnly && node.locked) return false
    return true
  })

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {/* Filters */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        <button
          onClick={() => setShowVisibleOnly(v => !v)}
          className={`text-[11px] px-2 py-1 rounded transition-all ${
            showVisibleOnly ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-white'
          }`}
        >
          Widoczne
        </button>
        <button
          onClick={() => setShowUnlockedOnly(v => !v)}
          className={`text-[11px] px-2 py-1 rounded transition-all ${
            showUnlockedOnly ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-white'
          }`}
        >
          Odblokowane
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-600 text-xs text-center">
          <span className="text-2xl mb-2">⬡</span>
          Brak sekcji na tej stronie.
          <br />
          Dodaj pierwszą sekcję z palety.
        </div>
      ) : (
        sections.map(node => (
          <LayerRow
            key={node.id}
            node={node}
            depth={0}
            pageId={activePage.id}
            isSelected={canvas.selectedSectionId === node.id}
            onSelect={handleSelect}
          />
        ))
      )}
    </div>
  )
}
