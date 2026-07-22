'use client'

/**
 * BuilderCanvas — C6.2-C
 *
 * The central preview area of the Visual Builder.
 *
 * ARCHITECTURAL PRINCIPLE (as specified in C6.2):
 *   Canvas does NOT render its own components.
 *   It renders an HTML iframe that displays what the Runtime would show.
 *
 *   EDIT MODE flow:
 *     BuilderDocument → compile() → SectionRenderers (existing preview HTML)
 *
 *   The iframe receives document updates via the PreviewChannel (MemoryChannel).
 *   In this C6.2 implementation we use a lightweight in-canvas preview
 *   (section wireframes with selection overlay) since the full iframe
 *   Runtime integration is wired in C6.2-C proper.
 *
 * What this component does:
 *   - Renders each SectionNode as a selectable "preview block"
 *   - Shows selection ring around the selected section
 *   - Shows hover overlay with section type + quick actions
 *   - Simulates viewport width (desktop/tablet/mobile)
 *   - Clicking a section → dispatch(CANVAS SELECT_SECTION)
 */

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUp, ArrowDown, Trash2, Copy, Plus,
  Layers, Package, Star, FileText, LayoutDashboard, Grid,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import { SectionNode } from '../../../../packages/builder-core/src/BuilderDocument'
import { VIEWPORT_PRESETS, DEFAULT_GRID_CONFIG } from '../../../../packages/builder-core/src/CanvasState'
import { GridSystem } from '../../../../packages/builder-core/src/GridSystem'

// ---------------------------------------------------------------------------
// Section type → icon mapping (used for wireframe preview)
// ---------------------------------------------------------------------------

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero:               <LayoutDashboard className="w-8 h-8 text-violet-400" />,
  navbar:             <LayoutDashboard className="w-8 h-8 text-slate-400" />,
  footer:             <LayoutDashboard className="w-8 h-8 text-slate-400" />,
  'product-grid':     <Package className="w-8 h-8 text-amber-400" />,
  'featured-products':<Package className="w-8 h-8 text-amber-400" />,
  'category-grid':    <Grid className="w-8 h-8 text-emerald-400" />,
  gallery:            <Grid className="w-8 h-8 text-blue-400" />,
  testimonials:       <Star className="w-8 h-8 text-yellow-400" />,
  newsletter:         <FileText className="w-8 h-8 text-pink-400" />,
  content:            <FileText className="w-8 h-8 text-slate-400" />,
  container:          <Layers className="w-8 h-8 text-violet-300" />,
}

function sectionIcon(type: string) {
  return SECTION_ICONS[type] ?? <Layers className="w-8 h-8 text-slate-500" />
}

// ---------------------------------------------------------------------------
// Section heights for wireframe preview (approximate)
// ---------------------------------------------------------------------------

const SECTION_HEIGHTS: Record<string, number> = {
  navbar: 64,
  hero: 320,
  'product-grid': 380,
  'featured-products': 300,
  'category-grid': 240,
  gallery: 280,
  testimonials: 320,
  newsletter: 180,
  footer: 200,
  content: 200,
  container: 160,
}

function sectionHeight(type: string): number {
  return SECTION_HEIGHTS[type] ?? 160
}

// ---------------------------------------------------------------------------
// Grid Overlay
// ---------------------------------------------------------------------------

const gridSystem = new GridSystem(DEFAULT_GRID_CONFIG)

function findParent(sections: SectionNode[], childId: string): string | null {
  for (const section of sections) {
    if (section.children.some(child => child.id === childId)) {
      return section.id
    }
    const found = findParent(section.children, childId)
    if (found) return found
  }
  return null
}

