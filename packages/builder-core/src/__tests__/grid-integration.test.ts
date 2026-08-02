/**
 * Grid Integration Tests — C16.38 Grid Engine (Sprint 5B.1)
 *
 * Integration tests verifying:
 *   - Serialization / Deserialization (JSON round-trip)
 *   - PropertyRegistry registration of grid types
 *   - Responsive value compatibility
 *   - Cross-module interactions
 *   - Known gap issue documentation
 *
 * NOTE on gap:
 *   GridContainerProps intentionally does NOT include `gap`, `rowGap`, `columnGap`.
 *   Per DR-GRID-005, gap is shared with FlexContainerProps and applied at
 *   the compile layer (combining displayToCSS + gridContainerToCSS).
 *   See the "Known Gap Issue" section for details.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Grid types
  trackBreadcrumbToCSS,
  trackListToCSS,
  gridSpanToCSS,
  gridContainerToCSS,
  gridItemToCSS,
  gridToCSS,
  validateTrackBreadcrumb,
  validateTrackList,
  validateGridSpan,
  validateGridContainerProps,
  validateGridItemProps,
} from '../GridTypes';
import type {
  TrackBreadcrumb,
  TrackList,
  GridSpanValue,
  GridContainerProps,
  GridItemProps,
} from '../GridTypes';

import { createPropertyFieldRegistry } from '../PropertyRegistry';
import type { PropertyFieldRegistry } from '../PropertyRegistry';

// ---------------------------------------------------------------------------
// 1. PropertyRegistry Integration
// ---------------------------------------------------------------------------

describe('PropertyRegistry — Grid field types', () => {
  let registry: PropertyFieldRegistry;

  // Mock GridField renderer (simulates the React component)
  const MockGridField = () => null;

  beforeEach(() => {
    registry = createPropertyFieldRegistry();
  });

  it('should register grid-tracks type', () => {
    registry.register('grid-tracks', MockGridField);
    expect(registry.has('grid-tracks')).toBe(true);
    expect(registry.get('grid-tracks')).toBe(MockGridField);
  });

  it('should register grid-track type', () => {
    registry.register('grid-track', MockGridField);
    expect(registry.has('grid-track')).toBe(true);
    expect(registry.get('grid-track')).toBe(MockGridField);
  });

  it('should register grid-span type', () => {
    registry.register('grid-span', MockGridField);
    expect(registry.has('grid-span')).toBe(true);
    expect(registry.get('grid-span')).toBe(MockGridField);
  });

  it('should support chaining all three grid registrations', () => {
    registry
      .register('grid-tracks', MockGridField)
      .register('grid-track', MockGridField)
      .register('grid-span', MockGridField);

    expect(registry.get('grid-tracks')).toBe(MockGridField);
    expect(registry.get('grid-track')).toBe(MockGridField);
    expect(registry.get('grid-span')).toBe(MockGridField);
  });

  it('should not conflict with existing layout types', () => {
    const MockSpacingField = () => null;
    const MockSizeField = () => null;

    registry
      .register('spacing', MockSpacingField)
      .register('size', MockSizeField)
      .register('grid-tracks', MockGridField)
      .register('grid-span', MockGridField);

    expect(registry.get('spacing')).toBe(MockSpacingField);
    expect(registry.get('size')).toBe(MockSizeField);
    expect(registry.get('grid-tracks')).toBe(MockGridField);
    expect(registry.get('grid-span')).toBe(MockGridField);
  });
});

// ---------------------------------------------------------------------------
// 2. Serialization & Deserialization (JSON Round-Trip)
// ---------------------------------------------------------------------------

describe('Serialization — TrackBreadcrumb JSON round-trip', () => {
  it('should serialize and deserialize fixed track', () => {
    const track: TrackBreadcrumb = { type: 'fixed', size: { value: 1, unit: 'fr' } };
    const json = JSON.stringify(track);
    const parsed = JSON.parse(json) as TrackBreadcrumb;
    expect(parsed).toEqual(track);
    // Verify it still passes validation
    expect(validateTrackBreadcrumb(parsed).valid).toBe(true);
    // Verify CSS output is preserved
    expect(trackBreadcrumbToCSS(parsed)).toBe('1fr');
  });

  it('should serialize and deserialize keyword track', () => {
    const track: TrackBreadcrumb = { type: 'keyword', value: 'auto' };
    const json = JSON.stringify(track);
    const parsed = JSON.parse(json) as TrackBreadcrumb;
    expect(parsed).toEqual(track);
    expect(validateTrackBreadcrumb(parsed).valid).toBe(true);
    expect(trackBreadcrumbToCSS(parsed)).toBe('auto');
  });

  it('should serialize and deserialize minmax track', () => {
    const track: TrackBreadcrumb = {
      type: 'minmax',
      min: { type: 'fixed', size: { value: 200, unit: 'px' } },
      max: { type: 'fixed', size: { value: 1, unit: 'fr' } },
    };
    const json = JSON.stringify(track);
    const parsed = JSON.parse(json) as TrackBreadcrumb;
    expect(parsed).toEqual(track);
    expect(validateTrackBreadcrumb(parsed).valid).toBe(true);
    expect(trackBreadcrumbToCSS(parsed)).toBe('minmax(200px, 1fr)');
  });

  it('should serialize and deserialize repeat track', () => {
    const track: TrackBreadcrumb = {
      type: 'repeat',
      count: 3,
      track: { type: 'fixed', size: { value: 1, unit: 'fr' } },
    };
    const json = JSON.stringify(track);
    const parsed = JSON.parse(json) as TrackBreadcrumb;
    expect(parsed).toEqual(track);
    expect(validateTrackBreadcrumb(parsed).valid).toBe(true);
    expect(trackBreadcrumbToCSS(parsed)).toBe('repeat(3, 1fr)');
  });

  it('should serialize and deserialize nested minmax inside repeat', () => {
    const track: TrackBreadcrumb = {
      type: 'repeat',
      count: 4,
      track: {
        type: 'minmax',
        min: { type: 'fixed', size: { value: 200, unit: 'px' } },
        max: { type: 'fixed', size: { value: 1, unit: 'fr' } },
      },
    };
    const json = JSON.stringify(track);
    const parsed = JSON.parse(json) as TrackBreadcrumb;
    expect(parsed).toEqual(track);
    expect(validateTrackBreadcrumb(parsed).valid).toBe(true);
    expect(trackBreadcrumbToCSS(parsed)).toBe('repeat(4, minmax(200px, 1fr))');
  });
});

describe('Serialization — TrackList JSON round-trip', () => {
  it('should serialize and deserialize mixed track list', () => {
    const tracks: TrackList = [
      { type: 'fixed', size: { value: 1, unit: 'fr' } },
      { type: 'fixed', size: { value: 200, unit: 'px' } },
      { type: 'keyword', value: 'auto' },
    ];
    const json = JSON.stringify(tracks);
    const parsed = JSON.parse(json) as TrackList;
    expect(parsed).toEqual(tracks);
    expect(validateTrackList(parsed).valid).toBe(true);
    expect(trackListToCSS(parsed)).toBe('1fr 200px auto');
  });

  it('should serialize and deserialize track list with repeat', () => {
    const tracks: TrackList = [
      { type: 'repeat', count: 3, track: { type: 'fixed', size: { value: 1, unit: 'fr' } } },
      { type: 'fixed', size: { value: 200, unit: 'px' } },
    ];
    const json = JSON.stringify(tracks);
    const parsed = JSON.parse(json) as TrackList;
    expect(parsed).toEqual(tracks);
    expect(validateTrackList(parsed).valid).toBe(true);
    expect(trackListToCSS(parsed)).toBe('repeat(3, 1fr) 200px');
  });
});

describe('Serialization — GridSpanValue JSON round-trip', () => {
  it('should serialize and deserialize line span', () => {
    const span: GridSpanValue = { type: 'line', start: 1, end: 3 };
    const json = JSON.stringify(span);
    const parsed = JSON.parse(json) as GridSpanValue;
    expect(parsed).toEqual(span);
    expect(validateGridSpan(parsed).valid).toBe(true);
    expect(gridSpanToCSS(parsed)).toBe('1 / 3');
  });

  it('should serialize and deserialize span type', () => {
    const span: GridSpanValue = { type: 'span', start: 2, span: 3 };
    const json = JSON.stringify(span);
    const parsed = JSON.parse(json) as GridSpanValue;
    expect(parsed).toEqual(span);
    expect(validateGridSpan(parsed).valid).toBe(true);
    expect(gridSpanToCSS(parsed)).toBe('2 / span 3');
  });

  it('should serialize and deserialize span-only', () => {
    const span: GridSpanValue = { type: 'span-only', span: 2 };
    const json = JSON.stringify(span);
    const parsed = JSON.parse(json) as GridSpanValue;
    expect(parsed).toEqual(span);
    expect(validateGridSpan(parsed).valid).toBe(true);
    expect(gridSpanToCSS(parsed)).toBe('span 2');
  });

  it('should handle negative line numbers in serialization', () => {
    const span: GridSpanValue = { type: 'line', start: -1, end: -3 };
    const json = JSON.stringify(span);
    const parsed = JSON.parse(json) as GridSpanValue;
    expect(parsed).toEqual(span);
    expect(validateGridSpan(parsed).valid).toBe(true);
    expect(gridSpanToCSS(parsed)).toBe('-1 / -3');
  });
});

// ---------------------------------------------------------------------------
// 3. GridContainerProps Serialization (full document model)
// ---------------------------------------------------------------------------

describe('Serialization — GridContainerProps JSON round-trip', () => {
  it('should serialize and deserialize full container props', () => {
    const props: GridContainerProps = {
      gridTemplateColumns: [
        { type: 'fixed', size: { value: 200, unit: 'px' } },
        { type: 'minmax', min: { type: 'keyword', value: 'auto' }, max: { type: 'fixed', size: { value: 1, unit: 'fr' } } },
        { type: 'fixed', size: { value: 200, unit: 'px' } },
      ],
      gridTemplateRows: [
        { type: 'keyword', value: 'auto' },
        { type: 'fixed', size: { value: 1, unit: 'fr' } },
        { type: 'keyword', value: 'auto' },
      ],
      gridAutoFlow: 'row-dense',
      gridAutoColumns: { type: 'fixed', size: { value: 1, unit: 'fr' } },
      gridAutoRows: { type: 'keyword', value: 'auto' },
      justifyContent: 'center',
      alignContent: 'start',
      justifyItems: 'stretch',
      alignItems: 'center',
    };

    const json = JSON.stringify(props);
    const parsed = JSON.parse(json) as GridContainerProps;
    expect(parsed).toEqual(props);
    expect(validateGridContainerProps(parsed).valid).toBe(true);

    // Verify CSS output
    const css = gridContainerToCSS(parsed);
    expect(css.gridTemplateColumns).toBe('200px minmax(auto, 1fr) 200px');
    expect(css.gridTemplateRows).toBe('auto 1fr auto');
    expect(css.gridAutoFlow).toBe('row-dense');
    expect(css.gridAutoColumns).toBe('1fr');
    expect(css.gridAutoRows).toBe('auto');
    expect(css.justifyContent).toBe('center');
    expect(css.alignContent).toBe('start');
    expect(css.justifyItems).toBe('stretch');
    expect(css.alignItems).toBe('center');
  });

  it('should serialize and deserialize minimal container props', () => {
    const props: GridContainerProps = {
      gridTemplateColumns: [{ type: 'fixed', size: { value: 1, unit: 'fr' } }],
    };

    const json = JSON.stringify(props);
    const parsed = JSON.parse(json) as GridContainerProps;
    expect(parsed).toEqual(props);
    expect(validateGridContainerProps(parsed).valid).toBe(true);
    expect(gridContainerToCSS(parsed).gridTemplateColumns).toBe('1fr');
  });

  it('should handle empty container props', () => {
    const props: GridContainerProps = {};
    const json = JSON.stringify(props);
    const parsed = JSON.parse(json) as GridContainerProps;
    expect(parsed).toEqual({});
    expect(validateGridContainerProps(parsed).valid).toBe(true);
    expect(gridContainerToCSS(parsed)).toEqual({});
  });
});

describe('Serialization — GridItemProps JSON round-trip', () => {
  it('should serialize and deserialize full item props', () => {
    const props: GridItemProps = {
      gridColumn: { type: 'line', start: 1, end: 3 },
      gridRow: { type: 'span', start: 2, span: 3 },
      gridArea: 'header',
      justifySelf: 'center',
      alignSelf: 'start',
    };

    const json = JSON.stringify(props);
    const parsed = JSON.parse(json) as GridItemProps;
    expect(parsed).toEqual(props);
    expect(validateGridItemProps(parsed).valid).toBe(true);

    const css = gridItemToCSS(parsed);
    expect(css.gridColumn).toBe('1 / 3');
    expect(css.gridRow).toBe('2 / span 3');
    expect(css.gridArea).toBe('header');
    expect(css.justifySelf).toBe('center');
    expect(css.alignSelf).toBe('start');
  });

  it('should serialize and deserialize longhand item props', () => {
    const props: GridItemProps = {
      gridColumnStart: 1,
      gridColumnEnd: 3,
      gridRowStart: 2,
      gridRowEnd: 4,
    };

    const json = JSON.stringify(props);
    const parsed = JSON.parse(json) as GridItemProps;
    expect(parsed).toEqual(props);
    expect(validateGridItemProps(parsed).valid).toBe(true);
  });

  it('should handle empty item props', () => {
    const props: GridItemProps = {};
    const json = JSON.stringify(props);
    const parsed = JSON.parse(json) as GridItemProps;
    expect(parsed).toEqual({});
    expect(validateGridItemProps(parsed).valid).toBe(true);
    expect(gridItemToCSS(parsed)).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// 4. Responsive Value Compatibility
// ---------------------------------------------------------------------------

describe('Responsive value compatibility', () => {
  it('should support responsive TrackList pattern (string-based)', () => {
    // Responsive grid template as strings (alternative storage pattern)
    const responsiveGrid = {
      desktop: '1fr 2fr 1fr',
      tablet: '1fr 1fr',
      mobile: '100%',
    };

    // TrackList equivalent
    const desktopTrackList: TrackList = [
      { type: 'fixed', size: { value: 1, unit: 'fr' } },
      { type: 'fixed', size: { value: 2, unit: 'fr' } },
      { type: 'fixed', size: { value: 1, unit: 'fr' } },
    ];

    const tabletTrackList: TrackList = [
      { type: 'repeat', count: 2, track: { type: 'fixed', size: { value: 1, unit: 'fr' } } },
    ];

    const mobileTrackList: TrackList = [
      { type: 'fixed', size: { value: 100, unit: '%' } },
    ];

    // Verify TrackList serializes to matching CSS
    // Note: repeat(2, 1fr) is the structural representation; expanded form would be "1fr 1fr"
    expect(trackListToCSS(desktopTrackList)).toBe(responsiveGrid.desktop);
    expect(trackListToCSS(tabletTrackList)).toBe('repeat(2, 1fr)');
    expect(trackListToCSS(mobileTrackList)).toBe(responsiveGrid.mobile);
  });

  it('should support responsive GridContainerProps (per-breakpoint)', () => {
    const base: GridContainerProps = {
      gridTemplateColumns: [
        { type: 'repeat', count: 3, track: { type: 'fixed', size: { value: 1, unit: 'fr' } } },
      ],
    };

    const tabletOverride: GridContainerProps = {
      gridTemplateColumns: [
        { type: 'repeat', count: 2, track: { type: 'fixed', size: { value: 1, unit: 'fr' } } },
      ],
    };

    const mobileOverride: GridContainerProps = {
      gridTemplateColumns: [
        { type: 'fixed', size: { value: 100, unit: '%' } },
      ],
    };

    // Verify serialization
    expect(JSON.parse(JSON.stringify(base))).toEqual(base);
    expect(JSON.parse(JSON.stringify(tabletOverride))).toEqual(tabletOverride);
    expect(JSON.parse(JSON.stringify(mobileOverride))).toEqual(mobileOverride);

    // Verify CSS output
    expect(gridContainerToCSS(base).gridTemplateColumns).toBe('repeat(3, 1fr)');
    expect(gridContainerToCSS(tabletOverride).gridTemplateColumns).toBe('repeat(2, 1fr)');
    expect(gridContainerToCSS(mobileOverride).gridTemplateColumns).toBe('100%');
  });

  it('should support responsive gap values per breakpoint', () => {
    const base = { gap: 24 };
    const tablet = { gap: 16 };
    const mobile = { gap: 12 };

    expect(JSON.parse(JSON.stringify(base))).toEqual(base);
    expect(JSON.parse(JSON.stringify(tablet))).toEqual(tablet);
    expect(JSON.parse(JSON.stringify(mobile))).toEqual(mobile);
  });
});

// ---------------------------------------------------------------------------
// 5. Combined flow: GridContainer + GridItem → CSS
// ---------------------------------------------------------------------------

describe('Combined container + item CSS flow', () => {
  it('should produce complete CSS for a full grid layout', () => {
    const container: GridContainerProps = {
      gridTemplateColumns: [
        { type: 'fixed', size: { value: 200, unit: 'px' } },
        { type: 'fixed', size: { value: 1, unit: 'fr' } },
        { type: 'fixed', size: { value: 200, unit: 'px' } },
      ],
      gridTemplateRows: [
        { type: 'keyword', value: 'auto' },
        { type: 'fixed', size: { value: 1, unit: 'fr' } },
        { type: 'keyword', value: 'auto' },
      ],
    };

    const item: GridItemProps = {
      gridColumn: { type: 'line', start: 1, end: 4 },
      gridRow: { type: 'line', start: 1 },
    };

    const css = gridToCSS(container, item);

    // Container CSS
    expect(css.gridTemplateColumns).toBe('200px 1fr 200px');
    expect(css.gridTemplateRows).toBe('auto 1fr auto');

    // Item CSS
    expect(css.gridColumn).toBe('1 / 4');
    expect(css.gridRow).toBe('1');

    // Verify items only produce item CSS
    const itemOnly = gridItemToCSS(item);
    expect(itemOnly.gridColumn).toBe('1 / 4');
    expect(itemOnly.gridTemplateColumns).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 6. Known Gap Issue: display: grid synergy with displayToCSS
// ---------------------------------------------------------------------------

describe('Known Gap Issue — display: grid synergy', () => {
  it('should document that gap is shared with FlexContainerProps (DR-GRID-005)', () => {
    // GridContainerProps intentionally does NOT include `gap`, `rowGap`, `columnGap`.
    // Per DR-GRID-005, gap is shared with FlexContainerProps and applied at
    // the compile layer by combining displayToCSS + gridContainerToCSS.
    // This test documents the expected behavior and confirms the separation.

    // At the compile layer, the final CSS is produced by combining:
    //   1. displayToCSS({ display: 'GRID' }) → { display: 'grid' }
    //   2. gridContainerToCSS(gridProps) → grid-specific CSS (columns, rows, etc.)
    //   3. gap values from FlexContainerProps → gap, rowGap, columnGap

    // Verify that gridContainerToCSS does NOT handle gap
    const gridCSS = gridContainerToCSS({
      gridTemplateColumns: [{ type: 'fixed', size: { value: 1, unit: 'fr' } }],
    } as GridContainerProps);

    expect(gridCSS.gridTemplateColumns).toBe('1fr');
    expect(gridCSS.gap).toBeUndefined();
    expect(gridCSS.rowGap).toBeUndefined();
    expect(gridCSS.columnGap).toBeUndefined();
  });

  it('should produce combined display grid + container CSS (compile layer)', () => {
    // Complete CSS for a grid element requires combination at compile time:
    //   1. displayToCSS({ display: 'GRID' }) → { display: 'grid' }
    //   2. gridContainerToCSS(props) → grid-specific CSS
    //   3. FlexContainerProps gap → gap CSS

    const displayCSS = { display: 'grid' };
    const gridCSS = gridContainerToCSS({
      gridTemplateColumns: [{ type: 'repeat', count: 3, track: { type: 'fixed', size: { value: 1, unit: 'fr' } } }],
    } as GridContainerProps);

    // Gap is applied separately at the compile layer
    const gapCSS = { gap: '16px' };

    const combinedCSS = { ...displayCSS, ...gridCSS, ...gapCSS };
    expect(combinedCSS).toEqual({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
    });
  });
});

