/**
 * SharedRenderLoop.ts — Single rAF Loop Shared Across All Visual Engines
 *
 * Guarantees:
 *   - ONE requestAnimationFrame loop active at a time
 *   - Multiple engines register callbacks, all fire in the same frame
 *   - Priority ordering (higher priority = called first)
 *   - Auto-pause when no subscribers exist
 *   - Frame timing exposed for performance monitoring
 *
 * Architecture:
 *   pointer/scroll → mutable runtime signal → SharedRenderLoop → DOM/GPU update
 *   NOT: pointer/scroll → React setState → full tree re-render
 */

export type RenderCallback = (frameTime: number, deltaTime: number) => void;

export interface RenderSubscription {
  id: string;
  priority: number;
  callback: RenderCallback;
  active: boolean;
}

interface SharedRenderLoopState {
  rafId: number | null;
  subscriptions: Map<string, RenderSubscription>;
  lastFrameTime: number;
  running: boolean;
  frameCount: number;
}

const state: SharedRenderLoopState = {
  rafId: null,
  subscriptions: new Map(),
  lastFrameTime: 0,
  running: false,
  frameCount: 0,
};

function tick(now: number): void {
  const deltaTime = state.lastFrameTime > 0 ? now - state.lastFrameTime : 16.67;
  state.lastFrameTime = now;
  state.frameCount++;

  const sorted = Array.from(state.subscriptions.values())
    .filter(s => s.active)
    .sort((a, b) => b.priority - a.priority);

  for (const sub of sorted) {
    sub.callback(now, deltaTime);
  }

  if (state.subscriptions.size > 0) {
    state.rafId = requestAnimationFrame(tick);
  } else {
    state.running = false;
    state.rafId = null;
  }
}

function startLoop(): void {
  if (state.running) return;
  state.running = true;
  state.lastFrameTime = 0;
  state.rafId = requestAnimationFrame(tick);
}

function stopLoop(): void {
  if (state.rafId !== null) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
  state.running = false;
}

/**
 * Subscribe a callback to the shared render loop.
 * Returns an unsubscribe function.
 */
export function subscribe(
  id: string,
  callback: RenderCallback,
  priority: number = 0
): () => void {
  state.subscriptions.set(id, {
    id,
    priority,
    callback,
    active: true,
  });

  startLoop();

  return () => {
    state.subscriptions.delete(id);
    if (state.subscriptions.size === 0) {
      stopLoop();
    }
  };
}

/**
 * Update subscription priority or active state without re-subscribing.
 */
export function updateSubscription(
  id: string,
  updates: Partial<Pick<RenderSubscription, 'priority' | 'active' | 'callback'>>
): void {
  const sub = state.subscriptions.get(id);
  if (sub) {
    if (updates.priority !== undefined) sub.priority = updates.priority;
    if (updates.active !== undefined) sub.active = updates.active;
    if (updates.callback !== undefined) sub.callback = updates.callback;
  }
}

/**
 * Get current loop statistics for performance monitoring.
 */
export function getLoopStats(): {
  activeSubscribers: number;
  totalSubscribers: number;
  running: boolean;
  frameCount: number;
  lastFrameTime: number;
} {
  const active = Array.from(state.subscriptions.values()).filter(s => s.active).length;
  return {
    activeSubscribers: active,
    totalSubscribers: state.subscriptions.size,
    running: state.running,
    frameCount: state.frameCount,
    lastFrameTime: state.lastFrameTime,
  };
}

/**
 * Force-stop the loop and clear all subscriptions.
 * Use for cleanup on navigation or unmount.
 */
export function destroyLoop(): void {
  stopLoop();
  state.subscriptions.clear();
  state.frameCount = 0;
}
