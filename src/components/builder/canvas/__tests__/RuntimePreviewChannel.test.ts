/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RuntimePreviewChannel } from '../RuntimePreviewChannel'

describe('RuntimePreviewChannel', () => {
  let channel: RuntimePreviewChannel
  let mockIframe: HTMLIFrameElement
  let postMessageSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    channel = new RuntimePreviewChannel('http://localhost')
    postMessageSpy = vi.fn()
    mockIframe = {
      contentWindow: { postMessage: postMessageSpy },
    } as unknown as HTMLIFrameElement
  })

  afterEach(() => {
    channel.detach()
  })

  it('attaches and detaches to iframe without errors', () => {
    expect(() => channel.attach(mockIframe)).not.toThrow()
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
    channel.attach(mockIframe)
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
    channel.attach(mockIframe)
    channel.sendViewport({ width: 768, height: 800 })
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'SET_VIEWPORT', payload: { width: 768, height: 800 } },
      'http://localhost'
    )
  })

  it('sends UPDATE_PROPS payload to iframe contentWindow', () => {
    channel.attach(mockIframe)
    channel.sendSectionUpdate('s-hero', { title: 'Hello' })
    expect(postMessageSpy).toHaveBeenCalledWith(
      { type: 'UPDATE_PROPS', payload: { sectionId: 's-hero', props: { title: 'Hello' } } },
      'http://localhost'
    )
  })

  it('invokes onRuntimeReady callback when RUNTIME_READY postMessage is received', () => {
    channel.attach(mockIframe)
    const readyCallback = vi.fn()
    channel.onRuntimeReady(readyCallback)

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'http://localhost',
        data: { type: 'RUNTIME_READY' },
      })
    )

    expect(readyCallback).toHaveBeenCalledTimes(1)
  })

  it('invokes onSectionSelected callback when SECTION_SELECTED postMessage is received', () => {
    channel.attach(mockIframe)
    const selectCallback = vi.fn()
    channel.onSectionSelected(selectCallback)

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'http://localhost',
        data: { type: 'SECTION_SELECTED', payload: { sectionId: 's1', pageId: 'home' } },
      })
    )

    expect(selectCallback).toHaveBeenCalledWith({ sectionId: 's1', pageId: 'home' })
  })

  it('invokes onSectionsMetrics callback when SECTIONS_METRICS postMessage is received', () => {
    channel.attach(mockIframe)
    const metricsCallback = vi.fn()
    channel.onSectionsMetrics(metricsCallback)

    const metricsData = {
      sections: [
        { sectionId: 's1', type: 'hero', rect: { x: 0, y: 0, width: 1280, height: 400 } },
      ],
    }

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'http://localhost',
        data: { type: 'SECTIONS_METRICS', payload: metricsData },
      })
    )

    expect(metricsCallback).toHaveBeenCalledWith(metricsData)
  })

  it('ignores messages from unknown origins', () => {
    channel.attach(mockIframe)
    const readyCallback = vi.fn()
    channel.onRuntimeReady(readyCallback)

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'http://evil.com',
        data: { type: 'RUNTIME_READY' },
      })
    )

    expect(readyCallback).not.toHaveBeenCalled()
  })

  it('does not call callbacks after detach', () => {
    channel.attach(mockIframe)
    const readyCallback = vi.fn()
    channel.onRuntimeReady(readyCallback)
    channel.detach()

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'http://localhost',
        data: { type: 'RUNTIME_READY' },
      })
    )

    expect(readyCallback).not.toHaveBeenCalled()
  })
})
