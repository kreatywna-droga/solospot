/**
 * AnimationInterpolator.test.ts — PM31 Interpolation Engine Tests
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import { interpolateNumber, interpolateUnit, interpolateProperty } from '../AnimationInterpolator';

describe('PM31 — AnimationInterpolator', () => {
  it('interpolates numbers linearly', () => {
    expect(interpolateNumber(0, 100, 0)).toBe(0);
    expect(interpolateNumber(0, 100, 0.5)).toBe(50);
    expect(interpolateNumber(0, 100, 1)).toBe(100);
    expect(interpolateNumber(10, 20, 0.25)).toBe(12.5);
  });

  it('interpolates unit strings (px, rem, %, deg)', () => {
    expect(interpolateUnit('10px', '50px', 0.5)).toBe('30px');
    expect(interpolateUnit('1rem', '3rem', 0.5)).toBe('2rem');
    expect(interpolateUnit('0%', '100%', 0.25)).toBe('25%');
    expect(interpolateUnit('90deg', '180deg', 0.5)).toBe('135deg');
  });

  it('falls back to discrete on unit mismatch', () => {
    expect(interpolateUnit('10px', '50%', 0.2)).toBe('10px');
    expect(interpolateUnit('10px', '50%', 0.8)).toBe('50%');
  });

  it('dispatches by interpolation type', () => {
    expect(interpolateProperty('number', 0, 100, 0.5)).toBe(50);
    expect(interpolateProperty('opacity', 0, 1, 0.5)).toBe(0.5);
    expect(interpolateProperty('px', '10px', '50px', 0.5)).toBe('30px');
    expect(interpolateProperty('color', '#000000', '#ffffff', 0.5)).toBe('rgba(128, 128, 128, 1)');
    expect(interpolateProperty('transform', 'scale(1)', 'scale(2)', 0.5)).toBe('scale(1.5)');
  });
});
