'use client'

/**
 * BuilderLeftSidebar — C16.2 Left Sidebar
 *
 * Tab switcher: Pages | Layers | Assets | Components
 * Each tab shows its respective panel content.
 */

import { useState } from 'react'
import {
  PanelLeft, Layers, ImageIcon, Plus,
  ChevronRight, GripVertical,
  Globe, Lock, Eye, EyeOff, FileText,
  Search, X, Upload,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import type { StudioTab } from './BuilderTopBar'
import { ComponentPanel } from '../sidebar/ComponentPanel'

// ---------------------------------------------------------------------------
// Left Sidebar Root
// ---------------------------------------------------------------------------

interface BuilderLeftSidebarProps {
  activeTab: StudioTab
  onTabChange: (tab: StudioTab) => void
}

type SidebarTab = 'pages' | 'layers' | 'assets' | 'components'

export function BuilderLeftSidebar({ activeTab, onTabChange }: BuilderLeftSidebarProps) {
  const currentTab: SidebarTab =
    activeTab === 'pages' || activeTab === 'layers' || activeTab === 'assets' || activeTab === 'components'
      ? activeTab
      : 'layers'

  const tabs: { id: SidebarTab; label: string; icon: React.ElementType }[] = [
    { id: 'pages',      label: 'Pages',      icon: PanelLeft },
    { id: 'layers',     label: 'Layers',     icon: Layers },
    { id: 'assets',     label: 'Assets',     icon: ImageIcon },
    { id: 'components', label: 'Komponenty', icon: Plus },
  ]

  return (
    <aside className="w-80 min-w-[320px] max-w-[380px] border-r border-white/10 bg-[#06060c] flex flex-col overflow-hidden flex-shrink-0">
      {/* Tab switcher - 4 equal columns with clean responsive labels */}
      <div className="grid grid-cols-4 border-b border-white/10 bg-[#05050a]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as StudioTab)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-3 px-1 text-[10px] font-bold uppercase tracking-wider transition-all
              ${currentTab === tab.id
                ? 'text-white border-b-2 border-violet-500 bg-violet-500/10'
                : 'text-slate-500 hover:text-white hover:bg-white/5 border-b-2 border-transparent'
              }`}
            title={tab.label}
          >
            <tab.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentTab === 'pages' && <PagesPanel />}
        {currentTab === 'layers' && <LayersPanel />}
        {currentTab === 'assets' && <AssetsPanel />}
        {currentTab === 'components' && <ComponentPanel onClose={() => onTabChange('layers')} />}
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Pages Panel — C16.4
// ---------------------------------------------------------------------------

function PagesPanel() {
  const { document, canvas, dispatch } = useBuilder()

  const selectPage = (pageId: string) => {
    dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: null, pageId } })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Pages</h2>
        <button className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {document.pages.map(page => {
          const isActive = canvas.selectedPageId
            ? page.id === canvas.selectedPageId
            : page.isHome

          return (
            <button
              key={page.id}
              onClick={() => selectPage(page.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all text-left group
                ${isActive
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{page.name}</div>
                <div className="text-[10px] text-slate-600 font-mono truncate">{page.slug}</div>
              </div>
              {page.isHome && (
                <span className="text-[9px] text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded font-bold uppercase">
                  Home
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="p-3 border-t border-white/5">
        <div className="text-[10px] text-slate-600 flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          {document.pages.length} page{document.pages.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Layers Panel — C16.3
// ---------------------------------------------------------------------------

function LayersPanel() {
  const { document, canvas, dispatch } = useBuilder()

  const activePage = document.pages.find(p =>
    canvas.selectedPageId ? p.id === canvas.selectedPageId : p.isHome
  ) ?? document.pages[0]

  const sections = activePage?.sections ?? []

  const selectSection = (sectionId: string) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId, pageId: activePage?.id ?? null },
    })
  }

  const toggleVisibility = (sectionId: string) => {
    if (!activePage) return
    dispatch({ type: 'TOGGLE_VISIBILITY', pageId: activePage.id, sectionId })
  }

  const toggleLock = (sectionId: string) => {
    if (!activePage) return
    dispatch({ type: 'TOGGLE_LOCK', pageId: activePage.id, sectionId })
  }

  const typeColors: Record<string, string> = {
    hero: 'bg-violet-500',
    navbar: 'bg-blue-500',
    footer: 'bg-slate-500',
    'product-grid': 'bg-amber-500',
    gallery: 'bg-emerald-500',
    testimonials: 'bg-yellow-500',
    newsletter: 'bg-pink-500',
    content: 'bg-slate-400',
    container: 'bg-violet-300',
  }

  const typeColor = (type: string) => typeColors[type] || 'bg-slate-600'

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Layers</h2>
        <span className="text-[10px] text-slate-600">{sections.length} items</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 text-xs text-center gap-2">
            <Layers className="w-8 h-8 opacity-30" />
            <span>No layers yet</span>
            <span className="text-[10px]">Add a section from Components</span>
          </div>
        ) : (
          sections.map((node, index) => (
            <div
              key={node.id}
              onClick={() => selectSection(node.id)}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all text-xs select-none
                ${canvas.selectedSectionId === node.id
                  ? 'bg-violet-500/20 border border-violet-500/30 text-white'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }
                ${!node.visible ? 'opacity-40' : ''}
              `}
            >
              {/* Color dot */}
              <span className={`w-2 h-2 rounded-full ${typeColor(node.type)} flex-shrink-0`} />

              {/* Drag handle */}
              <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />

              {/* Label */}
              <span className="flex-1 truncate font-medium">{node.label}</span>

              {/* Type badge */}
              <span className="text-[9px] text-slate-600 font-mono hidden group-hover:block">{node.type}</span>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLock(node.id) }}
                  className={`p-0.5 rounded ${node.locked ? 'text-amber-400' : 'text-slate-600 hover:text-white'} hover:bg-white/10 transition-colors`}
                >
                  <Lock className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(node.id) }}
                  className={`p-0.5 rounded ${!node.visible ? 'text-violet-400' : 'text-slate-600 hover:text-white'} hover:bg-white/10 transition-colors`}
                >
                  {node.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assets Panel — C16.5
// ---------------------------------------------------------------------------

function AssetsPanel() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Assets</h2>
        <button className="p-1 rounded-lg hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 transition-colors">
          <Upload className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white
                       placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
      </div>

      {/* Asset categories */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {[
          { type: 'Images', count: 0, icon: ImageIcon },
          { type: 'SVGs', count: 0, icon: ImageIcon },
          { type: 'Videos', count: 0, icon: ImageIcon },
          { type: 'Fonts', count: 0, icon: FileText },
        ].map(cat => (
          <div
            key={cat.type}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs
                       text-slate-400 cursor-pointer hover:bg-white/10 hover:text-white transition-all"
          >
            <cat.icon className="w-4 h-4 text-slate-500" />
            <span className="flex-1 font-medium">{cat.type}</span>
            <span className="text-[10px] text-slate-600">{cat.count}</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-white/5">
        <div className="text-[10px] text-slate-600 text-center">
          Asset library coming in Sprint 6
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Components Panel — delegates to the existing ComponentPanel
// ---------------------------------------------------------------------------

function ComponentsPanel() {
  return <ComponentPanel onClose={() => {}} />
}

