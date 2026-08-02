/**
 * BorderTypes — C16.49 Border Property Types (Sprint 5B.3)
 *
 * Core data types for CSS Border properties used by:
 *   - BorderEngine (CSS generation)
 *   - Inspector (UI rendering via PropertyRegistry)
 *   - Runtime (CompiledDocument consumption)
 *
 * DESIGN DECISIONS:
 *   - BorderProps: uniform border (all 4 edges same value) for MVP (DR-BORDER-002)
 *   - BorderWidthValue: structural model { value, unit } instead of string (DR-BORDER-001)
 *   - UPDATE_PROPS instead of SET_BORDER (DR-BORDER-003)
 *   - Category: Visual (ADR-VISUAL-001)
 *   - Smart CSS: skip output for undefined properties
 */

import type { ValidationError, ValidationResult } from './LayoutTypes';

// ---------------------------------------------------------------------------
// Border Types
// ---------------------------------------------------------------------------

/**
 * Border style values (CSS border-style).
 * MVP: solid, dashed, dotted.
 * Future: groove, ridge, inset, outset, none, hidden.
 */
export type BorderStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Border width with value and unit.
 * MVP: only 'px' unit.
 */
export interface BorderWidthValue {
  value: number;
  unit: 'px';
}

/**
 * Border properties — uniform border for all 4 edges.
 * All properties are optional. If borderStyle is not set, no border CSS is emitted.
 *
 * Future extension: per-edge overrides (borderTopStyle, borderRightWidth, etc.)
 */
export interface BorderProps {
  borderStyle?: BorderStyle;
  borderWidth?: BorderWidthValue;
  borderColor?: string;
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

export const DEFAULT_BORDER_WIDTH: BorderWidthValue = { value: 1, unit: 'px' };
export const DEFAULT_BORDER_COLOR = '#000000';

export const VALID_BORDER_STYLES: ReadonlyArray<BorderStyle> = ['solid', 'dashed', 'dotted'];

// ---------------------------------------------------------------------------
// CSS Mapping (pure function)
// ---------------------------------------------------------------------------

/**
 * Convert BorderProps to CSS object.
 * Only includes properties that are defined.
 * Smart CSS: does NOT emit CSS for undefined properties.
 *
 * This is a pure function — no side effects, deterministic, testable.
 */
export function borderToCSS(props: BorderProps): Record<string, string> {
  const css: Record<string, string> = {};

  if (props.borderStyle) {
    css.borderStyle = props.borderStyle;
  }

  if (props.borderWidth) {
    css.borderWidth = `${props.borderWidth.value}${props.borderWidth.unit}`;
  }

  if (props.borderColor) {
    css.borderColor = props.borderColor;
  }

  return css;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a single BorderStyle value.
 */
export function validateBorderStyle(value: unknown): boolean {
  return VALID_BORDER_STYLES.includes(value as BorderStyle);
}

/**
 * Validate BorderWidthValue.
 */
export function validateBorderWidthValue(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'borderWidth', message: 'Border width must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const w = value as Record<string, unknown>;

  if (typeof w.value !== 'number' || isNaN(w.value as number)) {
    errors.push({ key: 'borderWidth.value', message: 'Border width value must be a number', code: 'INVALID_FORMAT' });
  } else if ((w.value as number) < 0) {
    errors.push({ key: 'borderWidth.value', message: 'Border width must be ≥ 0', code: 'MIN_VALUE' });
  } else if ((w.value as number) > 100) {
    errors.push({ key: 'borderWidth.value', message: 'Border width must be ≤ 100', code: 'MAX_VALUE' });
  }

  if (w.unit !== 'px') {
    errors.push({ key: 'borderWidth.unit', message: 'Border width unit must be "px"', code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate border color string.
 */
export function validateBorderColor(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string') return false;
  return value.trim().length > 0;
}

/**
 * Validate complete BorderProps object.
 */
export function validateBorderProps(props: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!props || typeof props !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'border', message: 'Border props must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const p = props as Record<string, unknown>;

  if (p.borderStyle !== undefined && !validateBorderStyle(p.borderStyle)) {
    errors.push({
      key: 'borderStyle',
      message: `Invalid border style: "${String(p.borderStyle)}". Must be one of: solid, dashed, dotted`,
      code: 'INVALID_OPTION',
    });
  }

  if (p.borderWidth !== undefined) {
    errors.push(...validateBorderWidthValue(p.borderWidth).errors);
  }

  if (p.borderColor !== undefined && !validateBorderColor(p.borderColor)) {
    errors.push({
      key: 'borderColor',
      message: 'Invalid border color. Must be a non-empty string',
      code: 'INVALID_FORMAT',
    });
  }

  return { valid: errors.length === 0, errors };
}

