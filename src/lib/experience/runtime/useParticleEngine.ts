/**
 * useParticleEngine.ts — Particle Runtime (Canvas 2D)
 *
 * GPU-friendly particle system using Canvas 2D with rAF via SharedRenderLoop.
 * Supports:
 *   - Configurable count, size, speed, spread, depth, opacity, color
 *   - Pointer influence (attraction/repulsion)
 *   - Performance-tier-based count capping
 *   - Proper lifecycle management
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ParticleConfig, PointerSignal } from '../ExperienceRuntimeTypes';
import { createResourceTracker } from './ResourceTracker';
import { subscribe, updateSubscription } from './SharedRenderLoop';
import { getMaxParticleCount, detectPerformanceTier } from './PerformanceTier';

interface ParticleState {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  size: Float32Array;
  opacity: Float32Array;
  depth: Float32Array;
  count: number;
}

function createParticleState(count: number): ParticleState {
  return {
    x: new Float32Array(count),
    y: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
    size: new Float32Array(count),
    opacity: new Float32Array(count),
    depth: new Float32Array(count),
    count,
  };
}

function initParticles(state: ParticleState, config: ParticleConfig, width: number, height: number): void {
  const { count, size = 3, speed = 1, spread = 1, depth = 1 } = config;
  for (let i = 0; i < count; i++) {
    state.x[i] = Math.random() * width;
    state.y[i] = Math.random() * height;
    const angle = Math.random() * Math.PI * 2;
    const spd = (0.2 + Math.random() * 0.8) * speed;
    state.vx[i] = Math.cos(angle) * spd * spread;
    state.vy[i] = Math.sin(angle) * spd * spread;
    state.size[i] = (0.5 + Math.random()) * size;
    state.opacity[i] = 0.3 + Math.random() * 0.7;
    state.depth[i] = 0.3 + Math.random() * 0.7 * depth;
  }
}

function parseColor(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
    255,
  ];
}

export interface UseParticleEngineOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: ParticleConfig;
  pointerSignal?: React.RefObject<PointerSignal>;
  isPlaying?: boolean;
  reducedMotion?: boolean;
}

export function useParticleEngine({
  containerRef,
  config,
  pointerSignal,
  isPlaying = true,
  reducedMotion = false,
}: UseParticleEngineOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<ParticleState | null>(null);
  const subIdRef = useRef<string | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const trackerRef = useRef<ReturnType<typeof createResourceTracker> | null>(null);

  const setup = useCallback(() => {
    const container = containerRef.current;
    if (!container || !config || reducedMotion) return;

    const tier = detectPerformanceTier();
    const maxCount = getMaxParticleCount();
    const effectiveCount = tier === 'low'
      ? Math.min(config.count, maxCount)
      : tier === 'medium'
        ? Math.min(config.count, Math.floor(maxCount * 1.5))
        : Math.min(config.count, maxCount * 2);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w;
    canvas.height = h;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }

    const particles = createParticleState(effectiveCount);
    initParticles(particles, { ...config, count: effectiveCount }, w, h);

    canvasRef.current = canvas;
    ctxRef.current = ctx;
    particlesRef.current = particles;
    sizeRef.current = { w, h };

    trackerRef.current = createResourceTracker('particles');
    trackerRef.current.track('canvas-2d', () => {
      canvas.remove();
    });
  }, [containerRef, config, reducedMotion]);

  const render = useCallback(() => {
    const ctx = ctxRef.current;
    const particles = particlesRef.current;
    if (!ctx || !particles) return;

    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);

    const pColor = config?.color ? parseColor(config.color) : [255, 255, 255, 255];
    const pointerInfluence = config?.pointerInfluence ?? 0;
    const attractRepel = config?.attractRepel ?? 'none';
    const sig = pointerSignal?.current;
    const speed = config?.speed ?? 1;

    for (let i = 0; i < particles.count; i++) {
      // Pointer influence
      if (pointerInfluence > 0 && sig && sig.isHovered) {
        const ptrX = (sig.x * 0.5 + 0.5) * w;
        const ptrY = (sig.y * 0.5 + 0.5) * h;
        const dx = ptrX - particles.x[i];
        const dy = ptrY - particles.y[i];
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const force = (pointerInfluence * 50) / (dist * dist);

        if (attractRepel === 'attract') {
          particles.vx[i] += (dx / dist) * force;
          particles.vy[i] += (dy / dist) * force;
        } else if (attractRepel === 'repell') {
          particles.vx[i] -= (dx / dist) * force;
          particles.vy[i] -= (dy / dist) * force;
        }
      }

      // Update position
      particles.x[i] += particles.vx[i] * speed;
      particles.y[i] += particles.vy[i] * speed;

      // Wrap around edges
      if (particles.x[i] < -10) particles.x[i] = w + 10;
      if (particles.x[i] > w + 10) particles.x[i] = -10;
      if (particles.y[i] < -10) particles.y[i] = h + 10;
      if (particles.y[i] > h + 10) particles.y[i] = -10;

      // Damping
      particles.vx[i] *= 0.999;
      particles.vy[i] *= 0.999;

      // Draw
      const alpha = particles.opacity[i] * (particles.depth[i]);
      const s = particles.size[i] * (0.5 + particles.depth[i] * 0.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgba(${pColor[0]},${pColor[1]},${pColor[2]},${alpha})`;
      ctx.beginPath();
      ctx.arc(particles.x[i], particles.y[i], s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [config, pointerSignal]);

  useEffect(() => {
    if (reducedMotion || !isPlaying) return;
    setup();
    const subId = `particles-${Math.random().toString(36).slice(2, 8)}`;
    subIdRef.current = subId;
    subscribe(subId, render, 40);

    return () => {
      if (subIdRef.current) updateSubscription(subIdRef.current, { active: false });
      trackerRef.current?.disposeAll();
      canvasRef.current?.remove();
      canvasRef.current = null;
      ctxRef.current = null;
      particlesRef.current = null;
    };
  }, [setup, render, isPlaying, reducedMotion]);

  return { canvasRef };
}
