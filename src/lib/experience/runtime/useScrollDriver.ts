/**
 * useScrollDriver.ts — Enhanced Scroll & Storytelling Progress Driver v2.0
 *
 * Supports:
 *   1. Simulated Scroll Mode (driven by scrollProgress prop)
 *   2. Real Scroll-Driven Mode (IntersectionObserver + RAF)
 *   3. Parallax Depth (multi-plane scroll ratio)
 *   4. Timeline Scrub (element-bound progress)
 *
 * Mutates CSS custom properties:
 *   - --scene-progress: [0.0, 1.0]
 *   - --horizontal-offset: percentage for horizontal showcase
 *   - --story-step: [0, steps - 1]
 *   - --parallax-depth: parallax displacement
 *   - --timeline-progress: scrub progress for timeline-bound elements
 *   - --scroll-velocity: scroll speed for velocity-based effects
 *   - --scroll-direction: 1 (down) or -1 (up)
 */

import { useState, useEffect, useRef } from 'react';
import type { ScrollDriverConfig } from '../ExperienceRuntimeTypes';

interface UseScrollDriverOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: ScrollDriverConfig;
  simulatedProgress?: number;
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
  const prevScrollRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !config || config.type === 'none') {
      if (el) {
        el.style.setProperty('--scene-progress', '0');
        el.style.setProperty('--horizontal-offset', '0%');
        el.style.setProperty('--story-step', '0');
        el.style.setProperty('--parallax-depth', '0px');
        el.style.setProperty('--timeline-progress', '0');
        el.style.setProperty('--scroll-velocity', '0');
        el.style.setProperty('--scroll-direction', '1');
      }
      return;
    }

    const applyProgress = (normProgress: number, isRealScroll = false) => {
      const p = Math.max(0, Math.min(1, normProgress));
      setEffectiveProgress(p);

      const stepIndex = Math.min(steps - 1, Math.floor(p * steps));
      const horizOffset = (-p * (steps - 1) * 100 * horizontalFactor).toFixed(2);

      el.style.setProperty('--scene-progress', p.toFixed(3));
      el.style.setProperty('--horizontal-offset', `${horizOffset}%`);
      el.style.setProperty('--story-step', `${stepIndex}`);
      el.style.setProperty('--timeline-progress', p.toFixed(3));

      if (isRealScroll) {
        const scrollY = window.scrollY || 0;
        const delta = scrollY - prevScrollRef.current;
        velocityRef.current = delta;
        prevScrollRef.current = scrollY;

        el.style.setProperty('--scroll-velocity', velocityRef.current.toFixed(2));
        el.style.setProperty('--scroll-direction', delta >= 0 ? '1' : '-1');
      }

      // Parallax depth: elements deeper in the scene move slower
      const parallaxDisplacement = (1 - p) * 60;
      el.style.setProperty('--parallax-depth', `${parallaxDisplacement.toFixed(1)}px`);
    };

    if (simulatedProgress !== undefined) {
      applyProgress(simulatedProgress / 100);
      return;
    }

    const handleScroll = () => {
      if (rafIdRef.current) return;

      rafIdRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || 800;
        const totalDistance = windowHeight + rect.height;
        const currentDistance = windowHeight - rect.top;
        const rawProgress = currentDistance / totalDistance;

        applyProgress(rawProgress, true);
        rafIdRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

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
    scrollVelocity: velocityRef.current,
    scrollDirection: velocityRef.current >= 0 ? 1 : -1,
  };
}
