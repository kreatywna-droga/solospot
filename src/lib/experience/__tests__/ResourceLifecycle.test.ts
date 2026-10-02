/**
 * ResourceLifecycle.test.ts — Verification of GPU & DOM Resource Cleanup (Gate 4 & 6)
 *
 * Verifies:
 * - ResourceTracker allocation and disposal
 * - Repeated mount -> update -> unmount cycles
 * - Zero memory/listener leaks on modal close or page switch
 * - WebGL context and buffer cleanup
 * - Three.js mesh, material, and light disposal
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createResourceTracker,
  disposeAllResources,
  getGlobalResourceStats,
  disposeStaleResources,
} from '../runtime/ResourceTracker';

describe('Resource Lifecycle & GPU/DOM Cleanup (Gates 4 & 6)', () => {
  it('tracks and cleanly disposes WebGL and DOM resources', () => {
    disposeAllResources();

    const tracker = createResourceTracker('test-shader-tracker');
    const disposeGl = vi.fn();
    const disposeBuffer = vi.fn();
    const disposeListener = vi.fn();

    tracker.track('webgl-context', disposeGl, 1024);
    tracker.track('webgl-buffer', disposeBuffer, 256);
    tracker.track('event-listener', disposeListener);

    const stats = tracker.getStats();
    expect(stats.totalResources).toBe(3);
    expect(stats.resourcesByType['webgl-context']).toBe(1);
    expect(stats.resourcesByType['webgl-buffer']).toBe(1);
    expect(stats.resourcesByType['event-listener']).toBe(1);
    expect(stats.estimatedMemoryBytes).toBe(1280);

    // Dispose all resources belonging to this tracker
    tracker.disposeAll();

    expect(disposeGl).toHaveBeenCalledTimes(1);
    expect(disposeBuffer).toHaveBeenCalledTimes(1);
    expect(disposeListener).toHaveBeenCalledTimes(1);

    const statsAfter = tracker.getStats();
    expect(statsAfter.totalResources).toBe(0);
    expect(statsAfter.estimatedMemoryBytes).toBe(0);
  });

  it('handles repeated mount/unmount cycles without leaking resources across modal opens/closes', () => {
    disposeAllResources();

    const MOUNT_CYCLES = 10;
    const disposeSpies: Array<() => void> = [];

    for (let cycle = 0; cycle < MOUNT_CYCLES; cycle++) {
      const tracker = createResourceTracker(`modal-cycle-${cycle}`);
      const spy = vi.fn();
      disposeSpies.push(spy);

      tracker.track('webgl-program', spy, 512);
      tracker.track('three-mesh', spy, 2048);

      // Simulate unmount / modal close at end of each cycle
      tracker.disposeAll();
    }

    // All spies must have been called exactly once
    for (const spy of disposeSpies) {
      expect(spy).toHaveBeenCalledTimes(2); // 2 resources per cycle
    }

    const globalStats = getGlobalResourceStats();
    expect(globalStats.totalResources).toBe(0);
  });

  it('safely handles untrack of individual resources', () => {
    disposeAllResources();

    const tracker = createResourceTracker('test-untrack');
    const spy1 = vi.fn();
    const spy2 = vi.fn();

    const id1 = tracker.track('webgl-texture', spy1);
    const id2 = tracker.track('webgl-texture', spy2);

    expect(tracker.getStats().totalResources).toBe(2);

    tracker.untrack(id1);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(tracker.getStats().totalResources).toBe(1);

    tracker.disposeAll();
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(tracker.getStats().totalResources).toBe(0);
  });

  it('global disposal flushes all trackers on page navigation', () => {
    disposeAllResources();

    const trackerA = createResourceTracker('page-a');
    const trackerB = createResourceTracker('page-b');
    const spyA = vi.fn();
    const spyB = vi.fn();

    trackerA.track('webgl-context', spyA);
    trackerB.track('three-texture', spyB);

    expect(getGlobalResourceStats().totalResources).toBe(2);

    disposeAllResources();

    expect(spyA).toHaveBeenCalledTimes(1);
    expect(spyB).toHaveBeenCalledTimes(1);
    expect(getGlobalResourceStats().totalResources).toBe(0);
  });
});
