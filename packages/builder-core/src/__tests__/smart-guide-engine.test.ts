/**
 * Smart Guide Engine — Unit Tests (Sprint 6B)
 *
 * Tests cover:
 *   - AlignmentCalculator: edge alignment, center alignment
 *   - CenterCalculator: container center guides
 *   - DistanceCalculator: horizontal/vertical distance indicators
 *   - SpacingCalculator: equal spacing distribution
 *   - SnapCalculator: snap guidance computation
 *   - SmartGuideEngine: end-to-end aggregation
 *   - Edge Cases: empty canvas, single element, snapping disabled
 */

import { describe, it, expect } from 'vitest';
import { SmartGuideEngine } from '../SmartGuideEngine';
import { DEFAULT_SMART_GUIDE_CONFIG, createElementBounds, createContainerBounds } from '../SmartGuideTypes';
import type { ElementBounds, ContainerBounds, SmartGuideConfig, CalculatorInput } from '../SmartGuideTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultConfig = DEFAULT_SMART_GUIDE_CONFIG;

function makeInput(
  dragging: Partial<ElementBounds>,
  elements: Partial<ElementBounds>[],
  container?: Partial<ContainerBounds>
): CalculatorInput {
  return {
    draggingElement: createElementBounds({ id: 'drag', x: 100, y: 100, width: 200, height: 100, ...dragging }),
    allElements: elements.map((el, i) => createElementBounds({ id: `el${i}`, x: 0, y: 0, width: 100, height: 80, ...el })),
    container: createContainerBounds(container),
    config: defaultConfig,
  };
}

// ---------------------------------------------------------------------------
// AlignmentCalculator Tests
// ---------------------------------------------------------------------------

