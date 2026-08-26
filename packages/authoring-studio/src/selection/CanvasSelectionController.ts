/**
 * CanvasSelectionController.ts — Sprint S23 Canvas Selection UX Controller
 *
 * Pure headless controller orchestrating selection interaction:
 * - marquee selection (drag box selection in world space)
 * - additive selection (Shift-click to append node)
 * - subtractive selection (Alt/Cmd-click to remove node)
 * - selection persistence across interactions
 * - select all / deselect all
 * - group selection / ungroup selection
 *
 * Delegates directly to SelectionManager (S22) and LayerOperationsEngine (S19).
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Scene, SceneGraphModel, SceneLayerNode } from '../scene/SceneGraphModel';
import { LayerOperationsEngine } from '../scene/LayerOperationsEngine';
import { createSelectionState, MarqueeBox, SelectionState } from './SelectionModel';
import { SelectionManager } from './SelectionManager';

export class CanvasSelectionController {
  /**
   * Starts a marquee drag operation from an initial world coordinate.
   */
  public static startMarquee(startWorldPoint: { x: number; y: number }): SelectionState {
    const marquee: MarqueeBox = {
      startX: startWorldPoint.x,
      startY: startWorldPoint.y,
      currentX: startWorldPoint.x,
      currentY: startWorldPoint.y,
    };

    return createSelectionState({
      selectedNodeIds: [],
      primarySelectedId: null,
      mode: 'marquee',
      marquee,
    });
  }

  /**
   * Updates marquee drag box with current world coordinate and calculates intersecting scene layer nodes.
   */
  public static updateMarquee(
    state: SelectionState,
    scene: Scene,
    currentWorldPoint: { x: number; y: number }
  ): SelectionState {
    if (!state.marquee) return state;

    const updatedMarquee: MarqueeBox = {
      ...state.marquee,
      currentX: currentWorldPoint.x,
      currentY: currentWorldPoint.y,
    };

    return SelectionManager.selectByMarquee(scene, updatedMarquee);
  }

  /**
   * Finalizes marquee selection by clearing marquee drag box while preserving selected node IDs.
   */
  public static endMarquee(state: SelectionState): SelectionState {
    return createSelectionState({
      selectedNodeIds: [...state.selectedNodeIds],
      primarySelectedId: state.primarySelectedId,
      mode: state.selectedNodeIds.length > 1 ? 'multi' : state.selectedNodeIds.length === 1 ? 'single' : 'none',
      marquee: null,
    });
  }

  /**
   * Additively selects a node ID (appends to selection if not present).
   */
  public static additiveSelect(state: SelectionState, nodeId: string): SelectionState {
    if (state.selectedNodeIds.includes(nodeId)) {
      return state;
    }
    const newIds = [...state.selectedNodeIds, nodeId];
    return createSelectionState({
      selectedNodeIds: newIds,
      primarySelectedId: state.primarySelectedId ?? nodeId,
      mode: newIds.length === 1 ? 'single' : 'multi',
      marquee: null,
    });
  }

  /**
   * Subtractively selects a node ID (removes from selection if present).
   */
  public static subtractiveSelect(state: SelectionState, nodeId: string): SelectionState {
    if (!state.selectedNodeIds.includes(nodeId)) {
      return state;
    }
    const newIds = state.selectedNodeIds.filter((id) => id !== nodeId);
    if (newIds.length === 0) {
      return this.deselectAll();
    }
    return createSelectionState({
      selectedNodeIds: newIds,
      primarySelectedId: state.primarySelectedId === nodeId ? newIds[0] : state.primarySelectedId,
      mode: newIds.length === 1 ? 'single' : 'multi',
      marquee: null,
    });
  }

  /**
   * Selects all visible and unlocked layer nodes in the scene.
   */
  public static selectAll(scene: Scene): SelectionState {
    const visibleIds: string[] = [];

    const traverse = (nodes: readonly SceneLayerNode[]) => {
      for (const node of nodes) {
        if (node.visible && !node.locked) {
          visibleIds.push(node.id);
        }
      }
    };

    traverse(Object.values(scene.layers ?? {}));

    if (visibleIds.length === 0) {
      return this.deselectAll();
    }

    return createSelectionState({
      selectedNodeIds: visibleIds,
      primarySelectedId: visibleIds[0],
      mode: visibleIds.length === 1 ? 'single' : 'multi',
      marquee: null,
    });
  }

  /**
   * Clears selection completely.
   */
  public static deselectAll(): SelectionState {
    return SelectionManager.clearSelection();
  }

  /**
   * Groups selected layers into a new LayerGroup.
   * Returns updated Scene and updated SelectionState selecting the newly created group.
   */
  public static groupSelection(
    scene: Scene,
    selectedNodeIds: ReadonlyArray<string>
  ): { scene: Scene; selection: SelectionState } {
    if (selectedNodeIds.length < 2) {
      return { scene, selection: createSelectionState({ selectedNodeIds, primarySelectedId: selectedNodeIds[0] ?? null }) };
    }

    const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const updatedScene = LayerOperationsEngine.groupLayers(
      scene,
      groupId,
      [...selectedNodeIds],
      `Group_${groupId}`
    );

    const selection = createSelectionState({
      selectedNodeIds: [groupId],
      primarySelectedId: groupId,
      mode: 'single',
      marquee: null,
    });

    return { scene: updatedScene, selection };
  }

  /**
   * Ungroups selected LayerGroup nodes in the scene.
   * Returns updated Scene and updated SelectionState selecting promoted child nodes.
   */
  public static ungroupSelection(
    scene: Scene,
    selectedNodeIds: ReadonlyArray<string>
  ): { scene: Scene; selection: SelectionState } {
    let updatedScene = scene;
    const promotedNodeIds: string[] = [];

    for (const id of selectedNodeIds) {
      const node = SceneGraphModel.findLayerNode(updatedScene, id);
      if (node && node.type === 'group' && node.childIds) {
        for (const childId of node.childIds) {
          promotedNodeIds.push(childId);
        }
        updatedScene = LayerOperationsEngine.ungroupLayers(updatedScene, id);
      }
    }

    const selection = promotedNodeIds.length > 0
      ? createSelectionState({
          selectedNodeIds: promotedNodeIds,
          primarySelectedId: promotedNodeIds[0],
          mode: promotedNodeIds.length === 1 ? 'single' : 'multi',
        })
      : SelectionManager.clearSelection();

    return { scene: updatedScene, selection };
  }
}
