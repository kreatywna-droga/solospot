'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'
import { BuilderNode, SectionNode } from '../../../../packages/builder-core/src/BuilderDocument'
import { SectionRenderer } from '@/components/runtime/SectionRenderer'
import { CartProvider } from '@/lib/cart/CartStore'
import { loadGoogleFont } from '../../../../packages/builder-core/src/fonts/FontCatalog'

// Helper to format four-side padding/margin objects or strings
function formatSides(val: any, defaultVal?: string): string | undefined {
  if (!val) return defaultVal
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    const t = val.top || '0px'
    const r = val.right || '0px'
    const b = val.bottom || '0px'
    const l = val.left || '0px'
    return `${t} ${r} ${b} ${l}`
  }
  return defaultVal
}

function sanitizeLineHeight(val?: string | number): string | undefined {
  if (val === undefined || val === null || val === '') return undefined
  const str = String(val).trim()
  if (str.endsWith('px') && parseFloat(str) < 5) {
    const num = parseFloat(str)
    if (!Number.isNaN(num)) return String(num)
  }
  return str
}

/**
 * ScaleToFitContainer
 * Renders inner content at a fixed target width (e.g. 1200px / 768px / 375px)
 * and uses CSS transform: scale() to fit the container perfectly without horizontal scroll.
 */
