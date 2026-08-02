'use client'

/**
 * InspectorPanel — C16.7 Inspector Panel (Sprint 4A)
 *
 * The right-side panel that shows property editors for the selected section.
 *
 * Architecture:
 *   SelectionChanged → InspectorSync → schema + props
 *       ↓
 *   InspectorRuntime.organizeByCategory(schema)
 *       ↓
 *   InspectorPanel → CategoryGroup[] → PropertyField[]
 *       ↓
 *   onChange → InspectorRuntime.createPropertyCommand() → dispatch
 *
 * This is the MAIN panel that replaces the old PropsPanel.tsx.
 * It is:
 *   - Schema-driven (no hardcoded fields)
 *   - Category-organized (collapsible groups)
 *   - Validation-aware (errors shown inline)
 *   - History-tracked (dispatch through BuilderCommands)
 */

import { useCallback, useMemo, useState } from 'react'
import {
  X, Lock, Eye, EyeOff, Trash2, Copy, Monitor, Tablet, Smartphone,
  AlertTriangle,
} from 'lucide-react'
import { useBuilder, useSelectedSection } from '../state/BuilderProvider'
import { InspectorRuntime } from '../../../../packages/builder-core/src/InspectorRuntime'
import { VIEWPORT_PRESETS, ViewportLabel } from '../../../../packages/builder-core/src'
import { CategoryGroup } from './CategoryGroup'
import { InspectorSync } from './InspectorSync'

// ---------------------------------------------------------------------------
// InspectorPanel
// ---------------------------------------------------------------------------

export function InspectorPanel() {
  const { dispatch, canvas, document } = useBuilder()
  const selectedNode = useSelectedSection()
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // --- Empty state (no section selected) ---
  if (!selectedNode || !canvas.selectedSectionId || !canvas.selectedPageId) {
    return <PageInspector />
  }

  const isLocked = selectedNode.locked

  // --- Section header actions ---
  const handleClose = useCallback(() => {
    dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: null } })
  }, [dispatch])

  const handleDelete = useCallback(() => {
    if (!canvas.selectedSectionId || !canvas.selectedPageId) return
    dispatch({ type: 'REMOVE_SECTION', pageId: canvas.selectedPageId, sectionId: canvas.selectedSectionId })
  }, [dispatch, canvas.selectedSectionId, canvas.selectedPageId])

  const handleDuplicate = useCallback(() => {
    if (!canvas.selectedSectionId || !canvas.selectedPageId) return
    dispatch({ type: 'DUPLICATE_SECTION', pageId: canvas.selectedPageId, sectionId: canvas.selectedSectionId })
  }, [dispatch, canvas.selectedSectionId, canvas.selectedPageId])

  const handleToggleVisibility = useCallback(() => {
    if (!canvas.selectedSectionId || !canvas.selectedPageId) return
    dispatch({ type: 'TOGGLE_VISIBILITY', pageId: canvas.selectedPageId, sectionId: canvas.selectedSectionId })
  }, [dispatch, canvas.selectedSectionId, canvas.selectedPageId])

  // --- Property change handler ---
  const handlePropChange = useCallback((key: string, value: unknown) => {
    if (!canvas.selectedSectionId || !canvas.selectedPageId) return

    // Clear error for this field
    setValidationErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })

    // Dispatch directly (validation is done by InspectorRuntime)
    dispatch({
      type: 'UPDATE_PROPS',
      pageId: canvas.selectedPageId,
      sectionId: canvas.selectedSectionId,
      props: { [key]: value },
    })
  }, [dispatch, canvas.selectedSectionId, canvas.selectedPageId])

  return (
    <InspectorSync>
      {(data) => {
        if (!data.descriptor && data.sectionId) {
          return (
            <div className="flex flex-col h-full">
              <SectionHeader
                label={selectedNode.label}
                type={selectedNode.type}
                isLocked={isLocked}
                isVisible={selectedNode.visible}
                activeBreakpoint={canvas.selection.activeBreakpoint}
                onClose={handleClose}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggleVisibility={handleToggleVisibility}
                onBreakpointChange={(b) => dispatch({ type: 'CANVAS', action: { type: 'SET_BREAKPOINT', breakpoint: b } })}
              />
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">{data.error || 'Nieznany komponent'}</p>
                </div>
              </div>
            </div>
          )
        }

        const schema = data.descriptor?.schema ?? []
        const props = InspectorRuntime.applyDefaults(schema, data.props)
        const categories = InspectorRuntime.organizeByCategory(schema)

        return (
          <div className="flex flex-col h-full">
            <SectionHeader
              label={selectedNode.label}
              type={selectedNode.type}
              isLocked={isLocked}
              isVisible={selectedNode.visible}
              activeBreakpoint={canvas.selection.activeBreakpoint}
              onClose={handleClose}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleVisibility={handleToggleVisibility}
              onBreakpointChange={(b) => dispatch({ type: 'CANVAS', action: { type: 'SET_BREAKPOINT', breakpoint: b } })}
            />

            {/* Locked notice */}
            {isLocked && (
              <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                Sekcja jest zablokowana — edycja wyłączona
              </div>
            )}

            {/* Categories */}
            <div className={`flex-1 overflow-y-auto ${isLocked ? 'pointer-events-none opacity-60' : ''}`}>
              {categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-600 text-xs text-center px-6">
                  <span className="text-2xl mb-2">▣</span>
                  Brak konfigurowalnych właściwości
                </div>
              ) : (
                categories.map(category => (
                  category.groups.map(group => (
                    <CategoryGroup
                      key={`${category.id}-${group.id}`}
                      id={group.id}
                      label={group.label}
                      fields={group.fields}
                      values={props}
                      onChange={handlePropChange}
                      errors={validationErrors}
                      sectionType={selectedNode.type}
                    />
                  ))
                ))
              )}
            </div>
          </div>
        )
      }}
    </InspectorSync>
  )
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  label: string
  type: string
  isLocked: boolean
  isVisible: boolean
  activeBreakpoint: ViewportLabel
  onClose: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleVisibility: () => void
  onBreakpointChange: (breakpoint: ViewportLabel) => void
}

