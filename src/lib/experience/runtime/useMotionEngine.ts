/**
 * useMotionEngine.ts — High-Performance CSS Animation & Motion Driver Hook
 *
 * Provides GPU-accelerated motion presets:
 *   - float: subtle vertical hovering
 *   - pulse: rhythmic scale & glow breathing
 *   - drift: slow multi-axis orbital drift
 *   - wave: continuous organic flowing motion
 *   - morph: organic liquid shape shifting
 */

import { useMemo } from 'react';
import type { MotionConfig } from '../ExperienceRuntimeTypes';

interface UseMotionEngineOptions {
  config?: MotionConfig;
  isPlaying?: boolean;
  reducedMotion?: boolean;
}

export function useMotionEngine({
  config,
  isPlaying = true,
  reducedMotion = false,
}: UseMotionEngineOptions) {
  const motionStyles = useMemo<React.CSSProperties>(() => {
    if (!config || config.type === 'none' || reducedMotion) {
      return {};
    }

    const speed = config.speed ?? 1.0;
    const intensity = config.intensity ?? 1.0;
    const playState = isPlaying ? 'running' : 'paused';

    switch (config.type) {
      case 'float':
        return {
          animation: `solospot-float ${Math.max(2, 6 / speed)}s ease-in-out infinite`,
          animationPlayState: playState,
          willChange: 'transform',
        };
      case 'pulse':
      case 'breathe':
        return {
          animation: `solospot-pulse ${Math.max(2, 4 / speed)}s ease-in-out infinite`,
          animationPlayState: playState,
          willChange: 'transform, opacity',
        };
      case 'drift':
      case 'orbit':
        return {
          animation: `solospot-drift ${Math.max(4, 12 / speed)}s linear infinite`,
          animationPlayState: playState,
          willChange: 'transform',
        };
      case 'wave':
        return {
          animation: `solospot-wave ${Math.max(3, 8 / speed)}s ease-in-out infinite alternate`,
          animationPlayState: playState,
          willChange: 'transform',
        };
      case 'morph':
        return {
          animation: `solospot-morph ${Math.max(4, 10 / speed)}s ease-in-out infinite alternate`,
          animationPlayState: playState,
          willChange: 'border-radius, transform',
        };
      default:
        return {};
    }
  }, [config, isPlaying, reducedMotion]);

  return { motionStyles };
}
