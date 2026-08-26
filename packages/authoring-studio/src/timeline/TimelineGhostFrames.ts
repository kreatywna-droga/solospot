/**
 * TimelineGhostFrames.ts — PM40 Ghost Keyframes Model (ETAP 4)
 *
 * DECISION-066: Ghost Frames są tylko warstwą Authoring UX.
 *
 * Pure data model representing ghost keyframe preview positions and opacity metadata.
 * Used during drag gestures and multi-keyframe reordering.
 *
 * NO DOM, NO React, NO requestAnimationFrame.
 */

export interface GhostFrameMetadata {
  readonly id: string;
  readonly originalKeyframeId: string;
  readonly trackId: string;
  readonly clipId: string;
  readonly originalTimeMs: number;
  readonly previewTimeMs: number;
  readonly opacity: number;
}

export interface GhostFramesState {
  readonly activeGhosts: ReadonlyArray<GhostFrameMetadata>;
  readonly isDragging: boolean;
}

export const INITIAL_GHOST_FRAMES_STATE: GhostFramesState = {
  activeGhosts: [],
  isDragging: false,
};

export function createGhostFramesState(
  partial: Partial<GhostFramesState> = {}
): GhostFramesState {
  return {
    ...INITIAL_GHOST_FRAMES_STATE,
    ...partial,
  };
}

/**
 * Creates ghost frame metadata snapshots for keyframes being dragged.
 */
export function createGhostFrames(
  keyframeItems: ReadonlyArray<{ keyframeId: string; trackId: string; clipId: string; timeMs: number }>,
  deltaTimeShiftMs: number = 0,
  opacity: number = 0.5
): GhostFramesState {
  const activeGhosts: GhostFrameMetadata[] = keyframeItems.map((item) => ({
    id: `ghost-${item.keyframeId}`,
    originalKeyframeId: item.keyframeId,
    trackId: item.trackId,
    clipId: item.clipId,
    originalTimeMs: item.timeMs,
    previewTimeMs: Math.max(0, item.timeMs + deltaTimeShiftMs),
    opacity,
  }));

  return {
    activeGhosts,
    isDragging: true,
  };
}

/**
 * Clears active ghost frames state.
 */
export function clearGhostFrames(): GhostFramesState {
  return INITIAL_GHOST_FRAMES_STATE;
}