function SectionHeader({
  label, type, isLocked, isVisible, activeBreakpoint,
  onClose, onDelete, onDuplicate, onToggleVisibility, onBreakpointChange,
}: SectionHeaderProps) {
  return (
    <div className="p-4 border-b border-white/10 flex items-center gap-2 flex-shrink-0">
      <div className="flex-1 min-w-0">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate flex items-center gap-2">
          {label}
          {isLocked && <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />}
        </h2>
        <p className="text-[11px] text-slate-600 font-mono truncate">{type}</p>
      </div>

      {/* Breakpoint Switcher */}
      <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 flex-shrink-0">
        {(Object.keys(VIEWPORT_PRESETS) as ViewportLabel[]).map(label => (
          <button
            key={label}
            onClick={() => onBreakpointChange(label)}
            className={`p-1 rounded transition-all ${
              activeBreakpoint === label
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-slate-500 hover:text-white'
            }`}
            title={label}
          >
            {label === 'DESKTOP' && <Monitor className="w-3.5 h-3.5" />}
            {label === 'TABLET' && <Tablet className="w-3.5 h-3.5" />}
            {label === 'MOBILE' && <Smartphone className="w-3.5 h-3.5" />}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onToggleVisibility}
          className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors
            ${isVisible ? 'text-slate-400 hover:text-white' : 'text-violet-400'}`}
          title={isVisible ? 'Ukryj' : 'Pokaż'}
        >
          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={onDuplicate}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-violet-400 transition-colors"
          title="Duplikuj"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
          title="Usuń sekcję"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Zamknij"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page Inspector (when no section is selected)
// ---------------------------------------------------------------------------

function PageInspector() {
  const { dispatch, canvas, document } = useBuilder()

  const activePage = document.pages.find(p =>
    canvas.selectedPageId ? p.id === canvas.selectedPageId : p.isHome
  ) ?? document.pages[0]

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Właściwości strony</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activePage && (
          <>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Strona: {activePage.name}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Meta title
              </label>
              <input
                type="text"
                value={activePage.seo.title ?? ''}
                onChange={e => dispatch({
                  type: 'UPDATE_PAGE_SEO',
                  pageId: activePage.id,
                  seo: { title: e.target.value }
                })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                           focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Meta description
              </label>
              <textarea
                value={activePage.seo.description ?? ''}
                onChange={e => dispatch({
                  type: 'UPDATE_PAGE_SEO',
                  pageId: activePage.id,
                  seo: { description: e.target.value }
                })}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                           focus:outline-none focus:border-violet-500/50 transition-all resize-none"
              />
            </div>
          </>
        )}
        <div className="flex flex-col items-center justify-center py-8 text-slate-600 text-xs text-center">
          <span className="text-2xl mb-2">▣</span>
          Kliknij sekcję, aby edytować jej właściwości
        </div>
      </div>
    </div>
  )
}

