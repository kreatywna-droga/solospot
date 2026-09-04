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
  onPublish: () => void
  saving: boolean
}

export function BuilderShell({ storeId, onSave, onPublish, saving }: BuilderShellProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('layers')
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true)
  const { dispatch, canvas, document: builderDoc } = useBuilder()

  // Resizable sidebar widths with localStorage persistence
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solospot_builder_left_width')
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= 220 && parsed <= 620) return parsed
      }
    }
    return 320
  })

  const [rightWidth, setRightWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solospot_builder_right_width')
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= 220 && parsed <= 620) return parsed
      }
    }
    return 288
  })

  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)

  // Drag handler for Left Sidebar
  const handleLeftResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingLeft(true)
    const startX = e.clientX
    const startW = leftWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const newWidth = Math.min(Math.max(startW + delta, 220), 620)
      setLeftWidth(newWidth)
      try {
        localStorage.setItem('solospot_builder_left_width', newWidth.toString())
      } catch {}
    }

    const handleMouseUp = () => {
      setIsResizingLeft(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [leftWidth])

  // Drag handler for Right Sidebar (Inspector)
  const handleRightResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingRight(true)
    const startX = e.clientX
    const startW = rightWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX
      const newWidth = Math.min(Math.max(startW + delta, 220), 620)
      setRightWidth(newWidth)
      try {
        localStorage.setItem('solospot_builder_right_width', newWidth.toString())
      } catch {}
    }

    const handleMouseUp = () => {
      setIsResizingRight(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [rightWidth])

  const handleInspectorPropChange = useCallback(
    (key: string, value: unknown) => {
      if (!canvas.selectedSectionId) return
      const targetPageId = canvas.selectedPageId || builderDoc.pages[0]?.id
      if (!targetPageId) return
      dispatch({
        type: 'UPDATE_PROPS',
        pageId: targetPageId,
        sectionId: canvas.selectedSectionId,
        props: { [key]: value },
      })
    },
    [dispatch, canvas.selectedSectionId, canvas.selectedPageId, builderDoc.pages],
  )

  return (
    <div className="h-screen bg-[#050508] text-white flex flex-col overflow-hidden select-none">
      {/* Overlay to capture pointer events smoothly when dragging across iframes */}
      {(isResizingLeft || isResizingRight) && (
        <div className="fixed inset-0 z-[9999] cursor-col-resize select-none" />
      )}

      {/* Top Bar */}
      <BuilderTopBar
        storeId={storeId}
        onSave={onSave}
        onPublish={onPublish}
        saving={saving}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleLeftSidebar={() => setLeftSidebarVisible(v => !v)}
      />

      {/* Breadcrumbs */}
      <BuilderBreadcrumbs />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        {leftSidebarVisible && (
          <>
            <BuilderLeftSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              width={leftWidth}
            />
            {/* Left Resizer Handle */}
            <div
              onMouseDown={handleLeftResizeStart}
              onDoubleClick={() => {
                setLeftWidth(320)
                try { localStorage.setItem('solospot_builder_left_width', '320') } catch {}
              }}
              title="Przeciągnij, aby zmienić szerokość lewego panelu (kliknij 2x, aby zresetować)"
              className={`w-1.5 hover:w-2 -mr-1.5 z-30 cursor-col-resize transition-all flex items-center justify-center group flex-shrink-0 relative ${
                isResizingLeft ? 'bg-violet-500 shadow-lg shadow-violet-500/50' : 'bg-transparent hover:bg-violet-500/40'
              }`}
            >
              <div className={`w-[2px] h-8 rounded-full transition-colors ${
                isResizingLeft ? 'bg-white' : 'bg-white/10 group-hover:bg-violet-400'
              }`} />
            </div>
          </>
        )}

        {/* Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <BuilderCanvas onAddSection={() => setActiveTab('components')} />
        </main>

        {/* Right Resizer Handle */}
        <div
          onMouseDown={handleRightResizeStart}
          onDoubleClick={() => {
            setRightWidth(288)
            try { localStorage.setItem('solospot_builder_right_width', '288') } catch {}
          }}
          title="Przeciągnij, aby zmienić szerokość inspektora (kliknij 2x, aby zresetować)"
          className={`w-1.5 hover:w-2 -ml-1.5 z-30 cursor-col-resize transition-all flex items-center justify-center group flex-shrink-0 relative ${
            isResizingRight ? 'bg-violet-500 shadow-lg shadow-violet-500/50' : 'bg-transparent hover:bg-violet-500/40'
          }`}
        >
          <div className={`w-[2px] h-8 rounded-full transition-colors ${
            isResizingRight ? 'bg-white' : 'bg-white/10 group-hover:bg-violet-400'
          }`} />
        </div>

        {/* Inspector (Right Panel) — Inspector 2.0 (PM28 Architecture) */}
        <aside
          style={{ width: `${rightWidth}px` }}
          className="border-l border-white/10 bg-[#06060c] flex flex-col overflow-hidden flex-shrink-0 h-full select-none"
        >
          <InspectorShellAdapter
            sectionId={canvas.selectedSectionId}
            onPropChange={handleInspectorPropChange}
          />
        </aside>
      </div>

      {/* Bottom Bar */}
      <BuilderBottomBar
        onSave={onSave}
        onPublish={onPublish}
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
  onPublish?: (doc: BuilderDocument) => Promise<void>
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
  storeId, initialDocument, onSave, onPublish,
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

  const handlePublish = useCallback(async (currentDoc: BuilderDocument) => {
    if (saving) return
    setSaving(true)
    try {
      await onPublish?.(currentDoc)
      setSavedDoc(currentDoc)
    } catch (err) {
      console.error('Builder publish error:', err)
    } finally {
      setSaving(false)
    }
  }, [saving, onPublish])

  return (
    <BuilderProvider document={doc}>
      <BuilderShellWithSave storeId={storeId} onSave={handleSave} onPublish={handlePublish} saving={saving} />
    </BuilderProvider>
  )
}

// Inner wrapper to access useBuilder() for save
function BuilderShellWithSave({
  storeId, onSave, onPublish, saving,
}: {
  storeId: string
  onSave: (doc: BuilderDocument) => Promise<void>
  onPublish: (doc: BuilderDocument) => Promise<void>
  saving: boolean
}) {
  const { document, dispatch } = useBuilder()
  const handleSave = useCallback(async () => {
    await onSave(document)
    dispatch({ type: 'MARK_PUBLISHED' })
  }, [onSave, document, dispatch])
  const handlePublish = useCallback(async () => {
    await onPublish(document)
    dispatch({ type: 'MARK_PUBLISHED' })
  }, [onPublish, document, dispatch])
  return (
    <BuilderShell
      storeId={storeId}
      onSave={handleSave}
      onPublish={handlePublish}
      saving={saving}
    />
  )
}

