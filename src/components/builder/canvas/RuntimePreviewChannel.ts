'use client'

/**
 * RuntimePreviewChannel
 *
 * Lightweight iframe-based preview channel that communicates
 * between the Builder Canvas and the Runtime Preview iframe.
 *
 * Communication protocol (postMessage):
 *
 * Parent → Iframe:
 *   - { type: 'UPDATE_DOCUMENT', payload: { sections, theme, mode } }
 *   - { type: 'SET_VIEWPORT', payload: { width, height } }
 *
 * Iframe → Parent:
 *   - { type: 'RUNTIME_READY' }
 *   - { type: 'SECTION_SELECTED', payload: { sectionId, pageId } }
 *   - { type: 'SECTION_HOVERED', payload: { sectionId } }
 *   - { type: 'SECTIONS_METRICS', payload: { sections: Array<{ sectionId, type, rect }> } }
 *
 * Overlay note (architectural decision #3):
 *   The Builder NEVER runs querySelector() inside the iframe. Section rects
 *   are reported by the iframe via SECTIONS_METRICS and consumed by the
 *   overlay layer as `externalRects`.
 */

export interface PreviewMessage {
  type: string
  payload?: unknown
}

export interface DocumentUpdatePayload {
  sections: Array<{
    id: string
    type: string
    label: string
    props: Record<string, unknown>
    order: number
    visible: boolean
    children?: Array<unknown>
  }>
  theme: {
    primaryColor: string
    secondaryColor: string
    font: string
    logo?: string
  }
  mode: 'LIVE' | 'PREVIEW' | 'EXPORT'
}

export interface ViewportPayload {
  width: number
  height: number
}

export interface SectionSelectedPayload {
  sectionId: string
  pageId: string
}

export interface SectionHoveredPayload {
  sectionId: string
}

export interface SectionRect {
  readonly sectionId: string
  readonly type: string
  readonly rect: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
}

export interface SectionsMetricsPayload {
  readonly sections: ReadonlyArray<SectionRect>
}

export class RuntimePreviewChannel {
  private iframe: HTMLIFrameElement | null = null
  private readonly origin: string
  private onSelection: ((payload: SectionSelectedPayload) => void) | null = null
  private onHover: ((payload: SectionHoveredPayload) => void) | null = null
  private onReady: (() => void) | null = null
  private onMetrics: ((payload: SectionsMetricsPayload) => void) | null = null
  private readonly messageHandler: (event: MessageEvent) => void

  constructor(origin = window.location.origin) {
    this.origin = origin
    this.messageHandler = this.handleMessage.bind(this)
  }

  /**
   * Attach the channel to an iframe element.
   */
  attach(iframe: HTMLIFrameElement): void {
    this.iframe = iframe
    window.addEventListener('message', this.messageHandler)
  }

  /**
   * Detach the channel and clean up listeners.
   */
  detach(): void {
    window.removeEventListener('message', this.messageHandler)
    this.iframe = null
  }

  /**
   * Send a document update to the preview iframe.
   */
  sendDocumentUpdate(payload: DocumentUpdatePayload): void {
    this.postMessage({ type: 'UPDATE_DOCUMENT', payload })
  }

  /**
   * Send viewport change to the preview iframe.
   */
  sendViewport(payload: ViewportPayload): void {
    this.postMessage({ type: 'SET_VIEWPORT', payload })
  }

  /**
   * Notify the iframe about a section update (props changed).
   */
  sendSectionUpdate(sectionId: string, props: Record<string, unknown>): void {
    this.postMessage({ type: 'UPDATE_PROPS', payload: { sectionId, props } })
  }

  /**
   * Register callback for section selection events from iframe.
   */
  onSectionSelected(callback: (payload: SectionSelectedPayload) => void): void {
    this.onSelection = callback
  }

  /**
   * Register callback for section hover events from iframe.
   */
  onSectionHovered(callback: (payload: SectionHoveredPayload) => void): void {
    this.onHover = callback
  }

  /**
   * Register callback for iframe ready event.
   */
  onRuntimeReady(callback: () => void): void {
    this.onReady = callback
  }

  /**
   * Register callback for section metrics (rects) reported by the iframe.
   * Used by the overlay layer as externalRects — never querySelector inside iframe.
   */
  onSectionsMetrics(callback: (payload: SectionsMetricsPayload) => void): void {
    this.onMetrics = callback
  }

  /**
   * Post a message to the iframe.
   */
  private postMessage(message: PreviewMessage): void {
    if (!this.iframe?.contentWindow) {
      console.warn('[RuntimePreviewChannel] iframe not ready')
      return
    }
    this.iframe.contentWindow.postMessage(message, this.origin)
  }

  /**
   * Handle incoming messages from the iframe.
   */
  private handleMessage(event: MessageEvent): void {
    if (event.origin !== this.origin) return
    const message = event.data as PreviewMessage
    if (!message?.type) return

    switch (message.type) {
      case 'RUNTIME_READY':
        this.onReady?.()
        break
      case 'SECTION_SELECTED':
        this.onSelection?.(message.payload as SectionSelectedPayload)
        break
      case 'SECTION_HOVERED':
        this.onHover?.(message.payload as SectionHoveredPayload)
        break
      case 'SECTIONS_METRICS':
        this.onMetrics?.(message.payload as SectionsMetricsPayload)
        break
    }
  }
}

