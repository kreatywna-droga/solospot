import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TIMELINE_CURSOR,
  createTimelineCursor,
  moveCursor,
  clampCursorToDuration,
  selectKeyframeInCursor,
  selectClipInCursor,
  isCursorAtStart,
  isCursorAtEnd,
} from '../TimelineCursor';

describe('TimelineCursor Model (PM37 Extended)', () => {
  it('creates a default cursor with synchronized timeMs and currentTime', () => {
    const cursor = createTimelineCursor();
    expect(cursor.currentTime).toBe(0);
    expect(cursor.timeMs).toBe(0);
    expect(cursor.frameIndex).toBe(0);
    expect(cursor.selectedKeyframeId).toBeNull();
    expect(cursor.selectedClipId).toBeNull();
    expect(cursor.playheadPosition).toBe(0);
  });

  it('calculates frameIndex based on currentTime and fps', () => {
    // 500ms at 60fps = 0.5s * 60 = 30 frames
    const cursor = createTimelineCursor({ currentTime: 500 }, 60);
    expect(cursor.frameIndex).toBe(30);
  });

  it('moves cursor immutably updating currentTime, timeMs, frameIndex, and playheadPosition', () => {
    const cursor = createTimelineCursor({ currentTime: 0 });
    const moved = moveCursor(cursor, 1000, 60, 0.2);

    expect(moved.currentTime).toBe(1000);
    expect(moved.timeMs).toBe(1000);
    expect(moved.frameIndex).toBe(60);
    expect(moved.playheadPosition).toBe(200); // 1000 * 0.2
  });

  it('clamps cursor to duration', () => {
    const cursor = createTimelineCursor({ currentTime: 1500 });
    const clamped = clampCursorToDuration(cursor, 1000);

    expect(clamped.currentTime).toBe(1000);
    expect(clamped.timeMs).toBe(1000);
  });

  it('selects keyframe and clip immutably in cursor model', () => {
    let cursor = createTimelineCursor();
    cursor = selectClipInCursor(cursor, 'clip-abc');
    cursor = selectKeyframeInCursor(cursor, 'kf-123');

    expect(cursor.selectedClipId).toBe('clip-abc');
    expect(cursor.selectedKeyframeId).toBe('kf-123');
  });

  it('evaluates start and end position flags', () => {
    const cursor = createTimelineCursor({ currentTime: 0 });
    expect(isCursorAtStart(cursor)).toBe(true);

    const endCursor = createTimelineCursor({ currentTime: 800 });
    expect(isCursorAtEnd(endCursor, 800)).toBe(true);
    expect(isCursorAtEnd(endCursor, 1000)).toBe(false);
  });
});
