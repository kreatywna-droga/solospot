/**
 * Tests for GridTypes — C16.38 Grid Property Types (Sprint 5B.1)
 *
 * Coverage targets:
 *   - CSS mapping functions (trackBreadcrumbToCSS, trackListToCSS, gridSpanToCSS,
 *     gridContainerToCSS, gridItemToCSS, gridToCSS)
 *   - Validation functions (validateTrackSize, validateTrackBreadcrumb, validateTrackList,
 *     validateGridSpan, validateGridAreaName, validateGridAutoFlow,
 *     validateGridContentAlignment, validateGridItemAlignment, validateGridLineNumber,
 *     validateGridContainerProps, validateGridItemProps)
 *   - Default values
 *   - Edge cases (zero, negative, max bounds)
 */

import { describe, it, expect } from 'vitest';
import {
  trackBreadcrumbToCSS,
  trackListToCSS,
  gridSpanToCSS,
  gridContainerToCSS,
  gridItemToCSS,
  gridToCSS,
  validateTrackSize,
  validateTrackBreadcrumb,
  validateTrackList,
  validateGridSpan,
  validateGridAreaName,
  validateGridAutoFlow,
  validateGridContentAlignment,
  validateGridItemAlignment,
  validateGridLineNumber,
  validateGridContainerProps,
  validateGridItemProps,
  DEFAULT_GRID_AUTO_COLUMNS,
  DEFAULT_GRID_AUTO_ROWS,
  DEFAULT_GRID_AUTO_FLOW,
  DEFAULT_SINGLE_COLUMN_TRACK,
  VALID_GRID_UNITS,
  VALID_GRID_AUTO_FLOWS,
  VALID_GRID_CONTENT_ALIGNMENT,
  VALID_GRID_ITEM_ALIGNMENT,
} from '../GridTypes';

import type { TrackBreadcrumb, TrackList, GridSpanValue, GridContainerProps, GridItemProps } from '../GridTypes';

// ---------------------------------------------------------------------------
// trackBreadcrumbToCSS
// ---------------------------------------------------------------------------

describe('trackBreadcrumbToCSS', () => {
  it('should convert fixed track with fr unit', () => {
    const track: TrackBreadcrumb = { type: 'fixed', size: { value: 1, unit: 'fr' } };
    expect(trackBreadcrumbToCSS(track)).toBe('1fr');
  });

  it('should convert fixed track with px unit', () => {
    const track: TrackBreadcrumb = { type: 'fixed', size: { value: 200, unit: 'px' } };
    expect(trackBreadcrumbToCSS(track)).toBe('200px');
  });

  it('should convert fixed track with percentage', () => {
    const track: TrackBreadcrumb = { type: 'fixed', size: { value: 50, unit: '%' } };
    expect(trackBreadcrumbToCSS(track)).toBe('50%');
  });

  it('should convert keyword tracks', () => {
    expect(trackBreadcrumbToCSS({ type: 'keyword', value: 'auto' })).toBe('auto');
    expect(trackBreadcrumbToCSS({ type: 'keyword', value: 'min-content' })).toBe('min-content');
    expect(trackBreadcrumbToCSS({ type: 'keyword', value: 'max-content' })).toBe('max-content');
  });

  it('should convert minmax track', () => {
    const track: TrackBreadcrumb = {
      type: 'minmax',
      min: { type: 'fixed', size: { value: 200, unit: 'px' } },
      max: { type: 'fixed', size: { value: 1, unit: 'fr' } },
    };
    expect(trackBreadcrumbToCSS(track)).toBe('minmax(200px, 1fr)');
  });

  it('should convert nested minmax', () => {
    const track: TrackBreadcrumb = {
      type: 'minmax',
      min: { type: 'keyword', value: 'auto' },
      max: { type: 'minmax', min: { type: 'fixed', size: { value: 200, unit: 'px' } }, max: { type: 'fixed', size: { value: 1, unit: 'fr' } } },
    };
    expect(trackBreadcrumbToCSS(track)).toBe('minmax(auto, minmax(200px, 1fr))');
  });

  it('should convert repeat track', () => {
    const track: TrackBreadcrumb = {
      type: 'repeat',
      count: 3,
      track: { type: 'fixed', size: { value: 1, unit: 'fr' } },
    };
    expect(trackBreadcrumbToCSS(track)).toBe('repeat(3, 1fr)');
  });

  it('should convert repeat with minmax', () => {
    const track: TrackBreadcrumb = {
      type: 'repeat',
      count: 4,
      track: {
        type: 'minmax',
        min: { type: 'fixed', size: { value: 200, unit: 'px' } },
        max: { type: 'fixed', size: { value: 1, unit: 'fr' } },
      },
    };
    expect(trackBreadcrumbToCSS(track)).toBe('repeat(4, minmax(200px, 1fr))');
  });

  it('should handle viewport units', () => {
    const track: TrackBreadcrumb = { type: 'fixed', size: { value: 50, unit: 'vw' } };
    expect(trackBreadcrumbToCSS(track)).toBe('50vw');
  });

  it('should handle rem/em units', () => {
    expect(trackBreadcrumbToCSS({ type: 'fixed', size: { value: 16, unit: 'rem' } })).toBe('16rem');
    expect(trackBreadcrumbToCSS({ type: 'fixed', size: { value: 1.5, unit: 'em' } })).toBe('1.5em');
  });
});

