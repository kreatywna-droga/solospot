import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RuntimePreviewChannel } from '../RuntimePreviewChannel'

// Mock window.postMessage and addEventListener
function createMockWindow() {
  const listeners = new Map<string, Set<(...args: any[]) => void>>()
  return {
    addEventListener: vi.fn((type: string, handler: (...args: any[]) => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(handler)
    }),
    removeEventListener: vi.fn((type: string, handler: (...args: any[]) => void) => {
      listeners.get(type)?.delete(handler)
    }),
    dispatchEvent: vi.fn((event: MessageEvent) => {
      for (const handler of listeners.get('message') ?? []) {
        handler(event)
      }
    }),
    // Helper to simulate a postMessage from iframe
    _simulateMessage: (data: any, origin: string) => {
      const event = { data, origin } as MessageEvent
      for (const handler of listeners.get('message') ?? []) {
        handler(event)
      }
    },
  }
}

describe('RuntimePreviewChannel', () => {
  let channel: RuntimePreviewChannel
  let mockIframe: any
  let postMessageSpy: ReturnType<typeof vi.fn>
  let mockWindow: ReturnType<typeof createMockWindow>

  beforeEach(() => {
    mockWindow = createMockWindow()

    // Replace global window methods
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost' },
      addEventListener: mockWindow.addEventListener,
      removeEventListener: mockWindow.removeEventListener,
    })

    channel = new RuntimePreviewChannel('http://localhost')
    postMessageSpy = vi.fn()
    mockIframe = {
      contentWindow: { postMessage: postMessageSpy },
    }
  })

  afterEach(() => {
    channel.detach()
    vi.unstubAllGlobals()
  })

  it('attaches and detaches to iframe without errors', () => {
    expect(() => channel.attach(mockIframe as any)).not.toThrow()
    expect(() => channel.detach()).not.toThrow()
  })

  it('warns and skips postMessage when iframe is not attached', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    channel.sendDocumentUpdate({
      sections: [],
      theme: { primaryColor: '#7c3aed', secondaryColor: '#ec4899', font: 'Inter' },
      mode: 'PREVIEW',
    })
    expect(postMessageSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('sends UPDATE_DOCUMENT payload to iframe contentWindow', () => {
    channel.attach(mockIframe as any)
    const payload = {
      sections: [{ id: 's1', type: 'hero', label: 'Hero', props: {}, order: 0, visible: true }],
      theme: { primaryColor: '#7c3aed', secondaryColor: '#ec4899', font: 'Inter' },
      mode: 'PREVIEW' as const,
    }
    channel.sendDocumentUpdate(payload)
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'UPDATE_DOCUMENT', payload },
      'http://localhost'
    )
  })

  it('sends SET_VIEWPORT payload to iframe contentWindow', () => {
    channel.attach(mockIframe as any)
    channel.sendViewport({ width: 768, height: 800 })
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'SET_VIEWPORT', payload: { width: 768, height: 800 } },
      'http://localhost'
    )
  })

  it('sends UPDATE_PROPS payload to iframe contentWindow', () => {
    channel.attach(mockIframe as any)
    channel.sendSectionUpdate('s-hero', { title: 'Hello' })
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'UPDATE_PROPS', payload: { sectionId: 's-hero', props: { title: 'Hello' } } },
      'http://localhost'
    )
  })

  it('invokes onRuntimeReady callback when RUNTIME_READY postMessage is received', () => {
    channel.attach(mockIframe as any)
    const readyCallback = vi.fn()
    channel.onRuntimeReady(readyCallback)

    mockWindow._simulateMessage(
      { type: 'RUNTIME_READY' },
      'http://localhost'
    )

    expect(readyCallback).toHaveBeenCalledTimes(1)
  })

  it('invokes onSectionSelected callback when SECTION_SELECTED postMessage is received', () => {
    channel.attach(mockIframe as any)
    const selectCallback = vi.fn()
    channel.onSectionSelected(selectCallback)

    mockWindow._simulateMessage(
      { type: 'SECTION_SELECTED', payload: { sectionId: 's1', pageId: 'home' } },
      'http://localhost'
    )

    expect(selectCallback).toHaveBeenCalledWith({ sectionId: 's1', pageId: 'home' })
  })

  it('invokes onSectionsMetrics callback when SECTIONS_METRICS postMessage is received', () => {
    channel.attach(mockIframe as any)
    const metricsCallback = vi.fn()
    channel.onSectionsMetrics(metricsCallback)

    const metricsData = {
      sections: [
        { sectionId: 's1', type: 'hero', rect: { x: 0, y: 0, width: 1280, height: 400 } },
      ],
    }

    mockWindow._simulateMessage(
      { type: 'SECTIONS_METRICS', payload: metricsData },
      'http://localhost'
    )

    expect(metricsCallback).toHaveBeenCalledWith(metricsData)
  })

  it('ignores messages from unknown origins', () => {
    channel.attach(mockIframe as any)
    const readyCallback = vi.fn()
    channel.onRuntimeReady(readyCallback)

    mockWindow._simulateMessage(
      { type: 'RUNTIME_READY' },
      'http://evil.com'
    )

    expect(readyCallback).not.toHaveBeenCalled()
  })

  it('does not call callbacks after detach', () => {
    channel.attach(mockIframe as any)
    const readyCallback = vi.fn()
    channel.onRuntimeReady(readyCallback)
    channel.detach()

    mockWindow._simulateMessage(
      { type: 'RUNTIME_READY' },
      'http://localhost'
    )

    expect(readyCallback).not.toHaveBeenCalled()
  })
})
