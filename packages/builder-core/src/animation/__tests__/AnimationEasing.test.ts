/**
 * AnimationEasing.test.ts — PM30 Easing Engine Unit Tests
 *
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import { easeLinear, easeIn, easeOut, easeInOut, resolveEasing } from '../AnimationEasing';

describe('PM30 — AnimationEasing', () => {
  it('linear is the identity function', () => {
    expect(easeLinear(0)).toBe(0);
    expect(easeLinear(0.5)).toBeCloseTo(0.5, 10);
    expect(easeLinear(1)).toBe(1);
  });

  it('ease-in accelerates (starts flat, ends steep)', () => {
    expect(easeIn(0)).toBe(0);
    expect(easeIn(0.5)).toBeCloseTo(0.25, 10);
    expect(easeIn(1)).toBe(1);
    // Early progress is smaller than linear for ease-in.
    expect(easeIn(0.25)).toBeLessThan(0.25);
  });

  it('ease-out decelerates (starts steep, ends flat)', () => {
    expect(easeOut(0)).toBe(0);
    expect(easeOut(0.5)).toBeCloseTo(0.75, 10);
    expect(easeOut(1)).toBe(1);
    // Early progress is larger than linear for ease-out.
    expect(easeOut(0.25)).toBeGreaterThan(0.25);
  });

  it('ease-in-out is symmetric around 0.5', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 10);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.25)).toBeCloseTo(0.125, 10);
    expect(easeInOut(0.75)).toBeCloseTo(0.875, 10);
  });

  it('clamps input outside [0,1]', () => {
    expect(easeLinear(-1)).toBe(0);
    expect(easeLinear(2)).toBe(1);
    expect(easeInOut(-0.5)).toBe(0);
    expect(easeInOut(1.5)).toBe(1);
  });

  it('resolveEasing returns the correct function per name', () => {
    expect(resolveEasing('linear')).toBe(easeLinear);
    expect(resolveEasing('ease-in')).toBe(easeIn);
    expect(resolveEasing('ease-out')).toBe(easeOut);
    expect(resolveEasing('ease-in-out')).toBe(easeInOut);
  });

it('resolveEasing falls back to linear for unknown names', () => {
    expect(resolveEasing('spring')).toBe(easeLinear);
  });
});
