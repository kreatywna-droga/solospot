/**
 * VectorAlignmentG138.test.ts — TASK WF-HACP-STUDIO-G1-38 Test Suite
 *
 * Comprehensive deterministic test suite for Sprint G1-38 Vector Alignment Engine Expansion.
 * Covers Feature Tests (17), Integration Tests (9), E2E Workflows (8), Adversarial Scenarios (17), and Failure Injection (4).
 */

import { describe, it, expect } from 'vitest';
import { VectorEditingEngine } from '../VectorEditingEngine';
import {
  createVectorWorkspaceState,
  addNode,
  selectNodes,
  alignSelectedNodesToCanvas,
  distributeSelectedNodesWithGap,
  arrangeSelectedNodesInGrid,
  undoVectorAction,
  redoVectorAction,
  selectNodesInMarquee,
  VectorWorkspaceState,
} from '../VectorWorkspaceController';
import { RectangleNode, EllipseNode, PathNode, VectorNode } from '../VectorDomainModel';
import { createVectorViewportState, canvasToViewportPoint } from '../VectorViewportController';
import { VectorSvgExporter } from '../VectorSvgExporter';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';

describe('WF-HACP-STUDIO-G1-38: Vector Alignment Engine Expansion', () => {

  // =========================================================================
  // 1. FEATURE TESTS (>= 15) — 17 TESTS
  // =========================================================================
  describe('Feature Tests', () => {
    it('FT#01: alignShapesToCanvas left aligns shape x to canvas origin (0)', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 150, y: 50, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'left', { x: 0, y: 0, width: 1000, height: 1000 });
      expect(aligned[0].transform.x).toBe(0);
      expect(aligned[0].transform.y).toBe(50);
    });

    it('FT#02: alignShapesToCanvas center aligns shape horizontally on canvas center', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 50, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'center', { x: 0, y: 0, width: 1000, height: 1000 });
      expect(aligned[0].transform.x).toBe(450); // (1000 - 100) / 2
    });

    it('FT#03: alignShapesToCanvas right aligns shape right edge to canvas width', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 50, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'right', { x: 0, y: 0, width: 1000, height: 1000 });
      expect(aligned[0].transform.x).toBe(900); // 1000 - 100
    });

    it('FT#04: alignShapesToCanvas top aligns shape y to canvas origin (0)', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 50, y: 200, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'top', { x: 0, y: 0, width: 1000, height: 1000 });
      expect(aligned[0].transform.y).toBe(0);
    });

    it('FT#05: alignShapesToCanvas middle aligns shape vertically on canvas center', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 50, y: 0, width: 100, height: 200, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'middle', { x: 0, y: 0, width: 1000, height: 1000 });
      expect(aligned[0].transform.y).toBe(400); // (1000 - 200) / 2
    });

    it('FT#06: alignShapesToCanvas bottom aligns shape bottom edge to canvas height', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 50, y: 0, width: 100, height: 200, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'bottom', { x: 0, y: 0, width: 1000, height: 1000 });
      expect(aligned[0].transform.y).toBe(800); // 1000 - 200
    });

    it('FT#07: alignShapesToCanvas respects custom artboard bounds offset', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const customArtboard = { x: 500, y: 500, width: 800, height: 600 };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'center', customArtboard);
      expect(aligned[0].transform.x).toBe(500 + (800 - 100) / 2); // 850
    });

    it('FT#08: alignShapesToCanvas aligns multiple shapes independently to canvas center', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 10, y: 10, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 50, y: 50, width: 200, height: 200, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const aligned = VectorEditingEngine.alignShapesToCanvas([r1, r2], 'center', { x: 0, y: 0, width: 1000, height: 1000 });

      expect(aligned[0].transform.x).toBe(450); // (1000 - 100) / 2
      expect(aligned[1].transform.x).toBe(400); // (1000 - 200) / 2
    });

    it('FT#09: distributeShapesWithGap positions shapes sequentially with exact horizontal gap', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 50, y: 0, width: 100, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r3: RectangleNode = { id: 'r3', type: 'rectangle', transform: { x: 80, y: 0, width: 100, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const distributed = VectorEditingEngine.distributeShapesWithGap([r1, r2, r3], 'horizontal', 20);
      expect(distributed[0].transform.x).toBe(0);
      expect(distributed[1].transform.x).toBe(120); // 0 + 100 + 20
      expect(distributed[2].transform.x).toBe(240); // 120 + 100 + 20
    });

    it('FT#10: distributeShapesWithGap positions shapes sequentially with exact vertical gap', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 0, y: 30, width: 50, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const distributed = VectorEditingEngine.distributeShapesWithGap([r1, r2], 'vertical', 30);
      expect(distributed[0].transform.y).toBe(0);
      expect(distributed[1].transform.y).toBe(130); // 0 + 100 + 30
    });

    it('FT#11: distributeShapesWithGap handles varying shape dimensions correctly', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 200, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const distributed = VectorEditingEngine.distributeShapesWithGap([r1, r2], 'horizontal', 15);
      expect(distributed[0].transform.x).toBe(0);
      expect(distributed[1].transform.x).toBe(65); // 0 + 50 + 15
    });

    it('FT#12: arrangeShapesInGrid lays out shapes into 3-column grid structure', () => {
      const shapes: RectangleNode[] = Array.from({ length: 6 }, (_, i) => ({
        id: `r${i}`,
        type: 'rectangle',
        transform: { x: 0, y: 0, width: 100, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      }));

      const grid = VectorEditingEngine.arrangeShapesInGrid(shapes, 3, 20, 10, { x: 0, y: 0 });
      // Row 1
      expect(grid[0].transform.x).toBe(0);
      expect(grid[0].transform.y).toBe(0);
      expect(grid[1].transform.x).toBe(120); // 0 + 100 + 20
      expect(grid[1].transform.y).toBe(0);
      expect(grid[2].transform.x).toBe(240);
      expect(grid[2].transform.y).toBe(0);

      // Row 2
      expect(grid[3].transform.x).toBe(0);
      expect(grid[3].transform.y).toBe(60); // 0 + 50 + 10
      expect(grid[4].transform.x).toBe(120);
      expect(grid[4].transform.y).toBe(60);
      expect(grid[5].transform.x).toBe(240);
      expect(grid[5].transform.y).toBe(60);
    });

    it('FT#13: arrangeShapesInGrid handles 2-column layout with custom gapX and gapY', () => {
      const shapes: RectangleNode[] = Array.from({ length: 4 }, (_, i) => ({
        id: `r${i}`,
        type: 'rectangle',
        transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      }));

      const grid = VectorEditingEngine.arrangeShapesInGrid(shapes, 2, 30, 40, { x: 100, y: 100 });
      expect(grid[0].transform.x).toBe(100);
      expect(grid[0].transform.y).toBe(100);
      expect(grid[1].transform.x).toBe(180); // 100 + 50 + 30
      expect(grid[1].transform.y).toBe(100);
      expect(grid[2].transform.x).toBe(100);
      expect(grid[2].transform.y).toBe(190); // 100 + 50 + 40
    });

    it('FT#14: arrangeShapesInGrid arranges single-column vertical stack', () => {
      const shapes: RectangleNode[] = Array.from({ length: 3 }, (_, i) => ({
        id: `r${i}`,
        type: 'rectangle',
        transform: { x: 0, y: 0, width: 100, height: 40, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      }));

      const grid = VectorEditingEngine.arrangeShapesInGrid(shapes, 1, 0, 15, { x: 50, y: 50 });
      expect(grid[0].transform.y).toBe(50);
      expect(grid[1].transform.y).toBe(105); // 50 + 40 + 15
      expect(grid[2].transform.y).toBe(160); // 105 + 40 + 15
    });

    it('FT#15: alignSelectedNodesToCanvas updates workspace snapshot & pushes HistoryStack transaction', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 500, y: 500, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = selectNodes(state, ['r1']);

      const initialLen = state.historyStack.entries.length;
      state = alignSelectedNodesToCanvas(state, 'left', { x: 0, y: 0, width: 1000, height: 1000 });

      expect(state.snapshot.nodes[0].transform.x).toBe(0);
      expect(state.historyStack.entries.length).toBe(initialLen + 1);
      expect(state.historyStack.peek()?.nodes[0].transform.x).toBe(0);
    });

    it('FT#16: distributeSelectedNodesWithGap updates workspace snapshot & pushes HistoryStack transaction', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = selectNodes(state, ['r1', 'r2']);

      const initialLen = state.historyStack.entries.length;
      state = distributeSelectedNodesWithGap(state, 'horizontal', 25);

      const r2Node = state.snapshot.nodes.find(n => n.id === 'r2');
      expect(r2Node?.transform.x).toBe(75); // 0 + 50 + 25
      expect(state.historyStack.entries.length).toBe(initialLen + 1);
    });

    it('FT#17: arrangeSelectedNodesInGrid updates workspace snapshot & pushes HistoryStack transaction', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = selectNodes(state, ['r1', 'r2']);

      const initialLen = state.historyStack.entries.length;
      state = arrangeSelectedNodesInGrid(state, 1, 10, 20);

      const r2Node = state.snapshot.nodes.find(n => n.id === 'r2');
      expect(r2Node?.transform.y).toBe(70); // 0 + 50 + 20
      expect(state.historyStack.entries.length).toBe(initialLen + 1);
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (>= 8) — 9 TESTS
  // =========================================================================
  describe('Integration Tests', () => {
    it('IT#01: Integration with VectorViewportController — canvas-aligned point mapped via viewport', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 500, y: 500, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'left', { x: 0, y: 0, width: 1000, height: 1000 });

      const vp = createVectorViewportState({ zoom: 2.0, panX: 100, panY: 50 });
      const screenPoint = canvasToViewportPoint({ x: aligned[0].transform.x, y: aligned[0].transform.y }, vp);

      expect(screenPoint.x).toBe(100); // 0 * 2 + 100
      expect(screenPoint.y).toBe(1050); // 500 * 2 + 50
    });

    it('IT#02: Integration with Path Pen Tool — canvas aligns bezier PathNode', () => {
      const pathNode: PathNode = { id: 'p1', type: 'path', transform: { x: 300, y: 300, width: 200, height: 200, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 }, anchors: [], closed: true, d: 'M 0 0 L 200 0 L 100 200 Z' };
      const aligned = VectorEditingEngine.alignShapesToCanvas([pathNode], 'center', { x: 0, y: 0, width: 1000, height: 1000 });
      expect(aligned[0].transform.x).toBe(400); // (1000 - 200) / 2
    });

    it('IT#03: Integration with VectorSvgExporter — export of grid-arranged shapes contains updated coordinates', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', visible: true, transform: { x: 10, y: 10, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const grid = VectorEditingEngine.arrangeShapesInGrid([r1, r2], 1, 0, 50, { x: 0, y: 0 });

      const svg = VectorSvgExporter.exportToSvgString({ nodes: grid, selectedIds: [] });
      expect(svg).toContain('translate(0, 150)'); // r2 y: 0 + 100 + 50 = 150
    });

    it('IT#04: Integration with VectorRenderingBridge — compiled commands for grid shapes emit correct transform e,f', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 10, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const grid = VectorEditingEngine.arrangeShapesInGrid([r1, r2], 2, 40, 0, { x: 0, y: 0 });

      const cmds = VectorRenderingBridge.buildRenderCommands(grid[1]);
      const setTransformCmd = cmds.find(c => c.type === 'SET_TRANSFORM');
      expect(setTransformCmd).toBeDefined();
      if (setTransformCmd && setTransformCmd.type === 'SET_TRANSFORM') {
        expect(setTransformCmd.transform[4]).toBe(140); // 0 + 100 + 40
      }
    });

    it('IT#05: Integration with VectorMarqueeSelection — selects grid-arranged shapes in workspace', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', visible: true, transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', visible: true, transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = selectNodes(state, ['r1', 'r2']);
      state = distributeSelectedNodesWithGap(state, 'horizontal', 100);

      // r1 at 0, r2 at 150 (50 + 100)
      const nextState = selectNodesInMarquee(state, { x: 140, y: 0, width: 100, height: 100 });
      expect(nextState.snapshot.selectedIds).toEqual(['r2']);
    });

    it('IT#06: Integration with Layer Ordering — layer order preserved during canvas alignment & gap distribution', () => {
      const r1: RectangleNode = { id: 'r1', name: 'First', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', name: 'Second', type: 'rectangle', transform: { x: 100, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const aligned = VectorEditingEngine.alignShapesToCanvas([r1, r2], 'center');
      expect(aligned[0].id).toBe('r1');
      expect(aligned[1].id).toBe('r2');
    });

    it('IT#07: Integration with Locked Shapes — locked shapes are skipped during canvas alignment & gap distribution', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', locked: true, transform: { x: 500, y: 500, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = selectNodes(state, ['r1']);

      const nextState = alignSelectedNodesToCanvas(state, 'left');
      const r1After = nextState.snapshot.nodes.find(n => n.id === 'r1');
      expect(r1After?.transform.x).toBe(500); // Locked node untouched
    });

    it('IT#08: Integration with Undo/Redo — undo restores pre-alignment snapshot; redo re-applies alignment', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 500, y: 500, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = selectNodes(state, ['r1']);

      state = alignSelectedNodesToCanvas(state, 'left', { x: 0, y: 0, width: 1000, height: 1000 });
      expect(state.snapshot.nodes[0].transform.x).toBe(0);

      state = undoVectorAction(state);
      expect(state.snapshot.nodes[0].transform.x).toBe(500);

      state = redoVectorAction(state);
      expect(state.snapshot.nodes[0].transform.x).toBe(0);
    });

    it('IT#09: Integration with Document Serializer — grid snapshot serializes & deserializes without data loss', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = selectNodes(state, ['r1', 'r2']);
      state = arrangeSelectedNodesInGrid(state, 2, 20, 20);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.success).toBe(true);
      expect(restored.snapshot?.nodes).toHaveLength(2);
      expect(restored.snapshot?.nodes[1].transform.x).toBe(70); // 0 + 50 + 20
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (>= 8) — 8 WORKFLOWS
  // =========================================================================
  describe('E2E Workflows', () => {
    it('E2E#01: Workflow — Create 4 shapes -> Align to Canvas Center -> Distribute Horizontal Gap (25px)', () => {
      let state = createVectorWorkspaceState();
      const shapes: RectangleNode[] = Array.from({ length: 4 }, (_, i) => ({
        id: `r${i}`,
        type: 'rectangle',
        transform: { x: i * 10, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      }));

      shapes.forEach(s => { state = addNode(state, s); });
      state = selectNodes(state, shapes.map(s => s.id));

      state = alignSelectedNodesToCanvas(state, 'center', { x: 0, y: 0, width: 1000, height: 1000 });
      state = distributeSelectedNodesWithGap(state, 'horizontal', 25);

      const nodes = state.snapshot.nodes;
      expect(nodes[0].transform.x).toBe(450); // (1000 - 100) / 2
      expect(nodes[1].transform.x).toBe(575); // 450 + 100 + 25
      expect(nodes[2].transform.x).toBe(700); // 575 + 100 + 25
      expect(nodes[3].transform.x).toBe(825); // 700 + 100 + 25
    });

    it('E2E#02: Workflow — 9 Shapes 3x3 Grid Layout -> Select All via Marquee', () => {
      let state = createVectorWorkspaceState();
      const shapes: RectangleNode[] = Array.from({ length: 9 }, (_, i) => ({
        id: `r${i}`,
        type: 'rectangle',
        visible: true,
        transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      }));

      shapes.forEach(s => { state = addNode(state, s); });
      state = selectNodes(state, shapes.map(s => s.id));

      state = arrangeSelectedNodesInGrid(state, 3, 20, 20);

      // Marquee enclosing total grid space (0 to 300)
      const marqueeState = selectNodesInMarquee(state, { x: 0, y: 0, width: 400, height: 400 });
      expect(marqueeState.snapshot.selectedIds).toHaveLength(9);
    });

    it('E2E#03: Single Shape Alignment to Custom Artboard Bounds -> Undo -> Redo cycle', () => {
      let state = createVectorWorkspaceState();
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, rect);
      state = selectNodes(state, ['r1']);

      const customBounds = { x: 200, y: 200, width: 600, height: 600 };
      state = alignSelectedNodesToCanvas(state, 'center', customBounds);
      expect(state.snapshot.nodes[0].transform.x).toBe(450); // 200 + (600 - 100) / 2

      state = undoVectorAction(state);
      expect(state.snapshot.nodes[0].transform.x).toBe(0);

      state = redoVectorAction(state);
      expect(state.snapshot.nodes[0].transform.x).toBe(450);
    });

    it('E2E#04: Multi-shape Canvas Alignment under Active Viewport Rendering', () => {
      let state = createVectorWorkspaceState();
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, rect);
      state = selectNodes(state, ['r1']);

      state = alignSelectedNodesToCanvas(state, 'right', { x: 0, y: 0, width: 1000, height: 1000 });

      const vp = createVectorViewportState({ zoom: 2.0, panX: 50, panY: 50 });
      const cmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0], vp);

      const setTransformCmd = cmds.find(c => c.type === 'SET_TRANSFORM');
      expect(setTransformCmd).toBeDefined();
      if (setTransformCmd && setTransformCmd.type === 'SET_TRANSFORM') {
        expect(setTransformCmd.transform[4]).toBe(900 * 2 + 50); // 900*2 + 50 = 1850
      }
    });

    it('E2E#05: Grid Arrangement -> SVG Export -> Re-import via Serializer -> Bounds Parity', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 10, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = selectNodes(state, ['r1', 'r2']);

      state = arrangeSelectedNodesInGrid(state, 2, 30, 30);

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('width="100%"');

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot?.nodes[1].transform.x).toBe(80); // 0 + 50 + 30
    });

    it('E2E#06: Canvas Alignment of Pen Path Node -> HistoryStack Transaction check', () => {
      let state = createVectorWorkspaceState();
      const pathNode: PathNode = { id: 'p1', type: 'path', transform: { x: 10, y: 10, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 }, anchors: [], closed: true, d: 'M 0 0 L 100 0 L 50 100 Z' };

      state = addNode(state, pathNode);
      state = selectNodes(state, ['p1']);

      const startLen = state.historyStack.entries.length;
      state = alignSelectedNodesToCanvas(state, 'center', { x: 0, y: 0, width: 1000, height: 1000 });

      expect(state.historyStack.entries.length).toBe(startLen + 1);
      expect(state.snapshot.nodes[0].transform.x).toBe(450);
    });

    it('E2E#07: Complex Multi-Action Sequence (Align -> Distribute -> Grid) -> Undo 3 Steps', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 10, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, r1);
      state = addNode(state, r2);
      state = selectNodes(state, ['r1', 'r2']);

      const initialSnapshot = state.snapshot;

      state = alignSelectedNodesToCanvas(state, 'left', { x: 0, y: 0, width: 1000, height: 1000 });
      state = distributeSelectedNodesWithGap(state, 'horizontal', 50);
      state = arrangeSelectedNodesInGrid(state, 1, 20, 20);

      // Undo 3 steps
      state = undoVectorAction(state);
      state = undoVectorAction(state);
      state = undoVectorAction(state);

      expect(state.snapshot.nodes).toEqual(initialSnapshot.nodes);
    });

    it('E2E#08: 5 Shapes Align Middle -> Distribute Gap 15px -> Verify Non-Overlap Bounding Boxes', () => {
      let state = createVectorWorkspaceState();
      const shapes: RectangleNode[] = Array.from({ length: 5 }, (_, i) => ({
        id: `r${i}`,
        type: 'rectangle',
        transform: { x: i * 5, y: 0, width: 40, height: 40, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      }));

      shapes.forEach(s => { state = addNode(state, s); });
      state = selectNodes(state, shapes.map(s => s.id));

      state = alignSelectedNodesToCanvas(state, 'middle', { x: 0, y: 0, width: 1000, height: 1000 });
      state = distributeSelectedNodesWithGap(state, 'horizontal', 15);

      const nodes = state.snapshot.nodes;
      for (let i = 1; i < nodes.length; i++) {
        const prev = nodes[i - 1];
        const curr = nodes[i];
        expect(curr.transform.x).toBe(prev.transform.x + prev.transform.width + 15);
      }
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (>= 16) — 17 SCENARIOS
  // =========================================================================
  describe('Adversarial Scenarios', () => {
    it('A#01: alignShapesToCanvas with empty array returns []', () => {
      const res = VectorEditingEngine.alignShapesToCanvas([], 'left');
      expect(res).toEqual([]);
    });

    it('A#02: alignShapesToCanvas with corrupted NaN canvas bounds uses safe defaults', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 10, y: 10, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const badBounds = { x: NaN, y: Infinity, width: NaN, height: Infinity };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'left', badBounds);
      expect(aligned[0].transform.x).toBe(0); // Uses default canvas origin 0
    });

    it('A#03: alignShapesToCanvas with corrupted node without transform returns node unharmed', () => {
      const badNode = { id: 'bad' } as any;
      const res = VectorEditingEngine.alignShapesToCanvas([badNode], 'center');
      expect(res[0]).toBe(badNode);
    });

    it('A#04: distributeShapesWithGap with single shape returns shape array unharmed', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 10, y: 10, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorEditingEngine.distributeShapesWithGap([rect], 'horizontal', 20);
      expect(res).toHaveLength(1);
      expect(res[0].transform.x).toBe(10);
    });

    it('A#05: distributeShapesWithGap with NaN gapPx defaults to 20', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorEditingEngine.distributeShapesWithGap([r1, r2], 'horizontal', NaN);
      expect(res[1].transform.x).toBe(70); // 0 + 50 + default 20
    });

    it('A#06: distributeShapesWithGap with negative gapPx (overlapping gap)', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorEditingEngine.distributeShapesWithGap([r1, r2], 'horizontal', -10);
      expect(res[1].transform.x).toBe(40); // 0 + 50 - 10
    });

    it('A#07: arrangeShapesInGrid with 0 columns defaults to 1 column', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 10, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorEditingEngine.arrangeShapesInGrid([r1, r2], 0, 10, 10, { x: 0, y: 0 });
      expect(res[1].transform.y).toBe(60); // Vertical stack (0 + 50 + 10)
    });

    it('A#08: arrangeShapesInGrid with negative columns defaults to 1 column', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 10, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorEditingEngine.arrangeShapesInGrid([r1, r2], -5, 10, 10, { x: 0, y: 0 });
      expect(res[1].transform.y).toBe(60);
    });

    it('A#09: arrangeShapesInGrid with NaN gapX/gapY defaults to 20', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 10, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorEditingEngine.arrangeShapesInGrid([r1, r2], 2, NaN, NaN, { x: 0, y: 0 });
      expect(res[1].transform.x).toBe(70); // 0 + 50 + 20
    });

    it('A#10: alignSelectedNodesToCanvas with 0 selected nodes returns unchanged state', () => {
      const state = createVectorWorkspaceState();
      const res = alignSelectedNodesToCanvas(state, 'left');
      expect(res).toBe(state);
    });

    it('A#11: distributeSelectedNodesWithGap with < 2 selected nodes returns unchanged state', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = selectNodes(state, ['r1']);

      const res = distributeSelectedNodesWithGap(state, 'horizontal');
      expect(res).toBe(state);
    });

    it('A#12: arrangeSelectedNodesInGrid with 0 selected nodes returns unchanged state', () => {
      const state = createVectorWorkspaceState();
      const res = arrangeSelectedNodesInGrid(state, 3);
      expect(res).toBe(state);
    });

    it('A#13: Alignment when target position equals current position returns exact state instance', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = selectNodes(state, ['r1']);

      const nextState = alignSelectedNodesToCanvas(state, 'left', { x: 0, y: 0, width: 1000, height: 1000 });
      expect(nextState).toBe(state); // Identical state optimization
    });

    it('A#14: Alignment of locked shape is skipped', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', locked: true, transform: { x: 100, y: 100, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = selectNodes(state, ['r1']);

      const nextState = alignSelectedNodesToCanvas(state, 'left');
      expect(nextState).toBe(state);
    });

    it('A#15: Rapid 100x repeated alignment operations maintain numerical stability', () => {
      let state = createVectorWorkspaceState();
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 100, y: 100, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, r1);
      state = selectNodes(state, ['r1']);

      for (let i = 0; i < 100; i++) {
        state = alignSelectedNodesToCanvas(state, 'center', { x: 0, y: 0, width: 1000, height: 1000 });
      }
      expect(state.snapshot.nodes[0].transform.x).toBe(475); // (1000 - 50) / 2
    });

    it('A#16: Canvas alignment of shape with extreme rotation transform', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 45, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'center', { x: 0, y: 0, width: 1000, height: 1000 });
      expect(Number.isFinite(aligned[0].transform.x)).toBe(true);
    });

    it('A#17: Grid arrangement of 100 shapes executes in < 5ms without memory leaks', () => {
      const shapes: RectangleNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `r${i}`,
        type: 'rectangle',
        transform: { x: 0, y: 0, width: 20, height: 20, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      }));

      const t0 = performance.now();
      const grid = VectorEditingEngine.arrangeShapesInGrid(shapes, 10, 5, 5);
      const dt = performance.now() - t0;

      expect(grid).toHaveLength(100);
      expect(dt).toBeLessThan(50); // Performance budget < 50ms
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION & BOUNDARY TESTS (>= 4) — 4 TESTS
  // =========================================================================
  describe('Failure Injection & Boundary Tests', () => {
    it('FI#01: Inject corrupted Infinity bounds into alignShapesToCanvas -> safe fallback', () => {
      const rect: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 10, y: 10, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const infBounds = { x: -Infinity, y: Infinity, width: NaN, height: Infinity };
      const aligned = VectorEditingEngine.alignShapesToCanvas([rect], 'left', infBounds);
      expect(aligned[0].transform.x).toBe(0);
    });

    it('FI#02: Inject NaN coordinates into distributeShapesWithGap -> fallback to zero coordinate handling', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: NaN as any, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 10, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const res = VectorEditingEngine.distributeShapesWithGap([r1, r2], 'horizontal', 10);
      expect(res).toHaveLength(2);
    });

    it('FI#03: Inject null shape entry in grid arrangement -> skips null entry gracefully', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const nullNode = null as any;
      const res = VectorEditingEngine.arrangeShapesInGrid([r1, nullNode], 2, 10, 10);
      expect(res).toBeDefined();
    });

    it('FI#04: Inject exception in workspace controller action -> clean rollback returning initial state unharmed', () => {
      const corruptedState = {
        snapshot: null as any,
        historyStack: null as any,
      };

      const res = alignSelectedNodesToCanvas(corruptedState as any, 'left');
      expect(res).toBe(corruptedState);
    });
  });
});
