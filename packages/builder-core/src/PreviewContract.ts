/**
 * PreviewContract — C6.1-C
 *
 * The channel contract between Builder UI and Preview Runtime.
 *
 * ARCHITECTURAL PRINCIPLE:
 *   The Preview MUST use the same Runtime Engine as Live/Publish.
 *   Builder → compile(BuilderDocument) → StoreConfig → RuntimeEngine(PREVIEW mode)
 *
 *   The PreviewRuntimeAdapter (C6.1-C) is the only code that imports
 *   runtime-core. It lives here in builder-core but is kept isolated
 *   in its own file so the rest of builder-core has zero runtime-core dep.
 *
 * Two channel implementations:
 *   createPostMessageChannel — for iframe-based preview (browser)
 *   createMemoryChannel      — for testing, SSR, and in-process preview
 *
 * DOM/BROWSER API EXCEPTION (A-117):
 *   builder-core enforces a strict NO DOM/Browser API rule. This file is
 *   a documented exception: createPostMessageChannel uses window.addEventListener
 *   and window.postMessage for iframe-based preview communication.
 *
 *   This exception exists because:
 *     1. The preview channel MUST be an architectural abstraction (PreviewChannel
 *        interface) that works in both browser and non-browser contexts.
 *     2. Moving this function to authoring-studio would leak preview-runtime
 *        concerns into the UI layer and break the builder-core/authoring-studio
 *        dependency boundary.
 *     3. The memory channel (createMemoryChannel) provides a DOM-free alternative
 *        for testing, SSR, and in-process preview.
 *
 *   RULE: Callers MUST ensure createPostMessageChannel is only invoked in
 *   browser contexts (i.e., where `window` is defined). This function is NOT
 *   safe for server-side rendering or Node.js environments.
 */

import { PreviewMessage, PreviewAck } from './PreviewMessage';

// ---------------------------------------------------------------------------
// Channel interface
// ---------------------------------------------------------------------------

export interface PreviewChannel {
  /** Send a message to the preview runtime. */
  send(message: PreviewMessage): void;

  /**
   * Subscribe to acknowledgements from the preview runtime.
   * Returns an unsubscribe function.
   */
  onAck(handler: (ack: PreviewAck) => void): () => void;

  /** Is the channel connected / ready? */
  readonly isReady: boolean;

  /** Tear down the channel. */
  destroy(): void;
}

// ---------------------------------------------------------------------------
// PostMessage channel — wraps window.postMessage for iframe preview
// ---------------------------------------------------------------------------

const PREVIEW_ORIGIN_KEY = '__wf_preview__';

/**
 * Creates a preview channel backed by `window.postMessage` for iframe-based
 * preview communication.
 *
 * @browserOnly — This function accesses DOM APIs (`window.addEventListener`,
 * `window.postMessage`) and MUST only be called in browser contexts.
 * For SSR, testing, or in-process preview, use {@link createMemoryChannel} instead.
 *
 * @param targetWindow - The target iframe's contentWindow to post messages to.
 * @param targetOrigin - Allowed origin for postMessage (default: '*' for dev).
 * @returns A PreviewChannel instance bound to the iframe's message channel.
 */
export function createPostMessageChannel(targetWindow: Window, targetOrigin = '*'): PreviewChannel {
  const ackHandlers = new Set<(ack: PreviewAck) => void>();
  let destroyed = false;

  const handleMessage = (event: MessageEvent) => {
    if (destroyed) return;
    if (!event.data || event.data.__source !== PREVIEW_ORIGIN_KEY) return;
    const ack = event.data as PreviewAck;
    ackHandlers.forEach(h => h(ack));
  };

  window.addEventListener('message', handleMessage);

  return {
    get isReady() {
      return !destroyed && !!targetWindow;
    },

    send(message) {
      if (destroyed) return;
      targetWindow.postMessage({ ...message, __source: PREVIEW_ORIGIN_KEY }, targetOrigin);
    },

    onAck(handler) {
      ackHandlers.add(handler);
      return () => ackHandlers.delete(handler);
    },

    destroy() {
      destroyed = true;
      ackHandlers.clear();
      window.removeEventListener('message', handleMessage);
    },
  };
}

// ---------------------------------------------------------------------------
// Memory channel — for testing and in-process preview
// ---------------------------------------------------------------------------

export interface MemoryChannelPair {
  readonly builderChannel: PreviewChannel;
  /** The runtime side: subscribe to incoming messages, send acks back. */
  readonly runtimeSide: {
    onMessage: (handler: (msg: PreviewMessage) => void) => () => void;
    sendAck: (ack: PreviewAck) => void;
  };
}

export function createMemoryChannel(): MemoryChannelPair {
  const ackHandlers = new Set<(ack: PreviewAck) => void>();
  const msgHandlers = new Set<(msg: PreviewMessage) => void>();
  let destroyed = false;

  const builderChannel: PreviewChannel = {
    get isReady() {
      return !destroyed;
    },

    send(message) {
      if (destroyed) return;
      msgHandlers.forEach(h => h(message));
    },

    onAck(handler) {
      ackHandlers.add(handler);
      return () => ackHandlers.delete(handler);
    },

    destroy() {
      destroyed = true;
      ackHandlers.clear();
      msgHandlers.clear();
    },
  };

  const runtimeSide = {
    onMessage(handler: (msg: PreviewMessage) => void) {
      msgHandlers.add(handler);
      return () => msgHandlers.delete(handler);
    },

    sendAck(ack: PreviewAck) {
      ackHandlers.forEach(h => h(ack));
    },
  };

  return { builderChannel, runtimeSide };
}
