/**
 * AnimationColorInterpolator.test.ts — PM31 Color Interpolation Tests
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import { parseColor, interpolateColor } from '../AnimationColorInterpolator';

describe('PM31 — AnimationColorInterpolator', () => {
  it('parses hex and rgba colors', () => {
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor('rgba(0, 0, 0, 0.5)')).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
    expect(parseColor('rgb(255, 255, 255)')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('rejects unsupported color formats (hsl, named)', () => {
    expect(parseColor('hsl(0, 100%, 50%)')).toBeNull();
    expect(parseColor('red')).toBeNull();
    expect(parseColor('')).toBeNull();
  });

  it('interpolates between two colors', () => {
    expect(interpolateColor('#000000', '#ffffff', 0.5)).toBe('rgba(128, 128, 128, 1)');
    expect(interpolateColor('rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    expect(interpolateColor('#ff0000', '#0000ff', 0)).toBe('rgba(255, 0, 0, 1)');
    expect(interpolateColor('#ff0000', '#0000ff', 1)).toBe('rgba(0, 0, 255, 1)');
  });

  it('falls back to discrete on unparseable input', () => {
    expect(interpolateColor('red', '#000000', 0.2)).toBe('red');
    expect(interpolateColor('red', '#000000', 0.8)).toBe('#000000');
  });
});
