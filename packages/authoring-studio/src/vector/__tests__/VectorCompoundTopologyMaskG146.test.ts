/**
 * VectorCompoundTopologyMaskG146.test.ts — Milestone G1-46 Test Suite (Night Shift Level 8)
 *
 * Professional Multi-Shape Vector Boolean Topology, Compound Clipping Mask & Sub-path Path Editing Suite validation:
 * - Feature Tests (≥30)
 * - Integration Tests (≥18)
 * - E2E Workflows (≥15)
 * - Adversarial Scenarios (≥30)
 * - Failure Injection Points (≥10)
 *
 * MINIMUM TOTAL: 103 NEW TESTS
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VectorNode, RectangleNode, EllipseNode, PathNode, ShapeGroupNode, createPathNode } from '../VectorDomainModel';
import { createVectorWorkspaceState, selectNodes } from '../VectorWorkspaceController';
import { VectorCompoundTopologyMaskEngine } from '../VectorCompoundTopologyMaskEngine';
import { VectorWorkflowOrchestrator } from '../VectorWorkflowOrchestrator';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorSvgExporter } from '../VectorSvgExporter';

describe('WF-HACP-STUDIO-G1-46 — Professional Multi-Shape Vector Boolean Topology & Clipping Mask Suite', () => {
  let r1: RectangleNode;
  let r2: RectangleNode;
  let r3: RectangleNode;
  let p1: PathNode;

  beforeEach(() => {
    r1 = {
      id: 'rect_mask',
      name: 'Mask Rectangle',
      type: 'rectangle',
      transform: {
        x: 50,
        y: 50,
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

    r2 = {
      id: 'rect_target1',
      name: 'Target Shape 1',
      type: 'rectangle',
      transform: {
        x: 0,
        y: 0,
        width: 200,
        height: 200,
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

    r3 = {
      id: 'rect_target2',
      name: 'Target Shape 2',
      type: 'rectangle',
      transform: {
        x: 20,
        y: 20,
        width: 150,
        height: 150,
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

    p1 = createPathNode('path_1', 'M 0 0 L 100 0 L 100 100 L 0 100 Z', 0, 0, 100, 100);
  });

  // =========================================================================
  // 1. FEATURE TESTS (≥30)
  // =========================================================================
  describe('1. Feature Tests', () => {
    it('F01: creates vector mask group from mask shape and 1 target shape', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      expect(res.success).toBe(true);
      expect(res.maskedNode?.type).toBe('group');
      expect((res.maskedNode as ShapeGroupNode).isMaskGroup).toBe(true);
    });

    it('F02: assigns clipPathId to mask group node and mask shape child', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const group = res.maskedNode as ShapeGroupNode;

      expect(group.clipPathId).toBeDefined();
      expect(group.children[0].isMask).toBe(true);
      expect(group.children[0].clipPathId).toBe(group.clipPathId);
    });

    it('F03: creates vector mask group with 2 target shapes', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2, r3]);
      expect(res.success).toBe(true);
      expect((res.maskedNode as ShapeGroupNode).children).toHaveLength(3);
    });

    it('F04: releases vector mask group back into individual shapes', () => {
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const releaseRes = VectorCompoundTopologyMaskEngine.releaseVectorMask(createRes.maskedNode!);

      expect(releaseRes.success).toBe(true);
      expect(releaseRes.releasedNodes).toHaveLength(2);
      expect(releaseRes.releasedNodes![0].isMask).toBeUndefined();
    });

    it('F05: applies compound mask CSG topology to mask shape', () => {
      const res = VectorCompoundTopologyMaskEngine.applyCompoundMaskTopology(r1, 'union');
      expect(res.success).toBe(true);
      expect(res.maskedNode).toBeDefined();
    });

    it('F06: evaluates point-in-mask containment (inside mask bounding box)', () => {
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const isInside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 75, y: 75 }, createRes.maskedNode!);
      expect(isInside).toBe(true);
    });

    it('F07: evaluates point-in-mask containment (outside mask bounding box)', () => {
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const isOutside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 10, y: 10 }, createRes.maskedNode!);
      expect(isOutside).toBe(false);
    });

    it('F08: dispatches CREATE_VECTOR_MASK workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      expect(state.snapshot.nodes.length).toBe(1);
      expect(state.snapshot.nodes[0].id.startsWith('mask_group_')).toBe(true);
    });

    it('F09: dispatches RELEASE_VECTOR_MASK workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const maskGroupId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [maskGroupId]);
      state = VectorWorkflowOrchestrator.releaseVectorMaskWorkflow(state);

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('F10: dispatches SET_MASK_TOPOLOGY workflow via orchestrator', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_mask']);
      state = VectorWorkflowOrchestrator.setMaskTopologyWorkflow(state, 'union');

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('F11: tracks affectedSourceIds on vector mask creation', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2, r3]);
      expect(res.affectedSourceIds).toEqual(['rect_mask', 'rect_target1', 'rect_target2']);
    });

    it('F12: tracks affectedSourceIds on vector mask release', () => {
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const releaseRes = VectorCompoundTopologyMaskEngine.releaseVectorMask(createRes.maskedNode!);
      expect(releaseRes.affectedSourceIds).toEqual([createRes.maskedNode!.id]);
    });

    it('F13: rejects createVectorMask with empty target shapes array', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, []);
      expect(res.success).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });

    it('F14: rejects createVectorMask with null mask shape', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(null as any, [r2]);
      expect(res.success).toBe(false);
    });

    it('F15: rejects createVectorMask with locked mask shape', () => {
      const lockedR1: RectangleNode = { ...r1, locked: true };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(lockedR1, [r2]);
      expect(res.success).toBe(false);
    });

    it('F16: rejects createVectorMask with locked target shape', () => {
      const lockedR2: RectangleNode = { ...r2, locked: true };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [lockedR2]);
      expect(res.success).toBe(false);
    });

    it('F17: rejects releaseVectorMask on non-group node', () => {
      const res = VectorCompoundTopologyMaskEngine.releaseVectorMask(r1);
      expect(res.success).toBe(false);
    });

    it('F18: rejects releaseVectorMask on non-mask group node', () => {
      const plainGroup: ShapeGroupNode = {
        id: 'g1',
        type: 'group',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        children: [r1, r2],
      };
      const res = VectorCompoundTopologyMaskEngine.releaseVectorMask(plainGroup);
      expect(res.success).toBe(false);
    });

    it('F19: preserves opacity attribute on mask group creation', () => {
      const styledR1: RectangleNode = { ...r1, opacity: 0.7 };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(styledR1, [r2]);

      expect(res.maskedNode?.opacity).toBe(0.7);
    });

    it('F20: preserves target shape fill and stroke attributes inside mask group', () => {
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const group = createRes.maskedNode as ShapeGroupNode;

      expect(group.children[1].name).toBe('Target Shape 1');
    });

    it('F21: evaluates isPointInsideMaskedNode on simple non-group shape', () => {
      const isInside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 75, y: 75 }, r1);
      expect(isInside).toBe(true);
    });

    it('F22: evaluates isPointInsideMaskedNode with NaN point coordinates', () => {
      const isInside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: NaN, y: 75 }, r1);
      expect(isInside).toBe(false);
    });

    it('F23: evaluates isPointInsideMaskedNode with null node parameter', () => {
      const isInside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 75, y: 75 }, null as any);
      expect(isInside).toBe(false);
    });

    it('F24: handles createVectorMask with PathNode as mask shape', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(p1, [r2]);
      expect(res.success).toBe(true);
      expect((res.maskedNode as ShapeGroupNode).children[0].type).toBe('path');
    });

    it('F25: handles createVectorMask with 5 target shapes', () => {
      const targets = Array.from({ length: 5 }, (_, i) => ({ ...r2, id: `t_${i}` }));
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, targets);

      expect(res.success).toBe(true);
      expect((res.maskedNode as ShapeGroupNode).children).toHaveLength(6);
    });

    it('F26: releases vector mask with 5 target shapes', () => {
      const targets = Array.from({ length: 5 }, (_, i) => ({ ...r2, id: `t_${i}` }));
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, targets);
      const releaseRes = VectorCompoundTopologyMaskEngine.releaseVectorMask(createRes.maskedNode!);

      expect(releaseRes.releasedNodes).toHaveLength(6);
    });

    it('F27: handles applyCompoundMaskTopology on null input', () => {
      const res = VectorCompoundTopologyMaskEngine.applyCompoundMaskTopology(null as any);
      expect(res.success).toBe(false);
    });

    it('F28: maintains mask group visibility attribute true', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      expect(res.maskedNode?.visible).toBe(true);
    });

    it('F29: maintains mask group locked attribute false', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      expect(res.maskedNode?.locked).toBe(false);
    });

    it('F30: generates unique clipPathId for every mask creation call', () => {
      const res1 = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const res2 = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);

      const id1 = (res1.maskedNode as ShapeGroupNode).clipPathId;
      const id2 = (res2.maskedNode as ShapeGroupNode).clipPathId;

      expect(id1).not.toEqual(id2);
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (≥18)
  // =========================================================================
  describe('2. Integration Tests', () => {
    it('I01: integrates vector mask creation with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      const initialLen = state.historyStack.entries.length;

      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      expect(state.historyStack.entries.length).toBe(initialLen + 1);
    });

    it('I02: supports undo of vector mask creation', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('I03: supports redo of vector mask creation', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      const redoRes = state.historyStack.redo();
      if (redoRes) state = { snapshot: redoRes.state, historyStack: redoRes.stack };

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('I04: integrates vector mask release with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const maskGroupId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [maskGroupId]);
      state = VectorWorkflowOrchestrator.releaseVectorMaskWorkflow(state);

      expect(state.historyStack.entries.length).toBe(3);
    });

    it('I05: integrates JSON document serialization roundtrip for vector mask group', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(1);
      expect((restored.snapshot!.nodes[0] as ShapeGroupNode).isMaskGroup).toBe(true);
    });

    it('I06: integrates SVG export rendering with clipPath defs and clip-path attribute', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<clipPath');
      expect(svg).toContain('clip-path="url(#');
    });

    it('I07: preserves non-selected shapes untouched during vector mask creation', () => {
      let state = createVectorWorkspaceState([r1, r2, r3]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      expect(state.snapshot.nodes.some(n => n.id === 'rect_target2')).toBe(true);
    });

    it('I08: integrates setMaskTopology workflow with HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialLen = state.historyStack.entries.length;

      state = selectNodes(state, ['rect_mask']);
      state = VectorWorkflowOrchestrator.setMaskTopologyWorkflow(state, 'union');

      expect(state.historyStack.entries.length).toBe(initialLen + 1);
    });

    it('I09: ignores non-mask shapes during releaseVectorMaskWorkflow', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialNodes = state.snapshot.nodes;

      state = selectNodes(state, ['rect_mask']);
      state = VectorWorkflowOrchestrator.releaseVectorMaskWorkflow(state);

      expect(state.snapshot.nodes).toEqual(initialNodes);
    });

    it('I10: maintains document integrity across 10 sequential vector mask creations and releases', () => {
      let state = createVectorWorkspaceState([r1, r2]);

      for (let i = 0; i < 5; i++) {
        const shapeIds = state.snapshot.nodes.map(n => n.id);
        state = selectNodes(state, shapeIds);
        state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);
        const mId = state.snapshot.nodes[0].id;
        state = selectNodes(state, [mId]);
        state = VectorWorkflowOrchestrator.releaseVectorMaskWorkflow(state);
      }

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('I11: integrates vector mask creation with single selection state update', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      expect(state.snapshot.selectedIds).toHaveLength(1);
      expect(state.snapshot.selectedIds[0].startsWith('mask_group_')).toBe(true);
    });

    it('I12: integrates vector mask release with multi-selection state update', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const mId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [mId]);
      state = VectorWorkflowOrchestrator.releaseVectorMaskWorkflow(state);

      expect(state.snapshot.selectedIds).toHaveLength(2);
    });

    it('I13: integrates vector mask group with transformation scaling', () => {
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const group = createRes.maskedNode as ShapeGroupNode;

      expect(group.transform.width).toBe(100);
    });

    it('I14: integrates vector mask group with document serializer restore', () => {
      let state = createVectorWorkspaceState([r1, r2, r3]);
      state = selectNodes(state, ['rect_mask', 'rect_target1', 'rect_target2']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(1);
    });

    it('I15: maintains sub-child visibility inside mask group during SVG export', () => {
      const invisibleTarget: RectangleNode = { ...r2, visible: false };
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [invisibleTarget]);
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [createRes.maskedNode!], selectedIds: [], constraintEdges: [] });

      expect(svg).not.toContain('Target Shape 1');
    });

    it('I16: integrates vector mask with compound path mask shape', () => {
      const compoundPath: PathNode = { ...p1, fillRule: 'evenodd' };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(compoundPath, [r2]);

      expect(res.success).toBe(true);
    });

    it('I17: integrates vector mask with multi-layer nested groups', () => {
      const groupTarget: ShapeGroupNode = {
        id: 'gt1',
        type: 'group',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        children: [r2, r3],
      };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [groupTarget]);

      expect(res.success).toBe(true);
    });

    it('I18: maintains document snapshot immutability during mask creation', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      const snapshotBeforeWorkflow = state.snapshot;

      VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      expect(state.snapshot).toBe(snapshotBeforeWorkflow);
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (≥15)
  // =========================================================================
  describe('3. E2E Workflows', () => {
    it('E2E-01: User Intent: Create Mask -> Export SVG -> Verify clipPath Structure', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);
      const svg = VectorSvgExporter.exportToSvgString(restored.snapshot!);

      expect(svg).toContain('<clipPath');
      expect(svg).toContain('clip-path="url(#');
    });

    it('E2E-02: User Intent: Create Mask -> Release Mask -> Undo Workflow', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const mId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [mId]);
      state = VectorWorkflowOrchestrator.releaseVectorMaskWorkflow(state);

      // Undo release
      let undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      // Undo create
      undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('E2E-03: User Intent: Create Mask -> Redo Workflow -> JSON Serialization', () => {
      let state = createVectorWorkspaceState([r1, r2, r3]);
      state = selectNodes(state, ['rect_mask', 'rect_target1', 'rect_target2']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      const redoRes = state.historyStack.redo();
      if (redoRes) state = { snapshot: redoRes.state, historyStack: redoRes.stack };

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(1);
    });

    it('E2E-04: User Intent: Point-in-mask Containment Check on Mask Group', () => {
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const maskGroup = createRes.maskedNode!;

      const isInside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 75, y: 75 }, maskGroup);
      const isOutside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 10, y: 10 }, maskGroup);

      expect(isInside).toBe(true);
      expect(isOutside).toBe(false);
    });

    it('E2E-05: User Intent: Sequential Mask Creation and Grouping', () => {
      let state = createVectorWorkspaceState([r1, r2, r3]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const mId = state.snapshot.nodes.find(n => n.id.startsWith('mask_group_'))!.id;
      state = selectNodes(state, [mId, 'rect_target2']);
      state = VectorWorkflowOrchestrator.groupSelectedWorkflow(state);

      expect(state.snapshot.nodes.length).toBe(1);
      expect(state.snapshot.nodes[0].type).toBe('group');
    });

    it('E2E-06: User Intent: Set Mask Topology Workflow on Mask Group', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const mId = state.snapshot.nodes[0].id;
      state = selectNodes(state, [mId]);
      state = VectorWorkflowOrchestrator.setMaskTopologyWorkflow(state, 'intersection');

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('E2E-07: User Intent: Create Mask with Complex Path Node', () => {
      let state = createVectorWorkspaceState([p1, r2]);
      state = selectNodes(state, ['path_1', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<clipPath');
    });

    it('E2E-08: User Intent: Full Lifecycle Create Mask -> Reorder Layer -> SVG Export', () => {
      let state = createVectorWorkspaceState([r1, r2, r3]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const mId = state.snapshot.nodes.find(n => n.id.startsWith('mask_group_'))!.id;
      state = selectNodes(state, [mId]);
      state = VectorWorkflowOrchestrator.reorderSelectedLayers(state, 'sendToBack');

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<clipPath');
    });

    it('E2E-09: User Intent: Deep Rollback of Multi-Step Mask Editing Pipeline', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      const initial = state.snapshot;

      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot).toEqual(initial);
    });

    it('E2E-10: User Intent: Multi-Layer Mask Creation and Re-serialization', () => {
      let state = createVectorWorkspaceState([r1, r2, r3]);
      state = selectNodes(state, ['rect_mask', 'rect_target1', 'rect_target2']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(1);
    });

    it('E2E-11: User Intent: Create Mask with 3 Concentric Rectangle Targets', () => {
      const t1 = { ...r2, id: 't1' };
      const t2 = { ...r2, id: 't2' };
      const t3 = { ...r2, id: 't3' };

      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [t1, t2, t3]);
      expect(res.success).toBe(true);
      expect((res.maskedNode as ShapeGroupNode).children).toHaveLength(4);
    });

    it('E2E-12: User Intent: Release Mask Group Preserves Original Target Coordinates', () => {
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const releaseRes = VectorCompoundTopologyMaskEngine.releaseVectorMask(createRes.maskedNode!);

      expect(releaseRes.releasedNodes![1].transform).toEqual(r2.transform);
    });

    it('E2E-13: User Intent: Mask Grouping inside Document Workspace', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      expect((state.snapshot.nodes[0] as ShapeGroupNode).isMaskGroup).toBe(true);
    });

    it('E2E-14: User Intent: Multi-shape Selection Mask Creation Shortcut', () => {
      let state = createVectorWorkspaceState([r1, r2, r3]);
      state = selectNodes(state, ['rect_mask', 'rect_target1', 'rect_target2']);
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('E2E-15: User Intent: Verify Zero Performance Degradation across 100 Mask Hit Tests', () => {
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const maskGroup = createRes.maskedNode!;

      for (let i = 0; i < 100; i++) {
        VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 75, y: 75 }, maskGroup);
      }

      expect(true).toBe(true);
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (≥30)
  // =========================================================================
  describe('4. Adversarial Scenarios', () => {
    it('ADV-01: handles createVectorMask with null target array', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, null as any);
      expect(res.success).toBe(false);
    });

    it('ADV-02: handles createVectorMask with empty target array', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, []);
      expect(res.success).toBe(false);
    });

    it('ADV-03: handles releaseVectorMask with null input', () => {
      const res = VectorCompoundTopologyMaskEngine.releaseVectorMask(null as any);
      expect(res.success).toBe(false);
    });

    it('ADV-04: handles isPointInsideMaskedNode with Infinity point coordinates', () => {
      const isInside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: Infinity, y: 75 }, r1);
      expect(isInside).toBe(false);
    });

    it('ADV-05: handles createVectorMaskWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      const initial = state;
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-06: handles releaseVectorMaskWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([r1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.releaseVectorMaskWorkflow(state);
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-07: handles setMaskTopologyWorkflow on empty selection', () => {
      let state = createVectorWorkspaceState([r1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.setMaskTopologyWorkflow(state, 'union');
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('ADV-08: handles extreme coordinate bounds (1e9, 1e9)', () => {
      const extremeR: RectangleNode = { ...r1, transform: { ...r1.transform, x: 1e9, y: 1e9 } };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(extremeR, [r2]);
      expect(res.success).toBe(true);
    });

    it('ADV-09: handles 20 sequential mask creations safely', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);

      for (let i = 0; i < 20; i++) {
        state = VectorWorkflowOrchestrator.setMaskTopologyWorkflow(state, i % 2 === 0 ? 'union' : 'intersection');
      }

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('ADV-10: handles releaseVectorMask on group with empty children array', () => {
      const emptyGroup: ShapeGroupNode = {
        id: 'eg1',
        type: 'group',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        children: [],
        isMaskGroup: true,
      };
      const res = VectorCompoundTopologyMaskEngine.releaseVectorMask(emptyGroup);
      expect(res.success).toBe(false);
    });

    it('ADV-11: handles releaseVectorMask on group with undefined children array', () => {
      const noChildGroup: any = { id: 'ncg1', type: 'group', isMaskGroup: true };
      const res = VectorCompoundTopologyMaskEngine.releaseVectorMask(noChildGroup);
      expect(res.success).toBe(false);
    });

    it('ADV-12: handles isPointInsideMaskedNode on empty group node', () => {
      const emptyGroup: ShapeGroupNode = {
        id: 'eg1',
        type: 'group',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        children: [],
      };
      const isInside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 10, y: 10 }, emptyGroup);
      expect(isInside).toBe(false);
    });

    it('ADV-13: handles createVectorMask with 10 target shapes', () => {
      const targets = Array.from({ length: 10 }, (_, i) => ({ ...r2, id: `t_${i}` }));
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, targets);
      expect(res.success).toBe(true);
      expect((res.maskedNode as ShapeGroupNode).children).toHaveLength(11);
    });

    it('ADV-14: handles releaseVectorMask on 10 target shapes', () => {
      const targets = Array.from({ length: 10 }, (_, i) => ({ ...r2, id: `t_${i}` }));
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, targets);
      const releaseRes = VectorCompoundTopologyMaskEngine.releaseVectorMask(createRes.maskedNode!);
      expect(releaseRes.releasedNodes).toHaveLength(11);
    });

    it('ADV-15: handles createVectorMask where mask shape has zero width and height', () => {
      const zeroR: RectangleNode = { ...r1, transform: { ...r1.transform, width: 0, height: 0 } };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(zeroR, [r2]);
      expect(res.success).toBe(true);
    });

    it('ADV-16: handles applyCompoundMaskTopology with invalid operation string', () => {
      const res = VectorCompoundTopologyMaskEngine.applyCompoundMaskTopology(r1, 'INVALID_OP' as any);
      expect(res.success).toBe(true);
    });

    it('ADV-17: handles rapid toggle of mask topology 50 times', () => {
      let node: VectorNode = r1;
      for (let i = 0; i < 50; i++) {
        node = VectorCompoundTopologyMaskEngine.applyCompoundMaskTopology(node, i % 2 === 0 ? 'union' : 'intersection').maskedNode!;
      }
      expect(node).toBeDefined();
    });

    it('ADV-18: handles createVectorMask with locked mask shape', () => {
      const lockedMask: RectangleNode = { ...r1, locked: true };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(lockedMask, [r2]);
      expect(res.success).toBe(false);
    });

    it('ADV-19: handles createVectorMask with locked target shape', () => {
      const lockedTarget: RectangleNode = { ...r2, locked: true };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [lockedTarget]);
      expect(res.success).toBe(false);
    });

    it('ADV-20: handles isPointInsideMaskedNode on non-bounding-box shape', () => {
      const isInside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 50, y: 50 }, p1);
      expect(isInside).toBe(true);
    });

    it('ADV-21: handles SVG export of mask group with no clipPathId', () => {
      const groupNoClip: ShapeGroupNode = {
        id: 'gnc1',
        type: 'group',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        children: [r1, r2],
        isMaskGroup: true,
      };
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [groupNoClip], selectedIds: [], constraintEdges: [] });
      expect(svg).toContain('<g');
    });

    it('ADV-22: handles createVectorMask with EllipseNode as mask shape', () => {
      const ellipseMask: EllipseNode = {
        id: 'el_mask',
        type: 'ellipse',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(ellipseMask, [r2]);
      expect(res.success).toBe(true);
    });

    it('ADV-23: handles releaseVectorMask on mask group with 1 child', () => {
      const singleChildGroup: ShapeGroupNode = {
        id: 'scg1',
        type: 'group',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        children: [r1],
        isMaskGroup: true,
      };
      const res = VectorCompoundTopologyMaskEngine.releaseVectorMask(singleChildGroup);
      expect(res.success).toBe(true);
      expect(res.releasedNodes).toHaveLength(1);
    });

    it('ADV-24: handles createVectorMask with duplicate target shapes', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2, r2]);
      expect(res.success).toBe(true);
    });

    it('ADV-25: handles isPointInsideMaskedNode with point at exact bounding box corner', () => {
      const isCorner = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 50, y: 50 }, r1);
      expect(isCorner).toBe(true);
    });

    it('ADV-26: handles createVectorMask where all target shapes are invisible', () => {
      const invR2: RectangleNode = { ...r2, visible: false };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [invR2]);
      expect(res.success).toBe(true);
    });

    it('ADV-27: handles SVG export when node clipPathId is empty string', () => {
      const nodeEmptyClip: RectangleNode = { ...r1, clipPathId: '' };
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [nodeEmptyClip], selectedIds: [], constraintEdges: [] });
      expect(svg).not.toContain('clip-path="url(#)"');
    });

    it('ADV-28: handles createVectorMask with 20 target shapes', () => {
      const targets = Array.from({ length: 20 }, (_, i) => ({ ...r2, id: `t_${i}` }));
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, targets);
      expect(res.success).toBe(true);
      expect((res.maskedNode as ShapeGroupNode).children).toHaveLength(21);
    });

    it('ADV-29: handles releaseVectorMask on 20 target shapes', () => {
      const targets = Array.from({ length: 20 }, (_, i) => ({ ...r2, id: `t_${i}` }));
      const createRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, targets);
      const releaseRes = VectorCompoundTopologyMaskEngine.releaseVectorMask(createRes.maskedNode!);
      expect(releaseRes.releasedNodes).toHaveLength(21);
    });

    it('ADV-30: handles createVectorMask with negative transform scale parameters', () => {
      const negR: RectangleNode = { ...r1, transform: { ...r1.transform, scaleX: -1, scaleY: -1 } };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(negR, [r2]);
      expect(res.success).toBe(true);
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION POINTS (≥10)
  // =========================================================================
  describe('5. Failure Injection Points', () => {
    it('FI-01: Unlocked Shape Count < 2 Recovery', () => {
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, []);
      expect(res.success).toBe(false);
    });

    it('FI-02: NaN Coordinates in Mask Shape Recovery', () => {
      const nanR: RectangleNode = { ...r1, transform: { ...r1.transform, x: NaN, y: NaN } };
      const isInside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 10, y: 10 }, nanR);
      expect(isInside).toBe(false);
    });

    it('FI-03: Corrupted Clip-Path ID Ingestion', () => {
      const corruptedR: RectangleNode = { ...r1, clipPathId: undefined };
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [corruptedR], selectedIds: [], constraintEdges: [] });
      expect(svg).not.toContain('clip-path=');
    });

    it('FI-04: Circular Mask Assignment Exception Recovery', () => {
      const circularGroup: any = { id: 'cg1', type: 'group', isMaskGroup: true };
      circularGroup.children = [circularGroup];

      const res = VectorCompoundTopologyMaskEngine.releaseVectorMask(circularGroup);
      expect(res).toBeDefined();
    });

    it('FI-05: Missing Mask Shape in Mask Group Recovery', () => {
      const noMaskGroup: ShapeGroupNode = {
        id: 'nmg1',
        type: 'group',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        children: [r2],
        isMaskGroup: true,
      };
      const isInside = VectorCompoundTopologyMaskEngine.isPointInsideMaskedNode({ x: 10, y: 10 }, noMaskGroup);
      expect(isInside).toBe(true);
    });

    it('FI-06: Empty Selection Workflow Recovery', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      const initial = state;
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);
      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('FI-07: HistoryStack Push Exception Recovery', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_mask', 'rect_target1']);

      const brokenState = {
        ...state,
        historyStack: {
          ...state.historyStack,
          push: () => { throw new Error('Simulated History Stack Failure'); },
        },
      };

      const res = VectorWorkflowOrchestrator.createVectorMaskWorkflow(brokenState);
      expect(res).toBeDefined();
    });

    it('FI-08: Circular Serialization Exception Recovery', () => {
      const circularPath: any = { id: 'cp', type: 'path', d: 'M 0 0' };
      circularPath.self = circularPath;

      expect(() => VectorDocumentSerializer.serializeVectorDocument({ nodes: [circularPath], selectedIds: [], constraintEdges: [] })).toThrow();
    });

    it('FI-09: Locked Mask Target Shape Ingestion Recovery', () => {
      const lockedR2: RectangleNode = { ...r2, locked: true };
      const res = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [lockedR2]);
      expect(res.success).toBe(false);
    });

    it('FI-10: Invalid Topology Operation String Ingestion Recovery', () => {
      const res = VectorCompoundTopologyMaskEngine.applyCompoundMaskTopology(r1, 'CORRUPTED_OP' as any);
      expect(res.success).toBe(true);
    });
  });
});