function GridOverlay({ width }: { width: number }) {
  const config = gridSystem.getConfig()
  if (!config.showGuides) return null

  const columnWidth = (width - config.margin * 2 - config.gutter * (config.columns - 1)) / config.columns

  const lines = []
  for (let i = 0; i < config.columns; i++) {
    const x = config.margin + i * (columnWidth + config.gutter)
    lines.push(
      <div
        key={i}
        className="absolute top-0 bottom-0 w-px bg-violet-500/10"
        style={{ left: x }}
      />
    )
    if (i < config.columns - 1) {
      const gutterX = x + columnWidth
      lines.push(
        <div
          key={`gutter-${i}`}
          className="absolute top-0 bottom-0 w-px bg-violet-500/5"
          style={{ left: gutterX }}
        />
      )
    }
  }

  return <>{lines}</>
}

// ---------------------------------------------------------------------------
// Section wireframe block
// ---------------------------------------------------------------------------

interface SectionBlockProps {
  node: SectionNode
  pageId: string
  index: number
  total: number
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (id: string | null) => void
}

const RESIZE_HANDLES = [
  { id: 'nw', cursor: 'nwse-resize', className: '-top-1.5 -left-1.5' },
  { id: 'n',  cursor: 'ns-resize',   className: '-top-1.5 left-1/2 -translate-x-1/2' },
  { id: 'ne', cursor: 'nesw-resize', className: '-top-1.5 -right-1.5' },
  { id: 'e',  cursor: 'ew-resize',   className: '-right-1.5 top-1/2 -translate-y-1/2' },
  { id: 'se', cursor: 'nwse-resize', className: '-bottom-1.5 -right-1.5' },
  { id: 's',  cursor: 'ns-resize',   className: '-bottom-1.5 left-1/2 -translate-x-1/2' },
  { id: 'sw', cursor: 'nesw-resize', className: '-bottom-1.5 -left-1.5' },
  { id: 'w',  cursor: 'ew-resize',   className: '-left-1.5 top-1/2 -translate-y-1/2' },
]

