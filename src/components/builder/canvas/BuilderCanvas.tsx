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
import { findNode } from '../../../../packages/builder-core/src'
import { VIEWPORT_PRESETS, DEFAULT_GRID_CONFIG, ViewportLabel } from '../../../../packages/builder-core/src/CanvasState'
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

// Module-scoped dragged node id — dataTransfer.getData() is protected
// during dragover, so this is the only reliable cross-node channel.
let currentlyDraggedNodeId: string | null = null

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

// ---------------------------------------------------------------------------
// Responsive style & prop resolvers
// ---------------------------------------------------------------------------

function resolveEffectiveStyles(node: SectionNode, viewport: ViewportLabel): Record<string, any> {
  const base = (node.styles || {}) as Record<string, any>
  if (viewport === 'DESKTOP') return base
  const tablet = (node.responsive?.tablet || {}) as Record<string, any>
  if (viewport === 'TABLET') return { ...base, ...tablet }
  const mobile = (node.responsive?.mobile || {}) as Record<string, any>
  return { ...base, ...tablet, ...mobile }
}

function resolveEffectiveProps(node: SectionNode, viewport: ViewportLabel): Record<string, any> {
  const base = (node.props || {}) as Record<string, any>
  if (!node.responsiveProps) return base
  const resolved = { ...base }
  for (const [propName, breakpointValues] of Object.entries(node.responsiveProps)) {
    if (viewport === 'TABLET') {
      if (breakpointValues.tablet !== undefined || breakpointValues.TABLET !== undefined) {
        resolved[propName] = breakpointValues.tablet ?? breakpointValues.TABLET
      }
    } else if (viewport === 'MOBILE') {
      if (breakpointValues.tablet !== undefined || breakpointValues.TABLET !== undefined) {
        resolved[propName] = breakpointValues.tablet ?? breakpointValues.TABLET
      }
      if (breakpointValues.mobile !== undefined || breakpointValues.MOBILE !== undefined) {
        resolved[propName] = breakpointValues.mobile ?? breakpointValues.MOBILE
      }
    }
  }
  return resolved
}

// ---------------------------------------------------------------------------
// CanvasNode: Hierarchical recursive renderer for universal nodes
// ---------------------------------------------------------------------------

interface CanvasNodeProps {
  node: SectionNode
  pageId: string
  depth?: number
  selectedId: string | null
  hoveredId: string | null
  viewport: ViewportLabel
  onSelectNode: (id: string, e: React.MouseEvent) => void
  onHoverNode: (id: string | null) => void
  onDoubleClickNode: (node: SectionNode, e: React.MouseEvent) => void
}

// ---------------------------------------------------------------------------
// Inline text editing (contentEditable) — commits to BuilderDocument on blur.
// The document remains the single source of truth; no fake overlay state.
// ---------------------------------------------------------------------------

function useInlineTextCommit(
  nodeId: string,
  pageId: string,
  propName: string,
) {
  const { dispatch } = useBuilder()
  const commit = useCallback((element: HTMLElement, currentValue: unknown) => {
    const next = element.innerText.replace(/\u00A0/g, ' ').trim()
    if (next !== String(currentValue ?? '')) {
      dispatch({
        type: 'UPDATE_PROPS',
        pageId,
        sectionId: nodeId,
        props: { [propName]: next },
      })
    }
  }, [dispatch, pageId, nodeId, propName])
  return commit
}

