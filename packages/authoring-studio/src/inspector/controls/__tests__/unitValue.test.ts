import { describe, it, expect } from 'vitest';
import { parseUnitValue, formatUnitValue } from '../unitValue';

describe('parseUnitValue', () => {
  it('parses number + unit', () => {
    expect(parseUnitValue('16px')).toEqual({ number: 16, unit: 'px', hasNumber: true });
    expect(parseUnitValue('50%')).toEqual({ number: 50, unit: '%', hasNumber: true });
    expect(parseUnitValue('1.5rem')).toEqual({ number: 1.5, unit: 'rem', hasNumber: true });
  });

  it('applies defaultUnit when value has no unit', () => {
    expect(parseUnitValue('12')).toEqual({ number: 12, unit: 'px', hasNumber: true });
    expect(parseUnitValue('12', '')).toEqual({ number: 12, unit: '', hasNumber: true });
  });

  it('returns NaN + defaultUnit for empty/null/undefined', () => {
    expect(parseUnitValue('')).toEqual({ number: NaN, unit: 'px', hasNumber: false });
    expect(parseUnitValue(null)).toEqual({ number: NaN, unit: 'px', hasNumber: false });
    expect(parseUnitValue(undefined, '%')).toEqual({ number: NaN, unit: '%', hasNumber: false });
  });

  it('strips corrupted legacy px on unitless ratios < 5', () => {
    expect(parseUnitValue('1.5px', '')).toEqual({ number: 1.5, unit: '', hasNumber: true });
    expect(parseUnitValue('8px', '')).toEqual({ number: 8, unit: 'px', hasNumber: true });
  });

  it('falls back for non-numeric garbage', () => {
    const r = parseUnitValue('abc');
    expect(r.hasNumber).toBe(false);
    expect(r.unit).toBe('px');
  });
});

describe('formatUnitValue', () => {
  it('joins number and unit', () => {
    expect(formatUnitValue(16, 'px')).toBe('16px');
    expect(formatUnitValue(50, '%')).toBe('50%');
    expect(formatUnitValue(12, '')).toBe('12');
  });

  it('accepts string numbers as-is', () => {
    expect(formatUnitValue('16.5', 'px')).toBe('16.5px');
  });

  it('rounds fractional numbers to 2 decimals', () => {
    expect(formatUnitValue(1.23456, 'em')).toBe('1.23em');
  });

  it('round-trips with parseUnitValue', () => {
    const css = formatUnitValue(24, 'px');
    expect(parseUnitValue(css)).toEqual({ number: 24, unit: 'px', hasNumber: true });
  });
});
