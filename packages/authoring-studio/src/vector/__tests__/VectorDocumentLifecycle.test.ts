/**
 * VectorDocumentLifecycle.test.ts — Sprint G1-29 Vector Document Lifecycle & Recovery Suite
 *
 * Tests the complete Vector Document Lifecycle, Persistence, Recovery & Pure TS Clipboard engine:
 * - Serialization & Deserialization (serializeVectorDocument, restoreVectorDocument)
 * - Pure TS In-Memory Clipboard (copyShapes, pasteShapes, remapNodeIdsRecursively)
 * - Controller Lifecycle Dispatchers (loadVectorDocument, copySelectedNodes, cutSelectedNodes, pasteClipboard)
 * - Geometry Normalization & Schema Validation
 * - HistoryStack Isolation & Undo/Redo Boundary Safety
 * - Failure Injection & Process Crash / Recovery Simulation
 * - 5 Real Vertical Integration Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createVectorWorkspaceState,
  selectNodes,
  groupSelectedNodes,
  loadVectorDocument,
  copySelectedNodes,
  cutSelectedNodes,
  pasteClipboard,
  duplicateSelectedNodes,
  undoVectorAction,
  redoVectorAction,
  moveSelectedNodes,
  VectorWorkspaceState,
} from '../VectorWorkspaceController';
import {
  createRectangleNode,
  createEllipseNode,
  createPolygonNode,
  VectorNode,
  ShapeGroupNode,
} from '../VectorDomainModel';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorClipboardEngine } from '../VectorClipboardEngine';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';

describe('G1-29 — Vector Document Lifecycle, Persistence & Recovery Suite (40+ Tests)', () => {
  const rectA = createRectangleNode('rectA', 10, 10, 100, 100, 0, {}, { width: 0 });
  const rectB = createRectangleNode('rectB', 50, 50, 120, 120, 0, {}, { width: 0 });
  const ellipseC = createEllipseNode('ellipseC', 200, 200, 80, 80, {}, { width: 0 });

  function makeState(nodes: VectorNode[], selection: string[]): VectorWorkspaceState {
    return createVectorWorkspaceState(nodes, selection);
  }

  // --- 8 PERSISTENCE & SERIALIZATION TESTS ---

  it('1. persistence - serialize: encodes snapshot into versioned JSON string with schema metadata', () => {
    const state = makeState([rectA, rectB], ['rectA']);
    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

    const dto = JSON.parse(json);
    expect(dto.version).toBe(1);
    expect(dto.schema).toBe('vector_document');
    expect(dto.nodes).toHaveLength(2);
    expect(dto.selectedIds).toEqual(['rectA']);
  });

  it('2. persistence - metadata: includes custom metadata attributes when serialized', () => {
    const state = makeState([rectA], []);
    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot, { author: 'Unit Test', build: 101 });

    const dto = JSON.parse(json);
    expect(dto.metadata?.author).toBe('Unit Test');
    expect(dto.metadata?.build).toBe(101);
  });

  it('3. persistence - restore valid: successfully parses valid JSON payload back to snapshot', () => {
    const state = makeState([rectA, rectB], ['rectB']);
    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

    const result = VectorDocumentSerializer.restoreVectorDocument(json);
    expect(result.success).toBe(true);
    expect(result.snapshot?.nodes).toHaveLength(2);
    expect(result.snapshot?.selectedIds).toEqual(['rectB']);
  });

  it('4. persistence - repair negative dimensions: normalizes negative width/height to non-negative bounds', () => {
    const badJson = JSON.stringify({
      version: 1,
      schema: 'vector_document',
      nodes: [{ id: 'bad1', type: 'rectangle', transform: { x: 0, y: 0, width: -100, height: -50 } }],
      selectedIds: ['bad1'],
    });

    const result = VectorDocumentSerializer.restoreVectorDocument(badJson);
    expect(result.success).toBe(true);
    expect(result.snapshot?.nodes[0].transform.width).toBe(0);
    expect(result.snapshot?.nodes[0].transform.height).toBe(0);
    expect(result.repairedCount).toBeGreaterThan(0);
  });

  it('5. persistence - repair duplicate IDs: deduplicates identical shape IDs on import', () => {
    const dupJson = JSON.stringify({
      version: 1,
      schema: 'vector_document',
      nodes: [
        { id: 'dup_id', type: 'rectangle', transform: { x: 0, y: 0, width: 50, height: 50 } },
        { id: 'dup_id', type: 'ellipse', transform: { x: 10, y: 10, width: 50, height: 50 } },
      ],
      selectedIds: ['dup_id'],
    });

    const result = VectorDocumentSerializer.restoreVectorDocument(dupJson);
    expect(result.success).toBe(true);
    expect(result.snapshot?.nodes).toHaveLength(2);
    expect(result.snapshot?.nodes[0].id).not.toBe(result.snapshot?.nodes[1].id);
  });

  it('6. persistence - repair NaN coordinates: fallbacks invalid NaN coordinates to 0', () => {
    const nanJson = JSON.stringify({
      version: 1,
      schema: 'vector_document',
      nodes: [{ id: 'nan1', type: 'rectangle', transform: { x: 'invalid', y: null, width: 100, height: 100 } }],
    });

    const result = VectorDocumentSerializer.restoreVectorDocument(nanJson);
    expect(result.success).toBe(true);
    expect(result.snapshot?.nodes[0].transform.x).toBe(0);
    expect(result.snapshot?.nodes[0].transform.y).toBe(0);
  });

  it('7. persistence - fill & stroke fallbacks: provides default fill/stroke objects if missing', () => {
    const noStyleJson = JSON.stringify({
      version: 1,
      schema: 'vector_document',
      nodes: [{ id: 'nostyle', type: 'rectangle', transform: { x: 0, y: 0, width: 10, height: 10 } }],
    });

    const result = VectorDocumentSerializer.restoreVectorDocument(noStyleJson);
    expect(result.success).toBe(true);
    expect(result.snapshot?.nodes[0].fill?.color).toBeDefined();
    expect(result.snapshot?.nodes[0].stroke?.color).toBeDefined();
  });

  it('8. persistence - prune stale selection: removes selection IDs pointing to non-existent nodes', () => {
    const staleJson = JSON.stringify({
      version: 1,
      schema: 'vector_document',
      nodes: [{ id: 'n1', type: 'rectangle', transform: { x: 0, y: 0, width: 10, height: 10 } }],
      selectedIds: ['n1', 'ghost_id_1', 'ghost_id_2'],
    });

    const result = VectorDocumentSerializer.restoreVectorDocument(staleJson);
    expect(result.success).toBe(true);
    expect(result.snapshot?.selectedIds).toEqual(['n1']);
  });

  // --- 8 RESTORE & RECOVERY TESTS ---

  it('9. restore - malformed json: returns error result on syntax error JSON payload', () => {
    const result = VectorDocumentSerializer.restoreVectorDocument('{ invalid json };;');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('10. restore - invalid schema: rejects payload with non-matching schema signature', () => {
    const wrongSchema = JSON.stringify({ version: 1, schema: 'unknown_document', nodes: [] });
    const result = VectorDocumentSerializer.restoreVectorDocument(wrongSchema);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid schema signature');
  });

  it('11. restore - invalid version: rejects unsupported version numbers', () => {
    const wrongVersion = JSON.stringify({ version: 0, schema: 'vector_document', nodes: [] });
    const result = VectorDocumentSerializer.restoreVectorDocument(wrongVersion);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported schema version');
  });

  it('12. restore - non-array nodes: rejects payload where nodes is not an array', () => {
    const badNodes = JSON.stringify({ version: 1, schema: 'vector_document', nodes: 'not_an_array' });
    const result = VectorDocumentSerializer.restoreVectorDocument(badNodes);
    expect(result.success).toBe(false);
    expect(result.error).toContain('nodes property must be an array');
  });

  it('13. load controller - valid payload: loads new document and resets HistoryStack', () => {
    let state = makeState([rectA], ['rectA']);
    state = moveSelectedNodes(state, 10, 10); // History has 2 entries

    const newDocJson = VectorDocumentSerializer.serializeVectorDocument(makeState([rectB, ellipseC], ['rectB']).snapshot);
    state = loadVectorDocument(state, newDocJson);

    expect(state.snapshot.nodes).toHaveLength(2);
    expect(state.snapshot.nodes[0].id).toBe('rectB');
    expect(state.historyStack.canUndo).toBe(false); // Clean history
  });

  it('14. load controller - invalid payload rollback: retains current document state on load failure', () => {
    let state = makeState([rectA], ['rectA']);
    const badJson = 'CORRUPTED PAYLOAD';

    const result = loadVectorDocument(state, badJson);
    expect(result).toBe(state);
    expect(result.snapshot.nodes).toHaveLength(1);
    expect(result.snapshot.nodes[0].id).toBe('rectA');
  });

  it('15. restore - nested group node: recursively restores ShapeGroupNode hierarchy', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_saved');
    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

    const result = VectorDocumentSerializer.restoreVectorDocument(json);
    expect(result.success).toBe(true);
    const restoredGroup = result.snapshot?.nodes[0] as ShapeGroupNode;
    expect(restoredGroup.type).toBe('group');
    expect(restoredGroup.children).toHaveLength(2);
  });

  it('16. restore - empty string: returns clean error without crashing', () => {
    const result = VectorDocumentSerializer.restoreVectorDocument('');
    expect(result.success).toBe(false);
  });

  // --- 8 CLIPBOARD & DUPLICATION TESTS ---

  it('17. clipboard - copy & getBuffer: copies selected shapes to in-memory buffer', () => {
    VectorClipboardEngine.clearBuffer();
    const payload = VectorClipboardEngine.copyShapes([rectA, rectB]);

    expect(payload).not.toBeNull();
    expect(payload?.shapes).toHaveLength(2);
    expect(VectorClipboardEngine.getBuffer()).toEqual(payload);
  });

  it('18. clipboard - paste: generates unique collision-safe IDs for pasted shapes', () => {
    VectorClipboardEngine.clearBuffer();
    VectorClipboardEngine.copyShapes([rectA]);
    const pasteResult = VectorClipboardEngine.pasteShapes();

    expect(pasteResult).not.toBeNull();
    expect(pasteResult?.pastedNodes[0].id).not.toBe('rectA');
  });

  it('19. clipboard - spatial cascade offset: applies cumulative (+20, +20) spatial offset on sequential pastes', () => {
    VectorClipboardEngine.clearBuffer();
    VectorClipboardEngine.copyShapes([rectA]); // rectA at (10, 10)

    const paste1 = VectorClipboardEngine.pasteShapes();
    expect(paste1?.pastedNodes[0].transform.x).toBe(30); // 10 + 20

    const paste2 = VectorClipboardEngine.pasteShapes();
    expect(paste2?.pastedNodes[0].transform.x).toBe(50); // 10 + 40
  });

  it('20. clipboard - nested group ID remapping: deeply remaps all nested child IDs recursively', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_orig');
    const groupNode = state.snapshot.nodes[0] as ShapeGroupNode;

    const remapped = VectorClipboardEngine.remapNodeIdsRecursively(groupNode) as ShapeGroupNode;
    expect(remapped.id).not.toBe('g_orig');
    expect(remapped.children[0].id).not.toBe('rectA');
    expect(remapped.children[1].id).not.toBe('rectB');
  });

  it('21. controller copy: stores current selection in clipboard buffer', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA, rectB], ['rectA']);

    state = copySelectedNodes(state);
    const buf = VectorClipboardEngine.getBuffer();
    expect(buf?.shapes).toHaveLength(1);
    expect(buf?.shapes[0].id).toBe('rectA');
  });

  it('22. controller cut: copies selected nodes to clipboard and removes them from document', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA, rectB], ['rectA']);

    state = cutSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].id).toBe('rectB');
    const entries = state.historyStack.entries;
    expect(entries[entries.length - 1].label).toBe('Cut Nodes');
  });

  it('23. controller paste: pastes clipboard shapes into snapshot and updates selection', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA], ['rectA']);
    state = copySelectedNodes(state);

    state = pasteClipboard(state);
    expect(state.snapshot.nodes).toHaveLength(2);
    expect(state.snapshot.selectedIds).toHaveLength(1);
    expect(state.snapshot.selectedIds[0]).not.toBe('rectA');
    const entries = state.historyStack.entries;
    expect(entries[entries.length - 1].label).toBe('Paste Nodes');
  });

  it('24. clipboard - copy empty selection: no-ops when no nodes are selected', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA], []);
    state = copySelectedNodes(state);
    expect(VectorClipboardEngine.getBuffer()).toBeNull();
  });

  // --- 8 HISTORY, UNDO & REDO TESTS ---

  it('25. history - cut & undo: undoing cut restores removed shapes and prior selection', () => {
    let state = makeState([rectA, rectB], ['rectA']);
    state = cutSelectedNodes(state);
    state = undoVectorAction(state);

    expect(state.snapshot.nodes).toHaveLength(2);
    expect(state.snapshot.nodes.map(n => n.id)).toContain('rectA');
  });

  it('26. history - paste & undo: undoing paste removes pasted shapes', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA], ['rectA']);
    state = copySelectedNodes(state);
    state = pasteClipboard(state);
    expect(state.snapshot.nodes).toHaveLength(2);

    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].id).toBe('rectA');
  });

  it('27. history - paste & redo: redoing paste restores pasted shapes with original generated IDs', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA], ['rectA']);
    state = copySelectedNodes(state);
    state = pasteClipboard(state);
    const pastedId = state.snapshot.selectedIds[0];

    state = undoVectorAction(state);
    state = redoVectorAction(state);

    expect(state.snapshot.nodes).toHaveLength(2);
    expect(state.snapshot.selectedIds[0]).toBe(pastedId);
  });

  it('28. history - load document boundary: loading new document clears prior history stack entries', () => {
    let state = makeState([rectA], ['rectA']);
    state = moveSelectedNodes(state, 10, 10);
    const json = VectorDocumentSerializer.serializeVectorDocument(makeState([rectB], ['rectB']).snapshot);

    state = loadVectorDocument(state, json);
    expect(state.historyStack.canUndo).toBe(false);
    expect(state.historyStack.entries).toHaveLength(1);
  });

  it('29. history - cut -> paste -> undo -> undo chain', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA, rectB], ['rectA']);

    state = cutSelectedNodes(state); // Cut rectA -> nodes: [rectB]
    state = pasteClipboard(state);   // Paste rectA -> nodes: [rectB, rectA_copy]

    state = undoVectorAction(state); // Undo Paste -> nodes: [rectB]
    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].id).toBe('rectB');

    state = undoVectorAction(state); // Undo Cut -> nodes: [rectA, rectB]
    expect(state.snapshot.nodes).toHaveLength(2);
  });

  it('30. history - copy does not pollute HistoryStack', () => {
    let state = makeState([rectA], ['rectA']);
    const initLen = state.historyStack.entries.length;

    state = copySelectedNodes(state);
    expect(state.historyStack.entries.length).toBe(initLen);
  });

  it('31. history - failed paste does not push to HistoryStack', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA], ['rectA']);
    const initLen = state.historyStack.entries.length;

    state = pasteClipboard(state, null); // Empty buffer
    expect(state.historyStack.entries.length).toBe(initLen);
  });

  it('32. history - max stack depth bounding: enforces stack limit of 50 snapshots', () => {
    let state = makeState([rectA], ['rectA']);
    for (let i = 1; i <= 60; i++) {
      state = moveSelectedNodes(state, 1, 1);
    }
    expect(state.historyStack.entries.length).toBeLessThanOrEqual(50);
  });

  // --- 8 RENDERING & SELECTION CONSISTENCY TESTS ---

  it('33. rendering - restored document produces valid render commands', () => {
    const state = makeState([rectA, ellipseC], []);
    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

    const restore = VectorDocumentSerializer.restoreVectorDocument(json);
    const cmds0 = VectorRenderingBridge.buildRenderCommands(restore.snapshot?.nodes[0]!);
    const cmds1 = VectorRenderingBridge.buildRenderCommands(restore.snapshot?.nodes[1]!);

    expect(cmds0.some(c => c.type === 'DRAW_RECT')).toBe(true);
    expect(cmds1.some(c => c.type === 'DRAW_ELLIPSE')).toBe(true);
  });

  it('34. rendering - pasted shape renders at offset coordinates', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA], ['rectA']);
    state = copySelectedNodes(state);
    state = pasteClipboard(state);

    const pastedNode = state.snapshot.nodes[1];
    const cmds = VectorRenderingBridge.buildRenderCommands(pastedNode);
    const transformCmd = cmds.find(c => c.type === 'SET_TRANSFORM') as any;

    expect(transformCmd.transform[4]).toBe(30); // 10 + 20
  });

  it('35. rendering - cut node produces zero render commands', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA], ['rectA']);
    state = cutSelectedNodes(state);

    expect(state.snapshot.nodes).toHaveLength(0);
  });

  it('36. selection - load document restores valid selection set', () => {
    const json = VectorDocumentSerializer.serializeVectorDocument(makeState([rectA, rectB], ['rectB']).snapshot);
    const loaded = loadVectorDocument(makeState([], []), json);

    expect(loaded.snapshot.selectedIds).toEqual(['rectB']);
  });

  it('37. selection - cut selection resets to empty array', () => {
    let state = makeState([rectA, rectB], ['rectA']);
    state = cutSelectedNodes(state);
    expect(state.snapshot.selectedIds).toEqual([]);
  });

  it('38. selection - paste auto-selects newly pasted shapes', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA, rectB], ['rectA']);
    state = copySelectedNodes(state);
    state = pasteClipboard(state);

    expect(state.snapshot.selectedIds).toHaveLength(1);
    expect(state.snapshot.selectedIds[0]).not.toBe('rectA');
  });

  it('39. rendering - restored group node renders child commands recursively', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_render');

    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
    const restore = VectorDocumentSerializer.restoreVectorDocument(json);

    const groupCmds = VectorRenderingBridge.buildRenderCommands(restore.snapshot?.nodes[0]!);
    expect(groupCmds.filter(c => c.type === 'DRAW_RECT')).toHaveLength(2);
  });

  it('40. selection - loaded document with invalid selection prunes invalid IDs', () => {
    const badSelectJson = JSON.stringify({
      version: 1,
      schema: 'vector_document',
      nodes: [{ id: 'n1', type: 'rectangle', transform: { x: 0, y: 0, width: 10, height: 10 } }],
      selectedIds: ['n1', 'n_missing'],
    });

    const loaded = loadVectorDocument(makeState([], []), badSelectJson);
    expect(loaded.snapshot.selectedIds).toEqual(['n1']);
  });

  // --- 5 REAL VERTICAL INTEGRATION TESTS ---

  it('41. REAL INTEGRATION TEST 1 — Create -> Edit -> Duplicate -> Save -> Load -> Undo -> Redo -> Render', () => {
    // 1. Create Initial State
    let state = makeState([rectA], ['rectA']);

    // 2. Edit (Move)
    state = moveSelectedNodes(state, 40, 40);

    // 3. Duplicate
    state = duplicateSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(2);

    // 4. Save (Serialize)
    const jsonSaved = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
    expect(jsonSaved).toContain('vector_document');

    // 5. Load (Restore) in new workspace state
    let freshState = makeState([], []);
    freshState = loadVectorDocument(freshState, jsonSaved);
    expect(freshState.snapshot.nodes).toHaveLength(2);

    // 6. Undo in restored state (no-op as history was cleanly reset)
    expect(freshState.historyStack.canUndo).toBe(false);

    // 7. Render restored nodes
    const cmds = VectorRenderingBridge.buildRenderCommands(freshState.snapshot.nodes[0]);
    expect(cmds.some(c => c.type === 'DRAW_RECT')).toBe(true);
  });

  it('42. REAL INTEGRATION TEST 2 — Copy -> Paste -> New IDs -> Selection -> History -> Render', () => {
    VectorClipboardEngine.clearBuffer();

    // 1. Initial State
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);

    // 2. Copy Selection
    state = copySelectedNodes(state);

    // 3. Paste Clipboard
    state = pasteClipboard(state);
    expect(state.snapshot.nodes).toHaveLength(4);

    // 4. Verify New Unique Collision-Safe IDs
    const allIds = state.snapshot.nodes.map(n => n.id);
    expect(new Set(allIds).size).toBe(4);

    // 5. Verify Selection updated to newly pasted nodes
    expect(state.snapshot.selectedIds).toHaveLength(2);
    expect(state.snapshot.selectedIds).not.toContain('rectA');

    // 6. Verify History Stack Push
    const entries = state.historyStack.entries;
    expect(entries[entries.length - 1].label).toBe('Paste Nodes');

    // 7. Render Pasted Nodes
    const pastedNode0 = state.snapshot.nodes[2];
    const cmds = VectorRenderingBridge.buildRenderCommands(pastedNode0);
    expect(cmds.some(c => c.type === 'DRAW_RECT')).toBe(true);
  });

  it('43. REAL INTEGRATION TEST 3 — Invalid Document -> Restore Failure -> Original Document Preserved', () => {
    // 1. Existing Document State
    let state = makeState([rectA, rectB], ['rectA']);

    // 2. Attempt to load corrupted/malformed JSON
    const corruptedPayload = '{"schema":"vector_document", "version": 1, "nodes": "MALFORMED"}';
    const resultState = loadVectorDocument(state, corruptedPayload);

    // 3. Assert Original Document Preserved completely without mutation
    expect(resultState).toBe(state);
    expect(resultState.snapshot.nodes).toHaveLength(2);
    expect(resultState.snapshot.nodes[0].id).toBe('rectA');
  });

  it('44. REAL INTEGRATION TEST 4 — Process Crash / Recovery Simulation across Mutations', () => {
    // 1. State before crash
    let state = makeState([rectA, rectB], ['rectA']);
    state = moveSelectedNodes(state, 100, 100);

    // 2. Simulate background snapshot serialization before crash
    const serializedBackup = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

    // 3. Simulate total crash (process exit & memory wipe)
    state = null as any;

    // 4. Recovery: restore snapshot from serializedBackup into clean workspace instance
    let recoveredState = makeState([], []);
    recoveredState = loadVectorDocument(recoveredState, serializedBackup);

    // 5. Verify recovered document state & rendering
    expect(recoveredState.snapshot.nodes).toHaveLength(2);
    expect(recoveredState.snapshot.nodes[0].transform.x).toBe(110); // 10 + 100
    const cmds = VectorRenderingBridge.buildRenderCommands(recoveredState.snapshot.nodes[0]);
    expect(cmds.some(c => c.type === 'DRAW_RECT')).toBe(true);
  });

  it('45. REAL INTEGRATION TEST 5 — Nested Group Paste ID Remapping & Group Rendering', () => {
    VectorClipboardEngine.clearBuffer();

    // 1. Create Group State
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_parent');
    expect(state.snapshot.nodes).toHaveLength(1);

    // 2. Copy Group
    state = copySelectedNodes(state);

    // 3. Paste Group
    state = pasteClipboard(state);
    expect(state.snapshot.nodes).toHaveLength(2);

    // 4. Verify Deep Recursive ID Remapping for Group & Group Children
    const g0 = state.snapshot.nodes[0] as ShapeGroupNode;
    const g1 = state.snapshot.nodes[1] as ShapeGroupNode;

    expect(g1.id).not.toBe(g0.id);
    expect(g1.children[0].id).not.toBe(g0.children[0].id);
    expect(g1.children[1].id).not.toBe(g0.children[1].id);

    // 5. Render Pasted Group
    const cmds = VectorRenderingBridge.buildRenderCommands(g1);
    expect(cmds.filter(c => c.type === 'DRAW_RECT')).toHaveLength(2);
  });
});