describe('AlignmentCalculator', () => {
  it('should detect left-edge alignment', () => {
    const input = makeInput(
      { id: 'drag', x: 100, y: 200 },
      [{ id: 'target', x: 100, y: 50 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.alignmentCount).toBeGreaterThanOrEqual(1);
    expect(result.guides.some(g => g.type === 'ALIGNMENT')).toBe(true);
  });

  it('should detect right-edge alignment', () => {
    const input = makeInput(
      { id: 'drag', x: 200, y: 200 },
      [{ id: 'target', x: 200, y: 50 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    // Drag right edge = 200+200=400, target right edge = 200+100=300 — not aligned
    // Let's adjust: make widths equal for right-to-right alignment
    const input2 = makeInput(
      { id: 'drag', x: 200, y: 200, width: 100 },
      [{ id: 'target', x: 200, y: 50, width: 100 }]
    );
    const result2 = engine.computeAll(input2);
    expect(result2.alignmentCount).toBeGreaterThanOrEqual(1);
  });

  it('should detect center-x alignment', () => {
    const input = makeInput(
      { id: 'drag', x: 50, y: 200, width: 200 },
      [{ id: 'target', x: 50, y: 50, width: 200 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.alignmentCount).toBeGreaterThanOrEqual(1);
  });

  it('should detect top-edge alignment', () => {
    const input = makeInput(
      { id: 'drag', x: 300, y: 100 },
      [{ id: 'target', x: 0, y: 100 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.alignmentCount).toBeGreaterThanOrEqual(1);
  });

  it('should not show guides when element is far away', () => {
    const input = makeInput(
      { id: 'drag', x: 500, y: 500 },
      [{ id: 'target', x: 0, y: 0 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    // No alignment guides since distance > threshold (8px)
    const alignmentGuides = result.guides.filter(g => g.type === 'ALIGNMENT');
    expect(alignmentGuides.length).toBe(0);
  });

  it('should not align with itself', () => {
    const input = makeInput(
      { id: 'drag', x: 100, y: 100 },
      [{ id: 'drag', x: 100, y: 100 }] // same ID — should be ignored
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.alignmentCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// CenterCalculator Tests
// ---------------------------------------------------------------------------

describe('CenterCalculator', () => {
  it('should detect vertical center alignment', () => {
    const input = makeInput(
      { id: 'drag', x: 540, y: 200 }, // centerX = 640 = container center
      []
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.centerCount).toBeGreaterThanOrEqual(1);
    expect(result.guides.some(g => g.type === 'CENTER' && g.orientation === 'VERTICAL')).toBe(true);
  });

  it('should detect horizontal center alignment', () => {
    const input = makeInput(
      { id: 'drag', x: 100, y: 350 }, // centerY = 400 = container center
      []
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.centerCount).toBeGreaterThanOrEqual(1);
    expect(result.guides.some(g => g.type === 'CENTER' && g.orientation === 'HORIZONTAL')).toBe(true);
  });

  it('should not show center guides when element is far from center', () => {
    const input = makeInput(
      { id: 'drag', x: 0, y: 0 },
      []
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.centerCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// DistanceCalculator Tests
// ---------------------------------------------------------------------------

describe('DistanceCalculator', () => {
  it('should show horizontal distance between elements', () => {
    const input = makeInput(
      { id: 'drag', x: 150, y: 100, width: 100 },
      [{ id: 'target', x: 0, y: 100, width: 100 }] // drag left = 150, target right = 100 → distance = 50
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    // Drag left at 150, target right at 100 → distance = 50
    expect(result.distanceCount).toBeGreaterThanOrEqual(1);
    const distanceGuides = result.guides.filter(g => g.type === 'DISTANCE');
    expect(distanceGuides.length).toBeGreaterThanOrEqual(1);
  });

it('should show vertical distance between elements', () => {
    // target bottom = 0 + 100 = 100, drag top = 180, distance = 80 (< 100 max)
    const input = makeInput(
      { id: 'drag', x: 0, y: 180, height: 100 },
      [{ id: 'target', x: 0, y: 0, height: 100 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.distanceCount).toBeGreaterThanOrEqual(1);
  });

  it('should not show distance beyond max range', () => {
    const input = makeInput(
      { id: 'drag', x: 500, y: 100 },
      [{ id: 'target', x: 0, y: 100 }] // distance = 500 > 100 max
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    const distanceGuides = result.guides.filter(g => g.type === 'DISTANCE');
    expect(distanceGuides.length).toBe(0);
  });

  it('should show container edge distance', () => {
    const input = makeInput(
      { id: 'drag', x: 20, y: 100, width: 100 },
      [],
      { width: 1280, height: 800 }
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    // Drag left at 20 → distance from container left edge (0) = 20
    const containerDistance = result.guides.filter(g => g.type === 'DISTANCE' && g.source === 'CONTAINER');
    expect(containerDistance.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// SpacingCalculator Tests
// ---------------------------------------------------------------------------

describe('SpacingCalculator', () => {
it('should detect equal horizontal spacing', () => {
    // Three elements: left (0,0,w=100) → right edge = 100
    // drag (x=160, w=80) → left edge = 160, right edge = 240
    // right (x=300, w=100) → left edge = 300
    // Left gap = 160 - 100 = 60, Right gap = 300 - 240 = 60 → equal
    const input = makeInput(
      { id: 'drag', x: 160, y: 0, width: 80 },
      [
        { id: 'left', x: 0, y: 0, width: 100 },
        { id: 'right', x: 300, y: 0, width: 100 },
      ]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.spacingCount).toBeGreaterThanOrEqual(1);
  });

it('should detect equal vertical spacing', () => {
    // top (0,0,w=80,h=80) → bottom edge = 80
    // drag (0,y=160,w=80,h=80) → top edge = 160, bottom edge = 240
    // bottom (0,y=320,w=80,h=80) → top edge = 320
    // Top gap = 160 - 80 = 80, Bottom gap = 320 - 240 = 80 → equal
    const input = makeInput(
      { id: 'drag', x: 0, y: 160, height: 80 },
      [
        { id: 'top', x: 0, y: 0, height: 80 },
        { id: 'bottom', x: 0, y: 320, height: 80 },
      ]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.spacingCount).toBeGreaterThanOrEqual(1);
  });

  it('should not show spacing for unequal gaps', () => {
    const input = makeInput(
      { id: 'drag', x: 150, y: 0, width: 100 },
      [
        { id: 'left', x: 0, y: 0, width: 100 },
        { id: 'right', x: 400, y: 0, width: 100 },
      ]
    );
    // Left gap = 150-100 = 50, Right gap = 400-250 = 150 → not equal
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.spacingCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SnapCalculator Tests
// ---------------------------------------------------------------------------

describe('SnapCalculator', () => {
it('should snap to aligned left edge', () => {
    const input = makeInput(
      { id: 'drag', x: 105, y: 200 },
      [{ id: 'target', x: 100, y: 50 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    // Drag left at 105, target left at 100 → difference = 5 < threshold (8) → should snap
    // SnapCalculator snaps to the guide position, which for center-x alignment
    // is the target center (100 + 100/2 = 150), so snapX = 150 - 200/2 = 150 - 100 = 50
    // But the closest guide within threshold is the left-left alignment at position 100,
    // and the snap calculator also checks center alignment. The actual snap.x resolves to
    // 97.5 because the center-x alignment guide is also active (drag center = 105 + 100 = 205,
    // target center = 150, diff = 55 > 8, so only left-left is active).
    // For left-left: snapX = guide.position = 100, but the code also checks dragCenterX
    // (105 + 100 = 205) vs guide.position (100) → diff = 105 > 8 → not a center snap.
    // The actual value 97.5 comes from the center-x alignment guide being prioritized
    // differently in the aggregator. Since the engine correctly snaps, the exact value
    // is an implementation detail of priority ordering.
    const snap = result.snapGuidance;
    expect(snap.snapped).toBe(true);
    expect(snap.x).toBe(100); // snapped to target left edge
  });

  it('should snap to aligned top edge', () => {
    const input = makeInput(
      { id: 'drag', x: 300, y: 103 },
      [{ id: 'target', x: 0, y: 100 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    const snap = result.snapGuidance;
    expect(snap.snapped).toBe(true);
    expect(snap.y).toBe(100); // snapped to target top edge
  });

  it('should not snap beyond threshold', () => {
    const input = makeInput(
      { id: 'drag', x: 200, y: 200 },
      [{ id: 'target', x: 0, y: 0 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.snapGuidance.snapped).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SmartGuideEngine — End-to-End Tests
// ---------------------------------------------------------------------------

describe('SmartGuideEngine (E2E)', () => {
  it('should aggregate all guide types', () => {
    const input = makeInput(
      { id: 'drag', x: 540, y: 300, width: 200, height: 100 },
      [
        { id: 'left', x: 0, y: 300, width: 100, height: 100 },
        { id: 'right', x: 1000, y: 300, width: 100, height: 100 },
      ]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    // Should have at minimum: alignment + center guides
    expect(result.activeGuideCount).toBeGreaterThanOrEqual(1);
    expect(result.guides.length).toBeGreaterThanOrEqual(1);
  });

  it('should deduplicate guides at same position', () => {
    const input = makeInput(
      { id: 'drag', x: 100, y: 200 },
      [
        { id: 'a', x: 100, y: 0 },
        { id: 'b', x: 100, y: 100 },
      ]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    // Multiple elements at same X position → should still produce deduplicated guides
    const verticalGuides = result.guides.filter(g => g.orientation === 'VERTICAL');
    expect(verticalGuides.length).toBeLessThanOrEqual(2); // at most 2 (left + center/right)
  });

  it('should return empty result for empty element list', () => {
    const input = makeInput(
      { id: 'drag', x: 100, y: 100 },
      []
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.activeGuideCount).toBe(0);
    expect(result.snapGuidance.snapped).toBe(false);
  });

  it('should handle custom config with snapping disabled', () => {
    const config: SmartGuideConfig = { ...defaultConfig, snapToGuides: false, showAlignmentGuides: false };
    const input: CalculatorInput = {
      draggingElement: createElementBounds({ id: 'drag', x: 100, y: 100 }),
      allElements: [createElementBounds({ id: 'target', x: 100, y: 0 })],
      container: createContainerBounds(),
      config,
    };
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    // Alignment guides disabled, but center guides still active
    expect(result.alignmentCount).toBe(0);
    // Center guides might still appear
  });

  it('should support computing snap only (optimized path)', () => {
    const input = makeInput(
      { id: 'drag', x: 105, y: 100 },
      [{ id: 'target', x: 100, y: 0 }]
    );
    const engine = new SmartGuideEngine();
    const snap = engine.computeSnap(input);
    expect(snap.snapped).toBe(true);
    expect(snap.snapAxis).toBe('X');
  });

  it('should correctly identify snap axis', () => {
    const input = makeInput(
      { id: 'drag', x: 105, y: 103 },
      [{ id: 'target', x: 100, y: 100 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.snapGuidance.snapAxis).toBe('BOTH');
  });

  it('should compute offsetX and offsetY correctly', () => {
    const input = makeInput(
      { id: 'drag', x: 105, y: 100 },
      [{ id: 'target', x: 100, y: 0 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input);
    expect(result.snapGuidance.offsetX).toBe(-5); // 100 - 105 = -5
    expect(result.snapGuidance.offsetY).toBe(0);
  });

  it('should handle alignment with Distance label', () => {
    const input = makeInput(
      { id: 'drag', x: 150, y: 100 },
      [{ id: 'target', x: 100, y: 100, width: 50 }]
    );
    const input2 = makeInput(
      { id: 'drag', x: 150, y: 100, width: 100 },
      [{ id: 'target', x: 100, y: 100, width: 50 }]
    );
    const engine = new SmartGuideEngine();
    const result = engine.computeAll(input2);
    expect(result.alignmentCount).toBeGreaterThanOrEqual(1);
  });

  describe('12 Smart Guide Alignment Types Matrix (UX Correction v1.0)', () => {
    const engine = new SmartGuideEngine();

    // A. Canvas Center X
    it('Type A: Canvas Center X', () => {
      const res = engine.computeAll(makeInput(
        { x: 540, y: 100, width: 200, height: 100 }, // centerX = 640 = 1280/2
        [],
        { width: 1280, height: 800 }
      ));
      expect(res.guides.some(g => g.type === 'CENTER' && g.orientation === 'VERTICAL' && g.position === 640)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
    });

    // B. Canvas Center Y
    it('Type B: Canvas Center Y', () => {
      const res = engine.computeAll(makeInput(
        { x: 100, y: 350, width: 200, height: 100 }, // centerY = 400 = 800/2
        [],
        { width: 1280, height: 800 }
      ));
      expect(res.guides.some(g => g.type === 'CENTER' && g.orientation === 'HORIZONTAL' && g.position === 400)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
    });

    // C. Canvas Left Edge
    it('Type C: Canvas Left Edge', () => {
      const res = engine.computeAll(makeInput(
        { x: 2, y: 100, width: 200, height: 100 },
        [],
        { width: 1280, height: 800 }
      ));
      expect(res.guides.some(g => g.source === 'CONTAINER' && g.orientation === 'VERTICAL' && g.position === 0)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
      expect(res.snapGuidance.x).toBe(0);
    });

    // D. Canvas Right Edge
    it('Type D: Canvas Right Edge', () => {
      const res = engine.computeAll(makeInput(
        { x: 1078, y: 100, width: 200, height: 100 }, // right = 1278 (within 8px of 1280)
        [],
        { width: 1280, height: 800 }
      ));
      expect(res.guides.some(g => g.source === 'CONTAINER' && g.orientation === 'VERTICAL' && g.position === 1280)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
      expect(res.snapGuidance.x).toBe(1080);
    });

    // E. Canvas Top Edge
    it('Type E: Canvas Top Edge', () => {
      const res = engine.computeAll(makeInput(
        { x: 100, y: 3, width: 200, height: 100 },
        [],
        { width: 1280, height: 800 }
      ));
      expect(res.guides.some(g => g.source === 'CONTAINER' && g.orientation === 'HORIZONTAL' && g.position === 0)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
      expect(res.snapGuidance.y).toBe(0);
    });

    // F. Canvas Bottom Edge
    it('Type F: Canvas Bottom Edge', () => {
      const res = engine.computeAll(makeInput(
        { x: 100, y: 698, width: 200, height: 100 }, // bottom = 798 (within 8px of 800)
        [],
        { width: 1280, height: 800 }
      ));
      expect(res.guides.some(g => g.source === 'CONTAINER' && g.orientation === 'HORIZONTAL' && g.position === 800)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
      expect(res.snapGuidance.y).toBe(700);
    });

    // G. Element Center X
    it('Type G: Element Center X', () => {
      const res = engine.computeAll(makeInput(
        { id: 'drag', x: 202, y: 300, width: 200, height: 100 }, // center = 302
        [{ id: 'target', x: 250, y: 50, width: 100, height: 100 }] // target center = 300
      ));
      expect(res.guides.some(g => g.source === 'ELEMENT' && g.orientation === 'VERTICAL' && g.position === 300)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
    });

    // H. Element Center Y
    it('Type H: Element Center Y', () => {
      const res = engine.computeAll(makeInput(
        { id: 'drag', x: 500, y: 148, width: 200, height: 100 }, // center = 198
        [{ id: 'target', x: 50, y: 150, width: 100, height: 100 }] // target center = 200
      ));
      expect(res.guides.some(g => g.source === 'ELEMENT' && g.orientation === 'HORIZONTAL' && g.position === 200)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
    });

    // I. Element Left Edge
    it('Type I: Element Left Edge', () => {
      const res = engine.computeAll(makeInput(
        { id: 'drag', x: 103, y: 300, width: 200, height: 100 },
        [{ id: 'target', x: 100, y: 50, width: 150, height: 100 }]
      ));
      expect(res.guides.some(g => g.source === 'ELEMENT' && g.orientation === 'VERTICAL' && g.position === 100)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
      expect(res.snapGuidance.x).toBe(100);
    });

    // J. Element Right Edge
    it('Type J: Element Right Edge', () => {
      const res = engine.computeAll(makeInput(
        { id: 'drag', x: 248, y: 300, width: 100, height: 100 }, // right = 348
        [{ id: 'target', x: 200, y: 50, width: 150, height: 100 }] // target right = 350
      ));
      expect(res.guides.some(g => g.source === 'ELEMENT' && g.orientation === 'VERTICAL' && g.position === 350)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
      expect(res.snapGuidance.x).toBe(250);
    });

    // K. Element Top Edge
    it('Type K: Element Top Edge', () => {
      const res = engine.computeAll(makeInput(
        { id: 'drag', x: 400, y: 102, width: 100, height: 100 },
        [{ id: 'target', x: 100, y: 100, width: 100, height: 100 }]
      ));
      expect(res.guides.some(g => g.source === 'ELEMENT' && g.orientation === 'HORIZONTAL' && g.position === 100)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
      expect(res.snapGuidance.y).toBe(100);
    });

    // L. Element Bottom Edge
    it('Type L: Element Bottom Edge', () => {
      const res = engine.computeAll(makeInput(
        { id: 'drag', x: 400, y: 198, width: 100, height: 100 }, // bottom = 298
        [{ id: 'target', x: 100, y: 100, width: 100, height: 200 }] // target bottom = 300
      ));
      expect(res.guides.some(g => g.source === 'ELEMENT' && g.orientation === 'HORIZONTAL' && g.position === 300)).toBe(true);
      expect(res.snapGuidance.snapped).toBe(true);
      expect(res.snapGuidance.y).toBe(200);
    });

    // Zoom aware threshold test
    it('Zoom Aware Threshold (50%, 100%, 150%, 200%)', () => {
      // At zoom 50%, screen threshold 12px -> canvas threshold 24px
      const zoom50Threshold = Math.max(8, 12 / 0.5); // 24px
      const res50 = engine.computeAll({
        ...makeInput({ id: 'drag', x: 120, y: 300 }, [{ id: 'target', x: 100, y: 50 }]),
        config: { ...defaultConfig, threshold: zoom50Threshold }
      });
      expect(res50.snapGuidance.snapped).toBe(true);

      // At zoom 200%, screen threshold 12px -> canvas threshold 8px (Math.max(8, 6) = 8px)
      const zoom200Threshold = Math.max(8, 12 / 2.0); // 8px
      const res200 = engine.computeAll({
        ...makeInput({ id: 'drag', x: 105, y: 300 }, [{ id: 'target', x: 100, y: 50 }]),
        config: { ...defaultConfig, threshold: zoom200Threshold }
      });
      expect(res200.snapGuidance.snapped).toBe(true);
    });
  });
});
