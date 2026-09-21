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
  PanelRight, Search, Command, Eye, Sparkles, Power,
} from 'lucide-react'
import Link from 'next/link'
import { useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import { VIEWPORT_PRESETS, ViewportLabel, RuntimeMode } from '../../../../packages/builder-core/src/CanvasState'
import { WebsiteTemplatePickerModal } from '../templates/WebsiteTemplatePickerModal'
import { ExperienceLibraryModal } from '../experience/ExperienceLibraryModal'
import { StoreLifecycleModal } from '../modals/StoreLifecycleModal'

export type StudioTab = 'pages' | 'layers' | 'components' | 'assets' | 'style' | 'ai' | 'history'

export type PreviewMode = RuntimeMode

interface BuilderTopBarProps {
  storeId: string
  onSave: () => void
  onPublish: () => void
  saving: boolean
  onToggleLeftSidebar: () => void
  inspectorVisible?: boolean
  onToggleInspector?: () => void
}

export function BuilderTopBar({
  storeId, onSave, onPublish, saving, onToggleLeftSidebar,
  inspectorVisible = true, onToggleInspector,
}: BuilderTopBarProps) {
  const { document, canvas, isDirty, dispatch } = useBuilder()
  const { canUndo, canRedo, undo, redo } = useBuilderHistory()
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showExperienceLibrary, setShowExperienceLibrary] = useState(false)
  const [showLifecycleModal, setShowLifecycleModal] = useState(false)

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
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#1A1F2E]
                      bg-[#080B10] backdrop-blur-md flex-shrink-0 z-30 select-none">
        {/* Left: back + store info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/dashboard/stores/${storeId}`}
            className="flex items-center justify-center w-9 h-9 rounded-xl
                       bg-[#0D1118] hover:bg-[#1A1F2E] border border-[#1A1F2E]
                       text-zinc-400 hover:text-[#D9A86C] transition-all"
            title="Powrót do dashboardu"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-sm truncate">{document.metadata.storeName}</h1>
              {isDirty ? (
                <span className="flex items-center gap-1 text-[10px] text-[#D9A86C] bg-[#D9A86C]/10 px-2 py-0.5 rounded-full">
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
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] text-zinc-500 font-mono truncate">{document.metadata.storeSlug}</p>
              <button
                onClick={() => setShowLifecycleModal(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0D1118] hover:bg-[#1A1F2E] border border-[#252B3A] text-[10px] text-zinc-300 hover:text-[#D9A86C] transition-all"
                title="Zarządzaj cyklem życia sklepu (Aktywuj / Dezaktywuj / Usuń)"
              >
                <Power className="w-2.5 h-2.5 text-emerald-400" />
                <span>Sklep</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: viewport + templates / preview + undo/redo + save/publish */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Templates, Experiences & Preview Mode Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowExperienceLibrary(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#B8893A] to-[#D9A86C] hover:from-[#C99A4A] hover:to-[#F2C27F] text-[#080B10] font-semibold text-xs transition-all shadow-md shadow-[#D9A86C]/20 active:scale-95"
              title="Biblioteka gotowych doświadczeń, sekcji i interakcji (Experience Library v2.0)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#080B10]/80" />
              <span className="hidden sm:inline">Experiences</span>
            </button>

            <button
              onClick={() => setShowTemplatePicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D9A86C]/12 hover:bg-[#D9A86C]/20 text-[#F2C27F] border border-[#D9A86C]/25 text-xs font-semibold transition-all shadow-sm"
              title="Wybierz gotowy szablon strony"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D9A86C]" />
              <span className="hidden sm:inline">Szablony</span>
            </button>

            <button
              onClick={() => {
                const nextMode = canvas.runtimeMode === 'PREVIEW' ? 'LIVE' : 'PREVIEW'
                setRuntimeMode(nextMode)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                canvas.runtimeMode === 'PREVIEW'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm'
                  : 'bg-[#202024] text-zinc-300 border-[#2D2D32] hover:bg-[#27272A] hover:text-white'
              }`}
              title="Przełącz tryb podglądu"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{canvas.runtimeMode === 'PREVIEW' ? 'Edytuj' : 'Podgląd'}</span>
            </button>

            {onToggleInspector && (
              <button
                onClick={onToggleInspector}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  inspectorVisible
                    ? 'bg-[#D9A86C]/15 text-[#F2C27F] border-[#D9A86C]/30 shadow-sm shadow-[#D9A86C]/10'
                    : 'bg-[#202024] text-zinc-400 border-[#2D2D32] hover:bg-[#27272A] hover:text-white'
                }`}
                title={inspectorVisible ? 'Schowaj inspektor właściwości (Alt+I)' : 'Otwórz inspektor właściwości (Alt+I)'}
              >
                <PanelRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Inspektor</span>
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-[#1A1F2E] mx-1" />

          {/* Viewport */}
          <div className="flex items-center gap-0.5 bg-[#0D1118] rounded-xl p-0.5 border border-[#1A1F2E]">
            {(['DESKTOP', 'TABLET', 'MOBILE'] as ViewportLabel[]).map(label => (
              <button
                key={label}
                onClick={() => setViewport(label)}
                className={`p-1.5 rounded-lg transition-all
                  ${currentViewport === label
                    ? 'bg-[#D9A86C]/15 text-[#F2C27F]'
                    : 'text-zinc-500 hover:text-white'
                  }`}
                title={label === 'DESKTOP' ? 'Desktop (1280px)' : label === 'TABLET' ? 'Tablet (768px)' : 'Mobile (375px)'}
              >
                {label === 'DESKTOP' && <Monitor className="w-3.5 h-3.5" />}
                {label === 'TABLET' && <Tablet className="w-3.5 h-3.5" />}
                {label === 'MOBILE' && <Smartphone className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-[#1A1F2E] mx-1" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 bg-[#0D1118] rounded-xl p-0.5 border border-[#1A1F2E]">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05]
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05]
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-6 bg-[#1A1F2E] mx-1" />

          {/* Save */}
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0D1118] border border-[#252B3A]
                       text-xs font-medium text-zinc-300 hover:bg-[#1A1F2E] hover:text-[#D9A86C]
                       transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </button>

          {/* Publish */}
          <button
            onClick={onPublish}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs
                       bg-gradient-to-r from-[#B8893A] to-[#D9A86C] text-[#080B10]
                       hover:shadow-lg hover:shadow-[#D9A86C]/30 hover:scale-105 active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            {saving ? 'Publikowanie...' : 'Publish'}
          </button>

          {/* Command Palette */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#0D1118] border border-[#252B3A]
                       text-[10px] text-zinc-400 hover:text-[#D9A86C] hover:bg-[#1A1F2E] transition-all"
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

      {/* Website Template Picker Modal */}
      <WebsiteTemplatePickerModal
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
      />

      {/* Store Lifecycle Modal */}
      <StoreLifecycleModal
        storeId={storeId}
        storeName={document.metadata.storeName}
        isOpen={showLifecycleModal}
        onClose={() => setShowLifecycleModal(false)}
      />

      {/* Experience Library Modal */}
      <ExperienceLibraryModal
        isOpen={showExperienceLibrary}
        onClose={() => setShowExperienceLibrary(false)}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Command Palette
// ---------------------------------------------------------------------------

function CommandPaletteModal({ onClose }: { onClose: () => void }): React.ReactElement {
  const [query, setQuery] = useState('')
  const { dispatch, document, canvas } = useBuilder()

  const activePageId = canvas.selectedPageId || document.pages[0]?.id

  const addSection = (sectionType: string, defaultProps: Record<string, unknown>, label: string) => {
    if (!activePageId) return
    dispatch({
      type: 'ADD_SECTION',
      pageId: activePageId,
      sectionType,
      defaultProps,
      label,
    })
  }

  const commands: { label: string; action: () => void }[] = [
    {
      label: 'Add Hero section',
      action: () =>
        addSection('hero', { title: 'Nowy Hero', subtitle: 'Podtytuł hero', cta: 'Rozpocznij zakupy' }, 'Hero'),
    },
    {
      label: 'Add Features section',
      action: () =>
        addSection('feature-grid', { title: 'Nasze korzyści' }, 'Korzyści'),
    },
    {
      label: 'Add Pricing section',
      action: () =>
        addSection('pricing', { title: 'Cennik' }, 'Cennik'),
    },
    {
      label: 'Switch to Mobile viewport',
      action: () =>
        dispatch({
          type: 'CANVAS',
          action: { type: 'SET_VIEWPORT', viewport: VIEWPORT_PRESETS.MOBILE },
        }),
    },
    {
      label: 'Switch to Tablet viewport',
      action: () =>
        dispatch({
          type: 'CANVAS',
          action: { type: 'SET_VIEWPORT', viewport: VIEWPORT_PRESETS.TABLET },
        }),
    },
    {
      label: 'Switch to Desktop viewport',
      action: () =>
        dispatch({
          type: 'CANVAS',
          action: { type: 'SET_VIEWPORT', viewport: VIEWPORT_PRESETS.DESKTOP },
        }),
    },
    { label: 'Undo (Ctrl+Z)', action: () => dispatch({ type: 'UNDO' }) },
    { label: 'Redo (Ctrl+Shift+Z)', action: () => dispatch({ type: 'REDO' }) },
    { label: 'Zoom 100%', action: () => dispatch({ type: 'CANVAS', action: { type: 'SET_ZOOM', zoom: 1.0 } }) },
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
        className="w-full max-w-xl bg-[#0D1118] border border-[#1A1F2E] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A1F2E]">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500
                       focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-[10px] text-zinc-500 bg-white/[0.05] px-2 py-1 rounded-lg">
            ESC
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
          {filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={() => { cmd.action(); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                         text-sm text-zinc-300 hover:bg-white/[0.05] hover:text-[#F2C27F]
                         transition-all text-left"
            >
              <span className="w-6 h-6 rounded-lg bg-[#D9A86C]/10 flex items-center justify-center text-[#D9A86C] text-xs">
                {cmd.label.charAt(0)}
              </span>
              {cmd.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-zinc-500 text-center py-8">
              No commands found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
