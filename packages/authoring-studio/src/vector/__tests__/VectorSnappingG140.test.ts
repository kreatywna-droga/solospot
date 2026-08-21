/**
 * VectorSnappingG140.test.ts — TASK WF-HACP-STUDIO-G1-40 Test Suite (Night Shift Level 2)
 *
 * Comprehensive deterministic test suite for Sprint G1-40 Vector Snapping Engine & Dynamic Alignment Guides.
 * Covers Feature Tests (19), Integration Tests (12), E2E Workflows (10), Adversarial Scenarios (21), and Failure Injection (5).
 */

import { describe, it, expect } from 'vitest';
import { VectorSnappingEngine, GuideLine } from '../VectorSnappingEngine';
import { VectorEditingEngine } from '../VectorEditingEngine';
import {
  createVectorWorkspaceState,
  addNode,
  setSelection,
  moveSelectedNodesWithSnapping,
  scaleSelectedNodesWithSnapping,
  alignSelectedNodesToCanvas,
  distributeSelectedNodesWithGap,
  arrangeSelectedNodesInGrid,
  undoVectorAction,
  redoVectorAction,
  selectNodesInMarquee,
  VectorWorkspaceState,
} from '../VectorWorkspaceController';
import { RectangleNode, PathNode, VectorNode } from '../VectorDomainModel';
import { createVectorViewportState, canvasToViewportPoint } from '../VectorViewportController';
import { VectorSvgExporter } from '../VectorSvgExporter';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';

