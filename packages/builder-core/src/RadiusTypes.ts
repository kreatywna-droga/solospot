/**
 * RadiusTypes — C16.53 Radius Property Types (Sprint 5B.4)
 *
 * Core data types for CSS border-radius properties used by:
 *   - RadiusEngine (CSS generation)
 *   - Inspector (UI rendering via PropertyRegistry)
 *   - Runtime (CompiledDocument consumption)
 *
 * DESIGN DECISIONS:
 *   - RadiusProps: mode (uniform/per-corner) + 5 optional RadiusValue fields
 *   - RadiusValue: structural model { value, unit } instead of string (DR-RADIUS-001)
 *   - UPDATE_PROPS instead of SET_RADIUS (DR-RADIUS-003)
 *   - Category: Visual (ADR-VISUAL-001)
 *   - Smart CSS: skip output for zero/undefined values (DR-RADIUS-004)
 */

import type { ValidationError, ValidationResult } from './LayoutTypes';

// ---------------------------------------------------------------------------
// Radius Types
// ---------------------------------------------------------------------------

/**
 * Radius mode: uniform (single value for all 4 corners) or per-corner.
 */
export type RadiusMode = 'uniform' | 'per-corner';

/**
 * CSS units valid for border-radius.
 * MVP: px, %.
 */
export type RadiusUnit = 'px' | '%';

/**
 * Single radius value with numeric value and CSS unit.
 */
export interface RadiusValue {
  value: number;
  unit: RadiusUnit;
}

/**
 * Radius properties.
 *
 * In 'uniform' mode, only `radius` is used for all 4 corners.
 * In 'per-corner' mode, individual corner values are used.
 * When switching modes, preserved values carry over.
 *
 * Smart CSS: if radius is 0 or undefined, no CSS is emitted.
 */
export interface RadiusProps {
  mode: RadiusMode;
  radius?: RadiusValue;
  topLeft?: RadiusValue;
  topRight?: RadiusValue;
  bottomRight?: RadiusValue;
  bottomLeft?: RadiusValue;
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

export const DEFAULT_RADIUS_MODE: RadiusMode = 'uniform';
export const DEFAULT_RADIUS_VALUE: RadiusValue = { value: 0, unit: 'px' };

export const VALID_RADIUS_UNITS: ReadonlyArray<RadiusUnit> = ['px', '%'];

// ---------------------------------------------------------------------------
// CSS Mapping (pure function)
// ---------------------------------------------------------------------------

/**
 * Convert RadiusProps to CSS object.
 *
 * - uniform mode: emits border-radius if radius is defined and > 0
 * - per-corner mode: emits individual border-*-*-radius properties
 * - Smart CSS: does NOT emit CSS for zero or undefined values
 *
 * This is a pure function — no side effects, deterministic, testable.
 */
export function radiusToCSS(props: RadiusProps): Record<string, string> {
  const css: Record<string, string> = {};
  const { mode, radius, topLeft, topRight, bottomRight, bottomLeft } = props;

  if (mode === 'per-corner') {
    if (topLeft && topLeft.value > 0) {
      css.borderTopLeftRadius = `${topLeft.value}${topLeft.unit}`;
    }
    if (topRight && topRight.value > 0) {
      css.borderTopRightRadius = `${topRight.value}${topRight.unit}`;
    }
    if (bottomRight && bottomRight.value > 0) {
      css.borderBottomRightRadius = `${bottomRight.value}${bottomRight.unit}`;
    }
    if (bottomLeft && bottomLeft.value > 0) {
      css.borderBottomLeftRadius = `${bottomLeft.value}${bottomLeft.unit}`;
    }
  } else {
    // Uniform mode — single radius for all corners
    if (radius && radius.value > 0) {
      css.borderRadius = `${radius.value}${radius.unit}`;
    }
  }

  return css;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a single RadiusValue.
 */
export function validateRadiusValue(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'radius', message: 'Radius value must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const r = value as Record<string, unknown>;

  if (typeof r.value !== 'number' || isNaN(r.value as number)) {
    errors.push({ key: 'radius.value', message: 'Radius value must be a number', code: 'INVALID_FORMAT' });
  } else if ((r.value as number) < 0) {
    errors.push({ key: 'radius.value', message: 'Radius must be ≥ 0', code: 'MIN_VALUE' });
  } else if ((r.value as number) > 999) {
    errors.push({ key: 'radius.value', message: 'Radius must be ≤ 999', code: 'MAX_VALUE' });
  }

  if (!VALID_RADIUS_UNITS.includes(r.unit as RadiusUnit)) {
    errors.push({
      key: 'radius.unit',
      message: `Invalid radius unit: "${String(r.unit)}". Must be px or %`,
      code: 'INVALID_OPTION',
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate complete RadiusProps object.
 */
export function validateRadiusProps(props: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!props || typeof props !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'radius', message: 'Radius props must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const p = props as Record<string, unknown>;

  // Validate mode
  if (p.mode !== undefined && !['uniform', 'per-corner'].includes(p.mode as string)) {
    errors.push({
      key: 'mode',
      message: `Invalid radius mode: "${String(p.mode)}". Must be "uniform" or "per-corner"`,
      code: 'INVALID_OPTION',
    });
  }

  // Validate each radius value field
  const radiusKeys = ['radius', 'topLeft', 'topRight', 'bottomRight', 'bottomLeft'];

  for (const key of radiusKeys) {
    if (p[key] !== undefined) {
      const result = validateRadiusValue(p[key]);
      if (!result.valid) {
        // Prefix errors with the field name
        for (const err of result.errors) {
          errors.push({
            key: `${key}.${err.key}`,
            message: err.message,
            code: err.code,
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

