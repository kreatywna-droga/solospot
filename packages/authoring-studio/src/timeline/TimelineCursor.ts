/**
 * TimelineCursor.ts — PM36/PM37 Timeline Cursor Model
 *
 * Pure cursor model for the Timeline Editor playhead.
 * This is a STATIC AUTHORING cursor — it does NOT drive playback.
 * It represents a "current time" position for scrubbing/editing within the editor.
 *
 * PM37 extends the PM36 cursor with derived fields (frameIndex, playheadPosition)
 * and selection references (selectedKeyframeId / selectedClipId) so the Studio
 * integration can render playhead + selection in one immutable model.
 *
 * NO requestAnimationFrame, NO setTimeout, NO PlaybackController, NO DOM.
 */

export interface TimelineCursor {
  /** Current time position in ms (>= 0). */
  readonly timeMs: number;
  /** Alias of timeMs (>= 0) — kept in sync by the factory/helpers. */
  readonly currentTime: number;
  /** Zero-based frame index derived from currentTime and fps. */
  readonly frameIndex: number;
  /** Currently selected keyframe id (or null). */
  readonly selectedKeyframeId: string | null;
  /** Currently selected clip id (or null). */
  readonly selectedClipId: string | null;
  /** Playhead x-position in pixels = currentTime * pixelsPerMs. */
  readonly playheadPosition: number;
}

export const DEFAULT_TIMELINE_CURSOR: TimelineCursor = {
  timeMs: 0,
  currentTime: 0,
  frameIndex: 0,
  selectedKeyframeId: null,
  selectedClipId: null,
  playheadPosition: 0,
};

/**
 * Creates a cursor from a partial. `fps` (default 60) and `pixelsPerMs`
 * (default 0.1) are used to derive frameIndex and playheadPosition.
 */
export function createTimelineCursor(
  partial: Partial<Omit<TimelineCursor, 'timeMs' | 'currentTime'>> & {
    timeMs?: number;
    currentTime?: number;
  } = {},
  fps: number = 60,
  pixelsPerMs: number = 0.1
): TimelineCursor {
  const timeMs = Math.max(
    0,
    partial.currentTime ?? partial.timeMs ?? DEFAULT_TIMELINE_CURSOR.timeMs
  );
  return deriveCursor({
    ...DEFAULT_TIMELINE_CURSOR,
    ...partial,
    timeMs,
    currentTime: timeMs,
  }, fps, pixelsPerMs);
}

/**
 * Moves the cursor to an absolute time (ms), re-deriving derived fields.
 * Immutable — returns a NEW cursor.
 */
export function moveCursor(
  cursor: TimelineCursor,
  timeMs: number,
  fps: number = 60,
  pixelsPerMs: number = 0.1
): TimelineCursor {
  const next = Math.max(0, timeMs);
  return deriveCursor(
    {
      ...cursor,
      timeMs: next,
      currentTime: next,
    },
    fps,
    pixelsPerMs
  );
}

/**
 * Clamps the cursor to a duration (ms). Immutable — returns a NEW cursor.
 */
export function clampCursorToDuration(
  cursor: TimelineCursor,
  durationMs: number
): TimelineCursor {
  const next = Math.min(cursor.currentTime, Math.max(0, durationMs));
  return {
    ...cursor,
    timeMs: next,
    currentTime: next,
  };
}

/** Selects a clip in the cursor model (keeps keyframe). Immutable. */
export function selectClipInCursor(
  cursor: TimelineCursor,
  clipId: string
): TimelineCursor {
  return { ...cursor, selectedClipId: clipId };
}

/** Selects a keyframe in the cursor model. Immutable. */
export function selectKeyframeInCursor(
  cursor: TimelineCursor,
  keyframeId: string
): TimelineCursor {
  return { ...cursor, selectedKeyframeId: keyframeId };
}

/** True when the cursor is at the start (time 0). */
export function isCursorAtStart(cursor: TimelineCursor): boolean {
  return cursor.currentTime <= 0;
}

/** True when the cursor is at (or beyond) the clip end. */
export function isCursorAtEnd(
  cursor: TimelineCursor,
  durationMs: number
): boolean {
  return cursor.currentTime >= durationMs;
}

/** Recomputes frameIndex and playheadPosition from the current time. */
function deriveCursor(
  cursor: TimelineCursor,
  fps: number,
  pixelsPerMs: number
): TimelineCursor {
  const safeFps = Math.max(1, fps);
  const frameIndex = Math.round((cursor.currentTime / 1000) * safeFps);
  const playheadPosition = cursor.currentTime * Math.max(0, pixelsPerMs);
  return { ...cursor, frameIndex, playheadPosition };
}
