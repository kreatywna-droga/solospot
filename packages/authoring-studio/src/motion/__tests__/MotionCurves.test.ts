import { describe, expect, it } from 'vitest';
import { AdvancedMotionCurves } from '../AdvancedMotionCurves';

describe('AdvancedMotionCurves & Velocity System (S13 ETAP 1)', () => {
  it('evaluates Bézier, spring, bounce, elastic, and step easing progression factors', () => {
    expect(AdvancedMotionCurves.evaluateProgression(0, { type: 'linear' })).toBe(0);
    expect(AdvancedMotionCurves.evaluateProgression(1, { type: 'linear' })).toBe(1);

    // Ease-in
    expect(AdvancedMotionCurves.evaluateProgression(0.5, { type: 'ease-in' })).toBe(0.25);

    // Cubic-bezier
    const cbVal = AdvancedMotionCurves.evaluateProgression(0.5, {
      type: 'cubic-bezier',
      controlPoints: [0.25, 0.1, 0.25, 1.0],
    });
    expect(cbVal).toBeGreaterThan(0);
    expect(cbVal).toBeLessThan(1);

    // Bounce
    const bounceVal = AdvancedMotionCurves.evaluateProgression(0.8, { type: 'bounce' });
    expect(bounceVal).toBeGreaterThan(0);

    // Elastic
    const elasticVal = AdvancedMotionCurves.evaluateProgression(0.5, { type: 'elastic' });
    expect(elasticVal).toBeDefined();

    // Step
    const stepVal = AdvancedMotionCurves.evaluateProgression(0.3, { type: 'step', steps: 4 });
    expect(stepVal).toBe(0.25);
  });

  it('computes temporal modifiers (loop, ping-pong, reverse)', () => {
    expect(AdvancedMotionCurves.applyTemporalModifier(0.3, 'normal')).toBe(0.3);
    expect(AdvancedMotionCurves.applyTemporalModifier(0.3, 'reverse')).toBe(0.7);

    // Loop
    expect(AdvancedMotionCurves.applyTemporalModifier(1.4, 'loop')).toBeCloseTo(0.4, 4);

    // Ping-pong
    expect(AdvancedMotionCurves.applyTemporalModifier(1.3, 'ping-pong')).toBeCloseTo(0.7, 4);
  });

  it('calculates numerical velocity and acceleration derivatives', () => {
    const v = AdvancedMotionCurves.evaluateVelocity(0.5, { type: 'linear' }, 1000);
    expect(v).toBeCloseTo(1.0, 1);

    const a = AdvancedMotionCurves.evaluateAcceleration(0.5, { type: 'ease-in' }, 1000);
    expect(a).toBeDefined();
  });
});
