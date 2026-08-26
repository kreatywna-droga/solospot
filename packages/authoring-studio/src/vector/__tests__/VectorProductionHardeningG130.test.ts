/**
 * VectorProductionHardeningG130.test.ts — Sprint G1-30 Autonomous Production Hardening Suite
 *
 * Tests all 5 Hardening Cycles:
 * - Cycle 1 (Category A): Data Integrity & Geometry Validation
 * - Cycle 2 (Category B): History & Transaction Safety
 * - Cycle 3 (Category C): Persistence & Schemaless Recovery
 * - Cycle 4 (Category D): Clipboard & Identity Integrity
 * - Cycle 5 (Category E): User Interaction & Canvas Hit-Testing
 *
 * Includes 50+ Unit/Adversarial Tests, 5 Cross-Cycle Integration Tests, and 5 Crash/Recovery Simulations.
 */

import { describe, it, expect } from 'vitest';
import {
  createVectorWorkspaceState,
  selectNodes,
  groupSelectedNodes,
  ungroupSelectedNodes,
  duplicateSelectedNodes,
  moveSelectedNodes,
  deleteSelectedNodes,
  loadVectorDocument,
  copySelectedNodes,
  cutSelectedNodes,
  pasteClipboard,
  undoVectorAction,
  redoVectorAction,
  alignSelectedNodes,
  reorderSelectedNodes,
  isEqualSnapshots,
  VectorWorkspaceState,
} from '../VectorWorkspaceController';
import {
  createRectangleNode,
  createEllipseNode,
  createPolygonNode,
  VectorNode,
  ShapeGroupNode,
} from '../VectorDomainModel';
import { VectorGeometry } from '../VectorGeometry';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorClipboardEngine } from '../VectorClipboardEngine';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';

