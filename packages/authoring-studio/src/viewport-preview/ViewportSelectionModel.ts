/**
 * ViewportSelectionModel.ts — Sprint S31 Selection & Hover Integration Model
 *
 * Integrates canvas hover state, node selection, and highlight bounding boxes
 * by bridging with S22 SelectionState and SelectionManager.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { LayoutRect } from '../layout/LayoutModel';
import {
  createSelectionState,
  DEFAULT_SELECTION_STATE,
  type SelectionState,
} from '../selection/SelectionModel';
import { SelectionManager } from '../selection/SelectionManager';
import type { CanvasRenderableNode } from './ViewportCanvasAdapter';

export interface ViewportHighlightRect {
  readonly nodeId: string;
  readonly viewportRect: LayoutRect;
  readonly isPrimary: boolean;
}

export interface ViewportSelectionState {
  readonly hoveredNodeId: string | null;
  readonly s22SelectionState: SelectionState;
  readonly highlightRects: ReadonlyArray<ViewportHighlightRect>;
}

export function createViewportSelectionState(params?: {
  hoveredNodeId?: string | null;
  s22SelectionState?: SelectionState;
  renderableNodes?: ReadonlyArray<CanvasRenderableNode>;
}): ViewportSelectionState {
  const hoveredNodeId = params?.hoveredNodeId ?? null;
  const s22SelectionState = params?.s22SelectionState ?? DEFAULT_SELECTION_STATE;
  const renderableNodes = params?.renderableNodes ?? [];

  const highlightRects = calculateHighlightRects(s22SelectionState, renderableNodes);

  return {
    hoveredNodeId,
    s22SelectionState,
    highlightRects,
  };
}

export function setHoveredNode(
  state: ViewportSelectionState,
  hoveredNodeId: string | null,
  renderableNodes: ReadonlyArray<CanvasRenderableNode> = []
): ViewportSelectionState {
  return createViewportSelectionState({
    hoveredNodeId,
    s22SelectionState: state.s22SelectionState,
    renderableNodes,
  });
}

export function selectNode(
  state: ViewportSelectionState,
  nodeId: string,
  isMultiSelect: boolean = false,
  renderableNodes: ReadonlyArray<CanvasRenderableNode> = []
): ViewportSelectionState {
  const nextS22 = isMultiSelect
    ? SelectionManager.toggleSelect(state.s22SelectionState, nodeId)
    : SelectionManager.selectSingle(state.s22SelectionState, nodeId);

  return createViewportSelectionState({
    hoveredNodeId: state.hoveredNodeId,
    s22SelectionState: nextS22,
    renderableNodes,
  });
}

export function clearSelection(
  state: ViewportSelectionState,
  renderableNodes: ReadonlyArray<CanvasRenderableNode> = []
): ViewportSelectionState {
  const nextS22 = SelectionManager.clearSelection();
  return createViewportSelectionState({
    hoveredNodeId: state.hoveredNodeId,
    s22SelectionState: nextS22,
    renderableNodes,
  });
}

export function calculateHighlightRects(
  s22State: SelectionState,
  renderableNodes: ReadonlyArray<CanvasRenderableNode>
): ReadonlyArray<ViewportHighlightRect> {
  const highlights: ViewportHighlightRect[] = [];
  for (const node of renderableNodes) {
    if (s22State.selectedNodeIds.includes(node.nodeId)) {
      highlights.push({
        nodeId: node.nodeId,
        viewportRect: node.viewportRect,
        isPrimary: s22State.primarySelectedId === node.nodeId,
      });
    }
  }
  return highlights;
}
