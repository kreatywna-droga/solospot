/**
 * GridTypes — C16.38 Grid Property Types (Sprint 5B.1)
 *
 * Core data types for all CSS Grid layout properties used by:
 *   - GridEngine (CSS generation)
 *   - Inspector (UI rendering via PropertyRegistry)
 *   - Runtime (CompiledDocument consumption)
 *
 * DESIGN DECISIONS:
 *   - TrackBreadcrumb: structural model instead of CSS string (DR-GRID-001)
 *   - GridContainerProps / GridItemProps: separate interfaces (DR-GRID-002)
 *   - GridSpanValue: structural model instead of CSS string (DR-GRID-003)
 *   - Visibility based on display: GRID (DR-GRID-004)
 *   - Gap shared with FlexContainerProps (DR-GRID-005)
 *   - Grid alignment types separate from Flex (DR-GRID-006)
 *   - displayToCSS extended for GRID mode (DR-GRID-007)
 */

// ---------------------------------------------------------------------------
// Grid Track — Structural model
// ---------------------------------------------------------------------------

/**
 * Unit types allowed for grid track sizes.
 * 'fr' is exclusive to CSS Grid.
 */
export type GridUnit = 'fr' | 'px' | '%' | 'vw' | 'vh' | 'rem' | 'em' | 'auto' | 'min-content' | 'max-content';

/**
 * A fixed track size with a numeric value and unit.
 */
export interface TrackSize {
  value: number;
  unit: GridUnit;
}

/**
 * A single track breadcrumb — structural representation of a CSS grid track value.
 *
 * Instead of storing CSS strings like "repeat(3, 1fr)" or "minmax(200px, 1fr)",
 * we model the structure explicitly. This allows:
 *   - Validation without CSS parsing
 *   - Deterministic CSS generation
 *   - Easy serialization/deserialization
 *   - AI-friendly model
 *   - Future extensibility (subgrid, auto-fill, auto-fit)
 */
export type TrackBreadcrumb =
  | { type: 'fixed'; size: TrackSize }
  | { type: 'keyword'; value: 'auto' | 'min-content' | 'max-content' }
  | { type: 'minmax'; min: TrackBreadcrumb; max: TrackBreadcrumb }
  | { type: 'repeat'; count: number; track: TrackBreadcrumb };

/**
 * A list of track breadcrumbs defining columns or rows.
 */
export type TrackList = TrackBreadcrumb[];

// ---------------------------------------------------------------------------
// Grid Container
// ---------------------------------------------------------------------------

export type GridAutoFlow = 'row' | 'column' | 'row-dense' | 'column-dense';

export type GridJustifyContent = 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
export type GridAlignContent = 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
export type GridJustifyItems = 'start' | 'end' | 'center' | 'stretch';
export type GridAlignItems = 'start' | 'end' | 'center' | 'stretch';

/**
 * Grid container properties.
 * Applied to the element with `display: grid`.
 */
export interface GridContainerProps {
  gridTemplateColumns?: TrackList;
  gridTemplateRows?: TrackList;
  gridAutoFlow?: GridAutoFlow;
  gridAutoColumns?: TrackBreadcrumb;
  gridAutoRows?: TrackBreadcrumb;
  justifyContent?: GridJustifyContent;
  alignContent?: GridAlignContent;
  justifyItems?: GridJustifyItems;
  alignItems?: GridAlignItems;
}

// ---------------------------------------------------------------------------
// Grid Item
// ---------------------------------------------------------------------------

/**
 * Structural representation of a grid span value.
 *
 * Instead of storing CSS strings like "1 / 3" or "span 2",
 * we model the structure explicitly.
 */
export type GridSpanValue =
  | { type: 'line'; start: number; end?: number }
  | { type: 'span'; start: number; span: number }
  | { type: 'span-only'; span: number };

export type GridSelfAlignment = 'start' | 'end' | 'center' | 'stretch';

/**
 * Grid item properties.
 * Applied to direct children of a grid container.
 */
