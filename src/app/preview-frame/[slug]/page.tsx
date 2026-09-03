'use client'

/**
 * PreviewFramePage — Client preview frame running inside BuilderCanvas iframe.
 *
 * Responsibilities:
 *   1. Listens for postMessage updates from parent window (UPDATE_DOCUMENT, SET_VIEWPORT, UPDATE_PROPS).
 *   2. Renders section components using SectionRenderer.
 *   3. Reports RUNTIME_READY to parent on mount.
 *   4. Measures section bounding rects and sends SECTIONS_METRICS to parent.
 *   5. Forwards section click & hover events as SECTION_SELECTED / SECTION_HOVERED postMessages.
 */

import { use, useEffect, useState, useRef, useCallback } from 'react'
import { SectionRenderer } from '@/components/runtime/SectionRenderer'
import { generateThemeCssVars } from '@/lib/tenant/TenantTheme'
import { CartProvider } from '@/lib/cart/CartStore'

interface Props {
  params: Promise<{ slug: string }>
}

interface SectionData {
  id: string
  type: string
  label: string
  props: Record<string, unknown>
  order: number
  visible: boolean
  children?: Array<unknown>
}

interface ThemeData {
  primaryColor: string
  secondaryColor: string
  font: string
  logo?: string
}

export default function PreviewFramePage({ params }: Props) {
  const { slug } = use(params)

  const [sections, setSections] = useState<SectionData[]>([])
  const [theme, setTheme] = useState<ThemeData>({
    primaryColor: '#7c3aed',
    secondaryColor: '#ec4899',
    font: 'Inter',
  })
  const [mode, setMode] = useState<'LIVE' | 'PREVIEW' | 'EXPORT'>('PREVIEW')
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Measure section bounding rects relative to body/container and send SECTIONS_METRICS
  const reportMetrics = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()

    const sectionElements = container.querySelectorAll('[data-section-id]')
    const metrics: Array<{
      sectionId: string
      type: string
      rect: { x: number; y: number; width: number; height: number }
    }> = []

    sectionElements.forEach((el) => {
      const sectionId = el.getAttribute('data-section-id')
      const sectionType = el.getAttribute('data-section-type') || ''
      if (!sectionId) return

      const rect = el.getBoundingClientRect()
      metrics.push({
        sectionId,
        type: sectionType,
        rect: {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        },
      })
    })

    window.parent?.postMessage(
      {
        type: 'SECTIONS_METRICS',
        payload: { sections: metrics },
      },
      '*'
    )
  }, [])

  // Initial fetch from /api/preview/[slug]
  useEffect(() => {
    let active = true

    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/preview/${slug}?mode=${mode}&noCache=true`)
        if (!res.ok) return
        const body = await res.json()
        if (active && body?.success && body?.data) {
          const data = body.data
          if (data.sections) setSections(data.sections)
          if (data.theme) setTheme(data.theme)
          setLoaded(true)
        }
      } catch (err) {
        console.error('[PreviewFrame] Failed to fetch initial state:', err)
      }
    }

    fetchInitial()

    return () => {
      active = false
    }
  }, [slug, mode])

  // PostMessage lifecycle and handler
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data
      if (!message || typeof message !== 'object') return

      switch (message.type) {
        case 'UPDATE_DOCUMENT': {
          const payload = message.payload
          if (payload?.sections) setSections(payload.sections)
          if (payload?.theme) setTheme(payload.theme)
          if (payload?.mode) setMode(payload.mode)
          break
        }
        case 'UPDATE_PROPS': {
          const { sectionId, props } = message.payload || {}
          if (sectionId && props) {
            setSections((prev) =>
              prev.map((s) => (s.id === sectionId ? { ...s, props: { ...s.props, ...props } } : s))
            )
          }
          break
        }
        case 'SET_VIEWPORT': {
          // Viewport size driven by parent iframe container
          break
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Notify parent window that runtime preview frame is ready
    window.parent?.postMessage({ type: 'RUNTIME_READY' }, '*')

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Re-report metrics after DOM updates
  useEffect(() => {
    reportMetrics()
    const timer = setTimeout(reportMetrics, 100)
    return () => clearTimeout(timer)
  }, [sections, theme, reportMetrics])

  const cssVars = generateThemeCssVars({
    primary: theme.primaryColor,
    secondary: theme.secondaryColor,
  })

  // Handle click on section → send SECTION_SELECTED postMessage
  const handleSectionClick = (sectionId: string) => {
    window.parent?.postMessage(
      {
        type: 'SECTION_SELECTED',
        payload: { sectionId, pageId: 'home' },
      },
      '*'
    )
  }

  // Handle hover on section → send SECTION_HOVERED postMessage
  const handleSectionMouseEnter = (sectionId: string) => {
    window.parent?.postMessage(
      {
        type: 'SECTION_HOVERED',
        payload: { sectionId },
      },
      '*'
    )
  }

  return (
    <CartProvider>
      <div
        ref={containerRef}
        style={{ fontFamily: theme.font, ...cssVars }}
        className="min-h-screen bg-white text-slate-900 selection:bg-violet-500 selection:text-white"
      >
        {sections.length === 0 && !loaded && (
          <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
            Ładowanie podglądu runtime...
          </div>
        )}

        {sections.map((section) => (
          <div
            key={section.id}
            data-section-id={section.id}
            data-section-type={section.type}
            onClick={() => handleSectionClick(section.id)}
            onMouseEnter={() => handleSectionMouseEnter(section.id)}
            className="relative group cursor-pointer"
          >
            <SectionRenderer
              section={{
                id: section.id,
                type: section.type,
                label: section.label,
                config: section.props,
              }}
              theme={{
                primaryColor: theme.primaryColor,
                secondaryColor: theme.secondaryColor,
                font: theme.font,
                logo: theme.logo,
              }}
              storeName={slug}
              products={[]}
              navigation={[]}
            />
          </div>
        ))}
      </div>
    </CartProvider>
  )
}