function InlineEditableText({
  nodeId,
  pageId,
  propName,
  value,
  className,
  style,
  as = 'div',
}: {
  nodeId: string
  pageId: string
  propName: string
  value: string
  className?: string
  style?: React.CSSProperties
  as?: 'div' | 'p' | 'span'
}) {
  const commit = useInlineTextCommit(nodeId, pageId, propName)
  const ref = useRef<HTMLElement | null>(null)

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const el = ref.current
    if (!el) return
    el.contentEditable = 'true'
    el.focus()
    // Select all text for quick replace
    const selection = window.getSelection()
    if (selection) {
      const range = document.createRange()
      range.selectNodeContents(el)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  const handleBlur = () => {
    const el = ref.current
    if (!el) return
    el.contentEditable = 'false'
    commit(el as HTMLElement, value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ;(e.target as HTMLElement).blur()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      // Revert to document value
      if (ref.current) ref.current.innerText = value
      ;(e.target as HTMLElement).blur()
    }
  }

  const Tag = as as any
  return (
    <Tag
      ref={ref as any}
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseEnter={(e: React.MouseEvent) => e.stopPropagation()}
      onMouseLeave={(e: React.MouseEvent) => e.stopPropagation()}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      suppressContentEditableWarning
      data-inline-edit="text"
      className={`${className ?? ''} [&_:focus]:outline-none [&_:focus]:ring-1 [&_:focus]:ring-violet-500/60 rounded-sm cursor-text`}
      style={style}
    >
      {value}
    </Tag>
  )
}

function CanvasNode({
  node,
  pageId,
  depth = 0,
  selectedId,
  hoveredId,
  viewport,
  onSelectNode,
  onHoverNode,
  onDoubleClickNode,
}: CanvasNodeProps) {
  const { dispatch, ctx } = useBuilder()
  const [isDropTarget, setIsDropTarget] = useState(false)
  const isSelected = selectedId === node.id
  const isHovered = hoveredId === node.id && !isSelected

  const styles = resolveEffectiveStyles(node, viewport)
  const props = resolveEffectiveProps(node, viewport)

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

  const handleDragStart = (e: React.DragEvent) => {
    if (node.locked) {
      e.preventDefault()
      return
    }
    e.stopPropagation()
    currentlyDraggedNodeId = node.id
    e.dataTransfer.setData('application/solospot-node-id', node.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    currentlyDraggedNodeId = null
  }

  if (node.type === 'heading') {
    const text = (props.text as string) || (props.title as string) || node.label || 'Nagłówek'
    const level = (props.level as string) || 'h2'
    const color = (styles.color as string) || (props.color as string) || '#ffffff'
    const textAlign = (styles.textAlign as any) || (props.textAlign as any) || 'left'
    const fontSize = styles.fontSize || (level === 'h1' ? '2rem' : level === 'h3' ? '1.25rem' : level === 'h4' ? '1.125rem' : '1.5rem')
    const fontWeight = styles.fontWeight || (level === 'h1' ? '800' : level === 'h3' ? '600' : '700')
    const lineHeight = styles.lineHeight
    const letterSpacing = styles.letterSpacing
    const fontFamily = styles.fontFamily || (props.fontFamily as string)

    return (
      <div
        data-node-id={node.id}
        data-node-type={node.type}
        data-parent-id={node.parentId}
        draggable={!node.locked}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: styles.width,
          height: styles.height,
          margin: styles.margin,
          padding: styles.padding ?? '8px',
          backgroundColor: styles.backgroundColor,
          borderRadius: styles.borderRadius,
        }}
        className={`relative cursor-pointer transition-all duration-150 rounded-lg ${
          !node.visible ? 'opacity-30' : ''
        } ${
          isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] z-20' :
          isHovered ? 'ring-1 ring-violet-400/60 z-10' : ''
        }`}
      >
        <InlineEditableText
          nodeId={node.id}
          pageId={pageId}
          propName="text"
          value={text}
          style={{
            color,
            textAlign: textAlign as any,
            fontSize,
            fontWeight,
            lineHeight,
            letterSpacing,
            fontFamily,
          }}
        />
      </div>
    )
  }

  if (node.type === 'text') {
    const text = (props.text as string) || (props.content as string) || 'Przykładowy tekst opisu lub akapitu...'
    const color = (styles.color as string) || (props.color as string) || '#94a3b8'
    const textAlign = (styles.textAlign as any) || (props.textAlign as any) || 'left'
    const fontSize = styles.fontSize || '0.875rem'
    const fontWeight = styles.fontWeight || '400'
    const lineHeight = styles.lineHeight || '1.6'
    const letterSpacing = styles.letterSpacing
    const fontFamily = styles.fontFamily || (props.fontFamily as string)

    return (
      <div
        data-node-id={node.id}
        data-node-type={node.type}
        data-parent-id={node.parentId}
        draggable={!node.locked}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: styles.width,
          height: styles.height,
          margin: styles.margin,
          padding: styles.padding ?? '8px',
          backgroundColor: styles.backgroundColor,
          borderRadius: styles.borderRadius,
        }}
        className={`relative cursor-pointer transition-all duration-150 rounded-lg ${
          !node.visible ? 'opacity-30' : ''
        } ${
          isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] z-20' :
          isHovered ? 'ring-1 ring-violet-400/60 z-10' : ''
        }`}
      >
        <InlineEditableText
          nodeId={node.id}
          pageId={pageId}
          propName="text"
          value={text}
          as="p"
          style={{
            color,
            textAlign: textAlign as any,
            fontSize,
            fontWeight,
            lineHeight,
            letterSpacing,
            fontFamily,
          }}
        />
      </div>
    )
  }

  if (node.type === 'button') {
    const text = (props.text as string) || (props.label as string) || 'Kliknij tutaj'
    const bg = (styles.backgroundColor as string) || (props.background as string) || '#7c3aed'
    const textColor = (styles.color as string) || (props.textColor as string) || '#ffffff'
    const variant = (props.variant as string) || 'primary'
    const borderRadius = (styles.borderRadius as string) || (props.borderRadius as string) || '12px'
    const borderWidth = styles.borderWidth || (variant === 'outline' ? '2px' : '1px')
    const borderColor = styles.borderColor || (variant === 'outline' ? bg : 'transparent')

    return (
      <div
        data-node-id={node.id}
        data-node-type={node.type}
        data-parent-id={node.parentId}
        draggable={!node.locked}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: styles.width,
          margin: styles.margin,
        }}
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
            borderRadius,
            borderWidth,
            borderColor,
            fontSize: styles.fontSize || '0.875rem',
            fontWeight: styles.fontWeight || '500',
            fontFamily: styles.fontFamily || (props.fontFamily as string),
            padding: styles.padding || '10px 20px',
            width: styles.width ? '100%' : undefined,
            height: styles.height,
          }}
          className="font-medium shadow-md pointer-events-none transition-transform"
        >
          <span
            onDoubleClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              const el = e.currentTarget as HTMLElement
              el.contentEditable = 'true'
              el.focus()
              const selection = window.getSelection()
              if (selection) {
                const range = document.createRange()
                range.selectNodeContents(el)
                selection.removeAllRanges()
                selection.addRange(range)
              }
            }}
            onBlur={(e: React.FocusEvent<HTMLElement>) => {
              const el = e.currentTarget as HTMLElement
              el.contentEditable = 'false'
              const next = el.innerText.replace(/\u00A0/g, ' ').trim()
              if (next && next !== text) {
                dispatch({
                  type: 'UPDATE_PROPS',
                  pageId,
                  sectionId: node.id,
                  props: { text: next },
                })
              }
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                e.preventDefault()
                ;(e.target as HTMLElement).blur()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                ;(e.target as HTMLElement).innerText = text
                ;(e.target as HTMLElement).blur()
              }
            }}
            suppressContentEditableWarning
            data-inline-edit="text"
            style={{ pointerEvents: 'auto', cursor: 'text', outline: 'none' }}
          >
            {text}
          </span>
        </button>
      </div>
    )
  }

  if (node.type === 'image') {
    const src = (props.src as string) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
    const alt = (props.alt as string) || node.label || 'Obraz'
    const borderRadius = (styles.borderRadius as string) || (props.borderRadius as string) || '12px'

    return (
      <div
        data-node-id={node.id}
        data-node-type={node.type}
        data-parent-id={node.parentId}
        draggable={!node.locked}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: styles.width,
          height: styles.height,
          margin: styles.margin,
        }}
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
          style={{
            borderRadius,
            borderWidth: styles.borderWidth,
            borderColor: styles.borderColor,
            width: styles.width || '100%',
            height: styles.height || 'auto',
            maxHeight: styles.height ? undefined : '350px',
            objectFit: (styles.objectFit as any) || 'cover',
          }}
          className="max-w-full pointer-events-none select-none"
        />
      </div>
    )
  }

  // Default: container or other composite node
  const display = (props.display as string) || 'flex-col'
  const gap = styles.gap !== undefined ? (typeof styles.gap === 'number' ? `${styles.gap}px` : styles.gap) : `${props.gap || '16'}px`
  const bg = (styles.backgroundColor as string) || (props.background as string) || 'transparent'
  const padding = styles.padding || (props.padding === 'none' ? 0 : props.padding === 'sm' ? '12px' : props.padding === 'lg' ? '32px' : '20px')

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setIsDropTarget(true)
  }

  const handleContainerDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setIsDropTarget(false)
  }

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropTarget(false)

    const draggedNodeId = e.dataTransfer.getData('application/solospot-node-id')
    const compType = e.dataTransfer.getData('application/solospot-component-type') || e.dataTransfer.getData('text/plain')

    if (draggedNodeId && draggedNodeId !== node.id) {
      dispatch({
        type: 'MOVE_NODE',
        pageId,
        nodeId: draggedNodeId,
        targetParentId: node.id,
        targetIndex: node.children?.length ?? 0,
      })
      dispatch({
        type: 'CANVAS',
        action: { type: 'SELECT_SECTION', sectionId: draggedNodeId, pageId },
      })
    } else if (compType) {
      const descriptor = ctx.registry.get(compType)
      const newNodeId = `node_${compType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const newNode: SectionNode = {
        id: newNodeId,
        type: compType,
        label: descriptor?.label || compType,
        parentId: node.id,
        order: node.children?.length ?? 0,
        visible: true,
        locked: false,
        props: descriptor?.defaultProps ? { ...descriptor.defaultProps } : {},
        styles: (descriptor?.defaultStyles as any) || {},
        children: [],
      }
      dispatch({
        type: 'INSERT_NODE',
        pageId,
        parentId: node.id,
        node: newNode,
      })
      dispatch({
        type: 'CANVAS',
        action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId },
      })
    }
  }

  return (
    <div
      data-node-id={node.id}
      data-node-type={node.type}
      data-parent-id={node.parentId}
      draggable={!node.locked}
      onDragStart={handleDragStart}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
      style={{
        backgroundColor: bg,
        padding: typeof styles.padding === 'object'
          ? `${(styles.padding as any).top || 0} ${(styles.padding as any).right || 0} ${(styles.padding as any).bottom || 0} ${(styles.padding as any).left || 0}`
          : (styles.padding as string) || padding,
        margin: typeof styles.margin === 'object'
          ? `${(styles.margin as any).top || 0} ${(styles.margin as any).right || 0} ${(styles.margin as any).bottom || 0} ${(styles.margin as any).left || 0}`
          : (styles.margin as string),
        gap,
        width: styles.width,
        height: styles.height,
        minHeight: styles.minHeight || '50px',
        maxWidth: styles.maxWidth,
        alignItems: styles.alignItems || (props.alignItems as string),
        justifyContent: styles.justifyContent || (props.justifyContent as string),
        flexDirection: styles.flexDirection,
        flexWrap: (styles as any).flexWrap,
        gridTemplateColumns: styles.gridTemplateColumns,
        gridTemplateRows: styles.gridTemplateRows,
        borderRadius: styles.borderRadius || '12px',
        border: styles.borderWidth
          ? `${styles.borderWidth} ${styles.borderStyle || 'solid'} ${styles.borderColor || 'rgba(255,255,255,0.1)'}`
          : '1px solid rgba(255,255,255,0.05)',
        boxShadow: styles.boxShadow,
        opacity: styles.opacity,
        position: styles.position as any,
        zIndex: styles.zIndex,
        display: styles.display || (
          display === 'flex-row' ? 'flex' :
          display === 'grid-2' || display === 'grid-3' || display === 'grid-4' ? 'grid' :
          'flex'
        ),
      }}
      className={`relative cursor-pointer transition-all duration-150 ${
        !node.visible ? 'opacity-30' : ''
      } ${
        isDropTarget ? 'ring-2 ring-violet-400 bg-violet-500/10' : ''
      } ${
        // Legacy layout class fallback when no styles.display
        !styles.display ? (
          display === 'flex-row' ? 'flex-row flex-wrap items-center' :
          display === 'grid-2' ? 'grid-cols-2' :
          display === 'grid-3' ? 'grid-cols-3' :
          display === 'grid-4' ? 'grid-cols-4' :
          'flex-col'
        ) : ''
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
            viewport={viewport}
            onSelectNode={onSelectNode}
            onHoverNode={onHoverNode}
            onDoubleClickNode={onDoubleClickNode}
          />
        ))
      ) : (
        <div className="p-4 border border-dashed border-white/10 rounded-lg text-center text-xs text-slate-500 w-full select-none">
          Pusty kontener — upuść tutaj komponent
        </div>
      )}
    </div>
  )
}

