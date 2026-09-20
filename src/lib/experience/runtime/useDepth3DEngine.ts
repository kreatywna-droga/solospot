/**
 * useDepth3DEngine.ts — Spatial 3D Perspective & Depth Layer Compositor Hook
 *
 * Configures:
 *   - perspective (default 1200px)
 *   - transformStyle: preserve-3d
 *   - translateZ depth separation across scene planes
 *   - optional stage reflection
 */

import { useMemo } from 'react';
import type { Scene3DConfig } from '../ExperienceRuntimeTypes';

interface UseDepth3DEngineOptions {
  config?: Scene3DConfig;
  reducedMotion?: boolean;
}

export function useDepth3DEngine({
  config,
  reducedMotion = false,
}: UseDepth3DEngineOptions) {
  const stageStyles = useMemo<React.CSSProperties>(() => {
    if (!config || config.transformStyle === 'flat' || reducedMotion) {
      return {};
    }

    const perspective = config.perspective ?? 1200;

    return {
      perspective: `${perspective}px`,
      perspectiveOrigin: '50% 50%',
      transformStyle: 'preserve-3d',
    };
  }, [config, reducedMotion]);

  return { stageStyles };
}
