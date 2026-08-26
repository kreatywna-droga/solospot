/**
 * VectorWorkspaceTransaction.test.ts — G1-26 Transaction Integrity & Adversarial Suite
 *
 * Tests transaction safety, error rollback, degenerate shape handling,
 * node mutation dispatcher actions, and full undo/redo state preservation.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createVectorWorkspaceState,
  selectNodes,
  executeBooleanOperation,
  updateNode,
  addNode,
  deleteSelectedNodes,
  undoVectorAction,
  redoVectorAction,
  VectorWorkspaceState,
} from '../VectorWorkspaceController';
import { createRectangleNode, createEllipseNode, VectorNode } from '../VectorDomainModel';
import { VectorBooleanEngine } from '../VectorBooleanEngine';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';

describe('G1-26 — Vector Transaction Integrity & Adversarial Testing', () => {
  const rectA = createRectangleNode('rectA', 0, 0, 100, 100);
  const rectB = createRectangleNode('rectB', 50, 50, 100, 100);
  const ellipseC = createEllipseNode('ellipseC', 500, 500, 100, 100); // Non-overlapping

  function makeState(nodes: VectorNode[], selection: string[]): VectorWorkspaceState {
    return createVectorWorkspaceState(nodes, selection);
  }

  // 1. Normal operation
  it('1. normal operation: executes boolean operation cleanly', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union');
    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.selectedIds).toEqual([state.snapshot.nodes[0].id]);
  });

  // 2. Empty input
  it('2. empty input: returns unchanged state when nodes array is empty', () => {
    let state = makeState([], []);
    const result = executeBooleanOperation(state, 'union');
    expect(result).toBe(state);
  });

  // 3. Invalid selection
  it('3. invalid selection: ignores non-existent selection IDs', () => {
    let state = makeState([rectA, rectB], ['non_existent_1', 'non_existent_2']);
    const result = executeBooleanOperation(state, 'union');
    expect(result).toBe(state);
  });

  // 4. Stale selection
  it('4. stale selection: selectNodes filters out stale/deleted node IDs', () => {
    let state = makeState([rectA], ['rectA']);
    state = selectNodes(state, ['rectA', 'deleted_id_99']);
    expect(state.snapshot.selectedIds).toEqual(['rectA']);
  });

  // 5. Missing node
  it('5. missing node: handles partial missing node in selection set without crashing', () => {
    let state = makeState([rectA, rectB], ['rectA', 'missingNode']);
    const result = executeBooleanOperation(state, 'union');
    expect(result).toBe(state);
  });

  // 6. Duplicate node ID
  it('6. duplicate node ID: rapid CSG calls generate distinct IDs even with identical timestamps', () => {
    const origDate = Date.now;
    Date.now = () => 99999999;
    try {
      let state1 = makeState([rectA, rectB], ['rectA', 'rectB']);
      state1 = executeBooleanOperation(state1, 'union');

      let state2 = makeState([rectA, rectB], ['rectA', 'rectB']);
      state2 = executeBooleanOperation(state2, 'union');

      expect(state1.snapshot.nodes[0].id).not.toBe(state2.snapshot.nodes[0].id);
    } finally {
      Date.now = origDate;
    }
  });

  // 7. Failed operation (Simulated Engine Exception -> Transaction Rollback)
  it('7. failed operation: CSG engine exception causes clean rollback without corrupting document or history', () => {
    const spy = vi.spyOn(VectorBooleanEngine, 'performOperation').mockImplementationOnce(() => {
      throw new Error('Simulated CSG Engine Crash');
    });

    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    const originalHistoryCount = state.historyStack.entries.length;

    // Operation fails internally
    const resultState = executeBooleanOperation(state, 'union');

    // Document state remains identical
    expect(resultState.snapshot).toBe(state.snapshot);
    // History stack was NOT polluted with corrupt entry
    expect(resultState.historyStack.entries.length).toBe(originalHistoryCount);

    spy.mockRestore();
  });

  // 8. Repeated operation
  it('8. repeated operation: handles sequential operations without history or rendering drift', () => {
    let state = makeState([rectA, rectB, ellipseC], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union');
    const unionId = state.snapshot.nodes[0].id;

    state = selectNodes(state, [unionId, 'ellipseC']);
    state = executeBooleanOperation(state, 'union');

    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.historyStack.entries.length).toBe(3); // Initial + Op1 + Op2
  });

  // 9. Operation → undo
  it('9. operation -> undo: restores pre-operation snapshot perfectly', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    const postOp = executeBooleanOperation(state, 'intersect');
    const undone = undoVectorAction(postOp);

    expect(undone.snapshot.nodes).toEqual(state.snapshot.nodes);
    expect(undone.snapshot.selectedIds).toEqual(state.snapshot.selectedIds);
  });

  // 10. Operation → undo → redo
  it('10. operation -> undo -> redo: redone state matches post-operation state', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    const postOp = executeBooleanOperation(state, 'xor');
    const undone = undoVectorAction(postOp);
    const redone = redoVectorAction(undone);

    expect(redone.snapshot.nodes).toEqual(postOp.snapshot.nodes);
  });

  // 11. Operation → operation → undo
  it('11. operation -> operation -> undo: undo step 2 restores state after step 1', () => {
    let state = makeState([rectA, rectB, ellipseC], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union');
    const stateAfterOp1 = state;

    const op1Id = state.snapshot.nodes[0].id;
    state = selectNodes(state, [op1Id, 'ellipseC']);
    state = executeBooleanOperation(state, 'subtract');

    // Undo step 2
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toEqual(stateAfterOp1.snapshot.nodes);
  });

  // 12. Operation → failed operation
  it('12. operation -> failed operation: state remains intact after failed op following valid op', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union');
    const validOpState = state;

    // Simulate exception on second operation
    const spy = vi.spyOn(VectorBooleanEngine, 'performOperation').mockImplementationOnce(() => {
      throw new Error('Simulated Failure');
    });

    state = executeBooleanOperation(state, 'subtract');
    // State remains equal to validOpState
    expect(state.snapshot).toBe(validOpState.snapshot);

    // Can still undo valid first operation!
    const undone = undoVectorAction(state);
    expect(undone.snapshot.nodes).toEqual([rectA, rectB]);

    spy.mockRestore();
  });

  // 13. Failed operation → undo
  it('13. failed operation -> undo: undoing after a failed operation undoes the previous valid step', () => {
    let state = makeState([rectA, rectB, ellipseC], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union'); // Creates union node at index 0

    const unionId = state.snapshot.nodes[0].id;
    state = selectNodes(state, [unionId, 'ellipseC']); // Select 2 nodes for operation 2

    const spy = vi.spyOn(VectorBooleanEngine, 'performOperation').mockImplementationOnce(() => {
      throw new Error('Simulated Failure');
    });

    state = executeBooleanOperation(state, 'intersect');
    expect(spy).toHaveBeenCalled();

    // Undo should go back to state after initial state (before Op 1)
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toEqual([rectA, rectB, ellipseC]);

    spy.mockRestore();
  });

  // 14. Document Immutability
  it('14. document immutability: inputs and snapshot arrays remain unmodified', () => {
    const inputNodes = [rectA, rectB];
    const state = makeState(inputNodes, ['rectA', 'rectB']);
    const snapshotStr = JSON.stringify(state.snapshot);

    executeBooleanOperation(state, 'subtract');

    expect(JSON.stringify(state.snapshot)).toBe(snapshotStr);
  });

  // 15. Rendering after operation
  it('15. rendering after operation: compiled rendering commands reflect updated nodes', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union');

    const cmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
    expect(cmds.some(c => c.type === 'DRAW_PATH')).toBe(true);
  });

  // 16. Selection after operation
  it('16. selection after operation: selectedIds point exclusively to newly created result node', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union');

    expect(state.snapshot.selectedIds).toEqual([state.snapshot.nodes[0].id]);
  });

  // 17. Degenerate Geometry Safety (Secondary Gap 3)
  it('17. degenerate geometry safety: non-overlapping intersection resulting in empty path does not insert ghost node', () => {
    // rectA (0,0,100,100) and ellipseC (500,500,100,100) do NOT overlap
    let state = makeState([rectA, ellipseC], ['rectA', 'ellipseC']);
    const resultState = executeBooleanOperation(state, 'intersect');

    // Intersect of non-overlapping shapes should safely no-op instead of creating 0x0 ghost node
    expect(resultState).toBe(state);
  });

  // 18. Node Mutations via Controller Actions (Secondary Gap 2)
  it('18. node mutations: updateNode, addNode, and deleteSelectedNodes push to HistoryStack', () => {
    let state = makeState([rectA], ['rectA']);
    expect(state.historyStack.entries.length).toBe(1);

    // updateNode
    const updatedRect = { ...rectA, transform: { ...rectA.transform, x: 200 } };
    state = updateNode(state, updatedRect);
    expect(state.snapshot.nodes[0].transform.x).toBe(200);
    expect(state.historyStack.entries.length).toBe(2);

    // addNode
    state = addNode(state, rectB);
    expect(state.snapshot.nodes).toHaveLength(2);
    expect(state.snapshot.selectedIds).toEqual(['rectB']);
    expect(state.historyStack.entries.length).toBe(3);

    // deleteSelectedNodes
    state = deleteSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].id).toBe('rectA');
    expect(state.snapshot.selectedIds).toHaveLength(0);
    expect(state.historyStack.entries.length).toBe(4);

    // Undo delete
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toHaveLength(2);

    // Undo add
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toHaveLength(1);

    // Undo update
    state = undoVectorAction(state);
    expect(state.snapshot.nodes[0].transform.x).toBe(0);
  });
});
