/**
 * AnimationInterpolation.test.ts — PM31 Animation Interpolation Engine Tests
 *
 * Node environment — no jsdom required.
 * Verifies AnimationInterpolator, AnimationColorInterpolator,
 * AnimationTransformInterpolator, AnimationUnitParser, and legacy facade.
 */

import { describe, it, expect } from 'vitest';
import { AnimationInterpolator } from '../AnimationInterpolator';
import { AnimationColorInterpolator } from '../AnimationColorInterpolator';
import { AnimationTransformInterpolator } from '../AnimationTransformInterpolator';
import { AnimationUnitParser } from '../AnimationUnitParser';
import { AnimationInterpolation } from '../AnimationInterpolation';

describe('PM31 — Animation Interpolation Engine & Modular Interpolators', () => {
  it('should interpolate numbers linearly via AnimationInterpolator', () => {
    expect(AnimationInterpolator.interpolateNumber(0, 100, 0.5)).toBe(50);
  });

  it('should parse and interpolate dimension units via AnimationUnitParser', () => {
    const parsed = AnimationUnitParser.parse('20px');
    expect(parsed).toEqual({ value: 20, unit: 'px' });

    expect(AnimationInterpolator.interpolateUnit('10px', '50px', 0.5)).toBe('30px');
    expect(AnimationInterpolator.interpolateUnit('1rem', '3rem', 0.5)).toBe('2rem');
  });

  it('should parse and interpolate color values via AnimationColorInterpolator', () => {
    const parsed = AnimationColorInterpolator.parseColor('#ff0000');
    expect(parsed).toEqual({ r: 255, g: 0, b: 0, a: 1 });

    const mid = AnimationColorInterpolator.interpolate('#000000', '#ffffff', 0.5);
    expect(mid).toBe('rgba(128, 128, 128, 1)');
  });

  it('should interpolate transform values via AnimationTransformInterpolator', () => {
    const trans = AnimationTransformInterpolator.interpolateTranslate('0px', '100px', 0.5);
    expect(trans).toBe('50px');
  });

  it('should verify backward compatibility of @deprecated AnimationInterpolation facade', () => {
    expect(AnimationInterpolation.interpolateNumber(0, 100, 0.5)).toBe(50);
    expect(AnimationInterpolation.interpolateUnit('10px', '50px', 0.5)).toBe('30px');
    expect(AnimationInterpolation.interpolateColor('#000000', '#ffffff', 0.5)).toBe('rgba(128, 128, 128, 1)');
  });
});
