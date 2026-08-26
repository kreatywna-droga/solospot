/**
 * TimelineSelectionController.ts — Sprint S24 Keyframe Selection UX Controller
 *
 * Pure headless controller orchestrating keyframe selection:
 * - single keyframe selection
 * - multi-keyframe selection (toggle with Ctrl/Cmd)
 * - range keyframe selection (Shift + click between keyframes on a track)
 * - marquee drag box selection
 * - select all / deselect all keyframes
 * - selection persistence across document mutations
 *
 * Delegates directly to TimelineMultiSelection and TimelineSelection models.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { KeyframeRef } from './TimelineKeyframeAuthoring';
import {
  createMultiSelectionState,
  KeyframePosition,
  MarqueeBox,
  rangeSelectKeyframes,
  selectKeyframesInMarquee,
  TimelineMultiSelectionState,
  toggleKeyframeSelection,
} from './TimelineMultiSelection';

export class TimelineSelectionController {
  /**
   * Selects a single keyframe by clipId, trackId, and keyframeId.
   */
  public static selectSingleKeyframe(
    clipId: string,
    trackId: string,
    keyframeId: string
  ): TimelineMultiSelectionState {
    const ref: KeyframeRef = { clipId, trackId, keyframeId };
    return createMultiSelectionState({
      selectedKeyframeRefs: [ref],
      primarySelectedRef: ref,
    });
  }

  /**
   * Toggles selection state of a keyframe (Ctrl/Cmd + click).
   */
  public static toggleKeyframe(
    state: TimelineMultiSelectionState,
    ref: KeyframeRef
  ): TimelineMultiSelectionState {
    return toggleKeyframeSelection(state, ref);
  }

  /**
   * Selects all keyframes between startRef and endRef on a track (Shift + click).
   */
  public static rangeSelect(
    state: TimelineMultiSelectionState,
    timeline: AnimationTimeline,
    clipId: string,
    trackId: string,
    startRef: KeyframeRef,
    endRef: KeyframeRef
  ): TimelineMultiSelectionState {
    return rangeSelectKeyframes(state, timeline, clipId, trackId, startRef, endRef);
  }

  /**
   * Calculates keyframe selection within a drag marquee bounding box.
   */
  public static marqueeSelect(
    state: TimelineMultiSelectionState,
    positions: ReadonlyArray<KeyframePosition>,
    box: MarqueeBox
  ): TimelineMultiSelectionState {
    return selectKeyframesInMarquee(state, positions, box);
  }

  /**
   * Selects all keyframes across all clips and tracks in the animation timeline.
   */
  public static selectAllKeyframes(timeline: AnimationTimeline): TimelineMultiSelectionState {
    const refs: KeyframeRef[] = [];

    for (const clip of timeline.clips) {
      for (const track of clip.tracks) {
        for (const kf of track.keyframes) {
          refs.push({ clipId: clip.id, trackId: track.id, keyframeId: kf.id });
        }
      }
    }

    if (refs.length === 0) {
      return this.deselectAllKeyframes();
    }

    return createMultiSelectionState({
      selectedKeyframeRefs: refs,
      primarySelectedRef: refs[0],
    });
  }

  /**
   * Clears keyframe selection completely.
   */
  public static deselectAllKeyframes(): TimelineMultiSelectionState {
    return createMultiSelectionState({
      selectedKeyframeRefs: [],
      primarySelectedRef: null,
    });
  }

  /**
   * Checks if a keyframe ID is currently selected in state.
   */
  public static isKeyframeSelected(
    state: TimelineMultiSelectionState,
    keyframeId: string
  ): boolean {
    return state.selectedKeyframeRefs.some((ref) => ref.keyframeId === keyframeId);
  }
}
