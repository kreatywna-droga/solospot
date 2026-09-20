/**
 * usePostProcessing.ts — CSS-Based Post-Processing Effects Runtime
 *
 * Provides visual effects that don't require WebGL EffectComposer:
 *   - Vignette: dark cinematic overlay
 *   - Grain: film grain noise texture
 *   - Glow-border: luminous border effect
 *
 * Uses CSS filters and pseudo-elements for maximum compatibility.
 * Each effect is independently disableable.
 */

'use client';

import { useMemo } from 'react';
import type { VisualEffectType } from '../ExperienceRuntimeTypes';

export interface PostProcessingConfig {
  effects: VisualEffectType[];
  vignetteIntensity?: number;
  grainIntensity?: number;
  bloomIntensity?: number;
}

export interface UsePostProcessingOptions {
  config?: PostProcessingConfig;
  reducedMotion?: boolean;
}

export function usePostProcessing({ config, reducedMotion = false }: UsePostProcessingOptions) {
  const overlayStyles = useMemo(() => {
    if (!config || reducedMotion) return {};

    const styles: React.CSSProperties = {};
    const effects = config.effects || [];

    if (effects.includes('vignette')) {
      (styles as any).vignette = true;
    }
    if (effects.includes('grain')) {
      (styles as any).grain = true;
    }
    if (effects.includes('glow-border')) {
      (styles as any).glowBorder = true;
    }

    return styles;
  }, [config, reducedMotion]);

  const overlayElements = useMemo(() => {
    if (!config || reducedMotion) return null;

    const effects = config.effects || [];
    const elements: React.ReactNode[] = [];

    if (effects.includes('vignette')) {
      elements.push(
        <div
          key="vignette"
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${config.vignetteIntensity ?? 0.6}) 100%)`,
          }}
        />
      );
    }

    if (effects.includes('grain')) {
      elements.push(
        <div
          key="grain"
          className="absolute inset-0 pointer-events-none z-30 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
          }}
        />
      );
    }

    if (effects.includes('glow-border')) {
      elements.push(
        <div
          key="glow-border"
          className="absolute inset-0 pointer-events-none z-30 rounded-[inherit]"
          style={{
            boxShadow: `inset 0 0 30px rgba(139, 92, 246, 0.15), 0 0 40px rgba(139, 92, 246, 0.1)`,
          }}
        />
      );
    }

    return elements.length > 0 ? <>{elements}</> : null;
  }, [config, reducedMotion]);

  return { overlayStyles, overlayElements };
}
