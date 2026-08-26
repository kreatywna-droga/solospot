/**
 * TimelineViewport.ts — PM36 Timeline Viewport Model
 *
 * Pure viewport geometry for the Timeline Editor.
 * Converts between time (ms) and pixel coordinates using a fixed scale.
 * NO Runtime, NO DOM, NO window, NO requestAnimationFrame.
 */

export interface TimelineViewport {
  /** Pixel width of the timeline track area. */
  readonly width: number;
  /** Pixels per millisecond scale. Higher = more zoomed in. */
  readonly pixelsPerMs: number;
  /** Scroll offset in pixels (left edge of the visible window). */
  readonly scrollX: number;
}

export const DEFAULT_TIMELINE_VIEWPORT: TimelineViewport = {
  width: 1200,
  pixelsPerMs: 0.1,
  scrollX: 0,
};

export function createTimelineViewport(
  partial: Partial<TimelineViewport> = {}
): TimelineViewport {
  return {
    ...DEFAULT_TIMELINE_VIEWPORT,
    ...partial,
  };
}

/** Convert a timeOffset (ms) to a pixel x position. */
export function timeToPixels(
  viewport: TimelineViewport,
  timeMs: number
): number {
  return timeMs * viewport.pixelsPerMs - viewport.scrollX;
}

/** Convert a pixel x position to a timeOffset (ms). */
export function pixelsToTime(
  viewport: TimelineViewport,
  px: number
): number {
  const timeMs = (px + viewport.scrollX) / viewport.pixelsPerMs;
  return Math.max(0, Math.round(timeMs));
}

/** Compute the visible time range [startMs, endMs] in the viewport. */
export function visibleTimeRange(
  viewport: TimelineViewport
): { startMs: number; endMs: number } {
  const startMs = pixelsToTime(viewport, 0);
  const endMs = pixelsToTime(viewport, viewport.width);
  return { startMs, endMs };
}

/** Clamp a time value to the viewport's visible range. */
export function clampToViewport(
  viewport: TimelineViewport,
  timeMs: number
): number {
  const { startMs, endMs } = visibleTimeRange(viewport);
  return Math.min(Math.max(timeMs, startMs), endMs);
}

/** Scroll so that the given time (ms) is centered in the viewport. */
export function scrollToTime(
  viewport: TimelineViewport,
  timeMs: number
): TimelineViewport {
  const centerX = viewport.width / 2;
  const scrollX = Math.max(0, timeMs * viewport.pixelsPerMs - centerX);
  return { ...viewport, scrollX };
}
