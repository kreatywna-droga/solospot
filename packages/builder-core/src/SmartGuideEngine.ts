/**
 * SmartGuideEngine — C16.19 Smart Guide Engine (Sprint 6B)
 *
 * Pure computation engine for Smart Guides.
 * Zero side effects, zero DOM access, zero React dependency.
 *
 * ARCHITECTURE:
 *   SmartGuideEngine (aggregator)
 *     ├── AlignmentCalculator   — element edge alignment
 *     ├── SnapCalculator        — snap-to-guide computation
 *     ├── DistanceCalculator    — distance indicators
 *     ├── SpacingCalculator     — equal spacing distribution
 *     └── GuideAggregator       — merges, deduplicates, sorts by priority
 *
 * DESIGN DECISIONS:
 *   - Each calculator is a pure function — testable in isolation
 *   - SmartGuideEngine is the single entry point
 *   - Calculators are registered by name — new calculators can be added without modifying the engine
 *   - Canvas is NOT involved — the engine only computes, Canvas only renders
 *   - Grid snapping is delegated to GridSystem.ts (existing)
 */

import {
  GuideCalculator,
  CalculatorInput,
  SmartGuide,
  SnapGuidance,
  AggregatedGuideResult,
  ElementBounds,
  ContainerBounds,
  SmartGuideConfig,
  GuideSource,
  GuideType,
  GuideOrientation,
  GuidePriority,
  GUIDE_PRIORITY,
  DEFAULT_SNAP_THRESHOLD,
  MAX_DISTANCE_GUIDE_RANGE,
  DEFAULT_SMART_GUIDE_CONFIG,
  createSmartGuide,
} from './SmartGuideTypes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GUIDE_COLORS: Record<GuideType, string> = {
  ALIGNMENT: '#ff0000',
  DISTANCE: '#00cc00',
  CENTER: '#ff0000',
  MARGIN: '#ff8800',
  SPACING: '#00ccff',
  ANCHOR: '#ff6600',
  RULE: '#888888',
};

// ---------------------------------------------------------------------------
// AlignmentCalculator
// ---------------------------------------------------------------------------

/**
 * Computes alignment guides — red lines that appear when the dragged element's
 * edges, center, or baseline align with other elements.
 *
 * Tests 6 alignment points:
 *   - Left edge to left edge
 *   - Right edge to right edge
 *   - Center X to center X
 *   - Top edge to top edge
 *   - Bottom edge to bottom edge
 *   - Center Y to center Y
 */
class AlignmentCalculator implements GuideCalculator {
  readonly name = 'AlignmentCalculator';

  compute(input: CalculatorInput): ReadonlyArray<SmartGuide> {
    const { draggingElement, allElements, config } = input;
    if (!config.showAlignmentGuides) return [];

    const guides: SmartGuide[] = [];
    const dragRight = draggingElement.x + draggingElement.width;
    const dragBottom = draggingElement.y + draggingElement.height;
    const dragCenterX = draggingElement.x + draggingElement.width / 2;
    const dragCenterY = draggingElement.y + draggingElement.height / 2;
    const threshold = config.threshold;

    for (const el of allElements) {
      if (el.id === draggingElement.id) continue;

      const elRight = el.x + el.width;
      const elBottom = el.y + el.height;
      const elCenterX = el.x + el.width / 2;
      const elCenterY = el.y + el.height / 2;

      // --- Vertical alignment (X axis) ---

      // Left to left
      this.tryAlignment(
        guides, draggingElement, el, 'VERTICAL',
        draggingElement.x, el.x, threshold,
        el.y, elBottom, el.height, 'left'
      );

      // Right to right
      this.tryAlignment(
        guides, draggingElement, el, 'VERTICAL',
        dragRight, elRight, threshold,
        el.y, elBottom, el.height, 'right'
      );

      // Center X to center X
      this.tryAlignment(
        guides, draggingElement, el, 'VERTICAL',
        dragCenterX, elCenterX, threshold,
        el.y, elBottom, el.height, 'center-x'
      );

      // Left to right (element left aligns with other element's right edge)
      this.tryAlignment(
        guides, draggingElement, el, 'VERTICAL',
        draggingElement.x, elRight, threshold,
        el.y, elBottom, el.height, 'left-right'
      );

      // Right to left (element right aligns with other element's left edge)
      this.tryAlignment(
        guides, draggingElement, el, 'VERTICAL',
        dragRight, el.x, threshold,
        el.y, elBottom, el.height, 'right-left'
      );

      // --- Horizontal alignment (Y axis) ---

      // Top to top
      this.tryAlignment(
        guides, draggingElement, el, 'HORIZONTAL',
        draggingElement.y, el.y, threshold,
        el.x, elRight, el.width, 'top'
      );

      // Bottom to bottom
      this.tryAlignment(
        guides, draggingElement, el, 'HORIZONTAL',
        dragBottom, elBottom, threshold,
        el.x, elRight, el.width, 'bottom'
      );

      // Center Y to center Y
      this.tryAlignment(
        guides, draggingElement, el, 'HORIZONTAL',
        dragCenterY, elCenterY, threshold,
        el.x, elRight, el.width, 'center-y'
      );

      // Top to bottom
      this.tryAlignment(
        guides, draggingElement, el, 'HORIZONTAL',
        draggingElement.y, elBottom, threshold,
        el.x, elRight, el.width, 'top-bottom'
      );

      // Bottom to top
      this.tryAlignment(
        guides, draggingElement, el, 'HORIZONTAL',
        dragBottom, el.y, threshold,
        el.x, elRight, el.width, 'bottom-top'
      );
    }

    return guides;
  }

