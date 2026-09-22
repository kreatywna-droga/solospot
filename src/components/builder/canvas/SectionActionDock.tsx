'use client'

/**
 * SectionActionDock — workspace-level action group for the active section.
 *
 * Renders "Zapisz Experience" + "Dodaj sekcję" as a single group anchored to
 * the Builder WORKSPACE (`<main data-builder-workspace>`), not to the section
 * inside the scrolling/zooming canvas — so the actions stay fully visible:
 *
 *   - horizontally centered within the workspace,
 *   - 24px above the workspace bottom edge (clear of the bottom bar),
 *   - independent of canvas scroll, zoom, and Inspector open/closed state.
 *
 * The actions still target the selected (or, when nothing is selected, the
 * hovered) section — only the anchoring changed.
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Sparkles } from 'lucide-react'
import type { BuilderNode } from '../../../../packages/builder-core/src/BuilderDocument'

/**
 * Which section the dock acts on: the selected section wins; the hovered
 * section is used only when nothing is selected (keeps insert-on-hover
 * discoverable without hiding the selected section's actions).
 */
export function resolveDockTarget(
  selectedId: string | null,
  hoveredId: string | null,
  sectionIds: string[]
): { id: string; index: number } | null {
  const id = selectedId ?? hoveredId
  if (!id) return null
  const index = sectionIds.indexOf(id)
  return index >= 0 ? { id, index } : null
}

interface SectionActionDockProps {
  sections: BuilderNode[]
  selectedSectionId: string | null
  hoveredSectionId: string | null
  onSaveExperience: (node: BuilderNode) => void
  onAddSection: (insertIndex: number) => void
}

export function SectionActionDock({
  sections,
  selectedSectionId,
  hoveredSectionId,
  onSaveExperience,
  onAddSection,
}: SectionActionDockProps) {
  const [mountEl, setMountEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setMountEl(document.querySelector<HTMLElement>('[data-builder-workspace]'))
  }, [])

  const target = resolveDockTarget(
    selectedSectionId,
    hoveredSectionId,
    sections.map(s => s.id)
  )
  if (!target || !mountEl) return null

  const node = sections[target.index]
  const isSelected = selectedSectionId === node.id

  return createPortal(
    <div
      data-testid="section-action-dock"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 pointer-events-auto"
    >
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSaveExperience(node)
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202024] hover:bg-[#2E2E33] border border-[#D9A86C]/40 text-[#F2C27F] hover:text-white text-[11px] font-bold shadow-lg shadow-[#D9A86C]/40 transition-all scale-95 hover:scale-105 whitespace-nowrap"
          title="Zapisz tę sekcję do swoich Experience (My Experiences)"
        >
          <Sparkles className="w-3 h-3 text-[#F2C27F]" />
          <span>Zapisz Experience</span>
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onAddSection(target.index + 1)
        }}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9A86C] hover:bg-[#C99A4A] text-white text-[11px] font-bold shadow-lg shadow-[#D9A86C]/40 scale-95 hover:scale-105 whitespace-nowrap"
        title={`Dodaj sekcję po "${node.label || 'Sekcja #' + (target.index + 1)}"`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Dodaj sekcję</span>
      </button>
    </div>,
    mountEl
  )
}
