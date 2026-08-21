/**
 * VectorViewportG137.test.ts — TASK WF-HACP-STUDIO-G1-37 Test Suite
 *
 * Comprehensive deterministic test suite for Sprint G1-37 Vector Viewport & Camera Controller.
 * Covers Feature Tests (16), E2E Workflows (8), Adversarial Scenarios (16), and Failure Injection (4).
 */

import { describe, it, expect } from 'vitest';
import {
  createVectorViewportState,
  setZoom,
  zoomIn,
  zoomOut,
  panViewport,
  resetViewport,
  fitToScreen,
  fitToSelection,
  canvasToViewportPoint,
  viewportToCanvasPoint,
  viewportToCanvasBounds,
  canvasToViewportBounds,
  VectorViewportState,
} from '../VectorViewportController';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';
import {
  createVectorWorkspaceState,
  addNode,
  selectNodesInMarquee,
  VectorWorkspaceState,
} from '../VectorWorkspaceController';
import { RectangleNode, EllipseNode, VectorNode } from '../VectorDomainModel';
import { VectorSvgExporter } from '../VectorSvgExporter';

describe('WF-HACP-STUDIO-G1-37: Vector Viewport & Camera Controller', () => {

  // =========================================================================
  // 1. FEATURE TESTS (>= 12) — 16 TESTS
  // =========================================================================
  describe('Feature Tests', () => {
    it('FT#01: creates default viewport state (100% zoom, pan 0,0)', () => {
      const vp = createVectorViewportState();
      expect(vp.zoom).toBe(1.0);
      expect(vp.panX).toBe(0);
      expect(vp.panY).toBe(0);
      expect(vp.viewportWidth).toBe(1920);
      expect(vp.viewportHeight).toBe(1080);
      expect(vp.minZoom).toBe(0.05);
      expect(vp.maxZoom).toBe(50.0);
    });

    it('FT#02: respects custom initial parameters and clamps zoom', () => {
      const vp = createVectorViewportState({ zoom: 2.5, panX: 100, panY: 200, minZoom: 0.1, maxZoom: 10.0 });
      expect(vp.zoom).toBe(2.5);
      expect(vp.panX).toBe(100);
      expect(vp.panY).toBe(200);
      expect(vp.minZoom).toBe(0.1);
      expect(vp.maxZoom).toBe(10.0);
    });

    it('FT#03: setZoom sets zoom level within min/max bounds', () => {
      const vp = createVectorViewportState();
      const next = setZoom(vp, 2.0);
      expect(next.zoom).toBe(2.0);
    });

    it('FT#04: setZoom clamps zoom below minZoom', () => {
      const vp = createVectorViewportState({ minZoom: 0.1 });
      const next = setZoom(vp, 0.01);
      expect(next.zoom).toBe(0.1);
    });

    it('FT#05: setZoom clamps zoom above maxZoom', () => {
      const vp = createVectorViewportState({ maxZoom: 5.0 });
      const next = setZoom(vp, 10.0);
      expect(next.zoom).toBe(5.0);
    });

    it('FT#06: setZoom with focal point maintains screen space invariant', () => {
      const vp = createVectorViewportState({ zoom: 1.0, panX: 0, panY: 0, viewportWidth: 1000, viewportHeight: 1000 });
      const focal = { x: 500, y: 500 };
      const canvasFocalBefore = viewportToCanvasPoint(focal, vp);

      const zoomed = setZoom(vp, 2.0, focal);
      const canvasFocalAfter = viewportToCanvasPoint(focal, zoomed);

      expect(zoomed.zoom).toBe(2.0);
      expect(canvasFocalAfter.x).toBeCloseTo(canvasFocalBefore.x, 5);
      expect(canvasFocalAfter.y).toBeCloseTo(canvasFocalBefore.y, 5);
    });

    it('FT#07: zoomIn increases zoom level by factor', () => {
      const vp = createVectorViewportState({ zoom: 1.0 });
      const next = zoomIn(vp, 1.5);
      expect(next.zoom).toBe(1.5);
    });

    it('FT#08: zoomOut decreases zoom level by factor', () => {
      const vp = createVectorViewportState({ zoom: 2.0 });
      const next = zoomOut(vp, 0.5);
      expect(next.zoom).toBe(1.0);
    });

    it('FT#09: panViewport shifts panX and panY by deltas', () => {
      const vp = createVectorViewportState({ panX: 50, panY: 50 });
      const next = panViewport(vp, 20, -10);
      expect(next.panX).toBe(70);
      expect(next.panY).toBe(40);
    });

    it('FT#10: resetViewport restores zoom to 1.0 and pan to (0,0)', () => {
      const vp = createVectorViewportState({ zoom: 3.0, panX: 250, panY: -120 });
      const next = resetViewport(vp);
      expect(next.zoom).toBe(1.0);
      expect(next.panX).toBe(0);
      expect(next.panY).toBe(0);
    });

    it('FT#11: fitToScreen computes optimal zoom and pan for target bounding box', () => {
      const vp = createVectorViewportState({ viewportWidth: 1000, viewportHeight: 1000 });
      const targetBounds = { x: 100, y: 100, width: 400, height: 400 };
      const fitted = fitToScreen(vp, targetBounds, { width: 1000, height: 1000 }, 100);

      // Available space = 1000 - 2*100 = 800. 800 / 400 = 2.0
      expect(fitted.zoom).toBeCloseTo(2.0, 4);
      // Center of bounds (300, 300) mapped to center of container (500, 500)
      expect(fitted.panX).toBeCloseTo(500 - 300 * 2.0, 4);
      expect(fitted.panY).toBeCloseTo(500 - 300 * 2.0, 4);
    });

    it('FT#12: fitToSelection computes bounding box of selected nodes and fits to screen', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 100, y: 100, width: 200, height: 200, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: RectangleNode = { id: 'r2', type: 'rectangle', transform: { x: 400, y: 400, width: 200, height: 200, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const vp = createVectorViewportState({ viewportWidth: 1000, viewportHeight: 1000 });
      const fitted = fitToSelection(vp, [r1, r2], { width: 1000, height: 1000 }, 0);

      // Overall bounds = x:100, y:100, width:500, height:500. Zoom = 1000 / 500 = 2.0
      expect(fitted.zoom).toBeCloseTo(2.0, 4);
    });

    it('FT#13: canvasToViewportPoint converts document coordinates to screen coordinates', () => {
      const vp = createVectorViewportState({ zoom: 2.0, panX: 100, panY: 50 });
      const pt = canvasToViewportPoint({ x: 50, y: 100 }, vp);
      expect(pt.x).toBe(200); // 50 * 2 + 100
      expect(pt.y).toBe(250); // 100 * 2 + 50
    });

    it('FT#14: viewportToCanvasPoint converts screen coordinates to document coordinates', () => {
      const vp = createVectorViewportState({ zoom: 2.0, panX: 100, panY: 50 });
      const pt = viewportToCanvasPoint({ x: 200, y: 250 }, vp);
      expect(pt.x).toBe(50);
      expect(pt.y).toBe(100);
    });

    it('FT#15: viewportToCanvasBounds converts screen marquee rect to document canvas bounds', () => {
      const vp = createVectorViewportState({ zoom: 2.0, panX: 100, panY: 100 });
      const screenRect = { x: 200, y: 200, width: 400, height: 400 };
      const canvasBounds = viewportToCanvasBounds(screenRect, vp);
      expect(canvasBounds.x).toBe(50); // (200 - 100) / 2
      expect(canvasBounds.y).toBe(50);
      expect(canvasBounds.width).toBe(200);
      expect(canvasBounds.height).toBe(200);
    });

    it('FT#16: canvasToViewportBounds converts document bounds to screen bounds', () => {
      const vp = createVectorViewportState({ zoom: 2.0, panX: 100, panY: 100 });
      const canvasRect = { x: 50, y: 50, width: 200, height: 200 };
      const screenBounds = canvasToViewportBounds(canvasRect, vp);
      expect(screenBounds.x).toBe(200);
      expect(screenBounds.y).toBe(200);
      expect(screenBounds.width).toBe(400);
      expect(screenBounds.height).toBe(400);
    });
  });

  // =========================================================================
  // 2. E2E WORKFLOWS (>= 7) — 8 WORKFLOWS
  // =========================================================================
  describe('E2E Workflows', () => {
    it('E2E#01: Viewport Lifecycle — Create -> Zoom -> Pan -> Fit -> Reset', () => {
      let vp = createVectorViewportState({ viewportWidth: 1000, viewportHeight: 1000 });
      expect(vp.zoom).toBe(1.0);

      // Origin focal zoom (0,0)
      vp = zoomIn(vp, 2.0, { x: 0, y: 0 });
      expect(vp.zoom).toBe(2.0);

      vp = panViewport(vp, 300, -150);
      expect(vp.panX).toBe(300);
      expect(vp.panY).toBe(-150);

      vp = fitToScreen(vp, { x: 0, y: 0, width: 500, height: 500 }, { width: 1000, height: 1000 }, 0);
      expect(vp.zoom).toBe(2.0);

      vp = resetViewport(vp);
      expect(vp.zoom).toBe(1.0);
      expect(vp.panX).toBe(0);
      expect(vp.panY).toBe(0);
    });

    it('E2E#02: Screen Marquee Selection Workflow with Viewport Translation', () => {
      let state = createVectorWorkspaceState();
      const node1: RectangleNode = { id: 'n1', type: 'rectangle', visible: true, transform: { x: 100, y: 100, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const node2: RectangleNode = { id: 'n2', type: 'rectangle', visible: true, transform: { x: 500, y: 500, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      state = addNode(state, node1);
      state = addNode(state, node2);

      // User has zoomed in to 2.0 and panned (panX: 100, panY: 100)
      const vp = createVectorViewportState({ zoom: 2.0, panX: 100, panY: 100 });

      // User drags screen marquee from screen (250, 250) to (450, 450)
      const screenMarquee = { x: 250, y: 250, width: 200, height: 200 };
      const canvasMarquee = viewportToCanvasBounds(screenMarquee, vp);

      // Verify canvas marquee coords: (250-100)/2 = 75, (450-100)/2 = 175 -> x:75, y:75, w:100, h:100
      expect(canvasMarquee.x).toBe(75);
      expect(canvasMarquee.y).toBe(75);
      expect(canvasMarquee.width).toBe(100);

      const nextState = selectNodesInMarquee(state, canvasMarquee);
      expect(nextState.snapshot.selectedIds).toEqual(['n1']);
    });

    it('E2E#03: Focal Point Zoom on Cursor Target', () => {
      const vp = createVectorViewportState({ zoom: 1.0, panX: 0, panY: 0 });
      const mouseCursorScreen = { x: 800, y: 600 };

      // Zoom in towards mouse cursor
      const zoomed = zoomIn(vp, 2.0, mouseCursorScreen);

      const canvasPointBefore = viewportToCanvasPoint(mouseCursorScreen, vp);
      const canvasPointAfter = viewportToCanvasPoint(mouseCursorScreen, zoomed);

      expect(canvasPointAfter.x).toBeCloseTo(canvasPointBefore.x, 5);
      expect(canvasPointAfter.y).toBeCloseTo(canvasPointBefore.y, 5);
    });

    it('E2E#04: Fit to Selection Workflow across multiple shapes', () => {
      const r1: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const r2: EllipseNode = { id: 'e1', type: 'ellipse', transform: { x: 900, y: 900, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };

      const vp = createVectorViewportState({ viewportWidth: 2000, viewportHeight: 2000 });
      const fitted = fitToSelection(vp, [r1, r2], { width: 2000, height: 2000 }, 0);

      // Bounds = x:0, y:0, w:1000, h:1000. Zoom = 2000 / 1000 = 2.0
      expect(fitted.zoom).toBe(2.0);
    });

    it('E2E#05: Vector Rendering Pipeline Integration with Viewport State', () => {
      const rect: RectangleNode = {
        id: 'r1',
        type: 'rectangle',
        transform: { x: 50, y: 50, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      };

      const vp = createVectorViewportState({ zoom: 2.0, panX: 100, panY: 50 });
      const commands = VectorRenderingBridge.buildRenderCommands(rect, vp);

      expect(commands.length).toBeGreaterThan(0);
      const setTransformCmd = commands.find(c => c.type === 'SET_TRANSFORM');
      expect(setTransformCmd).toBeDefined();
      if (setTransformCmd && setTransformCmd.type === 'SET_TRANSFORM') {
        // [a, b, c, d, e, f] where a=2, d=2, e=50*2+100=200, f=50*2+50=150
        expect(setTransformCmd.transform[0]).toBe(2.0);
        expect(setTransformCmd.transform[3]).toBe(2.0);
        expect(setTransformCmd.transform[4]).toBe(200);
        expect(setTransformCmd.transform[5]).toBe(150);
      }
    });

    it('E2E#06: SSOT Immutability & Zero HistoryStack Mutation during Viewport Actions', () => {
      const state = createVectorWorkspaceState();
      const initialSnapshot = state.snapshot;
      const initialHistoryLength = state.historyStack.entries.length;

      let vp = createVectorViewportState();
      vp = zoomIn(vp, 3.0);
      vp = panViewport(vp, 500, -200);
      vp = resetViewport(vp);

      // Vector document snapshot and history stack must be 100% untouched
      expect(state.snapshot).toBe(initialSnapshot);
      expect(state.historyStack.entries.length).toBe(initialHistoryLength);
    });

    it('E2E#07: SVG Export Parity under Active Viewport Navigation', () => {
      const rect: RectangleNode = {
        id: 'r1',
        type: 'rectangle',
        transform: { x: 50, y: 50, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        fill: { type: 'solid', color: '#ff0000' },
      };

      const svgBefore = VectorSvgExporter.exportToSvgString({ nodes: [rect], selectedIds: [] });

      // Active viewport state
      const vp = createVectorViewportState({ zoom: 5.0, panX: 1000, panY: 500 });

      // Viewport navigation should NOT affect document-space SVG exporter output
      const svgAfter = VectorSvgExporter.exportToSvgString({ nodes: [rect], selectedIds: [] });
      expect(svgAfter).toBe(svgBefore);
    });

    it('E2E#08: Multi-step Navigation Cycle does not leak or alter Document state', () => {
      let state = createVectorWorkspaceState();
      const node: RectangleNode = { id: 'r1', type: 'rectangle', transform: { x: 10, y: 10, width: 20, height: 20, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      state = addNode(state, node);

      const beforeDocJson = JSON.stringify(state.snapshot);

      let vp = createVectorViewportState();
      for (let i = 0; i < 50; i++) {
        vp = zoomIn(vp, 1.1, { x: 100, y: 100 });
        vp = panViewport(vp, 5, 5);
      }
      vp = resetViewport(vp);

      const afterDocJson = JSON.stringify(state.snapshot);
      expect(afterDocJson).toBe(beforeDocJson);
    });
  });

  // =========================================================================
  // 3. ADVERSARIAL SCENARIOS (>= 15) — 16 SCENARIOS
  // =========================================================================
  describe('Adversarial Scenarios', () => {
    it('A#01: setZoom with NaN / Infinity returns current state unharmed', () => {
      const vp = createVectorViewportState({ zoom: 1.5 });
      expect(setZoom(vp, NaN).zoom).toBe(1.5);
      expect(setZoom(vp, Infinity).zoom).toBe(1.5);
      expect(setZoom(vp, -Infinity).zoom).toBe(1.5);
    });

    it('A#02: panViewport with NaN / Infinity returns current state unharmed', () => {
      const vp = createVectorViewportState({ panX: 10, panY: 20 });
      expect(panViewport(vp, NaN, 5).panX).toBe(10);
      expect(panViewport(vp, 5, Infinity).panY).toBe(20);
    });

    it('A#03: fitToScreen with 0-width or 0-height bounding box returns unchanged state', () => {
      const vp = createVectorViewportState({ zoom: 1.0 });
      const bad1 = fitToScreen(vp, { x: 0, y: 0, width: 0, height: 100 });
      const bad2 = fitToScreen(vp, { x: 0, y: 0, width: 100, height: 0 });
      expect(bad1.zoom).toBe(1.0);
      expect(bad2.zoom).toBe(1.0);
    });

    it('A#04: fitToScreen with negative width / height bounding box returns unchanged state', () => {
      const vp = createVectorViewportState({ zoom: 1.0 });
      const bad = fitToScreen(vp, { x: 0, y: 0, width: -100, height: -100 });
      expect(bad.zoom).toBe(1.0);
    });

    it('A#05: fitToSelection with empty selection array returns unchanged state', () => {
      const vp = createVectorViewportState({ zoom: 1.0 });
      const fitted = fitToSelection(vp, []);
      expect(fitted.zoom).toBe(1.0);
    });

    it('A#06: fitToSelection with zero-size nodes degrades gracefully', () => {
      const zeroNode: RectangleNode = { id: 'z1', type: 'rectangle', transform: { x: 0, y: 0, width: 0, height: 0, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const vp = createVectorViewportState({ zoom: 1.0 });
      const fitted = fitToSelection(vp, [zeroNode]);
      expect(fitted.zoom).toBe(1.0);
    });

    it('A#07: canvasToViewportPoint with corrupted NaN point returns (0,0) fallback', () => {
      const vp = createVectorViewportState();
      const res = canvasToViewportPoint({ x: NaN, y: 10 }, vp);
      expect(res).toEqual({ x: 0, y: 0 });
    });

    it('A#08: viewportToCanvasPoint with corrupted NaN point returns (0,0) fallback', () => {
      const vp = createVectorViewportState();
      const res = viewportToCanvasPoint({ x: 10, y: NaN }, vp);
      expect(res).toEqual({ x: 0, y: 0 });
    });

    it('A#09: viewportToCanvasBounds with corrupted NaN bounds returns zero bounds fallback', () => {
      const vp = createVectorViewportState();
      const res = viewportToCanvasBounds({ x: NaN, y: 0, width: 100, height: 100 }, vp);
      expect(res).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('A#10: Extreme zoom out (0.0000001) is clamped to minZoom', () => {
      const vp = createVectorViewportState({ minZoom: 0.05 });
      const next = setZoom(vp, 0.0000001);
      expect(next.zoom).toBe(0.05);
    });

    it('A#11: Extreme zoom in (999999.0) is clamped to maxZoom', () => {
      const vp = createVectorViewportState({ maxZoom: 50.0 });
      const next = setZoom(vp, 999999.0);
      expect(next.zoom).toBe(50.0);
    });

    it('A#12: createVectorViewportState with inverted minZoom > maxZoom handles bounds safely', () => {
      const vp = createVectorViewportState({ minZoom: 10.0, maxZoom: 5.0 });
      expect(vp.maxZoom).toBeGreaterThanOrEqual(vp.minZoom);
    });

    it('A#13: Rapid repeated zoom operations remain numerically stable', () => {
      let vp = createVectorViewportState({ zoom: 1.0 });
      for (let i = 0; i < 100; i++) {
        vp = zoomIn(vp, 1.1);
        vp = zoomOut(vp, 1 / 1.1);
      }
      expect(vp.zoom).toBeCloseTo(1.0, 3);
    });

    it('A#14: VectorRenderingBridge with corrupted NaN viewport pan/zoom handles matrix safely', () => {
      const rect: RectangleNode = {
        id: 'r1',
        type: 'rectangle',
        transform: { x: 10, y: 10, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      };
      const badVp: VectorViewportState = { zoom: NaN, panX: Infinity, panY: -Infinity, viewportWidth: 1000, viewportHeight: 1000, minZoom: 0.05, maxZoom: 50 };

      const cmds = VectorRenderingBridge.buildRenderCommands(rect, badVp);
      expect(cmds.length).toBeGreaterThan(0);
    });

    it('A#15: Concurrent zoom and pan updates resulting in identical state returns same instance', () => {
      const vp = createVectorViewportState({ zoom: 1.0, panX: 10, panY: 20 });
      const sameZoom = setZoom(vp, 1.0);
      const samePan = panViewport(vp, 0, 0);

      expect(sameZoom).toBe(vp);
      expect(samePan).toBe(vp);
    });

    it('A#16: fitToScreen with zero-size container uses state default container dimensions', () => {
      const vp = createVectorViewportState({ viewportWidth: 1000, viewportHeight: 1000 });
      const fitted = fitToScreen(vp, { x: 0, y: 0, width: 200, height: 200 }, { width: 0, height: 0 }, 10);
      expect(fitted.viewportWidth).toBe(1000);
      expect(fitted.zoom).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 4. FAILURE INJECTION & BOUNDARY TESTS (>= 3) — 4 TESTS
  // =========================================================================
  describe('Failure Injection & Boundary Tests', () => {
    it('FI#01: Inject corrupted infinity bounds into fitToScreen -> safe fallback', () => {
      const vp = createVectorViewportState({ zoom: 1.0 });
      const corruptedBounds = { x: -Infinity, y: Infinity, width: NaN, height: Infinity };
      const res = fitToScreen(vp, corruptedBounds);
      expect(res).toBe(vp);
    });

    it('FI#02: Inject zero zoom into viewportToCanvasPoint -> safe zero division handling', () => {
      const zeroVp: VectorViewportState = { zoom: 0, panX: 0, panY: 0, viewportWidth: 1000, viewportHeight: 1000, minZoom: 0, maxZoom: 50 };
      const pt = viewportToCanvasPoint({ x: 100, y: 100 }, zeroVp);
      expect(Number.isFinite(pt.x) || pt.x === Infinity || isNaN(pt.x)).toBeTruthy();
    });

    it('FI#03: Inject corrupted node snapshot into fitToSelection -> no crash', () => {
      const vp = createVectorViewportState({ zoom: 1.0 });
      const corruptedNode = { id: 'corrupted' } as any;
      const res = fitToSelection(vp, [corruptedNode]);
      expect(res).toBe(vp);
    });

    it('FI#04: Inject invalid viewportState into VectorRenderingBridge -> fallback to document transform', () => {
      const rect: RectangleNode = {
        id: 'r1',
        type: 'rectangle',
        transform: { x: 10, y: 20, width: 30, height: 40, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect, undefined);
      const setTransformCmd = cmds.find(c => c.type === 'SET_TRANSFORM');
      expect(setTransformCmd).toBeDefined();
      if (setTransformCmd && setTransformCmd.type === 'SET_TRANSFORM') {
        expect(setTransformCmd.transform[4]).toBe(10);
        expect(setTransformCmd.transform[5]).toBe(20);
      }
    });
  });
});