function SectionBlock({
  node, pageId, index, total, isSelected, isHovered, onSelect, onHover,
}: SectionBlockProps) {
  const { dispatch, document, canvas, ctx } = useBuilder()
  const [isSectionDropTarget, setIsSectionDropTarget] = useState(false)
  // Resolved styles (base + responsive overrides for active viewport) —
  // applied to the section wrapper so Design Inspector changes are visible.
  const resolvedStyles = resolveEffectiveStyles(node, canvas.viewport.label)

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

  // -------------------------------------------------------------------------
  // Root-level drag reorder (HTML5 DnD → MOVE_SECTION / MOVE_NODE)
  // NOTE: dataTransfer.getData() is protected during dragover/dragstart,
  // so the dragged node id is tracked in module-scoped state.
  // -------------------------------------------------------------------------
  const [dropEdge, setDropEdge] = useState<'before' | 'after' | null>(null)

  const handleRootDragStart = (e: React.DragEvent) => {
    if (node.locked) {
      e.preventDefault()
      return
    }
    currentlyDraggedNodeId = node.id
    e.dataTransfer.setData('application/solospot-node-id', node.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleRootDragEnd = () => {
    currentlyDraggedNodeId = null
    setDropEdge(null)
  }

  const handleRootDragOver = (e: React.DragEvent) => {
    if (!currentlyDraggedNodeId || currentlyDraggedNodeId === node.id) return

    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    setDropEdge(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after')
  }

  const handleRootDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setDropEdge(null)
  }

  const handleRootDrop = (e: React.DragEvent) => {
    const draggedId = currentlyDraggedNodeId
    const edge = dropEdge
    setDropEdge(null)
    currentlyDraggedNodeId = null
    if (!draggedId || draggedId === node.id || !edge) return

    e.preventDefault()
    e.stopPropagation()

    const found = findNode(document, draggedId)
    if (!found) return

    const draggedIsRootSibling = !found.parent && found.page.id === pageId
    let target: number
    if (draggedIsRootSibling) {
      const draggedIdx = found.page.sections.findIndex(s => s.id === draggedId)
      if (draggedIdx < 0) return
      // Index on the list WITHOUT the dragged item (MOVE_SECTION removes first)
      if (edge === 'before') {
        target = draggedIdx < index ? index - 1 : index
      } else {
        target = draggedIdx < index ? index : index + 1
      }
      if (target === draggedIdx) return
      dispatch({ type: 'MOVE_SECTION', pageId, fromIndex: draggedIdx, toIndex: target })
    } else {
      // Nested node dragged onto a root section edge → hoist to root level
      // (moveNode removes first, then inserts at targetIndex)
      target = edge === 'before' ? index : index + 1
      dispatch({
        type: 'MOVE_NODE',
        pageId,
        nodeId: draggedId,
        targetParentId: null,
        targetIndex: target,
      })
    }
  }

  const showOverlay = isSelected || isHovered

  return (
    <div
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      draggable={!node.locked}
      onDragStart={handleRootDragStart}
      onDragEnd={handleRootDragEnd}
      onDragOver={handleRootDragOver}
      onDragLeave={handleRootDragLeave}
      onDrop={handleRootDrop}
      className={`relative group cursor-pointer transition-all duration-150 select-none
        ${!node.visible ? 'opacity-30' : ''}
        ${dropEdge ? 'ring-1 ring-violet-400/50' : ''}
        ${isSelected
          ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] shadow-2xl z-20'
          : isHovered
            ? 'ring-1 ring-violet-400/60 ring-offset-1 ring-offset-[#08080f] z-10'
            : ''
        }
      `}
    >
      {/* Root reorder drop indicator */}
      {dropEdge && (
        <div
          className={`absolute left-0 right-0 h-0.5 bg-violet-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(139,92,246,0.9)] ${
            dropEdge === 'before' ? '-top-0.5' : '-bottom-0.5'
          }`}
        />
      )}

      {/* Live rendered section content */}
      {node.type === 'container' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.dataTransfer.dropEffect = 'copy'
            setIsSectionDropTarget(true)
          }}
          onDragLeave={(e) => {
            e.stopPropagation()
            setIsSectionDropTarget(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsSectionDropTarget(false)
            const draggedNodeId = e.dataTransfer.getData('application/solospot-node-id')
            const compType = e.dataTransfer.getData('application/solospot-component-type') || e.dataTransfer.getData('text/plain')
            if (draggedNodeId && draggedNodeId !== node.id) {
              dispatch({
                type: 'MOVE_NODE',
                pageId,
                nodeId: draggedNodeId,
                targetParentId: node.id,
                targetIndex: node.children?.length ?? 0,
              })
              dispatch({
                type: 'CANVAS',
                action: { type: 'SELECT_SECTION', sectionId: draggedNodeId, pageId },
              })
            } else if (compType) {
              const descriptor = ctx.registry.get(compType)
              const newNodeId = `node_${compType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
              const newNode: SectionNode = {
                id: newNodeId,
                type: compType,
                label: descriptor?.label || compType,
                parentId: node.id,
                order: node.children?.length ?? 0,
                visible: true,
                locked: false,
                props: descriptor?.defaultProps ? { ...descriptor.defaultProps } : {},
                styles: (descriptor?.defaultStyles as any) || {},
                children: [],
              }
              dispatch({
                type: 'INSERT_NODE',
                pageId,
                parentId: node.id,
                node: newNode,
              })
              dispatch({
                type: 'CANVAS',
                action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId },
              })
            }
          }}
          className={`w-full text-white min-h-[80px] transition-all ${
            isSectionDropTarget ? 'ring-2 ring-violet-400 bg-violet-950/20' : ''
          }`}
          style={{
            backgroundColor: resolvedStyles.backgroundColor || '#08080f',
            padding: typeof resolvedStyles.padding === 'object' && resolvedStyles.padding
              ? `${(resolvedStyles.padding as any).top ?? '0px'} ${(resolvedStyles.padding as any).right ?? '0px'} ${(resolvedStyles.padding as any).bottom ?? '0px'} ${(resolvedStyles.padding as any).left ?? '0px'}`
              : (resolvedStyles.padding as string | undefined) ?? '16px',
            borderRadius: resolvedStyles.borderRadius,
            opacity: resolvedStyles.opacity,
            boxShadow: resolvedStyles.boxShadow,
          }}
        >
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
                  viewport={canvas.viewport.label}
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
          <div
            className="w-full relative pointer-events-none overflow-hidden text-slate-900 min-h-[60px]"
            style={{
              backgroundColor: resolvedStyles.backgroundColor || '#ffffff',
              opacity: resolvedStyles.opacity,
              padding: typeof resolvedStyles.padding === 'object' && resolvedStyles.padding
                ? `${(resolvedStyles.padding as any).top ?? 0} ${(resolvedStyles.padding as any).right ?? 0} ${(resolvedStyles.padding as any).bottom ?? 0} ${(resolvedStyles.padding as any).left ?? 0}`
                : (resolvedStyles.padding as string | undefined),
              borderRadius: resolvedStyles.borderRadius,
              border: resolvedStyles.borderWidth
                ? `${resolvedStyles.borderWidth} ${resolvedStyles.borderStyle || 'solid'} ${resolvedStyles.borderColor || 'rgba(0,0,0,0.1)'}`
                : undefined,
              boxShadow: resolvedStyles.boxShadow,
              width: resolvedStyles.width,
              minHeight: resolvedStyles.minHeight,
            }}
          >
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
                  viewport={canvas.viewport.label}
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
      {/* NOTE: Resize interaction is owned exclusively by SelectionOverlay
          (ResizeHandles → SET_NODE_STYLES). No duplicate handles here. */}
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

  const containerRef = useRef<HTMLDivElement>(null)
  const zoom = canvas.zoom ?? 1.0

  // ---------------------------------------------------------------------------
  // Marquee box-select (real): starts only on empty canvas background,
  // dispatches BOX_SELECT with section positions on pointer up.
  // ---------------------------------------------------------------------------
  const [marquee, setMarquee] = useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  const marqueeRef = useRef<typeof marquee>(null)
  marqueeRef.current = marquee

  const collectSectionPositions = useCallback((): Map<string, { x: number; y: number; width: number; height: number }> => {
    const frame = canvasFrameRef.current
    const positions = new Map<string, { x: number; y: number; width: number; height: number }>()
    if (!frame) return positions
    const frameRect = frame.getBoundingClientRect()
    // Query both root sections and nested nodes
    frame.querySelectorAll<HTMLElement>('[data-section-id], [data-node-id]').forEach(el => {
      const id = el.getAttribute('data-section-id') || el.getAttribute('data-node-id')
      if (!id) return
      const r = el.getBoundingClientRect()
      // Convert to canvas-frame coordinates, compensating for zoom
      positions.set(id, {
        x: (r.left - frameRect.left) / zoom,
        y: (r.top - frameRect.top) / zoom,
        width: r.width / zoom,
        height: r.height / zoom,
      })
    })
    return positions
  }, [zoom])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    // Marquee starts ONLY on the canvas frame background itself —
    // never on sections, nodes, or toolbar elements (they stop propagation
    // or are children with their own handlers).
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    setMarquee({
      startX: (e.clientX - rect.left) / zoom,
      startY: (e.clientY - rect.top) / zoom,
      currentX: (e.clientX - rect.left) / zoom,
      currentY: (e.clientY - rect.top) / zoom,
    })
  }, [zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const m = marqueeRef.current
    if (!m) return
    const rect = e.currentTarget.getBoundingClientRect()
    setMarquee({
      ...m,
      currentX: (e.clientX - rect.left) / zoom,
      currentY: (e.clientY - rect.top) / zoom,
    })
  }, [zoom])

  const handleMouseUp = useCallback(() => {
    const m = marqueeRef.current
    setMarquee(null)
    if (!m || !activePage) return

    const x = Math.min(m.startX, m.currentX)
    const y = Math.min(m.startY, m.currentY)
    const width = Math.abs(m.currentX - m.startX)
    const height = Math.abs(m.currentY - m.startY)

    // Ignore click-like drags (< 4px) — they should deselect via canvas click instead
    if (width < 4 || height < 4) return

    const sectionPositions = collectSectionPositions()
    dispatch({
      type: 'CANVAS',
      action: {
        type: 'BOX_SELECT',
        pageId: activePage.id,
        rect: { x, y, width, height },
        sectionPositions,
      },
    })
  }, [activePage, collectSectionPositions, dispatch])

  const cancelMarquee = useCallback(() => setMarquee(null), [])

  useEffect(() => {
    if (!marquee) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelMarquee()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [marquee, cancelMarquee])

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
          onClick={e => {
            e.stopPropagation()
            // Click on empty canvas background (not a section/node) clears selection
            if (e.target === e.currentTarget && canvas.selectedSectionId) {
              dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: null } })
            }
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
