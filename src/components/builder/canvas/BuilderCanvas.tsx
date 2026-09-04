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

import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUp, ArrowDown, Trash2, Copy, Plus,
  Layers, Package, Star, FileText, LayoutDashboard, Grid,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import { SectionNode } from '../../../../packages/builder-core/src/BuilderDocument'
import { VIEWPORT_PRESETS, DEFAULT_GRID_CONFIG } from '../../../../packages/builder-core/src/CanvasState'
import { GridSystem } from '../../../../packages/builder-core/src/GridSystem'
import { SelectionOverlay } from '../selection/SelectionOverlay'
import { useRuntimePreview } from './useRuntimePreview'
import { SectionRenderer } from '@/components/runtime/SectionRenderer'
import { CartProvider } from '@/lib/cart/CartStore'

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

// ---------------------------------------------------------------------------
// CanvasNode: Hierarchical recursive renderer for universal nodes
// ---------------------------------------------------------------------------

interface CanvasNodeProps {
  node: SectionNode
  pageId: string
  depth?: number
  selectedId: string | null
  hoveredId: string | null
  onSelectNode: (id: string, e: React.MouseEvent) => void
  onHoverNode: (id: string | null) => void
  onDoubleClickNode: (node: SectionNode, e: React.MouseEvent) => void
}

