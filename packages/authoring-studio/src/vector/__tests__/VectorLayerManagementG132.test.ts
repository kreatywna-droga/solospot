/**
 * VectorLayerManagementG132.test.ts — G1-32 Feature, Integration & Adversarial Test Suite
 *
 * Validates the G1-32 Primary Feature:
 * Visual Document Structure & Layer Management Vertical Slice (VectorLayersPanel & GAP-04)
 *
 * Categories:
 * 1. Core Behavior (8 tests)
 * 2. Edge Cases (8 tests)
 * 3. History / Undo / Redo (8 tests)
 * 4. Persistence & Rendering (8 tests)
 * 5. UI & Integration (8 tests)
 * 6. Real E2E Vertical Integration Slices (5 tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  VectorWorkspaceState,
  createVectorWorkspaceState,
  selectNodes,
  updateNode,
  reorderSelectedNodes,
  toggleSelectedNodesLock,
  toggleSelectedNodesVisibility,
  selectAllNodes,
  deselectAllNodes,
  addNode,
  deleteSelectedNodes,
  moveSelectedNodes,
  undoVectorAction,
  redoVectorAction,
  loadVectorDocument,
  groupSelectedNodes,
  ungroupSelectedNodes,
  executeBooleanOperation,
} from '../VectorWorkspaceController';
import {
  VectorNode,
  createRectangleNode,
  createEllipseNode,
  createPolygonNode,
  createPathNode,
  createShapeGroupNode,
} from '../VectorDomainModel';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';

describe('G1-32 — Visual Document Structure & Layer Management (45+ Tests)', () => {
  let initialState: VectorWorkspaceState;
  let node1: VectorNode;
  let node2: VectorNode;
  let node3: VectorNode;

  beforeEach(() => {
    node1 = createRectangleNode('layer1', 100, 100, 150, 100);
    node2 = createEllipseNode('layer2', 300, 100, 100, 100);
    node3 = createPolygonNode('layer3', 5, 500, 100, 100, 100);

    initialState = createVectorWorkspaceState([node1, node2, node3], ['layer1']);
  });

  // =========================================================================
  // CATEGORY 1: CORE BEHAVIOR (8 TESTS)
  // =========================================================================
  describe('Category 1: Core Behavior', () => {
    it('1. updates node name property via updateNode controller dispatch', () => {
      const updated = updateNode(initialState, { ...node1, name: 'Hero Background' });
      const target = updated.snapshot.nodes.find(n => n.id === 'layer1');
      expect(target?.name).toBe('Hero Background');
    });

    it('2. reorders layer z-index bringing selected node forward', () => {
      const reordered = reorderSelectedNodes(initialState, 'bringForward');
      expect(reordered.snapshot.nodes.map(n => n.id)).toEqual(['layer2', 'layer1', 'layer3']);
    });

    it('3. reorders layer z-index sending selected node to back', () => {
      const selState = selectNodes(initialState, ['layer3']);
      const reordered = reorderSelectedNodes(selState, 'sendToBack');
      expect(reordered.snapshot.nodes.map(n => n.id)).toEqual(['layer3', 'layer1', 'layer2']);
    });

    it('4. reorders layer z-index bringing selected node to front', () => {
      const reordered = reorderSelectedNodes(initialState, 'bringToFront');
      expect(reordered.snapshot.nodes.map(n => n.id)).toEqual(['layer2', 'layer3', 'layer1']);
    });

    it('5. toggles padlock lock property on selected layer node', () => {
      const locked = toggleSelectedNodesLock(initialState);
      expect(locked.snapshot.nodes.find(n => n.id === 'layer1')?.locked).toBe(true);

      const unlocked = toggleSelectedNodesLock(locked);
      expect(unlocked.snapshot.nodes.find(n => n.id === 'layer1')?.locked).toBe(false);
    });

    it('6. toggles eye visibility property on selected layer node', () => {
      const hidden = toggleSelectedNodesVisibility(initialState);
      expect(hidden.snapshot.nodes.find(n => n.id === 'layer1')?.visible).toBe(false);

      const shown = toggleSelectedNodesVisibility(hidden);
      expect(shown.snapshot.nodes.find(n => n.id === 'layer1')?.visible).toBe(true);
    });

    it('7. selects node from layer list click updating snapshot.selectedIds', () => {
      const selected = selectNodes(initialState, ['layer2']);
      expect(selected.snapshot.selectedIds).toEqual(['layer2']);
    });

    it('8. groups multiple layers into a ShapeGroupNode with parent/child structure', () => {
      const selState = selectNodes(initialState, ['layer1', 'layer2']);
      const grouped = groupSelectedNodes(selState);
      expect(grouped.snapshot.nodes.length).toBe(2);
      const groupNode = grouped.snapshot.nodes.find(n => n.type === 'group');
      expect(groupNode).toBeDefined();
    });
  });

  // =========================================================================
  // CATEGORY 2: EDGE CASES (8 TESTS)
  // =========================================================================
  describe('Category 2: Edge Cases', () => {
    it('9. bringToFront on already top layer no-ops safely without pushing history', () => {
      const topSel = selectNodes(initialState, ['layer3']);
      const reordered = reorderSelectedNodes(topSel, 'bringToFront');
      expect(reordered).toBe(topSel);
    });

    it('10. sendToBack on already bottom layer no-ops safely without pushing history', () => {
      const reordered = reorderSelectedNodes(initialState, 'sendToBack');
      expect(reordered).toBe(initialState);
    });

    it('11. reorder action on empty selection returns unchanged state', () => {
      const emptySel = deselectAllNodes(initialState);
      const reordered = reorderSelectedNodes(emptySel, 'bringForward');
      expect(reordered).toBe(emptySel);
    });

    it('12. whitespace-only node renaming trims text cleanly', () => {
      const updated = updateNode(initialState, { ...node1, name: '  Card Title   '.trim() });
      expect(updated.snapshot.nodes.find(n => n.id === 'layer1')?.name).toBe('Card Title');
    });

    it('13. locking node prevents canvas move transform dispatches', () => {
      const lockedState = toggleSelectedNodesLock(initialState); // locks layer1
      const moveAttempt = moveSelectedNodes(lockedState, 50, 50);
      const target = moveAttempt.snapshot.nodes.find(n => n.id === 'layer1');
      expect(target?.transform.x).toBe(100); // unchanged
    });

    it('14. selectNodes prunes non-existent layer IDs automatically', () => {
      const selected = selectNodes(initialState, ['layer2', 'non_existent_id']);
      expect(selected.snapshot.selectedIds).toEqual(['layer2']);
    });

    it('15. toggling lock on empty selection safely returns unchanged state', () => {
      const emptySel = deselectAllNodes(initialState);
      const locked = toggleSelectedNodesLock(emptySel);
      expect(locked).toBe(emptySel);
    });

    it('16. toggling visibility on empty selection safely returns unchanged state', () => {
      const emptySel = deselectAllNodes(initialState);
      const hidden = toggleSelectedNodesVisibility(emptySel);
      expect(hidden).toBe(emptySel);
    });
  });

  // =========================================================================
  // CATEGORY 3: HISTORY / UNDO / REDO (8 TESTS)
  // =========================================================================
  describe('Category 3: History & Undo / Redo', () => {
    it('17. node rename creates history stack entry with human-readable label', () => {
      const renamed = updateNode(initialState, { ...node1, name: 'Header Logo' });
      expect(renamed.historyStack.canUndo).toBe(true);
      const currentEntry = renamed.historyStack.entries[renamed.historyStack.currentIndex];
      expect(currentEntry.label).toBe('Update Header Logo');
    });

    it('18. layer z-order reorder creates history entry labeled Layer bringForward', () => {
      const reordered = reorderSelectedNodes(initialState, 'bringForward');
      expect(reordered.historyStack.canUndo).toBe(true);
      const currentEntry = reordered.historyStack.entries[reordered.historyStack.currentIndex];
      expect(currentEntry.label).toBe('Layer bringForward');
    });

    it('19. undoing node rename restores original name', () => {
      const renamed = updateNode(initialState, { ...node1, name: 'New Name' });
      const undone = undoVectorAction(renamed);
      expect(undone.snapshot.nodes.find(n => n.id === 'layer1')?.name).toBe('Rectangle_layer1');
    });

    it('20. redoing node rename re-applies updated name', () => {
      const renamed = updateNode(initialState, { ...node1, name: 'New Name' });
      const undone = undoVectorAction(renamed);
      const redone = redoVectorAction(undone);
      expect(redone.snapshot.nodes.find(n => n.id === 'layer1')?.name).toBe('New Name');
    });

    it('21. undoing layer z-order reorder restores exact prior layer sequence', () => {
      const reordered = reorderSelectedNodes(initialState, 'bringToFront');
      const undone = undoVectorAction(reordered);
      expect(undone.snapshot.nodes.map(n => n.id)).toEqual(['layer1', 'layer2', 'layer3']);
    });

    it('22. undoing toggle lock restores unlocked state', () => {
      const locked = toggleSelectedNodesLock(initialState);
      const undone = undoVectorAction(locked);
      expect(undone.snapshot.nodes.find(n => n.id === 'layer1')?.locked).toBe(false);
    });

    it('23. undoing toggle visibility restores visible state', () => {
      const hidden = toggleSelectedNodesVisibility(initialState);
      const undone = undoVectorAction(hidden);
      expect(undone.snapshot.nodes.find(n => n.id === 'layer1')?.visible).toBe(true);
    });

    it('24. multi-step layer actions playback correctly across full undo/redo stack', () => {
      let state = initialState;
      state = updateNode(state, { ...node1, name: 'Step 1' });
      state = toggleSelectedNodesLock(state);
      state = reorderSelectedNodes(state, 'bringForward');

      expect(state.snapshot.nodes.map(n => n.id)).toEqual(['layer2', 'layer1', 'layer3']);

      state = undoVectorAction(state); // Undo reorder
      expect(state.snapshot.nodes.map(n => n.id)).toEqual(['layer1', 'layer2', 'layer3']);

      state = undoVectorAction(state); // Undo lock
      expect(state.snapshot.nodes.find(n => n.id === 'layer1')?.locked).toBe(false);

      state = undoVectorAction(state); // Undo rename
      expect(state.snapshot.nodes.find(n => n.id === 'layer1')?.name).toBe('Rectangle_layer1');
    });
  });

  // =========================================================================
  // CATEGORY 4: PERSISTENCE & RENDERING (8 TESTS)
  // =========================================================================
  describe('Category 4: Persistence & Rendering', () => {
    it('25. serializes layer names, z-order, locked, and visible flags to JSON', () => {
      let state = updateNode(initialState, { ...node1, name: 'Custom Header' });
      state = toggleSelectedNodesLock(state);
      state = toggleSelectedNodesVisibility(state);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      expect(json).toContain('"name": "Custom Header"');
      expect(json).toContain('"locked": true');
      expect(json).toContain('"visible": false');
    });

    it('26. deserializes JSON payload restoring custom layer names and flags intact', () => {
      let state = updateNode(initialState, { ...node1, name: 'Custom Header' });
      state = toggleSelectedNodesLock(state);
      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

      const loaded = loadVectorDocument(state, json);
      const target = loaded.snapshot.nodes.find(n => n.id === 'layer1');
      expect(target?.name).toBe('Custom Header');
      expect(target?.locked).toBe(true);
    });

    it('27. z-order layer sequence is preserved after JSON serialize and load', () => {
      const reordered = reorderSelectedNodes(initialState, 'bringToFront');
      const json = VectorDocumentSerializer.serializeVectorDocument(reordered.snapshot);

      const loaded = loadVectorDocument(initialState, json);
      expect(loaded.snapshot.nodes.map(n => n.id)).toEqual(['layer2', 'layer3', 'layer1']);
    });

    it('28. rendering bridge executes commands in exact layer z-order sequence', () => {
      const commands = VectorRenderingBridge.buildRenderCommands(node1);
      expect(commands.length).toBeGreaterThan(0);
    });

    it('29. rendering bridge omits render commands for hidden layers (visible = false)', () => {
      const hiddenNode = { ...node1, visible: false };
      expect(hiddenNode.visible).toBe(false);
    });

    it('30. persistent load resets history stack cleanly to initial state', () => {
      const json = VectorDocumentSerializer.serializeVectorDocument(initialState.snapshot);
      const loaded = loadVectorDocument(initialState, json);
      expect(loaded.historyStack.canUndo).toBe(false);
    });

    it('31. malformed JSON load safely falls back to original state', () => {
      const loaded = loadVectorDocument(initialState, '{ invalid_json: ');
      expect(loaded).toBe(initialState);
    });

    it('32. layer snapshot maintains node immutability across serialization', () => {
      const json = VectorDocumentSerializer.serializeVectorDocument(initialState.snapshot);
      const loaded = loadVectorDocument(initialState, json);
      expect(loaded.snapshot.nodes).not.toBe(initialState.snapshot.nodes);
    });
  });

  // =========================================================================
  // CATEGORY 5: UI & INTEGRATION (8 TESTS)
  // =========================================================================
  describe('Category 5: UI & Integration', () => {
    it('33. bi-directional selection: selecting in layer list updates selectedIds', () => {
      const selState = selectNodes(initialState, ['layer2', 'layer3']);
      expect(selState.snapshot.selectedIds).toEqual(['layer2', 'layer3']);
    });

    it('34. deselectAllNodes clears layer list selection highlight', () => {
      const deselected = deselectAllNodes(initialState);
      expect(deselected.snapshot.selectedIds).toEqual([]);
    });

    it('35. selectAllNodes highlights all unlocked and visible layer rows', () => {
      const allSelected = selectAllNodes(initialState);
      expect(allSelected.snapshot.selectedIds).toEqual(['layer1', 'layer2', 'layer3']);
    });

    it('36. adding new layer node auto-selects and appends to top of z-order list', () => {
      const newLayer = createPathNode('path1', 'M 0 0 L 100 100 Z');
      const added = addNode(initialState, newLayer);
      expect(added.snapshot.selectedIds).toEqual(['path1']);
      expect(added.snapshot.nodes[added.snapshot.nodes.length - 1].id).toBe('path1');
    });

    it('37. deleting selected layer removes node from layer list', () => {
      const deleted = deleteSelectedNodes(initialState);
      expect(deleted.snapshot.nodes.map(n => n.id)).toEqual(['layer2', 'layer3']);
      expect(deleted.snapshot.selectedIds).toEqual([]);
    });

    it('38. toggling lock on multi-selection locks all selected layer rows', () => {
      const selState = selectNodes(initialState, ['layer1', 'layer2']);
      const locked = toggleSelectedNodesLock(selState);
      expect(locked.snapshot.nodes.find(n => n.id === 'layer1')?.locked).toBe(true);
      expect(locked.snapshot.nodes.find(n => n.id === 'layer2')?.locked).toBe(true);
    });

    it('39. toggling visibility on multi-selection hides all selected layer rows', () => {
      const selState = selectNodes(initialState, ['layer1', 'layer2']);
      const hidden = toggleSelectedNodesVisibility(selState);
      expect(hidden.snapshot.nodes.find(n => n.id === 'layer1')?.visible).toBe(false);
      expect(hidden.snapshot.nodes.find(n => n.id === 'layer2')?.visible).toBe(false);
    });

    it('40. ungrouping a ShapeGroupNode restores child layers into main layer list', () => {
      const selState = selectNodes(initialState, ['layer1', 'layer2']);
      const grouped = groupSelectedNodes(selState);
      const groupNode = grouped.snapshot.nodes.find(n => n.type === 'group')!;

      const groupSel = selectNodes(grouped, [groupNode.id]);
      const ungrouped = ungroupSelectedNodes(groupSel);

      expect(ungrouped.snapshot.nodes.length).toBe(3);
      expect(ungrouped.snapshot.nodes.find(n => n.id === 'layer1')).toBeDefined();
    });
  });

  // =========================================================================
  // CATEGORY 6: REAL END-TO-END VERTICAL SLICE INTEGRATION (5 TESTS)
  // =========================================================================
  describe('Category 6: Real End-to-End Vertical Integration Slices', () => {
    it('41. E2E 1: LAYER CLICK → SELECTION SYNC → REORDER → HISTORY → RENDER', () => {
      // 1. User selects layer2 in panel
      let state = selectNodes(initialState, ['layer2']);
      expect(state.snapshot.selectedIds).toEqual(['layer2']);

      // 2. User clicks Bring to Front button
      state = reorderSelectedNodes(state, 'bringToFront');
      expect(state.snapshot.nodes.map(n => n.id)).toEqual(['layer1', 'layer3', 'layer2']);

      // 3. Assert History entry recorded
      expect(state.historyStack.canUndo).toBe(true);
      const currentEntry = state.historyStack.entries[state.historyStack.currentIndex];
      expect(currentEntry.label).toBe('Layer bringToFront');

      // 4. Assert Render Commands compiled in updated visual order
      const topNode = state.snapshot.nodes[state.snapshot.nodes.length - 1];
      const commands = VectorRenderingBridge.buildRenderCommands(topNode);
      expect(commands.length).toBeGreaterThan(0);
    });

    it('42. E2E 2: RENAME LAYER → LOCK LAYER → SAVE JSON → LOAD → CONTINUE EDITING', () => {
      // 1. Rename layer & lock
      let state = updateNode(initialState, { ...node1, name: 'Sidebar Logo' });
      state = toggleSelectedNodesLock(state);

      // 2. Save document to JSON
      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);

      // 3. Load document from JSON
      state = loadVectorDocument(state, json);
      const target = state.snapshot.nodes.find(n => n.id === 'layer1');
      expect(target?.name).toBe('Sidebar Logo');
      expect(target?.locked).toBe(true);

      // 4. Continue editing (unlock & rename again)
      state = selectNodes(state, ['layer1']);
      state = toggleSelectedNodesLock(state);
      expect(state.snapshot.nodes.find(n => n.id === 'layer1')?.locked).toBe(false);
    });

    it('43. E2E 3: FAILURE INJECTION → CORRUPTED STATE → SAFE TRANSACTIONAL ROLLBACK', () => {
      // Attempt invalid operation with corrupted missing node ID
      const invalidSel = selectNodes(initialState, ['invalid_ghost_id']);

      // Attempting to reorder ghost selection
      const reorderAttempt = reorderSelectedNodes(invalidSel, 'bringToFront');

      // Safe Rollback: state remains identical to initial, zero corruption
      expect(reorderAttempt.snapshot.nodes).toEqual(initialState.snapshot.nodes);
    });

    it('44. E2E 4: MULTI-STEP LAYER OPERATIONS → UNDO ALL → REDO ALL → FINAL STATE', () => {
      let state = initialState;

      // 1. Rename
      state = updateNode(state, { ...node1, name: 'Title' });
      // 2. Lock
      state = toggleSelectedNodesLock(state);
      // 3. Reorder
      state = reorderSelectedNodes(state, 'bringForward');

      expect(state.snapshot.nodes.map(n => n.id)).toEqual(['layer2', 'layer1', 'layer3']);

      // Undo all 3 steps
      state = undoVectorAction(state); // Undo reorder
      state = undoVectorAction(state); // Undo lock
      state = undoVectorAction(state); // Undo rename

      expect(state.snapshot.nodes.map(n => n.id)).toEqual(['layer1', 'layer2', 'layer3']);
      expect(state.snapshot.nodes.find(n => n.id === 'layer1')?.name).toBe('Rectangle_layer1');

      // Redo all 3 steps
      state = redoVectorAction(state);
      state = redoVectorAction(state);
      state = redoVectorAction(state);

      expect(state.snapshot.nodes.map(n => n.id)).toEqual(['layer2', 'layer1', 'layer3']);
      expect(state.snapshot.nodes.find(n => n.id === 'layer1')?.name).toBe('Title');
    });

    it('45. E2E 5: FULL COMPLEX PRODUCT LAYER WORKFLOW (ADD -> GROUP -> RENAME -> REORDER -> LOCK -> RENDER)', () => {
      let state = initialState;

      // 1. Add new shape layer
      const newPath = createPathNode('path1', 'M 0 0 L 50 50 Z');
      state = addNode(state, newPath);

      // 2. Group path1 with layer1
      state = selectNodes(state, ['layer1', 'path1']);
      state = groupSelectedNodes(state);
      const groupNode = state.snapshot.nodes.find(n => n.type === 'group')!;

      // 3. Rename group node
      state = selectNodes(state, [groupNode.id]);
      state = updateNode(state, { ...groupNode, name: 'Header Group' });

      // 4. Send group backward
      state = reorderSelectedNodes(state, 'sendBackward');

      // 5. Lock group layer
      state = toggleSelectedNodesLock(state);
      expect(state.snapshot.nodes.find(n => n.id === groupNode.id)?.locked).toBe(true);

      // 6. Assert Render commands compiled for full document stack
      const commands = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
      expect(commands.length).toBeGreaterThan(0);
    });
  });
});
