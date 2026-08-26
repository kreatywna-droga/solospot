/**
 * VectorWorkspaceProductFlow.test.ts — G1-24 Full Product Flow Integration Test
 *
 * Tests the complete VectorToolbar → Controller → BooleanEngine → HistoryStack → Rendering pipeline.
 *
 * Test Levels:
 *   LEVEL 1 — Boolean dispatch (toolbar → controller)
 *   LEVEL 2 — Document mutation (immutable node replacement)
 *   LEVEL 3 — History (undo/redo exact snapshot match)
 *   LEVEL 4 — Rendering bridge (command generation for boolean results)
 *   LEVEL 5 — Selection (auto-select result, restore on undo)
 *   LEVEL 6 — Multi-operation sequence (union → undo → intersect → redo)
 */

import { describe, it, expect } from 'vitest';
import {
  createVectorWorkspaceState,
  selectNodes,
  executeBooleanOperation,
  undoVectorAction,
  redoVectorAction,
  VectorWorkspaceState,
} from '../VectorWorkspaceController';
import { createRectangleNode, createEllipseNode, VectorNode } from '../VectorDomainModel';
import { VectorBooleanEngine } from '../VectorBooleanEngine';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';
import { VectorGeometry } from '../VectorGeometry';

// Reusable fixtures
const rectA = createRectangleNode('rectA', 0, 0, 100, 100);
const rectB = createRectangleNode('rectB', 50, 50, 100, 100);
const ellipseC = createEllipseNode('ellipseC', 25, 25, 80, 80);

function selectedState(nodes: VectorNode[], ids: string[]): VectorWorkspaceState {
  return createVectorWorkspaceState(nodes, ids);
}

