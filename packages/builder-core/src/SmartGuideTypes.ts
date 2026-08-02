/**
 * SmartGuideTypes — C16.19 Smart Guide Types (Sprint 6B)
 *
 * Core data types for Smart Guides subsystem.
 *
 * DESIGN DECISIONS:
 *   - Extensible GuideType enum — future sprint submodules can add types
 *   - GuideSource tracks where the guide came from (Grid | Element | Container | Constraint)
 *   - GuidePriority enables layering: higher priority guides render on top
 *   - GuideOrientation supports both axes
 *   - ElementBounds is the shared input model — used by all calculators
 *   - SmartGuideResult is the unified output model — consumed by the overlay
 *   - SnapResult is separate from guide result — the overlay only renders guides
 *
 * Future extensions (Sprint 6C, 6D):
 *   - GuideSource.Constraint — for Constraint Engine guides
 *   - GuideSource.Responsive — for Responsive Engine guides
 *   - GuideType.ANCHOR — for pinning/anchor visualization
 *   - GuideType.RULE — for measurement rulers
 */

// ---------------------------------------------------------------------------
// Enums & Constants
// ---------------------------------------------------------------------------

/**
 * Source of the guide — used for traceability and debugging.
 * Grid:     grid column/row lines
 * Element:  neighboring element edges
 * Container: parent container edges/center
 * Constraint: Constraint Engine (future, Sprint 6C)
 * Responsive: Responsive Engine (future, Sprint 6D)
 */
export type GuideSource = 'GRID' | 'ELEMENT' | 'CONTAINER' | 'CONSTRAINT' | 'RESPONSIVE';

/**
 * Type of guide — determines visual appearance and behavior.
 * ALIGNMENT:     red alignment lines (element edges matching)
 * DISTANCE:      green distance indicators with label
 * CENTER:        red center line (container center)
 * MARGIN:        orange margin/padding indicators
 * SPACING:       equal spacing distribution
 * ANCHOR:        Constraint Engine anchor lines (future, Sprint 6C)
 * RULE:          measurement rulers (future)
 */
export type GuideType = 'ALIGNMENT' | 'DISTANCE' | 'CENTER' | 'MARGIN' | 'SPACING' | 'ANCHOR' | 'RULE';

/**
 * Orientation of the guide line.
 */
export type GuideOrientation = 'HORIZONTAL' | 'VERTICAL';

/**
 * Priority — determines z-order when multiple guides overlap.
 * 0 = lowest (grid), 10 = normal (element), 20 = high (container), 30 = critical (constraint)
 */
export type GuidePriority = 0 | 5 | 10 | 15 | 20 | 25 | 30;

export const GUIDE_PRIORITY: Record<GuideSource, GuidePriority> = {
  GRID: 0,
  ELEMENT: 10,
  CONTAINER: 15,
  CONSTRAINT: 20,
  RESPONSIVE: 25,
};

export const DEFAULT_SNAP_THRESHOLD = 8; // px
export const MAX_DISTANCE_GUIDE_RANGE = 100; // px — only show distance guides within this range

// ---------------------------------------------------------------------------
// Element Bounds — input model for all calculators
// ---------------------------------------------------------------------------

/**
 * Bounding box of an element on the canvas.
 * All values in pixels, relative to the canvas frame.
 */
