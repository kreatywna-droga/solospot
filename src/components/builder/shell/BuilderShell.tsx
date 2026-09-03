'use client'

/**
 * BuilderShell — C16.2 Studio Shell
 *
 * The Studio 2.0 main layout:
 *
 *   ┌──────────────────────────────────────────────────────────────────────┐
 *   │                        TOOLBAR (Top Bar)                             │
 *   ├──────────┬──────────────────────────────────────────┬────────────────┤
 *   │  LEFT    │             CANVAS                        │   INSPECTOR   │
 *   │  SIDEBAR │         (live preview)                    │   (Right      │
 *   │          │                                          │    Panel)     │
 *   │ [Pages]  │    ┌─────────────────────────────┐       │                │
 *   │ [Layers] │    │                             │       │  Properties    │
 *   │ [Assets] │    │     Responsive iframe       │       │                │
 *   │ [Comps]  │    │     z prawdziwą stroną      │       │                │
 *   │          │    │                             │       │                │
 *   │          │    └─────────────────────────────┘       │                │
 *   ├──────────┴──────────────────────────────────────────┴────────────────┤
 *   │                      BOTTOM BAR                                      │
 *   └──────────────────────────────────────────────────────────────────────┘
 */

import { useState, useCallback, useEffect } from 'react'
import { BuilderProvider, useBuilder, useBuilderHistory } from '../state/BuilderProvider'
import { BuilderCanvas } from '../canvas/BuilderCanvas'
import { InspectorShellAdapter } from '../../../../packages/authoring-studio/src/inspector/InspectorShellAdapter'
import { BuilderTopBar, StudioTab } from './BuilderTopBar'
import { BuilderLeftSidebar } from './BuilderLeftSidebar'
import { BuilderBottomBar } from './BuilderBottomBar'
import { BuilderDocument, BuilderMetadata, BuilderTheme, createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument'

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

function BuilderBreadcrumbs() {
  const { canvas } = useBuilder()
  const breadcrumbs = canvas.breadcrumbs

  if (breadcrumbs.length === 0) return null

  return (
    <nav className="h-7 flex items-center gap-1 px-4 border-b border-white/5 bg-[#08080f]/60 text-[10px]">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center gap-1">
          {index > 0 && <span className="text-slate-600 mx-0.5">/</span>}
          <span className={`${index === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-slate-500 hover:text-slate-300 cursor-pointer'}`}>
            {crumb.label}
          </span>
        </div>
      ))}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// BuilderShell
// ---------------------------------------------------------------------------

interface BuilderShellProps {
  storeId: string
  onSave: () => void
  saving: boolean
}

export function BuilderShell({ storeId, onSave, saving }: BuilderShellProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('layers')
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true)
  const { dispatch, canvas } = useBuilder()
  // Keyboard handled by KeyboardController in core — BuilderShell is "głupi"

  const handleInspectorPropChange = useCallback(
    (key: string, value: unknown) => {
      if (!canvas.selectedSectionId || !canvas.selectedPageId) return
      dispatch({
        type: 'UPDATE_PROPS',
        pageId: canvas.selectedPageId,
        sectionId: canvas.selectedSectionId,
        props: { [key]: value },
      })
    },
    [dispatch, canvas.selectedSectionId, canvas.selectedPageId],
  )

  return (
    <div className="h-screen bg-[#050508] text-white flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <BuilderTopBar
        storeId={storeId}
        onSave={onSave}
        saving={saving}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleLeftSidebar={() => setLeftSidebarVisible(v => !v)}
      />

      {/* Breadcrumbs */}
      <BuilderBreadcrumbs />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {leftSidebarVisible && (
          <BuilderLeftSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <BuilderCanvas onAddSection={() => setActiveTab('components')} />
        </main>

        {/* Inspector (Right Panel) — Inspector 2.0 (PM28 Architecture) */}
        <aside className="w-72 border-l border-white/10 bg-[#06060c] flex flex-col overflow-hidden flex-shrink-0">
          <InspectorShellAdapter
            sectionId={canvas.selectedSectionId}
            onPropChange={handleInspectorPropChange}
          />
        </aside>
      </div>

      {/* Bottom Bar */}
      <BuilderBottomBar
        onSave={onSave}
        saving={saving}
        onTabChange={setActiveTab}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// BuilderShellWithProvider — wraps BuilderProvider around BuilderShell
// ---------------------------------------------------------------------------

interface BuilderShellWithProviderProps {
  storeId: string
  initialDocument?: BuilderDocument
  onSave?: (doc: BuilderDocument) => Promise<void>
}

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

export function BuilderShellWithProvider({
  storeId, initialDocument, onSave,
}: BuilderShellWithProviderProps) {
  const [saving, setSaving] = useState(false)
  const [savedDoc, setSavedDoc] = useState<BuilderDocument | null>(null)

  const doc = savedDoc ?? initialDocument ?? createDefaultDocument(storeId)

  const handleSave = useCallback(async (currentDoc: BuilderDocument) => {
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
  }, [saving, onSave])

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

