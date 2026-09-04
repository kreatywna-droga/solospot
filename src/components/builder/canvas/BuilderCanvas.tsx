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

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUp, ArrowDown, Trash2, Copy, Plus,
  Layers, Package, Star, FileText, LayoutDashboard, Grid, Sparkles,
  Video, Upload, Image as ImageIcon, Type,
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
import { loadGoogleFont } from '../../../../packages/builder-core/src/fonts/FontCatalog'
import { SectionLibraryModal } from '../library/SectionLibraryModal'
import { WebsiteTemplatePickerModal } from '../templates/WebsiteTemplatePickerModal'

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

function formatTransform(styles: Record<string, any>): string | undefined {
  if (!styles) return undefined
  const parts: string[] = []
  if (styles.translateX || styles.translateY) {
    parts.push(`translate(${styles.translateX || '0px'}, ${styles.translateY || '0px'})`)
  }
  if (styles.rotate !== undefined && styles.rotate !== 0) {
    parts.push(`rotate(${styles.rotate}deg)`)
  }
  if (styles.scale !== undefined && styles.scale !== 1) {
    parts.push(`scale(${styles.scale})`)
  }
  if (styles.transform) {
    parts.push(styles.transform)
  }
  return parts.length > 0 ? parts.join(' ') : undefined
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
// 4-side spacing formatter (ensures objects { top, right, bottom, left } serialize cleanly to CSS)
// ---------------------------------------------------------------------------

function formatFourSide(val: any, fallback?: string): string | undefined {
  if (!val) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    const top = val.top ?? '0px'
    const right = val.right ?? '0px'
    const bottom = val.bottom ?? '0px'
    const left = val.left ?? '0px'
    if (!val.top && !val.right && !val.bottom && !val.left) return fallback
    return `${top || '0px'} ${right || '0px'} ${bottom || '0px'} ${left || '0px'}`
  }
  return fallback
}

