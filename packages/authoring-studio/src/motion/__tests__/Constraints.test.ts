import { describe, expect, it } from 'vitest';
import { AnimationConstraintsEvaluator } from '../AnimationConstraintsEvaluator';

describe('AnimationConstraintsEvaluator (S13 ETAP 4)', () => {
  it('evaluates follow, align, look-at, position-clamp, and rotation-clamp constraints', () => {
    // 1. Follow constraint
    const followRes = AnimationConstraintsEvaluator.evaluateConstraint(
      0,
      0,
      0,
      { id: 'c1', type: 'follow', targetPosition: { x: 100, y: 200 }, lagFactor: 0 },
      undefined,
      undefined
    );
    expect(followRes.x).toBe(100);
    expect(followRes.y).toBe(200);

    // 2. Look-at constraint
    const lookRes = AnimationConstraintsEvaluator.evaluateConstraint(
      0,
      0,
      0,
      { id: 'c2', type: 'look-at', targetPosition: { x: 100, y: 100 } }
    );
    expect(lookRes.rotationDeg).toBeCloseTo(45, 1);

    // 3. Position clamp
    const clampRes = AnimationConstraintsEvaluator.evaluateConstraint(
      500,
      -100,
      0,
      { id: 'c3', type: 'position-clamp', positionClamp: { minX: 0, maxX: 300, minY: 0, maxY: 300 } }
    );
    expect(clampRes.x).toBe(300);
    expect(clampRes.y).toBe(0);

    // 4. Rotation clamp
    const rotClampRes = AnimationConstraintsEvaluator.evaluateConstraint(
      0,
      0,
      180,
      { id: 'c4', type: 'rotation-clamp', rotationClamp: { minDeg: -90, maxDeg: 90 } }
    );
    expect(rotClampRes.rotationDeg).toBe(90);
  });
});
