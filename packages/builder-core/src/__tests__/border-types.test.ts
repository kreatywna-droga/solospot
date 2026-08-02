/**
 * Tests for BorderTypes — C16.49 Border Property Types (Sprint 5B.3)
 *
 * Coverage targets:
 *   - CSS mapping (borderToCSS)
 *   - Validation (validateBorderStyle, validateBorderWidthValue, validateBorderColor, validateBorderProps)
 *   - Default values
 *   - Edge cases (zero, negative, max bounds)
 */

import { describe, it, expect } from 'vitest';
import {
  borderToCSS,
  validateBorderStyle,
  validateBorderWidthValue,
  validateBorderColor,
  validateBorderProps,
  DEFAULT_BORDER_WIDTH,
  DEFAULT_BORDER_COLOR,
  VALID_BORDER_STYLES,
  type BorderProps,
} from '../BorderTypes';

// ---------------------------------------------------------------------------
// borderToCSS
// ---------------------------------------------------------------------------

describe('borderToCSS', () => {
  it('should return empty object for empty props', () => {
    const result = borderToCSS({});
    expect(result).toEqual({});
  });

  it('should generate border-style only', () => {
    const result = borderToCSS({ borderStyle: 'solid' });
    expect(result).toEqual({ borderStyle: 'solid' });
  });

  it('should generate border-width only', () => {
    const result = borderToCSS({ borderWidth: { value: 2, unit: 'px' } });
    expect(result).toEqual({ borderWidth: '2px' });
  });

  it('should generate border-color only', () => {
    const result = borderToCSS({ borderColor: '#ff0000' });
    expect(result).toEqual({ borderColor: '#ff0000' });
  });

  it('should generate all three properties', () => {
    const result = borderToCSS({
      borderStyle: 'dashed',
      borderWidth: { value: 1, unit: 'px' },
      borderColor: '#e2e8f0',
    });
    expect(result).toEqual({
      borderStyle: 'dashed',
      borderWidth: '1px',
      borderColor: '#e2e8f0',
    });
  });

  it('should handle dashed style', () => {
    const result = borderToCSS({ borderStyle: 'dashed', borderWidth: { value: 2, unit: 'px' } });
    expect(result.borderStyle).toBe('dashed');
    expect(result.borderWidth).toBe('2px');
  });

  it('should handle dotted style', () => {
    const result = borderToCSS({ borderStyle: 'dotted' });
    expect(result.borderStyle).toBe('dotted');
  });

  it('should handle large width', () => {
    const result = borderToCSS({ borderWidth: { value: 100, unit: 'px' } });
    expect(result.borderWidth).toBe('100px');
  });

  it('should not include undefined properties', () => {
    const result = borderToCSS({ borderStyle: 'solid' });
    expect(result.borderWidth).toBeUndefined();
    expect(result.borderColor).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validateBorderStyle
// ---------------------------------------------------------------------------

describe('validateBorderStyle', () => {
  it('should accept valid styles', () => {
    expect(validateBorderStyle('solid')).toBe(true);
    expect(validateBorderStyle('dashed')).toBe(true);
    expect(validateBorderStyle('dotted')).toBe(true);
  });

  it('should reject invalid styles', () => {
    expect(validateBorderStyle('groove')).toBe(false);
    expect(validateBorderStyle('ridge')).toBe(false);
    expect(validateBorderStyle('none')).toBe(false);
    expect(validateBorderStyle('')).toBe(false);
    expect(validateBorderStyle(123)).toBe(false);
    expect(validateBorderStyle(null)).toBe(false);
  });

  it('should have exactly 3 valid styles for MVP', () => {
    expect(VALID_BORDER_STYLES).toEqual(['solid', 'dashed', 'dotted']);
    expect(VALID_BORDER_STYLES.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// validateBorderWidthValue
// ---------------------------------------------------------------------------

describe('validateBorderWidthValue', () => {
  it('should accept valid border width', () => {
    const result = validateBorderWidthValue({ value: 1, unit: 'px' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept zero width', () => {
    const result = validateBorderWidthValue({ value: 0, unit: 'px' });
    expect(result.valid).toBe(true);
  });

  it('should accept max width', () => {
    const result = validateBorderWidthValue({ value: 100, unit: 'px' });
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    expect(validateBorderWidthValue(null).valid).toBe(false);
    expect(validateBorderWidthValue('2px').valid).toBe(false);
    expect(validateBorderWidthValue(42).valid).toBe(false);
  });

  it('should reject negative values', () => {
    const result = validateBorderWidthValue({ value: -1, unit: 'px' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('MIN_VALUE');
  });

  it('should reject values over 100', () => {
    const result = validateBorderWidthValue({ value: 200, unit: 'px' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('MAX_VALUE');
  });

  it('should reject NaN value', () => {
    const result = validateBorderWidthValue({ value: NaN, unit: 'px' });
    expect(result.valid).toBe(false);
  });

  it('should reject non-px unit', () => {
    const result = validateBorderWidthValue({ value: 1, unit: 'rem' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_OPTION');
  });
});

// ---------------------------------------------------------------------------
// validateBorderColor
// ---------------------------------------------------------------------------

describe('validateBorderColor', () => {
  it('should accept undefined (no color set)', () => {
    expect(validateBorderColor(undefined)).toBe(true);
  });

  it('should accept null (no color set)', () => {
    expect(validateBorderColor(null)).toBe(true);
  });

  it('should accept valid color strings', () => {
    expect(validateBorderColor('#000')).toBe(true);
    expect(validateBorderColor('#000000')).toBe(true);
    expect(validateBorderColor('red')).toBe(true);
    expect(validateBorderColor('rgb(255, 0, 0)')).toBe(true);
    expect(validateBorderColor('rgba(0,0,0,0.5)')).toBe(true);
    expect(validateBorderColor('hsl(0, 0%, 0%)')).toBe(true);
    expect(validateBorderColor('transparent')).toBe(true);
    expect(validateBorderColor('currentColor')).toBe(true);
  });

  it('should reject non-string values', () => {
    expect(validateBorderColor(123)).toBe(false);
    expect(validateBorderColor(true)).toBe(false);
    expect(validateBorderColor({})).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateBorderColor('')).toBe(false);
    expect(validateBorderColor('   ')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateBorderProps
// ---------------------------------------------------------------------------

describe('validateBorderProps', () => {
  it('should accept valid border props', () => {
    const result = validateBorderProps({
      borderStyle: 'solid',
      borderWidth: { value: 2, unit: 'px' },
      borderColor: '#333',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept empty object', () => {
    const result = validateBorderProps({});
    expect(result.valid).toBe(true);
  });

  it('should accept partial props', () => {
    const result = validateBorderProps({ borderStyle: 'dashed' });
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    expect(validateBorderProps(null).valid).toBe(false);
    expect(validateBorderProps('string').valid).toBe(false);
    expect(validateBorderProps(42).valid).toBe(false);
  });

  it('should reject invalid border style', () => {
    const result = validateBorderProps({ borderStyle: 'groove' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_OPTION');
    expect(result.errors[0].key).toBe('borderStyle');
  });

  it('should reject invalid border width', () => {
    const result = validateBorderProps({ borderWidth: { value: -5, unit: 'px' } });
    expect(result.valid).toBe(false);
    expect(result.errors[0].key).toBe('borderWidth.value');
  });

  it('should reject invalid border color', () => {
    const result = validateBorderProps({ borderColor: '' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].key).toBe('borderColor');
  });

  it('should report errors for multiple invalid fields', () => {
    const result = validateBorderProps({
      borderStyle: 'invalid',
      borderWidth: { value: -10, unit: 'px' },
      borderColor: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

describe('default values', () => {
  it('should have DEFAULT_BORDER_WIDTH as 1px', () => {
    expect(DEFAULT_BORDER_WIDTH).toEqual({ value: 1, unit: 'px' });
  });

  it('should have DEFAULT_BORDER_COLOR as #000000', () => {
    expect(DEFAULT_BORDER_COLOR).toBe('#000000');
  });

  it('should have 3 VALID_BORDER_STYLES', () => {
    expect(VALID_BORDER_STYLES).toHaveLength(3);
  });
});

