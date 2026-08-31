/**
 * VectorPathTopologyG143.test.ts — Milestone G1-43 Test Suite (Night Shift Level 5)
 *
 * Professional Vector Path Operations & Boolean Topology System validation:
 * - Feature Tests (≥20)
 * - Integration Tests (≥12)
 * - E2E Workflows (≥10)
 * - Adversarial Scenarios (≥20)
 * - Failure Injection Points (≥5)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RectangleNode, EllipseNode, PathNode, createPathNode } from '../VectorDomainModel';
import { createVectorWorkspaceState, selectNodes } from '../VectorWorkspaceController';
import { VectorPathEngine, PathSegment } from '../VectorPathEngine';
import { VectorBooleanTopologyEngine } from '../VectorBooleanTopologyEngine';
import { VectorWorkflowOrchestrator } from '../VectorWorkflowOrchestrator';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorSvgExporter } from '../VectorSvgExporter';

describe('WF-HACP-STUDIO-G1-43 — Professional Vector Path Operations & Boolean Topology System', () => {
  let r1: RectangleNode;
  let r2: RectangleNode;
  let p1: PathNode;

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
        x: 150,
        y: 150,
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

    p1 = createPathNode('path_1', 'M 0 0 L 100 0 L 50 100 Z', 0, 0, 100, 100);
  });

  // =========================================================================
  // 1. FEATURE TESTS (≥20)
  // =========================================================================
  describe('1. Feature Tests', () => {
    it('F01: validates control point coordinates safely', () => {
      expect(VectorPathEngine.validateControlPoint({ x: 10, y: 20 })).toBe(true);
      expect(VectorPathEngine.validateControlPoint({ x: NaN, y: 20 })).toBe(false);
      expect(VectorPathEngine.validateControlPoint({ x: 10, y: Infinity })).toBe(false);
    });

    it('F02: subdivides linear segment at midpoint t=0.5', () => {
      const res = VectorPathEngine.subdivideSegment({ x: 0, y: 0 }, undefined, undefined, { x: 100, y: 100 }, 0.5);
      expect(res.left.end).toEqual({ x: 50, y: 50 });
      expect(res.right.start).toEqual({ x: 50, y: 50 });
    });

    it('F03: subdivides cubic Bezier curve using de Casteljau algorithm', () => {
      const start = { x: 0, y: 0 };
      const cp1 = { x: 0, y: 50 };
      const cp2 = { x: 100, y: 50 };
      const end = { x: 100, y: 0 };

      const res = VectorPathEngine.subdivideSegment(start, cp1, cp2, end, 0.5);
      expect(res.left.end.x).toBeGreaterThan(0);
      expect(res.right.start).toEqual(res.left.end);
    });

    it('F04: applies corner smoothing radius to PathNode', () => {
      const res = VectorPathEngine.applyCornerSmoothing(p1, { radiusPx: 15 });
      expect(res.success).toBe(true);
      expect(res.pathNode.cornerRadius).toBe(15);
    });

    it('F05: reverses path winding order DTO string', () => {
      const res = VectorPathEngine.reversePath(p1);
      expect(res.success).toBe(true);
      expect(res.pathNode.d).toBe('Z 100 50 L 0 100 L 0 0 M');
    });

    it('F06: simplifies path data by removing redundant tokens', () => {
      const res = VectorPathEngine.simplifyPath(p1);
      expect(res.success).toBe(true);
      expect(res.pathNode.d).toBe(p1.d);
    });

    it('F07: validates shapes for boolean topology execution', () => {
      expect(VectorBooleanTopologyEngine.validateShapesForTopology([r1, r2])).toBe(true);
      expect(VectorBooleanTopologyEngine.validateShapesForTopology([r1])).toBe(false);
    });

    it('F08: executes boolean UNION topology across 2 shapes', () => {
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([r1, r2], 'union');
      expect(res.success).toBe(true);
      expect(res.resultNode?.type).toBe('path');
    });

    it('F09: executes boolean DIFFERENCE topology across 2 shapes', () => {
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([r1, r2], 'difference');
      expect(res.success).toBe(true);
      expect(res.resultNode?.type).toBe('path');
    });

    it('F10: executes boolean INTERSECTION topology across 2 shapes', () => {
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([r1, r2], 'intersection');
      expect(res.success).toBe(true);
      expect(res.resultNode?.type).toBe('path');
    });

    it('F11: executes boolean EXCLUSION topology across 2 shapes', () => {
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([r1, r2], 'exclusion');
      expect(res.success).toBe(true);
      expect(res.resultNode?.type).toBe('path');
    });

    it('F12: dispatches BOOLEAN_TOPOLOGY workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      expect(state.snapshot.nodes.length).toBe(1);
      expect(state.snapshot.nodes[0].type).toBe('path');
    });

    it('F13: dispatches SMOOTH_PATH_CORNERS workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(state, 12);

      expect((state.snapshot.nodes[0] as PathNode).cornerRadius).toBe(12);
    });

    it('F14: dispatches REVERSE_PATH workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.reverseSelectedPathWorkflow(state);

      expect((state.snapshot.nodes[0] as PathNode).d).toContain('Z');
    });

    it('F15: clamps t parameter during segment subdivision to [0, 1]', () => {
      const res1 = VectorPathEngine.subdivideSegment({ x: 0, y: 0 }, undefined, undefined, { x: 100, y: 100 }, -5);
      expect(res1.left.end).toEqual({ x: 0, y: 0 });

      const res2 = VectorPathEngine.subdivideSegment({ x: 0, y: 0 }, undefined, undefined, { x: 100, y: 100 }, 10);
      expect(res2.left.end).toEqual({ x: 100, y: 100 });
    });

    it('F16: preserves locked shape state during boolean topology workflow', () => {
      const lockedR1: RectangleNode = { ...r1, locked: true };
      let state = createVectorWorkspaceState([lockedR1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('F17: handles boolean topology on 3 shapes sequentially', () => {
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([r1, r2, p1], 'union');
      expect(res.success).toBe(true);
      expect(res.affectedSourceIds.length).toBe(3);
    });

    it('F18: returns errors array when boolean topology fails', () => {
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([r1], 'union');
      expect(res.success).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });

    it('F19: returns unchanged node when corner smoothing radius is zero', () => {
      const res = VectorPathEngine.applyCornerSmoothing(p1, { radiusPx: 0 });
      expect(res.success).toBe(true);
      expect(res.pathNode.cornerRadius).toBe(0);
    });

    it('F20: handles empty path string safely in reversePath', () => {
      const emptyPath: PathNode = createPathNode('empty_1', '', 0, 0, 100, 100);
      const res = VectorPathEngine.reversePath(emptyPath);
      expect(res.success).toBe(true);
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (≥12)
  // =========================================================================
  describe('2. Integration Tests', () => {
    it('I01: integrates boolean topology workflow with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      const initialHistoryLength = state.historyStack.entries.length;

      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      expect(state.historyStack.entries.length).toBe(initialHistoryLength + 1);
    });

    it('I02: supports undo of boolean topology operation', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('I03: supports redo of boolean topology operation', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      const redoRes = state.historyStack.redo();
      if (redoRes) state = { snapshot: redoRes.state, historyStack: redoRes.stack };

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('I04: integrates JSON document serialization roundtrip after boolean topology', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(1);
      expect(restored.snapshot!.nodes[0].type).toBe('path');
    });

    it('I05: integrates SVG export roundtrip after boolean topology', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<path');
    });

    it('I06: integrates corner smoothing workflow with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([p1]);
      const initialHistoryLength = state.historyStack.entries.length;

      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(state, 10);

      expect(state.historyStack.entries.length).toBe(initialHistoryLength + 1);
    });

    it('I07: integrates reverse path workflow with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([p1]);
      const initialHistoryLength = state.historyStack.entries.length;

      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.reverseSelectedPathWorkflow(state);

      expect(state.historyStack.entries.length).toBe(initialHistoryLength + 1);
    });

    it('I08: maintains non-selected shapes intact during boolean topology execution', () => {
      const r3: RectangleNode = { ...r1, id: 'rect_3' };
      let state = createVectorWorkspaceState([r1, r2, r3]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      expect(state.snapshot.nodes.some(n => n.id === 'rect_3')).toBe(true);
    });

    it('I09: integrates path subdivision with JSON serialization', () => {
      const sub = VectorPathEngine.subdivideSegment({ x: 0, y: 0 }, undefined, undefined, { x: 100, y: 100 }, 0.5);
      const json = JSON.stringify(sub);
      const restored = JSON.parse(json);

      expect(restored.left.end).toEqual({ x: 50, y: 50 });
    });

    it('I10: ignores non-path nodes during corner smoothing workflow', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialNodes = state.snapshot.nodes;

      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(state, 10);

      expect(state.snapshot.nodes).toEqual(initialNodes);
    });

    it('I11: ignores non-path nodes during reverse path workflow', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialNodes = state.snapshot.nodes;

      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.reverseSelectedPathWorkflow(state);

      expect(state.snapshot.nodes).toEqual(initialNodes);
    });

    it('I12: maintains document integrity across 10 sequential path topology operations', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      const pathId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [pathId]);

      for (let i = 0; i < 5; i++) {
        state = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(state, i + 5);
        state = VectorWorkflowOrchestrator.reverseSelectedPathWorkflow(state);
      }

      expect(state.snapshot.nodes.length).toBe(1);
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (≥10)
  // =========================================================================
  describe('3. E2E Workflows', () => {
    it('E2E-01: User Intent: Create Shapes -> Union Topology -> Corner Smooth -> SVG Export', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      const topologyId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [topologyId]);
      state = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(state, 8);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);
      const svg = VectorSvgExporter.exportToSvgString(restored.snapshot!);

      expect(restored.snapshot!.nodes.length).toBe(1);
      expect(svg).toContain('<path');
    });

    it('E2E-02: User Intent: Boolean Difference -> Reverse Winding -> Undo Workflow', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'difference');

      const pathId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [pathId]);
      state = VectorWorkflowOrchestrator.reverseSelectedPathWorkflow(state);

      // Undo reverse
      let undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      // Undo boolean topology
      undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('E2E-03: User Intent: Multi-shape Intersection -> Redo -> JSON Persistence', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'intersection');

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      const redoRes = state.historyStack.redo();
      if (redoRes) state = { snapshot: redoRes.state, historyStack: redoRes.stack };

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(1);
    });

    it('E2E-04: User Intent: Segment Subdivision Pipeline', () => {
      const seg1: PathSegment = { start: { x: 0, y: 0 }, end: { x: 200, y: 200 } };
      const sub = VectorPathEngine.subdivideSegment(seg1.start, seg1.cp1, seg1.cp2, seg1.end, 0.5);

      expect(sub.left.end).toEqual({ x: 100, y: 100 });
      expect(sub.right.start).toEqual({ x: 100, y: 100 });
    });

    it('E2E-05: User Intent: Exclusion Topology Workflow', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'exclusion');

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('E2E-06: User Intent: Corner Smoothing Preserves Stroke and Fill Props', () => {
      const styledP1: PathNode = { ...p1, opacity: 0.6, visible: true };
      let state = createVectorWorkspaceState([styledP1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(state, 14);

      expect(state.snapshot.nodes[0].opacity).toBe(0.6);
    });

    it('E2E-07: User Intent: Complex Sequential Topology Composition', () => {
      let state = createVectorWorkspaceState([r1, r2, p1]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      const resId = state.snapshot.nodes.find(n => n.id.startsWith('path_topo_'))!.id;
      state = selectNodes(state, [resId, 'path_1']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('E2E-08: User Intent: Reverse Path Winding -> JSON Serialization Roundtrip', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.reverseSelectedPathWorkflow(state);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect((restored.snapshot!.nodes[0] as PathNode).d).toContain('Z');
    });

    it('E2E-09: User Intent: Full Lifecycle Boolean Topology -> Grouping -> SVG Export', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<svg');
    });

    it('E2E-10: User Intent: Deep Rollback of Multi-Step Path Topology Pipeline', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      const initial = state.snapshot;

      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot).toEqual(initial);
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (≥20)
  // =========================================================================
  describe('4. Adversarial Scenarios', () => {
    it('ADV-01: handles subdivideSegment with NaN t value', () => {
      const res = VectorPathEngine.subdivideSegment({ x: 0, y: 0 }, undefined, undefined, { x: 100, y: 100 }, NaN);
      expect(res.left.end).toEqual({ x: 50, y: 50 });
    });

    it('ADV-02: handles subdivideSegment with Infinity t value', () => {
      const res = VectorPathEngine.subdivideSegment({ x: 0, y: 0 }, undefined, undefined, { x: 100, y: 100 }, Infinity);
      expect(res.left.end).toEqual({ x: 50, y: 50 });
    });

    it('ADV-03: handles applyCornerSmoothing on null node', () => {
      const res = VectorPathEngine.applyCornerSmoothing(null as any, { radiusPx: 10 });
      expect(res.success).toBe(false);
    });

    it('ADV-04: handles applyCornerSmoothing with negative radius (-50)', () => {
      const res = VectorPathEngine.applyCornerSmoothing(p1, { radiusPx: -50 });
      expect(res.success).toBe(true);
      expect(res.pathNode.cornerRadius).toBe(0);
    });

    it('ADV-05: handles reversePath on null node', () => {
      const res = VectorPathEngine.reversePath(null as any);
      expect(res.success).toBe(false);
    });

    it('ADV-06: handles executeBooleanTopology with empty array', () => {
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([], 'union');
      expect(res.success).toBe(false);
    });

    it('ADV-07: handles executeBooleanTopology with single shape', () => {
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([r1], 'union');
      expect(res.success).toBe(false);
    });

    it('ADV-08: handles executeBooleanTopology with locked shapes', () => {
      const lockedR1: RectangleNode = { ...r1, locked: true };
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([lockedR1, r2], 'union');
      expect(res.success).toBe(false);
    });

    it('ADV-09: handles boolean topology on non-overlapping distant shapes', () => {
      const distantR2: RectangleNode = { ...r2, transform: { ...r2.transform, x: 10000, y: 10000 } };
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([r1, distantR2], 'union');
      expect(res.success).toBe(true);
    });

    it('ADV-10: handles applyBooleanTopologyWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      const initial = state;
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'union');
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-11: handles smoothSelectedPathCornersWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([p1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(state, 10);
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-12: handles reverseSelectedPathWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([p1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.reverseSelectedPathWorkflow(state);
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-13: handles extreme corner radius (1e6 px)', () => {
      const res = VectorPathEngine.applyCornerSmoothing(p1, { radiusPx: 1e6 });
      expect(res.success).toBe(true);
      expect(res.pathNode.cornerRadius).toBe(1e6);
    });

    it('ADV-14: handles extreme control point coordinates (1e9, 1e9)', () => {
      const res = VectorPathEngine.subdivideSegment({ x: 1e9, y: 1e9 }, undefined, undefined, { x: 2e9, y: 2e9 }, 0.5);
      expect(res.left.end.x).toBe(1.5e9);
    });

    it('ADV-15: handles zero-length segment subdivision', () => {
      const res = VectorPathEngine.subdivideSegment({ x: 10, y: 10 }, undefined, undefined, { x: 10, y: 10 }, 0.5);
      expect(res.left.end).toEqual({ x: 10, y: 10 });
    });

    it('ADV-16: handles simplifyPath on node with null d attribute', () => {
      const nullDNode: any = { id: 'p_null', type: 'path' };
      const res = VectorPathEngine.simplifyPath(nullDNode);
      expect(res.success).toBe(false);
    });

    it('ADV-17: handles boolean topology with NaN scale shapes', () => {
      const nanR1: RectangleNode = { ...r1, transform: { ...r1.transform, scaleX: NaN } };
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([nanR1, r2], 'union');
      expect(res.success).toBe(true);
    });

    it('ADV-18: handles boolean topology on zero-dimension shapes', () => {
      const zeroR1: RectangleNode = { ...r1, transform: { ...r1.transform, width: 0, height: 0 } };
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([zeroR1, r2], 'union');
      expect(res.success).toBe(true);
    });

    it('ADV-19: handles reversePath on single-token d string', () => {
      const singleP: PathNode = createPathNode('sp', 'M', 0, 0, 10, 10);
      const res = VectorPathEngine.reversePath(singleP);
      expect(res.success).toBe(true);
    });

    it('ADV-20: handles corner smoothing with NaN radius input', () => {
      const res = VectorPathEngine.applyCornerSmoothing(p1, { radiusPx: NaN });
      expect(res.success).toBe(true);
      expect(res.pathNode.cornerRadius).toBe(0);
    });

    it('ADV-21: handles boolean topology execution with invalid operation parameter', () => {
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([r1, r2], 'UNKNOWN_OP' as any);
      expect(res.success).toBe(false);
    });

    it('ADV-22: handles 20 sequential path corner smoothings safely', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);

      for (let i = 0; i < 20; i++) {
        state = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(state, i + 1);
      }

      expect((state.snapshot.nodes[0] as PathNode).cornerRadius).toBe(20);
    });

    it('ADV-23: handles 20 sequential path reversals safely', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);

      for (let i = 0; i < 20; i++) {
        state = VectorWorkflowOrchestrator.reverseSelectedPathWorkflow(state);
      }

      expect(state.snapshot.nodes.length).toBe(1);
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION POINTS (≥5)
  // =========================================================================
  describe('5. Failure Injection Points', () => {
    it('FI-01: Malformed Path DTO Recovery', () => {
      const malformed: any = { id: 'm1', type: 'path', transform: null };
      const res = VectorPathEngine.applyCornerSmoothing(malformed, { radiusPx: 10 });
      expect(res.success).toBe(true);
    });

    it('FI-02: Control Point Coordinate Corruption (NaN / Infinity)', () => {
      const valid = VectorPathEngine.validateControlPoint({ x: NaN, y: Infinity });
      expect(valid).toBe(false);
    });

    it('FI-03: Invalid Boolean Operand Ingestion', () => {
      const res = VectorBooleanTopologyEngine.executeBooleanTopology([null as any, undefined as any], 'union');
      expect(res.success).toBe(false);
    });

    it('FI-04: History Stack Push Exception Recovery', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);

      const brokenState = {
        ...state,
        historyStack: {
          ...state.historyStack,
          push: () => { throw new Error('Simulated History Stack Failure'); },
        },
      };

      const res = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(brokenState, 10);
      expect(res).toBeDefined();
    });

    it('FI-05: Serialization Exception Recovery', () => {
      const circularPath: any = { id: 'cp', type: 'path', d: 'M 0 0' };
      circularPath.self = circularPath;

      expect(() => VectorDocumentSerializer.serializeVectorDocument({ nodes: [circularPath], selectedIds: [], constraintEdges: [] })).toThrow();
    });
  });
});
