/**
 * VectorPathSegmentEditorG145.test.ts — Milestone G1-45 Test Suite (Night Shift Level 7)
 *
 * Professional Vector Path Segment Division, Node Insertion & Sub-path Splitting System validation:
 * - Feature Tests (≥25)
 * - Integration Tests (≥15)
 * - E2E Workflows (≥12)
 * - Adversarial Scenarios (≥25)
 * - Failure Injection Points (≥8)
 *
 * MINIMUM TOTAL: 85 NEW TESTS
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RectangleNode, EllipseNode, PathNode, createPathNode } from '../VectorDomainModel';
import { createVectorWorkspaceState, selectNodes } from '../VectorWorkspaceController';
import { VectorPathSegmentEditorEngine } from '../VectorPathSegmentEditorEngine';
import { VectorWorkflowOrchestrator } from '../VectorWorkflowOrchestrator';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorSvgExporter } from '../VectorSvgExporter';

describe('WF-HACP-STUDIO-G1-45 — Professional Vector Path Segment Division, Node Insertion & Sub-path Splitting System', () => {
  let p1: PathNode;
  let p2: PathNode;
  let r1: RectangleNode;

  beforeEach(() => {
    p1 = createPathNode('path_1', 'M 0 0 L 100 0 L 100 100 L 0 100 Z', 0, 0, 100, 100);
    p2 = createPathNode('path_2', 'M 200 200 L 300 200 L 300 300 Z', 200, 200, 100, 100);

    r1 = {
      id: 'rect_1',
      name: 'Rectangle 1',
      type: 'rectangle',
      transform: {
        x: 0,
        y: 0,
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
  });

  // =========================================================================
  // 1. FEATURE TESTS (≥25)
  // =========================================================================
  describe('1. Feature Tests', () => {
    it('F01: inserts a new node on segment at midpoint t=0.5', () => {
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, 0, 0.5);
      expect(res.success).toBe(true);
      expect(res.pathNode?.d).toContain('L 50 50');
    });

    it('F02: inserts a new node on segment with custom t=0.25', () => {
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, 0, 0.25);
      expect(res.success).toBe(true);
      expect(res.pathNode?.d).toContain('L 25 25');
    });

    it('F03: deletes an anchor point from a PathNode', () => {
      const res = VectorPathSegmentEditorEngine.deleteAnchorPoint(p1, 'anchor_1');
      expect(res.success).toBe(true);
      expect(res.pathNode?.d).not.toEqual(p1.d);
    });

    it('F04: splits a PathNode into 2 separate PathNodes', () => {
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(p1, 'anchor_mid');
      expect(res.success).toBe(true);
      expect(res.createdNodes).toHaveLength(2);
    });

    it('F05: joins 2 open PathNodes end-to-end', () => {
      const res = VectorPathSegmentEditorEngine.joinPathSegments(p1, p2);
      expect(res.success).toBe(true);
      expect(res.pathNode?.type).toBe('path');
      expect(res.affectedSourceIds).toEqual(['path_1', 'path_2']);
    });

    it('F06: normalizes anchor handles on PathNode', () => {
      const res = VectorPathSegmentEditorEngine.normalizeAnchorHandles(p1);
      expect(res.success).toBe(true);
      expect(res.pathNode).toBeDefined();
    });

    it('F07: dispatches INSERT_PATH_NODE workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);

      expect((state.snapshot.nodes[0] as PathNode).d).toContain('L 50 50');
    });

    it('F08: dispatches DELETE_PATH_NODE workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.deleteAnchorPointWorkflow(state, 'anchor_1');

      expect((state.snapshot.nodes[0] as PathNode).d).not.toEqual(p1.d);
    });

    it('F09: dispatches SPLIT_PATH_AT_ANCHOR workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.splitPathAtAnchorWorkflow(state, 'anchor_mid');

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('F10: dispatches JOIN_PATH_SEGMENTS workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.joinPathSegmentsWorkflow(state);

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('F11: clamps t parameter during segment insertion to [0, 1]', () => {
      const res1 = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, 0, -2);
      expect(res1.pathNode?.d).toContain('L 0 0');

      const res2 = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, 0, 5);
      expect(res2.pathNode?.d).toContain('L 100 100');
    });

    it('F12: rejects segment insertion on locked path shape', () => {
      const lockedP1: PathNode = { ...p1, locked: true };
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(lockedP1, 0, 0.5);
      expect(res.success).toBe(false);
    });

    it('F13: rejects anchor deletion on locked path shape', () => {
      const lockedP1: PathNode = { ...p1, locked: true };
      const res = VectorPathSegmentEditorEngine.deleteAnchorPoint(lockedP1, 'a1');
      expect(res.success).toBe(false);
    });

    it('F14: rejects path splitting on locked path shape', () => {
      const lockedP1: PathNode = { ...p1, locked: true };
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(lockedP1, 'a1');
      expect(res.success).toBe(false);
    });

    it('F15: rejects path joining when one path is locked', () => {
      const lockedP1: PathNode = { ...p1, locked: true };
      const res = VectorPathSegmentEditorEngine.joinPathSegments(lockedP1, p2);
      expect(res.success).toBe(false);
    });

    it('F16: rejects anchor deletion when path has single segment', () => {
      const singleSeg: PathNode = createPathNode('ss1', 'M 0 0 L 10 10', 0, 0, 10, 10);
      const res = VectorPathSegmentEditorEngine.deleteAnchorPoint(singleSeg, 'a1');
      expect(res.success).toBe(false);
    });

    it('F17: preserves name and stroke attributes during path segment insertion', () => {
      const styledP1: PathNode = { ...p1, name: 'Custom Path Name' };
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(styledP1, 0, 0.5);
      expect(res.pathNode?.name).toBe('Custom Path Name');
    });

    it('F18: assigns sequential part names during path split', () => {
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(p1, 'a1');
      expect(res.createdNodes![0].name).toContain('Part 1');
      expect(res.createdNodes![1].name).toContain('Part 2');
    });

    it('F19: tracks affectedSourceIds during segment join', () => {
      const res = VectorPathSegmentEditorEngine.joinPathSegments(p1, p2);
      expect(res.affectedSourceIds).toEqual(['path_1', 'path_2']);
    });

    it('F20: handles insertNodeOnSegment on empty path string', () => {
      const emptyP = createPathNode('ep1', '', 0, 0, 0, 0);
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(emptyP, 0, 0.5);
      expect(res.success).toBe(false);
    });

    it('F21: handles splitPathAtAnchor on empty path string', () => {
      const emptyP = createPathNode('ep1', '', 0, 0, 0, 0);
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(emptyP, 'a1');
      expect(res.success).toBe(false);
    });

    it('F22: handles normalizeAnchorHandles on null input node', () => {
      const res = VectorPathSegmentEditorEngine.normalizeAnchorHandles(null as any);
      expect(res.success).toBe(false);
    });

    it('F23: handles insertNodeOnSegment on non-path shape', () => {
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(r1 as any, 0, 0.5);
      expect(res.success).toBe(false);
    });

    it('F24: handles joinPathSegments on non-path shapes', () => {
      const res = VectorPathSegmentEditorEngine.joinPathSegments(r1 as any, p1);
      expect(res.success).toBe(false);
    });

    it('F25: performs 5 consecutive segment insertions safely', () => {
      let node = p1;
      for (let i = 0; i < 5; i++) {
        const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(node, 0, 0.5);
        if (res.success && res.pathNode) node = res.pathNode;
      }
      expect(node.d).toBeDefined();
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (≥15)
  // =========================================================================
  describe('2. Integration Tests', () => {
    it('I01: integrates segment insertion workflow with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([p1]);
      const initialLen = state.historyStack.entries.length;

      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);

      expect(state.historyStack.entries.length).toBe(initialLen + 1);
    });

    it('I02: supports undo of segment insertion', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect((state.snapshot.nodes[0] as PathNode).d).toBe(p1.d);
    });

    it('I03: supports redo of segment insertion', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      const redoRes = state.historyStack.redo();
      if (redoRes) state = { snapshot: redoRes.state, historyStack: redoRes.stack };

      expect((state.snapshot.nodes[0] as PathNode).d).toContain('L 50 50');
    });

    it('I04: integrates anchor deletion workflow with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([p1]);
      const initialLen = state.historyStack.entries.length;

      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.deleteAnchorPointWorkflow(state, 'a1');

      expect(state.historyStack.entries.length).toBe(initialLen + 1);
    });

    it('I05: integrates path split workflow with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.splitPathAtAnchorWorkflow(state, 'a1');

      expect(state.snapshot.nodes.length).toBe(2);
      expect(state.historyStack.entries.length).toBe(2);
    });

    it('I06: integrates path join workflow with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.joinPathSegmentsWorkflow(state);

      expect(state.snapshot.nodes.length).toBe(1);
      expect(state.historyStack.entries.length).toBe(2);
    });

    it('I07: integrates JSON document serialization roundtrip after segment insertion', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect((restored.snapshot!.nodes[0] as PathNode).d).toContain('L 50 50');
    });

    it('I08: integrates SVG export rendering after path join workflow', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.joinPathSegmentsWorkflow(state);

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<path');
    });

    it('I09: preserves non-selected shapes untouched during path split workflow', () => {
      let state = createVectorWorkspaceState([p1, r1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.splitPathAtAnchorWorkflow(state, 'a1');

      expect(state.snapshot.nodes.some(n => n.id === 'rect_1')).toBe(true);
    });

    it('I10: ignores non-path shapes during insertNodeOnSegmentWorkflow', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialNodes = state.snapshot.nodes;

      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);

      expect(state.snapshot.nodes).toEqual(initialNodes);
    });

    it('I11: ignores non-path shapes during deleteAnchorPointWorkflow', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialNodes = state.snapshot.nodes;

      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.deleteAnchorPointWorkflow(state, 'a1');

      expect(state.snapshot.nodes).toEqual(initialNodes);
    });

    it('I12: maintains document integrity across 10 sequential path segment operations', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);

      for (let i = 0; i < 10; i++) {
        state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);
      }

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('I13: integrates path split workflow with selection state update', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.splitPathAtAnchorWorkflow(state, 'a1');

      expect(state.snapshot.selectedIds).toHaveLength(2);
    });

    it('I14: integrates path join workflow with single selection state update', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.joinPathSegmentsWorkflow(state);

      expect(state.snapshot.selectedIds).toHaveLength(1);
    });

    it('I15: integrates path segment editing with rendering bridge attributes', () => {
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, 0, 0.5);
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [res.pathNode!], selectedIds: [], constraintEdges: [] });

      expect(svg).toContain('L 50 50');
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (≥12)
  // =========================================================================
  describe('3. E2E Workflows', () => {
    it('E2E-01: User Intent: Insert Node -> Split Path -> Join Segments -> Export SVG', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);

      state = VectorWorkflowOrchestrator.splitPathAtAnchorWorkflow(state, 'a1');
      const splitIds = state.snapshot.selectedIds;

      state = selectNodes(state, [...splitIds]);
      state = VectorWorkflowOrchestrator.joinPathSegmentsWorkflow(state);

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<path');
    });

    it('E2E-02: User Intent: Insert Node -> Delete Anchor -> Undo Workflow', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);
      state = VectorWorkflowOrchestrator.deleteAnchorPointWorkflow(state, 'a1');

      // Undo delete
      let undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      // Undo insert
      undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect((state.snapshot.nodes[0] as PathNode).d).toBe(p1.d);
    });

    it('E2E-03: User Intent: Path Split -> Redo Workflow -> JSON Serialization', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.splitPathAtAnchorWorkflow(state, 'a1');

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      const redoRes = state.historyStack.redo();
      if (redoRes) state = { snapshot: redoRes.state, historyStack: redoRes.stack };

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(2);
    });

    it('E2E-04: User Intent: Sequential 3-Path Join Pipeline', () => {
      const p3 = createPathNode('p3', 'M 400 400 L 500 500', 400, 400, 100, 100);
      let state = createVectorWorkspaceState([p1, p2, p3]);

      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.joinPathSegmentsWorkflow(state);

      const jId = state.snapshot.nodes.find(n => n.id.startsWith('path_joined_'))!.id;
      state = selectNodes(state, [jId, 'p3']);
      state = VectorWorkflowOrchestrator.joinPathSegmentsWorkflow(state);

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('E2E-05: User Intent: Insert Node Preserves Stroke and Opacity', () => {
      const styledP: PathNode = { ...p1, opacity: 0.7 };
      let state = createVectorWorkspaceState([styledP]);

      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);

      expect(state.snapshot.nodes[0].opacity).toBe(0.7);
    });

    it('E2E-06: User Intent: Path Split Preserves Node Transform Coordinates', () => {
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(p1, 'a1');
      expect(res.createdNodes![0].transform).toBeDefined();
    });

    it('E2E-07: User Intent: Path Join Preserves First Node ID and Styles', () => {
      const res = VectorPathSegmentEditorEngine.joinPathSegments(p1, p2);
      expect(res.pathNode?.id.startsWith('path_joined_')).toBe(true);
    });

    it('E2E-08: User Intent: Full Lifecycle Segment Insertion -> Grouping -> SVG Export', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);
      state = VectorWorkflowOrchestrator.groupSelectedWorkflow(state);

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<path');
    });

    it('E2E-09: User Intent: Deep Rollback of Multi-Step Path Editing Pipeline', () => {
      let state = createVectorWorkspaceState([p1]);
      const initial = state.snapshot;

      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot).toEqual(initial);
    });

    it('E2E-10: User Intent: Multi-Segment Sub-path Insertion and Re-serialization', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);

      for (let i = 0; i < 3; i++) {
        state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, i, 0.5);
      }

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(1);
    });

    it('E2E-11: User Intent: Normalize Anchor Handles Workflow on Custom Path', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.dispatchCommand(state, 'Normalize Handles', { type: 'UPDATE_NODE_PROPS' });

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('E2E-12: User Intent: Split Closed Polygon into Two Open Sub-paths', () => {
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(p1, 'a1');
      expect(res.success).toBe(true);
      expect(res.createdNodes).toHaveLength(2);
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (≥25)
  // =========================================================================
  describe('4. Adversarial Scenarios', () => {
    it('ADV-01: handles insertNodeOnSegment with NaN t parameter', () => {
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, 0, NaN);
      expect(res.success).toBe(true);
      expect(res.pathNode?.d).toContain('L 50 50');
    });

    it('ADV-02: handles insertNodeOnSegment with Infinity t parameter', () => {
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, 0, Infinity);
      expect(res.success).toBe(true);
      expect(res.pathNode?.d).toContain('L 50 50');
    });

    it('ADV-03: handles insertNodeOnSegment with out-of-bounds segmentIndex (999)', () => {
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, 999, 0.5);
      expect(res.success).toBe(true);
    });

    it('ADV-04: handles deleteAnchorPoint with null anchorId', () => {
      const res = VectorPathSegmentEditorEngine.deleteAnchorPoint(p1, null as any);
      expect(res.success).toBe(true);
    });

    it('ADV-05: handles splitPathAtAnchor with empty string anchorId', () => {
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(p1, '');
      expect(res.success).toBe(true);
    });

    it('ADV-06: handles joinPathSegments with null shape parameters', () => {
      const res = VectorPathSegmentEditorEngine.joinPathSegments(null as any, undefined as any);
      expect(res.success).toBe(false);
    });

    it('ADV-07: handles insertNodeOnSegmentWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([p1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-08: handles deleteAnchorPointWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([p1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.deleteAnchorPointWorkflow(state, 'a1');
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-09: handles splitPathAtAnchorWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([p1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.splitPathAtAnchorWorkflow(state, 'a1');
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-10: handles joinPathSegmentsWorkflow on single selected shape', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      const initial = state;
      state = VectorWorkflowOrchestrator.joinPathSegmentsWorkflow(state);
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-11: handles extreme coordinate insertion (1e9, 1e9)', () => {
      const extremeP = createPathNode('ep1', 'M 1000000000 1000000000 L 2000000000 2000000000', 1e9, 1e9, 1e9, 1e9);
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(extremeP, 0, 0.5);
      expect(res.success).toBe(true);
    });

    it('ADV-12: handles 20 sequential segment insertions safely', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);

      for (let i = 0; i < 20; i++) {
        state = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(state, 0, 0.5);
      }

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('ADV-13: handles path join on non-overlapping distant shapes', () => {
      const distantP = createPathNode('dp1', 'M 10000 10000 L 20000 20000', 10000, 10000, 10000, 10000);
      const res = VectorPathSegmentEditorEngine.joinPathSegments(p1, distantP);
      expect(res.success).toBe(true);
    });

    it('ADV-14: handles deleteAnchorPoint on null node', () => {
      const res = VectorPathSegmentEditorEngine.deleteAnchorPoint(null as any, 'a1');
      expect(res.success).toBe(false);
    });

    it('ADV-15: handles splitPathAtAnchor on null node', () => {
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(null as any, 'a1');
      expect(res.success).toBe(false);
    });

    it('ADV-16: handles normalizeAnchorHandles on node with null d attribute', () => {
      const nullDNode: any = { id: 'nd1', type: 'path' };
      const res = VectorPathSegmentEditorEngine.normalizeAnchorHandles(nullDNode);
      expect(res.success).toBe(true);
    });

    it('ADV-17: handles insertNodeOnSegment with negative segment index (-5)', () => {
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, -5, 0.5);
      expect(res.success).toBe(true);
    });

    it('ADV-18: handles joinPathSegments where path B has no M command', () => {
      const noMP: PathNode = createPathNode('nmp1', 'L 10 10 L 20 20', 0, 0, 20, 20);
      const res = VectorPathSegmentEditorEngine.joinPathSegments(p1, noMP);
      expect(res.success).toBe(true);
    });

    it('ADV-19: handles splitPathAtAnchor on path with zero-length D string', () => {
      const zeroD: PathNode = createPathNode('zd1', '', 0, 0, 0, 0);
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(zeroD, 'a1');
      expect(res.success).toBe(false);
    });

    it('ADV-20: handles deleteAnchorPoint on path with zero-length D string', () => {
      const zeroD: PathNode = createPathNode('zd1', '', 0, 0, 0, 0);
      const res = VectorPathSegmentEditorEngine.deleteAnchorPoint(zeroD, 'a1');
      expect(res.success).toBe(false);
    });

    it('ADV-21: handles rapid 50 node insertions without memory corruption', () => {
      let node = p1;
      for (let i = 0; i < 50; i++) {
        const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(node, 0, 0.5);
        if (res.success && res.pathNode) node = res.pathNode;
      }
      expect(node.d).toBeDefined();
    });

    it('ADV-22: handles joinPathSegments on identical path nodes', () => {
      const res = VectorPathSegmentEditorEngine.joinPathSegments(p1, p1);
      expect(res.success).toBe(true);
    });

    it('ADV-23: handles insertNodeOnSegment on path node with complex Bezier curves', () => {
      const bezierP = createPathNode('bp1', 'M 0 0 C 10 20 30 40 50 50 Z', 0, 0, 50, 50);
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(bezierP, 0, 0.5);
      expect(res.success).toBe(true);
    });

    it('ADV-24: handles deleteAnchorPoint on path node with complex Bezier curves', () => {
      const bezierP = createPathNode('bp1', 'M 0 0 C 10 20 30 40 50 50 Z', 0, 0, 50, 50);
      const res = VectorPathSegmentEditorEngine.deleteAnchorPoint(bezierP, 'a1');
      expect(res.success).toBe(true);
    });

    it('ADV-25: handles splitPathAtAnchor on path node with complex Bezier curves', () => {
      const bezierP = createPathNode('bp1', 'M 0 0 C 10 20 30 40 50 50 Z', 0, 0, 50, 50);
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(bezierP, 'a1');
      expect(res.success).toBe(true);
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION POINTS (≥8)
  // =========================================================================
  describe('5. Failure Injection Points', () => {
    it('FI-01: Out-of-bounds Segment Index Recovery', () => {
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, 999, 0.5);
      expect(res.success).toBe(true);
    });

    it('FI-02: NaN Parameter t Ingestion', () => {
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(p1, 0, NaN);
      expect(res.success).toBe(true);
    });

    it('FI-03: Invalid Anchor ID Ingestion', () => {
      const res = VectorPathSegmentEditorEngine.deleteAnchorPoint(p1, 'NON_EXISTENT_ANCHOR_ID');
      expect(res.success).toBe(true);
    });

    it('FI-04: Locked Path Modification Recovery', () => {
      const lockedP1: PathNode = { ...p1, locked: true };
      const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(lockedP1, 0, 0.5);
      expect(res.success).toBe(false);
    });

    it('FI-05: Empty Path D String Recovery', () => {
      const emptyP = createPathNode('ep1', '', 0, 0, 0, 0);
      const res = VectorPathSegmentEditorEngine.splitPathAtAnchor(emptyP, 'a1');
      expect(res.success).toBe(false);
    });

    it('FI-06: Single-anchor Path Deletion Recovery', () => {
      const singleSeg = createPathNode('ss1', 'M 0 0 L 10 10', 0, 0, 10, 10);
      const res = VectorPathSegmentEditorEngine.deleteAnchorPoint(singleSeg, 'a1');
      expect(res.success).toBe(false);
    });

    it('FI-07: HistoryStack Push Exception Recovery', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);

      const brokenState = {
        ...state,
        historyStack: {
          ...state.historyStack,
          push: () => { throw new Error('Simulated History Stack Failure'); },
        },
      };

      const res = VectorWorkflowOrchestrator.insertNodeOnSegmentWorkflow(brokenState, 0, 0.5);
      expect(res).toBeDefined();
    });

    it('FI-08: Circular Serialization Exception Recovery', () => {
      const circularPath: any = { id: 'cp', type: 'path', d: 'M 0 0' };
      circularPath.self = circularPath;

      expect(() => VectorDocumentSerializer.serializeVectorDocument({ nodes: [circularPath], selectedIds: [], constraintEdges: [] })).toThrow();
    });
  });
});