// ---------------------------------------------------------------------------
// trackListToCSS
// ---------------------------------------------------------------------------

describe('trackListToCSS', () => {
  it('should convert a list of tracks to space-separated CSS', () => {
    const tracks: TrackList = [
      { type: 'fixed', size: { value: 1, unit: 'fr' } },
      { type: 'fixed', size: { value: 2, unit: 'fr' } },
      { type: 'fixed', size: { value: 1, unit: 'fr' } },
    ];
    expect(trackListToCSS(tracks)).toBe('1fr 2fr 1fr');
  });

  it('should handle mixed track types', () => {
    const tracks: TrackList = [
      { type: 'fixed', size: { value: 200, unit: 'px' } },
      { type: 'keyword', value: 'auto' },
      { type: 'fixed', size: { value: 1, unit: 'fr' } },
    ];
    expect(trackListToCSS(tracks)).toBe('200px auto 1fr');
  });

  it('should handle repeat tracks', () => {
    const tracks: TrackList = [
      { type: 'repeat', count: 3, track: { type: 'fixed', size: { value: 1, unit: 'fr' } } },
      { type: 'fixed', size: { value: 200, unit: 'px' } },
    ];
    expect(trackListToCSS(tracks)).toBe('repeat(3, 1fr) 200px');
  });

  it('should handle single track', () => {
    const tracks: TrackList = [
      { type: 'fixed', size: { value: 100, unit: '%' } },
    ];
    expect(trackListToCSS(tracks)).toBe('100%');
  });

  it('should handle minmax in list', () => {
    const tracks: TrackList = [
      { type: 'minmax', min: { type: 'fixed', size: { value: 200, unit: 'px' } }, max: { type: 'fixed', size: { value: 1, unit: 'fr' } } },
      { type: 'fixed', size: { value: 300, unit: 'px' } },
    ];
    expect(trackListToCSS(tracks)).toBe('minmax(200px, 1fr) 300px');
  });
});

// ---------------------------------------------------------------------------
// gridSpanToCSS
// ---------------------------------------------------------------------------

describe('gridSpanToCSS', () => {
  it('should convert line span with start and end', () => {
    const span: GridSpanValue = { type: 'line', start: 1, end: 3 };
    expect(gridSpanToCSS(span)).toBe('1 / 3');
  });

  it('should convert line span with start only', () => {
    const span: GridSpanValue = { type: 'line', start: 2 };
    expect(gridSpanToCSS(span)).toBe('2');
  });

  it('should convert span with start line and span count', () => {
    const span: GridSpanValue = { type: 'span', start: 2, span: 3 };
    expect(gridSpanToCSS(span)).toBe('2 / span 3');
  });

  it('should convert span-only', () => {
    const span: GridSpanValue = { type: 'span-only', span: 2 };
    expect(gridSpanToCSS(span)).toBe('span 2');
  });

  it('should handle negative line numbers', () => {
    const span: GridSpanValue = { type: 'line', start: -1, end: -3 };
    expect(gridSpanToCSS(span)).toBe('-1 / -3');
  });
});

