/**
 * Tests for RadiusTypes — C16.53 Radius Property Types (Sprint 5B.4)
 *
 * Coverage targets:
 *   - CSS mapping (radiusToCSS)
 *   - Validation (validateRadiusValue, validateRadiusProps)
 *   - Default values
 *   - Edge cases (zero, negative, max bounds, mixed modes)
 */

import { describe, it, expect } from 'vitest';
import {
  radiusToCSS,
  validateRadiusValue,
  validateRadiusProps,
  DEFAULT_RADIUS_MODE,
  DEFAULT_RADIUS_VALUE,
  VALID_RADIUS_UNITS,
  type RadiusProps,
} from '../RadiusTypes';

// ---------------------------------------------------------------------------
// radiusToCSS
// ---------------------------------------------------------------------------

describe('radiusToCSS', () => {
  it('should return empty object for uniform mode with undefined radius', () => {
    const result = radiusToCSS({ mode: 'uniform' });
    expect(result).toEqual({});
  });

  it('should return empty object for uniform mode with zero radius', () => {
    const result = radiusToCSS({ mode: 'uniform', radius: { value: 0, unit: 'px' } });
    expect(result).toEqual({});
  });

  it('should generate border-radius for uniform mode with positive px value', () => {
    const result = radiusToCSS({ mode: 'uniform', radius: { value: 8, unit: 'px' } });
    expect(result).toEqual({ borderRadius: '8px' });
  });

  it('should generate border-radius for uniform mode with percentage', () => {
    const result = radiusToCSS({ mode: 'uniform', radius: { value: 50, unit: '%' } });
    expect(result).toEqual({ borderRadius: '50%' });
  });

  it('should return empty object for per-corner mode with all corners undefined', () => {
    const result = radiusToCSS({ mode: 'per-corner' });
    expect(result).toEqual({});
  });

  it('should return empty object for per-corner mode with all corners zero', () => {
    const result = radiusToCSS({
      mode: 'per-corner',
      topLeft: { value: 0, unit: 'px' },
      topRight: { value: 0, unit: 'px' },
      bottomRight: { value: 0, unit: 'px' },
      bottomLeft: { value: 0, unit: 'px' },
    });
    expect(result).toEqual({});
  });

  it('should generate individual corner CSS for per-corner mode', () => {
    const result = radiusToCSS({
      mode: 'per-corner',
      topLeft: { value: 8, unit: 'px' },
      topRight: { value: 4, unit: 'px' },
    });
    expect(result).toEqual({
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '4px',
    });
  });

  it('should generate all 4 corners in per-corner mode', () => {
    const result = radiusToCSS({
      mode: 'per-corner',
      topLeft: { value: 10, unit: 'px' },
      topRight: { value: 20, unit: 'px' },
      bottomRight: { value: 30, unit: 'px' },
      bottomLeft: { value: 40, unit: 'px' },
    });
    expect(result).toEqual({
      borderTopLeftRadius: '10px',
      borderTopRightRadius: '20px',
      borderBottomRightRadius: '30px',
      borderBottomLeftRadius: '40px',
    });
  });

  it('should only emit non-zero corners in per-corner mode', () => {
    const result = radiusToCSS({
      mode: 'per-corner',
      topLeft: { value: 8, unit: 'px' },
      topRight: { value: 0, unit: 'px' },
      bottomLeft: { value: 12, unit: 'px' },
    });
    expect(result).toEqual({
      borderTopLeftRadius: '8px',
      borderBottomLeftRadius: '12px',
    });
    expect(result.borderTopRightRadius).toBeUndefined();
    expect(result.borderBottomRightRadius).toBeUndefined();
  });

  it('should handle percentage values in per-corner mode', () => {
    const result = radiusToCSS({
      mode: 'per-corner',
      topLeft: { value: 25, unit: '%' },
      topRight: { value: 75, unit: '%' },
    });
    expect(result).toEqual({
      borderTopLeftRadius: '25%',
      borderTopRightRadius: '75%',
    });
  });

  it('should handle mixed units in per-corner mode', () => {
    const result = radiusToCSS({
      mode: 'per-corner',
      topLeft: { value: 8, unit: 'px' },
      topRight: { value: 50, unit: '%' },
    });
    expect(result).toEqual({
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '50%',
    });
  });
});

