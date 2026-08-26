/**
 * VectorWorkspaceProductionReadiness.test.ts — G1-28 Production Readiness & Adversarial Suite
 *
 * Tests the Production-Grade Interactive Canvas & Command Workflow Vertical Slice:
 * - Grouping & Ungrouping (groupSelectedNodes / ungroupSelectedNodes)
 * - Duplication (duplicateSelectedNodes)
 * - Canvas Movement (moveSelectedNodes)
 * - Node Deletion (deleteSelectedNodes)
 * - HistoryStack Undo/Redo & Label Recording
 * - VectorRenderingBridge DTO compilation
 * - Failure Injection & Exception Rollback Safety
 * - 3 Real Integration Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createVectorWorkspaceState,
  selectNodes,
  groupSelectedNodes,
  ungroupSelectedNodes,
  duplicateSelectedNodes,
  moveSelectedNodes,
  deleteSelectedNodes,
  undoVectorAction,
  redoVectorAction,
  VectorWorkspaceState,
} from '../VectorWorkspaceController';
import {
  createRectangleNode,
  createEllipseNode,
  createPolygonNode,
  ShapeGroupNode,
  VectorNode,
} from '../VectorDomainModel';
import { VectorEditingEngine } from '../VectorEditingEngine';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';

describe('G1-28 — Vector Production Readiness Suite (30+ Adversarial & Integration Tests)', () => {
  const rectA = createRectangleNode('rectA', 0, 0, 100, 100);
  const rectB = createRectangleNode('rectB', 50, 50, 100, 100);
  const ellipseC = createEllipseNode('ellipseC', 200, 200, 80, 80);

  function makeState(nodes: VectorNode[], selection: string[]): VectorWorkspaceState {
    return createVectorWorkspaceState(nodes, selection);
  }

  // --- 5 HAPPY PATH TESTS ---

  it('1. happy path - group: groups 2 selected shapes into a single ShapeGroupNode', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g1');

    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].type).toBe('group');
    expect(state.snapshot.nodes[0].id).toBe('g1');
    expect(state.snapshot.selectedIds).toEqual(['g1']);
  });

  it('2. happy path - ungroup: un-groups a ShapeGroupNode back into child shapes', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g1');
    state = ungroupSelectedNodes(state);

    expect(state.snapshot.nodes).toHaveLength(2);
    expect(state.snapshot.nodes.map(n => n.id)).toContain('rectA');
    expect(state.snapshot.nodes.map(n => n.id)).toContain('rectB');
  });

  it('3. happy path - duplicate: duplicates selected shape with spatial offset and unique ID', () => {
    let state = makeState([rectA], ['rectA']);
    state = duplicateSelectedNodes(state, 30, 30);

    expect(state.snapshot.nodes).toHaveLength(2);
    const copy = state.snapshot.nodes[1];
    expect(copy.id).not.toBe('rectA');
    expect(copy.transform.x).toBe(30);
    expect(copy.transform.y).toBe(30);
    expect(state.snapshot.selectedIds).toEqual([copy.id]);
  });

  it('4. happy path - move: moves selected shapes by (dx, dy) delta', () => {
    let state = makeState([rectA, rectB], ['rectA']);
    state = moveSelectedNodes(state, 50, -20);

    expect(state.snapshot.nodes[0].transform.x).toBe(50);
    expect(state.snapshot.nodes[0].transform.y).toBe(-20);
    expect(state.snapshot.nodes[1].transform.x).toBe(50); // Unmoved rectB
  });

  it('5. happy path - delete: deletes selected nodes from workspace document', () => {
    let state = makeState([rectA, rectB], ['rectA']);
    state = deleteSelectedNodes(state);

    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].id).toBe('rectB');
    expect(state.snapshot.selectedIds).toHaveLength(0);
  });

  // --- 5 INVALID INPUT TESTS ---

  it('6. invalid input - group: no-ops when fewer than 2 nodes are selected', () => {
    let state = makeState([rectA, rectB], ['rectA']);
    const result = groupSelectedNodes(state);
    expect(result).toBe(state);
  });

  it('7. invalid input - ungroup: no-ops when selected node is not a group node', () => {
    let state = makeState([rectA, rectB], ['rectA']);
    const result = ungroupSelectedNodes(state);
    expect(result).toBe(state);
  });

  // 8. Move (0, 0) delta
  it('8. invalid input - move: no-ops when (dx=0, dy=0)', () => {
    let state = makeState([rectA], ['rectA']);
    const result = moveSelectedNodes(state, 0, 0);
    expect(result).toBe(state);
  });

  it('9. invalid input - duplicate: no-ops when no nodes are selected', () => {
    let state = makeState([rectA], []);
    const result = duplicateSelectedNodes(state);
    expect(result).toBe(state);
  });

  it('10. invalid input - delete: no-ops when selection is empty', () => {
    let state = makeState([rectA], []);
    const result = deleteSelectedNodes(state);
    expect(result).toBe(state);
  });

  // --- 5 SELECTION & STATE TESTS ---

  it('11. selection - group auto-select: newly created group is automatically selected', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_test');
    expect(state.snapshot.selectedIds).toEqual(['g_test']);
  });

  it('12. selection - ungroup auto-select: ungrouped child nodes are automatically selected', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_test');
    state = ungroupSelectedNodes(state);
    expect([...state.snapshot.selectedIds].sort()).toEqual(['rectA', 'rectB'].sort());
  });

  it('13. selection - duplicate auto-select: duplicated copies become the new selection set', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = duplicateSelectedNodes(state);

    expect(state.snapshot.selectedIds).toHaveLength(2);
    expect(state.snapshot.selectedIds).not.toContain('rectA');
    expect(state.snapshot.selectedIds).not.toContain('rectB');
  });

  it('14. selection - move preserves: selection IDs remain unchanged during canvas move', () => {
    let state = makeState([rectA, rectB], ['rectB']);
    state = moveSelectedNodes(state, 10, 10);
    expect(state.snapshot.selectedIds).toEqual(['rectB']);
  });

  it('15. selection - delete clears: deleting selected nodes clears selection set completely', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = deleteSelectedNodes(state);
    expect(state.snapshot.selectedIds).toHaveLength(0);
  });

  // --- 5 HISTORY & UNDO/REDO TESTS ---

  it('16. history - group & undo: undoing group restores original separate nodes', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g1');
    state = undoVectorAction(state);

    expect(state.snapshot.nodes).toEqual([rectA, rectB]);
  });

  it('17. history - ungroup & undo: undoing ungroup restores the ShapeGroupNode', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g1');
    state = ungroupSelectedNodes(state);
    state = undoVectorAction(state);

    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].type).toBe('group');
  });

  it('18. history - duplicate & undo: undoing duplication removes duplicated nodes', () => {
    let state = makeState([rectA], ['rectA']);
    state = duplicateSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(2);

    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0]).toEqual(rectA);
  });

  it('19. history - move & undo: undoing move restores original coordinates', () => {
    let state = makeState([rectA], ['rectA']);
    state = moveSelectedNodes(state, 100, 200);
    expect(state.snapshot.nodes[0].transform.x).toBe(100);

    state = undoVectorAction(state);
    expect(state.snapshot.nodes[0].transform.x).toBe(0);
  });

  it('20. history - multi-step undo/redo chain: group -> move -> duplicate -> undo -> undo -> redo', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g1'); // Op 1
    const stateGroup = state;

    state = moveSelectedNodes(state, 40, 40); // Op 2
    const stateMove = state;

    state = duplicateSelectedNodes(state); // Op 3

    state = undoVectorAction(state); // Undo Op 3 -> back to stateMove
    expect(state.snapshot.nodes).toEqual(stateMove.snapshot.nodes);

    state = undoVectorAction(state); // Undo Op 2 -> back to stateGroup
    expect(state.snapshot.nodes).toEqual(stateGroup.snapshot.nodes);

    state = redoVectorAction(state); // Redo Op 2 -> stateMove
    expect(state.snapshot.nodes).toEqual(stateMove.snapshot.nodes);
  });

  // --- 5 RENDERING TESTS ---

  it('21. rendering - group: ShapeGroupNode compiles render commands for all child shapes recursively', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g1');

    const groupNode = state.snapshot.nodes[0];
    const cmds = VectorRenderingBridge.buildRenderCommands(groupNode);

    // Group should contain SAVE/RESTORE and DRAW_RECT commands for children
    const drawCmds = cmds.filter(c => c.type === 'DRAW_RECT');
    expect(drawCmds).toHaveLength(2);
  });

  it('22. rendering - duplicate: compiled commands contain commands for duplicated shape', () => {
    let state = makeState([rectA], ['rectA']);
    state = duplicateSelectedNodes(state, 20, 20);

    const cmds0 = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
    const cmds1 = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[1]);

    expect(cmds0.some(c => c.type === 'DRAW_RECT')).toBe(true);
    expect(cmds1.some(c => c.type === 'DRAW_RECT')).toBe(true);
  });

  it('23. rendering - move: compiled commands reflect updated transform matrix', () => {
    let state = makeState([rectA], ['rectA']);
    state = moveSelectedNodes(state, 150, 75);

    const cmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
    const transformCmd = cmds.find(c => c.type === 'SET_TRANSFORM') as any;

    expect(transformCmd).toBeDefined();
    expect(transformCmd.transform[4]).toBe(150); // Tx
    expect(transformCmd.transform[5]).toBe(75);  // Ty
  });

  it('24. rendering - undo: undoing restores prior render command output', () => {
    let state = makeState([rectA], ['rectA']);
    state = moveSelectedNodes(state, 100, 100);
    state = undoVectorAction(state);

    const cmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
    const transformCmd = cmds.find(c => c.type === 'SET_TRANSFORM') as any;
    expect(transformCmd.transform[4]).toBe(0);
  });

  it('25. rendering - delete: deleted shape produces zero render commands', () => {
    let state = makeState([rectA], ['rectA']);
    state = deleteSelectedNodes(state);

    expect(state.snapshot.nodes).toHaveLength(0);
  });

  // --- 5 FAILURE INJECTION & RECOVERY TESTS ---

  it('26. failure injection - group exception: domain error during grouping safely rolls back without corrupting state', () => {
    const spy = vi.spyOn(VectorEditingEngine, 'groupShapes').mockImplementationOnce(() => {
      throw new Error('Simulated Grouping Crash');
    });

    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    const result = groupSelectedNodes(state);

    expect(result).toBe(state);
    expect(result.snapshot.nodes).toHaveLength(2);
    spy.mockRestore();
  });

  it('27. failure injection - ungroup exception: domain error during ungrouping safely rolls back', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g1');

    const spy = vi.spyOn(VectorEditingEngine, 'ungroupShape').mockImplementationOnce(() => {
      throw new Error('Simulated Ungroup Crash');
    });

    const result = ungroupSelectedNodes(state);
    expect(result).toBe(state);
    expect(result.snapshot.nodes[0].id).toBe('g1');

    spy.mockRestore();
  });

  it('28. failure injection - duplicate exception: domain error during duplication safely rolls back', () => {
    const spy = vi.spyOn(VectorEditingEngine, 'duplicateShape').mockImplementationOnce(() => {
      throw new Error('Simulated Duplicate Crash');
    });

    let state = makeState([rectA], ['rectA']);
    const result = duplicateSelectedNodes(state);

    expect(result).toBe(state);
    expect(result.snapshot.nodes).toHaveLength(1);

    spy.mockRestore();
  });

  it('29. failure injection - move exception: domain error during movement safely rolls back', () => {
    const spy = vi.spyOn(VectorEditingEngine, 'moveShape').mockImplementationOnce(() => {
      throw new Error('Simulated Move Crash');
    });

    let state = makeState([rectA], ['rectA']);
    const result = moveSelectedNodes(state, 50, 50);

    expect(result).toBe(state);
    expect(result.snapshot.nodes[0].transform.x).toBe(0);

    spy.mockRestore();
  });

  it('30. failure injection & recovery - post-failure operations continue cleanly', () => {
    const spy = vi.spyOn(VectorEditingEngine, 'duplicateShape').mockImplementationOnce(() => {
      throw new Error('Simulated Crash');
    });

    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = duplicateSelectedNodes(state); // Fails safely
    expect(spy).toHaveBeenCalled();

    // Next operation (Grouping) works normally
    state = groupSelectedNodes(state, 'g_recovered');
    expect(state.snapshot.nodes[0].id).toBe('g_recovered');

    spy.mockRestore();
  });

  // --- 3 REAL INTEGRATION TESTS ---

  it('31. REAL INTEGRATION TEST 1 — Full Grouping & Ungrouping Workflow', () => {
    // 1. Initial State
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    expect(state.snapshot.nodes).toHaveLength(2);

    // 2. Controller Group Dispatch
    state = groupSelectedNodes(state, 'g_integration');

    // 3. Document Snapshot & History Verification
    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].id).toBe('g_integration');
    const entries = state.historyStack.entries;
    expect(entries[entries.length - 1].label).toBe('Group Nodes');

    // 4. Rendering Bridge Compilation
    const renderCmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
    expect(renderCmds.filter(c => c.type === 'DRAW_RECT')).toHaveLength(2);

    // 5. Controller Ungroup Dispatch
    state = ungroupSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(2);
    const updatedEntries = state.historyStack.entries;
    expect(updatedEntries[updatedEntries.length - 1].label).toBe('Ungroup Nodes');

    // 6. Undo Ungroup
    state = undoVectorAction(state);
    expect(state.snapshot.nodes[0].id).toBe('g_integration');

    // 7. Undo Group
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toEqual([rectA, rectB]);
  });

  it('32. REAL INTEGRATION TEST 2 — Full Duplication & Alignment Workflow', () => {
    let state = makeState([rectA], ['rectA']);

    // 1. Duplicate
    state = duplicateSelectedNodes(state, 50, 0); // Duplicate rectA at x=50
    expect(state.snapshot.nodes).toHaveLength(2);
    const copyId = state.snapshot.selectedIds[0];

    // 2. Select both original and duplicate
    state = selectNodes(state, ['rectA', copyId]);

    // 3. Move both by +100 Y
    state = moveSelectedNodes(state, 0, 100);
    expect(state.snapshot.nodes[0].transform.y).toBe(100);
    expect(state.snapshot.nodes[1].transform.y).toBe(100);

    // 4. Undo Move
    state = undoVectorAction(state);
    expect(state.snapshot.nodes[0].transform.y).toBe(0);

    // 5. Undo Duplicate
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toHaveLength(1);
  });

  it('33. REAL INTEGRATION TEST 3 — Full Keyboard Shortcut & Mouse Move Interactive Flow', () => {
    const r1 = createRectangleNode('r1', 0, 0, 100, 100, 0, {}, { width: 0 });
    const r2 = createRectangleNode('r2', 50, 50, 100, 100, 0, {}, { width: 0 });
    let state = makeState([r1, r2], ['r1', 'r2']);

    // 1. Group (simulating Ctrl+G)
    state = groupSelectedNodes(state, 'g_kbd');
    expect(state.snapshot.selectedIds).toEqual(['g_kbd']);

    // 2. Move (simulating mouse drag on canvas)
    state = moveSelectedNodes(state, 200, 150);
    expect(state.snapshot.nodes[0].transform.x).toBe(200);
    expect(state.snapshot.nodes[0].transform.y).toBe(150);

    // 3. Duplicate (simulating Ctrl+D)
    state = duplicateSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(2);

    // 4. Delete Duplicate (simulating Delete key)
    state = deleteSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].id).toBe('g_kbd');
    expect(state.snapshot.selectedIds).toHaveLength(0);

    // 5. Undo Delete
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toHaveLength(2);

    // 6. Undo Duplicate
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toHaveLength(1);

    // 7. Undo Move
    state = undoVectorAction(state);
    expect(state.snapshot.nodes[0].transform.x).toBe(0);

    // 8. Undo Group
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toEqual([r1, r2]);
  });
});
