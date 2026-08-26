/**
 * TimelineSelection.ts — PM36 Timeline Selection Model (DECISION-048)
 *
 * Pure UI-state model for timeline selection.
 * Completely INDEPENDENT of Runtime — no Playback, no Scheduler, no Trigger Engine.
 * This is ONLY UI state (selectedClipId / selectedTrackId / selectedKeyframeId).
 *
 * NO DOM, NO window, NO document, NO requestAnimationFrame, NO setTimeout/setInterval.
 */

export interface TimelineSelection {
  /**
   * The clip currently selected in the timeline (or null).
   */
  readonly selectedClipId: string | null;
  /**
   * The track currently selected inside the selected clip (or null).
   */
  readonly selectedTrackId: string | null;
  /**
   * The keyframe currently selected inside the selected track (or null).
   */
  readonly selectedKeyframeId: string | null;
}

export const EMPTY_TIMELINE_SELECTION: TimelineSelection = {
  selectedClipId: null,
  selectedTrackId: null,
  selectedKeyframeId: null,
};

export function createTimelineSelection(
  partial: Partial<TimelineSelection> = {}
): TimelineSelection {
  return {
    ...EMPTY_TIMELINE_SELECTION,
    ...partial,
  };
}

export function selectClip(
  selection: TimelineSelection,
  clipId: string
): TimelineSelection {
  return {
    selectedClipId: clipId,
    selectedTrackId: null,
    selectedKeyframeId: null,
  };
}

export function selectTrack(
  selection: TimelineSelection,
  clipId: string,
  trackId: string
): TimelineSelection {
  return {
    selectedClipId: clipId,
    selectedTrackId: trackId,
    selectedKeyframeId: null,
  };
}

export function selectKeyframe(
  selection: TimelineSelection,
  clipId: string,
  trackId: string,
  keyframeId: string
): TimelineSelection {
  return {
    selectedClipId: clipId,
    selectedTrackId: trackId,
    selectedKeyframeId: keyframeId,
  };
}

export function clearSelection(): TimelineSelection {
  return EMPTY_TIMELINE_SELECTION;
}

export function hasSelection(selection: TimelineSelection): boolean {
  return selection.selectedClipId !== null;
}

/** True when the selection is fully resolved down to a keyframe. */
export function isKeyframeSelected(selection: TimelineSelection): boolean {
  return (
    selection.selectedClipId !== null &&
    selection.selectedTrackId !== null &&
    selection.selectedKeyframeId !== null
  );
}
