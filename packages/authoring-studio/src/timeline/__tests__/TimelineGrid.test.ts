/**
 * TimelineGrid.test.ts — Unit tests for TimelineGrid UI Model (Sprint S36)
 */

import { describe, it, expect } from 'vitest';
import { createTimelineViewport } from '../TimelineViewport';
import {
  computeTickInterval,
  formatTickLabel,
  buildTimelineGrid,
  snapTimeToGrid,
} from '../TimelineGrid';

describe('TimelineGrid — Ruler Grid & Tick Snapping', () => {
  it('computes appropriate tick intervals based on viewport pixelsPerMs scale', () => {
    const vpHighZoom = createTimelineViewport({ pixelsPerMs: 2 }); // Target 80px / 2 = 40ms -> interval 50ms
    expect(computeTickInterval(vpHighZoom)).toBe(50);

    const vpDefault = createTimelineViewport({ pixelsPerMs: 0.1 }); // Target 80px / 0.1 = 800ms -> interval 1000ms
    expect(computeTickInterval(vpDefault)).toBe(1000);

    const vpLowZoom = createTimelineViewport({ pixelsPerMs: 0.01 }); // Target 80px / 0.01 = 8000ms -> interval 10000ms
    expect(computeTickInterval(vpLowZoom)).toBe(10000);
  });

  it('formats tick labels into readable strings', () => {
    expect(formatTickLabel(0)).toBe('0');
    expect(formatTickLabel(500)).toBe('500ms');
    expect(formatTickLabel(1000)).toBe('1s');
    expect(formatTickLabel(2500)).toBe('2.50s');
  });

  it('builds a complete timeline grid with computed ticks for viewport', () => {
    const vp = createTimelineViewport({ width: 400, pixelsPerMs: 0.1, scrollX: 0 });
    const grid = buildTimelineGrid(vp);

    expect(grid.intervalMs).toBe(1000); // 80px / 0.1 = 800ms -> 1000ms interval
    expect(grid.ticks.length).toBeGreaterThan(0);
    expect(grid.ticks[0].timeMs).toBe(0);
    expect(grid.ticks[0].label).toBe('0');
    expect(grid.ticks[1].timeMs).toBe(1000);
    expect(grid.ticks[1].label).toBe('1s');
  });

  it('snaps arbitrary time values to nearest grid tick', () => {
    const vp = createTimelineViewport({ pixelsPerMs: 0.1 }); // interval 1000ms
    expect(snapTimeToGrid(vp, 450)).toBe(0);
    expect(snapTimeToGrid(vp, 550)).toBe(1000);
    expect(snapTimeToGrid(vp, 1499)).toBe(1000);
    expect(snapTimeToGrid(vp, 1501)).toBe(2000);
  });
});
