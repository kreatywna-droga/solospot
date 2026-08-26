import { describe, it, expect } from 'vitest';
import { TimelineEvaluator } from '../TimelineEvaluator';
import { KeyframeInterpolator } from '../KeyframeInterpolator';
import { CurveEvaluator } from '../CurveEvaluator';
import { AnimationTimeline } from '../../animation/AnimationTypes';

describe('TimelineEvaluator & Interpolators', () => {
  it('should evaluate cubic bezier easing accurately', () => {
    const startVal = CurveEvaluator.evaluate(0, { type: 'cubic-bezier', controlPoints: [0.25, 0.1, 0.25, 1.0] });
    const endVal = CurveEvaluator.evaluate(1, { type: 'cubic-bezier', controlPoints: [0.25, 0.1, 0.25, 1.0] });
    expect(startVal).toBe(0);
    expect(endVal).toBe(1);
  });

  it('should interpolate colors and units correctly', () => {
    const colorMid = KeyframeInterpolator.interpolateValues('#000000', '#ffffff', 0.5);
    expect(colorMid).toContain('rgb');

    const pxMid = KeyframeInterpolator.interpolateValues('10px', '20px', 0.5);
    expect(pxMid).toBe('15px');
  });

  it('should evaluate timelines with delay, loop, and fillModes', () => {
    const timeline: AnimationTimeline = {
      id: 'tl_test',
      targetNodeId: 'node_1',
      trigger: { type: 'onLoad' },
      playback: { repeatCount: 2, loop: false, fillMode: 'both', direction: 'normal' },
      clips: [
        {
          id: 'c1',
          name: 'Move',
          duration: 1000,
          delay: 200,
          tracks: [
            {
              id: 't1',
              propertyKey: 'x',
              keyframes: [
                { id: 'k1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
                { id: 'k2', timeOffset: 1000, value: 100, easing: { type: 'linear' } },
              ],
            },
          ],
        },
      ],
    };

    // Before delay (t=100)
    const resPre = TimelineEvaluator.evaluateTimeline(timeline, 100);
    expect(resPre.propertyMap.x).toBe(0);

    // Active (t=700 -> delay 200 -> 500ms into clip -> 50)
    const resActive = TimelineEvaluator.evaluateTimeline(timeline, 700);
    expect(resActive.propertyMap.x).toBe(50);
  });
});
