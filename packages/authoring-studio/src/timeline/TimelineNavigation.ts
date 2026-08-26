/**
 * TimelineNavigation.ts — PM39 Timeline Navigation & Snapping Engine (ETAP 4)
 *
 * Provides viewport navigation (zoom, pan, scroll), timeline markers management,
 * and grid/marker/keyframe snapping calculations.
 *
 * ZERO impact on Playback Engine.
 * NO DOM, NO React, NO requestAnimationFrame.
 */

import type { TimelineViewport } from './TimelineViewport';
import { createTimelineViewport } from './TimelineViewport';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';

export interface TimelineMarker {
  readonly id: string;
  readonly timeMs: number;
  readonly label: string;
  readonly color?: string;
}

export interface TimelineNavigationState {
  readonly viewport: TimelineViewport;
  readonly markers: ReadonlyArray<TimelineMarker>;
  readonly snapToGrid: boolean;
  readonly snapToMarkers: boolean;
  readonly snapToKeyframes: boolean;
  readonly snapThresholdPx: number;
}

export const INITIAL_NAVIGATION_STATE: TimelineNavigationState = {
  viewport: createTimelineViewport(),
  markers: [],
  snapToGrid: true,
  snapToMarkers: true,
  snapToKeyframes: true,
  snapThresholdPx: 10,
};

export function createNavigationState(
  partial: Partial<TimelineNavigationState> = {}
): TimelineNavigationState {
  return {
    ...INITIAL_NAVIGATION_STATE,
    ...partial,
  };
}

/**
 * Zooms the timeline viewport centered around an anchor time (ms).
 */
export function zoomTimelineViewport(
  viewport: TimelineViewport,
  zoomFactor: number,
  anchorTimeMs: number = 0
): TimelineViewport {
  const nextPixelsPerMs = Math.max(0.01, Math.min(5, viewport.pixelsPerMs * zoomFactor));
  const currentScrollLeftMs = viewport.scrollX / Math.max(0.001, viewport.pixelsPerMs);
  const timeDelta = anchorTimeMs - currentScrollLeftMs;
  const newScrollLeftMs = Math.max(0, anchorTimeMs - timeDelta * (viewport.pixelsPerMs / nextPixelsPerMs));
  const newScrollX = Math.max(0, newScrollLeftMs * nextPixelsPerMs);

  return {
    ...viewport,
    pixelsPerMs: nextPixelsPerMs,
    scrollX: newScrollX,
  };
}

/**
 * Pans the timeline viewport by a delta time offset in ms.
 */
export function panTimelineViewport(
  viewport: TimelineViewport,
  deltaTimeMs: number
): TimelineViewport {
  return {
    ...viewport,
    scrollX: Math.max(0, viewport.scrollX + deltaTimeMs * viewport.pixelsPerMs),
  };
}

/**
 * Adds a timeline marker immutably.
 */
export function addTimelineMarker(
  markers: ReadonlyArray<TimelineMarker>,
  marker: TimelineMarker
): ReadonlyArray<TimelineMarker> {
  const filtered = markers.filter((m) => m.id !== marker.id);
  return [...filtered, marker].sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Removes a timeline marker immutably.
 */
export function removeTimelineMarker(
  markers: ReadonlyArray<TimelineMarker>,
  markerId: string
): ReadonlyArray<TimelineMarker> {
  return markers.filter((m) => m.id !== markerId);
}

/**
 * Calculates snapped time position based on grid interval, markers, and keyframe offsets.
 */
export function calculateSnappedTime(
  rawTimeMs: number,
  state: TimelineNavigationState,
  timeline?: AnimationTimeline | null
): { snappedTimeMs: number; isSnapped: boolean; snapSource: 'grid' | 'marker' | 'keyframe' | null } {
  const time = Math.max(0, rawTimeMs);
  const thresholdMs = state.snapThresholdPx / Math.max(0.001, state.viewport.pixelsPerMs);

  let bestSnapTime = time;
  let minDiff = Infinity;
  let snapSource: 'grid' | 'marker' | 'keyframe' | null = null;

  // 1. Check marker snapping
  if (state.snapToMarkers) {
    for (const marker of state.markers) {
      const diff = Math.abs(marker.timeMs - time);
      if (diff <= thresholdMs && diff < minDiff) {
        minDiff = diff;
        bestSnapTime = marker.timeMs;
        snapSource = 'marker';
      }
    }
  }

  // 2. Check keyframe snapping
  if (state.snapToKeyframes && timeline) {
    for (const clip of timeline.clips) {
      const clipStart = clip.delay;
      for (const track of clip.tracks) {
        for (const kf of track.keyframes) {
          const kfAbsTime = clipStart + kf.timeOffset;
          const diff = Math.abs(kfAbsTime - time);
          if (diff <= thresholdMs && diff < minDiff) {
            minDiff = diff;
            bestSnapTime = kfAbsTime;
            snapSource = 'keyframe';
          }
        }
      }
    }
  }

  // 3. Check grid snapping (e.g. 100ms grid steps)
  if (state.snapToGrid && minDiff === Infinity) {
    const gridStepMs = 100;
    const roundedGrid = Math.round(time / gridStepMs) * gridStepMs;
    const diff = Math.abs(roundedGrid - time);
    if (diff <= thresholdMs) {
      bestSnapTime = roundedGrid;
      snapSource = 'grid';
      minDiff = diff;
    }
  }

  return {
    snappedTimeMs: bestSnapTime,
    isSnapped: snapSource !== null,
    snapSource,
  };
}
