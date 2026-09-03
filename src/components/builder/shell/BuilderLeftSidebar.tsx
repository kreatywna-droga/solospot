'use client'

/**
 * BuilderLeftSidebar — C16.2 Left Sidebar
 *
 * Tab switcher: Pages | Layers | Assets | Components | History | AI
 * Each tab shows its respective panel content.
 */

import { useState } from 'react'
import {
  PanelLeft, Layers, ImageIcon, Plus,
  ChevronRight, GripVertical,
  Globe, Lock, Eye, EyeOff, FileText,
  Search, X, Upload, History, Bot,
} from 'lucide-react'
import { useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import type { StudioTab } from './BuilderTopBar'
import { ComponentPanel } from '../sidebar/ComponentPanel'

// ---------------------------------------------------------------------------
// Left Sidebar Root
// ---------------------------------------------------------------------------

interface BuilderLeftSidebarProps {
  activeTab: StudioTab
  onTabChange: (tab: StudioTab) => void
}

export function BuilderLeftSidebar({ activeTab, onTabChange }: BuilderLeftSidebarProps) {
  const currentTab: StudioTab =
    ['pages', 'layers', 'assets', 'components', 'ai', 'history'].includes(activeTab)
      ? activeTab
      : 'layers'

  const tabs: { id: StudioTab; label: string; icon: React.ElementType }[] = [
    { id: 'pages',      label: 'Pages',      icon: PanelLeft },
    { id: 'layers',     label: 'Layers',     icon: Layers },
    { id: 'assets',     label: 'Assets',     icon: ImageIcon },
    { id: 'components', label: 'Komponenty', icon: Plus },
    { id: 'history',    label: 'Historia',   icon: History },
    { id: 'ai',         label: 'AI',         icon: Bot },
  ]

  return (
    <aside className="w-80 min-w-[320px] max-w-[380px] border-r border-white/10 bg-[#06060c] flex flex-col overflow-hidden flex-shrink-0">
      {/* Tab switcher - 6 equal columns */}
      <div className="grid grid-cols-6 border-b border-white/10 bg-[#05050a]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 py-3 px-1 text-[9px] font-bold uppercase tracking-wider transition-all
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
        {currentTab === 'history' && <HistoryPanel />}
        {currentTab === 'ai' && <AiPanel />}
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
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (isNaN(fromIndex) || fromIndex === toIndex || !activePage) return
    dispatch({ type: 'MOVE_SECTION', pageId: activePage.id, fromIndex, toIndex })
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragOverIndex(null)
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
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => selectSection(node.id)}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all text-xs select-none
                ${canvas.selectedSectionId === node.id
                  ? 'bg-violet-500/20 border border-violet-500/30 text-white'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }
                ${!node.visible ? 'opacity-40' : ''}
                ${dragOverIndex === index ? 'border-t-2 border-t-violet-500' : ''}
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

// ---------------------------------------------------------------------------
// History Panel — C16.6
// ---------------------------------------------------------------------------

function HistoryPanel() {
  const { canUndo, canRedo, undo, redo } = useBuilderHistory()
  const { history } = useBuilder()
  const entries = history.entries

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Historia</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-2 py-1 rounded-lg text-[10px] font-medium text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Undo"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-2 py-1 rounded-lg text-[10px] font-medium text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Redo"
          >
            Redo
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 text-xs text-center gap-2">
            <History className="w-8 h-8 opacity-30" />
            <span>No history yet</span>
            <span className="text-[10px]">Start editing to see changes</span>
          </div>
        ) : (
          [...entries].reverse().map((entry, index) => {
            const isActive = index === 0
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all
                  ${isActive
                    ? 'bg-violet-500/20 border border-violet-500/30 text-white'
                    : 'text-slate-400 border border-transparent hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{entry.label}</div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ''}
                  </div>
                </div>
                {isActive && (
                  <span className="text-[9px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded font-bold uppercase">
                    Current
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
      <div className="p-3 border-t border-white/5">
        <div className="text-[10px] text-slate-600 text-center">
          {entries.length} change{entries.length !== 1 ? 's' : ''} recorded
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI Panel — C16.7
// ---------------------------------------------------------------------------

function AiPanel() {
  const [prompt, setPrompt] = useState('')
  const { dispatch } = useBuilder()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    // TODO: Wire to AI endpoint
    console.log('AI prompt:', prompt)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">AI Assistant</h2>
        <span className="text-[9px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded font-medium">SOON</span>
      </div>

      {/* AI prompt area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="flex flex-col items-center justify-center py-12 text-slate-600 text-xs text-center gap-2">
          <Bot className="w-8 h-8 opacity-30" />
          <span className="font-medium">AI Assistant</span>
          <span className="text-[10px] max-w-[200px]">
            Ask AI to help you build your store — generate sections, suggest layouts, optimize content
          </span>
        </div>
      </div>

      {/* Prompt input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe what you want to build..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white
                       placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="px-3 py-2 rounded-lg text-[10px] font-bold bg-violet-600 text-white
                       hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

