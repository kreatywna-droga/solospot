/**
 * VectorWorkspaceAdversarial.test.ts — G1-25 Adversarial Testing Suite
 *
 * Tests the hardened parts of the Vector subsystem against extreme inputs,
 * rapid sequences, stale/malformed selection, and duplicate IDs.
 */

import { describe, it, expect, vi } from 'vitest';
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

describe('G1-25 — Vector Hardening Adversarial Tests', () => {
  const rectA = createRectangleNode('rectA', 0, 0, 100, 100);
  const rectB = createRectangleNode('rectB', 50, 50, 100, 100);
  const ellipseC = createEllipseNode('ellipseC', 20, 20, 80, 80);

  // Helper to generate state
  function makeState(nodes: VectorNode[], selection: string[]): VectorWorkspaceState {
    return createVectorWorkspaceState(nodes, selection);
  }

  // A. Normal Operation
  it('A. normal operation: runs boolean operations successfully', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union');
    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].type).toBe('path');
    expect(state.snapshot.selectedIds).toHaveLength(1);
  });

  // B. Empty Selection
  it('B. empty selection: no-ops when no nodes are selected', () => {
    let state = makeState([rectA, rectB], []);
    const resultState = executeBooleanOperation(state, 'union');
    expect(resultState).toBe(state); // Strict identity check
  });

  // C. One Selected Node
  it('C. one selected node: no-ops when only one node is selected', () => {
    let state = makeState([rectA, rectB], ['rectA']);
    const resultState = executeBooleanOperation(state, 'union');
    expect(resultState).toBe(state); // Strict identity check
  });

  // D. Two Valid Nodes
  it('D. two valid nodes: executes successfully', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    const resultState = executeBooleanOperation(state, 'intersect');
    expect(resultState.snapshot.nodes).toHaveLength(1);
    expect(resultState.snapshot.nodes[0].type).toBe('path');
  });

  // E. Repeated Boolean Operations
  it('E. repeated boolean operations: allows multiple operations sequentially without collision', () => {
    let state = makeState([rectA, rectB, ellipseC], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union'); // Result of union + ellipseC left in tree
    
    // Select the new union result and ellipseC
    const newId = state.snapshot.nodes[0].id;
    state = selectNodes(state, [newId, 'ellipseC']);
    state = executeBooleanOperation(state, 'subtract');

    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].type).toBe('path');
  });

  // F. UNION → SUBTRACT Sequence
  it('F. UNION -> SUBTRACT: runs Union then Subtract on selection', () => {
    let state = makeState([rectA, rectB, ellipseC], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union'); // merges A and B to a new path node
    
    const unionNode = state.snapshot.nodes.find(n => n.id.startsWith('boolean_union'));
    expect(unionNode).toBeDefined();

    // Select the Union node and Ellipse C, then Subtract
    state = selectNodes(state, [unionNode!.id, 'ellipseC']);
    state = executeBooleanOperation(state, 'subtract');

    expect(state.snapshot.nodes).toHaveLength(1);
    const subNode = state.snapshot.nodes[0];
    expect(subNode.id).toContain('boolean_sub');
  });

  // G. UNION → UNDO
  it('G. UNION -> UNDO: reverts state back exactly', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    const postUnion = executeBooleanOperation(state, 'union');
    const postUndo = undoVectorAction(postUnion);

    expect(postUndo.snapshot.nodes).toEqual(state.snapshot.nodes);
    expect(postUndo.snapshot.selectedIds).toEqual(state.snapshot.selectedIds);
  });

  // H. UNION → UNDO → REDO
  it('H. UNION -> UNDO -> REDO: performs redo back to post-union state', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    const postUnion = executeBooleanOperation(state, 'union');
    const postUndo = undoVectorAction(postUnion);
    const postRedo = redoVectorAction(postUndo);

    expect(postRedo.snapshot.nodes).toEqual(postUnion.snapshot.nodes);
    expect(postRedo.snapshot.selectedIds).toEqual(postUnion.snapshot.selectedIds);
  });

  // I. Multiple Operations → Multiple Undo
  it('I. multiple operations -> multiple undo: reverts step by step correctly', () => {
    let state = makeState([rectA, rectB, ellipseC], ['rectA', 'rectB']);
    const state0 = state;
    
    // Op 1: Union A & B
    state = executeBooleanOperation(state, 'union');
    const state1 = state;
    
    // Op 2: Intersect UnionResult & C
    const unionId = state.snapshot.nodes[0].id;
    state = selectNodes(state, [unionId, 'ellipseC']);
    state = executeBooleanOperation(state, 'intersect');
    const state2 = state;

    // Undo 1
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toEqual(state1.snapshot.nodes);

    // Undo 2
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toEqual(state0.snapshot.nodes);
  });

  // J. Multiple Operations → Undo → New Operation
  it('J. multiple operations -> undo -> new operation: discards redo stack correctly', () => {
    let state = makeState([rectA, rectB, ellipseC], ['rectA', 'rectB']);
    
    // Op 1: Union A & B
    state = executeBooleanOperation(state, 'union');
    const unionState = state;
    
    // Undo Op 1
    state = undoVectorAction(state);
    
    // Op 2: Intersect A & B instead
    state = executeBooleanOperation(state, 'intersect');
    
    // Try to redo (should be impossible since new op cleared future)
    const tryRedo = redoVectorAction(state);
    expect(tryRedo).toBe(state); // no-op
  });

  // K. Rendering After Mutation
  it('K. rendering after mutation: compiles resulting boolean shapes into render commands successfully', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union');
    const resultNode = state.snapshot.nodes[0];
    
    const commands = VectorRenderingBridge.buildRenderCommands(resultNode);
    const drawPathCmd = commands.find(c => c.type === 'DRAW_PATH');
    expect(drawPathCmd).toBeDefined();
  });

  // L. Selection After Mutation
  it('L. selection after mutation: automatically selects new result node and clears stale IDs', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = executeBooleanOperation(state, 'union');
    const resultNode = state.snapshot.nodes[0];

    // Verify selection only includes the newly created node, and doesn't contain rectA/rectB
    expect(state.snapshot.selectedIds).toEqual([resultNode.id]);
  });

  // M. Document Immutability
  it('M. document immutability: none of the operations mutate the original state arrays or nodes', () => {
    const originalNodes = [rectA, rectB];
    const state = makeState(originalNodes, ['rectA', 'rectB']);
    
    const nodeAStr = JSON.stringify(rectA);
    const nodeBStr = JSON.stringify(rectB);

    executeBooleanOperation(state, 'union');

    expect(JSON.stringify(rectA)).toBe(nodeAStr);
    expect(JSON.stringify(rectB)).toBe(nodeBStr);
    expect(state.snapshot.nodes).toHaveLength(2);
  });

  // extra: Malformed Input
  it('extra: malformed input: ignores elements that do not conform to VectorNode interface or have invalid fields', () => {
    const malformedNode = { id: 'malformed', type: 'unsupported' } as any;
    let state = makeState([rectA, malformedNode], ['rectA', 'malformed']);
    const result = executeBooleanOperation(state, 'union');
    expect(result).toBe(state); // No-ops on unsupported node types
  });

  // extra: Missing Node
  it('extra: missing node: ignores selection IDs that correspond to missing nodes in document tree', () => {
    // Selection has 'rectA' and 'rectMissing', but rectMissing is not in nodes
    let state = makeState([rectA, rectB], ['rectA', 'rectMissing']);
    
    // executeBooleanOperation requires at least 2 existing nodes to be selected
    const result = executeBooleanOperation(state, 'union');
    expect(result).toBe(state); // Should no-op because 'rectMissing' is missing in nodes
  });

  // extra: Stale Selection Validation (Candidate 1 hardening)
  it('extra: stale selection: selectNodes filters out and ignores stale/invalid IDs', () => {
    let state = makeState([rectA, rectB], ['rectA']);
    // Select rectA and a stale/non-existent ID
    state = selectNodes(state, ['rectA', 'stale_id_123']);
    // Stale ID should be filtered out by selectNodes validation
    expect(state.snapshot.selectedIds).toEqual(['rectA']);
  });

  // extra: Duplicate Node IDs and collision safety (Candidate 2 hardening)
  it('extra: duplicate node IDs and collision safety: rapid sequential calls do NOT produce duplicate node IDs', () => {
    // Simulate rapid execution in the same millisecond. Mock Date.now to return static value.
    const originalDateNow = Date.now;
    Date.now = () => 1234567890;

    try {
      let state = makeState([rectA, rectB, ellipseC], ['rectA', 'rectB']);
      
      // Perform operation 1 (union rectA & rectB)
      const stateOp1 = executeBooleanOperation(state, 'union');
      const nodeId1 = stateOp1.snapshot.nodes[0].id;

      // Perform operation 2 (union rectA & rectB again under the exact same mocked millisecond)
      const stateOp2 = executeBooleanOperation(state, 'union');
      const nodeId2 = stateOp2.snapshot.nodes[0].id;

      // Verify that even under the exact same timestamp, the IDs are unique
      expect(nodeId1).not.toBe(nodeId2);
      expect(nodeId1).toContain('boolean_union');
      expect(nodeId2).toContain('boolean_union');
    } finally {
      // Restore Date.now
      Date.now = originalDateNow;
    }
  });
});
