/**
 * TimelineMultiSelection.ts — PM39 Multi-Selection & Marquee Selection (ETAP 3)
 *
 * Implements advanced keyframe selection interactions:
 *   - Box / Marquee selection (drag selection rectangle)
 *   - Ctrl/Cmd + click (toggle keyframe selection)
 *   - Shift + click (range selection between keyframes)
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { KeyframeRef } from './TimelineKeyframeAuthoring';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';

export interface MarqueeBox {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
}

export interface KeyframePosition {
  readonly ref: KeyframeRef;
  readonly x: number;
  readonly y: number;
}

export interface TimelineMultiSelectionState {
  readonly selectedKeyframeRefs: ReadonlyArray<KeyframeRef>;
  readonly primarySelectedRef: KeyframeRef | null;
}

export const INITIAL_MULTI_SELECTION_STATE: TimelineMultiSelectionState = {
  selectedKeyframeRefs: [],
  primarySelectedRef: null,
};

export function createMultiSelectionState(
  partial: Partial<TimelineMultiSelectionState> = {}
): TimelineMultiSelectionState {
  return {
    ...INITIAL_MULTI_SELECTION_STATE,
    ...partial,
  };
}

/**
 * Toggles selection of a keyframe (Ctrl/Cmd + click gesture).
 */
export function toggleKeyframeSelection(
  state: TimelineMultiSelectionState,
  ref: KeyframeRef
): TimelineMultiSelectionState {
  const exists = state.selectedKeyframeRefs.some(
    (k) => k.keyframeId === ref.keyframeId
  );

  const updatedRefs = exists
    ? state.selectedKeyframeRefs.filter((k) => k.keyframeId !== ref.keyframeId)
    : [...state.selectedKeyframeRefs, ref];

  return {
    selectedKeyframeRefs: updatedRefs,
    primarySelectedRef: exists
      ? updatedRefs[updatedRefs.length - 1] ?? null
      : ref,
  };
}

/**
 * Range selects keyframes between startRef and endRef on a track (Shift + click gesture).
 */
export function rangeSelectKeyframes(
  state: TimelineMultiSelectionState,
  timeline: AnimationTimeline,
  clipId: string,
  trackId: string,
  startRef: KeyframeRef,
  endRef: KeyframeRef
): TimelineMultiSelectionState {
  const clip = timeline.clips.find((c) => c.id === clipId);
  const track = clip?.tracks.find((t) => t.id === trackId);

  if (!track) return state;

  const startIndex = track.keyframes.findIndex((k) => k.id === startRef.keyframeId);
  const endIndex = track.keyframes.findIndex((k) => k.id === endRef.keyframeId);

  if (startIndex === -1 || endIndex === -1) return state;

  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);

  const rangeRefs: KeyframeRef[] = track.keyframes
    .slice(minIndex, maxIndex + 1)
    .map((kf) => ({ clipId, trackId, keyframeId: kf.id }));

  const mergedMap = new Map<string, KeyframeRef>();
  for (const r of state.selectedKeyframeRefs) {
    mergedMap.set(r.keyframeId, r);
  }
  for (const r of rangeRefs) {
    mergedMap.set(r.keyframeId, r);
  }

  return {
    selectedKeyframeRefs: Array.from(mergedMap.values()),
    primarySelectedRef: endRef,
  };
}

/**
 * Solves box/marquee selection by testing intersection between keyframe coordinates and marquee box.
 */
export function selectKeyframesInMarquee(
  state: TimelineMultiSelectionState,
  positions: ReadonlyArray<KeyframePosition>,
  box: MarqueeBox
): TimelineMultiSelectionState {
  const minX = Math.min(box.startX, box.endX);
  const maxX = Math.max(box.startX, box.endX);
  const minY = Math.min(box.startY, box.endY);
  const maxY = Math.max(box.startY, box.endY);

  const intersected = positions
    .filter((pos) => pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY)
    .map((pos) => pos.ref);

  return {
    selectedKeyframeRefs: intersected,
    primarySelectedRef: intersected[intersected.length - 1] ?? null,
  };
}