export interface GridItemProps {
  gridColumn?: GridSpanValue;
  gridRow?: GridSpanValue;
  gridArea?: string;
  gridColumnStart?: number;
  gridColumnEnd?: number;
  gridRowStart?: number;
  gridRowEnd?: number;
  justifySelf?: GridSelfAlignment;
  alignSelf?: GridSelfAlignment;
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

export const DEFAULT_GRID_AUTO_COLUMNS: TrackBreadcrumb = {
  type: 'fixed',
  size: { value: 1, unit: 'fr' },
};

export const DEFAULT_GRID_AUTO_ROWS: TrackBreadcrumb = {
  type: 'fixed',
  size: { value: 1, unit: 'fr' },
};

export const DEFAULT_GRID_AUTO_FLOW: GridAutoFlow = 'row';

export const DEFAULT_SINGLE_COLUMN_TRACK: TrackList = [
  { type: 'fixed', size: { value: 1, unit: 'fr' } },
];

export const VALID_GRID_UNITS: ReadonlyArray<GridUnit> = [
  'fr', 'px', '%', 'vw', 'vh', 'rem', 'em',
  'auto', 'min-content', 'max-content',
];

export const VALID_GRID_AUTO_FLOWS: ReadonlyArray<GridAutoFlow> = [
  'row', 'column', 'row-dense', 'column-dense',
];

export const VALID_GRID_CONTENT_ALIGNMENT: ReadonlyArray<string> = [
  'start', 'end', 'center', 'stretch', 'space-around', 'space-between', 'space-evenly',
];

export const VALID_GRID_ITEM_ALIGNMENT: ReadonlyArray<string> = [
  'start', 'end', 'center', 'stretch',
];

// ---------------------------------------------------------------------------
// CSS Mapping (pure functions)
// ---------------------------------------------------------------------------

/**
 * Convert a single TrackBreadcrumb to its CSS string representation.
 * CSS is generated at the output boundary — the domain model stays structural.
 */
export function trackBreadcrumbToCSS(track: TrackBreadcrumb): string {
  switch (track.type) {
    case 'fixed':
      return `${track.size.value}${track.size.unit}`;
    case 'keyword':
      return track.value;
    case 'minmax':
      return `minmax(${trackBreadcrumbToCSS(track.min)}, ${trackBreadcrumbToCSS(track.max)})`;
    case 'repeat':
      return `repeat(${track.count}, ${trackBreadcrumbToCSS(track.track)})`;
  }
}

/**
 * Convert a TrackList (array of track breadcrumbs) to a CSS string.
 * Tracks are space-separated.
 */
export function trackListToCSS(tracks: TrackList): string {
  return tracks.map(trackBreadcrumbToCSS).join(' ');
}

/**
 * Convert a GridSpanValue to its CSS string representation.
 */
export function gridSpanToCSS(span: GridSpanValue): string {
  switch (span.type) {
    case 'line':
      return span.end !== undefined ? `${span.start} / ${span.end}` : `${span.start}`;
    case 'span':
      return `${span.start} / span ${span.span}`;
    case 'span-only':
      return `span ${span.span}`;
  }
}

/**
 * Convert GridContainerProps to a CSS object.
 * Only includes properties that are defined.
 */
export function gridContainerToCSS(props: GridContainerProps): Record<string, string> {
  const css: Record<string, string> = {};

  if (props.gridTemplateColumns) {
    css.gridTemplateColumns = trackListToCSS(props.gridTemplateColumns);
  }
  if (props.gridTemplateRows) {
    css.gridTemplateRows = trackListToCSS(props.gridTemplateRows);
  }
  if (props.gridAutoFlow) {
    css.gridAutoFlow = props.gridAutoFlow;
  }
  if (props.gridAutoColumns) {
    css.gridAutoColumns = trackBreadcrumbToCSS(props.gridAutoColumns);
  }
  if (props.gridAutoRows) {
    css.gridAutoRows = trackBreadcrumbToCSS(props.gridAutoRows);
  }
  if (props.justifyContent) {
    css.justifyContent = props.justifyContent;
  }
  if (props.alignContent) {
    css.alignContent = props.alignContent;
  }
  if (props.justifyItems) {
    css.justifyItems = props.justifyItems;
  }
  if (props.alignItems) {
    css.alignItems = props.alignItems;
  }

  return css;
}

/**
 * Convert GridItemProps to a CSS object.
 * Longhand properties (gridColumnStart, etc.) override shorthand (gridColumn).
 */
export function gridItemToCSS(props: GridItemProps): Record<string, string> {
  const css: Record<string, string> = {};

  // Shorthand placement
  if (props.gridColumn) {
    css.gridColumn = gridSpanToCSS(props.gridColumn);
  }
  if (props.gridRow) {
    css.gridRow = gridSpanToCSS(props.gridRow);
  }
  if (props.gridArea) {
    css.gridArea = props.gridArea;
  }

  // Longhand placement (overrides shorthand)
  if (props.gridColumnStart !== undefined) css.gridColumnStart = String(props.gridColumnStart);
  if (props.gridColumnEnd !== undefined) css.gridColumnEnd = String(props.gridColumnEnd);
  if (props.gridRowStart !== undefined) css.gridRowStart = String(props.gridRowStart);
  if (props.gridRowEnd !== undefined) css.gridRowEnd = String(props.gridRowEnd);

  // Alignment
  if (props.justifySelf) css.justifySelf = props.justifySelf;
  if (props.alignSelf) css.alignSelf = props.alignSelf;

  return css;
}

/**
 * Generate a combined CSS object for grid layout.
 * Includes both container and item properties.
 * Useful for runtime compilation.
 */
export function gridToCSS(
  container: GridContainerProps,
  item?: GridItemProps
): Record<string, string> {
  return {
    ...gridContainerToCSS(container),
    ...(item ? gridItemToCSS(item) : {}),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Reuse ValidationError and ValidationResult from LayoutTypes. */
export type { ValidationError, ValidationResult } from './LayoutTypes';

/**
 * Validate a TrackSize value.
 */
export function validateTrackSize(value: unknown): import('./LayoutTypes').ValidationResult {
  const { ValidationError } = {} as any;
  const errors: import('./LayoutTypes').ValidationError[] = [];

  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'trackSize', message: 'TrackSize must be an object', code: 'INVALID_FORMAT' as const }],
    };
  }

  const s = value as Record<string, unknown>;

  if (typeof s.value !== 'number' || isNaN(s.value as number)) {
    errors.push({ key: 'trackSize.value', message: 'TrackSize value must be a number', code: 'INVALID_FORMAT' as const });
  } else if ((s.value as number) < 0) {
    errors.push({ key: 'trackSize.value', message: 'TrackSize value must be ≥ 0', code: 'MIN_VALUE' as const });
  } else if ((s.value as number) > 9999) {
    errors.push({ key: 'trackSize.value', message: 'TrackSize value must be ≤ 9999', code: 'MAX_VALUE' as const });
  }

  if (!VALID_GRID_UNITS.includes(s.unit as GridUnit)) {
    errors.push({ key: 'trackSize.unit', message: `Invalid unit: ${String(s.unit)}`, code: 'INVALID_OPTION' as const });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a single TrackBreadcrumb.
 */
export function validateTrackBreadcrumb(value: unknown): import('./LayoutTypes').ValidationResult {
  const errors: import('./LayoutTypes').ValidationError[] = [];

  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'track', message: 'Track must be an object', code: 'INVALID_FORMAT' as const }],
    };
  }

  const t = value as Record<string, unknown>;

  switch (t.type) {
    case 'fixed': {
      const result = validateTrackSize(t.size);
      errors.push(...result.errors.map(e => ({ ...e, key: `track.fixed.${e.key}` })));
      break;
    }

    case 'keyword':
      if (!['auto', 'min-content', 'max-content'].includes(t.value as string)) {
        errors.push({ key: 'track.keyword', message: `Invalid keyword: ${String(t.value)}`, code: 'INVALID_OPTION' as const });
      }
      break;

    case 'minmax':
      if (!t.min || !t.max) {
        errors.push({ key: 'track.minmax', message: 'minmax requires both min and max', code: 'INVALID_FORMAT' as const });
      } else {
        errors.push(...validateTrackBreadcrumb(t.min).errors.map(e => ({ ...e, key: `track.minmax.min.${e.key}` })));
        errors.push(...validateTrackBreadcrumb(t.max).errors.map(e => ({ ...e, key: `track.minmax.max.${e.key}` })));
      }
      break;

    case 'repeat':
      if (typeof t.count !== 'number' || !Number.isInteger(t.count) || (t.count as number) < 1 || (t.count as number) > 100) {
        errors.push({ key: 'track.repeat.count', message: 'Repeat count must be integer 1-100', code: 'CUSTOM' as const });
      }
      if (!t.track) {
        errors.push({ key: 'track.repeat.track', message: 'Repeat requires a track definition', code: 'INVALID_FORMAT' as const });
      } else {
        errors.push(...validateTrackBreadcrumb(t.track).errors.map(e => ({ ...e, key: `track.repeat.${e.key}` })));
      }
      break;

    default:
      errors.push({ key: 'track.type', message: `Invalid track type: ${String(t.type)}`, code: 'INVALID_OPTION' as const });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a TrackList.
 */
export function validateTrackList(value: unknown): import('./LayoutTypes').ValidationResult {
  const errors: import('./LayoutTypes').ValidationError[] = [];

  if (!Array.isArray(value)) {
    return {
      valid: false,
      errors: [{ key: 'trackList', message: 'TrackList must be an array', code: 'INVALID_FORMAT' as const }],
    };
  }

  if (value.length === 0) {
    return {
      valid: false,
      errors: [{ key: 'trackList', message: 'TrackList must not be empty', code: 'CUSTOM' as const }],
    };
  }

  if (value.length > 100) {
    errors.push({ key: 'trackList', message: 'TrackList must have at most 100 tracks', code: 'MAX_VALUE' as const });
  }

  for (let i = 0; i < value.length; i++) {
    const result = validateTrackBreadcrumb(value[i]);
    errors.push(...result.errors.map(e => ({ ...e, key: `trackList[${i}].${e.key}` })));
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a GridSpanValue.
 */
export function validateGridSpan(value: unknown): import('./LayoutTypes').ValidationResult {
  const errors: import('./LayoutTypes').ValidationError[] = [];

  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'gridSpan', message: 'GridSpan must be an object', code: 'INVALID_FORMAT' as const }],
    };
  }

  const s = value as Record<string, unknown>;

  switch (s.type) {
    case 'line': {
      if (typeof s.start !== 'number' || !Number.isInteger(s.start) || s.start === 0 || Math.abs(s.start as number) > 100) {
        errors.push({ key: 'gridSpan.start', message: 'Line start must be integer -100 to 100 (excluding 0)', code: 'CUSTOM' as const });
      }
      if (s.end !== undefined && (typeof s.end !== 'number' || !Number.isInteger(s.end) || s.end as number === 0 || Math.abs(s.end as number) > 100)) {
        errors.push({ key: 'gridSpan.end', message: 'Line end must be integer -100 to 100 (excluding 0)', code: 'CUSTOM' as const });
      }
      break;
    }

    case 'span': {
      if (typeof s.start !== 'number' || !Number.isInteger(s.start) || s.start === 0 || Math.abs(s.start as number) > 100) {
        errors.push({ key: 'gridSpan.start', message: 'Start line must be integer -100 to 100 (excluding 0)', code: 'CUSTOM' as const });
      }
      if (typeof s.span !== 'number' || !Number.isInteger(s.span) || (s.span as number) < 1 || (s.span as number) > 100) {
        errors.push({ key: 'gridSpan.span', message: 'Span must be integer 1-100', code: 'CUSTOM' as const });
      }
      break;
    }

    case 'span-only': {
      if (typeof s.span !== 'number' || !Number.isInteger(s.span) || (s.span as number) < 1 || (s.span as number) > 100) {
        errors.push({ key: 'gridSpan.span', message: 'Span must be integer 1-100', code: 'CUSTOM' as const });
      }
      break;
    }

    default:
      errors.push({ key: 'gridSpan.type', message: `Invalid span type: ${String(s.type)}`, code: 'INVALID_OPTION' as const });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a grid area name.
 * Must be a valid CSS identifier (or null to clear).
 */
export function validateGridAreaName(value: unknown): import('./LayoutTypes').ValidationResult {
  const errors: import('./LayoutTypes').ValidationError[] = [];

  if (value === null || value === undefined) {
    return { valid: true, errors: [] };
  }

  if (typeof value !== 'string') {
    return {
      valid: false,
      errors: [{ key: 'gridArea', message: 'Grid area must be a string or null', code: 'INVALID_FORMAT' as const }],
    };
  }

  if (value.trim().length === 0) {
    errors.push({ key: 'gridArea', message: 'Grid area name must not be empty', code: 'CUSTOM' as const });
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(value)) {
    errors.push({ key: 'gridArea', message: 'Grid area name must be a valid CSS identifier', code: 'CUSTOM' as const });
  } else if (value.length > 100) {
    errors.push({ key: 'gridArea', message: 'Grid area name must be ≤ 100 characters', code: 'MAX_VALUE' as const });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate GridAutoFlow value.
 */
export function validateGridAutoFlow(value: unknown): boolean {
  return VALID_GRID_AUTO_FLOWS.includes(value as GridAutoFlow);
}

/**
 * Validate a grid container alignment value (justifyContent, alignContent).
 */
export function validateGridContentAlignment(value: unknown): boolean {
  return VALID_GRID_CONTENT_ALIGNMENT.includes(value as string);
}

/**
 * Validate a grid item alignment value (justifyItems, alignItems, justifySelf, alignSelf).
 */
export function validateGridItemAlignment(value: unknown): boolean {
  return VALID_GRID_ITEM_ALIGNMENT.includes(value as string);
}

/**
 * Validate a grid placement longhand value (gridColumnStart, etc.).
 */
export function validateGridLineNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value !== 0 && Math.abs(value) <= 100;
}

/**
 * Validate complete GridContainerProps.
 */
export function validateGridContainerProps(props: unknown): import('./LayoutTypes').ValidationResult {
  const errors: import('./LayoutTypes').ValidationError[] = [];

  if (!props || typeof props !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'gridContainer', message: 'GridContainerProps must be an object', code: 'INVALID_FORMAT' as const }],
    };
  }

  const p = props as Record<string, unknown>;

  if (p.gridTemplateColumns !== undefined) {
    errors.push(...validateTrackList(p.gridTemplateColumns).errors);
  }
  if (p.gridTemplateRows !== undefined) {
    errors.push(...validateTrackList(p.gridTemplateRows).errors);
  }
  if (p.gridAutoFlow !== undefined && !validateGridAutoFlow(p.gridAutoFlow)) {
    errors.push({ key: 'gridAutoFlow', message: `Invalid grid-auto-flow: ${String(p.gridAutoFlow)}`, code: 'INVALID_OPTION' as const });
  }
  if (p.gridAutoColumns !== undefined) {
    errors.push(...validateTrackBreadcrumb(p.gridAutoColumns).errors);
  }
  if (p.gridAutoRows !== undefined) {
    errors.push(...validateTrackBreadcrumb(p.gridAutoRows).errors);
  }
  if (p.justifyContent !== undefined && !validateGridContentAlignment(p.justifyContent)) {
    errors.push({ key: 'justifyContent', message: `Invalid justify-content: ${String(p.justifyContent)}`, code: 'INVALID_OPTION' as const });
  }
  if (p.alignContent !== undefined && !validateGridContentAlignment(p.alignContent)) {
    errors.push({ key: 'alignContent', message: `Invalid align-content: ${String(p.alignContent)}`, code: 'INVALID_OPTION' as const });
  }
  if (p.justifyItems !== undefined && !validateGridItemAlignment(p.justifyItems)) {
    errors.push({ key: 'justifyItems', message: `Invalid justify-items: ${String(p.justifyItems)}`, code: 'INVALID_OPTION' as const });
  }
  if (p.alignItems !== undefined && !validateGridItemAlignment(p.alignItems)) {
    errors.push({ key: 'alignItems', message: `Invalid align-items: ${String(p.alignItems)}`, code: 'INVALID_OPTION' as const });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate complete GridItemProps.
 */
export function validateGridItemProps(props: unknown): import('./LayoutTypes').ValidationResult {
  const errors: import('./LayoutTypes').ValidationError[] = [];

  if (!props || typeof props !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'gridItem', message: 'GridItemProps must be an object', code: 'INVALID_FORMAT' as const }],
    };
  }

  const p = props as Record<string, unknown>;

  if (p.gridColumn !== undefined) {
    errors.push(...validateGridSpan(p.gridColumn).errors);
  }
  if (p.gridRow !== undefined) {
    errors.push(...validateGridSpan(p.gridRow).errors);
  }
  if (p.gridArea !== undefined) {
    errors.push(...validateGridAreaName(p.gridArea).errors);
  }
  if (p.gridColumnStart !== undefined && !validateGridLineNumber(p.gridColumnStart)) {
    errors.push({ key: 'gridColumnStart', message: `Invalid grid-column-start: ${String(p.gridColumnStart)}`, code: 'CUSTOM' as const });
  }
  if (p.gridColumnEnd !== undefined && !validateGridLineNumber(p.gridColumnEnd)) {
    errors.push({ key: 'gridColumnEnd', message: `Invalid grid-column-end: ${String(p.gridColumnEnd)}`, code: 'CUSTOM' as const });
  }
  if (p.gridRowStart !== undefined && !validateGridLineNumber(p.gridRowStart)) {
    errors.push({ key: 'gridRowStart', message: `Invalid grid-row-start: ${String(p.gridRowStart)}`, code: 'CUSTOM' as const });
  }
  if (p.gridRowEnd !== undefined && !validateGridLineNumber(p.gridRowEnd)) {
    errors.push({ key: 'gridRowEnd', message: `Invalid grid-row-end: ${String(p.gridRowEnd)}`, code: 'CUSTOM' as const });
  }
  if (p.justifySelf !== undefined && !validateGridItemAlignment(p.justifySelf)) {
    errors.push({ key: 'justifySelf', message: `Invalid justify-self: ${String(p.justifySelf)}`, code: 'INVALID_OPTION' as const });
  }
  if (p.alignSelf !== undefined && !validateGridItemAlignment(p.alignSelf)) {
    errors.push({ key: 'alignSelf', message: `Invalid align-self: ${String(p.alignSelf)}`, code: 'INVALID_OPTION' as const });
  }

  return { valid: errors.length === 0, errors };
}