  private tryAlignment(
    guides: SmartGuide[],
    drag: ElementBounds,
    target: ElementBounds,
    orientation: GuideOrientation,
    dragValue: number,
    targetValue: number,
    threshold: number,
    lineStart: number,
    lineEnd: number,
    lineLength: number,
    label?: string
  ): void {
    const distance = Math.abs(dragValue - targetValue);
    if (distance < threshold) {
      const opacity = 1 - (distance / threshold) * 0.3;
      const guideStart = orientation === 'VERTICAL'
        ? Math.min(drag.y, target.y)
        : Math.min(drag.x, target.x);
      const guideEnd = orientation === 'VERTICAL'
        ? Math.max(drag.y + drag.height, target.y + target.height)
        : Math.max(drag.x + drag.width, target.x + target.width);

      guides.push({
        type: 'ALIGNMENT',
        source: 'ELEMENT',
        orientation,
        priority: GUIDE_PRIORITY.ELEMENT,
        position: targetValue,
        start: guideStart,
        end: guideEnd,
        label: label ? `${label[0].toUpperCase()}${label.slice(1)}` : undefined,
        color: GUIDE_COLORS.ALIGNMENT,
        opacity,
        threshold,
        distance,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// CenterCalculator
// ---------------------------------------------------------------------------

/**
 * Computes center guides — lines through the container's center.
 * Shows when the dragged element is within threshold of the container center.
 */
class CenterCalculator implements GuideCalculator {
  readonly name = 'CenterCalculator';

  compute(input: CalculatorInput): ReadonlyArray<SmartGuide> {
    const { draggingElement, container, config } = input;
    if (!config.showCenterGuides) return [];

    const guides: SmartGuide[] = [];
    const threshold = config.threshold;

    const containerCenterX = container.width / 2;
    const containerCenterY = container.height / 2;
    const dragCenterX = draggingElement.x + draggingElement.width / 2;
    const dragCenterY = draggingElement.y + draggingElement.height / 2;

    // Vertical center line
    const distX = Math.abs(dragCenterX - containerCenterX);
    if (distX < threshold * 2) {
      const opacity = 1 - (distX / (threshold * 2)) * 0.3;
      guides.push({
        type: 'CENTER',
        source: 'CONTAINER',
        orientation: 'VERTICAL',
        priority: GUIDE_PRIORITY.CONTAINER,
        position: containerCenterX,
        start: 0,
        end: container.height,
        label: 'Center',
        color: GUIDE_COLORS.CENTER,
        opacity,
        threshold: threshold * 2,
        distance: distX,
      });
    }

    // Horizontal center line
    const distY = Math.abs(dragCenterY - containerCenterY);
    if (distY < threshold * 2) {
      const opacity = 1 - (distY / (threshold * 2)) * 0.3;
      guides.push({
        type: 'CENTER',
        source: 'CONTAINER',
        orientation: 'HORIZONTAL',
        priority: GUIDE_PRIORITY.CONTAINER,
        position: containerCenterY,
        start: 0,
        end: container.width,
        label: 'Center',
        color: GUIDE_COLORS.CENTER,
        opacity,
        threshold: threshold * 2,
        distance: distY,
      });
    }

    return guides;
  }
}

// ---------------------------------------------------------------------------
// DistanceCalculator
// ---------------------------------------------------------------------------

/**
 * Computes distance guides — green indicators showing the pixel distance
 * between the dragged element and nearby elements.
 */
class DistanceCalculator implements GuideCalculator {
  readonly name = 'DistanceCalculator';

  compute(input: CalculatorInput): ReadonlyArray<SmartGuide> {
    const { draggingElement, allElements, container, config } = input;
    if (!config.showDistanceGuides) return [];

    const guides: SmartGuide[] = [];
    const maxDistance = config.maxDistance;

    for (const el of allElements) {
      if (el.id === draggingElement.id) continue;

      const elRight = el.x + el.width;
      const elBottom = el.y + el.height;
      const dragRight = draggingElement.x + draggingElement.width;
      const dragBottom = draggingElement.y + draggingElement.height;

      // Horizontal distance: element right → drag left
      const hDist = draggingElement.x - elRight;
      if (hDist > 0 && hDist < maxDistance) {
        const midY = Math.min(draggingElement.y + draggingElement.height, el.y + el.height) - Math.abs(draggingElement.y - el.y) / 2;
        guides.push({
          type: 'DISTANCE',
          source: 'ELEMENT',
          orientation: 'HORIZONTAL',
          priority: GUIDE_PRIORITY.ELEMENT,
          position: midY,
          start: elRight,
          end: draggingElement.x,
          label: `${Math.round(hDist)}px`,
          color: GUIDE_COLORS.DISTANCE,
          opacity: 0.8,
          threshold: config.threshold,
          distance: hDist,
        });
      }

      // Horizontal distance: drag right → element left
      const hDist2 = el.x - dragRight;
      if (hDist2 > 0 && hDist2 < maxDistance) {
        const midY = Math.min(draggingElement.y + draggingElement.height, el.y + el.height) - Math.abs(draggingElement.y - el.y) / 2;
        guides.push({
          type: 'DISTANCE',
          source: 'ELEMENT',
          orientation: 'HORIZONTAL',
          priority: GUIDE_PRIORITY.ELEMENT,
          position: midY,
          start: dragRight,
          end: el.x,
          label: `${Math.round(hDist2)}px`,
          color: GUIDE_COLORS.DISTANCE,
          opacity: 0.8,
          threshold: config.threshold,
          distance: hDist2,
        });
      }

      // Vertical distance: element bottom → drag top
      const vDist = draggingElement.y - elBottom;
      if (vDist > 0 && vDist < maxDistance) {
        const midX = Math.min(draggingElement.x + draggingElement.width, el.x + el.width) - Math.abs(draggingElement.x - el.x) / 2;
        guides.push({
          type: 'DISTANCE',
          source: 'ELEMENT',
          orientation: 'VERTICAL',
          priority: GUIDE_PRIORITY.ELEMENT,
          position: midX,
          start: elBottom,
          end: draggingElement.y,
          label: `${Math.round(vDist)}px`,
          color: GUIDE_COLORS.DISTANCE,
          opacity: 0.8,
          threshold: config.threshold,
          distance: vDist,
        });
      }

      // Vertical distance: drag bottom → element top
      const vDist2 = el.y - dragBottom;
      if (vDist2 > 0 && vDist2 < maxDistance) {
        const midX = Math.min(draggingElement.x + draggingElement.width, el.x + el.width) - Math.abs(draggingElement.x - el.x) / 2;
        guides.push({
          type: 'DISTANCE',
          source: 'ELEMENT',
          orientation: 'VERTICAL',
          priority: GUIDE_PRIORITY.ELEMENT,
          position: midX,
          start: dragBottom,
          end: el.y,
          label: `${Math.round(vDist2)}px`,
          color: GUIDE_COLORS.DISTANCE,
          opacity: 0.8,
          threshold: config.threshold,
          distance: vDist2,
        });
      }
    }

    // Container edge distance (left)
    const containerLeftDist = draggingElement.x - 0;
    if (containerLeftDist > 0 && containerLeftDist < maxDistance) {
      guides.push({
        type: 'DISTANCE',
        source: 'CONTAINER',
        orientation: 'HORIZONTAL',
        priority: GUIDE_PRIORITY.CONTAINER,
        position: draggingElement.y + draggingElement.height / 2,
        start: 0,
        end: draggingElement.x,
        label: `${Math.round(containerLeftDist)}px`,
        color: GUIDE_COLORS.DISTANCE,
        opacity: 0.6,
        threshold: config.threshold,
        distance: containerLeftDist,
      });
    }

    // Container right edge distance
    const containerRightDist = container.width - (draggingElement.x + draggingElement.width);
    if (containerRightDist > 0 && containerRightDist < maxDistance) {
      guides.push({
        type: 'DISTANCE',
        source: 'CONTAINER',
        orientation: 'HORIZONTAL',
        priority: GUIDE_PRIORITY.CONTAINER,
        position: draggingElement.y + draggingElement.height / 2,
        start: draggingElement.x + draggingElement.width,
        end: container.width,
        label: `${Math.round(containerRightDist)}px`,
        color: GUIDE_COLORS.DISTANCE,
        opacity: 0.6,
        threshold: config.threshold,
        distance: containerRightDist,
      });
    }

    return guides;
  }
}

// ---------------------------------------------------------------------------
// SpacingCalculator
// ---------------------------------------------------------------------------

/**
 * Computes spacing guides — shows when the dragged element creates
 * equal spacing between two other elements.
 */
class SpacingCalculator implements GuideCalculator {
  readonly name = 'SpacingCalculator';

  compute(input: CalculatorInput): ReadonlyArray<SmartGuide> {
    const { draggingElement, allElements, config } = input;
    if (!config.showSpacingGuides) return [];

    const guides: SmartGuide[] = [];
    const threshold = config.threshold;

    // Sort elements by X position
    const sortedByX = [...allElements]
      .filter(el => el.id !== draggingElement.id)
      .sort((a, b) => a.x - b.x);

    // Find if dragging element is between two elements horizontally
    for (let i = 0; i < sortedByX.length - 1; i++) {
      const left = sortedByX[i];
      const right = sortedByX[i + 1];
      const leftRight = left.x + left.width;
      const rightLeft = right.x;
      const gap = rightLeft - leftRight;

      if (gap <= 0) continue;

      // Check if dragging element is in this gap
      const dragLeft = draggingElement.x;
      const dragRight = draggingElement.x + draggingElement.width;

      if (dragLeft >= leftRight && dragRight <= rightLeft) {
        const leftGap = dragLeft - leftRight;
        const rightGap = rightLeft - dragRight;

        // Equal spacing?
        if (Math.abs(leftGap - rightGap) < threshold) {
          const midY = Math.min(draggingElement.y + draggingElement.height, left.y + left.height)
            - Math.abs(draggingElement.y - left.y) / 2;

          guides.push({
            type: 'SPACING',
            source: 'ELEMENT',
            orientation: 'HORIZONTAL',
            priority: GUIDE_PRIORITY.ELEMENT,
            position: midY,
            start: leftRight,
            end: rightLeft,
            label: `${Math.round(leftGap)}px`,
            color: GUIDE_COLORS.SPACING,
            opacity: 0.8,
            threshold,
            distance: Math.abs(leftGap - rightGap),
          });
        }
      }
    }

    // Sort elements by Y position
    const sortedByY = [...allElements]
      .filter(el => el.id !== draggingElement.id)
      .sort((a, b) => a.y - b.y);

    // Find if dragging element is between two elements vertically
    for (let i = 0; i < sortedByY.length - 1; i++) {
      const top = sortedByY[i];
      const bottom = sortedByY[i + 1];
      const topBottom = top.y + top.height;
      const bottomTop = bottom.y;
      const gap = bottomTop - topBottom;

      if (gap <= 0) continue;

      const dragTop = draggingElement.y;
      const dragBottom = draggingElement.y + draggingElement.height;

      if (dragTop >= topBottom && dragBottom <= bottomTop) {
        const topGap = dragTop - topBottom;
        const bottomGap = bottomTop - dragBottom;

        if (Math.abs(topGap - bottomGap) < threshold) {
          const midX = Math.min(draggingElement.x + draggingElement.width, top.x + top.width)
            - Math.abs(draggingElement.x - top.x) / 2;

          guides.push({
            type: 'SPACING',
            source: 'ELEMENT',
            orientation: 'VERTICAL',
            priority: GUIDE_PRIORITY.ELEMENT,
            position: midX,
            start: topBottom,
            end: bottomTop,
            label: `${Math.round(topGap)}px`,
            color: GUIDE_COLORS.SPACING,
            opacity: 0.8,
            threshold,
            distance: Math.abs(topGap - bottomGap),
          });
        }
      }
    }

    return guides;
  }
}

// ---------------------------------------------------------------------------
// SnapCalculator
// ---------------------------------------------------------------------------

/**
 * Computes snap guidance — determines whether the dragged element should
 * snap to any guide position.
 *
 * This is the ONLY calculator that produces a SnapGuidance result.
 * It is used by the DragEngine to adjust the final position.
 */
class SnapCalculator implements GuideCalculator {
  readonly name = 'SnapCalculator';

  compute(input: CalculatorInput): ReadonlyArray<SmartGuide> {
    // SnapCalculator doesn't produce guides — it produces snap adjustments.
    // Guides are computed by the other calculators.
    return [];
  }

/**
   * Compute snap guidance from a set of guides.
   * Pure function — separate from the calculator interface.
   * Only snap to ALIGNMENT and CENTER guides — DISTANCE and SPACING guides are informational only.
   */
  computeSnap(
    currentPosition: { x: number; y: number; width: number; height: number },
    guides: ReadonlyArray<SmartGuide>,
    threshold: number
  ): SnapGuidance {
    let snapX = currentPosition.x;
    let snapY = currentPosition.y;
    let snappedX = false;
    let snappedY = false;
    const activeGuides: SmartGuide[] = [];

    for (const guide of guides) {
      // Only snap to alignment and center guides — distance and spacing guides are visual only
      if (guide.type !== 'ALIGNMENT' && guide.type !== 'CENTER') continue;
      if (guide.orientation === 'VERTICAL') {
        // Snap to vertical guide
        const dragCenterX = currentPosition.x + currentPosition.width / 2;
        const dragLeft = currentPosition.x;
        const dragRight = currentPosition.x + currentPosition.width;

        // Snap left edge to guide
        if (Math.abs(dragLeft - guide.position) < threshold) {
          snapX = guide.position;
          snappedX = true;
          activeGuides.push(guide);
        }
        // Snap right edge to guide
        else if (Math.abs(dragRight - guide.position) < threshold) {
          snapX = guide.position - currentPosition.width;
          snappedX = true;
          activeGuides.push(guide);
        }
        // Snap center to guide
        else if (Math.abs(dragCenterX - guide.position) < threshold) {
          snapX = guide.position - currentPosition.width / 2;
          snappedX = true;
          activeGuides.push(guide);
        }
      } else {
        // Horizontal guide
        const dragCenterY = currentPosition.y + currentPosition.height / 2;
        const dragTop = currentPosition.y;
        const dragBottom = currentPosition.y + currentPosition.height;

        if (Math.abs(dragTop - guide.position) < threshold) {
          snapY = guide.position;
          snappedY = true;
          activeGuides.push(guide);
        } else if (Math.abs(dragBottom - guide.position) < threshold) {
          snapY = guide.position - currentPosition.height;
          snappedY = true;
          activeGuides.push(guide);
        } else if (Math.abs(dragCenterY - guide.position) < threshold) {
          snapY = guide.position - currentPosition.height / 2;
          snappedY = true;
          activeGuides.push(guide);
        }
      }
    }

    const snapAxis = snappedX && snappedY ? 'BOTH' : snappedX ? 'X' : snappedY ? 'Y' : 'NONE';

    return {
      x: snapX,
      y: snapY,
      snapped: snappedX || snappedY,
      snapAxis,
      guides: activeGuides,
      offsetX: snapX - currentPosition.x,
      offsetY: snapY - currentPosition.y,
    };
  }
}

// ---------------------------------------------------------------------------
// GuideAggregator
// ---------------------------------------------------------------------------

/**
 * Aggregates and deduplicates guides from all calculators.
 * Sorts by priority (highest first) for rendering order.
 * Removes duplicate guides that are at the same position and orientation.
 */
class GuideAggregator {
  aggregate(allGuides: ReadonlyArray<ReadonlyArray<SmartGuide>>): ReadonlyArray<SmartGuide> {
    const flat = allGuides.flat();

// Deduplicate: same position + orientation + type = keep the one with highest priority
    // Different guide types at the same position should both be shown (e.g., SPACING + ALIGNMENT)
    const map = new Map<string, SmartGuide>();
    for (const guide of flat) {
      const key = `${guide.type}:${guide.orientation}:${Math.round(guide.position)}`;
      const existing = map.get(key);
      if (!existing || guide.priority > existing.priority) {
        map.set(key, guide);
      }
    }

    // Sort by priority (descending) — higher priority renders on top
    return Array.from(map.values()).sort((a, b) => b.priority - a.priority);
  }
}

// ---------------------------------------------------------------------------
// SmartGuideEngine — public entry point
// ---------------------------------------------------------------------------

/**
 * SmartGuideEngine — the single entry point for all smart guide computations.
 *
 * Usage:
 *   const engine = new SmartGuideEngine();
 *   const result = engine.computeAll({
 *     draggingElement: { id: 'el1', x: 100, y: 200, width: 300, height: 150 },
 *     allElements: [...],
 *     container: { width: 1280, height: 800 },
 *     config: DEFAULT_SMART_GUIDE_CONFIG,
 *   });
 *
 *   // result.guides — render these on the overlay
 *   // result.snapGuidance — apply this to the element position
 */
export class SmartGuideEngine {
  private readonly calculators: ReadonlyArray<GuideCalculator>;
  private readonly aggregator: GuideAggregator;
  private readonly snapCalculator: SnapCalculator;

  constructor(calculators?: ReadonlyArray<GuideCalculator>) {
    this.calculators = calculators ?? [
      new AlignmentCalculator(),
      new CenterCalculator(),
      new DistanceCalculator(),
      new SpacingCalculator(),
    ];
    this.aggregator = new GuideAggregator();
    this.snapCalculator = new SnapCalculator();
  }

  /**
   * Compute all guides for the given input.
   * This is the main entry point — called once per drag frame.
   */
  computeAll(input: CalculatorInput): AggregatedGuideResult {
    const allGuides = this.calculators.map(calc => calc.compute(input));
    const guides = this.aggregator.aggregate(allGuides);

    // Compute snap guidance from all guides
    const snapGuidance = this.snapCalculator.computeSnap(
      input.draggingElement,
      guides,
      input.config.threshold
    );

    // Count by type
    let alignmentCount = 0;
    let distanceCount = 0;
    let centerCount = 0;
    let marginCount = 0;
    let spacingCount = 0;

    for (const g of guides) {
      switch (g.type) {
        case 'ALIGNMENT': alignmentCount++; break;
        case 'DISTANCE': distanceCount++; break;
        case 'CENTER': centerCount++; break;
        case 'MARGIN': marginCount++; break;
        case 'SPACING': spacingCount++; break;
      }
    }

    return {
      guides,
      snapGuidance,
      activeGuideCount: guides.length,
      alignmentCount,
      distanceCount,
      centerCount,
      marginCount,
      spacingCount,
    };
  }

  /**
   * Compute only snap guidance (optimized path when only snap is needed).
   */
  computeSnap(input: CalculatorInput): SnapGuidance {
    const allGuides = this.calculators.map(calc => calc.compute(input));
    const guides = this.aggregator.aggregate(allGuides);
    return this.snapCalculator.computeSnap(
      input.draggingElement,
      guides,
      input.config.threshold
    );
  }
}

// ---------------------------------------------------------------------------
// Re-export types for convenience
// ---------------------------------------------------------------------------

export type {
  GuideCalculator,
  CalculatorInput,
  AggregatedGuideResult,
} from './SmartGuideTypes';