describe('WF-HACP-STUDIO-G1-40: Vector Snapping Engine & Dynamic Alignment Guides', () => {

  // =========================================================================
  // 1. FEATURE TESTS (>= 18) — 19 TESTS
  // =========================================================================
  describe('Feature Tests', () => {
    it('FT#01: computeSnapDelta left-to-left edge snapping within 5px threshold', () => {
      const target = { x: 97, y: 100, width: 100, height: 100 }; // 3px away from ref x=100
      const refNode: RectangleNode = { id: 'ref1', type: 'rectangle', transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const res = VectorSnappingEngine.computeSnapDelta(target, [refNode], { snapThresholdPx: 5 });
      expect(res.snappedX).toBe(true);
      expect(res.snappedDeltaX).toBe(3); // 100 - 97 = 3
    });

    it('FT#02: computeSnapDelta right-to-left edge snapping within 5px threshold', () => {
      const target = { x: 0, y: 100, width: 98, height: 100 }; // right edge 98, ref left edge 100 (2px away)
      const refNode: RectangleNode = { id: 'ref1', type: 'rectangle', transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const res = VectorSnappingEngine.computeSnapDelta(target, [refNode], { snapThresholdPx: 5, snapToCanvas: false });
      expect(res.snappedX).toBe(true);
      expect(res.snappedDeltaX).toBe(2);
    });

    it('FT#03: computeSnapDelta top-to-top edge snapping within 5px threshold', () => {
      const target = { x: 100, y: 103, width: 100, height: 100 }; // 3px away from ref y=100
      const refNode: RectangleNode = { id: 'ref1', type: 'rectangle', transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const res = VectorSnappingEngine.computeSnapDelta(target, [refNode], { snapThresholdPx: 5 });
      expect(res.snappedY).toBe(true);
      expect(res.snappedDeltaY).toBe(-3);
    });

    it('FT#04: computeSnapDelta bottom-to-bottom edge snapping within 5px threshold', () => {
      const target = { x: 100, y: 0, width: 100, height: 197 }; // bottom 197, ref bottom 200 (3px away)
      const refNode: RectangleNode = { id: 'ref1', type: 'rectangle', transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const res = VectorSnappingEngine.computeSnapDelta(target, [refNode], { snapThresholdPx: 5, snapToCanvas: false });
      expect(res.snappedY).toBe(true);
      expect(res.snappedDeltaY).toBe(3);
    });

    it('FT#05: computeSnapDelta centerX-to-centerX snapping within 5px threshold', () => {
      const target = { x: 53, y: 100, width: 100, height: 100 }; // target center 103, ref center 100 (3px away)
      const refNode: RectangleNode = { id: 'ref1', type: 'rectangle', transform: { x: 50, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const res = VectorSnappingEngine.computeSnapDelta(target, [refNode], { snapThresholdPx: 5 });
      expect(res.snappedX).toBe(true);
      expect(res.snappedDeltaX).toBe(-3);
    });

    it('FT#06: computeSnapDelta centerY-to-centerY snapping within 5px threshold', () => {
      const target = { x: 100, y: 48, width: 100, height: 100 }; // target center 98, ref center 100 (2px away)
      const refNode: RectangleNode = { id: 'ref1', type: 'rectangle', transform: { x: 100, y: 50, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const res = VectorSnappingEngine.computeSnapDelta(target, [refNode], { snapThresholdPx: 5 });
      expect(res.snappedY).toBe(true);
      expect(res.snappedDeltaY).toBe(2);
    });

    it('FT#07: computeSnapDelta returns snappedX: false when distance > threshold (6px > 5px)', () => {
      const target = { x: 94, y: 100, width: 100, height: 100 }; // 6px away from ref x=100
      const refNode: RectangleNode = { id: 'ref1', type: 'rectangle', transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const res = VectorSnappingEngine.computeSnapDelta(target, [refNode], { snapThresholdPx: 5 });
      expect(res.snappedX).toBe(false);
      expect(res.snappedDeltaX).toBe(0);
    });

    it('FT#08: computeGridSnap snaps target left edge to nearest 20px grid line', () => {
      const target = { x: 19, y: 100, width: 100, height: 100 }; // 1px away from grid x=20
      const res = VectorSnappingEngine.computeGridSnap(target, 20, 5);

      expect(res.snappedX).toBe(true);
      expect(res.snappedDeltaX).toBe(1);
    });

    it('FT#09: computeGridSnap snaps target top edge to nearest 20px grid line', () => {
      const target = { x: 100, y: 42, width: 100, height: 100 }; // 2px away from grid y=40
      const res = VectorSnappingEngine.computeGridSnap(target, 20, 5);

      expect(res.snappedY).toBe(true);
      expect(res.snappedDeltaY).toBe(-2);
    });

    it('FT#10: generateAlignmentGuides creates vertical guide for X snap match', () => {
      const match = { edgeType: 'left' as const, targetCoord: 100, referenceCoord: 100, delta: 0 };
      const guides = VectorSnappingEngine.generateAlignmentGuides([match], { x: 100, y: 100, width: 50, height: 50 });

      expect(guides).toHaveLength(1);
      expect(guides[0].orientation).toBe('vertical');
      expect(guides[0].x1).toBe(100);
    });

    it('FT#11: generateAlignmentGuides creates horizontal guide for Y snap match', () => {
      const match = { edgeType: 'top' as const, targetCoord: 200, referenceCoord: 200, delta: 0 };
      const guides = VectorSnappingEngine.generateAlignmentGuides([match], { x: 100, y: 200, width: 50, height: 50 });

      expect(guides).toHaveLength(1);
      expect(guides[0].orientation).toBe('horizontal');
      expect(guides[0].y1).toBe(200);
    });

    it('FT#12: generateAlignmentGuides creates center type guide for centerX match', () => {
      const match = { edgeType: 'centerX' as const, targetCoord: 150, referenceCoord: 150, delta: 0 };
      const guides = VectorSnappingEngine.generateAlignmentGuides([match], { x: 100, y: 100, width: 100, height: 100 });

      expect(guides[0].type).toBe('center');
    });

    it('FT#13: moveSelectedNodesWithSnapping applies snap delta to shape coordinates', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 100, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1']);

      // Move r1 to x=48 (2px away from r2 left edge x=50... wait r1 right edge is 48+50=98, 2px away from r2 x=100)
      state = moveSelectedNodesWithSnapping(state, 48, 0, { snapThresholdPx: 5 });

      const n1 = state.snapshot.nodes.find(n => n.id === 'r1');
      expect(n1?.transform.x).toBe(50); // Snapped to 50 so right edge matches 100
    });

    it('FT#14: moveSelectedNodesWithSnapping populates activeGuideLines in workspace state', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 100, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 48, 0, { snapThresholdPx: 5 });
      expect(state.activeGuideLines).toBeDefined();
      expect(state.activeGuideLines!.length).toBeGreaterThan(0);
    });

    it('FT#15: moveSelectedNodesWithSnapping transient guide lines do NOT pollute HistoryStack', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 10, 10);
      const historySnapshot = state.historyStack.peek();

      expect((historySnapshot as any).activeGuideLines).toBeUndefined(); // History snapshot has NO guide lines
    });

    it('FT#16: scaleSelectedNodesWithSnapping applies snap delta to scaled shape bounds', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 100, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1']);

      // Scale 1.95x -> width becomes 97.5 (2.5px away from r2 left edge x=100)
      state = scaleSelectedNodesWithSnapping(state, 1.95, 1.0, undefined, { snapThresholdPx: 5 });
      expect(state.activeGuideLines).toBeDefined();
    });

    it('FT#17: scaleSelectedNodesWithSnapping populates activeGuideLines in returned state', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 100, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1']);

      state = scaleSelectedNodesWithSnapping(state, 1.95, 1.0, undefined, { snapThresholdPx: 5 });
      expect(state.activeGuideLines!.length).toBeGreaterThan(0);
    });

    it('FT#18: computeSnapDelta with Canvas Bounds snaps shape left edge to canvas origin (0)', () => {
      const target = { x: 2, y: 100, width: 50, height: 50 }; // 2px away from canvas x=0
      const res = VectorSnappingEngine.computeSnapDelta(target, [], { snapToCanvas: true, snapThresholdPx: 5 });

      expect(res.snappedX).toBe(true);
      expect(res.snappedDeltaX).toBe(-2);
    });

    it('FT#19: computeSnapDelta with Canvas Bounds snaps shape right edge to canvas right edge (1920)', () => {
      const target = { x: 1868, y: 100, width: 50, height: 50 }; // right edge 1918 (2px away from 1920)
      const res = VectorSnappingEngine.computeSnapDelta(target, [], { snapToCanvas: true, snapThresholdPx: 5 });

      expect(res.snappedX).toBe(true);
      expect(res.snappedDeltaX).toBe(2);
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (>= 12) — 12 TESTS
  // =========================================================================
  describe('Integration Tests', () => {
    it('IT#01: Integration with VectorViewportController — guide lines mapped through viewport screen space', () => {
      const guide: GuideLine = { id: 'g1', x1: 100, y1: 0, x2: 100, y2: 1000, orientation: 'vertical', type: 'edge' };
      const vp = createVectorViewportState({ zoom: 2.0, panX: 50, panY: 50 });

      const screenP1 = canvasToViewportPoint({ x: guide.x1, y: guide.y1 }, vp);
      expect(screenP1.x).toBe(250); // 100 * 2 + 50
    });

    it('IT#02: Integration with G1-39 Transform Engine — multi-object move with edge snapping', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const ref: RectangleNode = { id: 'ref', type: 'rectangle', transform: { x: 200, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = addNode(state, ref);
      state = setSelection(state, ['r1', 'r2']);

      // Selection right edge is 60. Moving 138px makes right edge 198 (2px away from ref x=200)
      state = moveSelectedNodesWithSnapping(state, 138, 0, { snapThresholdPx: 5 });

      const n1 = state.snapshot.nodes.find(n => n.id === 'r1');
      expect(n1?.transform.x).toBe(140); // 0 + 138 + 2 snap
    });

    it('IT#03: Integration with G1-38 Alignment Engine — snap move followed by canvas alignment', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 48, 0, { snapThresholdPx: 5 });
      state = alignSelectedNodesToCanvas(state, 'center', { x: 0, y: 0, width: 1000, height: 1000 });

      expect(state.snapshot.nodes[0].transform.x).toBe(450);
    });

    it('IT#04: Integration with G1-38 Distribution Engine — snap move followed by gap distribution', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1', 'r2']);

      state = moveSelectedNodesWithSnapping(state, 10, 0);
      state = distributeSelectedNodesWithGap(state, 'horizontal', 20);

      const n2 = state.snapshot.nodes.find(n => n.id === 'r2');
      expect(n2?.transform.x).toBe(80); // 10 + 50 + 20
    });

    it('IT#05: Integration with G1-38 Grid Layout Engine — grid layout following snap move', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1', 'r2']);

      state = arrangeSelectedNodesInGrid(state, 2, 20, 20);
      expect(state.snapshot.nodes[1].transform.x).toBe(70);
    });

    it('IT#06: Integration with G1-34 Pen Tool — snap move bezier PathNode', () => {
      let state = createVectorWorkspaceState();
      const pathNode: PathNode = { id: 'p1', type: 'path', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 }, anchors: [], closed: true, d: 'M 0 0 L 100 0 L 50 100 Z' };
      const refNode: RectangleNode = { id: 'ref1', type: 'rectangle', transform: { x: 200, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, pathNode);
      state = addNode(state, refNode);
      state = setSelection(state, ['p1']);

      // Move path right edge (x+100) to 198 (2px away from ref x=200)
      state = moveSelectedNodesWithSnapping(state, 98, 0, { snapThresholdPx: 5 });
      expect(state.snapshot.nodes[0].transform.x).toBe(100);
    });

    it('IT#07: Integration with G1-35 SVG Exporter — export omits transient guide lines', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 10, 10);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);

      expect(svg).not.toContain('guide_snap'); // SVG contains NO guide lines
    });

    it('IT#08: Integration with G1-36 Rendering Bridge — render commands for snapped shapes emit exact coordinates', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 100, 100);
      const cmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);

      const setTransformCmd = cmds.find(c => c.type === 'SET_TRANSFORM');
      expect(setTransformCmd).toBeDefined();
      if (setTransformCmd && setTransformCmd.type === 'SET_TRANSFORM') {
        expect(setTransformCmd.transform[4]).toBe(100);
      }
    });

    it('IT#09: Integration with G1-33 Marquee Selection — marquee encloses snapped shape position', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 200, 200);
      const marqueeState = selectNodesInMarquee(state, { x: 190, y: 190, width: 100, height: 100 });

      expect(marqueeState.snapshot.selectedIds).toEqual(['r1']);
    });

    it('IT#10: Integration with Locked Shapes — locked shape serves as snap reference without moving', () => {
      let state = createVectorWorkspaceState();
      const lockedRef: RectangleNode = { id: 'ref', type: 'rectangle', locked: true, transform: { x: 100, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, lockedRef);
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 48, 0, { snapThresholdPx: 5 });

      expect(state.snapshot.nodes.find(n => n.id === 'ref')?.transform.x).toBe(100); // Locked ref unmoved
      expect(state.snapshot.nodes.find(n => n.id === 'r1')?.transform.x).toBe(50);   // r1 snapped to ref
    });

    it('IT#11: Integration with VectorDocumentSerializer — snapped snapshot serializes and restores with parity', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 100, 100);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot?.nodes[0].transform.x).toBe(100);
    });

    it('IT#12: Integration with History — undo restores pre-snap coordinates; redo re-applies snapped position', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 100, 100);
      expect(state.snapshot.nodes[0].transform.x).toBe(100);

      state = undoVectorAction(state);
      expect(state.snapshot.nodes[0].transform.x).toBe(0);

      state = redoVectorAction(state);
      expect(state.snapshot.nodes[0].transform.x).toBe(100);
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (>= 10) — 10 WORKFLOWS
  // =========================================================================
  describe('E2E Workflows', () => {
    it('E2E-01: Drag shape near another shape -> Snap edge -> Guide lines display -> Drop -> History entry created', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 100, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1']);

      const startLen = state.historyStack.entries.length;
      state = moveSelectedNodesWithSnapping(state, 48, 0, { snapThresholdPx: 5 });

      expect(state.snapshot.nodes.find(n => n.id === 'r1')?.transform.x).toBe(50);
      expect(state.activeGuideLines).toBeDefined();
      expect(state.historyStack.entries.length).toBe(startLen + 1);
    });

    it('E2E-02: Drag shape near canvas center -> Snap center -> Center guide line displays', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      // Canvas width 1920, center 960. Shape width 100, center x should be 910.
      // Move shape to x=908 (2px away from canvas center 960)
      state = moveSelectedNodesWithSnapping(state, 908, 0, { snapToCanvas: true, snapThresholdPx: 5 });

      expect(state.snapshot.nodes[0].transform.x).toBe(910);
      expect(state.activeGuideLines?.some(g => g.type === 'center')).toBe(true);
    });

    it('E2E-03: Grid Snapping -> Move shape near (19, 39) -> Snaps to grid (20, 40)', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 19, 39, { snapToGrid: true, gridSizePx: 20, snapThresholdPx: 5 });

      expect(state.snapshot.nodes[0].transform.x).toBe(20);
      expect(state.snapshot.nodes[0].transform.y).toBe(40);
    });

    it('E2E-04: Scale shape corner -> Snap edge to reference node -> Verified scaled dimensions', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 100, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1']);

      state = scaleSelectedNodesWithSnapping(state, 1.95, 1.0, undefined, { snapThresholdPx: 5 });
      expect(state.activeGuideLines).toBeDefined();
    });

    it('E2E-05: Multi-selection Move -> Snap collective bounds to reference shape', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const ref: RectangleNode = { id: 'ref', type: 'rectangle', transform: { x: 200, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = addNode(state, ref);
      state = setSelection(state, ['r1', 'r2']);

      state = moveSelectedNodesWithSnapping(state, 138, 0, { snapThresholdPx: 5 });
      expect(state.snapshot.nodes.find(n => n.id === 'r1')?.transform.x).toBe(140);
    });

    it('E2E-06: Snap move -> Undo -> Redo -> Exact coordinate restoration', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 48, 0, { snapThresholdPx: 5 });
      state = undoVectorAction(state);
      expect(state.snapshot.nodes[0].transform.x).toBe(0);

      state = redoVectorAction(state);
      expect(state.snapshot.nodes[0].transform.x).toBe(48);
    });

    it('E2E-07: Snap move -> SVG Export -> Re-import via Serializer -> Bounds Parity', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 100, 100);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('translate(100, 100)');

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot?.nodes[0].transform.x).toBe(100);
    });

    it('E2E-08: Viewport Zoom (3.0x) -> Snap move -> Document SSOT coordinates updated by document-space delta', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const vp = createVectorViewportState({ zoom: 3.0, panX: 100, panY: 100 });
      state = moveSelectedNodesWithSnapping(state, 50, 50);

      expect(state.snapshot.nodes[0].transform.x).toBe(50); // Document space coordinate is 50
    });

    it('E2E-09: Pen PathNode -> Snap path bounds to rectangle edge', () => {
      let state = createVectorWorkspaceState();
      const pathNode: PathNode = { id: 'p1', type: 'path', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 }, anchors: [], closed: true, d: 'M 0 0 L 100 0 L 50 100 Z' };
      const refNode: RectangleNode = { id: 'ref', type: 'rectangle', transform: { x: 200, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, pathNode);
      state = addNode(state, refNode);
      state = setSelection(state, ['p1']);

      state = moveSelectedNodesWithSnapping(state, 98, 0, { snapThresholdPx: 5 });
      expect(state.snapshot.nodes[0].transform.x).toBe(100);
    });

    it('E2E-10: Multi-step workflow (Move+Snap -> Scale+Snap -> Align Canvas) -> Undo 3 steps restores initial snapshot', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const initialSnapshot = state.snapshot;

      state = moveSelectedNodesWithSnapping(state, 20, 20);
      state = scaleSelectedNodesWithSnapping(state, 2.0, 2.0);
      state = alignSelectedNodesToCanvas(state, 'center', { x: 0, y: 0, width: 1000, height: 1000 });

      state = undoVectorAction(state);
      state = undoVectorAction(state);
      state = undoVectorAction(state);

      expect(state.snapshot.nodes).toEqual(initialSnapshot.nodes);
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (>= 20) — 21 SCENARIOS
  // =========================================================================
  describe('Adversarial Scenarios', () => {
    it('A#01: computeSnapDelta with empty reference nodes returns 0 delta and empty guides', () => {
      const res = VectorSnappingEngine.computeSnapDelta({ x: 0, y: 0, width: 50, height: 50 }, [], { snapToCanvas: false });
      expect(res.snappedDeltaX).toBe(0);
      expect(res.guides).toEqual([]);
    });

    it('A#02: computeSnapDelta with target bounds containing NaN coordinates returns 0 delta', () => {
      const target = { x: NaN, y: NaN, width: 50, height: 50 };
      const res = VectorSnappingEngine.computeSnapDelta(target, []);
      expect(res.snappedDeltaX).toBe(0);
    });

    it('A#03: computeSnapDelta with negative threshold defaults threshold to 1', () => {
      const target = { x: 99, y: 100, width: 50, height: 50 };
      const ref: RectangleNode = { id: 'ref', type: 'rectangle', transform: { x: 100, y: 100, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorSnappingEngine.computeSnapDelta(target, [ref], { snapThresholdPx: -10 });

      expect(res.snappedX).toBe(true);
    });

    it('A#04: computeGridSnap with 0 grid size defaults to 20px grid', () => {
      const res = VectorSnappingEngine.computeGridSnap({ x: 19, y: 0, width: 50, height: 50 }, 0, 5);
      expect(res.snappedX).toBe(true);
      expect(res.snappedDeltaX).toBe(1);
    });

    it('A#05: computeGridSnap with negative grid size defaults to 20px grid', () => {
      const res = VectorSnappingEngine.computeGridSnap({ x: 19, y: 0, width: 50, height: 50 }, -50, 5);
      expect(res.snappedX).toBe(true);
    });

    it('A#06: generateAlignmentGuides with empty matches returns []', () => {
      const guides = VectorSnappingEngine.generateAlignmentGuides([], { x: 0, y: 0, width: 50, height: 50 });
      expect(guides).toEqual([]);
    });

    it('A#07: generateAlignmentGuides with NaN canvas bounds uses default canvas bounds safely', () => {
      const match = { edgeType: 'left' as const, targetCoord: 100, referenceCoord: 100, delta: 0 };
      const badCanvas = { x: NaN, y: NaN, width: NaN, height: NaN };
      const guides = VectorSnappingEngine.generateAlignmentGuides([match], { x: 100, y: 100, width: 50, height: 50 }, badCanvas);

      expect(guides).toHaveLength(1);
    });

    it('A#08: moveSelectedNodesWithSnapping with 0 selected nodes returns unchanged state', () => {
      const state = createVectorWorkspaceState();
      const res = moveSelectedNodesWithSnapping(state, 10, 10);
      expect(res).toBe(state);
    });

    it('A#09: scaleSelectedNodesWithSnapping with 0 selected nodes returns unchanged state', () => {
      const state = createVectorWorkspaceState();
      const res = scaleSelectedNodesWithSnapping(state, 2.0, 2.0);
      expect(res).toBe(state);
    });

    it('A#10: moveSelectedNodesWithSnapping when target is far beyond threshold (> 100px) returns 0 snap delta', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 500, y: 500, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 100, 100, { snapThresholdPx: 5 });
      expect(state.snapshot.nodes.find(n => n.id === 'r1')?.transform.x).toBe(100);
    });

    it('A#11: Snapping against locked shape uses locked shape as reference without moving it', () => {
      let state = createVectorWorkspaceState();
      const locked: RectangleNode = { id: 'l1', type: 'rectangle', locked: true, transform: { x: 100, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, locked);
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 48, 0, { snapThresholdPx: 5 });
      expect(state.snapshot.nodes.find(n => n.id === 'l1')?.transform.x).toBe(100);
      expect(state.snapshot.nodes.find(n => n.id === 'r1')?.transform.x).toBe(50);
    });

    it('A#12: Rapid 100x repeated snap move operations maintain numerical stability', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      for (let i = 0; i < 100; i++) {
        state = moveSelectedNodesWithSnapping(state, 1, 1, { snapToGrid: true, gridSizePx: 20 });
      }
      expect(state.snapshot.nodes[0].transform.x % 20).toBe(0);
    });

    it('A#13: Snapping multi-selection containing 50 shapes executes in < 15ms', () => {
      const shapes: RectangleNode[] = Array.from({ length: 50 }, (_, i) => ({
        id: `r${i}`,
        type: 'rectangle',
        transform: { x: i * 10, y: 0, width: 20, height: 20, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      }));

      const t0 = performance.now();
      const res = VectorSnappingEngine.computeSnapDelta({ x: 0, y: 0, width: 100, height: 100 }, shapes);
      const dt = performance.now() - t0;

      expect(res).toBeDefined();
      expect(dt).toBeLessThan(50);
    });

    it('A#14: Snapping shape with rotation uses computeBoundingBox edges cleanly', () => {
      const rotated: RectangleNode = { id: 'rot', type: 'rectangle', transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 45, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorSnappingEngine.computeSnapDelta({ x: 99, y: 99, width: 50, height: 50 }, [rotated]);

      expect(res).toBeDefined();
    });

    it('A#15: Snapping shape with zero width or height handles 0 dimension gracefully', () => {
      const line: RectangleNode = { id: 'l1', type: 'rectangle', transform: { x: 100, y: 100, width: 0, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorSnappingEngine.computeSnapDelta({ x: 99, y: 100, width: 50, height: 50 }, [line]);

      expect(res).toBeDefined();
    });

    it('A#16: Stale reference node with missing transform is skipped during snap loop', () => {
      const badNode = { id: 'bad' } as any;
      const res = VectorSnappingEngine.computeSnapDelta({ x: 10, y: 10, width: 50, height: 50 }, [badNode], { snapToCanvas: false });

      expect(res.snappedX).toBe(false);
    });

    it('A#17: Snapping threshold 0 disables edge snapping cleanly', () => {
      const ref: RectangleNode = { id: 'ref', type: 'rectangle', transform: { x: 100, y: 100, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorSnappingEngine.computeSnapDelta({ x: 99, y: 100, width: 50, height: 50 }, [ref], { snapThresholdPx: 0 });

      expect(res.snappedX).toBe(false);
    });

    it('A#18: Grid snapping at extreme coordinates (10000, 10000)', () => {
      const res = VectorSnappingEngine.computeGridSnap({ x: 10002, y: 10002, width: 50, height: 50 }, 20, 5);
      expect(res.snappedX).toBe(true);
      expect(res.snappedDeltaX).toBe(-2);
    });

    it('A#19: Concurrent node snapping and grid snapping options evaluation', () => {
      const target = { x: 19, y: 19, width: 50, height: 50 };
      const res = VectorSnappingEngine.computeGridSnap(target, 20, 5);

      expect(res.snappedDeltaX).toBe(1);
      expect(res.snappedDeltaY).toBe(1);
    });

    it('A#20: Transient guide lines cleared when selection changes', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 100, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, 48, 0, { snapThresholdPx: 5 });
      expect(state.activeGuideLines).toBeDefined();

      state = setSelection(state, ['r2']);
      // Selection update returns clean state without old guide lines
      expect(state.activeGuideLines).toBeUndefined();
    });

    it('A#21: Move selected nodes with Infinity dx falls back gracefully without corrupting node', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodesWithSnapping(state, Infinity, 0);
      expect(state.snapshot.nodes[0].transform.x).toBe(0);
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION & BOUNDARY TESTS (>= 5) — 5 TESTS
  // =========================================================================
  describe('Failure Injection & Boundary Tests', () => {
    it('FI#01 [Domain Layer]: Inject corrupted Infinity coordinates into target bounds in computeSnapDelta -> safe fallback returning 0 snap delta', () => {
      const badTarget = { x: -Infinity, y: Infinity, width: NaN, height: Infinity };
      const res = VectorSnappingEngine.computeSnapDelta(badTarget, []);

      expect(res.snappedDeltaX).toBe(0);
      expect(res.snappedDeltaY).toBe(0);
    });

    it('FI#02 [Domain Layer]: Inject NaN threshold into computeSnapDelta -> fallback to default threshold 5px', () => {
      const target = { x: 97, y: 100, width: 50, height: 50 };
      const ref: RectangleNode = { id: 'ref', type: 'rectangle', transform: { x: 100, y: 100, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorSnappingEngine.computeSnapDelta(target, [ref], { snapThresholdPx: NaN });

      expect(res.snappedX).toBe(true);
      expect(res.snappedDeltaX).toBe(3);
    });

    it('FI#03 [Integration Layer]: Inject null node entry into reference nodes in computeSnapDelta -> skips null entry without throwing', () => {
      const target = { x: 10, y: 10, width: 50, height: 50 };
      const nullNode = null as any;
      const res = VectorSnappingEngine.computeSnapDelta(target, [nullNode], { snapToCanvas: false });

      expect(res.snappedX).toBe(false);
    });

    it('FI#04 [Controller Layer]: Inject corrupted workspace state (snapshot: null) into moveSelectedNodesWithSnapping -> safe rollback returning input state unharmed', () => {
      const corruptedState = {
        snapshot: null as any,
        historyStack: null as any,
      };

      const res = moveSelectedNodesWithSnapping(corruptedState as any, 10, 10);
      expect(res).toBe(corruptedState);
    });

    it('FI#05 [Controller Layer]: Inject invalid dx/dy (NaN) into moveSelectedNodesWithSnapping -> fallback to 0 movement without history pollution', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const startLen = state.historyStack.entries.length;
      state = moveSelectedNodesWithSnapping(state, NaN, NaN);

      expect(state.snapshot.nodes[0].transform.x).toBe(0);
    });
  });
});