const PADDING_PRESET_MAP: Record<string, string> = {
  none: '0px',
  sm: '16px',
  md: '32px',
  lg: '48px',
  xl: '64px',
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
    const fontSize = styles.fontSize || (props.fontSize as string) || (level === 'h1' ? '2.25rem' : level === 'h3' ? '1.25rem' : level === 'h4' ? '1.125rem' : '1.75rem')
    const fontWeight = styles.fontWeight || (props.fontWeight as string) || (level === 'h1' ? '800' : level === 'h3' ? '600' : '700')
    const lineHeight = styles.lineHeight || (props.lineHeight as string) || '1.2'
    const letterSpacing = styles.letterSpacing || (props.letterSpacing as string)
    const fontFamily = styles.fontFamily || (props.fontFamily as string)
    if (fontFamily) {
      loadGoogleFont(fontFamily)
    }
    const bg = (styles.backgroundColor as string) || (props.background as string) || 'transparent'
    const borderRadius = (styles.borderRadius as string) || (props.borderRadius as string)
    const borderWidth = styles.borderWidth || (props.borderWidth as string)
    const borderColor = styles.borderColor || (props.borderColor as string) || 'rgba(255,255,255,0.2)'
    const borderStyle = styles.borderStyle || (borderWidth ? 'solid' : undefined)
    const boxShadow = styles.boxShadow
    const opacity = styles.opacity !== undefined ? styles.opacity : undefined
    const width = styles.width || (props.width as string)
    const height = styles.height || (props.height as string)
    const padding = formatFourSide(styles.padding, '8px')
    const margin = formatFourSide(styles.margin)

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
          width,
          height,
          margin,
          padding,
          backgroundColor: bg,
          borderRadius,
          borderWidth: borderWidth || undefined,
          borderColor: borderWidth ? borderColor : undefined,
          borderStyle: borderWidth ? borderStyle : undefined,
          boxShadow,
          opacity,
          transform: formatTransform(styles),
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
          as={level as any}
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
    const fontSize = styles.fontSize || (props.fontSize as string) || '1rem'
    const fontWeight = styles.fontWeight || (props.fontWeight as string) || '400'
    const lineHeight = styles.lineHeight || (props.lineHeight as string) || '1.6'
    const letterSpacing = styles.letterSpacing || (props.letterSpacing as string)
    const fontFamily = styles.fontFamily || (props.fontFamily as string)
    if (fontFamily) {
      loadGoogleFont(fontFamily)
    }
    const bg = (styles.backgroundColor as string) || (props.background as string) || 'transparent'
    const borderRadius = (styles.borderRadius as string) || (props.borderRadius as string)
    const borderWidth = styles.borderWidth || (props.borderWidth as string)
    const borderColor = styles.borderColor || (props.borderColor as string) || 'rgba(255,255,255,0.2)'
    const borderStyle = styles.borderStyle || (borderWidth ? 'solid' : undefined)
    const boxShadow = styles.boxShadow
    const opacity = styles.opacity !== undefined ? styles.opacity : undefined
    const width = styles.width || (props.width as string)
    const height = styles.height || (props.height as string)
    const padding = formatFourSide(styles.padding, '8px')
    const margin = formatFourSide(styles.margin)

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
          width,
          height,
          margin,
          padding,
          backgroundColor: bg,
          borderRadius,
          borderWidth: borderWidth || undefined,
          borderColor: borderWidth ? borderColor : undefined,
          borderStyle: borderWidth ? borderStyle : undefined,
          boxShadow,
          opacity,
          transform: formatTransform(styles),
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
    const variant = (props.variant as string) || 'primary'
    const bg = (styles.backgroundColor as string) || (props.background as string) || (props.backgroundColor as string) || (variant === 'secondary' ? '#1e1e2e' : '#7c3aed')
    const textColor = (styles.color as string) || (props.textColor as string) || (props.color as string) || '#ffffff'
    const borderRadius = (styles.borderRadius as string) || (props.borderRadius as string) || '12px'
    const borderWidth = styles.borderWidth || (props.borderWidth as string) || (variant === 'outline' ? '2px' : '1px')
    const borderColor = styles.borderColor || (props.borderColor as string) || (variant === 'outline' ? bg : 'transparent')
    const borderStyle = styles.borderStyle || 'solid'
    const fontSize = styles.fontSize || (props.fontSize as string) || '0.875rem'
    const fontWeight = styles.fontWeight || (props.fontWeight as string) || '500'
    const fontFamily = styles.fontFamily || (props.fontFamily as string)
    if (fontFamily) {
      loadGoogleFont(fontFamily)
    }
    const textAlign = (styles.textAlign as any) || (props.textAlign as any) || 'center'
    const boxShadow = styles.boxShadow
    const opacity = styles.opacity !== undefined ? styles.opacity : undefined
    const width = styles.width || (props.width as string)
    const height = styles.height || (props.height as string)
    const padding = formatFourSide(styles.padding, (props.padding as string) || '10px 20px')
    const margin = formatFourSide(styles.margin)

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
          width,
          height: height || undefined,
          margin,
          display: 'inline-block',
          transform: formatTransform(styles),
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
            borderStyle,
            boxShadow,
            opacity,
            fontSize,
            fontWeight,
            fontFamily,
            textAlign,
            padding,
            width: width ? '100%' : undefined,
            height: height || undefined,
          }}
          className="font-medium pointer-events-none transition-transform"
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
    const src = (props.src as string) || (props.url as string) || (props.image as string) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
    const alt = (props.alt as string) || node.label || 'Obraz'
    const borderRadius = (styles.borderRadius as string) || (props.borderRadius as string) || '12px'
    const borderWidth = styles.borderWidth || (props.borderWidth as string)
    const borderColor = styles.borderColor || (props.borderColor as string) || 'rgba(255,255,255,0.2)'
    const borderStyle = styles.borderStyle || (borderWidth ? 'solid' : undefined)
    const width = styles.width || (props.width as string) || '100%'
    const height = styles.height || (props.height as string) || 'auto'
    const objectFit = (styles.objectFit as any) || (props.objectFit as any) || 'cover'
    const objectPosition = (styles.objectPosition as any) || (props.objectPosition as any) || 'center'
    const boxShadow = styles.boxShadow
    const opacity = styles.opacity !== undefined ? styles.opacity : undefined
    const padding = formatFourSide(styles.padding)
    const margin = formatFourSide(styles.margin)

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
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            e.stopPropagation()
            e.dataTransfer.dropEffect = 'copy'
          }
        }}
        onDrop={(e) => {
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0]
            if (file.type.startsWith('image/')) {
              e.preventDefault()
              e.stopPropagation()
              const reader = new FileReader()
              reader.onload = (uploadEvt) => {
                const dataUrl = uploadEvt.target?.result as string
                if (dataUrl) {
                  dispatch({
                    type: 'UPDATE_PROPS',
                    pageId,
                    sectionId: node.id,
                    props: { src: dataUrl, image: dataUrl },
                  })
                }
              }
              reader.readAsDataURL(file)
            }
          }
        }}
        style={{
          width,
          height: height === 'auto' ? undefined : height,
          margin,
          padding,
          display: 'inline-block',
          transform: formatTransform(styles),
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
            borderWidth: borderWidth || undefined,
            borderColor: borderWidth ? borderColor : undefined,
            borderStyle: borderWidth ? borderStyle : undefined,
            width: '100%',
            height: height === 'auto' ? 'auto' : '100%',
            maxHeight: height === 'auto' ? (styles.maxHeight || '350px') : undefined,
            objectFit,
            objectPosition,
            boxShadow,
            opacity,
          }}
          className="max-w-full pointer-events-none select-none"
        />
      </div>
    )
  }

  // First-class Video component
  if (node.type === 'video') {
    const src = (props.src as string) || (props.url as string) || (styles as any).videoSrc || 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4'
    const poster = (props.poster as string) || (styles as any).videoPoster
    const autoPlay = props.autoPlay !== undefined ? Boolean(props.autoPlay) : Boolean((styles as any).videoAutoplay ?? false)
    const loop = props.loop !== undefined ? Boolean(props.loop) : Boolean((styles as any).videoLoop ?? true)
    const muted = props.muted !== undefined ? Boolean(props.muted) : Boolean((styles as any).videoMuted ?? true)
    const controls = props.controls !== undefined ? Boolean(props.controls) : true
    const width = styles.width || (props.width as string) || '100%'
    const height = styles.height || (props.height as string) || '320px'
    const borderRadius = (styles.borderRadius as string) || (props.borderRadius as string) || '12px'
    const borderWidth = styles.borderWidth || (props.borderWidth as string)
    const borderColor = styles.borderColor || (props.borderColor as string) || 'rgba(255,255,255,0.2)'
    const borderStyle = styles.borderStyle || (borderWidth ? 'solid' : undefined)
    const margin = formatFourSide(styles.margin)
    const padding = formatFourSide(styles.padding)

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
          width,
          height,
          margin,
          padding,
          display: 'inline-block',
          transform: formatTransform(styles),
        }}
        className={`relative cursor-pointer transition-all duration-150 p-1 rounded-xl overflow-hidden ${
          !node.visible ? 'opacity-30' : ''
        } ${
          isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] z-20' :
          isHovered ? 'ring-1 ring-violet-400/60 z-10' : ''
        }`}
      >
        <video
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          controls={controls}
          style={{
            width: '100%',
            height: '100%',
            borderRadius,
            borderWidth: borderWidth || undefined,
            borderColor: borderWidth ? borderColor : undefined,
            borderStyle: borderWidth ? borderStyle : undefined,
            objectFit: (styles.objectFit as any) || 'cover',
          }}
          className="max-w-full pointer-events-none select-none"
        />
      </div>
    )
  }

  // First-class SVG / Icon component
  if (node.type === 'svg' || node.type === 'icon') {
    const svgContent = (props.svgContent as string) || (props.content as string)
    const src = (props.src as string) || (props.url as string)
    const width = styles.width || (props.width as string) || '64px'
    const height = styles.height || (props.height as string) || '64px'
    const color = (styles.color as string) || (props.color as string) || '#ffffff'
    const margin = formatFourSide(styles.margin)
    const padding = formatFourSide(styles.padding)

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
          width,
          height,
          color,
          margin,
          padding,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: formatTransform(styles),
        }}
        className={`relative cursor-pointer transition-all duration-150 p-1 rounded-lg ${
          !node.visible ? 'opacity-30' : ''
        } ${
          isSelected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#08080f] z-20' :
          isHovered ? 'ring-1 ring-violet-400/60 z-10' : ''
        }`}
      >
        {svgContent ? (
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{ width: '100%', height: '100%', fill: 'currentColor' }}
            className="pointer-events-none select-none flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
          />
        ) : src ? (
          <img
            src={src}
            alt={node.label || 'SVG'}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            className="pointer-events-none select-none"
          />
        ) : (
          <Sparkles className="w-full h-full text-violet-400 pointer-events-none select-none" />
        )}
      </div>
    )
  }

  // Default: container or other composite node
  const display = (props.display as string) || 'flex-col'
  const gap = styles.gap !== undefined ? (typeof styles.gap === 'number' ? `${styles.gap}px` : styles.gap) : `${props.gap || '16'}px`
  const bg = (styles.backgroundColor as string) || (props.background as string) || 'transparent'
  const paddingFallback = typeof props.padding === 'string' ? (PADDING_PRESET_MAP[props.padding] || props.padding) : '20px'
  const padding = formatFourSide(styles.padding, paddingFallback)
  const margin = formatFourSide(styles.margin)
  const borderWidth = styles.borderWidth || (props.borderWidth as string) || (styles.borderColor ? '1px' : undefined)
  const borderColor = styles.borderColor || (props.borderColor as string) || 'rgba(255,255,255,0.1)'
  const borderStyle = styles.borderStyle || (borderWidth ? 'solid' : undefined)
  const border = borderWidth ? `${borderWidth} ${borderStyle || 'solid'} ${borderColor}` : '1px solid rgba(255,255,255,0.05)'

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      const isImg = file.type.startsWith('image/')
      const isVid = file.type.startsWith('video/')
      const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg')

      const reader = new FileReader()
      reader.onload = (uploadEvt) => {
        const dataUrl = uploadEvt.target?.result as string
        if (dataUrl) {
          const nodeType = isVid ? 'video' : isSvg ? 'svg' : 'image'
          const newNodeId = `node_${nodeType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
          const newNode: SectionNode = {
            id: newNodeId,
            type: nodeType,
            label: file.name,
            parentId: node.id,
            order: node.children?.length ?? 0,
            visible: true,
            locked: false,
            props: { src: dataUrl, url: dataUrl },
            styles: {
              width: '100%',
              height: isVid ? '320px' : isSvg ? '64px' : 'auto',
              borderRadius: '12px',
            },
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
      reader.readAsDataURL(file)
      return
    }

    const draggedNodeId = e.dataTransfer.getData('application/solospot-node-id')
    const typoData = e.dataTransfer.getData('application/solospot-typography-preset')
    const compType = e.dataTransfer.getData('application/solospot-component-type') || e.dataTransfer.getData('text/plain')

    if (typoData) {
      try {
        const preset = JSON.parse(typoData)
        const newNodeId = `node_${preset.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        const newNode: SectionNode = {
          id: newNodeId,
          type: preset.type,
          label: preset.name,
          parentId: node.id,
          order: node.children?.length ?? 0,
          visible: true,
          locked: false,
          props: { content: preset.defaultText, text: preset.defaultText },
          styles: { ...preset.styles },
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
        return
      } catch (err) {}
    }

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
        backgroundImage: styles.backgroundImage ? (styles.backgroundImage.startsWith('url(') ? styles.backgroundImage : `url("${styles.backgroundImage}")`) : undefined,
        backgroundSize: styles.backgroundImage ? 'cover' : undefined,
        backgroundPosition: styles.backgroundImage ? 'center' : undefined,
        padding,
        margin,
        gap,
        width: styles.width || (props.width as string),
        height: styles.height || (props.height as string),
        minWidth: styles.minWidth,
        maxWidth: styles.maxWidth || (props.maxWidth as string),
        minHeight: styles.minHeight || (props.minHeight as string) || '50px',
        maxHeight: styles.maxHeight,
        alignItems: styles.alignItems || (props.alignItems as string),
        justifyContent: styles.justifyContent || (props.justifyContent as string),
        flexDirection: styles.flexDirection || (display === 'flex-row' ? 'row' : display === 'flex-col' ? 'column' : undefined),
        flexWrap: (styles as any).flexWrap || (display === 'flex-row' ? 'wrap' : undefined),
        gridTemplateColumns: styles.gridTemplateColumns || (display === 'grid-2' ? 'repeat(2, 1fr)' : display === 'grid-3' ? 'repeat(3, 1fr)' : display === 'grid-4' ? 'repeat(4, 1fr)' : undefined),
        gridTemplateRows: styles.gridTemplateRows,
        borderRadius: styles.borderRadius || (props.borderRadius as string) || '12px',
        border,
        boxShadow: styles.boxShadow,
        opacity: styles.opacity,
        position: styles.position as any,
        zIndex: styles.zIndex,
        display: styles.display || (
          display === 'flex-row' ? 'flex' :
          display === 'grid-2' || display === 'grid-3' || display === 'grid-4' ? 'grid' :
          'flex'
        ),
        transform: formatTransform(styles),
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
        <div className="p-6 border-2 border-dashed border-violet-500/20 hover:border-violet-500/40 rounded-xl text-center text-xs text-slate-400 w-full select-none flex flex-col items-center justify-center gap-3 transition-colors bg-violet-950/5">
          <div className="flex items-center gap-2 text-violet-300 font-semibold text-xs">
            <Upload className="w-4 h-4 text-violet-400" />
            <span>Pusty kontener — upuść plik lub dodaj element</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                const newNodeId = `node_text_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
                dispatch({
                  type: 'INSERT_NODE',
                  pageId,
                  parentId: node.id,
                  node: {
                    id: newNodeId,
                    type: 'text',
                    label: 'Tekst',
                    parentId: node.id,
                    order: node.children?.length ?? 0,
                    visible: true,
                    locked: false,
                    props: { content: 'Nowy tekst...', text: 'Nowy tekst...' },
                    styles: { fontSize: '16px', color: '#ffffff' },
                    children: [],
                  },
                })
                dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId } })
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600/30 border border-white/10 hover:border-violet-500/40 text-[11px] text-slate-300 hover:text-white transition-all"
            >
              + Tekst
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                const newNodeId = `node_image_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
                dispatch({
                  type: 'INSERT_NODE',
                  pageId,
                  parentId: node.id,
                  node: {
                    id: newNodeId,
                    type: 'image',
                    label: 'Obraz',
                    parentId: node.id,
                    order: node.children?.length ?? 0,
                    visible: true,
                    locked: false,
                    props: { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Obraz' },
                    styles: { width: '400px', height: '260px', objectFit: 'cover', borderRadius: '12px' },
                    children: [],
                  },
                })
                dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId } })
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600/30 border border-white/10 hover:border-violet-500/40 text-[11px] text-slate-300 hover:text-white transition-all"
            >
              + Obraz
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                const newNodeId = `node_video_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
                dispatch({
                  type: 'INSERT_NODE',
                  pageId,
                  parentId: node.id,
                  node: {
                    id: newNodeId,
                    type: 'video',
                    label: 'Wideo',
                    parentId: node.id,
                    order: node.children?.length ?? 0,
                    visible: true,
                    locked: false,
                    props: {
                      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                      controls: true,
                      muted: true,
                    },
                    styles: { width: '480px', height: '270px', borderRadius: '12px' },
                    children: [],
                  },
                })
                dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId } })
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600/30 border border-white/10 hover:border-violet-500/40 text-[11px] text-slate-300 hover:text-white transition-all"
            >
              + Wideo
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                const newNodeId = `node_button_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
                dispatch({
                  type: 'INSERT_NODE',
                  pageId,
                  parentId: node.id,
                  node: {
                    id: newNodeId,
                    type: 'button',
                    label: 'Przycisk',
                    parentId: node.id,
                    order: node.children?.length ?? 0,
                    visible: true,
                    locked: false,
                    props: { text: 'Kliknij tutaj', href: '#' },
                    styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: '10px 20px', borderRadius: '8px' },
                    children: [],
                  },
                })
                dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId } })
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600/30 border border-white/10 hover:border-violet-500/40 text-[11px] text-slate-300 hover:text-white transition-all"
            >
              + Przycisk
            </button>
          </div>
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
      {node.type === 'container' || node.type === 'section' ? (
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

            // Direct file drop support (e.g. image file from local OS)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0]
              if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (uploadEvt) => {
                  const dataUrl = uploadEvt.target?.result as string
                  if (dataUrl) {
                    dispatch({
                      type: 'SET_NODE_STYLES',
                      nodeId: node.id,
                      styles: { backgroundImage: `url("${dataUrl}")` },
                      pageId,
                    })
                  }
                }
                reader.readAsDataURL(file)
                return
              }
            }

            const draggedNodeId = e.dataTransfer.getData('application/solospot-node-id')
            const typoData = e.dataTransfer.getData('application/solospot-typography-preset')
            const compType = e.dataTransfer.getData('application/solospot-component-type') || e.dataTransfer.getData('text/plain')

            if (typoData) {
              try {
                const preset = JSON.parse(typoData)
                const newNodeId = `node_${preset.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
                const newNode: SectionNode = {
                  id: newNodeId,
                  type: preset.type,
                  label: preset.name,
                  parentId: node.id,
                  order: node.children?.length ?? 0,
                  visible: true,
                  locked: false,
                  props: { content: preset.defaultText, text: preset.defaultText },
                  styles: { ...preset.styles },
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
                return
              } catch (err) {}
            }

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
                styles: (descriptor?.defaultStyles as any) || (compType === 'container' ? { display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px' } : {}),
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
          className={`w-full text-white min-h-[80px] transition-all relative overflow-hidden ${
            isSectionDropTarget ? 'ring-2 ring-violet-400 bg-violet-950/20' : ''
          }`}
          style={{
            backgroundColor: resolvedStyles.backgroundColor || (node.props as any)?.background || (node.type === 'section' ? '#0a0a14' : '#08080f'),
            backgroundImage: resolvedStyles.backgroundImage ? (resolvedStyles.backgroundImage.startsWith('url(') ? resolvedStyles.backgroundImage : `url("${resolvedStyles.backgroundImage}")`) : undefined,
            backgroundSize: resolvedStyles.backgroundImage ? 'cover' : undefined,
            backgroundPosition: resolvedStyles.backgroundImage ? 'center' : undefined,
            padding: formatFourSide(resolvedStyles.padding, typeof (node.props as any)?.padding === 'string' ? (PADDING_PRESET_MAP[(node.props as any).padding] || (node.props as any).padding) : (node.type === 'section' ? '32px 20px' : '16px')),
            margin: formatFourSide(resolvedStyles.margin),
            borderRadius: resolvedStyles.borderRadius || (node.props as any)?.borderRadius,
            borderWidth: resolvedStyles.borderWidth || (node.props as any)?.borderWidth,
            borderColor: resolvedStyles.borderColor || (node.props as any)?.borderColor,
            borderStyle: resolvedStyles.borderStyle || ((resolvedStyles.borderWidth || (node.props as any)?.borderWidth) ? 'solid' : undefined),
            opacity: resolvedStyles.opacity,
            boxShadow: resolvedStyles.boxShadow,
            width: resolvedStyles.width || (node.props as any)?.width || '100%',
            height: resolvedStyles.height || (node.props as any)?.height,
            minWidth: resolvedStyles.minWidth,
            maxWidth: resolvedStyles.maxWidth || (node.props as any)?.maxWidth,
            minHeight: resolvedStyles.minHeight || (node.props as any)?.minHeight || (node.type === 'section' ? '120px' : '80px'),
            maxHeight: resolvedStyles.maxHeight,
            position: resolvedStyles.position as any,
            zIndex: resolvedStyles.zIndex,
            transform: formatTransform(resolvedStyles),
          }}
        >
          {/* Ambient Section Video Background */}
          {resolvedStyles.videoSrc && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <video
                src={resolvedStyles.videoSrc}
                autoPlay={resolvedStyles.videoAutoplay ?? true}
                loop={resolvedStyles.videoLoop ?? true}
                muted={resolvedStyles.videoMuted ?? true}
                playsInline
                className="w-full h-full object-cover"
              />
              {resolvedStyles.overlayColor && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: resolvedStyles.overlayColor,
                    opacity: resolvedStyles.overlayOpacity ?? 0.5,
                  }}
                />
              )}
            </div>
          )}

          <div
            className="w-full mx-auto relative z-10"
            style={{
              maxWidth: node.type === 'section' ? (resolvedStyles.maxWidth || '1280px') : undefined,
              display: resolvedStyles.display || 'flex',
              flexDirection: resolvedStyles.flexDirection || (resolvedStyles.display === 'grid' ? undefined : 'column'),
              alignItems: resolvedStyles.alignItems || (node.props as any)?.alignItems,
              justifyContent: resolvedStyles.justifyContent || (node.props as any)?.justifyContent,
              gap: resolvedStyles.gap || ((node.props as any)?.gap ? `${(node.props as any).gap}px` : '16px'),
              gridTemplateColumns: resolvedStyles.gridTemplateColumns,
              gridTemplateRows: resolvedStyles.gridTemplateRows,
            }}
          >
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
              <div className="p-8 border border-dashed border-white/20 rounded-xl text-center text-xs text-slate-400 w-full select-none">
                {node.type === 'section' ? 'Pusta sekcja — przeciągnij komponenty tutaj lub dodaj z panelu' : 'Pusty kontener — dodaj elementy lub przeciągnij komponent'}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            className="w-full relative pointer-events-none overflow-hidden text-slate-900 min-h-[60px]"
            style={{
              backgroundColor: resolvedStyles.backgroundColor || (node.props as any)?.background || (node.type === 'section' ? '#0a0a14' : '#ffffff'),
              backgroundImage: resolvedStyles.backgroundImage ? (resolvedStyles.backgroundImage.startsWith('url(') ? resolvedStyles.backgroundImage : `url("${resolvedStyles.backgroundImage}")`) : undefined,
              backgroundSize: resolvedStyles.backgroundImage ? 'cover' : undefined,
              backgroundPosition: resolvedStyles.backgroundImage ? 'center' : undefined,
              opacity: resolvedStyles.opacity,
              padding: formatFourSide(resolvedStyles.padding, typeof (node.props as any)?.padding === 'string' ? (PADDING_PRESET_MAP[(node.props as any).padding] || (node.props as any).padding) : undefined),
              margin: formatFourSide(resolvedStyles.margin),
              borderRadius: resolvedStyles.borderRadius || (node.props as any)?.borderRadius,
              borderWidth: resolvedStyles.borderWidth || (node.props as any)?.borderWidth,
              borderColor: resolvedStyles.borderColor || (node.props as any)?.borderColor,
              borderStyle: resolvedStyles.borderStyle || ((resolvedStyles.borderWidth || (node.props as any)?.borderWidth) ? 'solid' : undefined),
              boxShadow: resolvedStyles.boxShadow,
              width: resolvedStyles.width || (node.props as any)?.width || '100%',
              height: resolvedStyles.height || (node.props as any)?.height,
              minWidth: resolvedStyles.minWidth,
              maxWidth: resolvedStyles.maxWidth || (node.props as any)?.maxWidth,
              minHeight: resolvedStyles.minHeight || (node.props as any)?.minHeight || '60px',
              maxHeight: resolvedStyles.maxHeight,
              display: resolvedStyles.display,
              flexDirection: resolvedStyles.flexDirection,
              alignItems: resolvedStyles.alignItems || (node.props as any)?.alignItems,
              justifyContent: resolvedStyles.justifyContent || (node.props as any)?.justifyContent,
              gap: resolvedStyles.gap,
              gridTemplateColumns: resolvedStyles.gridTemplateColumns,
              gridTemplateRows: resolvedStyles.gridTemplateRows,
              position: resolvedStyles.position as any,
              zIndex: resolvedStyles.zIndex,
            }}
          >
            <CartProvider>
              <SectionRenderer
                section={{
                  id: node.id,
                  type: node.type,
                  label: node.label,
                  config: {
                    ...node.props,
                    background: resolvedStyles.backgroundColor || (node.props as any)?.background,
                  },
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

          {/* Render children if custom section has nested nodes */}
          {node.children && node.children.length > 0 && (
            <div className="max-w-[1280px] mx-auto p-4 space-y-3">
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

  const [isSectionLibraryOpen, setIsSectionLibraryOpen] = useState(false)
  const [insertSectionIndex, setInsertSectionIndex] = useState<number | undefined>(undefined)
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false)

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
            const typoData = e.dataTransfer.getData('application/solospot-typography-preset')
            if (typoData && activePage) {
              try {
                const preset = JSON.parse(typoData)
                const lastSection = activePage.sections[activePage.sections.length - 1]
                const targetParent = (lastSection && lastSection.children && lastSection.children.length > 0 && lastSection.children[lastSection.children.length - 1].type === 'container')
                  ? lastSection.children[lastSection.children.length - 1]
                  : lastSection
                const newNodeId = `node_${preset.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
                const newNode: SectionNode = {
                  id: newNodeId,
                  type: preset.type,
                  label: preset.name,
                  parentId: targetParent ? targetParent.id : null,
                  order: targetParent ? (targetParent.children?.length ?? 0) : 0,
                  visible: true,
                  locked: false,
                  props: { content: preset.defaultText, text: preset.defaultText },
                  styles: { ...preset.styles },
                  children: [],
                }
                if (targetParent) {
                  dispatch({
                    type: 'INSERT_NODE',
                    pageId: activePage.id,
                    parentId: targetParent.id,
                    node: newNode,
                  })
                } else {
                  const wrapperSection: SectionNode = {
                    id: `node_section_${Date.now()}`,
                    type: 'section',
                    label: 'Sekcja',
                    parentId: null,
                    order: 0,
                    visible: true,
                    locked: false,
                    props: { background: '#0a0a14' },
                    styles: {},
                    children: [{ ...newNode, parentId: null }],
                  }
                  dispatch({
                    type: 'INSERT_NODE',
                    pageId: activePage.id,
                    parentId: null,
                    node: wrapperSection,
                  })
                }
                dispatch({
                  type: 'CANVAS',
                  action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId: activePage.id },
                })
                return
              } catch (err) {}
            }

            const componentType = e.dataTransfer.getData('application/solospot-component-type') || e.dataTransfer.getData('text/plain')
            if (componentType && activePage) {
              const descriptor = ctx.registry.get(componentType)
              if (componentType === 'section') {
                dispatch({
                  type: 'ADD_SECTION',
                  pageId: activePage.id,
                  sectionType: componentType,
                  defaultProps: descriptor?.defaultProps ? { ...descriptor.defaultProps } : {},
                  label: descriptor?.label || componentType,
                })
              } else {
                const lastSection = activePage.sections[activePage.sections.length - 1]
                const targetParent = (lastSection && lastSection.children && lastSection.children.length > 0 && lastSection.children[lastSection.children.length - 1].type === 'container')
                  ? lastSection.children[lastSection.children.length - 1]
                  : lastSection
                const newNodeId = `node_${componentType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
                const newNode: SectionNode = {
                  id: newNodeId,
                  type: componentType,
                  label: descriptor?.label || componentType,
                  parentId: targetParent ? targetParent.id : null,
                  order: targetParent ? (targetParent.children?.length ?? 0) : 0,
                  visible: true,
                  locked: false,
                  props: descriptor?.defaultProps ? { ...descriptor.defaultProps } : {},
                  styles: (descriptor?.defaultStyles as any) || {},
                  children: [],
                }
                if (targetParent) {
                  dispatch({
                    type: 'INSERT_NODE',
                    pageId: activePage.id,
                    parentId: targetParent.id,
                    node: newNode,
                  })
                } else {
                  const wrapperSection: SectionNode = {
                    id: `node_section_${Date.now()}`,
                    type: 'section',
                    label: 'Sekcja',
                    parentId: null,
                    order: 0,
                    visible: true,
                    locked: false,
                    props: { background: '#0a0a14' },
                    styles: {},
                    children: [{ ...newNode, parentId: null }],
                  }
                  dispatch({
                    type: 'INSERT_NODE',
                    pageId: activePage.id,
                    parentId: null,
                    node: wrapperSection,
                  })
                }
                dispatch({
                  type: 'CANVAS',
                  action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId: activePage.id },
                })
              }
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
              <div className="flex flex-col items-center justify-center h-full min-h-[550px] text-center p-12">
                <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Rozpocznij tworzenie strony</h3>
                <p className="text-slate-400 text-sm mb-8 max-w-md">
                  Wybierz gotowy, profesjonalnie skomponowany szablon strony lub dodaj pojedyncze sekcje z biblioteki.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => setIsTemplatePickerOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:shadow-xl hover:shadow-violet-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Wybierz gotowy szablon strony</span>
                  </button>
                  <button
                    onClick={() => {
                      setInsertSectionIndex(0)
                      setIsSectionLibraryOpen(true)
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-bold text-sm border border-white/10 transition-all"
                  >
                    <Plus className="w-4 h-4 text-violet-400" />
                    <span>Przeglądaj bibliotekę sekcji</span>
                  </button>
                </div>
              </div>
            )}

            {sections.map((node, index) => {
              const isDragSource = isDragging && canvas.dragState?.sectionId === node.id
              return (
                <React.Fragment key={node.id}>
                  {/* In-between section insertion divider */}
                  <div className="relative group/divider py-1.5 flex items-center justify-center z-20">
                    <div className="absolute inset-x-8 h-px bg-transparent group-hover/divider:bg-violet-500/40 transition-all" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setInsertSectionIndex(index)
                        setIsSectionLibraryOpen(true)
                      }}
                      className="opacity-0 group-hover/divider:opacity-100 transition-all flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold shadow-lg shadow-violet-600/40 z-10 scale-95 hover:scale-105"
                      title="Wstaw sekcję w tym miejscu"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Dodaj sekcję tutaj</span>
                    </button>
                  </div>

                  <div
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
                </React.Fragment>
              )
            })}

            {/* In-between divider after the last section */}
            {sections.length > 0 && (
              <div className="relative group/divider py-2 flex items-center justify-center z-20">
                <div className="absolute inset-x-8 h-px bg-transparent group-hover/divider:bg-violet-500/40 transition-all" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setInsertSectionIndex(sections.length)
                    setIsSectionLibraryOpen(true)
                  }}
                  className="opacity-0 group-hover/divider:opacity-100 transition-all flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold shadow-lg shadow-violet-600/40 z-10 scale-95 hover:scale-105"
                  title="Wstaw sekcję na końcu strony"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dodaj sekcję tutaj</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Selection Overlay — renders on top of sections with external rects support */}
        <SelectionOverlay
          containerRef={canvasFrameRef as React.RefObject<HTMLDivElement | null>}
          externalRects={externalRects}
        />

        {/* Add section & Layout Presets at bottom */}
        {sections.length > 0 && (
          <div className="border-t border-white/10 bg-[#06060c] p-5 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setInsertSectionIndex(sections.length)
                  setIsSectionLibraryOpen(true)
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/25 hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Dodaj Sekcję z Biblioteki</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsTemplatePickerOpen(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-white/10"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Zmień Szablon Strony</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs pt-1 border-t border-white/5 w-full">
              <span className="text-[11px] font-semibold text-slate-500">Szybkie kolumny:</span>
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
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600 hover:text-white text-slate-400 hover:border-violet-500 border border-white/5 transition-all font-medium text-[11px]"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section Library Modal */}
        <SectionLibraryModal
          isOpen={isSectionLibraryOpen}
          onClose={() => setIsSectionLibraryOpen(false)}
          insertIndex={insertSectionIndex}
        />

        {/* Website Template Picker Modal */}
        <WebsiteTemplatePickerModal
          isOpen={isTemplatePickerOpen}
          onClose={() => setIsTemplatePickerOpen(false)}
        />
      </motion.div>
      </div>
    </div>
  )
}