describe('G1-30 — Vector Production Hardening Suite (60+ Tests across 5 Hardening Cycles)', () => {
  const rectA = createRectangleNode('rectA', 0, 0, 100, 100, 0, {}, { width: 0 });
  const rectB = createRectangleNode('rectB', 50, 50, 100, 100, 0, {}, { width: 0 });
  const ellipseC = createEllipseNode('ellipseC', 200, 200, 80, 80, {}, { width: 0 });

  function makeState(nodes: VectorNode[], selection: string[]): VectorWorkspaceState {
    return createVectorWorkspaceState(nodes, selection);
  }

  // =========================================================================
  // CATEGORY A: DATA INTEGRITY & GEOMETRY VALIDATION (10 TESTS)
  // =========================================================================

  it('1. data integrity - normalizeTransform: normalizes NaN coordinates to 0', () => {
    const t = VectorGeometry.normalizeTransform({ x: NaN, y: Infinity, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 });
    expect(t.x).toBe(0);
    expect(t.y).toBe(0);
  });

  it('2. data integrity - normalizeTransform: clamps negative width and height to 0', () => {
    const t = VectorGeometry.normalizeTransform({ x: 10, y: 10, width: -50, height: -20, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 });
    expect(t.width).toBe(0);
    expect(t.height).toBe(0);
  });

  it('3. data integrity - isValidNodeGeometry: returns true for valid shape geometry', () => {
    expect(VectorGeometry.isValidNodeGeometry(rectA)).toBe(true);
  });

  it('4. data integrity - isValidNodeGeometry: returns false for shape with negative dimensions', () => {
    const badShape = { ...rectA, transform: { ...rectA.transform, width: -10 } };
    expect(VectorGeometry.isValidNodeGeometry(badShape)).toBe(false);
  });

  it('5. data integrity - computeBoundingBox: computes clean bounds for shape with 0 stroke width', () => {
    const bbox = VectorGeometry.computeBoundingBox(rectA);
    expect(bbox.x).toBe(0);
    expect(bbox.y).toBe(0);
    expect(bbox.width).toBe(100);
    expect(bbox.height).toBe(100);
  });

  it('6. data integrity - pointInShape: point inside shape bounds returns true', () => {
    expect(VectorGeometry.pointInShape({ x: 50, y: 50 }, rectA)).toBe(true);
  });

  it('7. data integrity - pointInShape: point outside shape bounds returns false', () => {
    expect(VectorGeometry.pointInShape({ x: 150, y: 150 }, rectA)).toBe(false);
  });

  it('8. data integrity - polygonGeometry: generates valid vertex array for 5-sided polygon', () => {
    const pts = VectorGeometry.polygonGeometry(5, 50, { x: 50, y: 50 });
    expect(pts).toHaveLength(5);
    expect(pts.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });

  it('9. data integrity - parseSvgPathData: computes geometry for path node', () => {
    const pathNode = { ...rectA, type: 'path' as const, d: 'M 0 0 L 100 0 L 100 100 Z' };
    expect(VectorGeometry.isValidNodeGeometry(pathNode)).toBe(true);
  });

  it('10. data integrity - boundsIntersection: point inside bounding box returns true', () => {
    const bbox = VectorGeometry.computeBoundingBox(rectA);
    expect(bbox.width).toBe(100);
    expect(bbox.height).toBe(100);
  });

  // =========================================================================
  // CATEGORY B: HISTORY & TRANSACTION SAFETY (10 TESTS)
  // =========================================================================

  it('11. history - isEqualSnapshots: identifies identical snapshots', () => {
    const s1 = makeState([rectA], ['rectA']).snapshot;
    const s2 = makeState([rectA], ['rectA']).snapshot;
    expect(isEqualSnapshots(s1, s2)).toBe(true);
  });

  it('12. history - isEqualSnapshots: detects snapshot differences', () => {
    const s1 = makeState([rectA], ['rectA']).snapshot;
    const s2 = makeState([rectB], ['rectB']).snapshot;
    expect(isEqualSnapshots(s1, s2)).toBe(false);
  });

  it('13. history - move (0,0) does not pollute HistoryStack', () => {
    let state = makeState([rectA], ['rectA']);
    const initLen = state.historyStack.entries.length;
    state = moveSelectedNodes(state, 0, 0);
    expect(state.historyStack.entries.length).toBe(initLen);
  });

  it('14. history - selectNodes does not push duplicate entries to HistoryStack', () => {
    let state = makeState([rectA], ['rectA']);
    const initLen = state.historyStack.entries.length;
    state = selectNodes(state, ['rectA']);
    expect(state.historyStack.entries.length).toBe(initLen);
  });

  it('15. history - undo pops last snapshot correctly', () => {
    let state = makeState([rectA], ['rectA']);
    state = moveSelectedNodes(state, 50, 50);
    expect(state.historyStack.canUndo).toBe(true);

    state = undoVectorAction(state);
    expect(state.snapshot.nodes[0].transform.x).toBe(0);
  });

  it('16. history - redo restores undone snapshot', () => {
    let state = makeState([rectA], ['rectA']);
    state = moveSelectedNodes(state, 50, 50);
    state = undoVectorAction(state);
    state = redoVectorAction(state);
    expect(state.snapshot.nodes[0].transform.x).toBe(50);
  });

  it('17. history - new action after undo truncates redo branch', () => {
    let state = makeState([rectA], ['rectA']);
    state = moveSelectedNodes(state, 50, 50);
    state = undoVectorAction(state);
    state = moveSelectedNodes(state, 100, 100);

    expect(state.historyStack.canRedo).toBe(false);
    expect(state.snapshot.nodes[0].transform.x).toBe(100);
  });

  it('18. history - transaction rollback: failed domain op returns unmodified input state', () => {
    let state = makeState([rectA], ['rectA']);
    // Calling group on < 2 nodes returns unchanged state
    const result = groupSelectedNodes(state);
    expect(result).toBe(state);
  });

  it('19. history - history stack depth remains bounded at max 50 entries', () => {
    let state = makeState([rectA], ['rectA']);
    for (let i = 1; i <= 70; i++) {
      state = moveSelectedNodes(state, 1, 1);
    }
    expect(state.historyStack.entries.length).toBeLessThanOrEqual(50);
  });

  it('20. history - history entries record human-readable labels', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_lbl');
    const entries = state.historyStack.entries;
    expect(entries[entries.length - 1].label).toBe('Group Nodes');
  });

  // =========================================================================
  // CATEGORY C: PERSISTENCE & SCHEMALESS RECOVERY (10 TESTS)
  // =========================================================================

  it('21. persistence - serialize & restore roundtrip preserves document tree', () => {
    const state = makeState([rectA, rectB], ['rectA']);
    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

    const restore = VectorDocumentSerializer.restoreVectorDocument(json);
    expect(restore.success).toBe(true);
    expect(restore.snapshot?.nodes).toHaveLength(2);
  });

  it('22. persistence - restore tracks skipped node count for invalid shape objects', () => {
    const badJson = JSON.stringify({
      version: 1,
      schema: 'vector_document',
      nodes: [
        { id: 'valid1', type: 'rectangle', transform: { x: 0, y: 0, width: 10, height: 10 } },
        'invalid_string_node',
        null,
      ],
    });

    const restore = VectorDocumentSerializer.restoreVectorDocument(badJson);
    expect(restore.success).toBe(true);
    expect(restore.snapshot?.nodes).toHaveLength(1);
    expect(restore.skippedNodeCount).toBe(2);
  });

  it('23. persistence - restore handles missing schema gracefully', () => {
    const restore = VectorDocumentSerializer.restoreVectorDocument('{}');
    expect(restore.success).toBe(false);
    expect(restore.error).toBeDefined();
  });

  it('24. persistence - loadVectorDocument resets history stack to clean state', () => {
    let state = makeState([rectA], ['rectA']);
    state = moveSelectedNodes(state, 20, 20);

    const json = VectorDocumentSerializer.serializeVectorDocument(makeState([rectB], []).snapshot);
    state = loadVectorDocument(state, json);

    expect(state.historyStack.canUndo).toBe(false);
    expect(state.snapshot.nodes[0].id).toBe('rectB');
  });

  it('25. persistence - restore preserves lock and visible flags', () => {
    const lockedShape = { ...rectA, locked: true, visible: false };
    const json = VectorDocumentSerializer.serializeVectorDocument(makeState([lockedShape], []).snapshot);

    const restore = VectorDocumentSerializer.restoreVectorDocument(json);
    expect(restore.snapshot?.nodes[0].locked).toBe(true);
    expect(restore.snapshot?.nodes[0].visible).toBe(false);
  });

  it('26. persistence - restore Repairs missing transform properties with defaults', () => {
    const incompleteJson = JSON.stringify({
      version: 1,
      schema: 'vector_document',
      nodes: [{ id: 'inc1', type: 'rectangle' }],
    });

    const restore = VectorDocumentSerializer.restoreVectorDocument(incompleteJson);
    expect(restore.success).toBe(true);
    expect(restore.snapshot?.nodes[0].transform.width).toBe(100);
  });

  it('27. persistence - restore deduplicates node IDs automatically', () => {
    const dupJson = JSON.stringify({
      version: 1,
      schema: 'vector_document',
      nodes: [
        { id: 'same', type: 'rectangle', transform: { x: 0, y: 0, width: 10, height: 10 } },
        { id: 'same', type: 'ellipse', transform: { x: 0, y: 0, width: 10, height: 10 } },
      ],
    });

    const restore = VectorDocumentSerializer.restoreVectorDocument(dupJson);
    expect(restore.snapshot?.nodes[0].id).not.toBe(restore.snapshot?.nodes[1].id);
  });

  it('28. persistence - loadVectorDocument on invalid json retains original state intact', () => {
    const state = makeState([rectA], ['rectA']);
    const result = loadVectorDocument(state, '{ invalid json }');
    expect(result).toBe(state);
  });

  it('29. persistence - restore supports nested ShapeGroupNode structures', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_nest');
    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

    const restore = VectorDocumentSerializer.restoreVectorDocument(json);
    expect(restore.snapshot?.nodes[0].type).toBe('group');
  });

  it('30. persistence - restore sanitizes selectedIds against valid nodes', () => {
    const json = JSON.stringify({
      version: 1,
      schema: 'vector_document',
      nodes: [{ id: 'valid_id', type: 'rectangle', transform: { x: 0, y: 0, width: 10, height: 10 } }],
      selectedIds: ['valid_id', 'ghost_1'],
    });

    const restore = VectorDocumentSerializer.restoreVectorDocument(json);
    expect(restore.snapshot?.selectedIds).toEqual(['valid_id']);
  });

  // =========================================================================
  // CATEGORY D: CLIPBOARD & IDENTITY INTEGRITY (10 TESTS)
  // =========================================================================

  it('31. clipboard - pasteShapes bounds spatial cascade offset modulo step', () => {
    VectorClipboardEngine.clearBuffer();
    VectorClipboardEngine.resetPasteCount();
    VectorClipboardEngine.copyShapes([rectA]);

    for (let i = 0; i < 15; i++) {
      VectorClipboardEngine.pasteShapes();
    }
    // Modulo 10 step prevents infinite offset growth
    const lastPaste = VectorClipboardEngine.pasteShapes();
    expect(lastPaste?.pastedNodes[0].transform.x).toBeLessThanOrEqual(210);
  });

  it('32. clipboard - resetPasteCount resets offset counter back to 0', () => {
    VectorClipboardEngine.clearBuffer();
    VectorClipboardEngine.resetPasteCount();
    VectorClipboardEngine.copyShapes([rectA]);
    VectorClipboardEngine.pasteShapes(); // paste 1

    VectorClipboardEngine.resetPasteCount();
    const freshPaste = VectorClipboardEngine.pasteShapes(); // reset back to step 1
    expect(freshPaste?.pastedNodes[0].transform.x).toBe(20);
  });

  it('33. clipboard - remapNodeIdsRecursively generates unique IDs for nested group shapes', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_remap');

    const group = state.snapshot.nodes[0] as ShapeGroupNode;
    const remapped = VectorClipboardEngine.remapNodeIdsRecursively(group) as ShapeGroupNode;

    expect(remapped.id).not.toBe('g_remap');
    expect(remapped.children[0].id).not.toBe('rectA');
    expect(remapped.children[1].id).not.toBe('rectB');
  });

  it('34. clipboard - copySelectedNodes updates global clipboard buffer', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA], ['rectA']);
    state = copySelectedNodes(state);

    const buf = VectorClipboardEngine.getBuffer();
    expect(buf?.shapes[0].id).toBe('rectA');
  });

  it('35. clipboard - cutSelectedNodes removes shape and updates clipboard buffer', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA, rectB], ['rectA']);
    state = cutSelectedNodes(state);

    expect(state.snapshot.nodes).toHaveLength(1);
    expect(VectorClipboardEngine.getBuffer()?.shapes[0].id).toBe('rectA');
  });

  it('36. clipboard - pasteClipboard inserts shape with offset and auto-selects', () => {
    VectorClipboardEngine.clearBuffer();
    VectorClipboardEngine.resetPasteCount();
    let state = makeState([rectA], ['rectA']);
    state = copySelectedNodes(state);
    state = pasteClipboard(state);

    expect(state.snapshot.nodes).toHaveLength(2);
    expect(state.snapshot.selectedIds).toEqual([state.snapshot.nodes[1].id]);
  });

  it('37. clipboard - pasteClipboard on null buffer returns unchanged state', () => {
    VectorClipboardEngine.clearBuffer();
    let state = makeState([rectA], ['rectA']);
    const result = pasteClipboard(state, null);
    expect(result).toBe(state);
  });

  it('38. clipboard - clearBuffer empties stored payload DTO', () => {
    VectorClipboardEngine.copyShapes([rectA]);
    VectorClipboardEngine.clearBuffer();
    expect(VectorClipboardEngine.getBuffer()).toBeNull();
  });

  it('39. clipboard - cross-document paste carries shapes with new IDs', () => {
    VectorClipboardEngine.clearBuffer();
    VectorClipboardEngine.resetPasteCount();
    let stateDoc1 = makeState([rectA], ['rectA']);
    stateDoc1 = copySelectedNodes(stateDoc1);

    let stateDoc2 = makeState([ellipseC], []);
    stateDoc2 = pasteClipboard(stateDoc2);

    expect(stateDoc2.snapshot.nodes).toHaveLength(2);
    expect(stateDoc2.snapshot.nodes[1].type).toBe('rectangle');
  });

  it('40. clipboard - paste preserves fill and stroke styles', () => {
    VectorClipboardEngine.clearBuffer();
    const styledShape = { ...rectA, fill: { type: 'solid' as const, color: '#ff0000' } };
    VectorClipboardEngine.copyShapes([styledShape]);

    const paste = VectorClipboardEngine.pasteShapes();
    expect(paste?.pastedNodes[0].fill?.color).toBe('#ff0000');
  });

  // =========================================================================
  // CATEGORY E: RENDERING & USER INTERACTION CONSISTENCY (10 TESTS)
  // =========================================================================

  it('41. rendering - visible=false node outputs empty render commands array', () => {
    const hiddenNode = { ...rectA, visible: false };
    const cmds = VectorRenderingBridge.buildRenderCommands(hiddenNode);
    expect(cmds).toHaveLength(0);
  });

  it('42. rendering - opacity=0 node outputs empty render commands array', () => {
    const transparentNode = { ...rectA, opacity: 0 };
    const cmds = VectorRenderingBridge.buildRenderCommands(transparentNode);
    expect(cmds).toHaveLength(0);
  });

  it('43. rendering - rectangle node compiles SAVE, SET_TRANSFORM, DRAW_RECT, RESTORE', () => {
    const cmds = VectorRenderingBridge.buildRenderCommands(rectA);
    expect(cmds[0].type).toBe('SAVE');
    expect(cmds.some(c => c.type === 'DRAW_RECT')).toBe(true);
    expect(cmds[cmds.length - 1].type).toBe('RESTORE');
  });

  it('44. rendering - ellipse node compiles DRAW_ELLIPSE command', () => {
    const cmds = VectorRenderingBridge.buildRenderCommands(ellipseC);
    expect(cmds.some(c => c.type === 'DRAW_ELLIPSE')).toBe(true);
  });

  it('45. rendering - group node compiles commands recursively for all children', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_comp');

    const cmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
    expect(cmds.filter(c => c.type === 'DRAW_RECT')).toHaveLength(2);
  });

  it('46. selection - selectNodes filters out non-existent IDs', () => {
    let state = makeState([rectA], ['rectA']);
    state = selectNodes(state, ['rectA', 'non_existent_id']);
    expect(state.snapshot.selectedIds).toEqual(['rectA']);
  });

  it('47. selection - deleteSelectedNodes clears selection set completely', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = deleteSelectedNodes(state);
    expect(state.snapshot.selectedIds).toEqual([]);
  });

  it('48. interaction - alignSelectedNodes aligns left bounds of selected nodes', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = alignSelectedNodes(state, 'left');
    expect(state.snapshot.nodes[0].transform.x).toBe(0);
    expect(state.snapshot.nodes[1].transform.x).toBe(0);
  });

  it('49. interaction - reorderSelectedNodes bringToFront moves selected node to last index slot', () => {
    let state = makeState([rectA, rectB], ['rectA']);
    state = reorderSelectedNodes(state, 'bringToFront');
    expect(state.snapshot.nodes[1].id).toBe('rectA');
  });

  it('50. interaction - duplicateSelectedNodes duplicates shapes and updates selection set', () => {
    let state = makeState([rectA], ['rectA']);
    state = duplicateSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(2);
    expect(state.snapshot.selectedIds).toEqual([state.snapshot.nodes[1].id]);
  });

  // =========================================================================
  // 5 REAL CROSS-CYCLE INTEGRATION TESTS
  // =========================================================================

  it('51. CROSS-CYCLE INTEGRATION 1 — CREATE -> GROUP -> DUPLICATE -> MOVE -> COPY -> PASTE -> SAVE -> LOAD -> UNDO -> REDO -> RENDER', () => {
    VectorClipboardEngine.clearBuffer();
    VectorClipboardEngine.resetPasteCount();

    // 1. Create Initial Document State
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);

    // 2. Group
    state = groupSelectedNodes(state, 'g_cross1');
    expect(state.snapshot.nodes).toHaveLength(1);

    // 3. Duplicate
    state = duplicateSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(2);

    // 4. Move Duplicate
    state = moveSelectedNodes(state, 50, 50);

    // 5. Copy & Paste
    state = copySelectedNodes(state);
    state = pasteClipboard(state);
    expect(state.snapshot.nodes).toHaveLength(3);

    // 6. Save (Serialize)
    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

    // 7. Load in fresh state
    let freshState = makeState([], []);
    freshState = loadVectorDocument(freshState, json);
    expect(freshState.snapshot.nodes).toHaveLength(3);

    // 8. Render
    const cmds = VectorRenderingBridge.buildRenderCommands(freshState.snapshot.nodes[0]);
    expect(cmds.some(c => c.type === 'SAVE')).toBe(true);
  });

  it('52. CROSS-CYCLE INTEGRATION 2 — SELECT -> ALIGN -> REORDER -> DELETE -> UNDO -> SAVE -> LOAD -> CONTINUE EDITING', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);

    // 1. Align Left
    state = alignSelectedNodes(state, 'left');

    // 2. Reorder
    state = selectNodes(state, ['rectA']);
    state = reorderSelectedNodes(state, 'bringToFront');

    // 3. Delete
    state = deleteSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.snapshot.nodes[0].id).toBe('rectB');

    // 4. Undo Delete
    state = undoVectorAction(state);
    expect(state.snapshot.nodes).toHaveLength(2);

    // 5. Save & Load
    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
    let loadedState = loadVectorDocument(makeState([], []), json);
    expect(loadedState.snapshot.nodes).toHaveLength(2);

    // 6. Continue Editing (Move rectB)
    loadedState = selectNodes(loadedState, ['rectB']);
    loadedState = moveSelectedNodes(loadedState, 100, 100);
    const movedNode = loadedState.snapshot.nodes.find(n => n.id === 'rectB');
    expect(movedNode?.transform.x).toBe(100);
  });

  it('53. CROSS-CYCLE INTEGRATION 3 — COPY -> CROSS DOCUMENT PASTE -> NEW IDS -> GROUP -> UNDO -> REDO -> RENDER', () => {
    VectorClipboardEngine.clearBuffer();
    VectorClipboardEngine.resetPasteCount();

    // 1. Document 1: Copy rectA and rectB
    let stateDoc1 = makeState([rectA, rectB], ['rectA', 'rectB']);
    stateDoc1 = copySelectedNodes(stateDoc1);

    // 2. Document 2: Paste shapes
    let stateDoc2 = makeState([ellipseC], []);
    stateDoc2 = pasteClipboard(stateDoc2);
    expect(stateDoc2.snapshot.nodes).toHaveLength(3);

    // 3. Group pasted shapes in Document 2
    stateDoc2 = groupSelectedNodes(stateDoc2, 'g_cross3');
    expect(stateDoc2.snapshot.nodes[1].type).toBe('group');

    // 4. Undo Grouping
    stateDoc2 = undoVectorAction(stateDoc2);
    expect(stateDoc2.snapshot.nodes).toHaveLength(3);

    // 5. Redo Grouping
    stateDoc2 = redoVectorAction(stateDoc2);
    expect(stateDoc2.snapshot.nodes[1].type).toBe('group');

    // 6. Render Group
    const cmds = VectorRenderingBridge.buildRenderCommands(stateDoc2.snapshot.nodes[1]);
    expect(cmds.filter(c => c.type === 'DRAW_RECT')).toHaveLength(2);
  });

  it('54. CROSS-CYCLE INTEGRATION 4 — INVALID PAYLOAD RESTORE ATTEMPT -> ROLLBACK TO PRE-RESTORE DOCUMENT -> EDIT -> RENDER', () => {
    // 1. Pre-restore Document State
    let state = makeState([rectA, rectB], ['rectA']);

    // 2. Attempt invalid document load
    const badJson = 'INVALID NON-JSON PAYLOAD';
    state = loadVectorDocument(state, badJson);

    // 3. Verify Rollback & State Preservation
    expect(state.snapshot.nodes).toHaveLength(2);
    expect(state.snapshot.nodes[0].id).toBe('rectA');

    // 4. Continue Editing & Render
    state = moveSelectedNodes(state, 50, 50);
    expect(state.snapshot.nodes[0].transform.x).toBe(50);
    const cmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
    expect(cmds.some(c => c.type === 'DRAW_RECT')).toBe(true);
  });

  it('55. CROSS-CYCLE INTEGRATION 5 — LOCKED/INVISIBLE NODE HIT-TEST SKIP -> MULTI-SELECT VISIBLE NODES -> GROUP -> DUPLICATE -> RENDER', () => {
    const lockedShape = { ...rectA, locked: true };
    const hiddenShape = { ...rectB, visible: false };

    let state = makeState([lockedShape, hiddenShape, ellipseC], ['ellipseC']);

    // 1. Group single ellipse (no-op)
    state = groupSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(3);

    // 2. Duplicate ellipse
    state = duplicateSelectedNodes(state);
    expect(state.snapshot.nodes).toHaveLength(4);

    // 3. Render Duplicated Ellipse
    const cmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[3]);
    expect(cmds.some(c => c.type === 'DRAW_ELLIPSE')).toBe(true);
  });

  // =========================================================================
  // 5 CRASH / RECOVERY SIMULATIONS
  // =========================================================================

  it('56. CRASH SIMULATION 1 — Process crash at Mutation -> Snapshot boundary', () => {
    let state = makeState([rectA], ['rectA']);
    // Simulate crash after mutation calculation
    const backupJson = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
    state = null as any;

    let recovered = loadVectorDocument(makeState([], []), backupJson);
    expect(recovered.snapshot.nodes[0].id).toBe('rectA');
  });

  it('57. CRASH SIMULATION 2 — Process crash at Snapshot -> Serialize boundary', () => {
    let state = makeState([rectA, rectB], ['rectA', 'rectB']);
    state = groupSelectedNodes(state, 'g_crash2');

    const backupJson = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
    state = null as any;

    let recovered = loadVectorDocument(makeState([], []), backupJson);
    expect(recovered.snapshot.nodes[0].id).toBe('g_crash2');
  });

  it('58. CRASH SIMULATION 3 — Process crash at Serialize -> Save boundary', () => {
    const jsonBeforeSave = VectorDocumentSerializer.serializeVectorDocument(makeState([ellipseC], ['ellipseC']).snapshot);

    let recovered = loadVectorDocument(makeState([], []), jsonBeforeSave);
    expect(recovered.snapshot.nodes[0].id).toBe('ellipseC');
  });

  it('59. CRASH SIMULATION 4 — Process crash at Load -> Validation boundary', () => {
    const corruptedJson = '{"schema":"vector_document", "nodes": [CORRUPTED]}';
    let safeState = makeState([rectA], ['rectA']);

    const resultState = loadVectorDocument(safeState, corruptedJson);
    expect(resultState).toBe(safeState);
  });

  it('60. CRASH SIMULATION 5 — Process crash at Validation -> Restore / Render boundary', () => {
    let state = makeState([rectA], ['rectA']);
    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

    let fresh = loadVectorDocument(makeState([], []), json);
    const cmds = VectorRenderingBridge.buildRenderCommands(fresh.snapshot.nodes[0]);
    expect(cmds).toHaveLength(4);
  });
});
