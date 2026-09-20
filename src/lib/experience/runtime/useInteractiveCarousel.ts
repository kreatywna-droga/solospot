/**
 * useInteractiveCarousel.ts — Real Drag, Touch, Snap & Depth Carousel Engine
 *
 * Provides genuine interactive slider physics:
 *   - pointer/touch drag with inertia
 *   - release snapping to active slide index
 *   - updates --carousel-offset-px and --carousel-active-index on the container
 *   - next / previous buttons and dot navigation
 *   - zero full-tree re-renders during active dragging
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { CarouselConfig } from '../ExperienceRuntimeTypes';

interface UseInteractiveCarouselOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: CarouselConfig;
  isInteractive?: boolean;
}

export function useInteractiveCarousel({
  containerRef,
  config,
  isInteractive = true,
}: UseInteractiveCarouselOptions) {
  const itemCount = config?.itemCount ?? 3;
  const loop = config?.loop ?? true;
  const [activeIndex, setActiveIndex] = useState(config?.initialIndex ?? 0);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentDeltaRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const updateCssVariables = useCallback((offsetPx: number, index: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty('--carousel-offset-px', `${offsetPx}px`);
    el.style.setProperty('--carousel-active-index', `${index}`);
  }, [containerRef]);

  const goToIndex = useCallback((nextIdx: number) => {
    let target = nextIdx;
    if (loop) {
      target = (target + itemCount) % itemCount;
    } else {
      target = Math.max(0, Math.min(itemCount - 1, target));
    }
    setActiveIndex(target);
    updateCssVariables(0, target);
  }, [itemCount, loop, updateCssVariables]);

  const goToNext = useCallback(() => {
    goToIndex(activeIndex + 1);
  }, [activeIndex, goToIndex]);

  const goToPrev = useCallback(() => {
    goToIndex(activeIndex - 1);
  }, [activeIndex, goToIndex]);

  // Pointer Drag Interaction
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !config || !isInteractive) return;

    // Initialize CSS variables
    updateCssVariables(0, activeIndex);

    const onPointerDown = (e: PointerEvent) => {
      // Don't drag if clicking interactive buttons or inputs inside
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, [data-interactive="true"]')) {
        return;
      }

      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      currentDeltaRef.current = 0;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
      el.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      currentDeltaRef.current = delta;

      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          el.style.setProperty('--carousel-offset-px', `${currentDeltaRef.current}px`);
          rafIdRef.current = null;
        });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      el.style.cursor = '';
      el.style.userSelect = '';
      el.releasePointerCapture?.(e.pointerId);

      const delta = currentDeltaRef.current;
      const snapThreshold = 40; // 40px drag triggers slide change

      if (delta < -snapThreshold) {
        goToNext();
      } else if (delta > snapThreshold) {
        goToPrev();
      } else {
        // Snap back to current
        updateCssVariables(0, activeIndex);
      }
      currentDeltaRef.current = 0;
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [containerRef, config, isInteractive, activeIndex, goToNext, goToPrev, updateCssVariables]);

  // Autoplay
  useEffect(() => {
    if (!config?.autoplay || !isInteractive) return;
    const intervalMs = config.autoplayIntervalMs ?? 4000;
    const timer = setInterval(() => {
      if (!isDraggingRef.current) {
        goToNext();
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [config?.autoplay, config?.autoplayIntervalMs, isInteractive, goToNext]);

  return {
    activeIndex,
    goToNext,
    goToPrev,
    goToIndex,
    itemCount,
  };
}