// ---------------------------------------------------------------------------
// validateRadiusValue
// ---------------------------------------------------------------------------

describe('validateRadiusValue', () => {
  it('should accept valid radius value with px', () => {
    const result = validateRadiusValue({ value: 8, unit: 'px' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept valid radius value with %', () => {
    const result = validateRadiusValue({ value: 50, unit: '%' });
    expect(result.valid).toBe(true);
  });

  it('should accept zero radius', () => {
    const result = validateRadiusValue({ value: 0, unit: 'px' });
    expect(result.valid).toBe(true);
  });

  it('should accept max radius', () => {
    const result = validateRadiusValue({ value: 999, unit: 'px' });
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    expect(validateRadiusValue(null).valid).toBe(false);
    expect(validateRadiusValue('8px').valid).toBe(false);
    expect(validateRadiusValue(42).valid).toBe(false);
  });

  it('should reject negative values', () => {
    const result = validateRadiusValue({ value: -1, unit: 'px' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('MIN_VALUE');
  });

  it('should reject values over 999', () => {
    const result = validateRadiusValue({ value: 1000, unit: 'px' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('MAX_VALUE');
  });

  it('should reject NaN value', () => {
    const result = validateRadiusValue({ value: NaN, unit: 'px' });
    expect(result.valid).toBe(false);
  });

  it('should reject invalid units', () => {
    const result = validateRadiusValue({ value: 8, unit: 'rem' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_OPTION');
  });

  it('should reject em unit', () => {
    const result = validateRadiusValue({ value: 8, unit: 'em' });
    expect(result.valid).toBe(false);
  });

  it('should have exactly 2 valid units for MVP', () => {
    expect(VALID_RADIUS_UNITS).toEqual(['px', '%']);
    expect(VALID_RADIUS_UNITS.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// validateRadiusProps
// ---------------------------------------------------------------------------

describe('validateRadiusProps', () => {
  it('should accept valid uniform radius props', () => {
    const result = validateRadiusProps({
      mode: 'uniform',
      radius: { value: 8, unit: 'px' },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept valid per-corner radius props', () => {
    const result = validateRadiusProps({
      mode: 'per-corner',
      topLeft: { value: 8, unit: 'px' },
      topRight: { value: 4, unit: 'px' },
      bottomRight: { value: 12, unit: 'px' },
      bottomLeft: { value: 16, unit: 'px' },
    });
    expect(result.valid).toBe(true);
  });

  it('should accept empty props (only mode)', () => {
    const result = validateRadiusProps({ mode: 'uniform' });
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    expect(validateRadiusProps(null).valid).toBe(false);
    expect(validateRadiusProps('string').valid).toBe(false);
    expect(validateRadiusProps(42).valid).toBe(false);
  });

  it('should reject invalid mode', () => {
    const result = validateRadiusProps({ mode: 'invalid' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_OPTION');
    expect(result.errors[0].key).toBe('mode');
  });

  it('should reject invalid radius value in uniform mode', () => {
    const result = validateRadiusProps({
      mode: 'uniform',
      radius: { value: -5, unit: 'px' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].key).toBe('radius.radius.value');
  });

  it('should reject invalid corner value in per-corner mode', () => {
    const result = validateRadiusProps({
      mode: 'per-corner',
      topLeft: { value: 2000, unit: 'px' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].key).toBe('topLeft.radius.value');
  });

  it('should reject invalid corner unit', () => {
    const result = validateRadiusProps({
      mode: 'per-corner',
      topLeft: { value: 8, unit: 'em' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].key).toBe('topLeft.radius.unit');
  });

  it('should report errors for multiple invalid fields', () => {
    const result = validateRadiusProps({
      mode: 'per-corner',
      topLeft: { value: -8, unit: 'px' },
      bottomRight: { value: 1000, unit: 'em' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

describe('default values', () => {
  it('should have DEFAULT_RADIUS_MODE as uniform', () => {
    expect(DEFAULT_RADIUS_MODE).toBe('uniform');
  });

  it('should have DEFAULT_RADIUS_VALUE as 0px', () => {
    expect(DEFAULT_RADIUS_VALUE).toEqual({ value: 0, unit: 'px' });
  });

  it('should have 2 VALID_RADIUS_UNITS', () => {
    expect(VALID_RADIUS_UNITS).toHaveLength(2);
  });
});

