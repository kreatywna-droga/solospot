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
import {
  Search, Plus, X,
  Compass, Sparkles, Grid, ShoppingBag, Image as ImageIcon,
  Star, Mail, Layout, Phone, FileText, Shield,
  TrendingUp, Box, Layers, Package, Store, LayoutGrid, Globe, Palette,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import { ComponentDescriptor } from '../../../../packages/builder-core/src/ComponentRegistry'
import { BuilderNode, createBuilderNode, generateNodeId, findNode } from '../../../../packages/builder-core/src'

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
// Component icon resolver
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ElementType> = {
  Compass,
  Sparkles,
  Grid,
  ShoppingBag,
  Image: ImageIcon,
  ImageIcon,
  Star,
  Mail,
  Layout,
  Phone,
  FileText,
  Shield,
  TrendingUp,
  Box,
  Layers,
  Package,
  Store,
  LayoutGrid,
  Globe,
  Palette,
}

function renderComponentIcon(iconName: string): React.ReactNode {
  const IconComponent = ICON_MAP[iconName]
  if (IconComponent) {
    return <IconComponent className="w-4 h-4 shrink-0" />
  }

  if (iconName && iconName.length <= 2) {
    return <span className="text-sm leading-none select-none shrink-0">{iconName}</span>
  }

  return <Box className="w-4 h-4 shrink-0" />
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
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/solospot-component-type', descriptor.type)
        e.dataTransfer.setData('text/plain', descriptor.type)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={() => onAdd(descriptor)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onAdd(descriptor)
        }
      }}
      className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5
                 hover:border-violet-500/30 hover:bg-violet-500/10 active:scale-[0.98]
                 transition-all text-left group overflow-hidden cursor-grab active:cursor-grabbing select-none focus:outline-none focus:border-violet-500/50"
    >
      {/* Icon / thumbnail */}
      <div className="w-9 h-9 min-w-[36px] max-w-[36px] min-h-[36px] max-h-[36px] rounded-lg bg-violet-500/15 flex items-center justify-center
                      text-violet-400 flex-shrink-0 group-hover:bg-violet-500/25 group-hover:text-violet-300 transition-colors overflow-hidden">
        {renderComponentIcon(descriptor.icon)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
        <div className="font-semibold text-white text-xs sm:text-sm truncate leading-snug">{descriptor.label}</div>
        <div className="text-[10px] sm:text-[11px] text-slate-400 truncate leading-snug">{descriptor.category}</div>
      </div>

      {/* Add hint */}
      <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-white/0 group-hover:bg-violet-500/20 transition-colors">
        <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-300 transition-colors shrink-0" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ComponentPanel root
// ---------------------------------------------------------------------------

interface ComponentPanelProps {
  onClose?: () => void
}

export function ComponentPanel({ onClose }: ComponentPanelProps) {
  const { dispatch, ctx, canvas, document: builderDoc } = useBuilder()
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
    const targetPageId = canvas.selectedPageId || builderDoc.pages[0]?.id
    if (!targetPageId) return

    const newNodeId = generateNodeId(descriptor.type)
    const newNode: BuilderNode = createBuilderNode({
      id: newNodeId,
      type: descriptor.type,
      label: descriptor.label,
      props: { ...descriptor.defaultProps },
      styles: descriptor.type === 'container' ? { display: 'flex-col', padding: '16px', gap: '16px' } : undefined,
      children: [],
    })

    const selectedId = canvas.selectedSectionId
    const found = selectedId ? findNode(builderDoc, selectedId) : null

    if (found) {
      if (found.node.type === 'container' || found.node.type === 'section') {
        // Insert inside the container / section
        dispatch({
          type: 'INSERT_NODE',
          parentId: found.node.id,
          node: { ...newNode, parentId: found.node.id },
          index: found.node.children.length,
          pageId: targetPageId,
        })
      } else {
        // Insert as sibling after the selected node
        const siblings = found.parent ? found.parent.children : found.page.sections
        const siblingIdx = siblings.findIndex(s => s.id === found.node.id)
        const parentId = found.parent ? found.parent.id : null
        dispatch({
          type: 'INSERT_NODE',
          parentId,
          node: { ...newNode, parentId },
          index: siblingIdx >= 0 ? siblingIdx + 1 : undefined,
          pageId: targetPageId,
        })
      }
    } else {
      // Nothing selected
      if (descriptor.type === 'section') {
        dispatch({
          type: 'INSERT_NODE',
          parentId: null,
          node: newNode,
          pageId: targetPageId,
        })
      } else {
        // Atomic element or container without selection:
        // Append to last section's children or create a default section wrapper
        const activePage = builderDoc.pages.find(p => p.id === targetPageId)
        if (activePage && activePage.sections.length > 0) {
          const lastSection = activePage.sections[activePage.sections.length - 1]
          dispatch({
            type: 'INSERT_NODE',
            parentId: lastSection.id,
            node: { ...newNode, parentId: lastSection.id },
            index: lastSection.children.length,
            pageId: targetPageId,
          })
        } else {
          const wrapperSection = createBuilderNode({
            id: generateNodeId('section'),
            type: 'section',
            label: 'Sekcja',
            props: { padding: 'md', background: '#0a0a14' },
            children: [],
          })
          newNode.parentId = wrapperSection.id
          wrapperSection.children = [newNode]
          dispatch({
            type: 'INSERT_NODE',
            parentId: null,
            node: wrapperSection,
            pageId: targetPageId,
          })
        }
      }
    }

    // Immediately select the newly created node
    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId: targetPageId },
    })

    onClose?.()
  }, [dispatch, canvas.selectedSectionId, canvas.selectedPageId, builderDoc, onClose])

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
