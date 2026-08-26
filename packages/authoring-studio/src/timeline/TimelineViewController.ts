/**
 * TimelineViewController.ts — Sprint S24 Timeline Navigation View Controller
 *
 * Pure headless controller orchestrating timeline viewport navigation:
 * - zoom timeline (multiplicative zoom around anchor time)
 * - horizontal pan (scrolling time axis)
 * - fit animation (scale pixelsPerMs to fit total animation duration into viewport width)
 * - fit selection (scale pixelsPerMs to fit selected time range into viewport width)
 * - center playhead (center viewport scroll on playhead time)
 *
 * Delegates directly to TimelineViewport and TimelineNavigation.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { panTimelineViewport, zoomTimelineViewport } from './TimelineNavigation';
import { scrollToTime, TimelineViewport } from './TimelineViewport';

export class TimelineViewController {
  /**
   * Zooms the timeline viewport centered around an anchor time (ms).
   */
  public static zoomTimeline(
    viewport: TimelineViewport,
    zoomFactor: number,
    anchorTimeMs: number = 0
  ): TimelineViewport {
    return zoomTimelineViewport(viewport, zoomFactor, anchorTimeMs);
  }

  /**
   * Pans the timeline viewport by a delta time offset in ms.
   */
  public static panTimeline(
    viewport: TimelineViewport,
    deltaTimeMs: number
  ): TimelineViewport {
    return panTimelineViewport(viewport, deltaTimeMs);
  }

  /**
   * Fits the total clip/animation duration (ms) into the visible viewport width.
   */
  public static fitAnimation(
    viewport: TimelineViewport,
    durationMs: number
  ): TimelineViewport {
    if (durationMs <= 0) return viewport;

    const availableWidth = Math.max(100, viewport.width - 100);
    const nextPixelsPerMs = Math.max(0.01, Math.min(5, availableWidth / durationMs));

    return {
      ...viewport,
      pixelsPerMs: nextPixelsPerMs,
      scrollX: 0,
    };
  }

  /**
   * Fits a target selected keyframe / clip time range into visible viewport.
   */
  public static fitSelection(
    viewport: TimelineViewport,
    minTimeMs: number,
    maxTimeMs: number
  ): TimelineViewport {
    const range = Math.max(10, maxTimeMs - minTimeMs);
    const availableWidth = Math.max(100, viewport.width - 100);
    const nextPixelsPerMs = Math.max(0.01, Math.min(5, availableWidth / range));
    const nextScrollTimeMs = Math.max(0, minTimeMs - 20);

    return {
      ...viewport,
      pixelsPerMs: nextPixelsPerMs,
      scrollX: nextScrollTimeMs * nextPixelsPerMs,
    };
  }

  /**
   * Centers the viewport scroll position on playhead time in ms.
   */
  public static centerPlayhead(
    viewport: TimelineViewport,
    playheadTimeMs: number
  ): TimelineViewport {
    return scrollToTime(viewport, playheadTimeMs);
  }
}
