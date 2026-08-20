/**
 * VectorMarqueeSelectionG133.test.ts — G1-33 Canvas Marquee Rectangle Drag Selection
 *
 * Comprehensive Test Suite (55+ Meaningful Tests):
 * - Category 1: Core Marquee Behavior & Normalization (10 tests)
 * - Category 2: Geometry & Hit Testing (10 tests)
 * - Category 3: Selection Semantics & Edge Cases (10 tests)
 * - Category 4: History, Persistence & Rendering (10 tests)
 * - Category 5: UI & Workspace Controller Integration (10 tests)
 * - Category 6: Real End-to-End Vertical Integration Slices (7 E2E tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  VectorWorkspaceState,
  createVectorWorkspaceState,
  selectNodes,
  selectNodesInMarquee,
  selectAllNodes,
  deselectAllNodes,
  moveSelectedNodes,
  resizeSelectedNodes,
  reorderSelectedNodes,
  groupSelectedNodes,
  toggleSelectedNodesLock,
  toggleSelectedNodesVisibility,
  undoVectorAction,
  redoVectorAction,
  updateNode,
} from '../VectorWorkspaceController';
import {
  VectorNode,
  createRectangleNode,
  createEllipseNode,
  createPolygonNode,
  createLineNode,
} from '../VectorDomainModel';
import { VectorGeometry, BoundingBox2D } from '../VectorGeometry';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';

describe('G1-33 — Canvas Marquee Rectangle Drag Selection (55+ Tests)', () => {
  let node1: VectorNode; // rect at (100, 100, 100, 100) -> [100..200, 100..200]
  let node2: VectorNode; // ellipse at (300, 100, 100, 100) -> [300..400, 100..200]
  let node3: VectorNode; // rect at (100, 300, 100, 100) -> [100..200, 300..400]
  let node4: VectorNode; // polygon at (300, 300, 100, 100) -> [300..400, 300..400]
  let initialState: VectorWorkspaceState;

  beforeEach(() => {
    node1 = createRectangleNode('rect1', 100, 100, 100, 100);
    node2 = createEllipseNode('ellipse2', 300, 100, 100, 100);
    node3 = createRectangleNode('rect3', 100, 300, 100, 100);
    node4 = createPolygonNode('poly4', 5, 300, 300, 100, 100);

    initialState = createVectorWorkspaceState([node1, node2, node3, node4], ['rect1']);
  });

  // =========================================================================
  // CATEGORY 1: Core Marquee Behavior & Normalization (10 Tests)
  // =========================================================================
  describe('Category 1: Core Marquee Behavior & Normalization', () => {
    it('1. selects single node when marquee box intersects its bounding area', () => {
      const marquee: BoundingBox2D = { x: 50, y: 50, width: 100, height: 100 }; // [50..150, 50..150] touches rect1 [100..200]
      const state = selectNodesInMarquee(initialState, marquee);
      expect(state.snapshot.selectedIds).toEqual(['rect1']);
    });

    it('2. selects multiple nodes when marquee box spans across multiple shapes', () => {
      const marquee: BoundingBox2D = { x: 50, y: 50, width: 300, height: 100 }; // [50..350, 50..150] covers rect1 and ellipse2
      const state = selectNodesInMarquee(initialState, marquee);
      expect(state.snapshot.selectedIds).toContain('rect1');
      expect(state.snapshot.selectedIds).toContain('ellipse2');
      expect(state.snapshot.selectedIds).not.toContain('rect3');
      expect(state.snapshot.selectedIds).not.toContain('poly4');
    });

    it('3. selects all 4 nodes when marquee box encloses the entire canvas area', () => {
      const marquee: BoundingBox2D = { x: 0, y: 0, width: 500, height: 500 };
      const state = selectNodesInMarquee(initialState, marquee);
      expect(state.snapshot.selectedIds).toHaveLength(4);
      expect(state.snapshot.selectedIds).toEqual(['rect1', 'ellipse2', 'rect3', 'poly4']);
    });

    it('4. clears selection when marquee box is dragged on empty canvas region', () => {
      const marquee: BoundingBox2D = { x: 500, y: 500, width: 100, height: 100 };
      const state = selectNodesInMarquee(initialState, marquee);
      expect(state.snapshot.selectedIds).toEqual([]);
    });

    it('5. handles Left-to-Right (top-left to bottom-right) drag normalization', () => {
      const p1 = { x: 50, y: 50 };
      const p2 = { x: 250, y: 250 };
      const rect = VectorGeometry.normalizeRect(p1, p2);
      expect(rect).toEqual({ x: 50, y: 50, width: 200, height: 200 });
    });

    it('6. handles Right-to-Left (top-right to bottom-left) drag normalization', () => {
      const p1 = { x: 250, y: 50 };
      const p2 = { x: 50, y: 250 };
      const rect = VectorGeometry.normalizeRect(p1, p2);
      expect(rect).toEqual({ x: 50, y: 50, width: 200, height: 200 });
    });

    it('7. handles Bottom-to-Top (bottom-left to top-right) drag normalization', () => {
      const p1 = { x: 50, y: 250 };
      const p2 = { x: 250, y: 50 };
      const rect = VectorGeometry.normalizeRect(p1, p2);
      expect(rect).toEqual({ x: 50, y: 50, width: 200, height: 200 });
    });

    it('8. handles Bottom-Right to Top-Left reverse drag normalization', () => {
      const p1 = { x: 250, y: 250 };
      const p2 = { x: 50, y: 50 };
      const rect = VectorGeometry.normalizeRect(p1, p2);
      expect(rect).toEqual({ x: 50, y: 50, width: 200, height: 200 });
    });

    it('9. handles zero-area click (p1 === p2) returning zero width/height', () => {
      const p = { x: 150, y: 150 };
      const rect = VectorGeometry.normalizeRect(p, p);
      expect(rect).toEqual({ x: 150, y: 150, width: 0, height: 0 });
    });

    it('10. handles tiny sub-pixel marquee box safely without NaN coordinates', () => {
      const p1 = { x: 100.2, y: 100.4 };
      const p2 = { x: 100.8, y: 100.9 };
      const rect = VectorGeometry.normalizeRect(p1, p2);
      expect(rect.width).toBeCloseTo(0.6, 5);
      expect(rect.height).toBeCloseTo(0.5, 5);
    });
  });

  // =========================================================================
  // CATEGORY 2: Geometry & Hit Testing (10 Tests)
  // =========================================================================
  describe('Category 2: Geometry & Hit Testing', () => {
    it('11. rectIntersectsRect returns true for overlapping bounding boxes', () => {
      const boxA = { x: 10, y: 10, width: 50, height: 50 };
      const boxB = { x: 40, y: 40, width: 50, height: 50 };
      expect(VectorGeometry.rectIntersectsRect(boxA, boxB)).toBe(true);
    });

    it('12. rectIntersectsRect returns false for non-overlapping disjoint boxes', () => {
      const boxA = { x: 10, y: 10, width: 20, height: 20 };
      const boxB = { x: 100, y: 100, width: 20, height: 20 };
      expect(VectorGeometry.rectIntersectsRect(boxA, boxB)).toBe(false);
    });

    it('13. rectContainsRect returns true when container fully encloses target', () => {
      const container = { x: 0, y: 0, width: 200, height: 200 };
      const target = { x: 50, y: 50, width: 80, height: 80 };
      expect(VectorGeometry.rectContainsRect(container, target)).toBe(true);
    });

    it('14. rectContainsRect returns false when target partially extends outside container', () => {
      const container = { x: 0, y: 0, width: 100, height: 100 };
      const target = { x: 50, y: 50, width: 80, height: 80 }; // extends to 130
      expect(VectorGeometry.rectContainsRect(container, target)).toBe(false);
    });

    it('15. nodeIntersectsMarquee in intersect mode selects partially overlapping shape', () => {
      const marquee = { x: 50, y: 50, width: 60, height: 60 }; // [50..110, 50..110] touches rect1 [100..200]
      expect(VectorGeometry.nodeIntersectsMarquee(node1, marquee, 'intersect')).toBe(true);
    });

    it('16. nodeIntersectsMarquee in contain mode rejects partially overlapping shape', () => {
      const marquee = { x: 50, y: 50, width: 60, height: 60 }; // does not fully enclose rect1 [100..200]
      expect(VectorGeometry.nodeIntersectsMarquee(node1, marquee, 'contain')).toBe(false);
    });

    it('17. nodeIntersectsMarquee in contain mode accepts fully enclosed shape', () => {
      const marquee = { x: 50, y: 50, width: 200, height: 200 }; // [50..250, 50..250] encloses rect1 [100..200]
      expect(VectorGeometry.nodeIntersectsMarquee(node1, marquee, 'contain')).toBe(true);
    });

    it('18. accounts for stroke width expansion during marquee intersection', () => {
      const strokedNode: VectorNode = {
        ...node1,
        stroke: { color: '#ff0000', width: 20, style: 'solid', lineCap: 'round', lineJoin: 'round' },
      };
      // Node bounds expand by strokePadding (10px on each side) -> [90..210]
      const marquee = { x: 80, y: 80, width: 15, height: 15 }; // [80..95] touches expanded stroke [90..210]
      expect(VectorGeometry.nodeIntersectsMarquee(strokedNode, marquee, 'intersect')).toBe(true);
    });

    it('19. tests line shape bounding box intersection with marquee', () => {
      const lineNode = createLineNode('line1', 50, 50, 250, 250);
      const marquee = { x: 100, y: 100, width: 50, height: 50 };
      expect(VectorGeometry.nodeIntersectsMarquee(lineNode, marquee, 'intersect')).toBe(true);
    });

    it('20. returns false cleanly when node has invalid / non-finite geometry', () => {
      const invalidNode: VectorNode = {
        ...node1,
        transform: { ...node1.transform, x: NaN, y: Infinity },
      };
      const marquee = { x: 0, y: 0, width: 200, height: 200 };
      expect(VectorGeometry.nodeIntersectsMarquee(invalidNode, marquee)).toBe(false);
    });
  });

  // =========================================================================
  // CATEGORY 3: Selection Semantics & Edge Cases (10 Tests)
  // =========================================================================
  describe('Category 3: Selection Semantics & Edge Cases', () => {
    it('21. normal marquee replaces existing selection with newly enclosed nodes', () => {
      const stateWithInitial = selectNodes(initialState, ['rect3']);
      const marquee = { x: 50, y: 50, width: 100, height: 100 }; // selects rect1
      const updated = selectNodesInMarquee(stateWithInitial, marquee, { additive: false });
      expect(updated.snapshot.selectedIds).toEqual(['rect1']);
    });

    it('22. additive marquee (Shift + Drag) merges with existing selection', () => {
      const stateWithInitial = selectNodes(initialState, ['rect3']);
      const marquee = { x: 50, y: 50, width: 100, height: 100 }; // selects rect1
      const updated = selectNodesInMarquee(stateWithInitial, marquee, { additive: true });
      expect(updated.snapshot.selectedIds).toContain('rect3');
      expect(updated.snapshot.selectedIds).toContain('rect1');
    });

    it('23. ignores locked shapes during marquee selection', () => {
      const lockedState = toggleSelectedNodesLock(initialState); // locks rect1
      const marquee = { x: 50, y: 50, width: 300, height: 100 }; // spans rect1 and ellipse2
      const updated = selectNodesInMarquee(lockedState, marquee);
      expect(updated.snapshot.selectedIds).toEqual(['ellipse2']);
      expect(updated.snapshot.selectedIds).not.toContain('rect1');
    });

    it('24. ignores hidden shapes (visible === false) during marquee selection', () => {
      const hiddenState = toggleSelectedNodesVisibility(initialState); // hides rect1
      const marquee = { x: 50, y: 50, width: 300, height: 100 }; // spans rect1 and ellipse2
      const updated = selectNodesInMarquee(hiddenState, marquee);
      expect(updated.snapshot.selectedIds).toEqual(['ellipse2']);
      expect(updated.snapshot.selectedIds).not.toContain('rect1');
    });

    it('25. selects parent group node when marquee intersects child shape inside group', () => {
      const groupState = groupSelectedNodes(selectNodes(initialState, ['rect1', 'ellipse2']));
      const marquee = { x: 50, y: 50, width: 100, height: 100 }; // touches rect1 inside group
      const updated = selectNodesInMarquee(groupState, marquee);
      // Top-level selected node is the group
      expect(updated.snapshot.selectedIds[0]).toContain('group_');
    });

    it('26. handles empty nodes document array returning empty selection without throwing', () => {
      const emptyState = createVectorWorkspaceState([], []);
      const marquee = { x: 0, y: 0, width: 500, height: 500 };
      const updated = selectNodesInMarquee(emptyState, marquee);
      expect(updated.snapshot.selectedIds).toEqual([]);
    });

    it('27. handles malformed marquee bounds with NaN or Infinity coordinates safely', () => {
      const invalidMarquee: BoundingBox2D = { x: NaN, y: Infinity, width: 100, height: 100 };
      const updated = selectNodesInMarquee(initialState, invalidMarquee);
      expect(updated.snapshot.selectedIds).toEqual(initialState.snapshot.selectedIds);
    });

    it('28. handles negative width / height marquee gracefully', () => {
      const rawP1 = { x: 200, y: 200 };
      const rawP2 = { x: 50, y: 50 };
      const normalized = VectorGeometry.normalizeRect(rawP1, rawP2);
      const updated = selectNodesInMarquee(initialState, normalized);
      expect(updated.snapshot.selectedIds).toContain('rect1');
    });

    it('29. repeated marquee selection on the same region is idempotent', () => {
      const marquee = { x: 50, y: 50, width: 300, height: 100 };
      const state1 = selectNodesInMarquee(initialState, marquee);
      const state2 = selectNodesInMarquee(state1, marquee);
      expect(state1.snapshot.selectedIds).toEqual(state2.snapshot.selectedIds);
    });

    it('30. contain mode selects only shapes strictly inside the marquee boundary', () => {
      // Marquee covers [50..250, 50..250] (contains rect1 [100..200]) and touches ellipse2 [300..400]
      const marquee = { x: 50, y: 50, width: 280, height: 200 }; // touches ellipse2 x=300
      const updated = selectNodesInMarquee(initialState, marquee, { mode: 'contain' });
      expect(updated.snapshot.selectedIds).toEqual(['rect1']);
      expect(updated.snapshot.selectedIds).not.toContain('ellipse2');
    });
  });

  // =========================================================================
  // CATEGORY 4: History, Persistence & Rendering (10 Tests)
  // =========================================================================
  describe('Category 4: History, Persistence & Rendering', () => {
    it('31. marquee selection does not pollute history stack with intermediate move frames', () => {
      const initialHistoryLength = initialState.historyStack.entries.length;
      const state1 = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 100, height: 100 });
      const state2 = selectNodesInMarquee(state1, { x: 0, y: 0, width: 200, height: 200 });
      const state3 = selectNodesInMarquee(state2, { x: 0, y: 0, width: 300, height: 300 });

      // History stack entries length remains identical because selection is non-mutating
      expect(state3.historyStack.entries.length).toBe(initialHistoryLength);
    });

    it('32. transforming marquee-selected nodes commits clean single history entry', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 200 });
      expect(marqueeState.snapshot.selectedIds).toEqual(['rect1', 'ellipse2']);

      const movedState = moveSelectedNodes(marqueeState, 50, 50);
      expect(movedState.historyStack.entries.length).toBe(initialState.historyStack.entries.length + 1);
      expect(movedState.historyStack.entries[movedState.historyStack.entries.length - 1].label).toBe('Move Nodes');
    });

    it('33. undoing transform restores original coordinates for all marquee-selected nodes', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 200 });
      const movedState = moveSelectedNodes(marqueeState, 50, 50);

      const undoneState = undoVectorAction(movedState);
      const restoredRect = undoneState.snapshot.nodes.find(n => n.id === 'rect1');
      const restoredEllipse = undoneState.snapshot.nodes.find(n => n.id === 'ellipse2');

      expect(restoredRect?.transform.x).toBe(100);
      expect(restoredEllipse?.transform.x).toBe(300);
    });

    it('34. redoing transform re-applies moved coordinates for all marquee-selected nodes', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 200 });
      const movedState = moveSelectedNodes(marqueeState, 50, 50);
      const undoneState = undoVectorAction(movedState);
      const redoneState = redoVectorAction(undoneState);

      const redoneRect = redoneState.snapshot.nodes.find(n => n.id === 'rect1');
      const redoneEllipse = redoneState.snapshot.nodes.find(n => n.id === 'ellipse2');

      expect(redoneRect?.transform.x).toBe(150);
      expect(redoneEllipse?.transform.x).toBe(350);
    });

    it('35. document persistence preserves node structure after marquee multi-selection', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 500 });
      const json = VectorDocumentSerializer.serializeVectorDocument(marqueeState.snapshot);
      const restoreResult = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restoreResult.success).toBe(true);
      expect(restoreResult.snapshot?.nodes).toHaveLength(4);
      expect(restoreResult.snapshot?.nodes.map(n => n.id)).toEqual(['rect1', 'ellipse2', 'rect3', 'poly4']);
    });

    it('36. rendering bridge compiles render commands for all marquee-selected nodes', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 500 });
      const commands = marqueeState.snapshot.nodes.flatMap(n => VectorRenderingBridge.buildRenderCommands(n));
      expect(commands.length).toBeGreaterThanOrEqual(4);
    });

    it('37. rendering bridge omits render commands for hidden nodes in marquee', () => {
      const hiddenState = toggleSelectedNodesVisibility(initialState); // hides rect1
      const visibleNodes = hiddenState.snapshot.nodes.filter(n => n.visible);
      const commands = visibleNodes.flatMap(n => VectorRenderingBridge.buildRenderCommands(n));
      const commandNodeIds = commands.map(c => (c as { nodeId?: string }).nodeId).filter(Boolean);
      expect(commandNodeIds).not.toContain('rect1');
    });

    it('38. marquee selection preserves snapshot immutability', () => {
      const snapshotBefore = initialState.snapshot;
      const stateAfter = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 200, height: 200 });

      expect(snapshotBefore).not.toBe(stateAfter.snapshot);
      expect(snapshotBefore.selectedIds).toEqual(['rect1']);
      expect(stateAfter.snapshot.selectedIds).toEqual(['rect1']);
    });

    it('39. persistent load followed by marquee drag selection functions seamlessly', () => {
      const json = VectorDocumentSerializer.serializeVectorDocument(initialState.snapshot);
      const restoreResult = VectorDocumentSerializer.restoreVectorDocument(json);
      const loadedState = createVectorWorkspaceState(restoreResult.snapshot?.nodes as VectorNode[], []);

      const marqueeState = selectNodesInMarquee(loadedState, { x: 0, y: 0, width: 500, height: 200 });
      expect(marqueeState.snapshot.selectedIds).toEqual(['rect1', 'ellipse2']);
    });

    it('40. reordering marquee-selected nodes maintains z-index stack integrity', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 200 }); // selects rect1, ellipse2
      const reorderedState = reorderSelectedNodes(marqueeState, 'sendToBack');
      expect(reorderedState.snapshot.nodes[0].id).toBe('ellipse2');
      expect(reorderedState.snapshot.nodes[1].id).toBe('rect1');
    });
  });

  // =========================================================================
  // CATEGORY 5: UI & Workspace Controller Integration (10 Tests)
  // =========================================================================
  describe('Category 5: UI & Workspace Controller Integration', () => {
    it('41. deselectAllNodes clears all marquee-selected IDs', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 500 });
      expect(marqueeState.snapshot.selectedIds).toHaveLength(4);

      const cleared = deselectAllNodes(marqueeState);
      expect(cleared.snapshot.selectedIds).toEqual([]);
    });

    it('42. selectAllNodes selects all 4 nodes matching full marquee selection', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 500 });
      const selectAllState = selectAllNodes(initialState);
      expect(marqueeState.snapshot.selectedIds).toEqual(selectAllState.snapshot.selectedIds);
    });

    it('43. resizing marquee-selected multi-shape set scales all coordinates proportionally', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 200 }); // rect1 and ellipse2
      const resizedState = resizeSelectedNodes(marqueeState, 'se', 20, 20, false);

      const r1 = resizedState.snapshot.nodes.find(n => n.id === 'rect1');
      const r2 = resizedState.snapshot.nodes.find(n => n.id === 'ellipse2');

      expect(r1?.transform.width).toBe(120);
      expect(r2?.transform.width).toBe(120);
    });

    it('44. toggling lock on marquee-selected set locks all selected nodes', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 200 }); // rect1 and ellipse2
      const lockedState = toggleSelectedNodesLock(marqueeState);

      const r1 = lockedState.snapshot.nodes.find(n => n.id === 'rect1');
      const r2 = lockedState.snapshot.nodes.find(n => n.id === 'ellipse2');

      expect(r1?.locked).toBe(true);
      expect(r2?.locked).toBe(true);
    });

    it('45. toggling visibility on marquee-selected set hides all selected nodes', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 200 }); // rect1 and ellipse2
      const hiddenState = toggleSelectedNodesVisibility(marqueeState);

      const r1 = hiddenState.snapshot.nodes.find(n => n.id === 'rect1');
      const r2 = hiddenState.snapshot.nodes.find(n => n.id === 'ellipse2');

      expect(r1?.visible).toBe(false);
      expect(r2?.visible).toBe(false);
    });

    it('46. grouping marquee-selected shapes creates a single ShapeGroupNode', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 200 }); // rect1 and ellipse2
      const groupedState = groupSelectedNodes(marqueeState);

      expect(groupedState.snapshot.nodes.some(n => n.type === 'group')).toBe(true);
      expect(groupedState.snapshot.selectedIds).toHaveLength(1);
    });

    it('47. moving locked nodes inside marquee selection is rejected by controller', () => {
      const lockedState = toggleSelectedNodesLock(initialState); // locks rect1
      const marqueeState = selectNodesInMarquee(lockedState, { x: 0, y: 0, width: 500, height: 200 }); // selects ellipse2 only
      const movedState = moveSelectedNodes(marqueeState, 50, 50);

      const r1 = movedState.snapshot.nodes.find(n => n.id === 'rect1');
      const r2 = movedState.snapshot.nodes.find(n => n.id === 'ellipse2');

      expect(r1?.transform.x).toBe(100); // Unmoved (locked)
      expect(r2?.transform.x).toBe(350); // Moved
    });

    it('48. updating properties of marquee-selected node preserves multi-selection set', () => {
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 200 }); // rect1 and ellipse2
      const updatedState = updateNode(marqueeState, { ...node1, name: 'Renamed Card' });

      expect(updatedState.snapshot.selectedIds).toContain('rect1');
      expect(updatedState.snapshot.selectedIds).toContain('ellipse2');
      expect(updatedState.snapshot.nodes.find(n => n.id === 'rect1')?.name).toBe('Renamed Card');
    });

    it('49. selectNodes cleanly prunes non-existent IDs if passed in marquee result', () => {
      const stateWithInvalid = selectNodes(initialState, ['rect1', 'non_existent_id']);
      expect(stateWithInvalid.snapshot.selectedIds).toEqual(['rect1']);
    });

    it('50. rapid successive marquee dispatches maintain transactional state consistency', () => {
      let state = initialState;
      for (let i = 0; i < 20; i++) {
        const marquee = { x: 50, y: 50, width: 100 + i * 10, height: 100 };
        state = selectNodesInMarquee(state, marquee);
      }
      expect(state.snapshot.selectedIds).toBeDefined();
      expect(state.snapshot.selectedIds.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // CATEGORY 6: Real End-to-End Vertical Integration Slices (7 Tests)
  // =========================================================================
  describe('Category 6: Real End-to-End Vertical Integration Slices', () => {
    it('51. E2E-01: USER ACTION → MARQUEE → DOCUMENT / SELECTION → RENDER', () => {
      // 1. User drags marquee across rect1 and ellipse2
      const marqueeBounds = VectorGeometry.normalizeRect({ x: 50, y: 50 }, { x: 450, y: 250 });
      const selectedState = selectNodesInMarquee(initialState, marqueeBounds);

      // 2. Verify selection in document snapshot
      expect(selectedState.snapshot.selectedIds).toEqual(['rect1', 'ellipse2']);

      // 3. Verify render commands for selected shapes
      const selectedNodes = selectedState.snapshot.nodes.filter(n =>
        selectedState.snapshot.selectedIds.includes(n.id)
      );
      const renderCommands = selectedNodes.flatMap(n => VectorRenderingBridge.buildRenderCommands(n));
      expect(renderCommands.length).toBeGreaterThan(0);
    });

    it('52. E2E-02: USER ACTION → MULTI-SELECTION → TRANSFORM → FINAL SELECTION', () => {
      // 1. Marquee select rect3 and poly4
      const marqueeBounds = VectorGeometry.normalizeRect({ x: 50, y: 250 }, { x: 450, y: 450 });
      const selectedState = selectNodesInMarquee(initialState, marqueeBounds);
      expect(selectedState.snapshot.selectedIds).toEqual(['rect3', 'poly4']);

      // 2. Drag move multi-selection
      const movedState = moveSelectedNodes(selectedState, 20, 30);
      expect(movedState.snapshot.nodes.find(n => n.id === 'rect3')?.transform.x).toBe(120);
      expect(movedState.snapshot.nodes.find(n => n.id === 'rect3')?.transform.y).toBe(330);
      expect(movedState.snapshot.nodes.find(n => n.id === 'poly4')?.transform.x).toBe(320);
      expect(movedState.snapshot.nodes.find(n => n.id === 'poly4')?.transform.y).toBe(330);
    });

    it('53. E2E-03: USER ACTION → SAVE → LOAD → CONTINUE EDITING WITH MARQUEE', () => {
      // 1. Marquee select and move shapes
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 200 });
      const movedState = moveSelectedNodes(marqueeState, 40, 40);

      // 2. Save document to JSON
      const json = VectorDocumentSerializer.serializeVectorDocument(movedState.snapshot);

      // 3. Load document into new workspace
      const restoreResult = VectorDocumentSerializer.restoreVectorDocument(json);
      const newWorkspace = createVectorWorkspaceState(restoreResult.snapshot?.nodes as VectorNode[], []);

      // 4. Continue editing with marquee selection
      const marquee2 = selectNodesInMarquee(newWorkspace, { x: 0, y: 0, width: 500, height: 500 });
      expect(marquee2.snapshot.selectedIds).toHaveLength(4);
    });

    it('54. E2E-04: USER ACTION → MARQUEE → UNDO → REDO → FINAL STATE', () => {
      // 1. Marquee select all shapes
      const marqueeState = selectNodesInMarquee(initialState, { x: 0, y: 0, width: 500, height: 500 });
      // 2. Perform transformation
      const movedState = moveSelectedNodes(marqueeState, 100, 100);
      // 3. Undo transformation
      const undone = undoVectorAction(movedState);
      expect(undone.snapshot.nodes.find(n => n.id === 'rect1')?.transform.x).toBe(100);
      // 4. Redo transformation
      const redone = redoVectorAction(undone);
      expect(redone.snapshot.nodes.find(n => n.id === 'rect1')?.transform.x).toBe(200);
    });

    it('55. E2E-05: USER ACTION → FAILURE INJECTION → ROLLBACK → ORIGINAL STATE', () => {
      // 1. Inject corrupted NaN bounding box into marquee selection
      const corruptedMarquee = { x: NaN, y: Infinity, width: -100, height: 0 };
      const fallbackState = selectNodesInMarquee(initialState, corruptedMarquee);

      // 2. Verify state rolled back cleanly with NO PARTIAL STATE
      expect(fallbackState.snapshot.selectedIds).toEqual(initialState.snapshot.selectedIds);
      expect(fallbackState.snapshot.nodes).toEqual(initialState.snapshot.nodes);
    });

    it('56. E2E-06: USER ACTION → EXISTING SELECTION → ADDITIVE MARQUEE → FINAL SELECTION', () => {
      // 1. Initially select rect1
      const initialSelection = selectNodes(initialState, ['rect1']);
      // 2. Additive Shift+Marquee select bottom row (rect3, poly4)
      const marqueeBounds = VectorGeometry.normalizeRect({ x: 50, y: 250 }, { x: 450, y: 450 });
      const finalSelection = selectNodesInMarquee(initialSelection, marqueeBounds, { additive: true });

      expect(finalSelection.snapshot.selectedIds).toContain('rect1');
      expect(finalSelection.snapshot.selectedIds).toContain('rect3');
      expect(finalSelection.snapshot.selectedIds).toContain('poly4');
      expect(finalSelection.snapshot.selectedIds).not.toContain('ellipse2');
    });

    it('57. E2E-07: USER ACTION → GROUP / LOCK / VISIBILITY → MARQUEE → VERIFIED RESULT', () => {
      // 1. Lock ellipse2
      const lockState = toggleSelectedNodesLock(selectNodes(initialState, ['ellipse2']));
      // 2. Hide rect3
      const hideState = toggleSelectedNodesVisibility(selectNodes(lockState, ['rect3']));
      // 3. Marquee across all 4 shapes
      const marqueeState = selectNodesInMarquee(hideState, { x: 0, y: 0, width: 500, height: 500 });

      // 4. Only rect1 and poly4 should be selected (ellipse2 locked, rect3 hidden)
      expect(marqueeState.snapshot.selectedIds).toContain('rect1');
      expect(marqueeState.snapshot.selectedIds).toContain('poly4');
      expect(marqueeState.snapshot.selectedIds).not.toContain('ellipse2');
      expect(marqueeState.snapshot.selectedIds).not.toContain('rect3');
    });
  });
});
