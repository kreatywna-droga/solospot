/**
 * TimelineGrid.ts — PM36 Timeline Grid Model
 *
 * Pure grid/tick model for the Timeline Editor ruler.
 * Computes evenly-spaced time ticks for a given viewport.
 * NO Runtime, NO DOM, NO window, NO requestAnimationFrame.
 */

import type { TimelineViewport } from './TimelineViewport';
import { timeToPixels, visibleTimeRange } from './TimelineViewport';

export interface TimelineTick {
  /** Time offset in ms at this tick. */
  readonly timeMs: number;
  /** Pixel x position of the tick. */
  readonly x: number;
  /** Label for the tick (e.g. "0ms", "500ms"). */
  readonly label: string;
}

export interface TimelineGrid {
  /** The viewport this grid was computed for. */
  readonly viewport: TimelineViewport;
  /** Time interval between major ticks in ms. */
  readonly intervalMs: number;
  /** The computed ticks. */
  readonly ticks: ReadonlyArray<TimelineTick>;
}

/**
 * Compute a "nice" tick interval (ms) based on the pixels-per-ms scale.
 * Chooses from standard intervals so labels stay readable.
 */
export function computeTickInterval(
  viewport: TimelineViewport
): number {
  const niceIntervals = [50, 100, 200, 250, 500, 1000, 2000, 5000, 10000, 20000];

  // Target ~80px between ticks.
  const targetMs = 80 / viewport.pixelsPerMs;

  for (const interval of niceIntervals) {
    if (interval >= targetMs) {
      return interval;
    }
  }
  return niceIntervals[niceIntervals.length - 1];
}

export function formatTickLabel(timeMs: number): string {
  if (timeMs === 0) return '0';
  if (timeMs < 1000) return `${timeMs}ms`;
  const s = timeMs / 1000;
  return Number.isInteger(s) ? `${s}s` : `${s.toFixed(2)}s`;
}

/**
 * Build a grid of ticks covering the visible time range of the viewport,
 * aligned to the computed interval.
 */
export function buildTimelineGrid(
  viewport: TimelineViewport
): TimelineGrid {
  const intervalMs = computeTickInterval(viewport);
  const { startMs, endMs } = visibleTimeRange(viewport);

  const first = Math.floor(startMs / intervalMs) * intervalMs;
  const ticks: TimelineTick[] = [];

  for (let t = first; t <= endMs; t += intervalMs) {
    ticks.push({
      timeMs: t,
      x: timeToPixels(viewport, t),
      label: formatTickLabel(t),
    });
  }

  return { viewport, intervalMs, ticks };
}

/**
 * Snap a time value to the nearest tick on the grid.
 */
export function snapTimeToGrid(
  viewport: TimelineViewport,
  timeMs: number
): number {
  const intervalMs = computeTickInterval(viewport);
  return Math.round(timeMs / intervalMs) * intervalMs;
}
