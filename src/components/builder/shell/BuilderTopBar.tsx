'use client'

/**
 * BuilderTopBar — C16.2 Toolbar
 *
 * Studio 2.0 Top Bar:
 *   ← Back | Store Name + Status | [Pages][Layers][Assets][AI][History]
 *                         | Desktop | Tablet | Mobile | Undo | Redo | Save | Publish
 */

import { useState, useCallback } from 'react'
import {
  ChevronLeft, Monitor, Tablet, Smartphone,
  Undo2, Redo2, Save, Zap, AlertCircle, CheckCircle2,
  PanelLeft, Layers, ImageIcon, Bot, History,
  Search, Command,
} from 'lucide-react'
import Link from 'next/link'
import { useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import { VIEWPORT_PRESETS, ViewportLabel, RuntimeMode } from '../../../../packages/builder-core/src/CanvasState'

export type StudioTab = 'pages' | 'layers' | 'assets' | 'ai' | 'history'

export type PreviewMode = RuntimeMode

interface BuilderTopBarProps {
  storeId: string
  onSave: () => void
  saving: boolean
  activeTab: StudioTab
  onTabChange: (tab: StudioTab) => void
  onToggleLeftSidebar: () => void
}

const TABS: { id: StudioTab; label: string; icon: React.ElementType; shortcut: string }[] = [
  { id: 'pages',   label: 'Pages',   icon: PanelLeft,   shortcut: 'Ctrl+1' },
  { id: 'layers',  label: 'Layers',  icon: Layers,       shortcut: 'Ctrl+2' },
  { id: 'assets',  label: 'Assets',  icon: ImageIcon,    shortcut: 'Ctrl+3' },
  { id: 'ai',      label: 'AI',      icon: Bot,           shortcut: 'Ctrl+4' },
  { id: 'history', label: 'History', icon: History,       shortcut: 'Ctrl+5' },
]

export function BuilderTopBar({
  storeId, onSave, saving, activeTab, onTabChange, onToggleLeftSidebar,
}: BuilderTopBarProps) {
  const { document, canvas, isDirty, dispatch } = useBuilder()
  const { canUndo, canRedo, undo, redo } = useBuilderHistory()
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  const setViewport = useCallback((label: ViewportLabel) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'SET_VIEWPORT', viewport: VIEWPORT_PRESETS[label] },
    })
  }, [dispatch])

  const setRuntimeMode = useCallback((mode: RuntimeMode) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'SET_RUNTIME_MODE', mode },
    })
  }, [dispatch])

  const currentViewport = canvas.viewport.label

  return (
    <>
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/10
                      bg-[#050508]/90 backdrop-blur-md flex-shrink-0 z-30 select-none">
        {/* Left: back + store info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/dashboard/stores/${storeId}`}
            className="flex items-center justify-center w-9 h-9 rounded-xl
                       bg-white/5 hover:bg-white/10 border border-white/10
                       text-slate-400 hover:text-white transition-all"
            title="Powrót do dashboardu"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-sm truncate">{document.metadata.storeName}</h1>
              {isDirty ? (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Unsaved
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Saved
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 font-mono truncate">{document.metadata.storeSlug}</p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-xl p-0.5 border border-white/5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-lg'
                  : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              title={`${tab.label} (${tab.shortcut})`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: viewport + runtime mode + undo/redo + save/publish */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Runtime Mode (LIVE / PREVIEW / EXPORT) */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-xl p-0.5 border border-white/5">
            {(['PREVIEW', 'LIVE', 'EXPORT'] as RuntimeMode[]).map(m => (
              <button
                key={m}
                onClick={() => setRuntimeMode(m)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all
                  ${canvas.runtimeMode === m
                    ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                title={`Tryb podglądu: ${m}`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Viewport */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-xl p-0.5 border border-white/5">
            {(['DESKTOP', 'TABLET', 'MOBILE'] as ViewportLabel[]).map(label => (
              <button
                key={label}
                onClick={() => setViewport(label)}
                className={`p-1.5 rounded-lg transition-all
                  ${currentViewport === label
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'text-slate-600 hover:text-white'
                  }`}
                title={label === 'DESKTOP' ? 'Desktop (1280px)' : label === 'TABLET' ? 'Tablet (768px)' : 'Mobile (375px)'}
              >
                {label === 'DESKTOP' && <Monitor className="w-3.5 h-3.5" />}
                {label === 'TABLET' && <Tablet className="w-3.5 h-3.5" />}
                {label === 'MOBILE' && <Smartphone className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-xl p-0.5 border border-white/5">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Save */}
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10
                       text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white
                       transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </button>

          {/* Publish */}
          <button
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs
                       bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white
                       hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105 active:scale-95
                       transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Publish
          </button>

          {/* Command Palette */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10
                       text-[10px] text-slate-600 hover:text-white hover:bg-white/10 transition-all"
            title="Command Palette (Ctrl+K)"
          >
            <Command className="w-3 h-3" />
            <kbd className="text-[9px] font-mono opacity-60">K</kbd>
          </button>
        </div>
      </div>

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <CommandPaletteModal onClose={() => setShowCommandPalette(false)} />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Command Palette
// ---------------------------------------------------------------------------

function CommandPaletteModal({ onClose }: { onClose: () => void }): React.ReactElement {
  const [query, setQuery] = useState('')
  const { dispatch } = useBuilder()

  const commands = [
    { label: 'Add Hero section', action: () => {} },
    { label: 'Add Features section', action: () => {} },
    { label: 'Add Pricing section', action: () => {} },
    { label: 'Publish page', action: () => {} },
    { label: 'Toggle responsive view', action: () => {} },
    { label: 'Open AI Assistant', action: () => {} },
  ]

  const filtered = query.trim()
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0c0c14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600
                       focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-[10px] text-slate-600 bg-white/5 px-2 py-1 rounded-lg">
            ESC
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
          {filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={() => { cmd.action(); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                         text-sm text-slate-300 hover:bg-white/5 hover:text-white
                         transition-all text-left"
            >
              <span className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-xs">
                {cmd.label.charAt(0)}
              </span>
              {cmd.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-slate-600 text-center py-8">
              No commands found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

