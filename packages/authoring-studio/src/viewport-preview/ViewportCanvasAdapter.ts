/**
 * ViewportCanvasAdapter.ts — Sprint S31 Layout Tree to Canvas Adapter
 *
 * Adapts S29 ResolvedLayoutTrees into flat, scaled CanvasRenderableNodes
 * with viewportRects calculated from effectiveScale and panPosition.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { LayoutRect } from '../layout/LayoutModel';
import type { ResolvedLayoutNode, ResolvedLayoutTree } from '../layout/LayoutTree';
import type { SelectionState } from '../selection/SelectionModel';
import type { ViewportPreviewState } from './ViewportPreviewModel';

export interface CanvasRenderableNode {
  readonly nodeId: string;
  readonly type: string;
  readonly label: string;
  readonly layoutRect: LayoutRect;
  readonly viewportRect: LayoutRect; // Rect in scaled viewport coordinates
  readonly isSelected: boolean;
  readonly isPrimarySelected: boolean;
  readonly isHovered: boolean;
}

/**
 * Adapts a resolved layout tree for the current page into a array of renderable nodes.
 */
export function adaptLayoutToCanvas(
  resolvedTree: ResolvedLayoutTree,
  previewState: ViewportPreviewState,
  selectionState: SelectionState,
  hoveredNodeId: string | null = null,
  pageIndex: number = 0
): CanvasRenderableNode[] {
  const page = resolvedTree.pages[pageIndex];
  if (!page) {
    return [];
  }

  const renderables: CanvasRenderableNode[] = [];
  const { effectiveScale, panPosition } = previewState;

  const traverseNode = (node: ResolvedLayoutNode) => {
    const id = node.nodeId ?? (node.id as string);
    const type = node.nodeType ?? (node.type as string);
    const isSelected = selectionState.selectedNodeIds.includes(id);
    const isPrimarySelected = selectionState.primarySelectedId === id;
    const isHovered = hoveredNodeId === id;

    // Calculate viewport-space bounding rect
    const viewportRect: LayoutRect = {
      x: Math.round((node.rect.x * effectiveScale + panPosition.x) * 100) / 100,
      y: Math.round((node.rect.y * effectiveScale + panPosition.y) * 100) / 100,
      width: Math.round(node.rect.width * effectiveScale * 100) / 100,
      height: Math.round(node.rect.height * effectiveScale * 100) / 100,
    };

    renderables.push({
      nodeId: id,
      type,
      label: node.label,
      layoutRect: node.rect,
      viewportRect,
      isSelected,
      isPrimarySelected,
      isHovered,
    });

    for (const child of node.children) {
      traverseNode(child);
    }
  };

  for (const section of page.sections) {
    traverseNode(section);
  }

  return renderables;
}
