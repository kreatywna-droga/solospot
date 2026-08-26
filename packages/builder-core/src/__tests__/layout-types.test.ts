/**
 * Tests for LayoutTypes — C16.31 Layout Property Types (Sprint 5A)
 *
 * Coverage targets:
 *   - CSS mapping functions (spacingToCSS, sizeToCSS, positionToCSS, displayToCSS)
 *   - Validation functions (validateSpacingValue, validateSizeValue, validatePosition, validateZIndex, validateGap)
 *   - Default values
 *   - Edge cases (zero, negative, max bounds)
 */

import { describe, it, expect } from 'vitest';
import {
  spacingToCSS,
  sizeToCSS,
  positionToCSS,
  displayToCSS,
  overflowToCSS,
  validateSpacingValue,
  validateSizeValue,
  validatePosition,
  validateZIndex,
  validateGap,
  validateOverflow,
  validateOverflowProps,
  DEFAULT_SPACING,
  DEFAULT_SIZE_WIDTH,
  DEFAULT_SIZE_HEIGHT,
} from '../LayoutTypes';

// ---------------------------------------------------------------------------
// spacingToCSS
// ---------------------------------------------------------------------------

describe('spacingToCSS', () => {
  it('should generate padding CSS from SpacingValue', () => {
    const result = spacingToCSS({ top: 10, right: 20, bottom: 30, left: 40, linked: false }, false);
    expect(result).toEqual({
      paddingTop: '10px',
      paddingRight: '20px',
      paddingBottom: '30px',
      paddingLeft: '40px',
    });
  });

  it('should generate margin CSS from SpacingValue', () => {
    const result = spacingToCSS({ top: 8, right: 16, bottom: 8, left: 16, linked: false }, true);
    expect(result).toEqual({
      marginTop: '8px',
      marginRight: '16px',
      marginBottom: '8px',
      marginLeft: '16px',
    });
  });

  it('should handle zero values', () => {
    const result = spacingToCSS(DEFAULT_SPACING, false);
    expect(result.paddingTop).toBe('0px');
    expect(result.paddingBottom).toBe('0px');
  });

  it('should handle large values', () => {
    const result = spacingToCSS({ top: 500, right: 500, bottom: 500, left: 500, linked: true }, false);
    expect(result.paddingTop).toBe('500px');
  });

  it('should not depend on linked flag for CSS output', () => {
    const linked = spacingToCSS({ top: 10, right: 10, bottom: 10, left: 10, linked: true }, false);
    const unlinked = spacingToCSS({ top: 10, right: 10, bottom: 10, left: 10, linked: false }, false);
    expect(linked).toEqual(unlinked);
  });
});

// ---------------------------------------------------------------------------
// sizeToCSS
// ---------------------------------------------------------------------------

describe('sizeToCSS', () => {
  it('should format px units', () => {
    expect(sizeToCSS({ value: 320, unit: 'px' })).toBe('320px');
  });

  it('should format percentage units', () => {
    expect(sizeToCSS({ value: 100, unit: '%' })).toBe('100%');
  });

  it('should format viewport units', () => {
    expect(sizeToCSS({ value: 50, unit: 'vw' })).toBe('50vw');
    expect(sizeToCSS({ value: 100, unit: 'vh' })).toBe('100vh');
  });

  it('should format rem/em units', () => {
    expect(sizeToCSS({ value: 2, unit: 'rem' })).toBe('2rem');
    expect(sizeToCSS({ value: 1.5, unit: 'em' })).toBe('1.5em');
  });

  it('should return keyword units as-is without value', () => {
    expect(sizeToCSS({ value: 0, unit: 'auto' })).toBe('auto');
    expect(sizeToCSS({ value: 0, unit: 'fit-content' })).toBe('fit-content');
    expect(sizeToCSS({ value: 0, unit: 'min-content' })).toBe('min-content');
    expect(sizeToCSS({ value: 0, unit: 'max-content' })).toBe('max-content');
  });

  it('should handle zero', () => {
    expect(sizeToCSS({ value: 0, unit: 'px' })).toBe('0px');
  });

  it('should handle decimal values', () => {
    expect(sizeToCSS({ value: 33.33, unit: '%' })).toBe('33.33%');
  });
});

