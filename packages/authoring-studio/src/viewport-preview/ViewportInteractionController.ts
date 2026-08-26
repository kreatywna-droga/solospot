/**
 * ViewportInteractionController.ts — Sprint S31 Unified Viewport & Interaction Controller
 *
 * Orchestrates live preview layout resolution (S29), viewport breakpoint switching (S28),
 * pan/zoom camera controls (S21), canvas hover & selection (S22), and bidirectional sync
 * with S30 Layout Inspector field changes.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { HistoryStack } from '../../../builder-core/src/HistoryStack';
import type { BreakpointId } from '../responsive/ResponsiveValueModel';
import { BreakpointRegistry } from '../responsive/BreakpointRegistry';
import { resolveLayout, type ResolvedLayoutTree } from '../layout/LayoutTree';
import {
  readLayoutInspectorState,
  applyFieldChange,
  type LayoutInspectorState,
} from '../layout-inspector/LayoutInspectorController';

import {
  createViewportPreviewState,
  type ViewportPreviewState,
} from './ViewportPreviewModel';
import {
  switchBreakpoint,
  setZoomLevel,
  zoomIn,
  zoomOut,
  resetZoom,
  fitToContainer,
  panBy,
} from './ViewportPreviewController';
import {
  adaptLayoutToCanvas,
  type CanvasRenderableNode,
} from './ViewportCanvasAdapter';
import {
  createViewportSelectionState,
  setHoveredNode,
  selectNode,
  clearSelection,
  type ViewportSelectionState,
} from './ViewportSelectionModel';

export interface ViewportPreviewContext {
  readonly doc: BuilderDocument;
  readonly history: HistoryStack<BuilderDocument>;
  readonly previewState: ViewportPreviewState;
  readonly selectionState: ViewportSelectionState;
  readonly resolvedTree: ResolvedLayoutTree;
  readonly renderableNodes: ReadonlyArray<CanvasRenderableNode>;
}

export function createViewportPreviewContext(params: {
  doc: BuilderDocument;
  history: HistoryStack<BuilderDocument>;
  breakpointId?: BreakpointId;
  containerWidthPx?: number;
  containerHeightPx?: number;
  zoomLevel?: number;
  registry?: BreakpointRegistry;
}): ViewportPreviewContext {
  const registry = params.registry ?? new BreakpointRegistry();
  const previewState = createViewportPreviewState({
    breakpointId: params.breakpointId ?? 'desktop',
    containerWidthPx: params.containerWidthPx,
    containerHeightPx: params.containerHeightPx,
    zoomLevel: params.zoomLevel,
    registry,
  });

  const resolvedTree = resolveLayout(params.doc, previewState.viewportWidthPx);
  const selectionState = createViewportSelectionState();
  const renderableNodes = adaptLayoutToCanvas(
    resolvedTree,
    previewState,
    selectionState.s22SelectionState,
    selectionState.hoveredNodeId
  );

  return {
    doc: params.doc,
    history: params.history,
    previewState,
    selectionState: createViewportSelectionState({
      s22SelectionState: selectionState.s22SelectionState,
      hoveredNodeId: selectionState.hoveredNodeId,
      renderableNodes,
    }),
    resolvedTree,
    renderableNodes,
  };
}

export function switchViewportBreakpoint(
  ctx: ViewportPreviewContext,
  targetBreakpointId: BreakpointId,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewContext {
  const nextPreviewState = switchBreakpoint(ctx.previewState, targetBreakpointId, registry);
  const nextResolvedTree = resolveLayout(ctx.doc, nextPreviewState.viewportWidthPx);
  const renderableNodes = adaptLayoutToCanvas(
    nextResolvedTree,
    nextPreviewState,
    ctx.selectionState.s22SelectionState,
    ctx.selectionState.hoveredNodeId
  );

  return {
    ...ctx,
    previewState: nextPreviewState,
    resolvedTree: nextResolvedTree,
    renderableNodes,
    selectionState: createViewportSelectionState({
      s22SelectionState: ctx.selectionState.s22SelectionState,
      hoveredNodeId: ctx.selectionState.hoveredNodeId,
      renderableNodes,
    }),
  };
}

export function setViewportZoom(
  ctx: ViewportPreviewContext,
  zoomLevel: number,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewContext {
  const nextPreviewState = setZoomLevel(ctx.previewState, zoomLevel, registry);
  const renderableNodes = adaptLayoutToCanvas(
    ctx.resolvedTree,
    nextPreviewState,
    ctx.selectionState.s22SelectionState,
    ctx.selectionState.hoveredNodeId
  );

  return {
    ...ctx,
    previewState: nextPreviewState,
    renderableNodes,
    selectionState: createViewportSelectionState({
      s22SelectionState: ctx.selectionState.s22SelectionState,
      hoveredNodeId: ctx.selectionState.hoveredNodeId,
      renderableNodes,
    }),
  };
}

export function panViewport(
  ctx: ViewportPreviewContext,
  dx: number,
  dy: number,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewContext {
  const nextPreviewState = panBy(ctx.previewState, dx, dy, registry);
  const renderableNodes = adaptLayoutToCanvas(
    ctx.resolvedTree,
    nextPreviewState,
    ctx.selectionState.s22SelectionState,
    ctx.selectionState.hoveredNodeId
  );

  return {
    ...ctx,
    previewState: nextPreviewState,
    renderableNodes,
    selectionState: createViewportSelectionState({
      s22SelectionState: ctx.selectionState.s22SelectionState,
      hoveredNodeId: ctx.selectionState.hoveredNodeId,
      renderableNodes,
    }),
  };
}

export function hoverCanvasNode(
  ctx: ViewportPreviewContext,
  nodeId: string | null
): ViewportPreviewContext {
  const nextSelectionState = setHoveredNode(ctx.selectionState, nodeId, ctx.renderableNodes);
  const renderableNodes = adaptLayoutToCanvas(
    ctx.resolvedTree,
    ctx.previewState,
    nextSelectionState.s22SelectionState,
    nodeId
  );

  return {
    ...ctx,
    renderableNodes,
    selectionState: nextSelectionState,
  };
}

export function selectCanvasNode(
  ctx: ViewportPreviewContext,
  nodeId: string,
  isMultiSelect: boolean = false
): ViewportPreviewContext {
  const nextSelectionState = selectNode(
    ctx.selectionState,
    nodeId,
    isMultiSelect,
    ctx.renderableNodes
  );
  const renderableNodes = adaptLayoutToCanvas(
    ctx.resolvedTree,
    ctx.previewState,
    nextSelectionState.s22SelectionState,
    ctx.selectionState.hoveredNodeId
  );

  return {
    ...ctx,
    renderableNodes,
    selectionState: nextSelectionState,
  };
}

export function clearCanvasSelection(ctx: ViewportPreviewContext): ViewportPreviewContext {
  const nextSelectionState = clearSelection(ctx.selectionState, ctx.renderableNodes);
  const renderableNodes = adaptLayoutToCanvas(
    ctx.resolvedTree,
    ctx.previewState,
    nextSelectionState.s22SelectionState,
    ctx.selectionState.hoveredNodeId
  );

  return {
    ...ctx,
    renderableNodes,
    selectionState: nextSelectionState,
  };
}

export function getInspectorStateForSelection(
  ctx: ViewportPreviewContext
): LayoutInspectorState | undefined {
  const selectedId = ctx.selectionState.s22SelectionState.primarySelectedId;
  if (!selectedId) {
    return undefined;
  }
  return readLayoutInspectorState(ctx.doc, selectedId, ctx.previewState.activeBreakpointId);
}

export function editLayoutFieldAndRefresh(
  ctx: ViewportPreviewContext,
  fieldId: string,
  value: unknown
): ViewportPreviewContext {
  const selectedId = ctx.selectionState.s22SelectionState.primarySelectedId;
  if (!selectedId) {
    return ctx;
  }

  const res = applyFieldChange({
    doc: ctx.doc,
    history: ctx.history,
    nodeId: selectedId,
    fieldId,
    value,
    breakpointId: ctx.previewState.activeBreakpointId,
  });

  if (!res.success) {
    return ctx;
  }

  const nextResolvedTree = resolveLayout(res.doc, ctx.previewState.viewportWidthPx);
  const renderableNodes = adaptLayoutToCanvas(
    nextResolvedTree,
    ctx.previewState,
    ctx.selectionState.s22SelectionState,
    ctx.selectionState.hoveredNodeId
  );

  return {
    ...ctx,
    doc: res.doc,
    history: res.history,
    resolvedTree: nextResolvedTree,
    renderableNodes,
    selectionState: createViewportSelectionState({
      s22SelectionState: ctx.selectionState.s22SelectionState,
      hoveredNodeId: ctx.selectionState.hoveredNodeId,
      renderableNodes,
    }),
  };
}
