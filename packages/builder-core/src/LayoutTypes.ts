/**
 * LayoutTypes — C16.31 Layout Property Types (Sprint 5A)
 *
 * Core data types for all layout properties used by:
 *   - LayoutEngine (CSS generation)
 *   - Inspector (UI rendering via PropertyRegistry)
 *   - Runtime (CompiledDocument consumption)
 *
 * DESIGN DECISIONS:
 *   - SpacingValue: object with 4 sides + linked flag (DR-LAYOUT-001)
 *   - SizeValue: { value, unit } instead of string (DR-LAYOUT-002)
 *   - Defaults defined at schema level, not in engine (DR-LAYOUT-003)
 *   - Units per-value, not global (DR-LAYOUT-004)
 *   - Gap separate from margin (DR-LAYOUT-005)
 */

// ---------------------------------------------------------------------------
// Display & Flex
// ---------------------------------------------------------------------------

export type DisplayMode = 'BLOCK' | 'FLEX' | 'GRID' | 'ABSOLUTE' | 'NONE';

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type JustifyContent = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignItems = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
export type AlignContent = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'stretch';
export type AlignSelf = 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';

export interface FlexContainerProps {
  display: DisplayMode;
  flexDirection?: FlexDirection;
  flexWrap?: FlexWrap;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  alignContent?: AlignContent;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
}

export interface FlexChildProps {
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: SizeValue;
  alignSelf?: AlignSelf;
  order?: number;
}

// ---------------------------------------------------------------------------
// Spacing (Padding & Margin)
// ---------------------------------------------------------------------------

export interface SpacingValue {
  top: number;
  right: number;
  bottom: number;
  left: number;
  linked: boolean;
}

export interface SpacingProps {
  padding: SpacingValue;
  margin: SpacingValue;
}

// ---------------------------------------------------------------------------
// Size (Dimensions)
// ---------------------------------------------------------------------------

export type CSSUnit =
  | 'px'
  | '%'
  | 'vw'
  | 'vh'
  | 'rem'
  | 'em'
  | 'auto'
  | 'fit-content'
  | 'min-content'
  | 'max-content';

export interface SizeValue {
  value: number;
  unit: CSSUnit;
}

export interface SizeProps {
  width: SizeValue;
  height: SizeValue;
  minWidth?: SizeValue;
  minHeight?: SizeValue;
  maxWidth?: SizeValue;
  maxHeight?: SizeValue;
  aspectRatio?: string | null;
}

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

export type PositionType = 'relative' | 'absolute' | 'fixed' | 'sticky';

export interface PositionProps {
  position: PositionType;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: number;
}

// ---------------------------------------------------------------------------
// Overflow
// ---------------------------------------------------------------------------

export type OverflowMode = 'visible' | 'hidden' | 'scroll' | 'auto';

export interface OverflowProps {
  overflow: OverflowMode;
  overflowX?: OverflowMode;
  overflowY?: OverflowMode;
}

/**
 * CSS Mapping — convert OverflowProps to CSS object.
 *
 * CSS spec:
 * - overflow is shorthand for overflow-x and overflow-y
 * - If overflowX/overflowY are undefined, the value of overflow is used for both axes
 * - If both axes are set explicitly, overflow is ignored in favor of overflowX/overflowY
 *
 * Performance: skip generating CSS entirely when both axes are 'visible' (default).
 */
export function overflowToCSS(props: OverflowProps): Record<string, string> {
  const css: Record<string, string> = {};

  const x = props.overflowX ?? props.overflow;
  const y = props.overflowY ?? props.overflow;

  // Don't emit CSS for default value 'visible'
  if (x === 'visible' && y === 'visible') {
    return css;
  }

  if (x === y) {
    css.overflow = x;
  } else {
    css.overflowX = x;
    css.overflowY = y;
  }

  return css;
}

/**
 * Validate a single OverflowMode value.
 */
export function validateOverflow(value: unknown): boolean {
  return ['visible', 'hidden', 'scroll', 'auto'].includes(value as string);
}

/**
 * Validate complete OverflowProps object.
 */
