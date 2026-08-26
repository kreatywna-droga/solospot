/**
 * SelectionManager.ts — Sprint S22 Selection State Manager
 *
 * Pure headless state manager for selection operations:
 * - single select
 * - multi select (toggle/add/remove)
 * - clear selection
 * - marquee box intersection testing with scene graph layer bounds
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Scene, SceneLayerNode } from '../scene/SceneGraphModel';
import { createSelectionState, MarqueeBox, SelectionState } from './SelectionModel';

export class SelectionManager {
  /**
   * Selects a single layer node ID.
   */
  public static selectSingle(state: SelectionState, nodeId: string): SelectionState {
    return createSelectionState({
      selectedNodeIds: [nodeId],
      primarySelectedId: nodeId,
      mode: 'single',
      activeHandle: null,
      marquee: null,
    });
  }

  /**
   * Toggles selection state of a layer node ID (for multi-selection with Shift/Cmd).
   */
  public static toggleSelect(state: SelectionState, nodeId: string): SelectionState {
    const isSelected = state.selectedNodeIds.includes(nodeId);
    let newIds: string[];

    if (isSelected) {
      newIds = state.selectedNodeIds.filter((id) => id !== nodeId);
    } else {
      newIds = [...state.selectedNodeIds, nodeId];
    }

    if (newIds.length === 0) {
      return this.clearSelection();
    }

    return createSelectionState({
      selectedNodeIds: newIds,
      primarySelectedId: isSelected
        ? state.primarySelectedId === nodeId
          ? newIds[0]
          : state.primarySelectedId
        : nodeId,
      mode: newIds.length === 1 ? 'single' : 'multi',
      activeHandle: null,
      marquee: null,
    });
  }

  /**
   * Clears selection completely.
   */
  public static clearSelection(): SelectionState {
    return createSelectionState({
      selectedNodeIds: [],
      primarySelectedId: null,
      mode: 'none',
      activeHandle: null,
      marquee: null,
    });
  }

  /**
   * Computes rectangular bounding box for a MarqueeBox.
   */
  public static getMarqueeRect(marquee: MarqueeBox): { x: number; y: number; width: number; height: number } {
    const minX = Math.min(marquee.startX, marquee.currentX);
    const minY = Math.min(marquee.startY, marquee.currentY);
    const width = Math.abs(marquee.currentX - marquee.startX);
    const height = Math.abs(marquee.currentY - marquee.startY);

    return { x: minX, y: minY, width, height };
  }

  /**
   * Tests if a layer node's bounds intersect with a marquee rectangle.
   */
  public static intersectsBounds(
    nodeBounds: { x: number; y: number; width: number; height: number },
    marqueeRect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      nodeBounds.x + nodeBounds.width < marqueeRect.x ||
      nodeBounds.x > marqueeRect.x + marqueeRect.width ||
      nodeBounds.y + nodeBounds.height < marqueeRect.y ||
      nodeBounds.y > marqueeRect.y + marqueeRect.height
    );
  }

  /**
   * Selects all scene graph layer nodes whose bounds intersect with the marquee box.
   */
  public static selectByMarquee(scene: Scene, marquee: MarqueeBox): SelectionState {
    const marqueeRect = this.getMarqueeRect(marquee);
    const intersectedIds: string[] = [];

    const traverse = (nodes: readonly SceneLayerNode[]) => {
      for (const node of nodes) {
        if (node.visible) {
          const worldBounds = {
            x: node.transform.x,
            y: node.transform.y,
            width: node.transform.width,
            height: node.transform.height,
          };

          if (this.intersectsBounds(worldBounds, marqueeRect)) {
            intersectedIds.push(node.id);
          }
        }
      }
    };

    traverse(Object.values(scene.layers ?? {}));

    if (intersectedIds.length === 0) {
      return createSelectionState({
        selectedNodeIds: [],
        primarySelectedId: null,
        mode: 'marquee',
        marquee,
      });
    }

    return createSelectionState({
      selectedNodeIds: intersectedIds,
      primarySelectedId: intersectedIds[0],
      mode: intersectedIds.length === 1 ? 'single' : 'multi',
      marquee,
    });
  }
}