describe('G1-24 — Full Vector Boolean Product Flow', () => {

  // -----------------------------------------------------------------------
  // LEVEL 1 — BOOLEAN DISPATCH
  // -----------------------------------------------------------------------
  describe('LEVEL 1 — Boolean Dispatch', () => {
    it.each<'union' | 'subtract' | 'intersect' | 'xor'>([
      'union', 'subtract', 'intersect', 'xor'
    ])('dispatches %s operation and produces a path node', (op) => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);
      const next = executeBooleanOperation(state, op);

      expect(next.snapshot.nodes).toHaveLength(1);
      expect(next.snapshot.nodes[0].type).toBe('path');
    });

    it('no-ops when fewer than 2 nodes selected', () => {
      const state = selectedState([rectA, rectB], ['rectA']);
      const next = executeBooleanOperation(state, 'union');
      expect(next).toBe(state);
    });

    it('no-ops when incompatible nodes (group) are selected', () => {
      const group = { id: 'g1', type: 'group', children: [], transform: rectA.transform, visible: true, opacity: 1, locked: false, name: 'G' } as any;
      const state = selectedState([rectA, group], ['rectA', 'g1']);
      const next = executeBooleanOperation(state, 'union');
      expect(next.snapshot.nodes).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // LEVEL 2 — DOCUMENT MUTATION & IMMUTABILITY
  // -----------------------------------------------------------------------
  describe('LEVEL 2 — Document Mutation', () => {
    it('replaces source nodes with single result path at correct z-index', () => {
      const rectC = createRectangleNode('rectC', 200, 0, 50, 50);
      const state = selectedState([rectA, rectB, rectC], ['rectA', 'rectB']);
      const next = executeBooleanOperation(state, 'union');

      // 2 source nodes replaced with 1 result, third node preserved
      expect(next.snapshot.nodes).toHaveLength(2);
      expect(next.snapshot.nodes[0].type).toBe('path'); // Union result at index 0
      expect(next.snapshot.nodes[1].id).toBe('rectC');
    });

    it('preserves immutability of original state', () => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);
      const originalSnapshot = JSON.stringify(state.snapshot);
      executeBooleanOperation(state, 'subtract');
      expect(JSON.stringify(state.snapshot)).toBe(originalSnapshot);
    });
  });

  // -----------------------------------------------------------------------
  // LEVEL 3 — HISTORY (UNDO/REDO)
  // -----------------------------------------------------------------------
  describe('LEVEL 3 — History Stack', () => {
    it('pushes boolean operation to history and enables undo', () => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);
      expect(state.historyStack.canUndo).toBe(false);

      const after = executeBooleanOperation(state, 'union');
      expect(after.historyStack.canUndo).toBe(true);
      expect(after.historyStack.entries.length).toBe(state.historyStack.entries.length + 1);
    });

    it('undo restores exact pre-operation snapshot (nodes + selection)', () => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);
      const after = executeBooleanOperation(state, 'intersect');

      expect(after.snapshot.nodes).toHaveLength(1);

      const undone = undoVectorAction(after);
      expect(undone.snapshot.nodes).toHaveLength(2);
      expect(undone.snapshot.nodes[0]).toEqual(rectA);
      expect(undone.snapshot.nodes[1]).toEqual(rectB);
      expect(undone.snapshot.selectedIds).toEqual(['rectA', 'rectB']);
    });

    it('redo restores exact post-operation snapshot', () => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);
      const after = executeBooleanOperation(state, 'xor');
      const undone = undoVectorAction(after);
      const redone = redoVectorAction(undone);

      expect(redone.snapshot.nodes).toHaveLength(1);
      expect(redone.snapshot.nodes[0]).toEqual(after.snapshot.nodes[0]);
      expect(redone.snapshot.selectedIds).toEqual(after.snapshot.selectedIds);
    });

    it('new operation after undo clears redo future', () => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);
      const after1 = executeBooleanOperation(state, 'union');
      const undone = undoVectorAction(after1);
      const after2 = executeBooleanOperation(undone, 'subtract');

      expect(after2.historyStack.canRedo).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // LEVEL 4 — RENDERING BRIDGE
  // -----------------------------------------------------------------------
  describe('LEVEL 4 — Rendering Integration', () => {
    it('boolean result node compiles into valid DRAW_PATH command', () => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);
      const after = executeBooleanOperation(state, 'union');
      const resultNode = after.snapshot.nodes[0];

      const commands = VectorRenderingBridge.buildRenderCommands(resultNode);

      // Structure: SAVE → SET_TRANSFORM → DRAW_PATH → RESTORE
      expect(commands.length).toBeGreaterThanOrEqual(4);
      expect(commands[0].type).toBe('SAVE');

      const drawCmd = commands.find(c => c.type === 'DRAW_PATH');
      expect(drawCmd).toBeDefined();
      if (drawCmd && drawCmd.type === 'DRAW_PATH') {
        expect(drawCmd.d.length).toBeGreaterThan(0);
        expect(drawCmd.nodeId).toBe(resultNode.id);
      }
    });

    it('rendering commands update after undo (restored nodes render correctly)', () => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);
      const after = executeBooleanOperation(state, 'subtract');
      const undone = undoVectorAction(after);

      // After undo, should generate DRAW_RECT commands (not DRAW_PATH)
      const cmdA = VectorRenderingBridge.buildRenderCommands(undone.snapshot.nodes[0]);
      const cmdB = VectorRenderingBridge.buildRenderCommands(undone.snapshot.nodes[1]);

      expect(cmdA.find(c => c.type === 'DRAW_RECT')).toBeDefined();
      expect(cmdB.find(c => c.type === 'DRAW_RECT')).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // LEVEL 5 — SELECTION
  // -----------------------------------------------------------------------
  describe('LEVEL 5 — Selection Management', () => {
    it('auto-selects resulting boolean node', () => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);
      const after = executeBooleanOperation(state, 'union');

      expect(after.snapshot.selectedIds).toHaveLength(1);
      expect(after.snapshot.selectedIds[0]).toBe(after.snapshot.nodes[0].id);
    });

    it('selection restored on undo', () => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);
      const after = executeBooleanOperation(state, 'intersect');
      const undone = undoVectorAction(after);

      expect(undone.snapshot.selectedIds).toEqual(['rectA', 'rectB']);
    });

    it('selectNodes does not push to history', () => {
      const state = selectedState([rectA, rectB], ['rectA']);
      const entriesBefore = state.historyStack.entries.length;
      const next = selectNodes(state, ['rectA', 'rectB']);
      expect(next.historyStack.entries.length).toBe(entriesBefore);
    });
  });

  // -----------------------------------------------------------------------
  // LEVEL 6 — MULTI-OPERATION SEQUENCE
  // -----------------------------------------------------------------------
  describe('LEVEL 6 — Multi-operation Sequence', () => {
    it('chain: union → undo → intersect → verify distinct results', () => {
      const state = selectedState([rectA, rectB], ['rectA', 'rectB']);

      // Step 1: union
      const afterUnion = executeBooleanOperation(state, 'union');
      const unionId = afterUnion.snapshot.nodes[0].id;

      // Step 2: undo → back to original
      const afterUndo = undoVectorAction(afterUnion);
      expect(afterUndo.snapshot.nodes).toHaveLength(2);

      // Step 3: intersect (discards redo future of union)
      const afterIntersect = executeBooleanOperation(afterUndo, 'intersect');
      expect(afterIntersect.snapshot.nodes).toHaveLength(1);
      const intersectId = afterIntersect.snapshot.nodes[0].id;

      // Union and intersect produce distinct nodes
      expect(unionId).not.toBe(intersectId);
      expect(afterIntersect.historyStack.canRedo).toBe(false);
    });

    it('chain: subtract → subtract on remaining → verify progressive reduction', () => {
      const rectC = createRectangleNode('rectC', 80, 80, 100, 100);
      const state = selectedState([rectA, rectB, rectC], ['rectA', 'rectB']);

      // Step 1: subtract A-B
      const after1 = executeBooleanOperation(state, 'subtract');
      expect(after1.snapshot.nodes).toHaveLength(2); // result + rectC

      // Step 2: select result + rectC, then subtract again
      const resultId = after1.snapshot.nodes[0].id;
      const withSelection = selectNodes(after1, [resultId, 'rectC']);
      const after2 = executeBooleanOperation(withSelection, 'subtract');

      expect(after2.snapshot.nodes).toHaveLength(1);
      expect(after2.snapshot.nodes[0].type).toBe('path');

      // Step 3: undo both
      const undo1 = undoVectorAction(after2);
      expect(undo1.snapshot.nodes).toHaveLength(2);

      const undo2 = undoVectorAction(undo1);
      expect(undo2.snapshot.nodes).toHaveLength(3);
      expect(undo2.snapshot.nodes[0].id).toBe('rectA');
      expect(undo2.snapshot.nodes[1].id).toBe('rectB');
      expect(undo2.snapshot.nodes[2].id).toBe('rectC');
    });

    it('mixed rectangle + ellipse boolean operations work correctly', () => {
      const state = selectedState([rectA, ellipseC], ['rectA', 'ellipseC']);
      const after = executeBooleanOperation(state, 'union');

      expect(after.snapshot.nodes).toHaveLength(1);
      expect(after.snapshot.nodes[0].type).toBe('path');

      // Result should have valid rendering commands
      const cmds = VectorRenderingBridge.buildRenderCommands(after.snapshot.nodes[0]);
      expect(cmds.find(c => c.type === 'DRAW_PATH')).toBeDefined();
    });
  });
});
