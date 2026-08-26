/**
 * TimelineSnappingController.ts — Sprint S24 Unified Timeline Snapping Controller
 *
 * Pure headless snapping controller for timeline editing:
 * - Grid time snapping
 * - FPS Frame snapping (24/30/60 fps)
 * - Timeline Marker snapping
 * - Playhead position snapping
 * - Clip boundary snapping
 * - Configurable magnetic threshold (1ms to 100ms)
 *
 * Delegates directly to TimelineSnapEngine and TimelineNavigation.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { TimelineMarker } from './TimelineNavigation';
import {
  DEFAULT_SNAP_ENGINE_CONFIG,
  resolveSnapTime,
  SnapEngineConfig,
  SnapResult,
  SnapTarget,
} from './TimelineSnapEngine';

export interface ExtendedTimelineSnapConfig extends SnapEngineConfig {
  readonly snapToFpsFrame: boolean;
  readonly fps: 24 | 30 | 60;
}

export const DEFAULT_EXTENDED_SNAP_CONFIG: ExtendedTimelineSnapConfig = {
  ...DEFAULT_SNAP_ENGINE_CONFIG,
  snapToFpsFrame: true,
  fps: 60,
};

export class TimelineSnappingController {
  /**
   * Resolves optimal snapped time (ms) for raw input time against active timeline snapping targets.
   */
  public static snapTime(
    rawTimeMs: number,
    timeline?: AnimationTimeline | null,
    markers: ReadonlyArray<TimelineMarker> = [],
    playheadTimeMs?: number | null,
    customConfig?: Partial<ExtendedTimelineSnapConfig>
  ): SnapResult {
    const config: ExtendedTimelineSnapConfig = {
      ...DEFAULT_EXTENDED_SNAP_CONFIG,
      ...customConfig,
    };

    const targets: SnapTarget[] = [];

    // 1. Add Marker Targets
    if (config.snapToMarkers && markers.length > 0) {
      for (const m of markers) {
        targets.push({
          id: `marker-${m.id}`,
          type: 'marker',
          timeMs: m.timeMs,
          priority: 2,
        });
      }
    }

    // 2. Add Playhead Target
    if (config.snapToPlayhead && playheadTimeMs !== undefined && playheadTimeMs !== null) {
      targets.push({
        id: `playhead-${playheadTimeMs}`,
        type: 'playhead',
        timeMs: playheadTimeMs,
        priority: 1,
      });
    }

    // 3. Add Clip & Keyframe Targets from timeline
    if (timeline) {
      for (const clip of timeline.clips) {
        if (config.snapToClipEdges) {
          const clipStart = clip.delay;
          const clipEnd = clip.delay + clip.duration;
          targets.push({ id: `clip-start-${clip.id}`, type: 'clip_edge', timeMs: clipStart, priority: 3 });
          targets.push({ id: `clip-end-${clip.id}`, type: 'clip_edge', timeMs: clipEnd, priority: 3 });
        }

        if (config.snapToKeyframes) {
          for (const track of clip.tracks) {
            for (const kf of track.keyframes) {
              const kfAbsTime = clip.delay + kf.timeOffset;
              targets.push({ id: `kf-${kf.id}`, type: 'keyframe', timeMs: kfAbsTime, priority: 4 });
            }
          }
        }
      }
    }

    // 4. Add FPS Frame Target if enabled
    if (config.snapToFpsFrame) {
      const frameDurationMs = 1000 / config.fps;
      const frameTime = Math.round(rawTimeMs / frameDurationMs) * frameDurationMs;
      targets.push({
        id: `fps-frame-${frameTime}`,
        type: 'grid',
        timeMs: frameTime,
        priority: 5,
      });
    }

    return resolveSnapTime(rawTimeMs, targets, config);
  }
}