export function ScaleToFitContainer({
  children,
  targetWidth = 1000,
  maxHeight = 360,
  className = '',
  interactiveVideo = false,
  interactive = false,
}: {
  children: React.ReactNode
  targetWidth?: number
  maxHeight?: number
  className?: string
  interactiveVideo?: boolean
  interactive?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<number>(0.45)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateScale = () => {
      const cw = el.clientWidth || 450
      const calculatedScale = Math.min(1, cw / targetWidth)
      setScale(calculatedScale)
    }

    updateScale()
    const ro = new ResizeObserver(updateScale)
    ro.observe(el)
    return () => ro.disconnect()
  }, [targetWidth])

  const scaledHeight = Math.min(maxHeight, Math.max(260, Math.round(targetWidth * scale * 0.55)))

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-[#090912] rounded-xl select-none ${className}`}
      style={{ height: `${scaledHeight}px` }}
    >
      <div
        style={{
          width: `${targetWidth}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: (interactive || interactiveVideo) ? 'auto' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
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

/**
 * Read-Only Node Tree Renderer
 */
function ReadOnlyNodeRenderer({ node }: { node: BuilderNode }) {
  const styles = (node.styles || {}) as Record<string, any>
  const props = (node.props || {}) as Record<string, any>

  if (styles.fontFamily) {
    loadGoogleFont(styles.fontFamily)
  }

  // Heading
  if (node.type === 'heading') {
    const text = (props.text as string) || (props.title as string) || node.label || 'Nagłówek'
    const level = (props.level as string) || 'h2'
    const color = styles.color || props.color || '#ffffff'
    const textAlign = styles.textAlign || props.textAlign || 'left'
    const fontSize = styles.fontSize || props.fontSize || (level === 'h1' ? '2.5rem' : level === 'h3' ? '1.3rem' : '1.8rem')
    const fontWeight = styles.fontWeight || props.fontWeight || (level === 'h1' ? '800' : '700')
    const lineHeight = sanitizeLineHeight(styles.lineHeight || props.lineHeight) || '1.2'
    const letterSpacing = styles.letterSpacing || props.letterSpacing

    const Tag = (level === 'h1' ? 'h1' : level === 'h3' ? 'h3' : level === 'h4' ? 'h4' : 'h2') as any

    return (
      <Tag
        style={{
          color,
          textAlign,
          fontSize,
          fontWeight,
          lineHeight,
          letterSpacing,
          fontFamily: styles.fontFamily || props.fontFamily,
          margin: formatSides(styles.margin, '0 0 12px 0'),
          padding: formatSides(styles.padding, '0'),
          maxWidth: '100%',
          transform: formatTransform(styles),
          zIndex: styles.zIndex,
          position: styles.position as any,
        }}
      >
        {text}
      </Tag>
    )
  }

  // Text
  if (node.type === 'text') {
    const text = (props.text as string) || (props.content as string) || 'Tekst...'
    const color = styles.color || props.color || '#94a3b8'
    const textAlign = styles.textAlign || props.textAlign || 'left'
    const fontSize = styles.fontSize || props.fontSize || '1rem'
    const fontWeight = styles.fontWeight || props.fontWeight || '400'
    const lineHeight = sanitizeLineHeight(styles.lineHeight || props.lineHeight) || '1.6'

    return (
      <p
        style={{
          color,
          textAlign,
          fontSize,
          fontWeight,
          lineHeight,
          backgroundColor: styles.backgroundColor || props.backgroundColor,
          padding: formatSides(styles.padding),
          margin: formatSides(styles.margin, '0 0 12px 0'),
          borderRadius: styles.borderRadius || props.borderRadius,
          letterSpacing: styles.letterSpacing,
          maxWidth: styles.maxWidth || '100%',
          transform: formatTransform(styles),
          zIndex: styles.zIndex,
          position: styles.position as any,
        }}
      >
        {text}
      </p>
    )
  }

  // Button
  if (node.type === 'button') {
    const text = (props.text as string) || (props.label as string) || 'Przycisk'
    const bg = styles.backgroundColor || props.background || props.backgroundColor || '#7c3aed'
    const color = styles.color || props.textColor || props.color || '#ffffff'
    const borderRadius = styles.borderRadius || props.borderRadius || '12px'
    const fontSize = styles.fontSize || props.fontSize || '0.9rem'
    const fontWeight = styles.fontWeight || props.fontWeight || '600'
    const padding = formatSides(styles.padding, '10px 24px')
    const margin = formatSides(styles.margin)

    return (
      <div
        style={{
          display: 'inline-flex',
          margin,
          transform: formatTransform(styles),
          zIndex: styles.zIndex,
          position: styles.position as any,
        }}
      >
        <span
          style={{
            backgroundColor: bg,
            color,
            borderRadius,
            fontSize,
            fontWeight,
            padding,
            borderWidth: styles.borderWidth || '1px',
            borderColor: styles.borderColor || 'transparent',
            borderStyle: styles.borderWidth ? 'solid' : 'none',
            boxShadow: styles.boxShadow,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          {text}
        </span>
      </div>
    )
  }

  // Image
  if (node.type === 'image') {
    const src = (props.src as string) || (props.url as string) || (props.image as string) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
    const alt = (props.alt as string) || node.label || 'Obraz'
    const width = styles.width || props.width || '100%'
    const height = styles.height || props.height || 'auto'
    const borderRadius = styles.borderRadius || props.borderRadius || '12px'
    const objectFit = styles.objectFit || props.objectFit || 'cover'

    return (
      <img
        src={src}
        alt={alt}
        style={{
          width,
          height,
          maxHeight: styles.maxHeight || '380px',
          borderRadius,
          objectFit,
          margin: formatSides(styles.margin),
          padding: formatSides(styles.padding),
          transform: formatTransform(styles),
          boxShadow: styles.boxShadow,
          zIndex: styles.zIndex,
          position: styles.position as any,
        }}
      />
    )
  }

  // Video Element
  if (node.type === 'video') {
    const videoSrc = (props.src as string) || (props.videoUrl as string) || (styles.videoSrc as string) || ''
    const poster = (props.poster as string) || (styles.poster as string)
    return (
      <div
        style={{
          width: styles.width || '100%',
          height: styles.height || 'auto',
          maxHeight: styles.maxHeight || '420px',
          borderRadius: styles.borderRadius || '16px',
          overflow: 'hidden',
          position: (styles.position as any) || 'relative',
          transform: formatTransform(styles),
          boxShadow: styles.boxShadow,
          zIndex: styles.zIndex,
          margin: formatSides(styles.margin),
          padding: formatSides(styles.padding),
        }}
      >
        <video
          src={videoSrc}
          poster={poster}
          autoPlay={props.autoplay !== false}
          loop={props.loop !== false}
          muted={props.muted !== false}
          playsInline
          controls={Boolean(props.controls)}
          style={{
            width: '100%',
            height: styles.height || '100%',
            objectFit: (styles.objectFit as any) || 'cover',
            display: 'block',
            borderRadius: styles.borderRadius || '16px',
          }}
        />
      </div>
    )
  }

  // Container / Card / Grid / Section
  const display = styles.display || (
    props.display === 'grid-2' ? 'grid' :
    props.display === 'grid-3' ? 'grid' :
    props.display === 'grid-4' ? 'grid' :
    props.display === 'flex-row' ? 'flex' :
    'flex'
  )
  const flexDirection = styles.flexDirection || (props.display === 'flex-row' ? 'row' : 'column')
  const alignItems = styles.alignItems || 'stretch'
  const justifyContent = styles.justifyContent || 'flex-start'
  const gap = styles.gap || '16px'
  const padding = formatSides(styles.padding, node.type === 'section' ? '60px 32px' : '0px')
  const margin = formatSides(styles.margin)
  const bg = styles.backgroundColor || props.background || 'transparent'
  const bgImage = styles.backgroundImage || props.backgroundImage
  const maxWidth = styles.maxWidth || '100%'
  const bgVideo = (props.backgroundVideo as string) || (props.backgroundVideoUrl as string) || (styles.videoSrc as string)
  const overlayOpacity = parseFloat(String(styles.overlayOpacity ?? props.overlayOpacity ?? '0'))

  return (
    <div
      style={{
        display,
        flexDirection: display === 'flex' ? flexDirection : undefined,
        alignItems,
        justifyContent,
        gap,
        padding,
        margin,
        backgroundColor: bg,
        backgroundImage: bgImage && bgImage !== 'none' ? (bgImage.startsWith('url(') ? bgImage : `url("${bgImage}")`) : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: styles.borderRadius || props.borderRadius,
        borderWidth: styles.borderWidth,
        borderColor: styles.borderColor,
        borderStyle: styles.borderWidth ? 'solid' : undefined,
        boxShadow: styles.boxShadow,
        width: styles.width || '100%',
        maxWidth,
        boxSizing: 'border-box',
        position: (styles.position as any) || 'relative',
        zIndex: styles.zIndex,
        transform: formatTransform(styles),
        perspective: styles.perspective || (styles.perspective3d ? '1000px' : undefined),
        transformStyle: (styles.transformStyle as any) || (styles.perspective || styles.transform ? 'preserve-3d' : undefined),
        backdropFilter: styles.backdropFilter || props.backdropFilter,
        WebkitBackdropFilter: styles.backdropFilter || props.backdropFilter,
        gridTemplateColumns: styles.gridTemplateColumns || (
          props.display === 'grid-2' ? 'repeat(2, 1fr)' :
          props.display === 'grid-3' ? 'repeat(3, 1fr)' :
          props.display === 'grid-4' ? 'repeat(4, 1fr)' : undefined
        ),
        gridTemplateRows: styles.gridTemplateRows,
        flexWrap: (styles as any).flexWrap || (flexDirection === 'row' ? 'wrap' : undefined),
        overflow: styles.overflow || styles.overflowX,
        top: styles.top,
        bottom: styles.bottom,
        left: styles.left,
        right: styles.right,
      }}
    >
      {/* Background Video Layer */}
      {bgVideo && (
        <>
          <video
            src={String(bgVideo)}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              zIndex: 0,
              borderRadius: styles.borderRadius || props.borderRadius || 'inherit',
            }}
          />
          {overlayOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundColor: String(styles.overlayColor || props.overlayColor || '#000000'),
                opacity: overlayOpacity,
                zIndex: 1,
                borderRadius: styles.borderRadius || props.borderRadius || 'inherit',
              }}
            />
          )}
        </>
      )}

      {/* Children Node Content (Elevated above background video if active) */}
      {bgVideo ? (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            display,
            flexDirection: display === 'flex' ? flexDirection : undefined,
            alignItems,
            justifyContent,
            gap,
          }}
        >
          {node.children && node.children.length > 0 && (
            node.children.map(child => (
              <ReadOnlyNodeRenderer key={child.id} node={child} />
            ))
          )}
        </div>
      ) : (
        node.children && node.children.length > 0 && (
          node.children.map(child => (
            <ReadOnlyNodeRenderer key={child.id} node={child} />
          ))
        )
      )}
    </div>
  )
}

/**
 * Main SectionPreviewRenderer component
 */
export function SectionPreviewRenderer({
  sectionNode,
  className = '',
}: {
  sectionNode: SectionNode | BuilderNode
  className?: string
}) {
  const isPredefinedRuntimeSection =
    ['hero', 'product-grid', 'gallery', 'testimonials', 'newsletter', 'footer', 'navbar', 'contact', 'category-grid', 'content', 'feature-grid', 'stats'].includes(sectionNode.type) &&
    (!sectionNode.children || sectionNode.children.length === 0)

  if (isPredefinedRuntimeSection) {
    return (
      <div className={`w-full bg-[#090912] ${className}`}>
        <CartProvider>
          <SectionRenderer
            section={{
              id: sectionNode.id,
              type: sectionNode.type,
              label: sectionNode.label,
              config: {
                ...(sectionNode.props || {}),
                background: (sectionNode.styles as any)?.backgroundColor || (sectionNode.props as any)?.background,
              },
            }}
            theme={{
              primaryColor: '#7c3aed',
              secondaryColor: '#ec4899',
              font: 'Inter',
            }}
            storeName="SoloSpot"
            products={[]}
            navigation={[]}
          />
        </CartProvider>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <ReadOnlyNodeRenderer node={sectionNode} />
    </div>
  )
}