export function validateOverflowProps(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'overflow', message: 'Overflow props must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const props = value as Record<string, unknown>;

  if (!validateOverflow(props.overflow)) {
    errors.push({
      key: 'overflow',
      message: `Invalid overflow value: "${String(props.overflow)}". Must be one of: visible, hidden, scroll, auto`,
      code: 'INVALID_OPTION',
    });
  }

  if (props.overflowX !== undefined && !validateOverflow(props.overflowX)) {
    errors.push({
      key: 'overflowX',
      message: `Invalid overflow-x value: "${String(props.overflowX)}". Must be one of: visible, hidden, scroll, auto`,
      code: 'INVALID_OPTION',
    });
  }

  if (props.overflowY !== undefined && !validateOverflow(props.overflowY)) {
    errors.push({
      key: 'overflowY',
      message: `Invalid overflow-y value: "${String(props.overflowY)}". Must be one of: visible, hidden, scroll, auto`,
      code: 'INVALID_OPTION',
    });
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

export const DEFAULT_SPACING: SpacingValue = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  linked: true,
};

export const DEFAULT_SIZE_WIDTH: SizeValue = { value: 100, unit: '%' };
export const DEFAULT_SIZE_HEIGHT: SizeValue = { value: 0, unit: 'auto' };

export const VALID_CSS_UNITS: ReadonlyArray<CSSUnit> = [
  'px', '%', 'vw', 'vh', 'rem', 'em',
  'auto', 'fit-content', 'min-content', 'max-content',
];

// ---------------------------------------------------------------------------
// CSS Mapping (pure functions)
// ---------------------------------------------------------------------------

/**
 * Convert SpacingValue to CSS object (4 padding or margin properties).
 */
export function spacingToCSS(
  spacing: SpacingValue,
  isMargin: boolean
): Record<string, string> {
  const prefix = isMargin ? 'margin' : 'padding';
  return {
    [`${prefix}Top`]: `${spacing.top}px`,
    [`${prefix}Right`]: `${spacing.right}px`,
    [`${prefix}Bottom`]: `${spacing.bottom}px`,
    [`${prefix}Left`]: `${spacing.left}px`,
  };
}

/**
 * Convert SizeValue to CSS string.
 * Keyword units (auto, fit-content, etc.) are returned as-is.
 * Numeric units (px, %, etc.) are formatted as "value+unit".
 */
export function sizeToCSS(size: SizeValue): string {
  switch (size.unit) {
    case 'auto':
    case 'fit-content':
    case 'min-content':
    case 'max-content':
      return size.unit;
    default:
      return `${size.value}${size.unit}`;
  }
}

/**
 * Convert PositionProps to CSS object.
 */
export function positionToCSS(props: PositionProps): Record<string, string> {
  const css: Record<string, string> = {};

  if (props.position === 'absolute' || props.position === 'fixed' || props.position === 'sticky') {
    css.position = props.position;
    if (props.top !== 0 && props.top !== undefined) css.top = `${props.top}px`;
    if (props.right !== 0 && props.right !== undefined) css.right = `${props.right}px`;
    if (props.bottom !== 0 && props.bottom !== undefined) css.bottom = `${props.bottom}px`;
    if (props.left !== 0 && props.left !== undefined) css.left = `${props.left}px`;
  } else {
    css.position = 'relative';
  }

  if (props.zIndex && props.zIndex !== 0) {
    css.zIndex = String(props.zIndex);
  }

  return css;
}

/**
 * Convert FlexContainerProps to CSS object.
 */
export function displayToCSS(props: FlexContainerProps): Record<string, string> {
  const css: Record<string, string> = {};

  switch (props.display) {
    case 'FLEX':
      css.display = 'flex';
      css.flexDirection = props.flexDirection ?? 'row';
      css.flexWrap = props.flexWrap ?? 'nowrap';
      css.justifyContent = props.justifyContent ?? 'flex-start';
      css.alignItems = props.alignItems ?? 'stretch';
      css.alignContent = props.alignContent ?? 'flex-start';
      if (props.gap !== undefined) css.gap = `${props.gap}px`;
      if (props.rowGap !== undefined) css.rowGap = `${props.rowGap}px`;
      if (props.columnGap !== undefined) css.columnGap = `${props.columnGap}px`;
      break;

    case 'BLOCK':
      css.display = 'block';
      break;

    case 'GRID':
      css.display = 'grid';
      break;

    case 'ABSOLUTE':
      css.position = 'relative';
      break;

    case 'NONE':
      css.display = 'none';
      break;
  }

  return css;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationError {
  key: string;
  message: string;
  code: 'INVALID_FORMAT' | 'MIN_VALUE' | 'MAX_VALUE' | 'INVALID_OPTION' | 'CUSTOM';
}

export interface ValidationResult {
  valid: boolean;
  errors: ReadonlyArray<ValidationError>;
}

export function validateSpacingValue(value: unknown): ValidationResult {
  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'spacing', message: 'Spacing value must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const s = value as Record<string, unknown>;
  const errors: ValidationError[] = [];

  for (const side of ['top', 'right', 'bottom', 'left']) {
    const val = s[side];
    if (typeof val !== 'number' || isNaN(val as number)) {
      errors.push({ key: `spacing.${side}`, message: `Spacing ${side} must be a number`, code: 'INVALID_FORMAT' });
    } else if ((val as number) < 0) {
      errors.push({ key: `spacing.${side}`, message: `Spacing ${side} must be ≥ 0`, code: 'MIN_VALUE' });
    } else if ((val as number) > 500) {
      errors.push({ key: `spacing.${side}`, message: `Spacing ${side} must be ≤ 500`, code: 'MAX_VALUE' });
    }
  }

  if (typeof s.linked !== 'boolean') {
    errors.push({ key: 'spacing.linked', message: 'Spacing.linked must be a boolean', code: 'INVALID_FORMAT' });
  }

  return { valid: errors.length === 0, errors };
}

export function validateSizeValue(value: unknown): ValidationResult {
  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'size', message: 'Size value must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const s = value as Record<string, unknown>;
  const errors: ValidationError[] = [];

  if (typeof s.value !== 'number' || isNaN(s.value as number)) {
    errors.push({ key: 'size.value', message: 'Size value must be a number', code: 'INVALID_FORMAT' });
  } else if ((s.value as number) < 0) {
    errors.push({ key: 'size.value', message: 'Size value must be ≥ 0', code: 'MIN_VALUE' });
  } else if ((s.value as number) > 9999) {
    errors.push({ key: 'size.value', message: 'Size value must be ≤ 9999', code: 'MAX_VALUE' });
  }

  if (!VALID_CSS_UNITS.includes(s.unit as CSSUnit)) {
    errors.push({ key: 'size.unit', message: `Invalid unit: ${String(s.unit)}`, code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}

export function validatePosition(value: string): boolean {
  return ['relative', 'absolute', 'fixed', 'sticky'].includes(value);
}

export function validateZIndex(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 9999;
}

export function validateGap(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 200;
}

