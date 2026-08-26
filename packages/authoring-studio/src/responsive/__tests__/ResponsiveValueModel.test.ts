/**
 * ResponsiveValueModel.test.ts — Sprint S28
 *
 * Unit tests for ResponsiveValueModel DTOs, fallback order,
 * resolveEffectiveValue, setResponsiveOverride, and removeResponsiveOverride.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveEffectiveValue,
  createResponsiveValue,
  setResponsiveOverride,
  removeResponsiveOverride,
  DEFAULT_FALLBACK_ORDER,
} from '../ResponsiveValueModel';

describe('ResponsiveValueModel', () => {
  it('resolves direct breakpoint override when present', () => {
    const val = createResponsiveValue('100px', {
      tablet: '80px',
      mobile: '50px',
    });

    expect(resolveEffectiveValue(val, 'mobile')).toBe('50px');
    expect(resolveEffectiveValue(val, 'tablet')).toBe('80px');
    expect(resolveEffectiveValue(val, 'desktop')).toBe('100px');
  });

  it('cascades fallback upwards to desktop base when target breakpoint override is missing', () => {
    const val = createResponsiveValue('120px', {
      tablet: '90px',
    });

    // Mobile has no direct override -> falls back to tablet ('90px')
    expect(resolveEffectiveValue(val, 'mobile')).toBe('90px');
    // Laptop has no direct override -> falls back to desktop ('120px')
    expect(resolveEffectiveValue(val, 'laptop')).toBe('120px');
  });

  it('returns undefined if responsive value object is undefined', () => {
    expect(resolveEffectiveValue(undefined, 'desktop')).toBeUndefined();
  });

  it('immutably sets a new breakpoint override', () => {
    const base = createResponsiveValue('100px');
    const updated = setResponsiveOverride(base, 'mobile', '60px');

    expect(base.mobile).toBeUndefined();
    expect(updated.mobile).toBe('60px');
    expect(updated.desktop).toBe('100px');
  });

  it('immutably removes a breakpoint override', () => {
    const base = createResponsiveValue('100px', { mobile: '60px' });
    const cleaned = removeResponsiveOverride(base, 'mobile');

    expect(base.mobile).toBe('60px');
    expect(cleaned.mobile).toBeUndefined();
    expect(cleaned.desktop).toBe('100px');
  });
});
