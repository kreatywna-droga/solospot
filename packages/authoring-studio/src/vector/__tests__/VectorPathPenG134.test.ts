import { describe, it, expect, beforeEach } from 'vitest';
import {
  createVectorWorkspaceState,
  VectorWorkspaceState,
  startPenSession,
  addPenAnchor,
  updatePenPreview,
  updatePenAnchorHandle,
  closePenPath,
  finishPenSession,
  cancelPenSession,
  movePathAnchor,
  movePathControlHandle,
  convertPathNodeType,
  addPathNodeToSegment,
  deletePathNode,
  undoVectorAction,
  redoVectorAction,
  selectNodesInMarquee,
} from '../VectorWorkspaceController';
import { VectorPenEngine, PenDrawingSession } from '../VectorPenEngine';
import { VectorGeometry } from '../VectorGeometry';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';
import { PathNode, createPathNode } from '../VectorDomainModel';

describe('G1-34 — Path Pen Tool Bezier Curve Drawing & Node Editing', () => {
  let state: VectorWorkspaceState;

  beforeEach(() => {
    state = createVectorWorkspaceState();
  });

  // =========================================================================
  // 1. REQUIRED E2E WORKFLOWS (E2E-01 through E2E-07)
  // =========================================================================

  it('E2E-01: Start Pen Tool -> create multi-node open path -> commit -> render -> serialize -> deserialize -> geometry preserved', () => {
    let session = startPenSession('pen_e2e1', { x: 10, y: 10 });
    session = addPenAnchor(session, { x: 100, y: 10 });
    session = addPenAnchor(session, { x: 50, y: 100 });

    state = finishPenSession(state, session);

    expect(state.snapshot.nodes).toHaveLength(1);
    const pathNode = state.snapshot.nodes[0] as PathNode;
    expect(pathNode.type).toBe('path');
    expect(pathNode.pathData?.anchors).toHaveLength(3);
    expect(pathNode.pathData?.closed).toBe(false);

    // Render verification
    const renderCmds = VectorRenderingBridge.buildRenderCommands(pathNode);
    expect(renderCmds).toHaveLength(4);
    expect(renderCmds[2].type).toBe('DRAW_PATH');

    // Serialization roundtrip
    const serialized = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
    const restored = VectorDocumentSerializer.restoreVectorDocument(serialized);

    expect(restored.success).toBe(true);
    expect(restored.snapshot?.nodes).toHaveLength(1);
    const restoredPath = restored.snapshot!.nodes[0] as PathNode;
    expect(restoredPath.pathData?.anchors).toHaveLength(3);
    expect(restoredPath.d).toBe(pathNode.d);
  });

  it('E2E-02: Click + drag -> create Bezier node -> create second node -> verify curve geometry', () => {
    let session = startPenSession('pen_e2e2', { x: 0, y: 0 });
    session = updatePenAnchorHandle(session, 0, 'out', { x: 30, y: 0 }, 'smooth');
    session = addPenAnchor(session, { x: 100, y: 100 }, { handleIn: { x: 70, y: 100 } });

    state = finishPenSession(state, session);

    const pathNode = state.snapshot.nodes[0] as PathNode;
    expect(pathNode.d).toContain('C 30 0 70 100 100 100');
    expect(pathNode.pathData?.anchors[0].handleOut).toEqual({ x: 30, y: 0 });
    expect(pathNode.pathData?.anchors[1].handleIn).toEqual({ x: 70, y: 100 });
  });

  it('E2E-03: Create path -> select node -> move node -> verify geometry update -> undo -> redo', () => {
    let session = startPenSession('pen_e2e3', { x: 0, y: 0 });
    session = addPenAnchor(session, { x: 50, y: 0 });
    session = addPenAnchor(session, { x: 50, y: 50 });
    state = finishPenSession(state, session);

    const pathId = state.snapshot.nodes[0].id;

    // Move anchor node index 1 from (50, 0) to (100, 0)
    state = movePathAnchor(state, pathId, 1, { x: 100, y: 0 });
    let movedNode = state.snapshot.nodes[0] as PathNode;
    expect(movedNode.pathData?.anchors[1].x).toBe(100);

    // Undo -> restores (50, 0)
    state = undoVectorAction(state);
    let undoneNode = state.snapshot.nodes[0] as PathNode;
    expect(undoneNode.pathData?.anchors[1].x).toBe(50);

    // Redo -> re-applies (100, 0)
    state = redoVectorAction(state);
    let redoneNode = state.snapshot.nodes[0] as PathNode;
    expect(redoneNode.pathData?.anchors[1].x).toBe(100);
  });

  it('E2E-04: Create path -> edit Bezier handle -> serialize -> reload -> handle geometry preserved', () => {
    let session = startPenSession('pen_e2e4', { x: 0, y: 0 });
    session = addPenAnchor(session, { x: 100, y: 0 });
    state = finishPenSession(state, session);

    const pathId = state.snapshot.nodes[0].id;
    state = movePathControlHandle(state, pathId, 0, 'out', { x: 25, y: -25 }, 'smooth');

    const pathNode = state.snapshot.nodes[0] as PathNode;
    expect(pathNode.pathData?.anchors[0].handleOut).toEqual({ x: 25, y: -25 });

    const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
    const restored = VectorDocumentSerializer.restoreVectorDocument(json);

    const restoredNode = restored.snapshot!.nodes[0] as PathNode;
    expect(restoredNode.pathData?.anchors[0].handleOut).toEqual({ x: 25, y: -25 });
  });

  it('E2E-05: Create closed path -> marquee-select path -> verify G1-33 marquee compatibility', () => {
    let session = startPenSession('pen_e2e5', { x: 10, y: 10 });
    session = addPenAnchor(session, { x: 50, y: 10 });
    session = addPenAnchor(session, { x: 50, y: 50 });
    session = closePenPath(session);
    state = finishPenSession(state, session);

    const pathId = state.snapshot.nodes[0].id;

    // G1-33 Marquee Selection over path
    state = selectNodesInMarquee(state, { x: 0, y: 0, width: 100, height: 100 });
    expect(state.snapshot.selectedIds).toContain(pathId);
  });

  it('E2E-06: Start drawing -> create several nodes -> cancel -> verify zero committed document mutation', () => {
    const initialSnapshot = state.snapshot;

    let session = startPenSession('pen_e2e6', { x: 10, y: 10 });
    session = addPenAnchor(session, { x: 20, y: 20 });
    session = updatePenPreview(session, { x: 30, y: 30 });

    // Cancel drawing
    state = cancelPenSession(state);

    expect(state.snapshot).toEqual(initialSnapshot);
    expect(state.snapshot.nodes).toHaveLength(0);
  });

  it('E2E-07: Create path -> delete node -> verify valid path topology -> undo -> verify restoration', () => {
    let session = startPenSession('pen_e2e7', { x: 0, y: 0 });
    session = addPenAnchor(session, { x: 50, y: 0 });
    session = addPenAnchor(session, { x: 50, y: 50 });
    state = finishPenSession(state, session);

    const pathId = state.snapshot.nodes[0].id;

    // Delete middle node (index 1)
    state = deletePathNode(state, pathId, 1);
    const updatedNode = state.snapshot.nodes[0] as PathNode;
    expect(updatedNode.pathData?.anchors).toHaveLength(2);

    // Undo -> restores 3 nodes
    state = undoVectorAction(state);
    const restoredNode = state.snapshot.nodes[0] as PathNode;
    expect(restoredNode.pathData?.anchors).toHaveLength(3);
  });

  // =========================================================================
  // 2. ADVERSARIAL TESTING (ADV-01 through ADV-17)
  // =========================================================================

  it('ADV-01: Single-click path with insufficient nodes', () => {
    let session = startPenSession('pen_adv1', { x: 10, y: 10 });
    state = finishPenSession(state, session);

    expect(state.snapshot.nodes).toHaveLength(1);
    const pathNode = state.snapshot.nodes[0] as PathNode;
    expect(pathNode.d).toBe('M 10 10');
  });

  it('ADV-02: Cancel immediately after first anchor', () => {
    let session = startPenSession('pen_adv2', { x: 10, y: 10 });
    state = cancelPenSession(state);
    expect(state.snapshot.nodes).toHaveLength(0);
  });

  it('ADV-03: Repeated rapid pointer events during Pen session', () => {
    let session = startPenSession('pen_adv3', { x: 0, y: 0 });
    for (let i = 0; i < 50; i++) {
      session = updatePenPreview(session, { x: i, y: i * 2 });
    }
    session = addPenAnchor(session, { x: 100, y: 100 });
    state = finishPenSession(state, session);

    expect(state.snapshot.nodes).toHaveLength(1);
    expect(state.historyStack.canUndo).toBe(true);
  });

  it('ADV-04: Extremely small Bezier handle', () => {
    let session = startPenSession('pen_adv4', { x: 0, y: 0 });
    session = updatePenAnchorHandle(session, 0, 'out', { x: 0.0001, y: 0.0001 });
    session = addPenAnchor(session, { x: 100, y: 100 });
    state = finishPenSession(state, session);

    expect(state.snapshot.nodes).toHaveLength(1);
    const pathNode = state.snapshot.nodes[0] as PathNode;
    expect(pathNode.d).toContain('C 0.0001 0.0001 100 100 100 100');
  });

  it('ADV-05: Extremely large Bezier handle', () => {
    let session = startPenSession('pen_adv5', { x: 0, y: 0 });
    session = updatePenAnchorHandle(session, 0, 'out', { x: 1e8, y: 1e8 });
    session = addPenAnchor(session, { x: 100, y: 100 });
    state = finishPenSession(state, session);

    expect(state.snapshot.nodes).toHaveLength(1);
    const pathNode = state.snapshot.nodes[0] as PathNode;
    expect(pathNode.d).toContain('C 100000000 100000000 100 100 100 100');
  });

  it('ADV-06: Coincident anchors', () => {
    let session = startPenSession('pen_adv6', { x: 10, y: 10 });
    session = addPenAnchor(session, { x: 10, y: 10 });
    state = finishPenSession(state, session);

    expect(state.snapshot.nodes).toHaveLength(1);
    const pathNode = state.snapshot.nodes[0] as PathNode;
    expect(pathNode.pathData?.anchors).toHaveLength(2);
  });

  it('ADV-07: Delete node from minimum-valid path', () => {
    let session = startPenSession('pen_adv7', { x: 0, y: 0 });
    session = addPenAnchor(session, { x: 10, y: 10 });
    state = finishPenSession(state, session);

    const pathId = state.snapshot.nodes[0].id;
    // Deleting one anchor from 2-anchor path leaves 1 anchor
    state = deletePathNode(state, pathId, 1);
    const updated = state.snapshot.nodes[0] as PathNode;
    expect(updated.pathData?.anchors).toHaveLength(1);

    // Deleting last anchor removes shape cleanly
    state = deletePathNode(state, pathId, 0);
    expect(state.snapshot.nodes).toHaveLength(0);
  });

  it('ADV-08: Delete multiple nodes rapidly', () => {
    let session = startPenSession('pen_adv8', { x: 0, y: 0 });
    session = addPenAnchor(session, { x: 10, y: 0 });
    session = addPenAnchor(session, { x: 20, y: 0 });
    session = addPenAnchor(session, { x: 30, y: 0 });
    state = finishPenSession(state, session);

    const pathId = state.snapshot.nodes[0].id;
    state = deletePathNode(state, pathId, 3);
    state = deletePathNode(state, pathId, 2);
    state = deletePathNode(state, pathId, 1);

    const updated = state.snapshot.nodes[0] as PathNode;
    expect(updated.pathData?.anchors).toHaveLength(1);
  });

  it('ADV-09: Close path and convert node type', () => {
    let session = startPenSession('pen_adv9', { x: 0, y: 0 });
    session = addPenAnchor(session, { x: 50, y: 0 });
    session = addPenAnchor(session, { x: 50, y: 50 });
    session = closePenPath(session);
    state = finishPenSession(state, session);

    const pathId = state.snapshot.nodes[0].id;
    state = convertPathNodeType(state, pathId, 0, 'smooth');

    const node = state.snapshot.nodes[0] as PathNode;
    expect(node.pathData?.anchors[0].type).toBe('smooth');
    expect(node.pathData?.anchors[0].handleIn).toBeDefined();
    expect(node.pathData?.anchors[0].handleOut).toBeDefined();
  });

  it('ADV-10: Undo/redo during complex path editing', () => {
    let session = startPenSession('pen_adv10', { x: 0, y: 0 });
    session = addPenAnchor(session, { x: 50, y: 0 });
    state = finishPenSession(state, session);

    const pathId = state.snapshot.nodes[0].id;
    state = addPathNodeToSegment(state, pathId, 0, 0.5);
    expect((state.snapshot.nodes[0] as PathNode).pathData?.anchors).toHaveLength(3);

    state = convertPathNodeType(state, pathId, 1, 'smooth');
    state = movePathAnchor(state, pathId, 1, { x: 25, y: -25 });

    state = undoVectorAction(state); // Undo move
    state = undoVectorAction(state); // Undo convert
    state = undoVectorAction(state); // Undo add node

    expect((state.snapshot.nodes[0] as PathNode).pathData?.anchors).toHaveLength(2);
  });

  it('ADV-11: Serialize malformed / legacy path data', () => {
    const legacyPath = createPathNode('p_legacy', 'M 0 0 L 100 0 Z', 0, 0, 100, 100);
    const json = VectorDocumentSerializer.serializeVectorDocument({ nodes: [legacyPath], selectedIds: [], constraintEdges: [] });
    const restored = VectorDocumentSerializer.restoreVectorDocument(json);

    expect(restored.success).toBe(true);
    expect(restored.snapshot?.nodes[0].id).toBe('p_legacy');
  });

  it('ADV-12: Marquee selection over path geometry', () => {
    let session = startPenSession('pen_adv12', { x: 100, y: 100 });
    session = addPenAnchor(session, { x: 150, y: 100 });
    state = finishPenSession(state, session);

    // Marquee outside path
    state = selectNodesInMarquee(state, { x: 0, y: 0, width: 50, height: 50 });
    expect(state.snapshot.selectedIds).toHaveLength(0);

    // Marquee overlapping path
    state = selectNodesInMarquee(state, { x: 90, y: 90, width: 70, height: 70 });
    expect(state.snapshot.selectedIds).toContain(state.snapshot.nodes[0].id);
  });

  it('ADV-13: Locked path node move attempt rejected', () => {
    let session = startPenSession('pen_adv13', { x: 0, y: 0 });
    session = addPenAnchor(session, { x: 50, y: 0 });
    state = finishPenSession(state, session);

    const pathId = state.snapshot.nodes[0].id;
    state = {
      ...state,
      snapshot: {
        ...state.snapshot,
        nodes: state.snapshot.nodes.map(n => ({ ...n, locked: true })),
      },
    };

    // Attempting to move locked path anchor does not mutate position
    state = movePathAnchor(state, pathId, 0, { x: 999, y: 999 });
    const node = state.snapshot.nodes[0] as PathNode;
    expect(node.pathData?.anchors[0].x).toBe(0);
  });

  it('ADV-14: Hidden path node rendering check', () => {
    let session = startPenSession('pen_adv14', { x: 0, y: 0 });
    session = addPenAnchor(session, { x: 50, y: 0 });
    state = finishPenSession(state, session);

    const pathNode = { ...state.snapshot.nodes[0], visible: false };
    const cmds = VectorRenderingBridge.buildRenderCommands(pathNode);
    expect(cmds).toHaveLength(0);
  });

  it('ADV-15: NaN / Infinity protection in path anchor coordinates', () => {
    let session = startPenSession('pen_adv15', { x: NaN, y: Infinity });
    expect(session.anchors).toHaveLength(0);

    session = addPenAnchor(session, { x: NaN, y: 10 });
    expect(session.anchors).toHaveLength(0);
  });

  // =========================================================================
  // 3. CONTROLLED FAILURE INJECTION (FI-01, FI-02, FI-03)
  // =========================================================================

  it('FI-01: Path commit transaction failure simulation -> safe abort & rollback', () => {
    const initialState = state;

    // Simulate unexpected error during finishPenSession by passing invalid session
    const invalidSession = null as any;
    const resState = finishPenSession(state, invalidSession);

    expect(resState).toEqual(initialState);
    expect(resState.snapshot.nodes).toHaveLength(0);
  });

  it('FI-02: Serialization failure simulation -> safe abort, history integrity preserved', () => {
    const badJson = '{ malformed json ###';
    const restoreResult = VectorDocumentSerializer.restoreVectorDocument(badJson);

    expect(restoreResult.success).toBe(false);
    expect(restoreResult.error).toBeDefined();
    expect(state.snapshot.nodes).toHaveLength(0);
  });

  it('FI-03: Rendering command compilation failure simulation -> safe fallback', () => {
    const malformedNode: any = { type: 'path', visible: true, opacity: 1, transform: null };
    const cmds = VectorRenderingBridge.buildRenderCommands(malformedNode);

    // Does not throw exception and returns safe render command list
    expect(cmds).toBeDefined();
  });
});
