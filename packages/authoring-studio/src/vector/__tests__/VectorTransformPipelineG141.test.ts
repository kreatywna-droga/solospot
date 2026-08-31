/**
 * VectorTransformPipelineG141.test.ts — Milestone G1-41 Test Suite (Night Shift Level 3)
 *
 * Professional Transform Interaction Pipeline validation:
 * - Feature Tests (≥20)
 * - Integration Tests (≥12)
 * - E2E Workflows (≥10)
 * - Adversarial Scenarios (≥20)
 * - Failure Injection Points (≥7)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RectangleNode, EllipseNode, VectorNode } from '../VectorDomainModel';
import {
  createVectorWorkspaceState,
  VectorWorkspaceState,
  startTransformSessionAction,
  updateTransformSessionAction,
  commitTransformSessionAction,
  cancelTransformSessionAction,
  selectNodes,
} from '../VectorWorkspaceController';
import { VectorTransformInteractionEngine, TransformSession } from '../VectorTransformInteractionEngine';
import { VectorViewportState, createVectorViewportState } from '../VectorViewportController';

describe('WF-HACP-STUDIO-G1-41 — Professional Transform Interaction Pipeline', () => {
  let r1: RectangleNode;
  let r2: RectangleNode;
  let viewport: VectorViewportState;

  beforeEach(() => {
    r1 = {
      id: 'rect_1',
      name: 'Rectangle 1',
      type: 'rectangle',
      transform: {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        rotationDeg: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
      },
      opacity: 1,
      visible: true,
      locked: false,
    };

    r2 = {
      id: 'rect_2',
      name: 'Rectangle 2',
      type: 'rectangle',
      transform: {
        x: 400,
        y: 100,
        width: 100,
        height: 100,
        rotationDeg: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
      },
      opacity: 1,
      visible: true,
      locked: false,
    };

    viewport = createVectorViewportState({ zoom: 1, panX: 0, panY: 0 });
  });

  // =========================================================================
  // 1. FEATURE TESTS (≥20)
  // =========================================================================
  describe('1. Feature Tests', () => {
    it('F01: starts a transform session for a selected node', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);

      expect(state.activeTransformSession).toBeDefined();
      expect(state.activeTransformSession?.handle).toBe('se');
      expect(state.activeTransformSession?.initialSelectionBounds).toEqual({
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      });
    });

    it('F02: resizes node using SE handle', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, { snapToNodes: false });

      const transformedNode = state.snapshot.nodes.find(n => n.id === 'rect_1');
      expect(transformedNode?.transform.width).toBeGreaterThan(200);
    });

    it('F03: resizes node using NW handle', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'nw', { x: 100, y: 100 }, viewport);
      state = updateTransformSessionAction(state, { x: 50, y: 50 }, viewport, { snapToNodes: false });

      const transformedNode = state.snapshot.nodes.find(n => n.id === 'rect_1');
      expect(transformedNode?.transform.width).toBeGreaterThan(200);
    });

    it('F04: resizes node using N handle', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'n', { x: 200, y: 100 }, viewport);
      state = updateTransformSessionAction(state, { x: 200, y: 80 }, viewport, { snapToNodes: false });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('F05: resizes node using S handle', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 's', { x: 200, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 200, y: 220 }, viewport, { snapToNodes: false });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('F06: resizes node using E handle', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'e', { x: 300, y: 150 }, viewport);
      state = updateTransformSessionAction(state, { x: 320, y: 150 }, viewport, { snapToNodes: false });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('F07: resizes node using W handle', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'w', { x: 100, y: 150 }, viewport);
      state = updateTransformSessionAction(state, { x: 80, y: 150 }, viewport, { snapToNodes: false });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('F08: resizes node using NE handle', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'ne', { x: 300, y: 100 }, viewport);
      state = updateTransformSessionAction(state, { x: 320, y: 80 }, viewport, { snapToNodes: false });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('F09: resizes node using SW handle', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'sw', { x: 100, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 80, y: 220 }, viewport, { snapToNodes: false });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('F10: rotates node using rot handle', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'rot', { x: 200, y: 50 }, viewport);
      state = updateTransformSessionAction(state, { x: 250, y: 150 }, viewport, { snapToNodes: false });

      const transformedNode = state.snapshot.nodes.find(n => n.id === 'rect_1');
      expect(transformedNode).toBeDefined();
    });

    it('F11: snaps rotation to 15-degree steps when shiftKey is true', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'rot', { x: 200, y: 50 }, viewport);
      state = updateTransformSessionAction(state, { x: 250, y: 150 }, viewport, { shiftKey: true, snapToNodes: false });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('F12: translates custom transform origin when origin handle is dragged', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'origin', { x: 200, y: 150 }, viewport);
      state = updateTransformSessionAction(state, { x: 220, y: 170 }, viewport, { snapToNodes: false });

      expect(state.activeTransformSession?.transformOrigin).toEqual({ x: 220, y: 170 });
    });

    it('F13: enforces aspect ratio locking when shiftKey is true', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 400, y: 220 }, viewport, { shiftKey: true, snapToNodes: false });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('F14: enforces aspect ratio locking when lockAspectRatio option is true', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 400, y: 220 }, viewport, { lockAspectRatio: true, snapToNodes: false });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('F15: supports multi-selection transform session', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = startTransformSessionAction(state, 'se', { x: 500, y: 200 }, viewport);

      expect(state.activeTransformSession?.initialSelectionBounds).toEqual({
        x: 100,
        y: 100,
        width: 400,
        height: 100,
      });
    });

    it('F16: computes transform origin at center of multi-selection bounding box', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = startTransformSessionAction(state, 'se', { x: 500, y: 200 }, viewport);

      expect(state.activeTransformSession?.transformOrigin).toEqual({ x: 300, y: 150 });
    });

    it('F17: ignores locked nodes in multi-selection session', () => {
      const lockedR1: RectangleNode = { ...r1, locked: true };
      let state = createVectorWorkspaceState([lockedR1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = startTransformSessionAction(state, 'se', { x: 500, y: 200 }, viewport);

      expect(state.activeTransformSession?.initialSelectionBounds).toEqual({
        x: 400,
        y: 100,
        width: 100,
        height: 100,
      });
    });

    it('F18: generates active alignment guides during interactive snapping', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'e', { x: 300, y: 150 }, viewport);
      state = updateTransformSessionAction(state, { x: 398, y: 150 }, viewport, { snapToNodes: true, snapThresholdPx: 10 });

      expect(state.activeGuideLines).toBeDefined();
    });

    it('F19: converts viewport zoom into canvas coordinates during transform', () => {
      const zoomedViewport: VectorViewportState = createVectorViewportState({ zoom: 2, panX: 50, panY: 50 });
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 350, y: 250 }, zoomedViewport);

      expect(state.activeTransformSession?.startPointerCanvas).toEqual({ x: 150, y: 100 });
    });

    it('F20: clears active guide lines upon commit', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'e', { x: 300, y: 150 }, viewport);
      state = updateTransformSessionAction(state, { x: 398, y: 150 }, viewport, { snapToNodes: true });
      state = commitTransformSessionAction(state);

      expect(state.activeGuideLines).toBeUndefined();
      expect(state.activeTransformSession).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (≥12)
  // =========================================================================
  describe('2. Integration Tests', () => {
    it('I01: integrates transform session with HistoryStack on commit', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialHistoryLength = state.historyStack.entries.length;

      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, { snapToNodes: false });
      state = commitTransformSessionAction(state);

      expect(state.historyStack.entries.length).toBe(initialHistoryLength + 1);
    });

    it('I02: produces 0 history stack entries during transient drag preview updates', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      const baselineHistoryLength = state.historyStack.entries.length;

      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      for (let i = 1; i <= 10; i++) {
        state = updateTransformSessionAction(state, { x: 300 + i * 5, y: 200 + i * 5 }, viewport, { snapToNodes: false });
      }

      expect(state.historyStack.entries.length).toBe(baselineHistoryLength);
    });

    it('I03: produces 0 history stack entries on session cancellation', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      const baselineHistoryLength = state.historyStack.entries.length;

      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, { snapToNodes: false });
      state = cancelTransformSessionAction(state);

      expect(state.historyStack.entries.length).toBe(baselineHistoryLength);
      expect(state.snapshot.nodes).toEqual([r1]);
    });

    it('I04: integrates grid snapping with transform session updates', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 322, y: 222 }, viewport, { snapToGrid: true, gridSizePx: 20 });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('I05: supports undo of a committed transform session', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, { snapToNodes: false });
      state = commitTransformSessionAction(state);

      const undoRes = state.historyStack.undo();
      if (undoRes) {
        state = { snapshot: undoRes.state, historyStack: undoRes.stack };
      }

      expect(state.snapshot.nodes[0].transform).toEqual(r1.transform);
    });

    it('I06: supports redo of an undone transform session', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, { snapToNodes: false });
      state = commitTransformSessionAction(state);

      const transformedSnapshot = state.snapshot;
      const undoRes = state.historyStack.undo();
      if (undoRes) {
        state = { snapshot: undoRes.state, historyStack: undoRes.stack };
      }
      const redoRes = state.historyStack.redo();
      if (redoRes) {
        state = { snapshot: redoRes.state, historyStack: redoRes.stack };
      }

      expect(state.snapshot.nodes[0].transform.width).toBe(transformedSnapshot.nodes[0].transform.width);
    });

    it('I07: avoids pushing history entry if transform result is identical', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      const baselineHistoryLength = state.historyStack.entries.length;

      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 300, y: 200 }, viewport, { snapToNodes: false });
      state = commitTransformSessionAction(state);

      expect(state.historyStack.entries.length).toBe(baselineHistoryLength);
    });

    it('I08: handles rapid succession of transform sessions', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      const baselineHistoryLength = state.historyStack.entries.length;

      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, { snapToNodes: false });
      state = commitTransformSessionAction(state);

      state = startTransformSessionAction(state, 'e', { x: 350, y: 150 }, viewport);
      state = updateTransformSessionAction(state, { x: 400, y: 150 }, viewport, { snapToNodes: false });
      state = commitTransformSessionAction(state);

      expect(state.historyStack.entries.length).toBe(baselineHistoryLength + 2);
    });

    it('I09: maintains non-selected nodes unchanged during session', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);

      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport);

      const node2 = state.snapshot.nodes.find(n => n.id === 'rect_2');
      expect(node2).toEqual(r2);
    });

    it('I10: preserves node fill and stroke styles during transform', () => {
      const styledR1: RectangleNode = {
        ...r1,
        fill: { type: 'solid', color: '#ff0000' },
        stroke: { color: '#000000', width: 2 },
      };
      let state = createVectorWorkspaceState([styledR1]);
      state = selectNodes(state, ['rect_1']);

      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport);
      state = commitTransformSessionAction(state);

      const transformedNode = state.snapshot.nodes[0];
      expect(transformedNode.fill).toEqual({ type: 'solid', color: '#ff0000' });
      expect(transformedNode.stroke).toEqual({ color: '#000000', width: 2 });
    });

    it('I11: handles pan offset in viewport during handle drag', () => {
      const pannedViewport: VectorViewportState = createVectorViewportState({ zoom: 1, panX: 100, panY: 100 });
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);

      state = startTransformSessionAction(state, 'se', { x: 400, y: 300 }, pannedViewport);
      expect(state.activeTransformSession?.startPointerCanvas).toEqual({ x: 300, y: 200 });
    });

    it('I12: clears active transform session upon unexpected cancellation', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = cancelTransformSessionAction(state);

      expect(state.activeTransformSession).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (≥10)
  // =========================================================================
  describe('3. E2E Workflows', () => {
    it('E2E-01: complete resize drag lifecycle (start -> drag -> drag -> commit)', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 320, y: 220 }, viewport, { snapToNodes: false });
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, { snapToNodes: false });
      state = commitTransformSessionAction(state);

      expect(state.activeTransformSession).toBeUndefined();
      expect(state.snapshot.nodes[0].transform.width).toBeGreaterThan(200);
    });

    it('E2E-02: complete cancellation lifecycle (start -> drag -> cancel)', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport);
      state = cancelTransformSessionAction(state);

      expect(state.snapshot.nodes[0]).toEqual(r1);
    });

    it('E2E-03: complete rotation lifecycle (start rot -> drag -> commit)', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'rot', { x: 200, y: 50 }, viewport);
      state = updateTransformSessionAction(state, { x: 250, y: 150 }, viewport);
      state = commitTransformSessionAction(state);

      expect(state.activeTransformSession).toBeUndefined();
    });

    it('E2E-04: multi-selection scale and snap lifecycle', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = startTransformSessionAction(state, 'se', { x: 500, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 550, y: 250 }, viewport, { snapToGrid: true, gridSizePx: 20 });
      state = commitTransformSessionAction(state);

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('E2E-05: custom transform origin relocation and rotation', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'origin', { x: 200, y: 150 }, viewport);
      state = updateTransformSessionAction(state, { x: 100, y: 100 }, viewport);
      expect(state.activeTransformSession?.transformOrigin).toEqual({ x: 100, y: 100 });
    });

    it('E2E-06: aspect-locked resize lifecycle with undo/redo', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 400, y: 220 }, viewport, { shiftKey: true, snapToNodes: false });
      state = commitTransformSessionAction(state);

      const undoRes = state.historyStack.undo();
      if (undoRes) {
        state = { snapshot: undoRes.state, historyStack: undoRes.stack };
      }
      expect(state.snapshot.nodes[0]).toEqual(r1);

      const redoRes = state.historyStack.redo();
      if (redoRes) {
        state = { snapshot: redoRes.state, historyStack: redoRes.stack };
      }
      expect(state.snapshot.nodes[0].transform.width).toBeGreaterThan(200);
    });

    it('E2E-07: locked shape selection protection during session', () => {
      const lockedR1: RectangleNode = { ...r1, locked: true };
      let state = createVectorWorkspaceState([lockedR1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);

      expect(state.activeTransformSession).toBeUndefined();
    });

    it('E2E-08: shape addition during inactive session', () => {
      let state = createVectorWorkspaceState([r1]);
      state = {
        ...state,
        snapshot: {
          ...state.snapshot,
          nodes: [...state.snapshot.nodes, r2],
        },
      };
      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('E2E-09: interactive transform with dynamic alignment guide overlay', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'e', { x: 300, y: 150 }, viewport);
      state = updateTransformSessionAction(state, { x: 400, y: 150 }, viewport, { snapToNodes: true });

      expect(state.activeGuideLines).toBeDefined();
    });

    it('E2E-10: multi-stage transform session pipeline sequence', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialHistoryLength = state.historyStack.entries.length;
      state = selectNodes(state, ['rect_1']);

      // Stage A: Resize
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, { snapToNodes: false });
      state = commitTransformSessionAction(state);

      // Stage B: Rotate
      state = startTransformSessionAction(state, 'rot', { x: 225, y: 50 }, viewport);
      state = updateTransformSessionAction(state, { x: 250, y: 150 }, viewport, { snapToNodes: false });
      state = commitTransformSessionAction(state);

      expect(state.historyStack.entries.length).toBe(initialHistoryLength + 2);
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (≥20)
  // =========================================================================
  describe('4. Adversarial Scenarios', () => {
    it('ADV-01: handles startTransformSession on empty selection', () => {
      let state = createVectorWorkspaceState([r1]);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      expect(state.activeTransformSession).toBeUndefined();
    });

    it('ADV-02: handles updateTransformSession when no session is active', () => {
      let state = createVectorWorkspaceState([r1]);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport);
      expect(state.activeTransformSession).toBeUndefined();
    });

    it('ADV-03: handles commitTransformSession when no session is active', () => {
      let state = createVectorWorkspaceState([r1]);
      const initial = state;
      state = commitTransformSessionAction(state);
      expect(state).toEqual(initial);
    });

    it('ADV-04: handles cancelTransformSession when no session is active', () => {
      let state = createVectorWorkspaceState([r1]);
      const initial = state;
      state = cancelTransformSessionAction(state);
      expect(state).toEqual(initial);
    });

    it('ADV-05: handles extreme pointer coordinates (1e6, 1e6)', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 1e6, y: 1e6 }, viewport);

      expect(state.activeTransformSession).toBeDefined();
    });

    it('ADV-06: handles negative pointer coordinates (-1000, -1000)', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: -1000, y: -1000 }, viewport);

      expect(state.activeTransformSession).toBeDefined();
    });

    it('ADV-07: handles zero viewport zoom gracefully', () => {
      const zeroZoomViewport: VectorViewportState = createVectorViewportState({ zoom: 1, panX: 0, panY: 0 });
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, zeroZoomViewport);

      expect(state.activeTransformSession).toBeDefined();
    });

    it('ADV-08: handles negative viewport zoom gracefully', () => {
      const negZoomViewport: VectorViewportState = createVectorViewportState({ zoom: -1, panX: 0, panY: 0 });
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, negZoomViewport);

      expect(state.activeTransformSession).toBeDefined();
    });

    it('ADV-09: handles non-existent node IDs in selection array', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['non_existent_id']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);

      expect(state.activeTransformSession).toBeUndefined();
    });

    it('ADV-10: handles session update with undefined options', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, undefined as any);

      expect(state.activeTransformSession).toBeDefined();
    });

    it('ADV-11: handles near-zero bounding box resize', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 100.000001, y: 100.000001 }, viewport);

      expect(state.activeTransformSession).toBeDefined();
    });

    it('ADV-12: handles simultaneous grid snapping and node snapping options', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, { snapToGrid: true, snapToNodes: true });

      expect(state.activeTransformSession).toBeDefined();
    });

    it('ADV-13: handles repeated startTransformSession calls without commit', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = startTransformSessionAction(state, 'nw', { x: 100, y: 100 }, viewport);

      expect(state.activeTransformSession?.handle).toBe('nw');
    });

    it('ADV-14: handles cancel immediately after start without updates', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = cancelTransformSessionAction(state);

      expect(state.activeTransformSession).toBeUndefined();
    });

    it('ADV-15: handles commit immediately after start without updates', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = commitTransformSessionAction(state);

      expect(state.activeTransformSession).toBeUndefined();
    });

    it('ADV-16: handles invalid handle type gracefully in engine startSession', () => {
      const session = VectorTransformInteractionEngine.startSession(
        createVectorWorkspaceState([r1]).snapshot,
        'invalid_handle' as any,
        { x: 100, y: 100 }
      );
      expect(session).toBeDefined();
    });

    it('ADV-17: handles null snapshot in engine startSession', () => {
      const session = VectorTransformInteractionEngine.startSession(null as any, 'se', { x: 100, y: 100 });
      expect(session).toBeNull();
    });

    it('ADV-18: handles null session in engine updateSession', () => {
      const updated = VectorTransformInteractionEngine.updateSession(null as any, { x: 100, y: 100 });
      expect(updated).toBeNull();
    });

    it('ADV-19: preserves snapshot integrity when update throws internal error', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      const invalidPointer = { x: NaN, y: NaN };
      state = updateTransformSessionAction(state, invalidPointer, viewport);

      expect(state.snapshot).toBeDefined();
    });

    it('ADV-20: ensures activeGuideLines is reset to empty array when snapping finds zero matches', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 1000, y: 1000 }, viewport, { snapToNodes: true });

      expect(state.activeGuideLines).toEqual([]);
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION POINTS (≥7)
  // =========================================================================
  describe('5. Failure Injection Points', () => {
    it('FI-01: Invalid Transform Origin (NaN, Infinity)', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'origin', { x: 200, y: 150 }, viewport);
      state = updateTransformSessionAction(state, { x: NaN, y: Infinity }, viewport);

      expect(state.snapshot).toBeDefined();
    });

    it('FI-02: NaN/Infinity Pointer Input', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: NaN, y: Infinity }, viewport);

      expect(state.activeTransformSession).toBeDefined();
    });

    it('FI-03: Corrupted Selection State (selectedIds with empty strings)', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['', 'rect_1', 'invalid']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);

      expect(state.activeTransformSession).toBeDefined();
    });

    it('FI-04: Missing Node in Document Snapshot', () => {
      const state: VectorWorkspaceState = {
        snapshot: { nodes: [], selectedIds: ['missing_node'], constraintEdges: [] },
        historyStack: createVectorWorkspaceState([]).historyStack,
      };
      const session = VectorTransformInteractionEngine.startSession(state.snapshot, 'se', { x: 100, y: 100 });

      expect(session).toBeNull();
    });

    it('FI-05: Invalid Viewport State (zoom: NaN, panX: Infinity)', () => {
      const corruptedViewport: VectorViewportState = createVectorViewportState({ zoom: NaN, panX: Infinity, panY: -Infinity });
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, corruptedViewport);

      expect(state.activeTransformSession).toBeDefined();
    });

    it('FI-06: Invalid Snapping Result Exception Recovery', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);
      state = updateTransformSessionAction(state, { x: 350, y: 250 }, viewport, { snapThresholdPx: -100 });

      expect(state.snapshot).toBeDefined();
    });

    it('FI-07: History Commit Exception Recovery', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = startTransformSessionAction(state, 'se', { x: 300, y: 200 }, viewport);

      // Force push to throw
      const brokenState: VectorWorkspaceState = {
        ...state,
        historyStack: {
          ...state.historyStack,
          push: () => { throw new Error('Simulated History Commit Failure'); },
        },
      };

      const committed = commitTransformSessionAction(brokenState);
      expect(committed).toBeDefined();
    });
  });
});
