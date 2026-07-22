'use client'

/**
 * ComponentPanel — C6.2-A (section palette)
 *
 * The component insertion panel — uses ComponentRegistry to list
 * all registered components by category.
 *
 * When user clicks a component:
 *   dispatch(ADD_SECTION) → builder-core → SectionTree → touchDocument
 *   → HistoryStack.push → PreviewChannel.send
 *
 * No hardcoded section list — all driven from registry.
 */

import { useState, useCallback } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import { ComponentDescriptor } from '../../../../packages/builder-core/src/ComponentRegistry'

// ---------------------------------------------------------------------------
// Category tabs
// ---------------------------------------------------------------------------

interface CategoryTabsProps {
  categories: string[]
  active: string
  onChange: (cat: string) => void
}

function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 px-3 pb-3">
      <button
        onClick={() => onChange('all')}
        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all
          ${active === 'all'
            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
            : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 border border-transparent'
          }`}
      >
        Wszystkie
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all
            ${active === cat
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component card
// ---------------------------------------------------------------------------

interface ComponentCardProps {
  descriptor: ComponentDescriptor
  onAdd: (descriptor: ComponentDescriptor) => void
}

function ComponentCard({ descriptor, onAdd }: ComponentCardProps) {
  return (
    <button
      onClick={() => onAdd(descriptor)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5
                 hover:border-violet-500/30 hover:bg-violet-500/5 active:scale-[0.98]
                 transition-all text-left group"
    >
      {/* Icon / thumbnail */}
      <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center
                      text-violet-400 flex-shrink-0 text-lg group-hover:bg-violet-500/25 transition-colors">
        {descriptor.icon.length === 1 || descriptor.icon.startsWith('<')
          ? <span className="text-base">{descriptor.icon}</span>
          : descriptor.icon
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white text-sm truncate">{descriptor.label}</div>
        <div className="text-[11px] text-slate-500 capitalize">{descriptor.category}</div>
      </div>

      {/* Add hint */}
      <Plus className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors flex-shrink-0" />
    </button>
  )
}

// ---------------------------------------------------------------------------
// ComponentPanel root
// ---------------------------------------------------------------------------

interface ComponentPanelProps {
  onClose?: () => void
}

export function ComponentPanel({ onClose }: ComponentPanelProps) {
  const { dispatch, ctx, canvas } = useBuilder()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Get all components from registry
  const allComponents = ctx.registry.getAll()
  const byCategory = ctx.registry.getByCategory()
  const categories = Array.from(byCategory.keys()).sort()

  // Filter
  const filtered = search.trim()
    ? ctx.registry.search(search)
    : activeCategory === 'all'
      ? allComponents
      : (byCategory.get(activeCategory) ?? [])

  const handleAdd = useCallback((descriptor: ComponentDescriptor) => {
    const activePage = canvas.selectedPageId
      ?? document.querySelectorAll('[data-page-id]')[0]?.getAttribute('data-page-id')
      ?? null

    // Fall back to first page if no page selected
    dispatch({
      type: 'ADD_SECTION',
      pageId: activePage ?? '__no_page__',
      sectionType: descriptor.type,
      defaultProps: { ...descriptor.defaultProps },
      label: descriptor.label,
    })

    onClose?.()
  }, [dispatch, canvas.selectedPageId, onClose])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Komponenty</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj sekcji..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white
                       placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <CategoryTabs
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      )}

      {/* Component list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-xs text-slate-600 text-center py-8">
            Brak komponentów
            {search && (
              <> dla zapytania: <span className="text-slate-400">&ldquo;{search}&rdquo;</span></>
            )}
            <br />
            Zarejestruj komponenty w BuilderComponentRegistry.
          </div>
        ) : (
          filtered.map(descriptor => (
            <ComponentCard
              key={descriptor.type}
              descriptor={descriptor}
              onAdd={handleAdd}
            />
          ))
        )}
      </div>
    </div>
  )
}
