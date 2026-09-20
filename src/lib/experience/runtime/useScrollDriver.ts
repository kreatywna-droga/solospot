/**
 * useScrollDriver.ts — Dual-Mode Scroll & Storytelling Progress Driver
 *
 * Supports:
 *   1. Simulated Scroll Mode (driven by scrollProgress prop in ExperienceDetailModal)
 *   2. Real Scroll-Driven Mode (in Published & Canvas viewport via IntersectionObserver + RAF)
 *
 * Mutates CSS custom properties:
 *   - --scene-progress: [0.0, 1.0]
 *   - --horizontal-offset: percentage / px offset for horizontal showcase
 *   - --story-step: [0, steps - 1]
 */

import { useState, useEffect, useRef } from 'react';
import type { ScrollDriverConfig } from '../ExperienceRuntimeTypes';

interface UseScrollDriverOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: ScrollDriverConfig;
  simulatedProgress?: number; // 0 to 100
}

export function useScrollDriver({
  containerRef,
  config,
  simulatedProgress,
}: UseScrollDriverOptions) {
  const [effectiveProgress, setEffectiveProgress] = useState(0);
  const steps = config?.steps ?? 3;
  const horizontalFactor = config?.horizontalFactor ?? 1.0;
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !config || config.type === 'none') {
      if (el) {
        el.style.setProperty('--scene-progress', '0');
        el.style.setProperty('--horizontal-offset', '0%');
        el.style.setProperty('--story-step', '0');
      }
      return;
    }

    const applyProgress = (normProgress: number) => {
      const p = Math.max(0, Math.min(1, normProgress));
      setEffectiveProgress(p);

      const stepIndex = Math.min(steps - 1, Math.floor(p * steps));
      const horizOffset = (-p * (steps - 1) * 100 * horizontalFactor).toFixed(2);

      el.style.setProperty('--scene-progress', p.toFixed(3));
      el.style.setProperty('--horizontal-offset', `${horizOffset}%`);
      el.style.setProperty('--story-step', `${stepIndex}`);
    };

    // 1. Simulated mode takes precedence if provided (e.g. Detail Modal slider)
    if (simulatedProgress !== undefined) {
      applyProgress(simulatedProgress / 100);
      return;
    }

    // 2. Real viewport scroll calculation
    const handleScroll = () => {
      if (rafIdRef.current) return;

      rafIdRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || 800;

        // Progress 0 when top enters bottom of viewport, 1 when bottom leaves top
        const totalDistance = windowHeight + rect.height;
        const currentDistance = windowHeight - rect.top;
        const rawProgress = currentDistance / totalDistance;

        applyProgress(rawProgress);
        rafIdRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial measurement

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [containerRef, config, simulatedProgress, steps, horizontalFactor]);

  const activeStep = Math.min(steps - 1, Math.floor(effectiveProgress * steps));

  return {
    scrollProgress: effectiveProgress,
    activeStep,
  };
}
