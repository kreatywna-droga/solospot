import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserTriggerAdapter } from './BrowserTriggerAdapter';
import type { AnimationTriggerContext } from '../../../../packages/builder-core/src/animation/AnimationTriggerContext';

describe('BrowserTriggerAdapter', () => {
  let mockListeners: Record<string, Function[]>;
  let mockWindow: any;
  let mockDocument: any;
  let mockObserverInstance: any;
  let observerCallback: ((entries: any[]) => void) | null;

  beforeEach(() => {
    mockListeners = {};
    observerCallback = null;

    mockObserverInstance = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };

    mockDocument = {
      body: { contains: () => true },
      querySelector: vi.fn().mockReturnValue(null),
      addEventListener: vi.fn((event: string, handler: Function) => {
        if (!mockListeners[event]) mockListeners[event] = [];
        mockListeners[event].push(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: Function) => {
        if (mockListeners[event]) {
          mockListeners[event] = mockListeners[event].filter((h) => h !== handler);
        }
      }),
    };

    class MockIntersectionObserver {
      constructor(cb: (entries: any[]) => void) {
        observerCallback = cb;
        this.observe = mockObserverInstance.observe;
        this.disconnect = mockObserverInstance.disconnect;
      }
      observe = mockObserverInstance.observe;
      disconnect = mockObserverInstance.disconnect;
    }

    mockWindow = {
      document: mockDocument,
      scrollY: 100,
      innerWidth: 1024,
      innerHeight: 768,
      addEventListener: vi.fn((event: string, handler: Function) => {
        if (!mockListeners[event]) mockListeners[event] = [];
        mockListeners[event].push(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: Function) => {
        if (mockListeners[event]) {
          mockListeners[event] = mockListeners[event].filter((h) => h !== handler);
        }
      }),
      IntersectionObserver: MockIntersectionObserver,
    };
  });

  it('connects to browser events and initializes listeners', () => {
    const adapter = new BrowserTriggerAdapter(mockWindow);
    adapter.connect();

    expect(mockDocument.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(mockDocument.addEventListener).toHaveBeenCalledWith('pointerover', expect.any(Function), true);
    expect(mockDocument.addEventListener).toHaveBeenCalledWith('pointerout', expect.any(Function), true);
    expect(mockDocument.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(mockObserverInstance.observe).toHaveBeenCalled();
  });

  it('emits snapshot with current scroll, viewport, and custom partials', () => {
    const adapter = new BrowserTriggerAdapter(mockWindow);
    const subscriber = vi.fn();

    adapter.subscribe(subscriber);
    adapter.connect();
    adapter.emitSnapshot();

    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        scrollY: 100,
        viewportWidth: 1024,
        viewportHeight: 768,
      })
    );
  });

  it('handles scroll event and emits updated scrollY', () => {
    const adapter = new BrowserTriggerAdapter(mockWindow);
    const emittedContexts: AnimationTriggerContext[] = [];

    adapter.subscribe((ctx) => emittedContexts.push(ctx));
    adapter.connect();

    mockWindow.scrollY = 250;
    const scrollHandler = mockListeners['scroll']?.[0];
    expect(scrollHandler).toBeDefined();
    scrollHandler?.();

    expect(emittedContexts.length).toBeGreaterThan(0);
    const lastCtx = emittedContexts[emittedContexts.length - 1];
    expect(lastCtx.scrollY).toBe(250);
  });

  it('handles pointerover and pointerout for hover detection', () => {
    const adapter = new BrowserTriggerAdapter(mockWindow);
    const emittedContexts: AnimationTriggerContext[] = [];

    adapter.subscribe((ctx) => emittedContexts.push(ctx));
    adapter.connect();

    const hoverHandler = mockListeners['pointerover']?.[0];
    hoverHandler?.({ target: mockDocument.body });

    const hoverCtx = emittedContexts[emittedContexts.length - 1];
    expect(hoverCtx.isHovered).toBe(true);

    const outHandler = mockListeners['pointerout']?.[0];
    outHandler?.({ target: mockDocument.body });

    const outCtx = emittedContexts[emittedContexts.length - 1];
    expect(outCtx.isHovered).toBe(false);
  });

  it('handles click event and emits click context', () => {
    const adapter = new BrowserTriggerAdapter(mockWindow);
    const emittedContexts: AnimationTriggerContext[] = [];

    adapter.subscribe((ctx) => emittedContexts.push(ctx));
    adapter.connect();

    const clickHandler = mockListeners['click']?.[0];
    clickHandler?.({ target: mockDocument.body });

    const clickCtx = emittedContexts[emittedContexts.length - 1];
    expect(clickCtx.isClicked).toBe(true);
  });

  it('handles IntersectionObserver callbacks and updates visibility ratio', () => {
    const adapter = new BrowserTriggerAdapter(mockWindow);
    const emittedContexts: AnimationTriggerContext[] = [];

    adapter.subscribe((ctx) => emittedContexts.push(ctx));
    adapter.connect();

    expect(observerCallback).not.toBeNull();
    observerCallback?.([{ intersectionRatio: 0.75 }]);

    const ioCtx = emittedContexts[emittedContexts.length - 1];
    expect(ioCtx.visibilityRatio).toBe(0.75);
  });

  it('disconnects and cleans up all event listeners', () => {
    const adapter = new BrowserTriggerAdapter(mockWindow);
    adapter.connect();
    adapter.disconnect();

    expect(mockDocument.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(mockDocument.removeEventListener).toHaveBeenCalledWith('pointerover', expect.any(Function), true);
    expect(mockDocument.removeEventListener).toHaveBeenCalledWith('pointerout', expect.any(Function), true);
    expect(mockDocument.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(mockObserverInstance.disconnect).toHaveBeenCalled();
  });
});
