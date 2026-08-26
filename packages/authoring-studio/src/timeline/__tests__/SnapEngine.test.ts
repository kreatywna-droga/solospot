import { describe, it, expect } from 'vitest';
import {
  resolveSnapTime,
  createSnapEngineConfig,
  type SnapTarget,
} from '../TimelineSnapEngine';

describe('SnapEngine (PM40, ETAP 2 & DECISION-064)', () => {
  it('snaps time to nearest keyframe target within magnetic threshold (DECISION-064)', () => {
    const targets: SnapTarget[] = [
      { id: 'kf-1', type: 'keyframe', timeMs: 400, priority: 2 },
      { id: 'marker-1', type: 'marker', timeMs: 750, priority: 1 },
    ];

    const config = createSnapEngineConfig({ magneticThresholdMs: 20 });

    // Raw time 390ms is within 20ms of keyframe target 400ms
    const result = resolveSnapTime(390, targets, config);

    expect(result.isSnapped).toBe(true);
    expect(result.snappedTimeMs).toBe(400);
    expect(result.activeTarget?.type).toBe('keyframe');
    expect(result.offsetDeltaMs).toBe(10);
  });

  it('prioritizes higher priority targets (lower priority number) when equidistant', () => {
    const targets: SnapTarget[] = [
      { id: 'grid-500', type: 'grid', timeMs: 500, priority: 10 },
      { id: 'marker-500', type: 'marker', timeMs: 500, priority: 1 },
    ];

    const result = resolveSnapTime(495, targets);
    expect(result.isSnapped).toBe(true);
    expect(result.snappedTimeMs).toBe(500);
    expect(result.activeTarget?.type).toBe('marker');
  });

  it('falls back to raw time when no targets are within threshold', () => {
    const targets: SnapTarget[] = [
      { id: 'kf-1', type: 'keyframe', timeMs: 200, priority: 2 },
    ];

    const config = createSnapEngineConfig({ snapToGrid: false, magneticThresholdMs: 15 });
    const result = resolveSnapTime(500, targets, config);

    expect(result.isSnapped).toBe(false);
    expect(result.snappedTimeMs).toBe(500);
    expect(result.activeTarget).toBeNull();
  });
});
