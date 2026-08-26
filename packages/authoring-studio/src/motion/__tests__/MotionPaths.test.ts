import { describe, expect, it } from 'vitest';
import { MotionPath, MotionPathEvaluator } from '../MotionPathEvaluator';

describe('MotionPathEvaluator (S13 ETAP 3)', () => {
  const samplePath: MotionPath = {
    id: 'path_linear',
    orientToPath: true,
    waypoints: [
      { id: 'w0', position: { x: 0, y: 0 }, handleOut: { x: 50, y: 0 } },
      { id: 'w1', position: { x: 200, y: 200 }, handleIn: { x: -50, y: 0 } },
    ],
  };

  it('interpolates position along path waypoints and calculates orient-to-path angle', () => {
    const startSample = MotionPathEvaluator.evaluatePath(samplePath, 0);
    expect(startSample.x).toBe(0);
    expect(startSample.y).toBe(0);

    const endSample = MotionPathEvaluator.evaluatePath(samplePath, 1.0);
    expect(endSample.x).toBe(200);
    expect(endSample.y).toBe(200);

    const midSample = MotionPathEvaluator.evaluatePath(samplePath, 0.5);
    expect(midSample.x).toBeGreaterThan(0);
    expect(midSample.x).toBeLessThan(200);
    expect(midSample.y).toBeGreaterThan(0);
    expect(midSample.y).toBeLessThan(200);
    expect(midSample.angleDeg).toBeDefined();
  });
});
