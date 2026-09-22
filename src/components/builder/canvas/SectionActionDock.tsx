'use client'

/**
 * SectionActionDock — action group anchored to the BOTTOM EDGE of one section.
 *
 * Renders "Zapisz Experience" + "Dodaj sekcję" as a single group pinned to the
 * bottom edge of the section it belongs to (hero or any other section type),
 * horizontally CENTERED within that section:
 *
 *   <section relative>
 *     ...
 *     [ Zapisz Experience ] [ + Dodaj sekcję ]   ← bottom-2, centered
 *   </section>
 *
 * It is rendered inside the section's own `relative` wrapper (not a workspace
 * portal), so the group travels with its section through canvas scroll and zoom —
 * the original anchoring, centred instead of bottom-right.
 *
 * Both actions target that same section: "Zapisz Experience" is shown for the
 * selected section, "Dodaj sekcję" inserts directly after it.
 */

import { Plus, Sparkles } from 'lucide-react'
import type { BuilderNode } from '../../../../packages/builder-core/src/BuilderDocument'

/**
 * The group is shown for the section that is selected or hovered, so it is
 * available for every section type (hero included).
 */
export function shouldShowSectionActions(
  nodeId: string,
  selectedSectionId: string | null,
  hoveredSectionId: string | null
): boolean {
  return selectedSectionId === nodeId || hoveredSectionId === nodeId
}

interface SectionActionDockProps {
  /** The section this group is anchored to */
  node: BuilderNode
  /** Index of that section within the page */
  index: number
  /** True when this is the selected section (gates "Zapisz Experience") */
  isSelected: boolean
  onSaveExperience: (node: BuilderNode) => void
  onAddSection: (insertIndex: number) => void
}

export function SectionActionDock({
  node,
  index,
  isSelected,
  onSaveExperience,
  onAddSection,
}: SectionActionDockProps) {
  return (
    <div
      data-testid="section-action-dock"
      className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 pointer-events-auto"
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
          onAddSection(index + 1)
        }}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9A86C] hover:bg-[#C99A4A] text-white text-[11px] font-bold shadow-lg shadow-[#D9A86C]/40 scale-95 hover:scale-105 whitespace-nowrap"
        title={`Dodaj sekcję po "${node.label || 'Sekcja #' + (index + 1)}"`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Dodaj sekcję</span>
      </button>
    </div>
  )
}
