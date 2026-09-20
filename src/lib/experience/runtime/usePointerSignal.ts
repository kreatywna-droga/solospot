/**
 * usePointerSignal.ts — Shared Pointer Signal Runtime
 *
 * Provides a mutable PointerSignal object that multiple engines can read
 * without triggering React re-renders. Updates happen via requestAnimationFrame
 * through the SharedRenderLoop.
 *
 * Architecture:
 *   pointermove → mutable signal → SharedRenderLoop → engines read signal → DOM/GPU update
 *   Zero React setState calls on pointer movement.
 *
 * The signal includes:
 *   - normalized X/Y (-1 to 1)
 *   - raw pixel coordinates
 *   - velocity (for momentum effects)
 *   - hover state
 */

import { useEffect, useRef, useCallback } from 'react';
import type { PointerSignal, PointerConfig } from '../ExperienceRuntimeTypes';
import { subscribe, updateSubscription } from './SharedRenderLoop';

export interface UsePointerSignalOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: PointerConfig;
  isInteractive?: boolean;
  reducedMotion?: boolean;
}

export interface UsePointerSignalReturn {
  signal: React.RefObject<PointerSignal>;
  isHovered: boolean;
}

export function usePointerSignal({
  containerRef,
  config,
  isInteractive = true,
  reducedMotion = false,
}: UsePointerSignalOptions): UsePointerSignalReturn {
  const signalRef = useRef<PointerSignal>({
    x: 0, y: 0, rawX: 0, rawY: 0,
    velocityX: 0, velocityY: 0, isHovered: false, lastUpdate: 0,
  });
  const isHoveredRef = useRef(false);
  const pendingCoords = useRef<{ x: number; y: number } | null>(null);
  const prevCoords = useRef<{ x: number; y: number; time: number } | null>(null);
  const subIdRef = useRef<string | null>(null);

  const commitFrame = useCallback(() => {
    if (!pendingCoords.current) return;
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const localX = pendingCoords.current.x - rect.left;
    const localY = pendingCoords.current.y - rect.top;
    const w = rect.width || 1;
    const h = rect.height || 1;

    const normX = Math.max(-1, Math.min(1, (localX / w) * 2 - 1));
    const normY = Math.max(-1, Math.min(1, (localY / h) * 2 - 1));

    const now = performance.now();
    let vx = 0;
    let vy = 0;
    if (prevCoords.current) {
      const dt = now - prevCoords.current.time;
      if (dt > 0) {
        vx = (normX - prevCoords.current.x) / (dt / 16.67);
        vy = (normY - prevCoords.current.y) / (dt / 16.67);
      }
    }
    prevCoords.current = { x: normX, y: normY, time: now };

    const sig = signalRef.current;
    sig.velocityX = vx;
    sig.velocityY = vy;
    sig.x = normX;
    sig.y = normY;
    sig.rawX = pendingCoords.current.x;
    sig.rawY = pendingCoords.current.y;
    sig.lastUpdate = now;
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !config || config.type === 'none' || !isInteractive || reducedMotion) {
      if (el) {
        el.style.setProperty('--pointer-x', '0');
        el.style.setProperty('--pointer-y', '0');
      }
      return;
    }

    const subId = `pointer-signal-${el.dataset.experienceId || Math.random().toString(36).slice(2, 8)}`;
    subIdRef.current = subId;

    subscribe(subId, commitFrame, 100);

    const handleMove = (e: PointerEvent) => {
      pendingCoords.current = { x: e.clientX, y: e.clientY };
    };

    const handleEnter = () => {
      isHoveredRef.current = true;
      signalRef.current.isHovered = true;
    };

    const handleLeave = () => {
      isHoveredRef.current = false;
      signalRef.current.isHovered = false;
      signalRef.current.x = 0;
      signalRef.current.y = 0;
      signalRef.current.velocityX = 0;
      signalRef.current.velocityY = 0;
      prevCoords.current = null;
    };

    el.addEventListener('pointermove', handleMove, { passive: true });
    el.addEventListener('pointerenter', handleEnter, { passive: true });
    el.addEventListener('pointerleave', handleLeave, { passive: true });

    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerenter', handleEnter);
      el.removeEventListener('pointerleave', handleLeave);
      if (subIdRef.current) {
        updateSubscription(subIdRef.current, { active: false });
      }
    };
  }, [containerRef, config, isInteractive, reducedMotion, commitFrame]);

  return {
    signal: signalRef,
    isHovered: isHoveredRef.current,
  };
}