export interface ElementBounds {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Container bounds — the parent element being dragged into.
 */
export interface ContainerBounds {
  readonly width: number;
  readonly height: number;
  readonly paddingTop?: number;
  readonly paddingRight?: number;
  readonly paddingBottom?: number;
  readonly paddingLeft?: number;
}

// ---------------------------------------------------------------------------
// Guide Model — output of calculators, consumed by overlay
// ---------------------------------------------------------------------------

/**
 * A single guide line to render on the overlay.
 * This is a pure data model — no rendering logic.
 */
export interface SmartGuide {
  readonly type: GuideType;
  readonly source: GuideSource;
  readonly orientation: GuideOrientation;
  readonly priority: GuidePriority;
  readonly position: number;       // position on the perpendicular axis (px)
  readonly start: number;          // start of the line (px)
  readonly end: number;            // end of the line (px)
  readonly label?: string;         // e.g., "24px", "Center"
  readonly color: string;          // CSS color string
  readonly opacity: number;        // 0.0 – 1.0
  readonly threshold: number;      // activation distance (px)
  readonly distance: number;       // actual distance from element (px)
}

// ---------------------------------------------------------------------------
// Snap Guidance — output of snap calculator
// ---------------------------------------------------------------------------

/**
 * Snap result — tells the drag engine where to snap the element.
 * Separate from SmartGuide — the overlay only renders guides, not snap targets.
 */
export interface SnapGuidance {
  readonly x: number;
  readonly y: number;
  readonly snapped: boolean;
  readonly snapAxis: 'X' | 'Y' | 'BOTH' | 'NONE';
  readonly guides: ReadonlyArray<SmartGuide>;
  readonly offsetX: number;
  readonly offsetY: number;
}

// ---------------------------------------------------------------------------
// Smart Guide Config — user preferences
// ---------------------------------------------------------------------------

export interface SmartGuideConfig {
  readonly showAlignmentGuides: boolean;
  readonly showDistanceGuides: boolean;
  readonly showCenterGuides: boolean;
  readonly showMarginGuides: boolean;
  readonly showSpacingGuides: boolean;
  readonly snapToGuides: boolean;
  readonly threshold: number;         // px
  readonly maxDistance: number;      // px — max range for distance indicators
  readonly guideOpacity: number;     // 0.0 – 1.0
  readonly alignmentColor: string;
  readonly distanceColor: string;
  readonly centerColor: string;
  readonly marginColor: string;
  readonly spacingColor: string;
}

export const DEFAULT_SMART_GUIDE_CONFIG: SmartGuideConfig = {
  showAlignmentGuides: true,
  showDistanceGuides: true,
  showCenterGuides: true,
  showMarginGuides: true,
  showSpacingGuides: true,
  snapToGuides: true,
  threshold: DEFAULT_SNAP_THRESHOLD,
  maxDistance: MAX_DISTANCE_GUIDE_RANGE,
  guideOpacity: 0.85,
  alignmentColor: '#ff0000',
  distanceColor: '#00cc00',
  centerColor: '#ff0000',
  marginColor: '#ff8800',
  spacingColor: '#00ccff',
};

// ---------------------------------------------------------------------------
// Calculator Input — shared input for all calculator modules
// ---------------------------------------------------------------------------

export interface CalculatorInput {
  readonly draggingElement: ElementBounds;
  readonly allElements: ReadonlyArray<ElementBounds>;
  readonly container: ContainerBounds;
  readonly config: SmartGuideConfig;
}

// ---------------------------------------------------------------------------
// Calculator Interface — each calculator implements this
// ---------------------------------------------------------------------------

export interface GuideCalculator {
  readonly name: string;
  compute(input: CalculatorInput): ReadonlyArray<SmartGuide>;
}

// ---------------------------------------------------------------------------
// Guide Aggregator — aggregates results from all calculators
// ---------------------------------------------------------------------------

export interface AggregatedGuideResult {
  readonly guides: ReadonlyArray<SmartGuide>;
  readonly snapGuidance: SnapGuidance;
  readonly activeGuideCount: number;
  readonly alignmentCount: number;
  readonly distanceCount: number;
  readonly centerCount: number;
  readonly marginCount: number;
  readonly spacingCount: number;
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

export function createElementBounds(overrides?: Partial<ElementBounds>): ElementBounds {
  return {
    id: '',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    ...overrides,
  };
}

export function createContainerBounds(overrides?: Partial<ContainerBounds>): ContainerBounds {
  return {
    width: 1280,
    height: 800,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    ...overrides,
  };
}

export function createSmartGuide(overrides?: Partial<SmartGuide>): SmartGuide {
  return {
    type: 'ALIGNMENT',
    source: 'ELEMENT',
    orientation: 'VERTICAL',
    priority: 10,
    position: 0,
    start: 0,
    end: 100,
    color: '#ff0000',
    opacity: 0.85,
    threshold: DEFAULT_SNAP_THRESHOLD,
    distance: 0,
    ...overrides,
  };
}