function CanvasNode({
  node,
  pageId,
  depth = 0,
  selectedId,
  hoveredId,
  onSelectNode,
  onHoverNode,
  onDoubleClickNode,
}: CanvasNodeProps) {
  const isSelected = selectedId === node.id
  const isHovered = hoveredId === node.id && !isSelected

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectNode(node.id, e)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDoubleClickNode(node, e)
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation()
    onHoverNode(node.id)
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation()
    onHoverNode(null)
  }

  if (node.type === 'heading') {
    const text = (node.props?.text as string) || (node.props?.title as string) || node.label || 'Nagłówek'
    const level = (node.props?.level as string) || 'h2'
    const color = (node.styles?.color as string) || (node.props?.color as string) || '#ffffff'
    const textAlign = (node.styles?.textAlign as any) || (node.props?.textAlign as any) || 'left'

    return (
      <div
        data-node-id={node.id}
        data-node-type={node.type}
        data-parent-id={node.parentId}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative cursor-pointer transition-all duration-150 p-2 rounded-lg ${
          !node.visible ? 'opacity-30' : ''
        } ${
          isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] z-20' :
          isHovered ? 'ring-1 ring-violet-400/60 z-10' : ''
        }`}
      >
        <div
          style={{ color, textAlign }}
          className={
            level === 'h1' ? 'text-3xl font-extrabold tracking-tight' :
            level === 'h3' ? 'text-xl font-semibold' :
            level === 'h4' ? 'text-lg font-medium' :
            'text-2xl font-bold'
          }
        >
          {text}
        </div>
      </div>
    )
  }

  if (node.type === 'text') {
    const text = (node.props?.text as string) || (node.props?.content as string) || 'Przykładowy tekst opisu lub akapitu...'
    const color = (node.styles?.color as string) || (node.props?.color as string) || '#94a3b8'
    const textAlign = (node.styles?.textAlign as any) || (node.props?.textAlign as any) || 'left'

    return (
      <div
        data-node-id={node.id}
        data-node-type={node.type}
        data-parent-id={node.parentId}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative cursor-pointer transition-all duration-150 p-2 rounded-lg ${
          !node.visible ? 'opacity-30' : ''
        } ${
          isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] z-20' :
          isHovered ? 'ring-1 ring-violet-400/60 z-10' : ''
        }`}
      >
        <p style={{ color, textAlign }} className="text-sm leading-relaxed">
          {text}
        </p>
      </div>
    )
  }

  if (node.type === 'button') {
    const text = (node.props?.text as string) || (node.props?.label as string) || 'Kliknij tutaj'
    const bg = (node.styles?.backgroundColor as string) || (node.props?.background as string) || '#7c3aed'
    const textColor = (node.styles?.color as string) || (node.props?.textColor as string) || '#ffffff'
    const variant = (node.props?.variant as string) || 'primary'

    return (
      <div
        data-node-id={node.id}
        data-node-type={node.type}
        data-parent-id={node.parentId}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative inline-block cursor-pointer transition-all duration-150 p-1 rounded-xl ${
          !node.visible ? 'opacity-30' : ''
        } ${
          isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] z-20' :
          isHovered ? 'ring-1 ring-violet-400/60 z-10' : ''
        }`}
      >
        <button
          type="button"
          style={{
            backgroundColor: variant === 'outline' ? 'transparent' : bg,
            color: textColor,
            borderColor: variant === 'outline' ? bg : 'transparent',
          }}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm shadow-md pointer-events-none transition-transform ${
            variant === 'outline' ? 'border-2' : ''
          }`}
        >
          {text}
        </button>
      </div>
    )
  }

  if (node.type === 'image') {
    const src = (node.props?.src as string) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
    const alt = (node.props?.alt as string) || node.label || 'Obraz'
    const borderRadius = (node.styles?.borderRadius as string) || (node.props?.borderRadius as string) || '12px'

    return (
      <div
        data-node-id={node.id}
        data-node-type={node.type}
        data-parent-id={node.parentId}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative cursor-pointer transition-all duration-150 p-1 rounded-xl ${
          !node.visible ? 'opacity-30' : ''
        } ${
          isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] z-20' :
          isHovered ? 'ring-1 ring-violet-400/60 z-10' : ''
        }`}
      >
        <img
          src={src}
          alt={alt}
          style={{ borderRadius }}
          className="max-w-full h-auto max-h-[300px] object-cover pointer-events-none"
        />
      </div>
    )
  }

  // Default: container or other composite node
  const display = (node.props?.display as string) || 'flex-col'
  const gap = (node.props?.gap as string) || '16'
  const bg = (node.styles?.backgroundColor as string) || (node.props?.background as string) || 'transparent'
  const padding = (node.props?.padding as string) || 'md'

  return (
    <div
      data-node-id={node.id}
      data-node-type={node.type}
      data-parent-id={node.parentId}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        backgroundColor: bg,
        padding: padding === 'none' ? 0 : padding === 'sm' ? '12px' : padding === 'lg' ? '32px' : '20px',
        gap: `${gap}px`,
      }}
      className={`relative cursor-pointer transition-all duration-150 rounded-xl border border-white/5 min-h-[50px] ${
        !node.visible ? 'opacity-30' : ''
      } ${
        display === 'flex-row' ? 'flex flex-row flex-wrap items-center' :
        display === 'grid-2' ? 'grid grid-cols-2' :
        display === 'grid-3' ? 'grid grid-cols-3' :
        display === 'grid-4' ? 'grid grid-cols-4' :
        'flex flex-col'
      } ${
        isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] z-20' :
        isHovered ? 'ring-1 ring-violet-400/60 z-10' : ''
      }`}
    >
      {node.children && node.children.length > 0 ? (
        node.children.map(child => (
          <CanvasNode
            key={child.id}
            node={child}
            pageId={pageId}
            depth={depth + 1}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelectNode={onSelectNode}
            onHoverNode={onHoverNode}
            onDoubleClickNode={onDoubleClickNode}
          />
        ))
      ) : (
        <div className="p-4 border border-dashed border-white/10 rounded-lg text-center text-xs text-slate-500 w-full">
          Pusty kontener
        </div>
      )}
    </div>
  )
}

function SectionBlock({
  node, pageId, index, total, isSelected, isHovered, onSelect, onHover,
}: SectionBlockProps) {
  const { dispatch, document, canvas } = useBuilder()

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.children && node.children.length > 0) {
      dispatch({
        type: 'CANVAS',
        action: { type: 'SELECT_SECTION', sectionId: node.children[0].id, pageId },
      })
    }
  }

  const handleSelectChildNode = (id: string, e: React.MouseEvent) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: id, pageId },
    })
  }

  const handleDoubleClickChildNode = (childNode: SectionNode, e: React.MouseEvent) => {
    if (childNode.children && childNode.children.length > 0) {
      dispatch({
        type: 'CANVAS',
        action: { type: 'SELECT_SECTION', sectionId: childNode.children[0].id, pageId },
      })
    }
  }

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

  const showOverlay = isSelected || isHovered

  return (
    <div
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className={`relative group cursor-pointer transition-all duration-150 select-none
        ${!node.visible ? 'opacity-30' : ''}
        ${isSelected
          ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] shadow-2xl z-20'
          : isHovered
            ? 'ring-1 ring-violet-400/60 ring-offset-1 ring-offset-[#08080f] z-10'
            : ''
        }
      `}
    >
      {/* Live rendered section content */}
      {node.type === 'container' ? (
        <div className="w-full p-4 bg-[#08080f] text-white min-h-[80px]">
          <div className="max-w-[1200px] mx-auto space-y-3">
            {node.children && node.children.length > 0 ? (
              node.children.map(child => (
                <CanvasNode
                  key={child.id}
                  node={child}
                  pageId={pageId}
                  depth={1}
                  selectedId={canvas.selectedSectionId}
                  hoveredId={canvas.hoveredSectionId}
                  onSelectNode={handleSelectChildNode}
                  onHoverNode={onHover}
                  onDoubleClickNode={handleDoubleClickChildNode}
                />
              ))
            ) : (
              <div className="p-6 border border-dashed border-white/15 rounded-xl text-center text-xs text-slate-400">
                Pusty kontener — dodaj elementy lub przeciągnij komponent
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="w-full relative pointer-events-none overflow-hidden bg-white text-slate-900 min-h-[60px]">
            <CartProvider>
              <SectionRenderer
                section={{
                  id: node.id,
                  type: node.type,
                  label: node.label,
                  config: node.props,
                }}
                theme={{
                  primaryColor: document.theme?.primaryColor || '#7c3aed',
                  secondaryColor: document.theme?.secondaryColor || '#ec4899',
                  font: document.theme?.font || 'Inter',
                  logo: document.theme?.logo,
                }}
                storeName={document.metadata?.storeName || 'Store'}
                products={[]}
                navigation={[]}
              />
            </CartProvider>
          </div>

          {/* Render children if section has nested nodes */}
          {node.children && node.children.length > 0 && (
            <div className="p-4 bg-[#08080f]/90 border-t border-white/10 space-y-3">
              {node.children.map(child => (
                <CanvasNode
                  key={child.id}
                  node={child}
                  pageId={pageId}
                  depth={1}
                  selectedId={canvas.selectedSectionId}
                  hoveredId={canvas.hoveredSectionId}
                  onSelectNode={handleSelectChildNode}
                  onHoverNode={onHover}
                  onDoubleClickNode={handleDoubleClickChildNode}
                />
              ))}
            </div>
          )}
        </>
      )}

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
  const { document, canvas, dispatch, ctx } = useBuilder()
  const canvasFrameRef = useRef<HTMLDivElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null)

  const previewSlug = document.metadata?.storeSlug || null
  const runtimePreviewState = useRuntimePreview(previewSlug, iframeRef)

  const externalRects = useMemo(() => {
    if (!runtimePreviewState.metrics?.sections) return null
    const map: Record<string, { x: number; y: number; width: number; height: number }> = {}
    runtimePreviewState.metrics.sections.forEach(s => {
      map[s.sectionId] = s.rect
    })
    return map
  }, [runtimePreviewState.metrics])

  const activePage = document.pages.find(p =>
    canvas.selectedPageId ? p.id === canvas.selectedPageId : p.isHome
  ) ?? document.pages[0]

  const sections = activePage?.sections ?? []
  const isDragging = canvas.dragState?.isDragging ?? false

  const handleSelectSection = useCallback((sectionId: string, pageId: string) => {
    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId, pageId },
    })
  }, [dispatch])

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

  const containerRef = useRef<HTMLDivElement>(null)
  const zoom = canvas.zoom ?? 1.0

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY < 0 ? 0.05 : -0.05
        const currentZoom = canvas.zoom ?? 1.0
        const newZoom = Math.min(2.0, Math.max(0.25, Math.round((currentZoom + delta) * 100) / 100))
        dispatch({ type: 'CANVAS', action: { type: 'SET_ZOOM', zoom: newZoom } })
      }
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', onWheel)
    }
  }, [canvas.zoom, dispatch])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept Escape if user is editing inside an input/textarea
      if (
        window.document.activeElement &&
        (window.document.activeElement.tagName === 'INPUT' ||
         window.document.activeElement.tagName === 'TEXTAREA' ||
         (window.document.activeElement as HTMLElement).isContentEditable)
      ) {
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        dispatch({ type: 'CANVAS', action: { type: 'SELECT_PARENT' } })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [dispatch])

  const viewportWidth = VIEWPORT_PRESETS[canvas.viewport.label].width

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-start overflow-auto bg-[#030305] p-8"
      onClick={handleCanvasClick}
    >
      {/* Scalable Canvas Frame Container */}
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
          width: viewportWidth,
          maxWidth: zoom <= 1 ? '100%' : undefined,
          marginBottom: zoom > 1 ? `${(zoom - 1) * 800}px` : undefined,
        }}
        className="flex justify-center flex-shrink-0"
      >
        {/* Canvas frame */}
        <motion.div
          key={canvas.viewport.label}
          ref={canvasFrameRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{ width: '100%' }}
          className="relative bg-[#08080f] rounded-2xl shadow-2xl border border-white/10 overflow-hidden min-h-[600px] w-full transition-colors"
          onClick={e => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
          }}
          onDrop={(e) => {
            e.preventDefault()
            const componentType = e.dataTransfer.getData('application/solospot-component-type') || e.dataTransfer.getData('text/plain')
            if (componentType && activePage) {
              const descriptor = ctx.registry.get(componentType)
              dispatch({
                type: 'ADD_SECTION',
                pageId: activePage.id,
                sectionType: componentType,
                defaultProps: descriptor?.defaultProps ? { ...descriptor.defaultProps } : {},
                label: descriptor?.label || componentType,
              })
            }
          }}
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

        {/* Runtime Preview Iframe in PREVIEW mode OR Structured Editable Canvas in EDIT mode */}
        {(canvas.mode === 'PREVIEW' || canvas.runtimeMode === 'PREVIEW') ? (
          <iframe
            ref={iframeRef}
            src={`/preview-frame/${previewSlug || 'vinyl'}`}
            title="Runtime Preview"
            className="w-full h-full min-h-[600px] border-0 bg-white"
          />
        ) : (
          <>
            {sections.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-12">
                <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/20
                                flex items-center justify-center mb-6">
                  <Layers className="w-10 h-10 text-violet-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Pusta strona</h3>
                <p className="text-slate-500 text-sm mb-8 max-w-xs">
                  Przeciągnij komponent z lewego panelu lub wybierz gotowy układ poniżej
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

            {sections.map((node, index) => {
              const isDragSource = isDragging && canvas.dragState?.sectionId === node.id
              return (
                <div
                  key={node.id}
                  data-section-id={node.id}
                  data-layer-id={node.id}
                  style={{ 
                    opacity: isDragSource ? 0.3 : 1,
                  }}
                  className="relative w-full"
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
          </>
        )}

        {/* Selection Overlay — renders on top of sections with external rects support */}
        <SelectionOverlay
          containerRef={canvasFrameRef as React.RefObject<HTMLDivElement | null>}
          externalRects={externalRects}
        />

        {/* Add section & Layout Presets at bottom */}
        {sections.length > 0 && (
          <div className="border-t border-white/10 bg-[#06060c] p-4 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-400">Dodaj układ:</span>
              {[
                { label: '1 Kolumna', display: 'flex-col' },
                { label: '2 Kolumny (50/50)', display: 'grid-2' },
                { label: '3 Kolumny', display: 'grid-3' },
                { label: '4 Kolumny', display: 'grid-4' },
                { label: 'Row (Poziomo)', display: 'flex-row' },
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!activePage) return
                    dispatch({
                      type: 'ADD_SECTION',
                      pageId: activePage.id,
                      sectionType: 'container',
                      defaultProps: { display: preset.display, padding: 'md', gap: '16' },
                      label: `Układ: ${preset.label}`,
                    })
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600 hover:text-white text-slate-300 border border-white/10 transition-all font-medium"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            {onAddSection && (
              <button
                onClick={e => { e.stopPropagation(); onAddSection?.() }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-white/10"
              >
                <Plus className="w-3.5 h-3.5 text-violet-400" />
                <span>Otwórz bibliotekę komponentów</span>
              </button>
            )}
          </div>
        )}
      </motion.div>
      </div>
    </div>
  )
}
