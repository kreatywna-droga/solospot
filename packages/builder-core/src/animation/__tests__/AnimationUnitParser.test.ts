/**
 * AnimationUnitParser.test.ts — PM31 Unit Normalization Tests
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import { parseUnit, areUnitsCompatible, isSupportedUnit } from '../AnimationUnitParser';

describe('PM31 — AnimationUnitParser', () => {
  it('parses px, rem, %, deg and unit-less values', () => {
    expect(parseUnit('10px')).toEqual({ value: 10, unit: 'px' });
    expect(parseUnit('1.5rem')).toEqual({ value: 1.5, unit: 'rem' });
    expect(parseUnit('50%')).toEqual({ value: 50, unit: '%' });
    expect(parseUnit('90deg')).toEqual({ value: 90, unit: 'deg' });
    expect(parseUnit('0.5')).toEqual({ value: 0.5, unit: '' });
    expect(parseUnit('-20px')).toEqual({ value: -20, unit: 'px' });
    expect(parseUnit(' 42px ')).toEqual({ value: 42, unit: 'px' });
  });

  it('rejects unsupported units and malformed input', () => {
    expect(parseUnit('10em')).toBeNull();
    expect(parseUnit('abc')).toBeNull();
    expect(parseUnit('')).toBeNull();
    expect(parseUnit('10px10')).toBeNull();
    expect(parseUnit('10')).toEqual({ value: 10, unit: '' });
  });

  it('declares unit compatibility', () => {
    expect(areUnitsCompatible(parseUnit('10px'), parseUnit('20px'))).toBe(true);
    expect(areUnitsCompatible(parseUnit('10px'), parseUnit('20%'))).toBe(false);
    expect(areUnitsCompatible(parseUnit('0.5'), parseUnit('1'))).toBe(true);
    expect(areUnitsCompatible(null, parseUnit('10px'))).toBe(false);
  });

  it('validates supported unit strings', () => {
    expect(isSupportedUnit('10px')).toBe(true);
    expect(isSupportedUnit('2rem')).toBe(true);
    expect(isSupportedUnit('30%')).toBe(true);
    expect(isSupportedUnit('45deg')).toBe(true);
    expect(isSupportedUnit('10em')).toBe(false);
  });
});
