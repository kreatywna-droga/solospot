/**
 * useTextMotion.ts — Text Reveal Animation Runtime
 *
 * Provides text animation presets:
 *   - word: reveal word by word
 *   - character: reveal character by character
 *   - line: reveal line by line
 *   - fade: simple opacity fade-in
 *   - slide: slide up + fade
 *   - blur: blur-to-sharp reveal
 *
 * Uses SharedRenderLoop for frame-by-frame updates.
 * Mutates CSS custom properties for GPU-accelerated transforms.
 *
 * Safety:
 *   - Text never clips, overlaps, or breaks section geometry
 *   - Stagger delays are pre-calculated, not computed per frame
 *   - Respects reduced-motion by skipping animation
 */

'use client';

import { useEffect, useRef, useMemo } from 'react';
import { subscribe, updateSubscription } from './SharedRenderLoop';

export type TextRevealType = 'word' | 'character' | 'line' | 'fade' | 'slide' | 'blur' | 'none';

export interface TextMotionConfig {
  type: TextRevealType;
  speed?: number;
  stagger?: number;
  delay?: number;
  intensity?: number;
}

interface RevealSegment {
  el: HTMLElement;
  delay: number;
  originalDisplay: string;
  originalVisibility: string;
}

function splitTextIntoSegments(el: HTMLElement, type: TextRevealType): string[] {
  const text = el.textContent || '';
  if (type === 'character') {
    return text.split('').map(c => c === ' ' ? '\u00A0' : c);
  }
  if (type === 'word') {
    return text.split(/\s+/).filter(Boolean);
  }
  return text.split('\n').filter(Boolean);
}

function wrapSegments(el: HTMLElement, segments: string[], type: TextRevealType): HTMLElement[] {
  const tag = type === 'line' ? 'div' : 'span';
  const display = type === 'line' ? 'block' : 'inline-block';

  el.textContent = '';
  const wrappers: HTMLElement[] = [];

  for (let i = 0; i < segments.length; i++) {
    const wrapper = document.createElement(tag);
    wrapper.textContent = segments[i];
    wrapper.style.cssText = `
      display: ${display};
      will-change: transform, opacity, filter;
      transition: none;
    `;
    wrapper.dataset.revealIndex = String(i);
    el.appendChild(wrapper);
    wrappers.push(wrapper);

    if (type === 'word' && i < segments.length - 1) {
      const space = document.createTextNode(' ');
      el.appendChild(space);
    }
  }

  return wrappers;
}

export interface UseTextMotionOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: TextMotionConfig;
  isPlaying?: boolean;
  reducedMotion?: boolean;
}

export function useTextMotion({
  containerRef,
  config,
  isPlaying = true,
  reducedMotion = false,
}: UseTextMotionOptions) {
  const segmentsRef = useRef<RevealSegment[]>([]);
  const subIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const configRef = useRef(config);

  configRef.current = config;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !config || config.type === 'none' || reducedMotion || !isPlaying) return;

    const revealElements = el.querySelectorAll('[data-text-reveal]');
    if (revealElements.length === 0) {
      const textEls = el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
      const segments: RevealSegment[] = [];

      textEls.forEach((textEl) => {
        const htmlEl = textEl as HTMLElement;
        const textParts = splitTextIntoSegments(htmlEl, config.type);
        if (textParts.length <= 1 && config.type !== 'fade' && config.type !== 'slide' && config.type !== 'blur') return;

        const wrappers = wrapSegments(htmlEl, textParts, config.type);
        const baseDelay = config.delay ?? 0;
        const staggerMs = (config.stagger ?? 0.05) * 1000;

        wrappers.forEach((wrapper, i) => {
          segments.push({
            el: wrapper,
            delay: baseDelay + i * staggerMs,
            originalDisplay: wrapper.style.display,
            originalVisibility: wrapper.style.visibility,
          });
          wrapper.style.opacity = '0';
          wrapper.style.transform = getHiddenTransform(config.type, config.intensity ?? 1);
          wrapper.style.filter = config.type === 'blur' ? 'blur(8px)' : 'none';
        });
      });

      segmentsRef.current = segments;
      startTimeRef.current = performance.now();

      const speed = config.speed ?? 1.0;
      const duration = 600 / speed;

      const subId = `text-motion-${Math.random().toString(36).slice(2, 8)}`;
      subIdRef.current = subId;

      subscribe(subId, (frameTime) => {
        const elapsed = frameTime - startTimeRef.current;
        const segs = segmentsRef.current;

        for (const seg of segs) {
          const progress = Math.max(0, Math.min(1, (elapsed - seg.delay) / duration));
          const eased = easeOutCubic(progress);

          seg.el.style.opacity = String(eased);
          seg.el.style.transform = getVisibleTransform(config.type, eased, config.intensity ?? 1);
          seg.el.style.filter = config.type === 'blur'
            ? `blur(${(1 - eased) * 8}px)`
            : 'none';
        }

        if (segs.every(s => {
          const p = Math.max(0, Math.min(1, (elapsed - s.delay) / duration));
          return p >= 1;
        })) {
          updateSubscription(subId, { active: false });
        }
      }, 80);
    }

    return () => {
      if (subIdRef.current) {
        updateSubscription(subIdRef.current, { active: false });
      }
      segmentsRef.current = [];
    };
  }, [containerRef, config, isPlaying, reducedMotion]);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function getHiddenTransform(type: TextRevealType, intensity: number): string {
  switch (type) {
    case 'slide': return `translateY(${20 * intensity}px)`;
    case 'character':
    case 'word':
    case 'line': return `translateY(${12 * intensity}px)`;
    default: return 'none';
  }
}

function getVisibleTransform(type: TextRevealType, progress: number, intensity: number): string {
  switch (type) {
    case 'slide': return `translateY(${(1 - progress) * 20 * intensity}px)`;
    case 'character':
    case 'word':
    case 'line': return `translateY(${(1 - progress) * 12 * intensity}px)`;
    default: return 'none';
  }
}
