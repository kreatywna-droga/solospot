/**
 * AnimationTransformInterpolator.test.ts — PM31 Transform Interpolation Tests
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import {
  parseTransformFunction,
  parseTransformList,
  interpolateTransform,
} from '../AnimationTransformInterpolator';

describe('PM31 — AnimationTransformInterpolator', () => {
  it('parses supported transform functions', () => {
    expect(parseTransformFunction('translateX(10px)')).toEqual({ name: 'translateX', value: '10px' });
    expect(parseTransformFunction('rotate(45deg)')).toEqual({ name: 'rotate', value: '45deg' });
    expect(parseTransformFunction('scale(1.5)')).toEqual({ name: 'scale', value: '1.5' });
  });

  it('rejects unsupported transform functions', () => {
    expect(parseTransformFunction('matrix(1,0,0,1,0,0)')).toBeNull();
    expect(parseTransformFunction('skew(10deg)')).toBeNull();
    expect(parseTransformFunction('perspective(100px)')).toBeNull();
    expect(parseTransformFunction('translateX()')).toBeNull();
  });

  it('parses a transform list', () => {
    const list = parseTransformList('translateX(10px) scale(1)');
    expect(list).not.toBeNull();
    expect(list!.functions).toHaveLength(2);
    expect(list!.functions[0].name).toBe('translateX');
    expect(list!.functions[1].name).toBe('scale');
  });

  it('interpolates translateX and scale', () => {
    expect(interpolateTransform('translateX(0px)', 'translateX(100px)', 0.5)).toBe('translateX(50px)');
    expect(interpolateTransform('scale(1)', 'scale(2)', 0.5)).toBe('scale(1.5)');
    expect(interpolateTransform('rotate(0deg)', 'rotate(90deg)', 0.5)).toBe('rotate(45deg)');
  });

  it('falls back to discrete on structural mismatch', () => {
    expect(interpolateTransform('translateX(10px)', 'scale(2)', 0.5)).toBe('scale(2)');
    expect(interpolateTransform('translateX(10px)', 'translateY(20px)', 0.2)).toBe('translateX(10px)');
  });
});
