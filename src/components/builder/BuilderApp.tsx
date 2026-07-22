'use client'

/**
 * BuilderApp — C6.2-A (Builder Shell)
 *
 * The full Visual Builder layout:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  TopBar: store name | viewport | undo/redo | publish    │
 *   ├──────────┬────────────────────────────────┬────────────┤
 *   │ Left     │                                │ Right      │
 *   │ Sidebar  │      BuilderCanvas             │ Sidebar    │
 *   │          │      (wireframe preview)       │            │
 *   │ [Layers] │                                │ [Props]    │
 *   │ [Comps]  │                                │            │
 *   └──────────┴────────────────────────────────┴────────────┘
 *
 * Wires together:
 *   BuilderProvider (state)
 *   ↓
 *   LayerTree    | BuilderCanvas | PropsPanel
 *   ComponentPanel               |
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ChevronLeft, Monitor, Tablet, Smartphone,
  Undo2, Redo2, Save, Globe, Layers, Plus,
  Eye, Zap, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { BuilderProvider, useBuilder, useBuilderHistory } from './state/BuilderProvider'
import { LayerTree } from './sidebar/LayerTree'
import { PropsPanel } from './sidebar/PropsPanel'
import { ComponentPanel } from './sidebar/ComponentPanel'
import { BuilderCanvas } from './canvas/BuilderCanvas'
import { BuilderDocument, BuilderMetadata, createBuilderDocument, BuilderTheme } from '../../../packages/builder-core/src/BuilderDocument'
import { VIEWPORT_PRESETS, ViewportLabel } from '../../../packages/builder-core/src/CanvasState'

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

function BuilderTopBar({
  storeId,
  onSave,
  saving,
}: {
  storeId: string
  onSave: () => void
  saving: boolean
}) {
  const { document, canvas, isDirty, dispatch } = useBuilder()
  const { canUndo, canRedo, undo, redo } = useBuilderHistory()

  const setViewport = useCallback((label: ViewportLabel) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'SET_VIEWPORT', viewport: VIEWPORT_PRESETS[label] },
    })
  }, [dispatch])

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-white/10
                    bg-[#050508]/80 backdrop-blur-sm flex-shrink-0 z-20">
      {/* Left: back + store name */}
      <div className="flex items-center gap-4 min-w-0">
        <Link
          href={`/dashboard/stores/${storeId}`}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-bold text-white text-sm truncate">{document.metadata.storeName}</h1>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-600 font-mono truncate">{document.metadata.storeSlug}</span>
            {isDirty ? (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertCircle className="w-3 h-3" />
                Niezapisane zmiany
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Zapisano
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: viewport switcher */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
        {(['DESKTOP', 'TABLET', 'MOBILE'] as ViewportLabel[]).map(label => (
          <button
            key={label}
            onClick={() => setViewport(label)}
            className={`p-2 rounded-lg transition-all
              ${canvas.viewport.label === label
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-slate-500 hover:text-white'
              }`}
            title={label}
          >
            {label === 'DESKTOP' && <Monitor className="w-4 h-4" />}
            {label === 'TABLET' && <Tablet className="w-4 h-4" />}
            {label === 'MOBILE' && <Smartphone className="w-4 h-4" />}
          </button>
        ))}
      </div>

      {/* Right: undo/redo + publish */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg transition-all text-slate-500 hover:text-white
                       disabled:opacity-30 disabled:cursor-not-allowed"
            title="Cofnij (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg transition-all text-slate-500 hover:text-white
                       disabled:opacity-30 disabled:cursor-not-allowed"
            title="Ponów (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10
                     text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white
                     transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Zapisywanie...' : 'Zapisz'}
        </button>

        {/* Publish */}
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm
                     bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white
                     hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105 active:scale-95
                     transition-all"
        >
          <Zap className="w-4 h-4" />
          Publikuj
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

function Breadcrumbs() {
  const { canvas } = useBuilder()
  const breadcrumbs = canvas.breadcrumbs

  if (breadcrumbs.length === 0) return null

  return (
    <div className="h-8 flex items-center gap-1 px-4 border-b border-white/5 bg-[#08080f]/50 text-[11px]">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center gap-1">
          {index > 0 && <span className="text-slate-600">/</span>}
          <span className={`${index === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-slate-500'}`}>
            {crumb.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Left sidebar — layer tree + component panel switcher
// ---------------------------------------------------------------------------

type LeftTab = 'layers' | 'components'

function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<LeftTab>('layers')

  return (
    <aside className="w-64 border-r border-white/10 bg-[#06060c] flex flex-col overflow-hidden flex-shrink-0">
      {/* Tab switcher */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-all
            ${activeTab === 'layers'
              ? 'text-white border-b-2 border-violet-500 bg-violet-500/5'
              : 'text-slate-500 hover:text-white'
            }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Warstwy
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-all
            ${activeTab === 'components'
              ? 'text-white border-b-2 border-violet-500 bg-violet-500/5'
              : 'text-slate-500 hover:text-white'
            }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Dodaj
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'layers' ? (
            <motion.div
              key="layers"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >
              <LayerTree />
            </motion.div>
          ) : (
            <motion.div
              key="components"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >
              <ComponentPanel onClose={() => setActiveTab('layers')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Page selector at bottom */}
      <PageSelector />
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Page selector (bottom of left sidebar)
// ---------------------------------------------------------------------------

function PageSelector() {
  const { document, canvas, dispatch } = useBuilder()

  const selectPage = useCallback((pageId: string) => {
    dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: null, pageId } })
  }, [dispatch])

  return (
    <div className="border-t border-white/10 p-3">
      <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Strony</div>
      <div className="space-y-1">
        {document.pages.map(page => (
          <button
            key={page.id}
            onClick={() => selectPage(page.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left
              ${canvas.selectedPageId === page.id || (!canvas.selectedPageId && page.isHome)
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
          >
            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate font-medium">{page.name}</span>
            <span className="text-slate-600 font-mono text-[10px] truncate ml-auto">{page.slug}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BuilderShell — inner (uses hooks, must be inside BuilderProvider)
// ---------------------------------------------------------------------------

interface BuilderShellProps {
  storeId: string
  onSave: () => void
  saving: boolean
}

function BuilderShell({ storeId, onSave, saving }: BuilderShellProps) {
  const { dispatch } = useBuilder()
  const [showComponentPanel, setShowComponentPanel] = useState(false)

  const handleAddSection = useCallback(() => {
    setShowComponentPanel(true)
    dispatch({ type: 'CANVAS', action: { type: 'SET_MODE', mode: 'INSERT' } })
  }, [dispatch])

  return (
    <div className="h-screen bg-[#050508] text-white flex flex-col overflow-hidden">
      <BuilderTopBar storeId={storeId} onSave={onSave} saving={saving} />
      <Breadcrumbs />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        {/* Center canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <BuilderCanvas onAddSection={handleAddSection} />
        </main>

        {/* Right sidebar — props panel */}
        <aside className="w-72 border-l border-white/10 bg-[#06060c] flex flex-col overflow-hidden flex-shrink-0">
          <PropsPanel />
        </aside>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BuilderApp — public entry point (creates BuilderProvider)
// ---------------------------------------------------------------------------

export interface BuilderAppProps {
  storeId: string
  /** Initial BuilderDocument loaded from API */
  initialDocument?: BuilderDocument
  onSave?: (doc: BuilderDocument) => Promise<void>
}

/**
 * Default document factory — used when no server document is available
 * (e.g. new store, or API not yet connected)
 */
function createDefaultDocument(storeId: string): BuilderDocument {
  const metadata: BuilderMetadata = {
    storeName: 'Mój Sklep',
    storeSlug: storeId,
    locale: 'pl',
    currency: 'PLN',
  }
  const theme: Partial<BuilderTheme> = {
    primaryColor: '#7c3aed',
    secondaryColor: '#d946ef',
    font: 'Inter',
  }
  return createBuilderDocument({ id: storeId, tenantId: 'local', metadata, theme })
}

export function BuilderApp({ storeId, initialDocument, onSave }: BuilderAppProps) {
  const [saving, setSaving] = useState(false)
  const [savedDoc, setSavedDoc] = useState<BuilderDocument | null>(null)

  const doc = savedDoc ?? initialDocument ?? createDefaultDocument(storeId)

  const handleSave = async (currentDoc: BuilderDocument) => {
    if (saving) return
    setSaving(true)
    try {
      await onSave?.(currentDoc)
      setSavedDoc(currentDoc)
    } catch (err) {
      console.error('Builder save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <BuilderProvider document={doc}>
      <BuilderShellWithSave storeId={storeId} onSave={handleSave} saving={saving} />
    </BuilderProvider>
  )
}

// Inner wrapper to access useBuilder() for save
function BuilderShellWithSave({
  storeId, onSave, saving,
}: {
  storeId: string
  onSave: (doc: BuilderDocument) => Promise<void>
  saving: boolean
}) {
  const { document } = useBuilder()
  return (
    <BuilderShell
      storeId={storeId}
      onSave={() => onSave(document)}
      saving={saving}
    />
  )
}