function SectionBlock({
  node, pageId, index, total, isSelected, isHovered, onSelect, onHover,
}: SectionBlockProps) {
  const { dispatch } = useBuilder()

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (index === 0) return
    dispatch({ type: 'MOVE_SECTION', pageId, fromIndex: index, toIndex: index - 1 })
  }

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (index === total - 1) return
    dispatch({ type: 'MOVE_SECTION', pageId, fromIndex: index, toIndex: index + 1 })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'REMOVE_SECTION', pageId, sectionId: node.id })
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'DUPLICATE_SECTION', pageId, sectionId: node.id })
  }

  const height = sectionHeight(node.type)
  const showOverlay = isSelected || isHovered

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ minHeight: height }}
      className={`relative group cursor-pointer transition-all duration-150 select-none
        ${!node.visible ? 'opacity-30' : ''}
        ${isSelected
          ? 'ring-2 ring-violet-500 ring-inset'
          : isHovered
            ? 'ring-1 ring-violet-500/40 ring-inset'
            : ''
        }
      `}
    >
      {/* Wireframe content */}
      <div className={`w-full h-full flex flex-col items-center justify-center gap-3 px-8 py-6
        bg-white/[0.02] border-b border-white/5`}
        style={{ minHeight: height }}
      >
        <div className={`p-3 rounded-2xl ${isSelected ? 'bg-violet-500/20' : 'bg-white/5'} transition-colors`}>
          {sectionIcon(node.type)}
        </div>
        <div className="text-center">
          <div className="font-semibold text-white text-sm">{node.label}</div>
          <div className="text-[11px] text-slate-600 font-mono mt-0.5">{node.type}</div>
          {node.locked && (
            <div className="text-[11px] text-amber-400 mt-1 flex items-center justify-center gap-1">
              🔒 zablokowana
            </div>
          )}
          {!node.visible && (
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1">
              👁 ukryta
            </div>
          )}
        </div>

        {/* Children indicator for containers */}
        {node.children.length > 0 && (
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {node.children.length} komponent{node.children.length > 1 ? 'y' : ''}
          </div>
        )}
      </div>

      {/* Hover / selected toolbar */}
      {showOverlay && (
        <div className="absolute top-2 left-0 right-0 flex items-center justify-between px-3 z-10 pointer-events-none">
          {/* Section label chip */}
          <div className="flex items-center gap-1 bg-violet-600 text-white text-[11px] font-bold
                          px-2.5 py-1 rounded-full pointer-events-auto shadow-lg">
            {node.label}
            <span className="ml-1 text-violet-200 font-normal">#{index + 1}</span>
          </div>

          {/* Action toolbar */}
          <div className="flex items-center gap-1 bg-[#080a14]/90 backdrop-blur rounded-xl p-1
                          border border-white/10 shadow-xl pointer-events-auto">
            <button
              onClick={handleMoveUp}
              disabled={index === 0}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Przesuń w górę"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMoveDown}
              disabled={index === total - 1}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Przesuń w dół"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <button
              onClick={handleDuplicate}
              className="p-1.5 rounded-lg hover:bg-violet-500/20 text-slate-400 hover:text-violet-300 transition-all"
              title="Duplikuj"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
              title="Usuń"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Parent breadcrumb */}
      {isSelected && node.children.length > 0 && (
        <div className="absolute -bottom-6 left-0 right-0 flex items-center gap-1 text-[10px] text-slate-500">
          <Layers className="w-3 h-3" />
          <span>Container</span>
          <span className="text-slate-600">•</span>
          <span>{node.children.length} dzieci</span>
        </div>
      )}
      
      {/* Resize Handles */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          {RESIZE_HANDLES.map(handle => (
            <div
              key={handle.id}
              className={`absolute w-3 h-3 bg-violet-500 border-2 border-white rounded-full pointer-events-auto cursor-${handle.cursor}`}
              style={{
                top: handle.className.includes('-top') ? '-6px' : handle.className.includes('-bottom') ? 'auto' : '50%',
                bottom: handle.className.includes('-bottom') ? '-6px' : handle.className.includes('-top') ? 'auto' : '50%',
                left: handle.className.includes('-left') ? '-6px' : handle.className.includes('-right') ? 'auto' : '50%',
                right: handle.className.includes('-right') ? '-6px' : handle.className.includes('-left') ? 'auto' : '50%',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// BuilderCanvas root
// ---------------------------------------------------------------------------

interface BuilderCanvasProps {
  onAddSection?: () => void
}

export function BuilderCanvas({ onAddSection }: BuilderCanvasProps) {
  const { document, canvas, dispatch } = useBuilder()
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null)

  const activePage = document.pages.find(p =>
    canvas.selectedPageId ? p.id === canvas.selectedPageId : p.isHome
  ) ?? document.pages[0]

  const sections = activePage?.sections ?? []
  const isDragging = canvas.dragState?.isDragging ?? false

  const handleSelectSection = useCallback((sectionId: string, pageId: string) => {
    const parentId = findParent(sections, sectionId)
    const targetId = parentId || sectionId
    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: targetId, pageId },
    })
  }, [dispatch, sections])

  const handleParentSelect = useCallback((sectionId: string, pageId: string) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: null, pageId },
    })
  }, [dispatch])

  const handleHoverSection = useCallback((sectionId: string | null) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'HOVER_SECTION', sectionId },
    })
  }, [dispatch])

  const handleCanvasClick = useCallback(() => {
    if (canvas.selectedSectionId) {
      dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: null } })
    }
  }, [dispatch, canvas.selectedSectionId])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    setMarquee({
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
    })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!marquee) return
    const rect = e.currentTarget.getBoundingClientRect()
    setMarquee({
      ...marquee,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
    })
  }, [marquee])

  const handleMouseUp = useCallback(() => {
    if (marquee) {
      setMarquee(null)
    }
  }, [marquee])

  const viewportWidth = VIEWPORT_PRESETS[canvas.viewport.label].width

  return (
    <div
      className="flex-1 flex flex-col items-center justify-start overflow-auto bg-[#030305] p-8"
      onClick={handleCanvasClick}
    >
      {/* Canvas frame */}
      <motion.div
        key={canvas.viewport.label}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{ width: viewportWidth, maxWidth: '100%' }}
        className="relative bg-[#08080f] rounded-2xl shadow-2xl border border-white/10 overflow-hidden min-h-[600px]"
        onClick={e => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Grid Overlay */}
        <GridOverlay width={viewportWidth} />

        {/* Drop Indicators */}
        {isDragging && sections.map((node, index) => (
          <div
            key={`drop-${node.id}`}
            className="absolute left-0 right-0 h-0.5 bg-violet-500/50 z-20 pointer-events-none"
            style={{
              top: 0,
              transform: `translateY(${index === 0 ? 0 : '100%'})`,
            }}
          />
        ))}

        {/* Alignment Guides */}
        {isDragging && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <div
              className="absolute left-0 right-0 h-px bg-violet-400/40"
              style={{ top: '0' }}
            />
            <div
              className="absolute top-0 bottom-0 w-px bg-violet-400/40"
              style={{ left: '0' }}
            />
          </div>
        )}

        {/* Locked/Hidden element guides */}
        {canvas.selection.lockedIds.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {sections.map(node => {
              if (!canvas.selection.lockedIds.includes(node.id)) return null
              return (
                <div
                  key={`guide-${node.id}`}
                  className="absolute left-0 right-0 h-0.5 bg-amber-500/30"
                  style={{ top: '0' }}
                />
              )
            })}
          </div>
        )}

        {/* Marquee Selection */}
        {marquee && (
          <div
            className="absolute bg-violet-500/10 border border-violet-500/30 pointer-events-none z-30"
            style={{
              left: Math.min(marquee.startX, marquee.currentX),
              top: Math.min(marquee.startY, marquee.currentY),
              width: Math.abs(marquee.currentX - marquee.startX),
              height: Math.abs(marquee.currentY - marquee.startY),
            }}
          />
        )}
        {sections.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-12">
            <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/20
                            flex items-center justify-center mb-6">
              <Layers className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pusta strona</h3>
            <p className="text-slate-500 text-sm mb-8 max-w-xs">
              Dodaj pierwszą sekcję z panelu komponentów po lewej stronie
            </p>
            {onAddSection && (
              <button
                onClick={onAddSection}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                           bg-gradient-to-r from-violet-600 to-fuchsia-600
                           text-white font-bold text-sm hover:shadow-lg hover:shadow-violet-500/30
                           transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Dodaj sekcję
              </button>
            )}
          </div>
        )}

        {/* Sections */}
        {sections.map((node, index) => {
          const isDragSource = isDragging && canvas.dragState?.sectionId === node.id
          return (
            <div
              key={node.id}
              style={{ 
                minHeight: sectionHeight(node.type),
                opacity: isDragSource ? 0.3 : 1,
              }}
              className={`relative group cursor-pointer transition-all duration-150 select-none
                ${!node.visible ? 'opacity-30' : ''}
                ${canvas.selectedSectionId === node.id
                  ? 'ring-2 ring-violet-500 ring-inset'
                  : canvas.hoveredSectionId === node.id && canvas.selectedSectionId !== node.id
                    ? 'ring-1 ring-violet-500/40 ring-inset'
                    : ''
                }
              `}
            >
              <SectionBlock
                node={node}
                pageId={activePage!.id}
                index={index}
                total={sections.length}
                isSelected={canvas.selectedSectionId === node.id}
                isHovered={canvas.hoveredSectionId === node.id && canvas.selectedSectionId !== node.id}
                onSelect={() => handleSelectSection(node.id, activePage!.id)}
                onHover={handleHoverSection}
              />
            </div>
          )
        })}

        {/* Add section button at bottom */}
        {sections.length > 0 && onAddSection && (
          <button
            onClick={e => { e.stopPropagation(); onAddSection?.() }}
            className="w-full py-4 flex items-center justify-center gap-2 text-slate-600
                       hover:text-violet-400 hover:bg-violet-500/5 transition-all border-t border-white/5"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Dodaj sekcję</span>
          </button>
        )}
      </motion.div>
    </div>
  )
}
