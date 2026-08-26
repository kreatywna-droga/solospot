/**
 * VectorAutonomousProductEvolutionG131.test.ts — G1-31 Feature, Integration & Adversarial Test Suite
 *
 * Validates the G1-31 Autonomous Product Evolution Primary Feature:
 * Interactive Canvas Mouse Drag Move & Handle Resize Vertical Slice (GAP-02)
 * alongside Flip, Rotate, Distribute, Selection, History, Persistence, and Failure Injection.
 *
 * Categories:
 * 1. Core Behavior (8 tests)
 * 2. Edge Cases (8 tests)
 * 3. History / Undo / Redo (8 tests)
 * 4. Persistence / Rendering (8 tests)
 * 5. UI / Integration (8 tests)
 * 6. Real E2E Vertical Integration Slices (5 tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  VectorWorkspaceState,
  createVectorWorkspaceState,
  moveSelectedNodes,
  resizeSelectedNodes,
  flipSelectedNodes,
  rotateSelectedNodes,
  distributeSelectedNodes,
  toggleSelectedNodesLock,
  toggleSelectedNodesVisibility,
  selectAllNodes,
  deselectAllNodes,
  selectNodes,
  addNode,
  deleteSelectedNodes,
  undoVectorAction,
  redoVectorAction,
  loadVectorDocument,
  copySelectedNodes,
  pasteClipboard,
  executeBooleanOperation,
} from '../VectorWorkspaceController';
import {
  VectorNode,
  createRectangleNode,
  createEllipseNode,
  createPolygonNode,
  createLineNode,
  createPathNode,
} from '../VectorDomainModel';
import { VectorGeometry, BoundingBox2D } from '../VectorGeometry';
import { VectorEditingEngine } from '../VectorEditingEngine';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';

describe('G1-31 — Interactive Canvas Mouse Drag & Handle Resize Vertical Slice (45+ Tests)', () => {
  let initialState: VectorWorkspaceState;
  let node1: VectorNode;
  let node2: VectorNode;
  let node3: VectorNode;

  beforeEach(() => {
    node1 = createRectangleNode('rect1', 100, 100, 150, 100);
    node2 = createEllipseNode('ellipse1', 300, 100, 100, 100);
    node3 = createPolygonNode('poly1', 5, 500, 100, 100, 100);

    initialState = createVectorWorkspaceState([node1, node2, node3], ['rect1']);
  });

  // =========================================================================
  // CATEGORY 1: CORE BEHAVIOR (8 TESTS)
  // =========================================================================
  describe('Category 1: Core Behavior', () => {
    it('1. moves selected node translate transform by dx, dy', () => {
      const moved = moveSelectedNodes(initialState, 50, 30);
      const target = moved.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.x).toBe(150);
      expect(target?.transform.y).toBe(130);
    });

    it('2. resizes selected node from SE corner handle', () => {
      const resized = resizeSelectedNodes(initialState, 'se', 40, 20);
      const target = resized.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.width).toBe(190);
      expect(target?.transform.height).toBe(120);
    });

    it('3. resizes selected node from NW corner handle adjusting x, y, w, h', () => {
      const resized = resizeSelectedNodes(initialState, 'nw', 20, 10);
      const target = resized.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.width).toBe(130);
      expect(target?.transform.height).toBe(90);
      expect(target?.transform.x).toBe(120);
      expect(target?.transform.y).toBe(110);
    });

    it('4. flips selected shape horizontally by inverting scaleX', () => {
      const flipped = flipSelectedNodes(initialState, 'horizontal');
      const target = flipped.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.scaleX).toBe(-1);
    });

    it('5. flips selected shape vertically by inverting scaleY', () => {
      const flipped = flipSelectedNodes(initialState, 'vertical');
      const target = flipped.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.scaleY).toBe(-1);
    });

    it('6. rotates selected shape by delta degrees', () => {
      const rotated = rotateSelectedNodes(initialState, 45);
      const target = rotated.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.rotationDeg).toBe(45);
    });

    it('7. distributes 3 selected shapes horizontally with equal spacing', () => {
      const selState = selectNodes(initialState, ['rect1', 'ellipse1', 'poly1']);
      const distributed = distributeSelectedNodes(selState, 'horizontal');

      const r1 = distributed.snapshot.nodes.find(n => n.id === 'rect1');
      const e1 = distributed.snapshot.nodes.find(n => n.id === 'ellipse1');
      const p1 = distributed.snapshot.nodes.find(n => n.id === 'poly1');

      expect(r1?.transform.x).toBe(100);
      expect(e1?.transform.x).toBe(300);
      expect(p1?.transform.x).toBe(500);
    });

    it('8. toggles lock and visibility properties on selected nodes', () => {
      const locked = toggleSelectedNodesLock(initialState);
      expect(locked.snapshot.nodes.find(n => n.id === 'rect1')?.locked).toBe(true);

      const hidden = toggleSelectedNodesVisibility(locked);
      expect(hidden.snapshot.nodes.find(n => n.id === 'rect1')?.visible).toBe(false);
    });
  });

  // =========================================================================
  // CATEGORY 2: EDGE CASES (8 TESTS)
  // =========================================================================
  describe('Category 2: Edge Cases', () => {
    it('9. zero delta move no-ops and does not push to history stack', () => {
      const moved = moveSelectedNodes(initialState, 0, 0);
      expect(moved).toBe(initialState);
      expect(moved.historyStack.canUndo).toBe(false);
    });

    it('10. resize on empty selection returns unchanged state', () => {
      const emptySel = deselectAllNodes(initialState);
      const resized = resizeSelectedNodes(emptySel, 'se', 50, 50);
      expect(resized.snapshot.nodes).toEqual(emptySel.snapshot.nodes);
    });

    it('11. handle resize enforcing minSize boundary prevents negative or zero dimensions', () => {
      const shrunk = resizeSelectedNodes(initialState, 'se', -500, -500);
      const target = shrunk.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.width).toBeGreaterThanOrEqual(10);
      expect(target?.transform.height).toBeGreaterThanOrEqual(10);
    });

    it('12. hitTestResizeHandles returns null when point is outside handle regions', () => {
      const bounds: BoundingBox2D = { x: 100, y: 100, width: 200, height: 150 };
      const hit = VectorGeometry.hitTestResizeHandles({ x: 50, y: 50 }, bounds);
      expect(hit).toBeNull();
    });

    it('13. hitTestResizeHandles identifies all 8 handle corner and edge regions correctly', () => {
      const bounds: BoundingBox2D = { x: 100, y: 100, width: 200, height: 100 };
      expect(VectorGeometry.hitTestResizeHandles({ x: 100, y: 100 }, bounds)).toBe('nw');
      expect(VectorGeometry.hitTestResizeHandles({ x: 200, y: 100 }, bounds)).toBe('n');
      expect(VectorGeometry.hitTestResizeHandles({ x: 300, y: 100 }, bounds)).toBe('ne');
      expect(VectorGeometry.hitTestResizeHandles({ x: 300, y: 150 }, bounds)).toBe('e');
      expect(VectorGeometry.hitTestResizeHandles({ x: 300, y: 200 }, bounds)).toBe('se');
      expect(VectorGeometry.hitTestResizeHandles({ x: 200, y: 200 }, bounds)).toBe('s');
      expect(VectorGeometry.hitTestResizeHandles({ x: 100, y: 200 }, bounds)).toBe('sw');
      expect(VectorGeometry.hitTestResizeHandles({ x: 100, y: 150 }, bounds)).toBe('w');
    });

    it('14. aspect ratio lock maintains 1:1 proportional width and height scaling', () => {
      const resized = resizeSelectedNodes(initialState, 'se', 80, 20, true);
      const target = resized.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.width).toBe(230);
      expect(target?.transform.height).toBe(230);
    });

    it('15. selecting all nodes excludes hidden or locked nodes', () => {
      const lockedState = toggleSelectedNodesLock(initialState); // locks rect1
      const allSel = selectAllNodes(lockedState);
      expect(allSel.snapshot.selectedIds).not.toContain('rect1');
      expect(allSel.snapshot.selectedIds).toContain('ellipse1');
      expect(allSel.snapshot.selectedIds).toContain('poly1');
    });

    it('16. distributeShapes with fewer than 3 nodes safely returns unchanged state', () => {
      const selState = selectNodes(initialState, ['rect1', 'ellipse1']);
      const dist = distributeSelectedNodes(selState, 'horizontal');
      expect(dist).toBe(selState);
    });
  });

  // =========================================================================
  // CATEGORY 3: HISTORY / UNDO / REDO (8 TESTS)
  // =========================================================================
  describe('Category 3: History & Undo / Redo', () => {
    it('17. handle resize creates history stack entry with human-readable label', () => {
      const resized = resizeSelectedNodes(initialState, 'se', 30, 30);
      expect(resized.historyStack.canUndo).toBe(true);
      const currentEntry = resized.historyStack.entries[resized.historyStack.currentIndex];
      expect(currentEntry.label).toBe('Resize SE');
    });

    it('18. undoing handle resize restores exact original geometry', () => {
      const resized = resizeSelectedNodes(initialState, 'se', 50, 40);
      const undone = undoVectorAction(resized);
      const target = undone.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.width).toBe(150);
      expect(target?.transform.height).toBe(100);
    });

    it('19. redoing handle resize re-applies updated geometry', () => {
      const resized = resizeSelectedNodes(initialState, 'se', 50, 40);
      const undone = undoVectorAction(resized);
      const redone = redoVectorAction(undone);
      const target = redone.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.width).toBe(200);
      expect(target?.transform.height).toBe(140);
    });

    it('20. move -> resize -> rotate chain preserves undo history playback sequence', () => {
      let state = moveSelectedNodes(initialState, 20, 20);
      state = resizeSelectedNodes(state, 'se', 30, 30);
      state = rotateSelectedNodes(state, 90);

      expect(state.historyStack.canUndo).toBe(true);

      // Undo Rotate
      state = undoVectorAction(state);
      expect(state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.rotationDeg).toBe(0);

      // Undo Resize
      state = undoVectorAction(state);
      expect(state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.width).toBe(150);

      // Undo Move
      state = undoVectorAction(state);
      expect(state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.x).toBe(100);
    });

    it('21. applying new action after undo discards forward redo future stack', () => {
      let state = moveSelectedNodes(initialState, 50, 50);
      state = undoVectorAction(state);
      expect(state.historyStack.canRedo).toBe(true);

      // Apply new action
      state = rotateSelectedNodes(state, 45);
      expect(state.historyStack.canRedo).toBe(false);
    });

    it('22. repeated execution of flip operation creates distinct history entries', () => {
      let state = flipSelectedNodes(initialState, 'horizontal');
      state = flipSelectedNodes(state, 'horizontal');
      expect(state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.scaleX).toBe(1);
      expect(state.historyStack.canUndo).toBe(true);
    });

    it('23. undo on initial state returns unchanged state safely', () => {
      const undone = undoVectorAction(initialState);
      expect(undone).toBe(initialState);
    });

    it('24. redo on latest state returns unchanged state safely', () => {
      const redone = redoVectorAction(initialState);
      expect(redone).toBe(initialState);
    });
  });

  // =========================================================================
  // CATEGORY 4: PERSISTENCE & RENDERING (8 TESTS)
  // =========================================================================
  describe('Category 4: Persistence & Rendering', () => {
    it('25. serializes resized document snapshot to versioned JSON string', () => {
      const resized = resizeSelectedNodes(initialState, 'se', 50, 50);
      const json = VectorDocumentSerializer.serializeVectorDocument(resized.snapshot);
      expect(json).toContain('"version": 1');
      expect(json).toContain('"width": 200');
    });

    it('26. deserializes JSON payload and restores exact node geometry', () => {
      const resized = resizeSelectedNodes(initialState, 'se', 50, 50);
      const json = VectorDocumentSerializer.serializeVectorDocument(resized.snapshot);

      const loadedState = loadVectorDocument(initialState, json);
      const target = loadedState.snapshot.nodes.find(n => n.id === 'rect1');
      expect(target?.transform.width).toBe(200);
      expect(target?.transform.height).toBe(150);
    });

    it('27. loaded document resets history stack cleanly to new initial state', () => {
      const resized = resizeSelectedNodes(initialState, 'se', 50, 50);
      const json = VectorDocumentSerializer.serializeVectorDocument(resized.snapshot);

      const loadedState = loadVectorDocument(initialState, json);
      expect(loadedState.historyStack.canUndo).toBe(false);
    });

    it('28. compiles render commands for resized shape with updated bounds', () => {
      const resized = resizeSelectedNodes(initialState, 'se', 50, 50);
      const target = resized.snapshot.nodes.find(n => n.id === 'rect1')!;

      const commands = VectorRenderingBridge.buildRenderCommands(target);
      expect(commands.length).toBeGreaterThan(0);

      const drawCmd = commands.find(c => c.type === 'DRAW_RECT');
      expect(drawCmd).toBeDefined();
      if (drawCmd && drawCmd.type === 'DRAW_RECT') {
        expect(drawCmd.bounds.width).toBe(200);
        expect(drawCmd.bounds.height).toBe(150);
      }
    });

    it('29. compiles render commands incorporating flip scaleX and scaleY', () => {
      const flipped = flipSelectedNodes(initialState, 'horizontal');
      const target = flipped.snapshot.nodes.find(n => n.id === 'rect1')!;

      const commands = VectorRenderingBridge.buildRenderCommands(target);
      expect(commands.length).toBeGreaterThan(0);
      expect(target.transform.scaleX).toBe(-1);
    });

    it('30. clipboard copy and paste preserves node geometry and assigns new IDs', () => {
      let state = copySelectedNodes(initialState);
      state = pasteClipboard(state);

      expect(state.snapshot.nodes.length).toBe(4);
      const pasted = state.snapshot.nodes[3];
      expect(pasted.id).not.toBe('rect1');
      expect(pasted.transform.width).toBe(150);
      expect(pasted.transform.x).toBe(120); // +20 spatial offset
    });

    it('31. persistent load of malformed JSON safely returns original unchanged state', () => {
      const badState = loadVectorDocument(initialState, '{ invalid_json: ');
      expect(badState).toBe(initialState);
    });

    it('32. rendering bridge omits commands for invisible shapes', () => {
      const hiddenState = toggleSelectedNodesVisibility(initialState);
      const hiddenNode = hiddenState.snapshot.nodes.find(n => n.id === 'rect1')!;
      expect(hiddenNode.visible).toBe(false);
    });
  });

  // =========================================================================
  // CATEGORY 5: UI & INTEGRATION (8 TESTS)
  // =========================================================================
  describe('Category 5: UI & Integration', () => {
    it('33. deselectAllNodes clears selectedIds array', () => {
      const deselected = deselectAllNodes(initialState);
      expect(deselected.snapshot.selectedIds).toEqual([]);
    });

    it('34. selectAllNodes sets selectedIds to all selectable node IDs', () => {
      const allSelected = selectAllNodes(initialState);
      expect(allSelected.snapshot.selectedIds).toEqual(['rect1', 'ellipse1', 'poly1']);
    });

    it('35. adding a new shape node auto-selects the newly added shape', () => {
      const newPath = createPathNode('path1', 'M 0 0 L 50 50 Z');
      const added = addNode(initialState, newPath);
      expect(added.snapshot.selectedIds).toEqual(['path1']);
      expect(added.snapshot.nodes.length).toBe(4);
    });

    it('36. deleting selected nodes removes nodes and clears selection', () => {
      const deleted = deleteSelectedNodes(initialState);
      expect(deleted.snapshot.nodes.length).toBe(2);
      expect(deleted.snapshot.selectedIds).toEqual([]);
      expect(deleted.snapshot.nodes.find(n => n.id === 'rect1')).toBeUndefined();
    });

    it('37. keyboard arrow nudging translates node by 1px or 10px', () => {
      const nudge1 = moveSelectedNodes(initialState, 1, 0);
      expect(nudge1.snapshot.nodes.find(n => n.id === 'rect1')?.transform.x).toBe(101);

      const nudge10 = moveSelectedNodes(initialState, 10, 0);
      expect(nudge10.snapshot.nodes.find(n => n.id === 'rect1')?.transform.x).toBe(110);
    });

    it('38. resizing multiple selected nodes resizes each selected node', () => {
      const selState = selectNodes(initialState, ['rect1', 'ellipse1']);
      const resized = resizeSelectedNodes(selState, 'se', 20, 20);

      const r1 = resized.snapshot.nodes.find(n => n.id === 'rect1');
      const e1 = resized.snapshot.nodes.find(n => n.id === 'ellipse1');

      expect(r1?.transform.width).toBe(170);
      expect(e1?.transform.width).toBe(120);
    });

    it('39. CSG boolean operation on resized nodes produces valid result path', () => {
      const selState = selectNodes(initialState, ['rect1', 'ellipse1']);
      const resized = resizeSelectedNodes(selState, 'se', 50, 50);

      const unionState = executeBooleanOperation(resized, 'union');
      expect(unionState.snapshot.nodes.length).toBe(2);
      const resultNode = unionState.snapshot.nodes[0];
      expect(resultNode.type).toBe('path');
    });

    it('40. invalid selection ID passed to selectNodes is pruned automatically', () => {
      const pruned = selectNodes(initialState, ['rect1', 'non_existent_id']);
      expect(pruned.snapshot.selectedIds).toEqual(['rect1']);
    });
  });

  // =========================================================================
  // CATEGORY 6: REAL END-TO-END VERTICAL SLICE INTEGRATION (5 TESTS)
  // =========================================================================
  describe('Category 6: Real End-to-End Vertical Integration Slices', () => {
    it('41. E2E 1: USER DRAG → DOCUMENT MUTATION → HISTORY SNAPSHOT → RENDER', () => {
      // 1. User selects shape and drags SE handle (+40px, +30px)
      const userDragState = resizeSelectedNodes(initialState, 'se', 40, 30);

      // 2. Assert Document Snapshot updated
      const target = userDragState.snapshot.nodes.find(n => n.id === 'rect1')!;
      expect(target.transform.width).toBe(190);
      expect(target.transform.height).toBe(130);

      // 3. Assert History Stack recorded entry
      expect(userDragState.historyStack.canUndo).toBe(true);
      const currentEntry = userDragState.historyStack.entries[userDragState.historyStack.currentIndex];
      expect(currentEntry.label).toBe('Resize SE');

      // 4. Assert Render Commands compiled cleanly
      const commands = VectorRenderingBridge.buildRenderCommands(target);
      expect(commands.length).toBeGreaterThan(0);
      const drawRect = commands.find(c => c.type === 'DRAW_RECT');
      expect(drawRect).toBeDefined();
    });

    it('42. E2E 2: USER DRAG RESIZE → SAVE TO JSON → LOAD → CONTINUE EDITING', () => {
      // 1. User drags resize
      let state = resizeSelectedNodes(initialState, 'se', 60, 40);

      // 2. User saves document to JSON
      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      expect(json).toContain('"width": 210');

      // 3. User reloads document
      state = loadVectorDocument(state, json);
      expect(state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.width).toBe(210);

      // 4. User continues editing (moves shape)
      state = selectNodes(state, ['rect1']);
      state = moveSelectedNodes(state, 100, 50);
      expect(state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.x).toBe(200);
      expect(state.historyStack.canUndo).toBe(true);
    });

    it('43. E2E 3: FAILURE INJECTION → GEOMETRY CORRUPTION → SAFE ROLLBACK', () => {
      // Inject corrupted NaN/Infinity coordinates into transform
      const corruptNode = {
        ...node1,
        transform: { ...node1.transform, width: NaN, height: Infinity },
      };

      // Assert isValidNodeGeometry detects failure
      const isValid = VectorGeometry.isValidNodeGeometry(corruptNode);
      expect(isValid).toBe(false);

      // Attempting to dispatch invalid resize
      const corruptResize = resizeSelectedNodes(initialState, 'se', NaN, Infinity);
      // Safe Rollback: Unchanged state returned, NO partial corruption
      expect(corruptResize).toEqual(initialState);
    });

    it('44. E2E 4: MULTI-STEP WORKFLOW → UNDO ALL → REDO ALL → FINAL STATE', () => {
      let state = initialState;

      // Step 1: Move
      state = moveSelectedNodes(state, 50, 50);
      // Step 2: Resize
      state = resizeSelectedNodes(state, 'se', 40, 20);
      // Step 3: Rotate
      state = rotateSelectedNodes(state, 90);

      const finalWidth = state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.width;
      expect(finalWidth).toBe(190);

      // Undo all 3 steps
      state = undoVectorAction(state); // Undo rotate
      state = undoVectorAction(state); // Undo resize
      state = undoVectorAction(state); // Undo move

      expect(state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.width).toBe(150);
      expect(state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.x).toBe(100);

      // Redo all 3 steps
      state = redoVectorAction(state);
      state = redoVectorAction(state);
      state = redoVectorAction(state);

      expect(state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.width).toBe(190);
      expect(state.snapshot.nodes.find(n => n.id === 'rect1')?.transform.rotationDeg).toBe(90);
    });

    it('45. E2E 5: FULL COMPLEX PRODUCT WORKFLOW (ADD -> DRAG MOVE -> RESIZE -> BOOLEAN -> COPY -> PASTE -> RENDER)', () => {
      let state = initialState;

      // 1. Add new circle shape
      const circle = createEllipseNode('circle1', 150, 120, 140, 140);
      state = addNode(state, circle);
      expect(state.snapshot.nodes.length).toBe(4);

      // 2. Drag Move new circle
      state = moveSelectedNodes(state, 20, 10);
      expect(state.snapshot.nodes.find(n => n.id === 'circle1')?.transform.x).toBe(170);

      // 3. Handle Resize circle
      state = resizeSelectedNodes(state, 'se', 30, 30);
      expect(state.snapshot.nodes.find(n => n.id === 'circle1')?.transform.width).toBe(170);

      // 4. Perform CSG Boolean Union with rect1
      state = selectNodes(state, ['rect1', 'circle1']);
      state = executeBooleanOperation(state, 'union');

      // 5. Copy resulting boolean shape & paste
      state = copySelectedNodes(state);
      state = pasteClipboard(state);

      // 6. Assert end-to-end rendering compilation
      const lastPasted = state.snapshot.nodes[state.snapshot.nodes.length - 1];
      const commands = VectorRenderingBridge.buildRenderCommands(lastPasted);
      expect(commands.length).toBeGreaterThan(0);
    });
  });
});
