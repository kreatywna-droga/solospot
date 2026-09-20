/**
 * useSpringMotion.ts — Spring-Based Motion Presets for Physical UI Behavior
 *
 * Provides spring-physics motion presets that can be applied to any element:
 *   - Soft: gentle entrance, low stiffness
 *   - Smooth: balanced spring, default
 *   - Snappy: quick response, high stiffness
 *   - Heavy: slow settle, high damping
 *   - Elastic: overshooting bounce
 *
 * Uses the existing builder-core spring math via CSS custom properties
 * and the SharedRenderLoop for frame-by-frame updates.
 *
 * Architecture:
 *   trigger → spring simulation → CSS custom properties → GPU-accelerated transform
 *   Zero React state updates during animation.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { subscribe, updateSubscription } from './SharedRenderLoop';

export type SpringPreset = 'soft' | 'smooth' | 'snappy' | 'heavy' | 'elastic';

export interface SpringConfig {
  preset: SpringPreset;
  stiffness?: number;
  damping?: number;
  mass?: number;
  initialVelocity?: number;
}

interface SpringParams {
  stiffness: number;
  damping: number;
  mass: number;
}

const PRESETS: Record<SpringPreset, SpringParams> = {
  soft: { stiffness: 120, damping: 20, mass: 1 },
  smooth: { stiffness: 180, damping: 22, mass: 1 },
  snappy: { stiffness: 350, damping: 25, mass: 0.8 },
  heavy: { stiffness: 100, damping: 30, mass: 1.5 },
  elastic: { stiffness: 200, damping: 12, mass: 1 },
};

function springStep(
  current: number,
  target: number,
  velocity: number,
  params: SpringParams,
  dt: number
): { value: number; velocity: number; settled: boolean } {
  const { stiffness, damping, mass } = params;
  const displacement = current - target;
  const springForce = -stiffness * displacement;
  const dampingForce = -damping * velocity;
  const acceleration = (springForce + dampingForce) / mass;
  const newVelocity = velocity + acceleration * dt;
  const newValue = current + newVelocity * dt;
  const settled = Math.abs(newVelocity) < 0.01 && Math.abs(displacement) < 0.01;
  return { value: settled ? target : newValue, velocity: settled ? 0 : newVelocity, settled };
}

export interface UseSpringMotionOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: SpringConfig;
  trigger?: 'mount' | 'hover' | 'scroll' | 'pointer' | 'manual';
  isActive?: boolean;
}

export interface UseSpringMotionReturn {
  springStyles: React.CSSProperties;
  triggerSpring: () => void;
  isSettled: boolean;
}

export function useSpringMotion({
  containerRef,
  config,
  trigger = 'mount',
  isActive = true,
}: UseSpringMotionOptions): UseSpringMotionReturn {
  const paramsRef = useRef<SpringParams>(
    config?.preset ? PRESETS[config.preset] : PRESETS.smooth
  );
  const stateRef = useRef({
    value: 0,
    velocity: 0,
    target: 1,
    settled: true,
  });
  const unsubRef = useRef<(() => void) | null>(null);
  const animatingRef = useRef(false);

  if (config?.stiffness !== undefined) paramsRef.current.stiffness = config.stiffness;
  if (config?.damping !== undefined) paramsRef.current.damping = config.damping;
  if (config?.mass !== undefined) paramsRef.current.mass = config.mass;

  const triggerSpring = useCallback(() => {
    stateRef.current.value = 0;
    stateRef.current.velocity = config?.initialVelocity ?? 5;
    stateRef.current.target = 1;
    stateRef.current.settled = false;
    animatingRef.current = true;

    const el = containerRef.current;
    if (!el) return;

    // Subscription is managed by the useEffect below
  }, [containerRef, config?.initialVelocity]);

  const tick = useCallback((frameTime: number, deltaTime: number) => {
    const el = containerRef.current;
    if (!el || !animatingRef.current || stateRef.current.settled) return;

    const dt = Math.min(deltaTime / 1000, 0.064);
    const result = springStep(
      stateRef.current.value,
      stateRef.current.target,
      stateRef.current.velocity,
      paramsRef.current,
      dt
    );

    stateRef.current.value = result.value;
    stateRef.current.velocity = result.velocity;
    stateRef.current.settled = result.settled;

    const scale = 0.8 + result.value * 0.2;
    const opacity = result.value;
    const translateY = (1 - result.value) * 20;

    el.style.setProperty('--spring-scale', scale.toFixed(4));
    el.style.setProperty('--spring-opacity', opacity.toFixed(4));
    el.style.setProperty('--spring-translate-y', `${translateY.toFixed(2)}px`);

    if (result.settled) {
      animatingRef.current = false;
    }
  }, [containerRef]);

  useEffect(() => {
    if (!isActive) return;

    const subId = `spring-${Math.random().toString(36).slice(2, 8)}`;
    unsubRef.current = subscribe(subId, tick, 90);

    if (trigger === 'mount') {
      triggerSpring();
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, [isActive, trigger, tick, triggerSpring]);

  return {
    springStyles: {
      transform: 'scale(var(--spring-scale, 1)) translateY(var(--spring-translate-y, 0px))',
      opacity: undefined,
    },
    triggerSpring,
    isSettled: stateRef.current.settled,
  };
}

export { PRESETS as SPRING_PRESETS };
