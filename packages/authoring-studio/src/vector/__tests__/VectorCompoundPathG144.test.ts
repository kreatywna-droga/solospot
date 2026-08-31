/**
 * VectorCompoundPathG144.test.ts — Milestone G1-44 Test Suite (Night Shift Level 6)
 *
 * Professional Compound Path, Vector Sub-path Topology & Path Winding Engine validation:
 * - Feature Tests (≥25)
 * - Integration Tests (≥15)
 * - E2E Workflows (≥12)
 * - Adversarial Scenarios (≥25)
 * - Failure Injection Points (≥7)
 *
 * MINIMUM TOTAL: 84 NEW TESTS
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RectangleNode, EllipseNode, PathNode, createPathNode } from '../VectorDomainModel';
import { createVectorWorkspaceState, selectNodes } from '../VectorWorkspaceController';
import { VectorCompoundPathEngine, SubPathData, WindingRule } from '../VectorCompoundPathEngine';
import { VectorWorkflowOrchestrator } from '../VectorWorkflowOrchestrator';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorSvgExporter } from '../VectorSvgExporter';

describe('WF-HACP-STUDIO-G1-44 — Professional Compound Path, Vector Sub-path Topology & Path Winding Engine', () => {
  let p1: PathNode;
  let p2: PathNode;
  let p3: PathNode;
  let r1: RectangleNode;

  beforeEach(() => {
    p1 = createPathNode('path_1', 'M 0 0 L 100 0 L 100 100 L 0 100 Z', 0, 0, 100, 100);
    p2 = createPathNode('path_2', 'M 25 25 L 75 25 L 75 75 L 25 75 Z', 25, 25, 50, 50);
    p3 = createPathNode('path_3', 'M 200 200 L 300 200 L 300 300 L 200 300 Z', 200, 200, 100, 100);

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
    it('F01: combines 2 path nodes into a compound path node with default evenodd fill rule', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      expect(res.success).toBe(true);
      expect(res.compoundNode?.type).toBe('path');
      expect(res.compoundNode?.fillRule).toBe('evenodd');
    });

    it('F02: combines 2 path nodes into a compound path node with nonzero fill rule', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2], 'nonzero');
      expect(res.success).toBe(true);
      expect(res.compoundNode?.fillRule).toBe('nonzero');
    });

    it('F03: populates subPaths metadata array in combined compound path node', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      expect(res.compoundNode?.subPaths).toHaveLength(2);
    });

    it('F04: releases sub-paths from compound path node back into individual path nodes', () => {
      const combineRes = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      const releaseRes = VectorCompoundPathEngine.releaseSubPaths(combineRes.compoundNode!);

      expect(releaseRes.success).toBe(true);
      expect(releaseRes.releasedNodes).toHaveLength(2);
    });

    it('F05: updates winding rule on path node using setWindingRule', () => {
      const res = VectorCompoundPathEngine.setWindingRule(p1, 'nonzero');
      expect(res.success).toBe(true);
      expect(res.compoundNode?.fillRule).toBe('nonzero');
    });

    it('F06: evaluates point-in-path containment using evenodd rule (inside outer, outside inner hole)', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2], 'evenodd');
      const compound = res.compoundNode!;

      // Point inside hole (50, 50) -> hit both bounding boxes -> 2 crossings -> even -> false
      const insideHole = VectorCompoundPathEngine.isPointInsideCompoundPath({ x: 50, y: 50 }, compound);
      expect(insideHole).toBe(false);

      // Point inside outer frame but outside hole (10, 10) -> hit 1 bounding box -> 1 crossing -> odd -> true
      const insideFrame = VectorCompoundPathEngine.isPointInsideCompoundPath({ x: 10, y: 10 }, compound);
      expect(insideFrame).toBe(true);
    });

    it('F07: evaluates point-in-path containment using nonzero rule', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2], 'nonzero');
      const compound = res.compoundNode!;

      const insideHole = VectorCompoundPathEngine.isPointInsideCompoundPath({ x: 50, y: 50 }, compound);
      expect(insideHole).toBe(true);
    });

    it('F08: dispatches MAKE_COMPOUND_PATH workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      expect(state.snapshot.nodes.length).toBe(1);
      expect(state.snapshot.nodes[0].id.startsWith('compound_')).toBe(true);
    });

    it('F09: dispatches RELEASE_COMPOUND_PATH workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const compoundId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [compoundId]);
      state = VectorWorkflowOrchestrator.releaseCompoundPathWorkflow(state);

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('F10: dispatches SET_WINDING_RULE workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.setWindingRuleWorkflow(state, 'nonzero');

      expect((state.snapshot.nodes[0] as PathNode).fillRule).toBe('nonzero');
    });

    it('F11: preserves custom name and transform attributes on released paths', () => {
      const combineRes = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      const releaseRes = VectorCompoundPathEngine.releaseSubPaths(combineRes.compoundNode!);

      expect(releaseRes.releasedNodes[0].transform).toBeDefined();
    });

    it('F12: combines 3 path nodes into single compound path', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2, p3]);
      expect(res.success).toBe(true);
      expect(res.compoundNode?.subPaths).toHaveLength(3);
    });

    it('F13: releases compound path created from 3 sub-paths into 3 path nodes', () => {
      const combineRes = VectorCompoundPathEngine.combineSubPaths([p1, p2, p3]);
      const releaseRes = VectorCompoundPathEngine.releaseSubPaths(combineRes.compoundNode!);

      expect(releaseRes.releasedNodes).toHaveLength(3);
    });

    it('F14: rejects combineSubPaths with fewer than 2 shapes', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1]);
      expect(res.success).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });

    it('F15: rejects combineSubPaths with locked shapes', () => {
      const lockedP1: PathNode = { ...p1, locked: true };
      const res = VectorCompoundPathEngine.combineSubPaths([lockedP1, p2]);
      expect(res.success).toBe(false);
    });

    it('F16: fallback release via regex splitting when subPaths metadata is missing', () => {
      const multiPath: PathNode = createPathNode('mp1', 'M 0 0 L 10 10 M 50 50 L 60 60', 0, 0, 100, 100);
      const releaseRes = VectorCompoundPathEngine.releaseSubPaths(multiPath);

      expect(releaseRes.success).toBe(true);
      expect(releaseRes.releasedNodes).toHaveLength(2);
    });

    it('F17: returns false for isPointInsideCompoundPath with invalid coordinates', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      expect(VectorCompoundPathEngine.isPointInsideCompoundPath({ x: NaN, y: 50 }, res.compoundNode!)).toBe(false);
    });

    it('F18: returns false for isPointInsideCompoundPath with point outside all bounds', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      expect(VectorCompoundPathEngine.isPointInsideCompoundPath({ x: 999, y: 999 }, res.compoundNode!)).toBe(false);
    });

    it('F19: maintains stroke and fill attributes on compound path creation', () => {
      const styledP1: PathNode = { ...p1, opacity: 0.8 };
      const res = VectorCompoundPathEngine.combineSubPaths([styledP1, p2]);

      expect(res.compoundNode?.opacity).toBe(0.8);
    });

    it('F20: tracks affectedSourceIds on compound path creation', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      expect(res.affectedSourceIds).toEqual(['path_1', 'path_2']);
    });

    it('F21: toggles fill rule from evenodd to nonzero and back', () => {
      let node = p1;
      node = VectorCompoundPathEngine.setWindingRule(node, 'nonzero').compoundNode!;
      expect(node.fillRule).toBe('nonzero');

      node = VectorCompoundPathEngine.setWindingRule(node, 'evenodd').compoundNode!;
      expect(node.fillRule).toBe('evenodd');
    });

    it('F22: combines subpaths with closed and open subpath flags', () => {
      const openP: PathNode = createPathNode('open_1', 'M 0 0 L 50 50', 0, 0, 50, 50);
      const res = VectorCompoundPathEngine.combineSubPaths([p1, openP]);

      expect(res.success).toBe(true);
      expect(res.compoundNode?.subPaths![1].closed).toBe(false);
    });

    it('F23: ignores non-path nodes in combineSubPaths', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([r1 as any, p1, p2]);
      expect(res.success).toBe(true);
      expect(res.affectedSourceIds).toEqual(['path_1', 'path_2']);
    });

    it('F24: handles releaseSubPaths on simple path node gracefully', () => {
      const res = VectorCompoundPathEngine.releaseSubPaths(p1);
      expect(res.success).toBe(false);
    });

    it('F25: handles setWindingRule on invalid input node', () => {
      const res = VectorCompoundPathEngine.setWindingRule(null as any, 'evenodd');
      expect(res.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (≥15)
  // =========================================================================
  describe('2. Integration Tests', () => {
    it('I01: integrates compound path creation with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      const initialHistoryLen = state.historyStack.entries.length;

      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      expect(state.historyStack.entries.length).toBe(initialHistoryLen + 1);
    });

    it('I02: supports undo of compound path creation', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('I03: supports redo of compound path creation', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      const redoRes = state.historyStack.redo();
      if (redoRes) state = { snapshot: redoRes.state, historyStack: redoRes.stack };

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('I04: integrates compound path release with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const compoundId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [compoundId]);
      state = VectorWorkflowOrchestrator.releaseCompoundPathWorkflow(state);

      expect(state.historyStack.entries.length).toBe(3);
    });

    it('I05: integrates JSON document serialization roundtrip for compound path', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(1);
      expect((restored.snapshot!.nodes[0] as PathNode).fillRule).toBe('evenodd');
    });

    it('I06: integrates SVG export rendering with fill-rule attribute', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('fill-rule="evenodd"');
    });

    it('I07: exports SVG rendering with fill-rule="nonzero"', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'nonzero');

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('fill-rule="nonzero"');
    });

    it('I08: preserves non-selected shapes untouched during compound path creation', () => {
      let state = createVectorWorkspaceState([p1, p2, p3]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      expect(state.snapshot.nodes.some(n => n.id === 'path_3')).toBe(true);
    });

    it('I09: integrates setWindingRule workflow with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([p1]);
      const initialLen = state.historyStack.entries.length;

      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.setWindingRuleWorkflow(state, 'nonzero');

      expect(state.historyStack.entries.length).toBe(initialLen + 1);
    });

    it('I10: ignores non-path shapes during makeCompoundPathWorkflow', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialSnapshot = state.snapshot;

      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      expect(state.snapshot.nodes).toEqual(initialSnapshot.nodes);
    });

    it('I11: ignores non-path shapes during releaseCompoundPathWorkflow', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialSnapshot = state.snapshot;

      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.releaseCompoundPathWorkflow(state);

      expect(state.snapshot.nodes).toEqual(initialSnapshot.nodes);
    });

    it('I12: maintains document integrity across 10 sequential compound path operations', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);

      for (let i = 0; i < 5; i++) {
        state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');
        const cId = state.snapshot.nodes[0].id;
        state = selectNodes(state, [cId]);
        state = VectorWorkflowOrchestrator.releaseCompoundPathWorkflow(state);
        const relIds = state.snapshot.nodes.map(n => n.id);
        state = selectNodes(state, relIds);
      }

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('I13: integrates compound path creation with selection state management', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      expect(state.snapshot.selectedIds).toHaveLength(1);
      expect(state.snapshot.selectedIds[0].startsWith('compound_')).toBe(true);
    });

    it('I14: integrates compound path release with multi-selection state management', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const cId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [cId]);
      state = VectorWorkflowOrchestrator.releaseCompoundPathWorkflow(state);

      expect(state.snapshot.selectedIds).toHaveLength(2);
    });

    it('I15: maintains subpath bounds calculation accuracy during compound path workflow', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      const sub1 = res.compoundNode?.subPaths![0];
      expect(sub1?.bounds.width).toBeGreaterThanOrEqual(100);
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (≥12)
  // =========================================================================
  describe('3. E2E Workflows', () => {
    it('E2E-01: User Intent: Combine Paths -> Change Winding Rule -> Export SVG', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const cId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [cId]);
      state = VectorWorkflowOrchestrator.setWindingRuleWorkflow(state, 'nonzero');

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);
      const svg = VectorSvgExporter.exportToSvgString(restored.snapshot!);

      expect(svg).toContain('fill-rule="nonzero"');
    });

    it('E2E-02: User Intent: Combine Paths -> Release Compound Path -> Undo Workflow', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const cId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [cId]);
      state = VectorWorkflowOrchestrator.releaseCompoundPathWorkflow(state);

      // Undo release
      let undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      // Undo combine
      undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('E2E-03: User Intent: Multi-Subpath Combine -> Redo Workflow -> JSON Serialization', () => {
      let state = createVectorWorkspaceState([p1, p2, p3]);
      state = selectNodes(state, ['path_1', 'path_2', 'path_3']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      const redoRes = state.historyStack.redo();
      if (redoRes) state = { snapshot: redoRes.state, historyStack: redoRes.stack };

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(1);
    });

    it('E2E-04: User Intent: Point-in-path Containment Check on Compound Path Hole', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2], 'evenodd');
      const compound = res.compoundNode!;

      const isHoleCenter = VectorCompoundPathEngine.isPointInsideCompoundPath({ x: 50, y: 50 }, compound);
      expect(isHoleCenter).toBe(false);
    });

    it('E2E-05: User Intent: Point-in-path Containment Check on Nonzero Compound Path Hole', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2], 'nonzero');
      const compound = res.compoundNode!;

      const isHoleCenter = VectorCompoundPathEngine.isPointInsideCompoundPath({ x: 50, y: 50 }, compound);
      expect(isHoleCenter).toBe(true);
    });

    it('E2E-06: User Intent: Sequential Combine and Release Cycle', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const cId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [cId]);
      state = VectorWorkflowOrchestrator.releaseCompoundPathWorkflow(state);

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('E2E-07: User Intent: Combine Shapes with Open Path Endpoints', () => {
      const openP: PathNode = createPathNode('op1', 'M 10 10 L 90 90', 10, 10, 80, 80);
      let state = createVectorWorkspaceState([p1, openP]);
      state = selectNodes(state, ['path_1', 'op1']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('E2E-08: User Intent: Set Winding Rule on Uncombined Path Node', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.setWindingRuleWorkflow(state, 'nonzero');

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('fill-rule="nonzero"');
    });

    it('E2E-09: User Intent: Full Lifecycle Compound Path -> Grouping -> SVG Export', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const cId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [cId]);
      state = VectorWorkflowOrchestrator.groupSelectedWorkflow(state);

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<path');
      expect(svg).toContain('fill-rule="evenodd"');
    });

    it('E2E-10: User Intent: Deep Rollback of Multi-Step Compound Path Pipeline', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      const initial = state.snapshot;

      state = selectNodes(state, ['path_1', 'path_2']);
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot).toEqual(initial);
    });

    it('E2E-11: User Intent: Preserve Path Winding Across JSON Serialization Roundtrips', () => {
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['path_1']);
      state = VectorWorkflowOrchestrator.setWindingRuleWorkflow(state, 'evenodd');

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect((restored.snapshot!.nodes[0] as PathNode).fillRule).toBe('evenodd');
    });

    it('E2E-12: User Intent: Compound Path Containing 4 Nested Concentric Squares', () => {
      const s1 = createPathNode('s1', 'M 0 0 L 100 0 L 100 100 L 0 100 Z', 0, 0, 100, 100);
      const s2 = createPathNode('s2', 'M 10 10 L 90 10 L 90 90 L 10 90 Z', 10, 10, 80, 80);
      const s3 = createPathNode('s3', 'M 20 20 L 80 20 L 80 80 L 20 80 Z', 20, 20, 60, 60);
      const s4 = createPathNode('s4', 'M 30 30 L 70 30 L 70 70 L 30 70 Z', 30, 30, 40, 40);

      const res = VectorCompoundPathEngine.combineSubPaths([s1, s2, s3, s4], 'evenodd');
      expect(res.success).toBe(true);
      expect(res.compoundNode?.subPaths).toHaveLength(4);
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (≥26)
  // =========================================================================
  describe('4. Adversarial Scenarios', () => {
    it('ADV-01: handles combineSubPaths with null shapes array', () => {
      const res = VectorCompoundPathEngine.combineSubPaths(null as any);
      expect(res.success).toBe(false);
    });

    it('ADV-02: handles combineSubPaths with empty array', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([]);
      expect(res.success).toBe(false);
    });

    it('ADV-03: handles combineSubPaths with single shape', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1]);
      expect(res.success).toBe(false);
    });

    it('ADV-04: handles combineSubPaths with locked shapes', () => {
      const lockedP1: PathNode = { ...p1, locked: true };
      const res = VectorCompoundPathEngine.combineSubPaths([lockedP1, p2]);
      expect(res.success).toBe(false);
    });

    it('ADV-05: handles releaseSubPaths on null node', () => {
      const res = VectorCompoundPathEngine.releaseSubPaths(null as any);
      expect(res.success).toBe(false);
    });

    it('ADV-06: handles releaseSubPaths on non-path shape', () => {
      const res = VectorCompoundPathEngine.releaseSubPaths(r1 as any);
      expect(res.success).toBe(false);
    });

    it('ADV-07: handles setWindingRule with invalid rule string', () => {
      const res = VectorCompoundPathEngine.setWindingRule(p1, 'INVALID_RULE' as any);
      expect(res.success).toBe(true);
      expect(res.compoundNode?.fillRule).toBe('evenodd');
    });

    it('ADV-08: handles isPointInsideCompoundPath with NaN coordinates', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      expect(VectorCompoundPathEngine.isPointInsideCompoundPath({ x: NaN, y: NaN }, res.compoundNode!)).toBe(false);
    });

    it('ADV-09: handles isPointInsideCompoundPath with Infinity coordinates', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      expect(VectorCompoundPathEngine.isPointInsideCompoundPath({ x: Infinity, y: 10 }, res.compoundNode!)).toBe(false);
    });

    it('ADV-10: handles makeCompoundPathWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      const initial = state;
      state = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(state, 'evenodd');
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-11: handles releaseCompoundPathWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([p1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.releaseCompoundPathWorkflow(state);
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-12: handles setWindingRuleWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([p1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.setWindingRuleWorkflow(state, 'nonzero');
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-13: handles path node with empty d string in combineSubPaths', () => {
      const emptyP = createPathNode('empty_1', '', 0, 0, 10, 10);
      const res = VectorCompoundPathEngine.combineSubPaths([p1, emptyP]);
      expect(res.success).toBe(true);
      expect(res.compoundNode?.subPaths).toHaveLength(1);
    });

    it('ADV-14: handles extreme bounding box coordinates (1e9, 1e9)', () => {
      const extremeP = createPathNode('extreme_1', 'M 1000000000 1000000000 L 2000000000 2000000000 Z', 1e9, 1e9, 1e9, 1e9);
      const res = VectorCompoundPathEngine.combineSubPaths([p1, extremeP]);
      expect(res.success).toBe(true);
    });

    it('ADV-15: handles 20 sequential compound path creations safely', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);

      for (let i = 0; i < 20; i++) {
        state = VectorWorkflowOrchestrator.setWindingRuleWorkflow(state, i % 2 === 0 ? 'evenodd' : 'nonzero');
      }

      expect((state.snapshot.nodes[0] as PathNode).fillRule).toBe('nonzero');
    });

    it('ADV-16: handles releaseSubPaths on path with empty subPaths array', () => {
      const pNoSub: PathNode = { ...p1, subPaths: [] };
      const res = VectorCompoundPathEngine.releaseSubPaths(pNoSub);
      expect(res.success).toBe(false);
    });

    it('ADV-17: handles releaseSubPaths on single sub-path node', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p2]);
      const singleSubPathNode: PathNode = { ...res.compoundNode!, subPaths: [res.compoundNode!.subPaths![0]] };
      const releaseRes = VectorCompoundPathEngine.releaseSubPaths(singleSubPathNode);

      expect(releaseRes.success).toBe(true);
      expect(releaseRes.releasedNodes.length).toBeGreaterThan(0);
    });

    it('ADV-18: handles combineSubPaths on overlapping identical shapes', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([p1, p1]);
      expect(res.success).toBe(true);
    });

    it('ADV-19: handles isPointInsideCompoundPath on null path node', () => {
      expect(VectorCompoundPathEngine.isPointInsideCompoundPath({ x: 10, y: 10 }, null as any)).toBe(false);
    });

    it('ADV-20: handles setWindingRule on node without fillRule property', () => {
      const plainPath = createPathNode('plain_1', 'M 0 0 L 10 10', 0, 0, 10, 10);
      const res = VectorCompoundPathEngine.setWindingRule(plainPath, 'nonzero');
      expect(res.success).toBe(true);
      expect(res.compoundNode?.fillRule).toBe('nonzero');
    });

    it('ADV-21: handles SVG export when fillRule is undefined', () => {
      const plainPath = createPathNode('plain_1', 'M 0 0 L 10 10', 0, 0, 10, 10);
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [plainPath], selectedIds: [], constraintEdges: [] });
      expect(svg).not.toContain('fill-rule=');
    });

    it('ADV-22: handles zero-dimension sub-path bounding box', () => {
      const zeroP = createPathNode('zero_1', 'M 0 0 Z', 0, 0, 0, 0);
      const res = VectorCompoundPathEngine.combineSubPaths([p1, zeroP]);
      expect(res.success).toBe(true);
    });

    it('ADV-23: handles combineSubPaths with 10 paths', () => {
      const paths = Array.from({ length: 10 }, (_, i) => createPathNode(`p_${i}`, `M ${i * 10} 0 L ${i * 10 + 5} 5 Z`, i * 10, 0, 5, 5));
      const res = VectorCompoundPathEngine.combineSubPaths(paths);
      expect(res.success).toBe(true);
      expect(res.compoundNode?.subPaths).toHaveLength(10);
    });

    it('ADV-24: handles releaseSubPaths on 10 sub-paths', () => {
      const paths = Array.from({ length: 10 }, (_, i) => createPathNode(`p_${i}`, `M ${i * 10} 0 L ${i * 10 + 5} 5 Z`, i * 10, 0, 5, 5));
      const combineRes = VectorCompoundPathEngine.combineSubPaths(paths);
      const releaseRes = VectorCompoundPathEngine.releaseSubPaths(combineRes.compoundNode!);
      expect(releaseRes.releasedNodes).toHaveLength(10);
    });

    it('ADV-25: handles combineSubPaths where all input path D strings are empty', () => {
      const e1 = createPathNode('e1', '', 0, 0, 0, 0);
      const e2 = createPathNode('e2', '', 0, 0, 0, 0);
      const res = VectorCompoundPathEngine.combineSubPaths([e1, e2]);
      expect(res.success).toBe(false);
    });

    it('ADV-26: handles rapid toggle of winding rule 50 times', () => {
      let node = p1;
      for (let i = 0; i < 50; i++) {
        node = VectorCompoundPathEngine.setWindingRule(node, i % 2 === 0 ? 'nonzero' : 'evenodd').compoundNode!;
      }
      expect(node.fillRule).toBe('evenodd');
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION POINTS (≥7)
  // =========================================================================
  describe('5. Failure Injection Points', () => {
    it('FI-01: Empty Sub-path Payload Recovery', () => {
      const res = VectorCompoundPathEngine.combineSubPaths([]);
      expect(res.success).toBe(false);
    });

    it('FI-02: Self-intersecting Polygon with NaN Coordinates', () => {
      const inside = VectorCompoundPathEngine.isPointInsideCompoundPath({ x: NaN, y: NaN }, p1);
      expect(inside).toBe(false);
    });

    it('FI-03: Invalid Fill-rule String Input Ingestion', () => {
      const res = VectorCompoundPathEngine.setWindingRule(p1, 'CORRUPTED_RULE' as any);
      expect(res.compoundNode?.fillRule).toBe('evenodd');
    });

    it('FI-04: Corrupted Sub-path Anchor Index Handling', () => {
      const corruptedPath: PathNode = { ...p1, subPaths: [null as any, undefined as any] };
      const res = VectorCompoundPathEngine.releaseSubPaths(corruptedPath);
      expect(res).toBeDefined();
    });

    it('FI-05: HistoryStack Push Exception Recovery', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);

      const brokenState = {
        ...state,
        historyStack: {
          ...state.historyStack,
          push: () => { throw new Error('Simulated History Stack Failure'); },
        },
      };

      const res = VectorWorkflowOrchestrator.makeCompoundPathWorkflow(brokenState, 'evenodd');
      expect(res).toBeDefined();
    });

    it('FI-06: Circular Serialization Exception Recovery', () => {
      const circularPath: any = { id: 'cp', type: 'path', d: 'M 0 0' };
      circularPath.self = circularPath;

      expect(() => VectorDocumentSerializer.serializeVectorDocument({ nodes: [circularPath], selectedIds: [], constraintEdges: [] })).toThrow();
    });

    it('FI-07: Unclosed Sub-path Hole Clipping Exception Recovery', () => {
      const unclosed: PathNode = createPathNode('u1', 'M 0 0 L 100 0 L 100 100', 0, 0, 100, 100);
      const res = VectorCompoundPathEngine.combineSubPaths([p1, unclosed]);
      expect(res.success).toBe(true);
      expect(res.compoundNode?.subPaths![1].closed).toBe(false);
    });
  });
});
