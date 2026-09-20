/**
 * usePointerEngine.ts — High-Performance Compositor-Driven Pointer Interaction Hook
 *
 * Updates CSS custom properties on the container directly via DOM refs and requestAnimationFrame:
 *   - --pointer-x: [-1, 1]
 *   - --pointer-y: [-1, 1]
 *   - --tilt-x: [-maxAngle, maxAngle]deg
 *   - --tilt-y: [-maxAngle, maxAngle]deg
 *   - --spotlight-x: 0% to 100%
 *   - --spotlight-y: 0% to 100%
 *
 * Guarantees ZERO full-tree React component re-renders on pointermove for 60fps performance!
 */

import { useEffect, useRef } from 'react';
import type { PointerConfig } from '../ExperienceRuntimeTypes';

interface UsePointerEngineOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: PointerConfig;
  isInteractive?: boolean;
  reducedMotion?: boolean;
}

export function usePointerEngine({
  containerRef,
  config,
  isInteractive = true,
  reducedMotion = false,
}: UsePointerEngineOptions) {
  const rafIdRef = useRef<number | null>(null);
  const pendingCoords = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !config || config.type === 'none' || !isInteractive || reducedMotion) {
      if (el) {
        // Reset properties to neutral state
        el.style.setProperty('--pointer-x', '0');
        el.style.setProperty('--pointer-y', '0');
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
        el.style.setProperty('--spotlight-x', '50%');
        el.style.setProperty('--spotlight-y', '50%');
      }
      return;
    }

    const maxAngle = config.maxAngle ?? 12;
    const strength = config.strength ?? 1.0;

    const commitPointerFrame = () => {
      if (!pendingCoords.current || !el) return;
      const { x, y, width, height } = pendingCoords.current;

      // Normalized coordinates: -1.0 to 1.0
      const normX = Math.max(-1, Math.min(1, (x / width) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, (y / height) * 2 - 1));

      // Calculate tilt angles (standard 3D physics: looking down tilts card forward)
      const tiltX = -normY * maxAngle * strength;
      const tiltY = normX * maxAngle * strength;

      // Spotlight coordinates: 0% to 100%
      const spotX = Math.round(((normX + 1) / 2) * 100);
      const spotY = Math.round(((normY + 1) / 2) * 100);

      el.style.setProperty('--pointer-x', normX.toFixed(3));
      el.style.setProperty('--pointer-y', normY.toFixed(3));
      el.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
      el.style.setProperty('--spotlight-x', `${spotX}%`);
      el.style.setProperty('--spotlight-y', `${spotY}%`);

      rafIdRef.current = null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      pendingCoords.current = {
        x: localX,
        y: localY,
        width: rect.width || 1,
        height: rect.height || 1,
      };

      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(commitPointerFrame);
      }
    };

    const handlePointerLeave = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      // Smooth reset transition
      el.style.transition = 'transform 0.4s ease-out';
      el.style.setProperty('--pointer-x', '0');
      el.style.setProperty('--pointer-y', '0');
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--spotlight-x', '50%');
      el.style.setProperty('--spotlight-y', '50%');

      setTimeout(() => {
        if (el) {
          el.style.transition = '';
        }
      }, 400);
    };

    el.addEventListener('pointermove', handlePointerMove, { passive: true });
    el.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerleave', handlePointerLeave);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [containerRef, config, isInteractive, reducedMotion]);
}
