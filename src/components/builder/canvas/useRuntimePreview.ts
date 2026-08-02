'use client'

import { useEffect, useRef, useState } from 'react'
import { RuntimePreviewChannel, type DocumentUpdatePayload, type SectionsMetricsPayload } from './RuntimePreviewChannel'
import { useBuilder } from '../state/BuilderProvider'
import { VIEWPORT_PRESETS } from '../../../../packages/builder-core/src/CanvasState'

export interface RuntimePreviewState {
  loading: boolean
  error: string | null
  ready: boolean
  /** Section rects reported by the iframe (used by overlay as externalRects). */
  metrics: SectionsMetricsPayload | null
}

/**
 * useRuntimePreview
 *
 * Bridge hook between BuilderContext and RuntimePreviewChannel.
 *
 * Responsibilities:
 *   - Creates and manages RuntimePreviewChannel instance
 *   - Fetches preview data from /api/preview/[slug] when document changes
 *   - Sends document updates to iframe via channel
 *   - Listens for postMessage selection events and dispatches CANVAS actions
 *   - Re-fetches on viewport change
 *
 * @param previewSlug - Store slug for the preview endpoint
 * @param iframeRef - Ref to the preview iframe element
 */
export function useRuntimePreview(
  previewSlug: string | null,
  iframeRef: React.RefObject<HTMLIFrameElement | null>
): RuntimePreviewState {
  const { document, canvas, dispatch } = useBuilder()
  const channelRef = useRef<RuntimePreviewChannel | null>(null)
  const [state, setState] = useState<RuntimePreviewState>({
    loading: true,
    error: null,
    ready: false,
    metrics: null,
  })

  // Initialize channel
  useEffect(() => {
    const channel = new RuntimePreviewChannel()
    channelRef.current = channel

    // Handle section selection from iframe
    channel.onSectionSelected(({ sectionId, pageId }) => {
      dispatch({
        type: 'CANVAS',
        action: { type: 'SELECT_SECTION', sectionId, pageId },
      })
    })

    // Handle section hover from iframe
    channel.onSectionHovered(({ sectionId }) => {
      dispatch({
        type: 'CANVAS',
        action: { type: 'HOVER_SECTION', sectionId },
      })
    })

    // Handle iframe ready
    channel.onRuntimeReady(() => {
      setState(prev => ({ ...prev, ready: true, loading: false }))
    })

    // Handle section metrics (rects) from iframe → overlay externalRects
    channel.onSectionsMetrics((metrics) => {
      setState(prev => ({ ...prev, metrics }))
    })

    // Attach to iframe when available
    if (iframeRef.current) {
      channel.attach(iframeRef.current)
    }

    return () => {
      channel.detach()
      channelRef.current = null
    }
  }, [])

  // Re-attach when iframe element changes
  useEffect(() => {
    if (channelRef.current && iframeRef.current) {
      channelRef.current.attach(iframeRef.current)
    }
  }, [iframeRef.current])

  // Send document updates when page/sections change
  useEffect(() => {
    if (!channelRef.current || !state.ready) return

    const activePage = document.pages.find(p =>
      canvas.selectedPageId ? p.id === canvas.selectedPageId : p.isHome
    ) ?? document.pages[0]

    if (!activePage) return

    const payload: DocumentUpdatePayload = {
      sections: activePage.sections.map(s => ({
        id: s.id,
        type: s.type,
        label: s.label,
        props: s.props as Record<string, unknown>,
        order: s.order,
        visible: s.visible,
        children: s.children as Array<unknown>,
      })),
      theme: {
        primaryColor: document.theme?.primaryColor || '#7c3aed',
        secondaryColor: document.theme?.secondaryColor || '#ec4899',
        font: document.theme?.font || 'Inter',
        logo: document.theme?.logo,
      },
      mode: canvas.runtimeMode,
    }

    channelRef.current.sendDocumentUpdate(payload)
  }, [
    document.pages,
    canvas.selectedPageId,
    document.theme,
    canvas.runtimeMode,
    state.ready,
  ])

  // Send viewport changes
  useEffect(() => {
    if (!channelRef.current || !state.ready) return

    const vp = VIEWPORT_PRESETS[canvas.viewport.label]
    channelRef.current.sendViewport({
      width: vp.width,
      // Fixed canvas height — section heights are driven by rendered content.
      height: 800,
    })
  }, [canvas.viewport.label, state.ready])

  // Fetch preview data when slug changes
  useEffect(() => {
    if (!previewSlug) {
      setState({ loading: false, error: null, ready: false, metrics: null })
      return
    }

    let cancelled = false

    const fetchPreview = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))
      try {
        const response = await fetch(
          `/api/preview/${previewSlug}?mode=${canvas.runtimeMode}&noCache=true`
        )

        if (!response.ok) {
          throw new Error(`Preview fetch failed: ${response.statusText}`)
        }

        if (!cancelled) {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : 'Preview fetch failed',
          }))
        }
      }
    }

    fetchPreview()

    return () => {
      cancelled = true
    }
  }, [previewSlug])

  return state
}

