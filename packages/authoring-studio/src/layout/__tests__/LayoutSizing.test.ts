/**
 * LayoutSizing.test.ts — Sprint S29
 *
 * SizingMode length resolution: fixed, fill, fit, stretch + min/max + percentages.
 */

import { describe, it, expect } from 'vitest';
import { resolveSizedLength } from '../LayoutSizing';

const LOO = (params: Parameters<typeof resolveSizedLength>[0]) => resolveSizedLength(params);

describe('LayoutSizing', () => {
  it('resolves fixed explicit numbers', () => {
    expect(LOO({ mode: 'fixed', explicit: 150, intrinsic: 0, parentLength: 1000 })).toBe(150);
  });

  it('resolves percentage lengths against the parent', () => {
    expect(LOO({ mode: 'fixed', explicit: '50%', intrinsic: 0, parentLength: 800 })).toBe(400);
  });

  it('falls back to intrinsic when no explicit length exists', () => {
    expect(LOO({ mode: 'fixed', intrinsic: 64, parentLength: 800 })).toBe(64);
  });

  it('fill consumes the full parent length minus pins', () => {
    expect(
      LOO({ mode: 'fill', intrinsic: 0, parentLength: 1000, pinnedLeft: 10, pinnedRight: 30 })
    ).toBe(960);
  });

  it('fit resolves to the intrinsic length', () => {
    expect(LOO({ mode: 'fit', intrinsic: 42, parentLength: 500 })).toBe(42);
  });

  it('stretch consumes the parent length (cross axis semantics)', () => {
    expect(LOO({ mode: 'stretch', intrinsic: 10, parentLength: 300 })).toBe(300);
  });

  it('clamps against min and max', () => {
    expect(LOO({ mode: 'fixed', explicit: 5, intrinsic: 0, parentLength: 100, min: 20 })).toBe(20);
    expect(LOO({ mode: 'fixed', explicit: 500, intrinsic: 0, parentLength: 100, max: 300 })).toBe(300);
  });

  it('never returns negative lengths', () => {
    expect(LOO({ mode: 'fill', intrinsic: 0, parentLength: 50, pinnedLeft: 100, pinnedRight: 100 })).toBe(0);
  });

  it('is deterministic for identical inputs', () => {
    const a = LOO({ mode: 'fixed', explicit: '25%', intrinsic: 0, parentLength: 1200 });
    const b = LOO({ mode: 'fixed', explicit: '25%', intrinsic: 0, parentLength: 1200 });
    expect(a).toBe(b);
    expect(a).toBe(300);
  });
});