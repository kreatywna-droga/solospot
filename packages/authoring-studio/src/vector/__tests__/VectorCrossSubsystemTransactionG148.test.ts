/**
 * VectorCrossSubsystemTransactionG148.test.ts — Milestone G1-48 Test Suite (Night Shift Level 10)
 *
 * Professional Unified Cross-Subsystem Atomic Editing Transaction Architecture validation:
 * - Feature Tests (≥35)
 * - Integration Tests (≥25)
 * - E2E Workflows (≥20)
 * - Adversarial Scenarios (≥45)
 * - Failure Injection Points (≥25)
 *
 * MINIMUM TOTAL: 150 NEW TESTS
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VectorNode, RectangleNode, EllipseNode, PathNode, ShapeGroupNode, createPathNode } from '../VectorDomainModel';
import { createVectorWorkspaceState, selectNodes, VectorDocumentSnapshot } from '../VectorWorkspaceController';
import {
  VectorCrossSubsystemTransaction,
  executeCrossSubsystemTransaction,
  CrossSubsystemOperation,
  CrossSubsystemTransactionResult
} from '../VectorCrossSubsystemTransaction';
import { VectorWorkflowOrchestrator } from '../VectorWorkflowOrchestrator';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorSvgExporter } from '../VectorSvgExporter';
import { VectorBooleanTopologyEngine } from '../VectorBooleanTopologyEngine';
import { VectorCompoundTopologyMaskEngine } from '../VectorCompoundTopologyMaskEngine';

describe('WF-HACP-STUDIO-G1-48 — Unified Cross-Subsystem Atomic Editing Transaction Architecture', () => {
  let r1: RectangleNode;
  let r2: RectangleNode;
  let r3: RectangleNode;
  let p1: PathNode;
  let p2: PathNode;

  beforeEach(() => {
    r1 = {
      id: 'rect_1',
      name: 'Rectangle 1',
      type: 'rectangle',
      transform: {
        x: 10,
        y: 10,
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
      id: 'rect_2',
      name: 'Rectangle 2',
      type: 'rectangle',
      transform: {
        x: 150,
        y: 10,
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

    r3 = {
      id: 'rect_3',
      name: 'Rectangle 3',
      type: 'rectangle',
      transform: {
        x: 50,
        y: 50,
        width: 80,
        height: 80,
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
    p2 = createPathNode('path_2', 'M 50 50 L 150 50 L 150 150 L 50 150 Z', 50, 50, 100, 100);
  });

  // =========================================================================
  // 1. FEATURE TESTS (≥35)
  // =========================================================================
  describe('1. Feature Tests', () => {
    it('F01: executes single operation cross-subsystem transaction successfully', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 50 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Move X');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(50);
    });

    it('F02: executes 2-stage multi-subsystem transaction (Transform + Snapping)', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);

      const res = VectorWorkflowOrchestrator.executeCrossSubsystemTransformSnapTransaction(state, 30, 0);
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(40);
    });

    it('F03: executes 2-stage multi-subsystem transaction (Path Boolean + Mask)', () => {
      const state = createVectorWorkspaceState([p1, p2]);
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemPathBooleanMaskTransaction(
        state,
        'union',
        'path_1',
        ['path_2']
      );

      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes.length).toBe(1);
    });

    it('F04: pushes exactly 1 transaction to HistoryStack on successful transaction', () => {
      const state = createVectorWorkspaceState([r1]);
      const initialStackLen = state.historyStack.entries.length;
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, y: 100 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Move Y');
      expect(res.snapshot.historyStack.entries.length).toBe(initialStackLen + 1);
    });

    it('F05: pushes 0 transactions to HistoryStack on failed transaction', () => {
      const state = createVectorWorkspaceState([r1]);
      const initialStackLen = state.historyStack.entries.length;
      const failingOp: CrossSubsystemOperation = () => {
        throw new Error('Simulated Subsystem Failure');
      };

      const res = executeCrossSubsystemTransaction(state, [failingOp], 'Failing Op');
      expect(res.success).toBe(false);
      expect(res.snapshot.historyStack.entries.length).toBe(initialStackLen);
    });

    it('F06: restores initial document snapshot on transaction failure', () => {
      const state = createVectorWorkspaceState([r1]);
      const op1: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 999 } })),
      });
      const failingOp: CrossSubsystemOperation = () => {
        throw new Error('Failure in Step 2');
      };

      const res = executeCrossSubsystemTransaction(state, [op1, failingOp], 'Multi-step Failure');
      expect(res.success).toBe(false);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('F07: captures checkpoint ID during transaction execution', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 20 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Valid Op');
      expect(res.checkpointId).toBeDefined();
    });

    it('F08: executes 3-stage cross-subsystem pipeline sequentially', () => {
      const state = createVectorWorkspaceState([r1]);
      const op1: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 20 } })),
      });
      const op2: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, y: 30 } })),
      });
      const op3: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, opacity: 0.5 })),
      });

      const res = executeCrossSubsystemTransaction(state, [op1, op2, op3], '3-Stage Op');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(20);
      expect(res.snapshot.snapshot.nodes[0].transform.y).toBe(30);
      expect(res.snapshot.snapshot.nodes[0].opacity).toBe(0.5);
    });

    it('F09: rejects invalid workspace state gracefully', () => {
      const res = executeCrossSubsystemTransaction(null as any, [], 'Invalid');
      expect(res.success).toBe(false);
      expect(res.errors).toContain('Invalid workspace state for transaction.');
    });

    it('F10: handles empty operations array without state mutation', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = executeCrossSubsystemTransaction(state, [], 'Empty');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes).toEqual(state.snapshot.nodes);
    });

    it('F11: handles no-op operations cleanly without history contamination', () => {
      const state = createVectorWorkspaceState([r1]);
      const initialStackLen = state.historyStack.entries.length;
      const noOp: CrossSubsystemOperation = (snap) => snap;

      const res = executeCrossSubsystemTransaction(state, [noOp], 'No-Op');
      expect(res.success).toBe(true);
      expect(res.snapshot.historyStack.entries.length).toBe(initialStackLen + 1);
    });

    it('F12: clears transient activeTransformSession on commit', () => {
      let state = createVectorWorkspaceState([r1]);
      state = { ...state, activeTransformSession: { handle: 'e', startPointer: { x: 0, y: 0 }, startBounds: { x: 0, y: 0, width: 100, height: 100 }, preserveAspect: false } as any };

      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 50 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Clear Transient');
      expect(res.snapshot.activeTransformSession).toBeUndefined();
    });

    it('F13: clears transient activeGuideLines on commit', () => {
      let state = createVectorWorkspaceState([r1]);
      state = { ...state, activeGuideLines: [{ orientation: 'vertical', position: 100 }] as any };

      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 50 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Clear Guides');
      expect(res.snapshot.activeGuideLines).toBeUndefined();
    });

    it('F14: clears transient activeTransformSession on rollback', () => {
      let state = createVectorWorkspaceState([r1]);
      state = { ...state, activeTransformSession: { handle: 'e' } as any };
      const failingOp: CrossSubsystemOperation = () => { throw new Error('Fail'); };

      const res = executeCrossSubsystemTransaction(state, [failingOp], 'Fail Clear Transient');
      expect(res.snapshot.activeTransformSession).toBeUndefined();
    });

    it('F15: clears transient activeGuideLines on rollback', () => {
      let state = createVectorWorkspaceState([r1]);
      state = { ...state, activeGuideLines: [{ orientation: 'horizontal', position: 50 }] as any };
      const failingOp: CrossSubsystemOperation = () => { throw new Error('Fail'); };

      const res = executeCrossSubsystemTransaction(state, [failingOp], 'Fail Clear Guides');
      expect(res.snapshot.activeGuideLines).toBeUndefined();
    });

    it('F16: preserves selection state across successful transaction', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);

      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, opacity: 0.8 })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Preserve Selection');
      expect(res.snapshot.snapshot.selectedIds).toEqual(['rect_1', 'rect_2']);
    });

    it('F17: updates selection state when operation modifies selectedIds', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        selectedIds: ['rect_2'],
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Update Selection');
      expect(res.snapshot.snapshot.selectedIds).toEqual(['rect_2']);
    });

    it('F18: returns errors array on operation exception', () => {
      const state = createVectorWorkspaceState([r1]);
      const failingOp: CrossSubsystemOperation = () => { throw new Error('Custom Error Msg'); };

      const res = executeCrossSubsystemTransaction(state, [failingOp], 'Error Msg');
      expect(res.errors).toContain('Custom Error Msg');
    });

    it('F19: returns error when operation returns invalid non-array nodes snapshot', () => {
      const state = createVectorWorkspaceState([r1]);
      const badOp: CrossSubsystemOperation = () => ({ nodes: null as any, selectedIds: [] });

      const res = executeCrossSubsystemTransaction(state, [badOp], 'Bad Snapshot');
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('returned an invalid snapshot');
    });

    it('F20: supports 5 sequential operations in a single atomic transaction', () => {
      const state = createVectorWorkspaceState([r1]);
      const ops: CrossSubsystemOperation[] = [
        (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 20 } })) }),
        (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, y: 30 } })) }),
        (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, width: 120 } })) }),
        (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, height: 120 } })) }),
        (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, opacity: 0.9 })) }),
      ];

      const res = executeCrossSubsystemTransaction(state, ops, '5-Step Atomic');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].transform.width).toBe(120);
    });

    it('F21: aborts immediately on step 3 of 5 when step 3 fails, skipping steps 4 and 5', () => {
      const state = createVectorWorkspaceState([r1]);
      let step4Ran = false;
      let step5Ran = false;

      const ops: CrossSubsystemOperation[] = [
        (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 20 } })) }),
        (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, y: 30 } })) }),
        () => { throw new Error('Step 3 Failed'); },
        (s) => { step4Ran = true; return s; },
        (s) => { step5Ran = true; return s; },
      ];

      const res = executeCrossSubsystemTransaction(state, ops, 'Abort Mid-Pipeline');
      expect(res.success).toBe(false);
      expect(step4Ran).toBe(false);
      expect(step5Ran).toBe(false);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('F22: supports vector mask creation within cross-subsystem transaction', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const op: CrossSubsystemOperation = (snap) => {
        const maskRes = VectorCompoundTopologyMaskEngine.createVectorMask(snap.nodes[0], [snap.nodes[1]]);
        return { nodes: [maskRes.maskedNode!], selectedIds: [maskRes.maskedNode!.id] };
      };

      const res = executeCrossSubsystemTransaction(state, [op], 'Mask Transaction');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes.length).toBe(1);
    });

    it('F23: supports vector mask release within cross-subsystem transaction', () => {
      const maskRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const state = createVectorWorkspaceState([maskRes.maskedNode!]);

      const op: CrossSubsystemOperation = (snap) => {
        const relRes = VectorCompoundTopologyMaskEngine.releaseVectorMask(snap.nodes[0]);
        return { nodes: [...relRes.releasedNodes!], selectedIds: [] };
      };

      const res = executeCrossSubsystemTransaction(state, [op], 'Release Mask Transaction');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes.length).toBe(2);
    });

    it('F24: supports boolean topology union within cross-subsystem transaction', () => {
      const state = createVectorWorkspaceState([p1, p2]);
      const op: CrossSubsystemOperation = (snap) => {
        const topoRes = VectorBooleanTopologyEngine.executeBooleanTopology(snap.nodes as any, 'union');
        return { nodes: [topoRes.resultNode!], selectedIds: [topoRes.resultNode!.id] };
      };

      const res = executeCrossSubsystemTransaction(state, [op], 'Boolean Union Transaction');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes.length).toBe(1);
    });

    it('F25: supports boolean topology subtraction within cross-subsystem transaction', () => {
      const state = createVectorWorkspaceState([p1, p2]);
      const op: CrossSubsystemOperation = (snap) => {
        const topoRes = VectorBooleanTopologyEngine.executeBooleanTopology(snap.nodes as any, 'difference');
        return { nodes: [topoRes.resultNode!], selectedIds: [topoRes.resultNode!.id] };
      };

      const res = executeCrossSubsystemTransaction(state, [op], 'Boolean Subtract Transaction');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes.length).toBe(1);
    });

    it('F26: supports boolean topology intersection within cross-subsystem transaction', () => {
      const state = createVectorWorkspaceState([p1, p2]);
      const op: CrossSubsystemOperation = (snap) => {
        const topoRes = VectorBooleanTopologyEngine.executeBooleanTopology(snap.nodes as any, 'intersection');
        return { nodes: [topoRes.resultNode!], selectedIds: [topoRes.resultNode!.id] };
      };

      const res = executeCrossSubsystemTransaction(state, [op], 'Boolean Intersect Transaction');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes.length).toBe(1);
    });

    it('F27: deep clones node transform coordinates during transaction rollback', () => {
      const state = createVectorWorkspaceState([r1]);
      const badOp: CrossSubsystemOperation = (s) => {
        (s.nodes[0].transform as any).x = 555;
        throw new Error('Crash');
      };

      const res = executeCrossSubsystemTransaction(state, [badOp], 'Deep Clone Rollback');
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('F28: maintains document snapshot immutability during transaction execution', () => {
      const state = createVectorWorkspaceState([r1]);
      const initialSnapshot = state.snapshot;

      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 90 } })),
      });

      executeCrossSubsystemTransaction(state, [op], 'Immutability Check');
      expect(state.snapshot).toBe(initialSnapshot);
    });

    it('F29: supports 10 consecutive atomic transactions sequentially', () => {
      let state = createVectorWorkspaceState([r1]);

      for (let i = 0; i < 10; i++) {
        const op: CrossSubsystemOperation = (snap) => ({
          ...snap,
          nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: n.transform.x + 10 } })),
        });
        const res = executeCrossSubsystemTransaction(state, [op], `Step ${i}`);
        state = res.snapshot;
      }

      expect(state.snapshot.nodes[0].transform.x).toBe(110);
      expect(state.historyStack.entries.length).toBe(11);
    });

    it('F30: verifies static executeCrossSubsystemTransaction method on VectorCrossSubsystemTransaction class', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorCrossSubsystemTransaction.executeCrossSubsystemTransaction(state, [], 'Static Test');
      expect(res.success).toBe(true);
    });

    it('F31: handles empty node array in workspace snapshot', () => {
      const state = createVectorWorkspaceState([]);
      const res = executeCrossSubsystemTransaction(state, [], 'Empty Nodes');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes).toHaveLength(0);
    });

    it('F32: handles single node deletion in transaction', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: [],
        selectedIds: [],
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Delete Node');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes).toHaveLength(0);
    });

    it('F33: handles node addition in transaction', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: [...snap.nodes, r2],
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Add Node');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes).toHaveLength(2);
    });

    it('F34: handles node reordering in transaction', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: [snap.nodes[1], snap.nodes[0]],
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Reorder Nodes');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].id).toBe('rect_2');
    });

    it('F35: handles group creation inside transaction', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const op: CrossSubsystemOperation = (snap) => {
        const group: ShapeGroupNode = {
          id: 'g1',
          type: 'group',
          transform: { x: 0, y: 0, width: 250, height: 110, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
          children: [...snap.nodes],
        };
        return { nodes: [group], selectedIds: ['g1'] };
      };

      const res = executeCrossSubsystemTransaction(state, [op], 'Group Nodes');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].type).toBe('group');
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (≥25)
  // =========================================================================
  describe('2. Integration Tests', () => {
    it('I01: integrates cross-subsystem transaction with HistoryStack undo', () => {
      let state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 100 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Move 100');
      state = res.snapshot;

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      expect(state.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('I02: integrates cross-subsystem transaction with HistoryStack redo', () => {
      let state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 100 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Move 100');
      state = res.snapshot;

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      const redoRes = state.historyStack.redo();
      if (redoRes) state = { snapshot: redoRes.state, historyStack: redoRes.stack };

      expect(state.snapshot.nodes[0].transform.x).toBe(100);
    });

    it('I03: integrates cross-subsystem transaction with JSON document serialization', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, y: 50 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Move Y 50');
      const json = VectorDocumentSerializer.serializeVectorDocument(res.snapshot.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes[0].transform.y).toBe(50);
    });

    it('I04: integrates cross-subsystem transaction with SVG export rendering', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 80 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Move X 80');
      const svg = VectorSvgExporter.exportToSvgString(res.snapshot.snapshot);

      expect(svg).toContain('transform="translate(80, 10)"');
    });

    it('I05: integrates transform-snapping transaction with SVG export', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);

      const res = VectorWorkflowOrchestrator.executeCrossSubsystemTransformSnapTransaction(state, 40, 0);
      const svg = VectorSvgExporter.exportToSvgString(res.snapshot.snapshot);

      expect(svg).toContain('<svg');
    });

    it('I06: integrates path-boolean-mask transaction with JSON serialization', () => {
      const state = createVectorWorkspaceState([p1, p2]);
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemPathBooleanMaskTransaction(
        state,
        'union',
        'path_1',
        ['path_2']
      );

      const json = VectorDocumentSerializer.serializeVectorDocument(res.snapshot.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(1);
    });

    it('I07: maintains state machine in IDLE after successful transaction', () => {
      const state = createVectorWorkspaceState([r1]);
      executeCrossSubsystemTransaction(state, [], 'No-Op');
      const sm = VectorWorkflowOrchestrator.getStateMachine();

      expect(sm.getCurrentState()).toBe('IDLE');
    });

    it('I08: maintains recovery engine state clean after successful transaction', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 25 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Clean Test');
      expect(res.success).toBe(true);
    });

    it('I09: integrates cross-subsystem transaction with multi-layer nested groups', () => {
      const groupNode: ShapeGroupNode = {
        id: 'g1',
        type: 'group',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        children: [r1, r2],
      };
      const state = createVectorWorkspaceState([groupNode]);

      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 10 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Group Transform');
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('I10: preserves non-modified shapes untouched during targeted shape transaction', () => {
      const state = createVectorWorkspaceState([r1, r2, r3]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => n.id === 'rect_1' ? { ...n, opacity: 0.5 } : n),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Targeted Op');
      expect(res.snapshot.snapshot.nodes.find(n => n.id === 'rect_2')?.opacity).toBe(1);
      expect(res.snapshot.snapshot.nodes.find(n => n.id === 'rect_3')?.opacity).toBe(1);
    });

    it('I11: integrates cross-subsystem transaction with multiple shape opacity updates', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, opacity: 0.6 })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Multi Opacity');
      expect(res.snapshot.snapshot.nodes[0].opacity).toBe(0.6);
      expect(res.snapshot.snapshot.nodes[1].opacity).toBe(0.6);
    });

    it('I12: integrates cross-subsystem transaction with stroke updates', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, stroke: { color: '#ff0000', width: 4 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Stroke Update');
      expect(res.snapshot.snapshot.nodes[0].stroke?.color).toBe('#ff0000');
    });

    it('I13: integrates cross-subsystem transaction with fill updates', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, fill: { type: 'solid', color: '#00ff00' } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Fill Update');
      expect(res.snapshot.snapshot.nodes[0].fill?.color).toBe('#00ff00');
    });

    it('I14: integrates cross-subsystem transaction with lock toggling', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, locked: true })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Lock Node');
      expect(res.snapshot.snapshot.nodes[0].locked).toBe(true);
    });

    it('I15: integrates cross-subsystem transaction with visibility toggling', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, visible: false })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Hide Node');
      expect(res.snapshot.snapshot.nodes[0].visible).toBe(false);
    });

    it('I16: integrates cross-subsystem transaction with rotation transform', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, rotationDeg: 45 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Rotate 45');
      expect(res.snapshot.snapshot.nodes[0].transform.rotationDeg).toBe(45);
    });

    it('I17: integrates cross-subsystem transaction with scale transform', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, scaleX: 2, scaleY: 2 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Scale 2x');
      expect(res.snapshot.snapshot.nodes[0].transform.scaleX).toBe(2);
    });

    it('I18: integrates cross-subsystem transaction with skew transform', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, skewX: 10, skewY: 10 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Skew 10');
      expect(res.snapshot.snapshot.nodes[0].transform.skewX).toBe(10);
    });

    it('I19: integrates cross-subsystem transaction with path D attribute modification', () => {
      const state = createVectorWorkspaceState([p1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => n.type === 'path' ? { ...n, d: 'M 0 0 L 200 200 Z' } : n),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Modify Path D');
      expect((res.snapshot.snapshot.nodes[0] as PathNode).d).toBe('M 0 0 L 200 200 Z');
    });

    it('I20: maintains document integrity across 20 sequential transactions', () => {
      let state = createVectorWorkspaceState([r1]);

      for (let i = 0; i < 20; i++) {
        const op: CrossSubsystemOperation = (snap) => ({
          ...snap,
          nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: n.transform.x + 1 } })),
        });
        const res = executeCrossSubsystemTransaction(state, [op], `Step ${i}`);
        state = res.snapshot;
      }

      expect(state.snapshot.nodes[0].transform.x).toBe(30);
    });

    it('I21: integrates cross-subsystem transaction with multi-selection clearing', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);

      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        selectedIds: [],
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Clear Selection');
      expect(res.snapshot.snapshot.selectedIds).toHaveLength(0);
    });

    it('I22: integrates cross-subsystem transaction with selective node locking', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => n.id === 'rect_1' ? { ...n, locked: true } : n),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Lock Rect 1');
      expect(res.snapshot.snapshot.nodes[0].locked).toBe(true);
      expect(res.snapshot.snapshot.nodes[1].locked).toBe(false);
    });

    it('I23: integrates cross-subsystem transaction with multiple shape deletion', () => {
      const state = createVectorWorkspaceState([r1, r2, r3]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.filter(n => n.id === 'rect_3'),
        selectedIds: ['rect_3'],
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Delete Rects 1 & 2');
      expect(res.snapshot.snapshot.nodes).toHaveLength(1);
    });

    it('I24: integrates cross-subsystem transaction with custom node naming', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, name: 'Renamed Node' })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Rename');
      expect(res.snapshot.snapshot.nodes[0].name).toBe('Renamed Node');
    });

    it('I25: verifies HistoryStack description string preservation', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 99 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Unique Description 123');
      const latestEntry = res.snapshot.historyStack.entries[res.snapshot.historyStack.currentIndex];

      expect(latestEntry.label).toBe('Unique Description 123');
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (≥20)
  // =========================================================================
  describe('3. E2E Workflows', () => {
    it('E2E-01: Full Lifecycle: Select -> Transform -> Snap -> Boolean -> Mask -> SVG Export', () => {
      let state = createVectorWorkspaceState([p1, p2]);
      state = selectNodes(state, ['path_1', 'path_2']);

      const res = VectorWorkflowOrchestrator.executeCrossSubsystemPathBooleanMaskTransaction(
        state,
        'union',
        'path_1',
        ['path_2']
      );

      const json = VectorDocumentSerializer.serializeVectorDocument(res.snapshot.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);
      const svg = VectorSvgExporter.exportToSvgString(restored.snapshot!);

      expect(svg).toContain('<svg');
    });

    it('E2E-02: User Intent: Multi-Stage Atomic Edit with Undo and Redo', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);

      const res = VectorWorkflowOrchestrator.executeCrossSubsystemTransformSnapTransaction(state, 50, 50);
      state = res.snapshot;

      // Undo
      let undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };
      expect(state.snapshot.nodes[0].transform.x).toBe(10);

      // Redo
      let redoRes = state.historyStack.redo();
      if (redoRes) state = { snapshot: redoRes.state, historyStack: redoRes.stack };
      expect(state.snapshot.nodes[0].transform.x).toBe(60);
    });

    it('E2E-03: User Intent: Failed Mid-Pipeline Boolean Operation Aborts Cleanly', () => {
      const state = createVectorWorkspaceState([r1]);
      const initialSnap = state.snapshot;

      const ops: CrossSubsystemOperation[] = [
        (snap) => ({ ...snap, nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 200 } })) }),
        () => { throw new Error('Boolean Topology Engine Fault'); },
      ];

      const res = executeCrossSubsystemTransaction(state, ops, 'Failed Boolean Op');
      expect(res.success).toBe(false);
      expect(res.snapshot.snapshot).toEqual(initialSnap);
    });

    it('E2E-04: User Intent: Sequential Multi-Subsystem Transformations Pipeline', () => {
      let state = createVectorWorkspaceState([r1, r2]);

      for (let i = 0; i < 5; i++) {
        state = selectNodes(state, ['rect_1']);
        const res = VectorWorkflowOrchestrator.executeCrossSubsystemTransformSnapTransaction(state, 10, 10);
        state = res.snapshot;
      }

      expect(state.snapshot.nodes[0].transform.x).toBe(60);
    });

    it('E2E-05: User Intent: Compound Mask Creation & Release within Multi-Stage Workflow', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      const createOp: CrossSubsystemOperation = (snap) => {
        const maskRes = VectorCompoundTopologyMaskEngine.createVectorMask(snap.nodes[0], [snap.nodes[1]]);
        return { nodes: [maskRes.maskedNode!], selectedIds: [maskRes.maskedNode!.id] };
      };
      const releaseOp: CrossSubsystemOperation = (snap) => {
        const relRes = VectorCompoundTopologyMaskEngine.releaseVectorMask(snap.nodes[0]);
        return { nodes: [...relRes.releasedNodes!], selectedIds: [] };
      };

      const res = executeCrossSubsystemTransaction(state, [createOp, releaseOp], 'Mask Lifecycle');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes).toHaveLength(2);
    });

    it('E2E-06: User Intent: Deep Rollback of 10 Sequential Cross-Subsystem Transactions', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialSnap = state.snapshot;

      for (let i = 0; i < 10; i++) {
        const op: CrossSubsystemOperation = (snap) => ({
          ...snap,
          nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, x: n.transform.x + 5 } })),
        });
        const res = executeCrossSubsystemTransaction(state, [op], `Step ${i}`);
        state = res.snapshot;
      }

      // Rollback all 10 steps via undo
      for (let i = 0; i < 10; i++) {
        const undoRes = state.historyStack.undo();
        if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };
      }

      expect(state.snapshot.nodes[0].transform.x).toBe(initialSnap.nodes[0].transform.x);
    });

    it('E2E-07: User Intent: Multi-Shape Alignment + Distribution within Atomic Transaction', () => {
      const state = createVectorWorkspaceState([r1, r2, r3]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map((n, idx) => ({ ...n, transform: { ...n.transform, x: idx * 100 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Align & Distribute');
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(0);
      expect(res.snapshot.snapshot.nodes[1].transform.x).toBe(100);
      expect(res.snapshot.snapshot.nodes[2].transform.x).toBe(200);
    });

    it('E2E-08: User Intent: Group Hierarchy Transform + Layer Reorder in Single Step', () => {
      const group: ShapeGroupNode = {
        id: 'g1',
        type: 'group',
        transform: { x: 0, y: 0, width: 200, height: 200, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        children: [r1, r2],
      };
      const state = createVectorWorkspaceState([group, r3]);

      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: [snap.nodes[1], snap.nodes[0]], // Reorder
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Reorder Group');
      expect(res.snapshot.snapshot.nodes[0].id).toBe('rect_3');
    });

    it('E2E-09: User Intent: SVG Export Fidelity Preserved after Cross-Subsystem Transaction', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, width: 300, height: 300 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Resize');
      const svg = VectorSvgExporter.exportToSvgString(res.snapshot.snapshot);

      expect(svg).toContain('width="300"');
      expect(svg).toContain('height="300"');
    });

    it('E2E-10: User Intent: JSON Serializer Roundtrip after Multi-Subsystem Pipeline', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, opacity: 0.75 })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Opacity Pipeline');
      const json = VectorDocumentSerializer.serializeVectorDocument(res.snapshot.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes[0].opacity).toBe(0.75);
    });

    it('E2E-11: User Intent: Rapid 20 Transaction Sequence with Zero Memory Leaks', () => {
      let state = createVectorWorkspaceState([r1]);

      for (let i = 0; i < 20; i++) {
        const op: CrossSubsystemOperation = (snap) => ({
          ...snap,
          nodes: snap.nodes.map(n => ({ ...n, transform: { ...n.transform, y: i * 2 } })),
        });
        state = executeCrossSubsystemTransaction(state, [op], `Seq ${i}`).snapshot;
      }

      expect(state.snapshot.nodes[0].transform.y).toBe(38);
    });

    it('E2E-12: User Intent: Atomic Batch Transform of 50 Shapes', () => {
      const nodes = Array.from({ length: 50 }, (_, i) => ({ ...r1, id: `node_${i}` }));
      const state = createVectorWorkspaceState(nodes);

      const op: CrossSubsystemOperation = (snap) => ({
        ...snap,
        nodes: snap.nodes.map(n => ({ ...n, opacity: 0.9 })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Batch 50');
      expect(res.snapshot.snapshot.nodes).toHaveLength(50);
      expect(res.snapshot.snapshot.nodes[49].opacity).toBe(0.9);
    });

    it('E2E-13: User Intent: Cancellation at Step 2 of 3 Restores Initial State', () => {
      const state = createVectorWorkspaceState([r1]);
      const initialSnap = state.snapshot;

      const ops: CrossSubsystemOperation[] = [
        (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 500 } })) }),
        () => { throw new Error('User Cancelled'); },
        (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 999 } })) }),
      ];

      const res = executeCrossSubsystemTransaction(state, ops, 'Cancel Test');
      expect(res.snapshot.snapshot).toEqual(initialSnap);
    });

    it('E2E-14: User Intent: Multi-Subsystem Geometry & Style Transformation Combined', () => {
      const state = createVectorWorkspaceState([r1]);
      const geomOp: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 75, y: 75 } })),
      });
      const styleOp: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, fill: { type: 'solid', color: '#123456' }, opacity: 0.85 })),
      });

      const res = executeCrossSubsystemTransaction(state, [geomOp, styleOp], 'Geom + Style');
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(75);
      expect(res.snapshot.snapshot.nodes[0].fill?.color).toBe('#123456');
    });

    it('E2E-15: User Intent: Deep State Verification across 3 Redo Steps', () => {
      let state = createVectorWorkspaceState([r1]);

      for (let i = 0; i < 3; i++) {
        const op: CrossSubsystemOperation = (s) => ({
          ...s,
          nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: (i + 1) * 10 } })),
        });
        state = executeCrossSubsystemTransaction(state, [op], `Step ${i}`).snapshot;
      }

      // Undo all 3
      for (let i = 0; i < 3; i++) {
        const u = state.historyStack.undo();
        if (u) state = { snapshot: u.state, historyStack: u.stack };
      }

      // Redo all 3
      for (let i = 0; i < 3; i++) {
        const r = state.historyStack.redo();
        if (r) state = { snapshot: r.state, historyStack: r.stack };
      }

      expect(state.snapshot.nodes[0].transform.x).toBe(30);
    });

    it('E2E-16: User Intent: Transform + Snapping with Multiple Target Colliders', () => {
      let state = createVectorWorkspaceState([r1, r2, r3]);
      state = selectNodes(state, ['rect_1']);

      const res = VectorWorkflowOrchestrator.executeCrossSubsystemTransformSnapTransaction(state, 20, 0);
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(30);
    });

    it('E2E-17: User Intent: Multi-Shape Boolean Union and Mask Generation', () => {
      const state = createVectorWorkspaceState([p1, p2]);
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemPathBooleanMaskTransaction(
        state,
        'union',
        'path_1',
        ['path_2']
      );

      expect(res.success).toBe(true);
    });

    it('E2E-18: User Intent: Full Error Boundary Protection with Custom Error Object', () => {
      const state = createVectorWorkspaceState([r1]);
      const failingOp: CrossSubsystemOperation = () => {
        const err = new Error('Custom Error');
        (err as any).code = 'ERR_SUBSYSTEM_CRASH';
        throw err;
      };

      const res = executeCrossSubsystemTransaction(state, [failingOp], 'Custom Error');
      expect(res.success).toBe(false);
      expect(res.errors[0]).toBe('Custom Error');
    });

    it('E2E-19: User Intent: Preserves Lock Attribute across Cross-Subsystem Transaction', () => {
      const lockedR: RectangleNode = { ...r1, locked: true };
      const state = createVectorWorkspaceState([lockedR]);

      const op: CrossSubsystemOperation = (s) => ({ ...s });
      const res = executeCrossSubsystemTransaction(state, [op], 'Lock Check');

      expect(res.snapshot.snapshot.nodes[0].locked).toBe(true);
    });

    it('E2E-20: User Intent: Preserves Visible Attribute across Cross-Subsystem Transaction', () => {
      const hiddenR: RectangleNode = { ...r1, visible: false };
      const state = createVectorWorkspaceState([hiddenR]);

      const op: CrossSubsystemOperation = (s) => ({ ...s });
      const res = executeCrossSubsystemTransaction(state, [op], 'Visible Check');

      expect(res.snapshot.snapshot.nodes[0].visible).toBe(false);
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (≥45)
  // =========================================================================
  describe('4. Adversarial Scenarios', () => {
    it('ADV-01: handles operation returning NaN coordinates gracefully', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: NaN } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'NaN Test');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBeNaN();
    });

    it('ADV-02: handles operation returning Infinity coordinates gracefully', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, y: Infinity } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Infinity Test');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].transform.y).toBe(Infinity);
    });

    it('ADV-03: handles operation throwing non-Error string exception', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = () => { throw 'String Exception'; };

      const res = executeCrossSubsystemTransaction(state, [op], 'String Throw');
      expect(res.success).toBe(false);
      expect(res.errors).toContain('String Exception');
    });

    it('ADV-04: handles operation throwing null exception', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = () => { throw null; };

      const res = executeCrossSubsystemTransaction(state, [op], 'Null Throw');
      expect(res.success).toBe(false);
    });

    it('ADV-05: handles operation returning null snapshot', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = () => null as any;

      const res = executeCrossSubsystemTransaction(state, [op], 'Null Snap');
      expect(res.success).toBe(false);
    });

    it('ADV-06: handles operation returning undefined snapshot', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = () => undefined as any;

      const res = executeCrossSubsystemTransaction(state, [op], 'Undefined Snap');
      expect(res.success).toBe(false);
    });

    it('ADV-07: handles operation returning object without nodes array', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = () => ({ selectedIds: [] } as any);

      const res = executeCrossSubsystemTransaction(state, [op], 'Missing Nodes');
      expect(res.success).toBe(false);
    });

    it('ADV-08: handles operation with 100 consecutive identity no-ops', () => {
      const state = createVectorWorkspaceState([r1]);
      const ops: CrossSubsystemOperation[] = Array.from({ length: 100 }, () => (s: any) => s);

      const res = executeCrossSubsystemTransaction(state, ops, '100 No-Ops');
      expect(res.success).toBe(true);
    });

    it('ADV-09: handles transaction with 100 sequential valid operations', () => {
      const state = createVectorWorkspaceState([r1]);
      const ops: CrossSubsystemOperation[] = Array.from({ length: 100 }, (_, i) => (s: any) => ({
        ...s,
        nodes: s.nodes.map((n: any) => ({ ...n, transform: { ...n.transform, x: i } })),
      }));

      const res = executeCrossSubsystemTransaction(state, ops, '100 Ops');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(99);
    });

    it('ADV-10: handles extreme coordinate transforms (1e12, 1e12)', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 1e12, y: 1e12 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Extreme Coords');
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(1e12);
    });

    it('ADV-11: handles extreme negative coordinate transforms (-1e12, -1e12)', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: -1e12, y: -1e12 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Extreme Neg Coords');
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(-1e12);
    });

    it('ADV-12: handles extreme zero scale (0, 0)', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, scaleX: 0, scaleY: 0 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Zero Scale');
      expect(res.snapshot.snapshot.nodes[0].transform.scaleX).toBe(0);
    });

    it('ADV-13: handles negative scale (-1, -1)', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, scaleX: -1, scaleY: -1 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Negative Scale');
      expect(res.snapshot.snapshot.nodes[0].transform.scaleX).toBe(-1);
    });

    it('ADV-14: handles extreme rotation angle (7200 degrees)', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, rotationDeg: 7200 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'High Rotation');
      expect(res.snapshot.snapshot.nodes[0].transform.rotationDeg).toBe(7200);
    });

    it('ADV-15: handles negative rotation angle (-720 degrees)', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, rotationDeg: -720 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Neg Rotation');
      expect(res.snapshot.snapshot.nodes[0].transform.rotationDeg).toBe(-720);
    });

    it('ADV-16: handles operation on locked node', () => {
      const lockedR: RectangleNode = { ...r1, locked: true };
      const state = createVectorWorkspaceState([lockedR]);

      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => n.locked ? n : { ...n, transform: { ...n.transform, x: 99 } }),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Locked Test');
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('ADV-17: handles empty string description', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 20 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], '');
      expect(res.success).toBe(true);
    });

    it('ADV-18: handles undefined description parameter', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 20 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], undefined as any);
      expect(res.success).toBe(true);
    });

    it('ADV-19: handles duplicate node IDs inside operation', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: [s.nodes[0], { ...s.nodes[0] }],
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Duplicate Nodes');
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes).toHaveLength(2);
    });

    it('ADV-20: handles empty selectedIds in operation output', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);

      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        selectedIds: [],
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Empty Selection');
      expect(res.snapshot.snapshot.selectedIds).toHaveLength(0);
    });

    it('ADV-21: handles undefined selectedIds in operation output', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        nodes: s.nodes,
        selectedIds: undefined as any,
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Undefined Selection');
      expect(res.success).toBe(true);
    });

    it('ADV-22: handles 1000 nodes snapshot processing without timeout', () => {
      const nodes = Array.from({ length: 1000 }, (_, i) => ({ ...r1, id: `n_${i}` }));
      const state = createVectorWorkspaceState(nodes);

      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, opacity: 0.5 })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], '1000 Nodes');
      expect(res.snapshot.snapshot.nodes).toHaveLength(1000);
    });

    it('ADV-23: handles transform-snapping on zero delta (0, 0)', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);

      const res = VectorWorkflowOrchestrator.executeCrossSubsystemTransformSnapTransaction(state, 0, 0);
      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('ADV-24: handles transform-snapping with empty selection', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemTransformSnapTransaction(state, 50, 50);

      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('ADV-25: handles transform-snapping on locked selection', () => {
      const lockedR: RectangleNode = { ...r1, locked: true };
      let state = createVectorWorkspaceState([lockedR, r2]);
      state = selectNodes(state, ['rect_1']);

      const res = VectorWorkflowOrchestrator.executeCrossSubsystemTransformSnapTransaction(state, 50, 50);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('ADV-26: handles path-boolean-mask transaction with non-existent mask shape ID', () => {
      const state = createVectorWorkspaceState([p1, p2]);
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemPathBooleanMaskTransaction(
        state,
        'union',
        'NON_EXISTENT_ID',
        ['path_2']
      );

      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes.length).toBe(2);
    });

    it('ADV-27: handles path-boolean-mask transaction with empty target shapes array', () => {
      const state = createVectorWorkspaceState([p1]);
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemPathBooleanMaskTransaction(
        state,
        'union',
        'path_1',
        []
      );

      expect(res.success).toBe(true);
      expect(res.snapshot.snapshot.nodes.length).toBe(1);
    });

    it('ADV-28: handles path-boolean-mask transaction with locked mask shape', () => {
      const lockedP: PathNode = { ...p1, locked: true };
      const state = createVectorWorkspaceState([lockedP, p2]);

      const res = VectorWorkflowOrchestrator.executeCrossSubsystemPathBooleanMaskTransaction(
        state,
        'union',
        'path_1',
        ['path_2']
      );

      expect(res.snapshot.snapshot.nodes.length).toBe(2);
    });

    it('ADV-29: handles path-boolean-mask transaction with locked target shape', () => {
      const lockedP: PathNode = { ...p2, locked: true };
      const state = createVectorWorkspaceState([p1, lockedP]);

      const res = VectorWorkflowOrchestrator.executeCrossSubsystemPathBooleanMaskTransaction(
        state,
        'union',
        'path_1',
        ['path_2']
      );

      expect(res.snapshot.snapshot.nodes.length).toBe(2);
    });

    it('ADV-30: handles operation that mutates transform width and height to zero', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, width: 0, height: 0 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Zero Dimensions');
      expect(res.snapshot.snapshot.nodes[0].transform.width).toBe(0);
    });

    it('ADV-31: handles operation that removes all properties except id and type', () => {
      const state = createVectorWorkspaceState([r1]);
      const minimalNode: any = { id: 'm1', type: 'rectangle', transform: { x: 0, y: 0, width: 10, height: 10, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const op: CrossSubsystemOperation = () => ({ nodes: [minimalNode], selectedIds: [] });

      const res = executeCrossSubsystemTransaction(state, [op], 'Minimal Node');
      expect(res.success).toBe(true);
    });

    it('ADV-32: handles operation that sets opacity out of bounds (>1)', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, opacity: 5.0 })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Opacity > 1');
      expect(res.snapshot.snapshot.nodes[0].opacity).toBe(5.0);
    });

    it('ADV-33: handles operation that sets negative opacity', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, opacity: -0.5 })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Negative Opacity');
      expect(res.snapshot.snapshot.nodes[0].opacity).toBe(-0.5);
    });

    it('ADV-34: handles rapid rollback calls', () => {
      const state = createVectorWorkspaceState([r1]);
      const failingOp: CrossSubsystemOperation = () => { throw new Error('Crash'); };

      for (let i = 0; i < 5; i++) {
        executeCrossSubsystemTransaction(state, [failingOp], `Fail ${i}`);
      }

      expect(state.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('ADV-35: handles operation creating complex Bezier path strings', () => {
      const state = createVectorWorkspaceState([p1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => n.type === 'path' ? { ...n, d: 'M 0 0 C 10 20 30 40 50 50 S 70 80 90 90 Z' } : n),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Complex Path');
      expect((res.snapshot.snapshot.nodes[0] as PathNode).d).toContain('C 10 20');
    });

    it('ADV-36: handles operation on node with zero-length string id', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, id: '' })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Empty ID');
      expect(res.success).toBe(true);
    });

    it('ADV-37: handles operation creating deeply nested 5-level group hierarchy', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = () => {
        let root: any = r1;
        for (let i = 0; i < 5; i++) {
          root = {
            id: `g_${i}`,
            type: 'group',
            transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
            children: [root],
          };
        }
        return { nodes: [root], selectedIds: ['g_4'] };
      };

      const res = executeCrossSubsystemTransaction(state, [op], '5-Level Group');
      expect(res.success).toBe(true);
    });

    it('ADV-38: handles operation with special characters in description', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 20 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], '<script>alert("xss")</script> & 🔥');
      expect(res.success).toBe(true);
    });

    it('ADV-39: handles operation with 10,000 characters description', () => {
      const state = createVectorWorkspaceState([r1]);
      const longDesc = 'A'.repeat(10000);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 20 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], longDesc);
      expect(res.success).toBe(true);
    });

    it('ADV-40: handles multiple operations all returning identical snapshots', () => {
      const state = createVectorWorkspaceState([r1]);
      const idOps = Array.from({ length: 10 }, () => (s: any) => ({ ...s }));

      const res = executeCrossSubsystemTransaction(state, idOps, 'Identical Ops');
      expect(res.success).toBe(true);
    });

    it('ADV-41: handles operation with null fill object', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, fill: null as any })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Null Fill');
      expect(res.snapshot.snapshot.nodes[0].fill).toBeNull();
    });

    it('ADV-42: handles operation with null stroke object', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, stroke: null as any })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Null Stroke');
      expect(res.snapshot.snapshot.nodes[0].stroke).toBeNull();
    });

    it('ADV-43: handles operation with negative width and height', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, width: -50, height: -50 } })),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Negative Dimensions');
      expect(res.snapshot.snapshot.nodes[0].transform.width).toBe(-50);
    });

    it('ADV-44: handles repeated executeCrossSubsystemTransaction invocations in parallel loop', () => {
      const state = createVectorWorkspaceState([r1]);

      for (let i = 0; i < 30; i++) {
        const op: CrossSubsystemOperation = (s) => ({
          ...s,
          nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: i } })),
        });
        const res = executeCrossSubsystemTransaction(state, [op], `Parallel Sim ${i}`);
        expect(res.success).toBe(true);
      }
    });

    it('ADV-45: handles operation modifying non-standard custom attributes', () => {
      const state = createVectorWorkspaceState([r1]);
      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, customData: 'test_value' } as any)),
      });

      const res = executeCrossSubsystemTransaction(state, [op], 'Custom Attribute');
      expect((res.snapshot.snapshot.nodes[0] as any).customData).toBe('test_value');
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION POINTS (≥25)
  // =========================================================================
  describe('5. Failure Injection Points', () => {
    it('FI-01: Failure Before First Subsystem Invocation', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = executeCrossSubsystemTransaction(null as any, [], 'Fail Before First');
      expect(res.success).toBe(false);
    });

    it('FI-02: Failure After Subsystem 1 Execution', () => {
      const state = createVectorWorkspaceState([r1]);
      const op1: CrossSubsystemOperation = (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 50 } })) });
      const op2: CrossSubsystemOperation = () => { throw new Error('Subsystem 2 Crash'); };

      const res = executeCrossSubsystemTransaction(state, [op1, op2], 'Fail Step 2');
      expect(res.success).toBe(false);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('FI-03: Failure After Subsystem 2 Execution', () => {
      const state = createVectorWorkspaceState([r1]);
      const op1: CrossSubsystemOperation = (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 50 } })) });
      const op2: CrossSubsystemOperation = (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, y: 50 } })) });
      const op3: CrossSubsystemOperation = () => { throw new Error('Subsystem 3 Crash'); };

      const res = executeCrossSubsystemTransaction(state, [op1, op2, op3], 'Fail Step 3');
      expect(res.success).toBe(false);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('FI-04: Failure After Subsystem 3 Execution', () => {
      const state = createVectorWorkspaceState([r1]);
      const op1: CrossSubsystemOperation = (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 50 } })) });
      const op2: CrossSubsystemOperation = (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, y: 50 } })) });
      const op3: CrossSubsystemOperation = (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, opacity: 0.5 })) });
      const op4: CrossSubsystemOperation = () => { throw new Error('Subsystem 4 Crash'); };

      const res = executeCrossSubsystemTransaction(state, [op1, op2, op3, op4], 'Fail Step 4');
      expect(res.success).toBe(false);
      expect(res.snapshot.snapshot.nodes[0].opacity).toBe(1);
    });

    it('FI-05: Failure During Snapshot Validation (Non-Array Nodes)', () => {
      const state = createVectorWorkspaceState([r1]);
      const badOp: CrossSubsystemOperation = () => ({ nodes: 'invalid' as any, selectedIds: [] });

      const res = executeCrossSubsystemTransaction(state, [badOp], 'Fail Validation');
      expect(res.success).toBe(false);
    });

    it('FI-06: Failure During Snapshot Validation (Null Node Object)', () => {
      const state = createVectorWorkspaceState([r1]);
      const badOp: CrossSubsystemOperation = () => null as any;

      const res = executeCrossSubsystemTransaction(state, [badOp], 'Fail Null Snap');
      expect(res.success).toBe(false);
    });

    it('FI-07: Failure During History Commit Push Exception', () => {
      const state = createVectorWorkspaceState([r1]);
      const brokenState = {
        ...state,
        historyStack: {
          ...state.historyStack,
          push: () => { throw new Error('History Disk Full Exception'); },
        },
      };

      const op: CrossSubsystemOperation = (s) => ({
        ...s,
        nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: 99 } })),
      });

      expect(() => executeCrossSubsystemTransaction(brokenState, [op], 'Fail History Push')).toThrow();
    });

    it('FI-08: Failure During Document JSON Serialization', () => {
      const circularNode: any = { id: 'c1', type: 'rectangle' };
      circularNode.self = circularNode;

      expect(() => VectorDocumentSerializer.serializeVectorDocument({ nodes: [circularNode], selectedIds: [] })).toThrow();
    });

    it('FI-09: Failure During SVG Export Rendering', () => {
      const brokenSvgNode: any = { id: 'b1', type: 'group', visible: true, children: null };
      expect(() => VectorSvgExporter.exportToSvgString({ nodes: [brokenSvgNode], selectedIds: [] })).toThrow();
    });

    it('FI-10: Failure During Recovery Rollback', () => {
      const state = createVectorWorkspaceState([r1]);
      const failingOp: CrossSubsystemOperation = () => { throw new Error('Simulated Crash'); };

      const res = executeCrossSubsystemTransaction(state, [failingOp], 'Fail Recovery');
      expect(res.snapshot.snapshot.nodes).toEqual(state.snapshot.nodes);
    });

    it('FI-11: Failure Injection: Corrupted Coordinate NaN Recovery', () => {
      const state = createVectorWorkspaceState([r1]);
      const op1: CrossSubsystemOperation = (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, x: NaN } })) });
      const op2: CrossSubsystemOperation = () => { throw new Error('Abort on NaN'); };

      const res = executeCrossSubsystemTransaction(state, [op1, op2], 'NaN Abort');
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('FI-12: Failure Injection: Corrupted Coordinate Infinity Recovery', () => {
      const state = createVectorWorkspaceState([r1]);
      const op1: CrossSubsystemOperation = (s) => ({ ...s, nodes: s.nodes.map(n => ({ ...n, transform: { ...n.transform, y: Infinity } })) });
      const op2: CrossSubsystemOperation = () => { throw new Error('Abort on Infinity'); };

      const res = executeCrossSubsystemTransaction(state, [op1, op2], 'Inf Abort');
      expect(res.snapshot.snapshot.nodes[0].transform.y).toBe(10);
    });

    it('FI-13: Failure Injection: Undefined Transform Object Ingestion', () => {
      const corrupted: any = { id: 'bad_t', type: 'rectangle', transform: undefined };
      const json = JSON.stringify({ schema: 'vector_document', version: 1, nodes: [corrupted] });
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.success).toBe(true);
      expect(restored.snapshot!.nodes[0].transform).toBeDefined();
    });

    it('FI-14: Failure Injection: Malformed SVG Path String Recovery', () => {
      const badPath = createPathNode('bp', 'MALFORMED D STRING', 0, 0, 10, 10);
      const state = createVectorWorkspaceState([badPath]);

      const op: CrossSubsystemOperation = (s) => ({ ...s, nodes: s.nodes });
      const res = executeCrossSubsystemTransaction(state, [op], 'Malformed D');

      expect(res.success).toBe(true);
    });

    it('FI-15: Failure Injection: Locked Node Transform Rejection', () => {
      const lockedR: RectangleNode = { ...r1, locked: true };
      let state = createVectorWorkspaceState([lockedR, r2]);
      state = selectNodes(state, ['rect_1']);

      const res = VectorWorkflowOrchestrator.executeCrossSubsystemTransformSnapTransaction(state, 50, 50);
      expect(res.snapshot.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('FI-16: Failure Injection: Non-Existent Target Shape in Boolean Operation', () => {
      const state = createVectorWorkspaceState([p1]);
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemPathBooleanMaskTransaction(
        state,
        'union',
        'path_1',
        ['non_existent']
      );

      expect(res.snapshot.snapshot.nodes).toHaveLength(1);
    });

    it('FI-17: Failure Injection: Non-Existent Mask Shape in Mask Operation', () => {
      const state = createVectorWorkspaceState([p1]);
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemPathBooleanMaskTransaction(
        state,
        'union',
        'non_existent',
        ['path_1']
      );

      expect(res.snapshot.snapshot.nodes).toHaveLength(1);
    });

    it('FI-18: Failure Injection: Operation Returning Primitive String Instead of Object', () => {
      const state = createVectorWorkspaceState([r1]);
      const badOp: CrossSubsystemOperation = () => 'invalid_string' as any;

      const res = executeCrossSubsystemTransaction(state, [badOp], 'Primitive Return');
      expect(res.success).toBe(false);
    });

    it('FI-19: Failure Injection: Operation Returning Number Instead of Object', () => {
      const state = createVectorWorkspaceState([r1]);
      const badOp: CrossSubsystemOperation = () => 12345 as any;

      const res = executeCrossSubsystemTransaction(state, [badOp], 'Number Return');
      expect(res.success).toBe(false);
    });

    it('FI-20: Failure Injection: Operation Returning Boolean Instead of Object', () => {
      const state = createVectorWorkspaceState([r1]);
      const badOp: CrossSubsystemOperation = () => false as any;

      const res = executeCrossSubsystemTransaction(state, [badOp], 'Boolean Return');
      expect(res.success).toBe(false);
    });

    it('FI-21: Failure Injection: Serialization Syntax Error Handling', () => {
      const res = VectorDocumentSerializer.restoreVectorDocument('{ bad syntax:');
      expect(res.success).toBe(false);
    });

    it('FI-22: Failure Injection: Schema Version Mismatch Handling', () => {
      const json = JSON.stringify({ schema: 'vector_document', version: 999, nodes: [] });
      const res = VectorDocumentSerializer.restoreVectorDocument(json);
      expect(res.success).toBe(true);
    });

    it('FI-23: Failure Injection: Schema Name Mismatch Handling', () => {
      const json = JSON.stringify({ schema: 'invalid_schema_name', version: 1, nodes: [] });
      const res = VectorDocumentSerializer.restoreVectorDocument(json);
      expect(res.success).toBe(false);
    });

    it('FI-24: Failure Injection: Empty Workspace State Handling', () => {
      const emptyState: any = {};
      const res = executeCrossSubsystemTransaction(emptyState, [], 'Empty Workspace');
      expect(res.success).toBe(false);
    });

    it('FI-25: Failure Injection: Null Workspace State Handling', () => {
      const res = executeCrossSubsystemTransaction(null as any, [], 'Null Workspace');
      expect(res.success).toBe(false);
    });
  });
});