// ---------------------------------------------------------------------------
// positionToCSS
// ---------------------------------------------------------------------------

describe('positionToCSS', () => {
  it('should set position relative by default', () => {
    const result = positionToCSS({ position: 'relative' });
    expect(result.position).toBe('relative');
    expect(result.top).toBeUndefined();
  });

  it('should set absolute with coordinates', () => {
    const result = positionToCSS({ position: 'absolute', top: 10, left: 20 });
    expect(result).toEqual({
      position: 'absolute',
      top: '10px',
      left: '20px',
    });
  });

  it('should include zIndex when non-zero', () => {
    const result = positionToCSS({ position: 'relative', zIndex: 100 });
    expect(result.zIndex).toBe('100');
  });

  it('should not include zIndex when zero', () => {
    const result = positionToCSS({ position: 'relative', zIndex: 0 });
    expect(result.zIndex).toBeUndefined();
  });

it('should handle fixed position', () => {
    const result = positionToCSS({ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 });
    expect(result.position).toBe('fixed');
    // positionToCSS excludes zero values (top: 0 is not emitted)
    expect(result.top).toBeUndefined();
  });

  it('should handle sticky position', () => {
    const result = positionToCSS({ position: 'sticky', top: 0 });
    expect(result.position).toBe('sticky');
    // positionToCSS excludes zero values (top: 0 is not emitted)
    expect(result.top).toBeUndefined();
  });

  it('should not include zero coordinates for absolute', () => {
    const result = positionToCSS({ position: 'absolute', top: 0 });
    expect(result.position).toBe('absolute');
    expect(result.top).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// displayToCSS
// ---------------------------------------------------------------------------

describe('displayToCSS', () => {
  it('should generate flex CSS', () => {
    const result = displayToCSS({
      display: 'FLEX',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    });
    expect(result).toMatchObject({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
    });
  });

  it('should use defaults for flex when not specified', () => {
    const result = displayToCSS({ display: 'FLEX' });
    expect(result.flexDirection).toBe('row');
    expect(result.flexWrap).toBe('nowrap');
    expect(result.justifyContent).toBe('flex-start');
    expect(result.alignItems).toBe('stretch');
  });

  it('should generate block CSS', () => {
    const result = displayToCSS({ display: 'BLOCK' });
    expect(result).toEqual({ display: 'block' });
  });

  it('should generate grid CSS', () => {
    const result = displayToCSS({ display: 'GRID' });
    expect(result).toEqual({ display: 'grid' });
  });

  it('should generate absolute (relative container) CSS', () => {
    const result = displayToCSS({ display: 'ABSOLUTE' });
    expect(result).toEqual({ position: 'relative' });
  });

  it('should generate none CSS', () => {
    const result = displayToCSS({ display: 'NONE' });
    expect(result).toEqual({ display: 'none' });
  });

  it('should handle rowGap and columnGap', () => {
    const result = displayToCSS({ display: 'FLEX', rowGap: 8, columnGap: 16 });
    expect(result.rowGap).toBe('8px');
    expect(result.columnGap).toBe('16px');
  });
});

// ---------------------------------------------------------------------------
// validateSpacingValue
// ---------------------------------------------------------------------------

describe('validateSpacingValue', () => {
  it('should accept valid spacing', () => {
    const result = validateSpacingValue({ top: 10, right: 20, bottom: 30, left: 40, linked: true });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept zero spacing', () => {
    const result = validateSpacingValue(DEFAULT_SPACING);
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    expect(validateSpacingValue(null).valid).toBe(false);
    expect(validateSpacingValue('string').valid).toBe(false);
    expect(validateSpacingValue(42).valid).toBe(false);
  });

  it('should reject negative values', () => {
    const result = validateSpacingValue({ top: -10, right: 0, bottom: 0, left: 0, linked: true });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('MIN_VALUE');
  });

  it('should reject values over 500', () => {
    const result = validateSpacingValue({ top: 0, right: 501, bottom: 0, left: 0, linked: true });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('MAX_VALUE');
  });

  it('should report errors for all invalid sides', () => {
    const result = validateSpacingValue({ top: -10, right: 600, bottom: 'invalid' as any, left: 0, linked: true });
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('should reject invalid linked type', () => {
    const result = validateSpacingValue({ top: 0, right: 0, bottom: 0, left: 0, linked: 'yes' as any });
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateSizeValue
// ---------------------------------------------------------------------------

describe('validateSizeValue', () => {
  it('should accept valid size', () => {
    const result = validateSizeValue({ value: 100, unit: '%' });
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    expect(validateSizeValue('320px').valid).toBe(false);
    expect(validateSizeValue(null).valid).toBe(false);
  });

  it('should reject NaN value', () => {
    const result = validateSizeValue({ value: NaN, unit: 'px' });
    expect(result.valid).toBe(false);
  });

  it('should reject negative value', () => {
    const result = validateSizeValue({ value: -100, unit: 'px' });
    expect(result.valid).toBe(false);
  });

  it('should reject value over 9999', () => {
    const result = validateSizeValue({ value: 10000, unit: 'px' });
    expect(result.valid).toBe(false);
  });

  it('should reject invalid unit', () => {
    const result = validateSizeValue({ value: 100, unit: 'invalid' as any });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_OPTION');
  });

  it('should accept all valid CSS units', () => {
    const validUnits = ['px', '%', 'vw', 'vh', 'rem', 'em', 'auto', 'fit-content', 'min-content', 'max-content'];
    for (const unit of validUnits) {
      const result = validateSizeValue({ value: 0, unit: unit as any });
      expect(result.valid).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// validatePosition, validateZIndex, validateGap
// ---------------------------------------------------------------------------

describe('validatePosition', () => {
  it('should accept valid positions', () => {
    expect(validatePosition('relative')).toBe(true);
    expect(validatePosition('absolute')).toBe(true);
    expect(validatePosition('fixed')).toBe(true);
    expect(validatePosition('sticky')).toBe(true);
  });

  it('should reject invalid positions', () => {
    expect(validatePosition('static')).toBe(false);
    expect(validatePosition('')).toBe(false);
    expect(validatePosition('inherit')).toBe(false);
  });
});

describe('validateZIndex', () => {
  it('should accept valid z-index values', () => {
    expect(validateZIndex(0)).toBe(true);
    expect(validateZIndex(1)).toBe(true);
    expect(validateZIndex(9999)).toBe(true);
  });

  it('should reject invalid z-index values', () => {
    expect(validateZIndex(-1)).toBe(false);
    expect(validateZIndex(10000)).toBe(false);
    expect(validateZIndex(1.5)).toBe(false);
    expect(validateZIndex(NaN)).toBe(false);
  });
});

describe('validateGap', () => {
  it('should accept valid gap values', () => {
    expect(validateGap(0)).toBe(true);
    expect(validateGap(16)).toBe(true);
    expect(validateGap(200)).toBe(true);
  });

  it('should reject invalid gap values', () => {
    expect(validateGap(-1)).toBe(false);
    expect(validateGap(201)).toBe(false);
    expect(validateGap(NaN)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// overflowToCSS
// ---------------------------------------------------------------------------

describe('overflowToCSS', () => {
  it('should return empty object for visible (default)', () => {
    const result = overflowToCSS({ overflow: 'visible' });
    expect(result).toEqual({});
  });

  it('should generate single overflow property for uniform axis values', () => {
    const result = overflowToCSS({ overflow: 'hidden' });
    expect(result).toEqual({ overflow: 'hidden' });
  });

  it('should generate overflowX and overflowY when axes differ', () => {
    const result = overflowToCSS({ overflow: 'visible', overflowX: 'scroll', overflowY: 'hidden' });
    expect(result).toEqual({ overflowX: 'scroll', overflowY: 'hidden' });
  });

  it('should prefer explicit overflowX/overflowY over overflow', () => {
    const result = overflowToCSS({ overflow: 'hidden', overflowX: 'scroll', overflowY: 'auto' });
    expect(result).toEqual({ overflowX: 'scroll', overflowY: 'auto' });
  });

  it('should handle scroll', () => {
    const result = overflowToCSS({ overflow: 'scroll' });
    expect(result).toEqual({ overflow: 'scroll' });
  });

  it('should handle auto', () => {
    const result = overflowToCSS({ overflow: 'auto' });
    expect(result).toEqual({ overflow: 'auto' });
  });

  it('should fall back to overflow value when overflowX is undefined', () => {
    const result = overflowToCSS({ overflow: 'hidden', overflowY: 'scroll' });
    expect(result).toEqual({ overflowX: 'hidden', overflowY: 'scroll' });
  });

  it('should fall back to overflow value when overflowY is undefined', () => {
    const result = overflowToCSS({ overflow: 'scroll', overflowX: 'auto' });
    expect(result).toEqual({ overflowX: 'auto', overflowY: 'scroll' });
  });
});

// ---------------------------------------------------------------------------
// validateOverflow
// ---------------------------------------------------------------------------

describe('validateOverflow', () => {
  it('should accept valid overflow modes', () => {
    expect(validateOverflow('visible')).toBe(true);
    expect(validateOverflow('hidden')).toBe(true);
    expect(validateOverflow('scroll')).toBe(true);
    expect(validateOverflow('auto')).toBe(true);
  });

  it('should reject invalid overflow modes', () => {
    expect(validateOverflow('clip')).toBe(false);
    expect(validateOverflow('')).toBe(false);
    expect(validateOverflow('initial')).toBe(false);
    expect(validateOverflow('inherit')).toBe(false);
    expect(validateOverflow(123)).toBe(false);
    expect(validateOverflow(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateOverflowProps
// ---------------------------------------------------------------------------

describe('validateOverflowProps', () => {
  it('should accept valid overflow props', () => {
    const result = validateOverflowProps({ overflow: 'hidden' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept overflow with explicit axes', () => {
    const result = validateOverflowProps({ overflow: 'scroll', overflowX: 'auto', overflowY: 'hidden' });
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    expect(validateOverflowProps(null).valid).toBe(false);
    expect(validateOverflowProps('string').valid).toBe(false);
    expect(validateOverflowProps(42).valid).toBe(false);
  });

  it('should reject invalid overflow value', () => {
    const result = validateOverflowProps({ overflow: 'clip' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_OPTION');
    expect(result.errors[0].key).toBe('overflow');
  });

  it('should reject invalid overflowX value', () => {
    const result = validateOverflowProps({ overflow: 'hidden', overflowX: 'invalid' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].key).toBe('overflowX');
  });

  it('should reject invalid overflowY value', () => {
    const result = validateOverflowProps({ overflow: 'auto', overflowY: 'inherit' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].key).toBe('overflowY');
  });

  it('should report errors for multiple invalid fields', () => {
    const result = validateOverflowProps({ overflow: 'clip', overflowX: 'bogus', overflowY: 'nope' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// default values
// ---------------------------------------------------------------------------

describe('default values', () => {
  it('should have DEFAULT_SPACING with all zeros and linked', () => {
    expect(DEFAULT_SPACING).toEqual({ top: 0, right: 0, bottom: 0, left: 0, linked: true });
  });

  it('should have DEFAULT_SIZE_WIDTH as 100%', () => {
    expect(DEFAULT_SIZE_WIDTH).toEqual({ value: 100, unit: '%' });
  });

  it('should have DEFAULT_SIZE_HEIGHT as auto', () => {
    expect(DEFAULT_SIZE_HEIGHT).toEqual({ value: 0, unit: 'auto' });
  });
});

