/**
 * TimelineViewport.test.ts — Unit tests for TimelineViewport UI Model (Sprint S36)
 */

import { describe, it, expect } from 'vitest';
import {
  createTimelineViewport,
  timeToPixels,
  pixelsToTime,
  visibleTimeRange,
  clampToViewport,
  scrollToTime,
  DEFAULT_TIMELINE_VIEWPORT,
} from '../TimelineViewport';

describe('TimelineViewport — Pure Geometry & Scale Conversions', () => {
  it('initializes with default values or custom partials', () => {
    const vpDefault = createTimelineViewport();
    expect(vpDefault.width).toBe(DEFAULT_TIMELINE_VIEWPORT.width);
    expect(vpDefault.pixelsPerMs).toBe(0.1);
    expect(vpDefault.scrollX).toBe(0);

    const vpCustom = createTimelineViewport({ width: 800, pixelsPerMs: 0.5, scrollX: 100 });
    expect(vpCustom.width).toBe(800);
    expect(vpCustom.pixelsPerMs).toBe(0.5);
    expect(vpCustom.scrollX).toBe(100);
  });

  it('converts time to pixel x position correctly', () => {
    const vp = createTimelineViewport({ pixelsPerMs: 0.2, scrollX: 50 });
    // timeToPixels: 1000ms * 0.2 - 50 = 200 - 50 = 150
    expect(timeToPixels(vp, 1000)).toBe(150);
  });

  it('converts pixel x position to time offset correctly', () => {
    const vp = createTimelineViewport({ pixelsPerMs: 0.2, scrollX: 50 });
    // pixelsToTime: (150 + 50) / 0.2 = 200 / 0.2 = 1000ms
    expect(pixelsToTime(vp, 150)).toBe(1000);
  });

  it('computes visible time range accurately', () => {
    const vp = createTimelineViewport({ width: 1000, pixelsPerMs: 0.1, scrollX: 20 });
    const range = visibleTimeRange(vp);
    // startMs = (0 + 20) / 0.1 = 200
    // endMs = (1000 + 20) / 0.1 = 10200
    expect(range.startMs).toBe(200);
    expect(range.endMs).toBe(10200);
  });

  it('clamps time offset to visible viewport range', () => {
    const vp = createTimelineViewport({ width: 500, pixelsPerMs: 0.1, scrollX: 0 });
    // Range [0, 5000]
    expect(clampToViewport(vp, -100)).toBe(0);
    expect(clampToViewport(vp, 2500)).toBe(2500);
    expect(clampToViewport(vp, 9999)).toBe(5000);
  });

  it('centers viewport on a given time offset via scrollToTime', () => {
    const vp = createTimelineViewport({ width: 1000, pixelsPerMs: 0.1 });
    // Center 5000ms -> centerX = 500 -> scrollX = 5000 * 0.1 - 500 = 500 - 500 = 0
    const centered0 = scrollToTime(vp, 5000);
    expect(centered0.scrollX).toBe(0);

    // Center 10000ms -> scrollX = 10000 * 0.1 - 500 = 1000 - 500 = 500
    const centered10k = scrollToTime(vp, 10000);
    expect(centered10k.scrollX).toBe(500);
  });
});
