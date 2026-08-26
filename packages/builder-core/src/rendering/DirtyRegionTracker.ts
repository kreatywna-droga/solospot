/**
 * DirtyRegionTracker.ts — Sprint S10 Rendering Pipeline
 *
 * Computes dirty region bounding boxes between consecutive frames.
 * Pure logic. NO DOM dependencies.
 */

import { RenderBoundingBox, RenderNodeState, combineBoundingBoxes } from './RenderFrame';

export class DirtyRegionTracker {
  public static computeDirtyRegions(
    currentNodes: ReadonlyMap<string, RenderNodeState>,
    previousNodes?: ReadonlyMap<string, RenderNodeState>
  ): RenderBoundingBox[] {
    if (!previousNodes || previousNodes.size === 0) {
      // Full frame dirty
      const allBoxes = Array.from(currentNodes.values()).map((n) => n.bounds);
      const boundingBox = combineBoundingBoxes(allBoxes);
      return boundingBox.width > 0 && boundingBox.height > 0 ? [boundingBox] : [];
    }

    const dirtyRects: RenderBoundingBox[] = [];

    // Check current nodes against previous
    for (const [nodeId, curr] of currentNodes.entries()) {
      const prev = previousNodes.get(nodeId);

      if (!prev) {
        // Newly added node -> dirty current bounds
        if (curr.visible) {
          dirtyRects.push(curr.bounds);
        }
      } else if (
        curr.isDirty ||
        curr.opacity !== prev.opacity ||
        curr.visible !== prev.visible ||
        curr.bounds.x !== prev.bounds.x ||
        curr.bounds.y !== prev.bounds.y ||
        curr.bounds.width !== prev.bounds.width ||
        curr.bounds.height !== prev.bounds.height
      ) {
        // Changed node -> dirty union of old and new bounds
        if (prev.visible) dirtyRects.push(prev.bounds);
        if (curr.visible) dirtyRects.push(curr.bounds);
      }
    }

    // Check removed nodes
    for (const [nodeId, prev] of previousNodes.entries()) {
      if (!currentNodes.has(nodeId) && prev.visible) {
        dirtyRects.push(prev.bounds);
      }
    }

    return dirtyRects;
  }
}
