import { describe, it, expect } from 'vitest';
import {
  createVectorWorkspaceState,
  selectNodes,
  executeBooleanOperation,
  undoVectorAction,
  redoVectorAction,
} from '../VectorWorkspaceController';
import { createRectangleNode } from '../VectorDomainModel';

describe('VectorWorkspaceController', () => {
  const rectA = createRectangleNode('rectA', 0, 0, 100, 100);
  const rectB = createRectangleNode('rectB', 50, 50, 100, 100);

  describe('LEVEL 1 — COMMAND (Dispatch & Selection)', () => {
    it('ignores boolean operation if less than 2 nodes are selected', () => {
      let state = createVectorWorkspaceState([rectA, rectB]);
      state = selectNodes(state, ['rectA']);
      const nextState = executeBooleanOperation(state, 'union');
      expect(nextState.historyStack.entries.length).toBe(state.historyStack.entries.length);
      expect(nextState.snapshot.nodes).toHaveLength(2);
    });

    it('ignores boolean operation if incompatible node types are selected', () => {
      // In a real scenario, this would test unsupported node types if they existed.
      // Currently all shapes except group are supported. Group is unsupported.
      const groupNode = { id: 'groupA', type: 'group', children: [], transform: rectA.transform, visible: true, opacity: 1, locked: false, name: 'G' } as any;
      let state = createVectorWorkspaceState([rectA, groupNode]);
      state = selectNodes(state, ['rectA', 'groupA']);
      const nextState = executeBooleanOperation(state, 'union');
      expect(nextState.snapshot.nodes).toHaveLength(2);
    });

    it('executes valid boolean operation when 2 valid nodes are selected', () => {
      let state = createVectorWorkspaceState([rectA, rectB]);
      state = selectNodes(state, ['rectA', 'rectB']);
      const nextState = executeBooleanOperation(state, 'union');
      expect(nextState.historyStack.entries.length).toBe(state.historyStack.entries.length + 1);
    });
  });

  describe('LEVEL 2 — DOCUMENT (Mutation & Immutability)', () => {
    it('replaces original nodes with the resulting node and preserves document tree immutability', () => {
      const state = createVectorWorkspaceState([rectA, rectB]);
      const selectedState = selectNodes(state, ['rectA', 'rectB']);
      const nextState = executeBooleanOperation(selectedState, 'subtract');

      // Original state is unharmed
      expect(selectedState.snapshot.nodes).toHaveLength(2);
      
      // New state has exactly 1 node
      expect(nextState.snapshot.nodes).toHaveLength(1);
      const resultNode = nextState.snapshot.nodes[0];
      expect(resultNode.type).toBe('path');
      expect(resultNode.id).toContain('boolean_sub_');

      // New node is automatically selected
      expect(nextState.snapshot.selectedIds).toEqual([resultNode.id]);
    });

    it('inserts the resulting node at the lowest z-index of the source objects', () => {
      const rectC = createRectangleNode('rectC', 200, 200, 100, 100);
      const state = createVectorWorkspaceState([rectA, rectB, rectC]);
      // Select A and C (indices 0 and 2)
      const selectedState = selectNodes(state, ['rectA', 'rectC']);
      const nextState = executeBooleanOperation(selectedState, 'union');

      expect(nextState.snapshot.nodes).toHaveLength(2);
      // Expected order: [Union(A,C), B] because A was at index 0
      expect(nextState.snapshot.nodes[0].type).toBe('path');
      expect(nextState.snapshot.nodes[1].id).toBe('rectB');
    });
  });

  describe('LEVEL 3 — HISTORY (Undo/Redo & Exact Match)', () => {
    it('restores exact document snapshot on Undo, including Selection, Nodes, and Metadata', () => {
      const state = createVectorWorkspaceState([rectA, rectB], ['rectA', 'rectB']);
      const afterBooleanState = executeBooleanOperation(state, 'xor');

      expect(afterBooleanState.snapshot.nodes).toHaveLength(1);
      expect(afterBooleanState.snapshot.selectedIds).toHaveLength(1);

      // Perform Undo
      const restoredState = undoVectorAction(afterBooleanState);

      // Verify Exact Restoration
      expect(restoredState.snapshot.nodes).toHaveLength(2);
      expect(restoredState.snapshot.nodes[0]).toEqual(rectA);
      expect(restoredState.snapshot.nodes[1]).toEqual(rectB);
      
      // Verify Selection Restoration
      expect(restoredState.snapshot.selectedIds).toEqual(['rectA', 'rectB']);
    });

    it('restores exact document snapshot on Redo', () => {
      const state = createVectorWorkspaceState([rectA, rectB], ['rectA', 'rectB']);
      const afterBooleanState = executeBooleanOperation(state, 'intersect');
      
      const undoneState = undoVectorAction(afterBooleanState);
      const redoneState = redoVectorAction(undoneState);

      expect(redoneState.snapshot.nodes).toHaveLength(1);
      expect(redoneState.snapshot.nodes[0]).toEqual(afterBooleanState.snapshot.nodes[0]);
      expect(redoneState.snapshot.selectedIds).toEqual(afterBooleanState.snapshot.selectedIds);
    });

    it('handles negative cases: undo without operation, redo after new operation', () => {
      const state = createVectorWorkspaceState([rectA, rectB], ['rectA', 'rectB']);
      // Initial state has only 1 history entry, cannot undo
      const undoFailed = undoVectorAction(state);
      expect(undoFailed.snapshot).toBe(state.snapshot);

      // Redo when nothing to redo
      const redoFailed = redoVectorAction(state);
      expect(redoFailed.snapshot).toBe(state.snapshot);

      // Redo after new operation clears future
      const stateOp1 = executeBooleanOperation(state, 'union');
      const stateUndo1 = undoVectorAction(stateOp1);
      // Now perform a new operation while undone
      const stateOp2 = executeBooleanOperation(stateUndo1, 'subtract');
      // Now redo should fail because future was cleared by Op2
      const redoCleared = redoVectorAction(stateOp2);
      expect(redoCleared.snapshot).toBe(stateOp2.snapshot);
    });
  });
});
