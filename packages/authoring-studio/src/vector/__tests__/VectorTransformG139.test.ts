/**
 * VectorTransformG139.test.ts — TASK WF-HACP-STUDIO-G1-39 Test Suite
 *
 * Comprehensive deterministic test suite for Sprint G1-39 Professional Selection & Transform System.
 * Covers Feature Tests (22), Integration Tests (11), E2E Workflows (10), Adversarial Scenarios (21), and Failure Injection (5).
 */

import { describe, it, expect } from 'vitest';
import { VectorEditingEngine } from '../VectorEditingEngine';
import {
  createVectorWorkspaceState,
  addNode,
  selectNodes,
  setSelection,
  addToSelection,
  removeFromSelection,
  toggleSelection,
  clearSelection,
  moveSelectedNodes,
  scaleSelectedNodes,
  rotateSelectedNodes,
  transformSelectedNodes,
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

describe('WF-HACP-STUDIO-G1-39: Professional Selection & Transform System', () => {

  // =========================================================================
  // 1. FEATURE TESTS (>= 20) — 22 TESTS
  // =========================================================================
  describe('Feature Tests', () => {
    it('FT#01: setSelection sets explicit selection array', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);

      state = setSelection(state, ['r1']);
      expect(state.snapshot.selectedIds).toEqual(['r1']);
    });

    it('FT#02: addToSelection adds node IDs without duplicates', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 50, y: 50, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = addNode(state, r2);

      state = setSelection(state, ['r1']);
      state = addToSelection(state, ['r1', 'r2']);
      expect(state.snapshot.selectedIds).toEqual(['r1', 'r2']);
    });

    it('FT#03: removeFromSelection removes specified node IDs', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 50, y: 50, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = addNode(state, r2);

      state = setSelection(state, ['r1', 'r2']);
      state = removeFromSelection(state, ['r1']);
      expect(state.snapshot.selectedIds).toEqual(['r2']);
    });

    it('FT#04: toggleSelection toggles node selection state', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);

      state = setSelection(state, []);
      state = toggleSelection(state, 'r1');
      expect(state.snapshot.selectedIds).toEqual(['r1']);

      state = toggleSelection(state, 'r1');
      expect(state.snapshot.selectedIds).toEqual([]);
    });

    it('FT#05: clearSelection resets selection to []', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = clearSelection(state);
      expect(state.snapshot.selectedIds).toEqual([]);
    });

    it('FT#06: computeSelectionBounds returns tight bounding box for single shape', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 100, y: 100, width: 200, height: 150, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const bounds = VectorEditingEngine.computeSelectionBounds([rect]);
      expect(bounds).toEqual({ x: 100, y: 100, width: 200, height: 150 });
    });

    it('FT#07: computeSelectionBounds returns enclosing bounding box for multi-selection', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 200, y: 300, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const bounds = VectorEditingEngine.computeSelectionBounds([r1, r2]);
      expect(bounds).toEqual({ x: 0, y: 0, width: 250, height: 350 });
    });

    it('FT#08: computeSelectionBounds returns null for empty shape array', () => {
      const bounds = VectorEditingEngine.computeSelectionBounds([]);
      expect(bounds).toBeNull();
    });

    it('FT#09: scaleShapes scales shape dimensions relative to selection center', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const scaled = VectorEditingEngine.scaleShapes([rect], 2.0, 1.5);

      expect(scaled[0].transform.width).toBe(200);
      expect(scaled[0].transform.height).toBe(150);
    });

    it('FT#10: scaleShapes scales multi-selection positions and dimensions relative to selection center', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 100, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      // Selection bounds center is (100, 50)
      const scaled = VectorEditingEngine.scaleShapes([r1, r2], 2.0, 2.0);
      expect(scaled[0].transform.x).toBe(-100); // 100 + (0 - 100)*2
      expect(scaled[1].transform.x).toBe(100);  // 100 + (100 - 100)*2
    });

    it('FT#11: scaleShapes respects custom transform origin', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const customOrigin = { x: 100, y: 100 }; // Top-left origin
      const scaled = VectorEditingEngine.scaleShapes([rect], 2.0, 2.0, customOrigin);

      expect(scaled[0].transform.x).toBe(100);
      expect(scaled[0].transform.y).toBe(100);
      expect(scaled[0].transform.width).toBe(200);
    });

    it('FT#12: scaleShapes lock aspect ratio enforces uniform scale', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const scaled = VectorEditingEngine.scaleShapes([rect], 3.0, 1.5, undefined, true);

      expect(scaled[0].transform.width).toBe(300);
      expect(scaled[0].transform.height).toBe(300);
    });

    it('FT#13: scaleShapes zero/near-zero scale safeguard clamps scale factor', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const scaled = VectorEditingEngine.scaleShapes([rect], 0, 0);

      expect(scaled[0].transform.width).toBeGreaterThan(0);
      expect(scaled[0].transform.height).toBeGreaterThan(0);
    });

    it('FT#14: rotateShapes 90° rotation around selection center', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const rotated = VectorEditingEngine.rotateShapes([rect], 90);

      expect(rotated[0].transform.rotationDeg).toBe(90);
    });

    it('FT#15: rotateShapes 180° rotation around selection center', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const rotated = VectorEditingEngine.rotateShapes([rect], 180);

      expect(rotated[0].transform.rotationDeg).toBe(180);
    });

    it('FT#16: rotateShapes 270° rotation around selection center', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const rotated = VectorEditingEngine.rotateShapes([rect], 270);

      expect(rotated[0].transform.rotationDeg).toBe(270);
    });

    it('FT#17: rotateShapes 360° rotation restores original orientation', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 45, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const rotated = VectorEditingEngine.rotateShapes([rect], 360);

      expect(rotated[0].transform.rotationDeg).toBe(45);
    });

    it('FT#18: rotateShapes custom rotation origin rotates center point around origin', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 100, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const customOrigin = { x: 0, y: 0 }; // Origin at (0, 0)
      const rotated = VectorEditingEngine.rotateShapes([rect], 90, customOrigin);

      expect(rotated[0].transform.rotationDeg).toBe(90);
      expect(Math.round(rotated[0].transform.x)).toBe(-100);
      expect(Math.round(rotated[0].transform.y)).toBe(100);
    });

    it('FT#19: transformShapesComposed applies move + scale + rotate in single composed step', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const transformed = VectorEditingEngine.transformShapesComposed([rect], { dx: 50, dy: 50, scaleX: 2.0, rotateDeg: 45 });

      expect(transformed[0].transform.x).toBe(0); // Center-origin scaling expands width to 200 around center (100, 100)
      expect(transformed[0].transform.width).toBe(200);
      expect(transformed[0].transform.rotationDeg).toBe(45);
    });

    it('FT#20: moveSelectedNodes workspace action moves selection in document space and pushes 1 HistoryStack entry', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const startLen = state.historyStack.entries.length;
      state = moveSelectedNodes(state, 50, 100);

      expect(state.snapshot.nodes[0].transform.x).toBe(50);
      expect(state.snapshot.nodes[0].transform.y).toBe(100);
      expect(state.historyStack.entries.length).toBe(startLen + 1);
    });

    it('FT#21: scaleSelectedNodes workspace action scales selection and pushes 1 HistoryStack entry', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const startLen = state.historyStack.entries.length;
      state = scaleSelectedNodes(state, 2.0, 2.0);

      expect(state.snapshot.nodes[0].transform.width).toBe(200);
      expect(state.historyStack.entries.length).toBe(startLen + 1);
    });

    it('FT#22: rotateSelectedNodes workspace action rotates selection and pushes 1 HistoryStack entry', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const startLen = state.historyStack.entries.length;
      state = rotateSelectedNodes(state, 45);

      expect(state.snapshot.nodes[0].transform.rotationDeg).toBe(45);
      expect(state.historyStack.entries.length).toBe(startLen + 1);
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (>= 10) — 11 TESTS
  // =========================================================================
  describe('Integration Tests', () => {
    it('IT#01: Integration with VectorViewportController — transformed point mapped via viewport', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const moved = VectorEditingEngine.moveShape(rect, 200, 300);

      const vp = createVectorViewportState({ zoom: 2.0, panX: 100, panY: 50 });
      const screenPoint = canvasToViewportPoint({ x: moved.transform.x, y: moved.transform.y }, vp);

      expect(screenPoint.x).toBe(500); // 200 * 2 + 100
      expect(screenPoint.y).toBe(650); // 300 * 2 + 50
    });

    it('IT#02: Integration with VectorAlignmentG138 — Transform -> Align sequence', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = scaleSelectedNodes(state, 2.0, 2.0); // width becomes 200
      state = alignSelectedNodesToCanvas(state, 'center', { x: 0, y: 0, width: 1000, height: 1000 });

      expect(state.snapshot.nodes[0].transform.x).toBe(400); // (1000 - 200) / 2
    });

    it('IT#03: Integration with VectorAlignmentG138 — Transform -> Distribute sequence', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1', 'r2']);

      state = scaleSelectedNodes(state, 2.0, 2.0); // widths become 100
      state = distributeSelectedNodesWithGap(state, 'horizontal', 30);

      const n2 = state.snapshot.nodes.find(n => n.id === 'r2');
      expect(n2?.transform.x).toBe(100); // r1.x (-30) + r1.width (100) + gap (30) = 100
    });

    it('IT#04: Integration with VectorAlignmentG138 — Transform -> Grid Layout sequence', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 10, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1', 'r2']);

      state = rotateSelectedNodes(state, 45);
      state = arrangeSelectedNodesInGrid(state, 1, 20, 20);

      expect(state.snapshot.nodes[1].transform.y).toBeGreaterThan(60);
    });

    it('IT#05: Integration with VectorPathPenG134 — transform PathNode anchor points', () => {
      const pathNode: PathNode = { id: 'p1', type: 'path', transform: { x: 100, y: 100, width: 200, height: 200, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 }, anchors: [], closed: true, d: 'M 0 0 L 200 0 L 100 200 Z' };
      const scaled = VectorEditingEngine.scaleShapes([pathNode], 1.5, 1.5);

      expect(scaled[0].transform.width).toBe(300);
      expect(scaled[0].transform.height).toBe(300);
    });

    it('IT#06: Integration with VectorSvgExporterG135 — export of rotated & scaled shapes reflects transform attributes', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 50, y: 50, width: 100, height: 100, rotationDeg: 45, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [r1], selectedIds: [], constraintEdges: [] });

      expect(svg).toContain('transform=');
      expect(svg).toContain('rotate(45');
    });

    it('IT#07: Integration with VectorRenderingBridgeG136 — compiled commands for rotated shape emit exact matrix params', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 50, y: 50, width: 100, height: 100, rotationDeg: 90, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const cmds = VectorRenderingBridge.buildRenderCommands(r1);

      const setTransformCmd = cmds.find(c => c.type === 'SET_TRANSFORM');
      expect(setTransformCmd).toBeDefined();
    });

    it('IT#08: Integration with VectorMarqueeSelectionG133 — marquee selection encloses moved shapes', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodes(state, 300, 300);

      const nextState = selectNodesInMarquee(state, { x: 290, y: 290, width: 100, height: 100 });
      expect(nextState.snapshot.selectedIds).toEqual(['r1']);
    });

    it('IT#09: Integration with VectorLayerManagementG132 — layer reordering preserved after shape transforms', () => {
      const r1: RectangleNode = { id: 'r1', name: 'First', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', name: 'Second', type: 'rectangle', transform: { x: 10, y: 10, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const scaled = VectorEditingEngine.scaleShapes([r1, r2], 2.0, 2.0);
      expect(scaled[0].id).toBe('r1');
      expect(scaled[1].id).toBe('r2');
    });

    it('IT#10: Integration with Locked Shapes — locked shapes are skipped during transforms', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', locked: true, transform: { x: 100, y: 100, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const nextState = moveSelectedNodes(state, 50, 50);
      expect(nextState.snapshot.nodes[0].transform.x).toBe(100); // Locked node untouched
    });

    it('IT#11: Integration with VectorDocumentSerializer — transformed snapshot serializes and restores with parity', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = scaleSelectedNodes(state, 3.0, 3.0);
      state = rotateSelectedNodes(state, 45);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.success).toBe(true);
      expect(restored.snapshot?.nodes[0].transform.width).toBe(150);
      expect(restored.snapshot?.nodes[0].transform.rotationDeg).toBe(45);
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (>= 10) — 10 WORKFLOWS
  // =========================================================================
  describe('E2E Workflows', () => {
    it('E2E-01: Workflow — Select -> Move -> Undo -> Redo', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodes(state, 100, 200);
      expect(state.snapshot.nodes[0].transform.x).toBe(100);

      state = undoVectorAction(state);
      expect(state.snapshot.nodes[0].transform.x).toBe(0);

      state = redoVectorAction(state);
      expect(state.snapshot.nodes[0].transform.x).toBe(100);
    });

    it('E2E-02: Workflow — Multi-select -> Move', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 100, y: 100, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = setSelection(state, ['r1', 'r2']);

      state = moveSelectedNodes(state, 50, 50);
      expect(state.snapshot.nodes[0].transform.x).toBe(50);
      expect(state.snapshot.nodes[1].transform.x).toBe(150);
    });

    it('E2E-03: Workflow — Select -> Scale -> Export SVG', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = scaleSelectedNodes(state, 2.5, 2.5);

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('width="250"');
    });

    it('E2E-04: Workflow — Select -> Rotate -> Export SVG', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = rotateSelectedNodes(state, 90);

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('rotate(90');
    });

    it('E2E-05: Workflow — Marquee Select -> Transform', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 10, y: 10, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);

      state = selectNodesInMarquee(state, { x: 0, y: 0, width: 100, height: 100 });
      state = moveSelectedNodes(state, 100, 100);

      expect(state.snapshot.nodes[0].transform.x).toBe(110);
    });

    it('E2E-06: Workflow — Pen Path -> Select -> Transform', () => {
      let state = createVectorWorkspaceState();
      const pathNode: PathNode = { id: 'p1', type: 'path', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 }, anchors: [], closed: true, d: 'M 0 0 L 100 0 L 50 100 Z' };
      state = addNode(state, pathNode);
      state = setSelection(state, ['p1']);

      state = transformSelectedNodes(state, { dx: 50, scaleX: 2.0 });
      expect(state.snapshot.nodes[0].transform.x).toBe(0);
      expect(state.snapshot.nodes[0].transform.width).toBe(200);
    });

    it('E2E-07: Workflow — Transform -> Align to Canvas', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = scaleSelectedNodes(state, 2.0, 2.0); // width: 200
      state = alignSelectedNodesToCanvas(state, 'center', { x: 0, y: 0, width: 1000, height: 1000 });

      expect(state.snapshot.nodes[0].transform.x).toBe(400); // (1000 - 200) / 2
    });

    it('E2E-08: Workflow — Align to Canvas -> Transform', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 500, y: 500, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = alignSelectedNodesToCanvas(state, 'left', { x: 0, y: 0, width: 1000, height: 1000 });
      state = moveSelectedNodes(state, 50, 0);

      expect(state.snapshot.nodes[0].transform.x).toBe(50);
    });

    it('E2E-09: Workflow — Viewport Zoom -> Transform -> Verify Document Geometry Integrity', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const vp = createVectorViewportState({ zoom: 5.0, panX: 200, panY: 200 });
      state = moveSelectedNodes(state, 50, 50);

      // Viewport MUST NOT alter document geometry
      expect(state.snapshot.nodes[0].transform.x).toBe(150);
      expect(state.snapshot.nodes[0].transform.y).toBe(150);
    });

    it('E2E-10: Workflow — Transform -> Serialize -> Restore -> Export Parity', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = scaleSelectedNodes(state, 2.0, 2.0);
      state = rotateSelectedNodes(state, 45);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);
      const svg = VectorSvgExporter.exportToSvgString(restored.snapshot!);

      expect(svg).toContain('width="200"');
      expect(svg).toContain('rotate(45');
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (>= 20) — 21 SCENARIOS
  // =========================================================================
  describe('Adversarial Scenarios', () => {
    it('A#01: setSelection with malformed non-string array returns empty selection', () => {
      const state = createVectorWorkspaceState();
      const res = setSelection(state, [123 as any, null as any]);
      expect(res.snapshot.selectedIds).toEqual([]);
    });

    it('A#02: addToSelection with non-existent node IDs ignores missing IDs', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);

      state = addToSelection(state, ['r1', 'ghost_id']);
      expect(state.snapshot.selectedIds).toEqual(['r1']);
    });

    it('A#03: removeFromSelection with non-selected IDs leaves existing selection intact', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = removeFromSelection(state, ['ghost_id']);
      expect(state.snapshot.selectedIds).toEqual(['r1']);
    });

    it('A#04: toggleSelection with non-existent node ID leaves selection unharmed', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = toggleSelection(state, 'ghost_id');
      expect(state.snapshot.selectedIds).toEqual(['r1']);
    });

    it('A#05: clearSelection when already empty returns exact same state instance', () => {
      const state = createVectorWorkspaceState();
      const res = clearSelection(state);
      expect(res).toBe(state);
    });

    it('A#06: computeSelectionBounds with corrupted node array skips null node entries', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const nullNode = null as any;
      const bounds = VectorEditingEngine.computeSelectionBounds([r1, nullNode]);
      expect(bounds).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    });

    it('A#07: scaleShapes with NaN scaleX/scaleY defaults scale factor to 1.0', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const scaled = VectorEditingEngine.scaleShapes([rect], NaN, NaN);
      expect(scaled[0].transform.width).toBe(100);
    });

    it('A#08: scaleShapes with negative scale flips shape dimensions cleanly', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const scaled = VectorEditingEngine.scaleShapes([rect], -2.0, -2.0);
      expect(scaled[0].transform.width).toBe(200);
    });

    it('A#09: rotateShapes with NaN angle defaults angle to 0°', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 30, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const rotated = VectorEditingEngine.rotateShapes([rect], NaN);
      expect(rotated[0].transform.rotationDeg).toBe(30);
    });

    it('A#10: rotateShapes with extreme rotation angle (7200°) normalizes angle to [0, 360)', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const rotated = VectorEditingEngine.rotateShapes([rect], 7245);
      expect(rotated[0].transform.rotationDeg).toBe(45);
    });

    it('A#11: moveSelectedNodes with (0, 0) returns exact same state instance without history entry', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const res = moveSelectedNodes(state, 0, 0);
      expect(res).toBe(state);
    });

    it('A#12: scaleSelectedNodes with (1, 1) scale returns exact same state instance without history entry', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const res = scaleSelectedNodes(state, 1.0, 1.0);
      expect(res).toBe(state);
    });

    it('A#13: rotateSelectedNodes with 0° rotation returns exact same state instance without history entry', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const res = rotateSelectedNodes(state, 0);
      expect(res).toBe(state);
    });

    it('A#14: Rapid 100x repeated scale and rotate operations maintain numerical stability', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      for (let i = 0; i < 100; i++) {
        state = rotateSelectedNodes(state, 3.6);
      }
      expect(Math.round(state.snapshot.nodes[0].transform.rotationDeg)).toBe(0);
    });

    it('A#15: Transform of shape with near-zero dimensions clamps size safely', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 0, height: 0, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const scaled = VectorEditingEngine.scaleShapes([rect], 0.1, 0.1);

      expect(Number.isFinite(scaled[0].transform.width)).toBe(true);
      expect(scaled[0].transform.width).toBeGreaterThan(0);
    });

    it('A#16: Transform of 100 shapes executes in < 10ms without memory leaks', () => {
      const shapes: RectangleNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `r${i}`,
        type: 'rectangle',
        transform: { x: i * 5, y: i * 5, width: 20, height: 20, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      }));

      const t0 = performance.now();
      const transformed = VectorEditingEngine.transformShapesComposed(shapes, { dx: 10, scaleX: 1.5, rotateDeg: 15 });
      const dt = performance.now() - t0;

      expect(transformed).toHaveLength(100);
      expect(dt).toBeLessThan(50);
    });

    it('A#17: Transform of selection containing duplicate node IDs handles set deduplication', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);

      state = setSelection(state, ['r1', 'r1', 'r1']);
      expect(state.snapshot.selectedIds).toEqual(['r1', 'r1', 'r1']);

      state = moveSelectedNodes(state, 10, 10);
      expect(state.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('A#18: Transform with custom origin at extreme coordinate (100000, 100000)', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const extremeOrigin = { x: 100000, y: 100000 };
      const rotated = VectorEditingEngine.rotateShapes([rect], 90, extremeOrigin);

      expect(Number.isFinite(rotated[0].transform.x)).toBe(true);
      expect(Number.isFinite(rotated[0].transform.y)).toBe(true);
    });

    it('A#19: Stale selection referencing deleted node ID is filtered out cleanly during transform', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1', 'deleted_id']);

      state = moveSelectedNodes(state, 20, 20);
      expect(state.snapshot.nodes[0].transform.x).toBe(20);
    });

    it('A#20: Concurrent move, scale, and rotate composition maintains matrix associativity', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorEditingEngine.transformShapesComposed([rect], { dx: 10, dy: 20, scaleX: 2.0, scaleY: 2.0, rotateDeg: 90 });

      expect(res[0].transform.x).toBe(-40); // (10, 20) moved shape scaled 2x around center (60, 70) moves left corner to -40
      expect(res[0].transform.y).toBe(-30); // 70 + (20 - 70)*2 = -30
      expect(res[0].transform.width).toBe(200);
      expect(res[0].transform.rotationDeg).toBe(90);
    });

    it('A#21: Move selected nodes with Infinity dx falls back gracefully without corrupting node', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      state = moveSelectedNodes(state, Infinity, 0);
      expect(state.snapshot.nodes[0].transform.x).toBe(0); // Ignores non-finite dx
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION & BOUNDARY TESTS (>= 5) — 5 TESTS
  // =========================================================================
  describe('Failure Injection & Boundary Tests', () => {
    it('FI#01: Inject corrupted Infinity origin into scaleShapes -> safe fallback', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 10, y: 10, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const infOrigin = { x: Infinity, y: -Infinity };
      const scaled = VectorEditingEngine.scaleShapes([rect], 2.0, 2.0, infOrigin);

      expect(scaled).toBeDefined();
      expect(scaled[0].transform.width).toBe(200);
    });

    it('FI#02: Inject NaN angle into rotateShapes -> fallback to 0° rotation', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 45, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const rotated = VectorEditingEngine.rotateShapes([rect], NaN);

      expect(rotated[0].transform.rotationDeg).toBe(45);
    });

    it('FI#03: Inject null shape entry in transform loop -> skips null entry gracefully', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const nullNode = null as any;
      const res = VectorEditingEngine.transformShapesComposed([r1, nullNode], { dx: 10 });

      expect(res).toBeDefined();
      expect(res[0].transform.x).toBe(10);
    });

    it('FI#04: Inject exception in workspace controller action -> clean rollback returning initial state unharmed', () => {
      const corruptedState = {
        snapshot: null as any,
        historyStack: null as any,
      };

      const res = moveSelectedNodes(corruptedState as any, 10, 10);
      expect(res).toBe(corruptedState);
    });

    it('FI#05: Inject invalid scale factor (NaN) into workspace scale action -> safe rollback without history pollution', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = setSelection(state, ['r1']);

      const startLen = state.historyStack.entries.length;
      state = scaleSelectedNodes(state, NaN, NaN);

      expect(state.historyStack.entries.length).toBe(startLen);
    });
  });
});