// ---------------------------------------------------------------------------
// gridContainerToCSS
// ---------------------------------------------------------------------------

describe('gridContainerToCSS', () => {
  it('should convert grid-template-columns', () => {
    const props: GridContainerProps = {
      gridTemplateColumns: [
        { type: 'fixed', size: { value: 1, unit: 'fr' } },
        { type: 'fixed', size: { value: 2, unit: 'fr' } },
        { type: 'fixed', size: { value: 1, unit: 'fr' } },
      ],
    };
    const css = gridContainerToCSS(props);
    expect(css.gridTemplateColumns).toBe('1fr 2fr 1fr');
  });

  it('should convert grid-template-rows', () => {
    const props: GridContainerProps = {
      gridTemplateRows: [
        { type: 'repeat', count: 3, track: { type: 'fixed', size: { value: 200, unit: 'px' } } },
      ],
    };
    const css = gridContainerToCSS(props);
    expect(css.gridTemplateRows).toBe('repeat(3, 200px)');
  });

  it('should convert grid-auto-flow', () => {
    const props: GridContainerProps = { gridAutoFlow: 'row-dense' };
    const css = gridContainerToCSS(props);
    expect(css.gridAutoFlow).toBe('row-dense');
  });

  it('should convert grid-auto-columns', () => {
    const props: GridContainerProps = {
      gridAutoColumns: { type: 'fixed', size: { value: 200, unit: 'px' } },
    };
    const css = gridContainerToCSS(props);
    expect(css.gridAutoColumns).toBe('200px');
  });

  it('should convert grid-auto-rows', () => {
    const props: GridContainerProps = {
      gridAutoRows: { type: 'keyword', value: 'auto' },
    };
    const css = gridContainerToCSS(props);
    expect(css.gridAutoRows).toBe('auto');
  });

  it('should convert alignment properties', () => {
    const props: GridContainerProps = {
      justifyContent: 'center',
      alignContent: 'start',
      justifyItems: 'stretch',
      alignItems: 'center',
    };
    const css = gridContainerToCSS(props);
    expect(css.justifyContent).toBe('center');
    expect(css.alignContent).toBe('start');
    expect(css.justifyItems).toBe('stretch');
    expect(css.alignItems).toBe('center');
  });

  it('should return empty object for empty props', () => {
    const css = gridContainerToCSS({});
    expect(css).toEqual({});
  });

  it('should handle all properties together', () => {
    const props: GridContainerProps = {
      gridTemplateColumns: [{ type: 'fixed', size: { value: 1, unit: 'fr' } }],
      gridTemplateRows: [{ type: 'keyword', value: 'auto' }],
      gridAutoFlow: 'row',
      gridAutoColumns: { type: 'fixed', size: { value: 1, unit: 'fr' } },
      gridAutoRows: { type: 'keyword', value: 'auto' },
      justifyContent: 'center',
      alignContent: 'center',
      justifyItems: 'center',
      alignItems: 'center',
    };
    const css = gridContainerToCSS(props);
    expect(Object.keys(css).length).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// gridItemToCSS
// ---------------------------------------------------------------------------

describe('gridItemToCSS', () => {
  it('should convert gridColumn shorthand', () => {
    const props: GridItemProps = {
      gridColumn: { type: 'line', start: 1, end: 3 },
    };
    const css = gridItemToCSS(props);
    expect(css.gridColumn).toBe('1 / 3');
  });

  it('should convert gridRow shorthand', () => {
    const props: GridItemProps = {
      gridRow: { type: 'span', start: 2, span: 3 },
    };
    const css = gridItemToCSS(props);
    expect(css.gridRow).toBe('2 / span 3');
  });

  it('should convert gridArea', () => {
    const props: GridItemProps = { gridArea: 'header' };
    const css = gridItemToCSS(props);
    expect(css.gridArea).toBe('header');
  });

  it('should convert longhand placement', () => {
    const props: GridItemProps = {
      gridColumnStart: 1,
      gridColumnEnd: 3,
      gridRowStart: 2,
      gridRowEnd: 4,
    };
    const css = gridItemToCSS(props);
    expect(css.gridColumnStart).toBe('1');
    expect(css.gridColumnEnd).toBe('3');
    expect(css.gridRowStart).toBe('2');
    expect(css.gridRowEnd).toBe('4');
  });

  it('should convert alignment properties', () => {
    const props: GridItemProps = {
      justifySelf: 'center',
      alignSelf: 'start',
    };
    const css = gridItemToCSS(props);
    expect(css.justifySelf).toBe('center');
    expect(css.alignSelf).toBe('start');
  });

  it('should return empty object for empty props', () => {
    const css = gridItemToCSS({});
    expect(css).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// gridToCSS (combined)
// ---------------------------------------------------------------------------

describe('gridToCSS', () => {
  it('should combine container and item props', () => {
    const container: GridContainerProps = {
      gridTemplateColumns: [{ type: 'fixed', size: { value: 1, unit: 'fr' } }],
    };
    const item: GridItemProps = {
      gridColumn: { type: 'line', start: 1, end: 3 },
    };
    const css = gridToCSS(container, item);
    expect(css.gridTemplateColumns).toBe('1fr');
    expect(css.gridColumn).toBe('1 / 3');
  });

  it('should work with only container props', () => {
    const container: GridContainerProps = {
      gridTemplateColumns: [{ type: 'fixed', size: { value: 1, unit: 'fr' } }],
    };
    const css = gridToCSS(container);
    expect(css.gridTemplateColumns).toBe('1fr');
    expect(css.gridColumn).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validateTrackSize
// ---------------------------------------------------------------------------

describe('validateTrackSize', () => {
  it('should accept valid track size', () => {
    const result = validateTrackSize({ value: 1, unit: 'fr' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept zero value', () => {
    const result = validateTrackSize({ value: 0, unit: 'px' });
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    expect(validateTrackSize(null).valid).toBe(false);
    expect(validateTrackSize('1fr').valid).toBe(false);
  });

  it('should reject negative value', () => {
    const result = validateTrackSize({ value: -1, unit: 'fr' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('MIN_VALUE');
  });

  it('should reject value over 9999', () => {
    const result = validateTrackSize({ value: 10000, unit: 'px' });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('MAX_VALUE');
  });

  it('should reject invalid unit', () => {
    const result = validateTrackSize({ value: 100, unit: 'invalid' as any });
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('INVALID_OPTION');
  });

  it('should accept all valid grid units', () => {
    for (const unit of VALID_GRID_UNITS) {
      const result = validateTrackSize({ value: 1, unit });
      expect(result.valid).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// validateTrackBreadcrumb
// ---------------------------------------------------------------------------

describe('validateTrackBreadcrumb', () => {
  it('should accept valid fixed track', () => {
    const result = validateTrackBreadcrumb({ type: 'fixed', size: { value: 1, unit: 'fr' } });
    expect(result.valid).toBe(true);
  });

  it('should accept valid keyword track', () => {
    expect(validateTrackBreadcrumb({ type: 'keyword', value: 'auto' }).valid).toBe(true);
    expect(validateTrackBreadcrumb({ type: 'keyword', value: 'min-content' }).valid).toBe(true);
    expect(validateTrackBreadcrumb({ type: 'keyword', value: 'max-content' }).valid).toBe(true);
  });

  it('should reject invalid keyword', () => {
    const result = validateTrackBreadcrumb({ type: 'keyword', value: 'invalid' });
    expect(result.valid).toBe(false);
  });

  it('should accept valid minmax track', () => {
    const result = validateTrackBreadcrumb({
      type: 'minmax',
      min: { type: 'fixed', size: { value: 200, unit: 'px' } },
      max: { type: 'fixed', size: { value: 1, unit: 'fr' } },
    });
    expect(result.valid).toBe(true);
  });

  it('should reject minmax without min', () => {
    const result = validateTrackBreadcrumb({
      type: 'minmax',
      max: { type: 'fixed', size: { value: 1, unit: 'fr' } },
    } as any);
    expect(result.valid).toBe(false);
  });

  it('should accept valid repeat track', () => {
    const result = validateTrackBreadcrumb({
      type: 'repeat',
      count: 3,
      track: { type: 'fixed', size: { value: 1, unit: 'fr' } },
    });
    expect(result.valid).toBe(true);
  });

  it('should reject repeat with invalid count', () => {
    const result = validateTrackBreadcrumb({
      type: 'repeat',
      count: 0,
      track: { type: 'fixed', size: { value: 1, unit: 'fr' } },
    });
    expect(result.valid).toBe(false);
  });

  it('should reject repeat with count over 100', () => {
    const result = validateTrackBreadcrumb({
      type: 'repeat',
      count: 101,
      track: { type: 'fixed', size: { value: 1, unit: 'fr' } },
    });
    expect(result.valid).toBe(false);
  });

  it('should reject repeat without track', () => {
    const result = validateTrackBreadcrumb({
      type: 'repeat',
      count: 3,
    } as any);
    expect(result.valid).toBe(false);
  });

  it('should reject unknown track type', () => {
    const result = validateTrackBreadcrumb({ type: 'unknown' } as any);
    expect(result.valid).toBe(false);
  });

  it('should reject non-object input', () => {
    expect(validateTrackBreadcrumb(null).valid).toBe(false);
  });

  it('should validate nested minmax inside repeat', () => {
    const result = validateTrackBreadcrumb({
      type: 'repeat',
      count: 4,
      track: {
        type: 'minmax',
        min: { type: 'fixed', size: { value: 200, unit: 'px' } },
        max: { type: 'fixed', size: { value: 1, unit: 'fr' } },
      },
    });
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateTrackList
// ---------------------------------------------------------------------------

describe('validateTrackList', () => {
  it('should accept valid track list', () => {
    const result = validateTrackList([
      { type: 'fixed', size: { value: 1, unit: 'fr' } },
      { type: 'fixed', size: { value: 2, unit: 'fr' } },
    ]);
    expect(result.valid).toBe(true);
  });

  it('should reject non-array input', () => {
    expect(validateTrackList(null).valid).toBe(false);
    expect(validateTrackList('string').valid).toBe(false);
  });

  it('should reject empty array', () => {
    const result = validateTrackList([]);
    expect(result.valid).toBe(false);
  });

  it('should reject array with over 100 tracks', () => {
    const tracks = Array(101).fill({ type: 'fixed', size: { value: 1, unit: 'fr' } });
    const result = validateTrackList(tracks);
    expect(result.valid).toBe(false);
  });

  it('should report errors for invalid tracks in list', () => {
    const result = validateTrackList([
      { type: 'fixed', size: { value: 1, unit: 'fr' } },
      { type: 'unknown' } as any,
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// validateGridSpan
// ---------------------------------------------------------------------------

describe('validateGridSpan', () => {
  it('should accept valid line span', () => {
    expect(validateGridSpan({ type: 'line', start: 1, end: 3 }).valid).toBe(true);
    expect(validateGridSpan({ type: 'line', start: 2 }).valid).toBe(true);
    expect(validateGridSpan({ type: 'line', start: -1 }).valid).toBe(true);
  });

  it('should reject line span with start=0', () => {
    const result = validateGridSpan({ type: 'line', start: 0 });
    expect(result.valid).toBe(false);
  });

  it('should reject line span with start over 100', () => {
    const result = validateGridSpan({ type: 'line', start: 101 });
    expect(result.valid).toBe(false);
  });

  it('should accept valid span', () => {
    expect(validateGridSpan({ type: 'span', start: 2, span: 3 }).valid).toBe(true);
  });

  it('should reject span with span=0', () => {
    const result = validateGridSpan({ type: 'span', start: 2, span: 0 });
    expect(result.valid).toBe(false);
  });

  it('should reject span with span over 100', () => {
    const result = validateGridSpan({ type: 'span', start: 2, span: 101 });
    expect(result.valid).toBe(false);
  });

  it('should accept valid span-only', () => {
    expect(validateGridSpan({ type: 'span-only', span: 2 }).valid).toBe(true);
  });

  it('should reject span-only with span=0', () => {
    const result = validateGridSpan({ type: 'span-only', span: 0 });
    expect(result.valid).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = validateGridSpan({ type: 'invalid' } as any);
    expect(result.valid).toBe(false);
  });

  it('should reject non-object input', () => {
    expect(validateGridSpan(null).valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateGridAreaName
// ---------------------------------------------------------------------------

describe('validateGridAreaName', () => {
  it('should accept valid area name', () => {
    expect(validateGridAreaName('header').valid).toBe(true);
    expect(validateGridAreaName('main-content').valid).toBe(true);
    expect(validateGridAreaName('sidebar_1').valid).toBe(true);
  });

  it('should accept null/undefined', () => {
    expect(validateGridAreaName(null).valid).toBe(true);
    expect(validateGridAreaName(undefined).valid).toBe(true);
  });

  it('should reject empty string', () => {
    const result = validateGridAreaName('');
    expect(result.valid).toBe(false);
  });

  it('should reject name with spaces', () => {
    const result = validateGridAreaName('my area');
    expect(result.valid).toBe(false);
  });

  it('should reject name starting with number', () => {
    const result = validateGridAreaName('123area');
    expect(result.valid).toBe(false);
  });

  it('should reject non-string non-null', () => {
    expect(validateGridAreaName(42).valid).toBe(false);
  });

  it('should reject name over 100 characters', () => {
    const result = validateGridAreaName('a'.repeat(101));
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateGridAutoFlow
// ---------------------------------------------------------------------------

describe('validateGridAutoFlow', () => {
  it('should accept valid auto-flow values', () => {
    expect(validateGridAutoFlow('row')).toBe(true);
    expect(validateGridAutoFlow('column')).toBe(true);
    expect(validateGridAutoFlow('row-dense')).toBe(true);
    expect(validateGridAutoFlow('column-dense')).toBe(true);
  });

  it('should reject invalid auto-flow values', () => {
    expect(validateGridAutoFlow('dense')).toBe(false);
    expect(validateGridAutoFlow('')).toBe(false);
    expect(validateGridAutoFlow('invalid')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateGridContentAlignment
// ---------------------------------------------------------------------------

describe('validateGridContentAlignment', () => {
  it('should accept valid content alignment values', () => {
    for (const value of VALID_GRID_CONTENT_ALIGNMENT) {
      expect(validateGridContentAlignment(value)).toBe(true);
    }
  });

  it('should reject flex values', () => {
    expect(validateGridContentAlignment('flex-start')).toBe(false);
    expect(validateGridContentAlignment('flex-end')).toBe(false);
  });

  it('should reject invalid values', () => {
    expect(validateGridContentAlignment('invalid')).toBe(false);
    expect(validateGridContentAlignment('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateGridItemAlignment
// ---------------------------------------------------------------------------

describe('validateGridItemAlignment', () => {
  it('should accept valid item alignment values', () => {
    for (const value of VALID_GRID_ITEM_ALIGNMENT) {
      expect(validateGridItemAlignment(value)).toBe(true);
    }
  });

  it('should reject flex values', () => {
    expect(validateGridItemAlignment('flex-start')).toBe(false);
    expect(validateGridItemAlignment('baseline')).toBe(false);
  });

  it('should reject invalid values', () => {
    expect(validateGridItemAlignment('invalid')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateGridLineNumber
// ---------------------------------------------------------------------------

describe('validateGridLineNumber', () => {
  it('should accept valid line numbers', () => {
    expect(validateGridLineNumber(1)).toBe(true);
    expect(validateGridLineNumber(-1)).toBe(true);
    expect(validateGridLineNumber(100)).toBe(true);
    expect(validateGridLineNumber(-100)).toBe(true);
  });

  it('should reject zero', () => {
    expect(validateGridLineNumber(0)).toBe(false);
  });

  it('should reject values over 100', () => {
    expect(validateGridLineNumber(101)).toBe(false);
    expect(validateGridLineNumber(-101)).toBe(false);
  });

  it('should reject non-integers', () => {
    expect(validateGridLineNumber(1.5)).toBe(false);
    expect(validateGridLineNumber(NaN)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateGridContainerProps
// ---------------------------------------------------------------------------

describe('validateGridContainerProps', () => {
  it('should accept valid container props', () => {
    const props: GridContainerProps = {
      gridTemplateColumns: [{ type: 'fixed', size: { value: 1, unit: 'fr' } }],
      gridAutoFlow: 'row',
      justifyContent: 'center',
    };
    const result = validateGridContainerProps(props);
    expect(result.valid).toBe(true);
  });

  it('should accept empty container props', () => {
    const result = validateGridContainerProps({});
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    expect(validateGridContainerProps(null).valid).toBe(false);
  });

  it('should reject invalid gridTemplateColumns', () => {
    const result = validateGridContainerProps({
      gridTemplateColumns: 'invalid',
    });
    expect(result.valid).toBe(false);
  });

  it('should reject invalid gridAutoFlow', () => {
    const result = validateGridContainerProps({
      gridAutoFlow: 'dense',
    });
    expect(result.valid).toBe(false);
  });

  it('should reject invalid justifyContent', () => {
    const result = validateGridContainerProps({
      justifyContent: 'flex-start',
    });
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateGridItemProps
// ---------------------------------------------------------------------------

describe('validateGridItemProps', () => {
  it('should accept valid item props', () => {
    const props: GridItemProps = {
      gridColumn: { type: 'line', start: 1, end: 3 },
      gridArea: 'header',
      justifySelf: 'center',
    };
    const result = validateGridItemProps(props);
    expect(result.valid).toBe(true);
  });

  it('should accept empty item props', () => {
    const result = validateGridItemProps({});
    expect(result.valid).toBe(true);
  });

  it('should reject non-object input', () => {
    expect(validateGridItemProps(null).valid).toBe(false);
  });

  it('should reject invalid gridColumn', () => {
    const result = validateGridItemProps({
      gridColumn: { type: 'line', start: 0 },
    });
    expect(result.valid).toBe(false);
  });

  it('should reject invalid gridArea', () => {
    const result = validateGridItemProps({
      gridArea: 'invalid area name',
    });
    expect(result.valid).toBe(false);
  });

  it('should reject invalid gridColumnStart', () => {
    const result = validateGridItemProps({
      gridColumnStart: 0,
    });
    expect(result.valid).toBe(false);
  });

  it('should reject invalid justifySelf', () => {
    const result = validateGridItemProps({
      justifySelf: 'flex-start',
    });
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

describe('default values', () => {
  it('should have DEFAULT_GRID_AUTO_COLUMNS as 1fr', () => {
    expect(DEFAULT_GRID_AUTO_COLUMNS).toEqual({ type: 'fixed', size: { value: 1, unit: 'fr' } });
  });

  it('should have DEFAULT_GRID_AUTO_ROWS as 1fr', () => {
    expect(DEFAULT_GRID_AUTO_ROWS).toEqual({ type: 'fixed', size: { value: 1, unit: 'fr' } });
  });

  it('should have DEFAULT_GRID_AUTO_FLOW as row', () => {
    expect(DEFAULT_GRID_AUTO_FLOW).toBe('row');
  });

  it('should have DEFAULT_SINGLE_COLUMN_TRACK with 1fr', () => {
    expect(DEFAULT_SINGLE_COLUMN_TRACK).toEqual([
      { type: 'fixed', size: { value: 1, unit: 'fr' } },
    ]);
  });

  it('should have all valid grid units', () => {
    expect(VALID_GRID_UNITS).toContain('fr');
    expect(VALID_GRID_UNITS).toContain('px');
    expect(VALID_GRID_UNITS).toContain('%');
    expect(VALID_GRID_UNITS).toContain('auto');
    expect(VALID_GRID_UNITS).toContain('min-content');
    expect(VALID_GRID_UNITS).toContain('max-content');
  });

  it('should have all valid auto-flow values', () => {
    expect(VALID_GRID_AUTO_FLOWS).toEqual(['row', 'column', 'row-dense', 'column-dense']);
  });

  it('should have all valid content alignment values', () => {
    expect(VALID_GRID_CONTENT_ALIGNMENT).toContain('start');
    expect(VALID_GRID_CONTENT_ALIGNMENT).toContain('space-evenly');
    expect(VALID_GRID_CONTENT_ALIGNMENT).not.toContain('flex-start');
  });

  it('should have all valid item alignment values', () => {
    expect(VALID_GRID_ITEM_ALIGNMENT).toEqual(['start', 'end', 'center', 'stretch']);
  });
});
