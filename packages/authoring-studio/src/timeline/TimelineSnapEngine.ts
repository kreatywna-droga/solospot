/**
 * TimelineSnapEngine.ts — PM40 Advanced Timeline Snapping Engine (ETAP 2)
 *
 * DECISION-064: Snap Engine nie wykonuje operacji Runtime.
 *
 * Advanced multi-target magnetic snapping engine supporting:
 *   - Grid snap
 *   - Marker snap
 *   - Keyframe snap
 *   - Clip edge snap
 *   - Playhead snap
 *
 * ZERO Browser API, ZERO DOM, ZERO Runtime execution.
 */

export type SnapTargetType = 'grid' | 'marker' | 'keyframe' | 'clip_edge' | 'playhead';

export interface SnapTarget {
  readonly id: string;
  readonly type: SnapTargetType;
  readonly timeMs: number;
  readonly priority: number; // lower number = higher priority
}

export interface SnapResult {
  readonly snappedTimeMs: number;
  readonly isSnapped: boolean;
  readonly activeTarget: SnapTarget | null;
  readonly offsetDeltaMs: number;
}

export interface SnapEngineConfig {
  readonly magneticThresholdMs: number;
  readonly snapToGrid: boolean;
  readonly snapToMarkers: boolean;
  readonly snapToKeyframes: boolean;
  readonly snapToClipEdges: boolean;
  readonly snapToPlayhead: boolean;
  readonly gridIntervalMs: number;
}

export const DEFAULT_SNAP_ENGINE_CONFIG: SnapEngineConfig = {
  magneticThresholdMs: 15,
  snapToGrid: true,
  snapToMarkers: true,
  snapToKeyframes: true,
  snapToClipEdges: true,
  snapToPlayhead: true,
  gridIntervalMs: 100,
};

export function createSnapEngineConfig(
  partial: Partial<SnapEngineConfig> = {}
): SnapEngineConfig {
  return {
    ...DEFAULT_SNAP_ENGINE_CONFIG,
    ...partial,
  };
}

/**
 * Resolves optimal snap target for a given raw time based on magnetic threshold and priorities.
 */
export function resolveSnapTime(
  rawTimeMs: number,
  targets: ReadonlyArray<SnapTarget>,
  config: SnapEngineConfig = DEFAULT_SNAP_ENGINE_CONFIG
): SnapResult {
  const time = Math.max(0, rawTimeMs);
  const threshold = config.magneticThresholdMs;

  const validTargets: SnapTarget[] = [];

  // Add active targets according to config flags
  for (const t of targets) {
    if (
      (t.type === 'marker' && config.snapToMarkers) ||
      (t.type === 'keyframe' && config.snapToKeyframes) ||
      (t.type === 'clip_edge' && config.snapToClipEdges) ||
      (t.type === 'playhead' && config.snapToPlayhead)
    ) {
      validTargets.push(t);
    }
  }

  // Add grid target if enabled
  if (config.snapToGrid) {
    const gridTime = Math.round(time / config.gridIntervalMs) * config.gridIntervalMs;
    validTargets.push({
      id: `grid-${gridTime}`,
      type: 'grid',
      timeMs: gridTime,
      priority: 10,
    });
  }

  // Sort candidates by proximity and priority
  let bestTarget: SnapTarget | null = null;
  let minDistance = Infinity;

  for (const target of validTargets) {
    const dist = Math.abs(target.timeMs - time);
    if (dist <= threshold) {
      if (
        dist < minDistance ||
        (Math.abs(dist - minDistance) < 0.001 && target.priority < (bestTarget?.priority ?? Infinity))
      ) {
        minDistance = dist;
        bestTarget = target;
      }
    }
  }

  if (bestTarget) {
    return {
      snappedTimeMs: bestTarget.timeMs,
      isSnapped: true,
      activeTarget: bestTarget,
      offsetDeltaMs: bestTarget.timeMs - time,
    };
  }

  return {
    snappedTimeMs: time,
    isSnapped: false,
    activeTarget: null,
    offsetDeltaMs: 0,
  };
}
