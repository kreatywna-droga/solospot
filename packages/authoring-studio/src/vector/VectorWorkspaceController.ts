/**
 * VectorWorkspaceController.ts — Sprint S18 Vector Workspace Controller (ETAP 6 / G1-26)
 *
 * Implements a purely functional, headless Controller for the Vector Domain.
 * Manages the Document Tree, Selection, Node Operations, and Undo/Redo integration.
 *
 * All operations guarantee transaction integrity: in case of any runtime failure,
 * the input state is returned unharmed, preserving document and history stack.
 *
 * NO DOM, NO React, NO requestAnimationFrame.
 */

import { VectorNode, ShapeGroupNode, PathNode, VectorNodeType, VectorFill, VectorStroke } from './VectorDomainModel';
import { VectorBooleanEngine, BooleanOperation } from './VectorBooleanEngine';
import { VectorEditingEngine, LayerReorderAction, AlignmentType, DistributionType } from './VectorEditingEngine';
import { VectorDocumentSerializer } from './VectorDocumentSerializer';
import { VectorClipboardEngine, VectorClipboardPayload } from './VectorClipboardEngine';
import { ResizeHandle, VectorGeometry, BoundingBox2D, Point2D } from './VectorGeometry';
import { VectorPenEngine, PenDrawingSession } from './VectorPenEngine';
import { HistoryStack, createHistoryStack } from '../../../builder-core/src/HistoryStack';

import { VectorSnappingEngine, SnappingOptions, GuideLine, SnapResult } from './VectorSnappingEngine';

export interface VectorDocumentSnapshot {
  readonly nodes: ReadonlyArray<VectorNode>;
  readonly selectedIds: ReadonlyArray<string>;
}

export interface VectorWorkspaceState {
  readonly snapshot: VectorDocumentSnapshot;
  readonly historyStack: HistoryStack<VectorDocumentSnapshot>;
  readonly activeGuideLines?: ReadonlyArray<GuideLine>;
}

export function isEqualSnapshots(a: VectorDocumentSnapshot, b: VectorDocumentSnapshot): boolean {
  if (a === b) return true;
  if (a.nodes === b.nodes && a.selectedIds === b.selectedIds) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function createVectorWorkspaceState(
  initialNodes: VectorNode[] = [],
  initialSelectedIds: string[] = []
): VectorWorkspaceState {
  const snapshot: VectorDocumentSnapshot = {
    nodes: [...initialNodes],
    selectedIds: [...initialSelectedIds],
  };
  const historyStack = createHistoryStack<VectorDocumentSnapshot>(50).push(snapshot, 'Initial State');
  
  return { snapshot, historyStack };
}

export function selectNodes(state: VectorWorkspaceState, nodeIds: string[]): VectorWorkspaceState {
  // Validate: only select IDs that exist in the current document tree
  const existingIds = new Set(state.snapshot.nodes.map(n => n.id));
  const validIds = nodeIds.filter(id => existingIds.has(id));

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      selectedIds: validIds,
    },
  };
}

/**
 * Safely executes a boolean CSG operation across selected nodes.
 * Transaction safety: Any unhandled exception during CSG computation
 * causes a clean rollback (returning the unchanged state).
 */
export function executeBooleanOperation(
  state: VectorWorkspaceState,
  operation: BooleanOperation
): VectorWorkspaceState {
  try {
    const { nodes, selectedIds } = state.snapshot;
    
    if (selectedIds.length < 2) {
      // Boolean operation requires at least 2 nodes
      return state;
    }

    // Find selected nodes in order they appear in the tree
    const selectedNodes = nodes.filter((node) => selectedIds.includes(node.id));
    
    if (selectedNodes.length < 2) {
      // Missing nodes in document tree
      return state;
    }

    // Check for unsupported node types (like groups or lines which may fail in current engine)
    const isCompatible = selectedNodes.every(
      n => n.type === 'rectangle' || n.type === 'ellipse' || n.type === 'polygon' || n.type === 'path'
    );
    if (!isCompatible) {
      return state;
    }

    let resultNode = selectedNodes[0];
    for (let i = 1; i < selectedNodes.length; i++) {
      resultNode = VectorBooleanEngine.performOperation(operation, resultNode, selectedNodes[i]);
    }

    // Check for degenerate / empty geometry (e.g. non-overlapping intersect)
    if (resultNode.type === 'path' && (resultNode.d === '' || (resultNode.transform.width === 0 && resultNode.transform.height === 0))) {
      // Degenerate boolean result: do not insert empty ghost shape into tree
      return state;
    }

    // Replace original nodes with the resulting node.
    // Insert the result node at the position of the shallowest source node index.
    let minIndex = nodes.length;
    const filteredNodes: VectorNode[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      if (selectedIds.includes(nodes[i].id)) {
        if (i < minIndex) {
          minIndex = i;
        }
      } else {
        filteredNodes.push(nodes[i]);
      }
    }

    filteredNodes.splice(minIndex, 0, resultNode);

    const nextSnapshot: VectorDocumentSnapshot = {
      nodes: filteredNodes,
      selectedIds: [resultNode.id], // Automatically select the new resulting boolean node
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Boolean ${operation}`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    // Transaction Integrity: Safe rollback on unexpected CSG failure
    return state;
  }
}

/**
 * Updates a node in the document tree and records the change in HistoryStack.
 */
export function updateNode(
  state: VectorWorkspaceState,
  updatedNode: VectorNode
): VectorWorkspaceState {
  const existingIndex = state.snapshot.nodes.findIndex(n => n.id === updatedNode.id);
  if (existingIndex === -1) {
    return state; // Node not found in current tree
  }

  const nextNodes = state.snapshot.nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
  const nextSnapshot: VectorDocumentSnapshot = {
    ...state.snapshot,
    nodes: nextNodes,
  };

  const nextHistoryStack = state.historyStack.push(nextSnapshot, `Update ${updatedNode.name || updatedNode.id}`);

  return {
    snapshot: nextSnapshot,
    historyStack: nextHistoryStack,
  };
}

/**
 * Adds a new shape node to the workspace document and selects it.
 */
export function addNode(
  state: VectorWorkspaceState,
  newNode: VectorNode
): VectorWorkspaceState {
  const nextNodes = [...state.snapshot.nodes, newNode];
  const nextSnapshot: VectorDocumentSnapshot = {
    nodes: nextNodes,
    selectedIds: [newNode.id],
  };

  const nextHistoryStack = state.historyStack.push(nextSnapshot, `Add ${newNode.name || newNode.id}`);

  return {
    snapshot: nextSnapshot,
    historyStack: nextHistoryStack,
  };
}

/**
 * Deletes currently selected nodes from the workspace document.
 */
export function deleteSelectedNodes(
  state: VectorWorkspaceState
): VectorWorkspaceState {
  const { selectedIds, nodes } = state.snapshot;
  if (selectedIds.length === 0) return state;

  const nextNodes = nodes.filter(n => !selectedIds.includes(n.id));
  const nextSnapshot: VectorDocumentSnapshot = {
    nodes: nextNodes,
    selectedIds: [],
  };

  const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Delete Nodes');

  return {
    snapshot: nextSnapshot,
    historyStack: nextHistoryStack,
  };
}

export function undoVectorAction(state: VectorWorkspaceState): VectorWorkspaceState {
  const result = state.historyStack.undo();
  if (!result) return state; // Nothing to undo

  return {
    snapshot: result.state,
    historyStack: result.stack,
  };
}

export function redoVectorAction(state: VectorWorkspaceState): VectorWorkspaceState {
  const result = state.historyStack.redo();
  if (!result) return state; // Nothing to redo

  return {
    snapshot: result.state,
    historyStack: result.stack,
  };
}

/**
 * Reorders selected nodes in the layer stack (bringToFront, sendToBack, bringForward, sendBackward).
 */
export function reorderSelectedNodes(
  state: VectorWorkspaceState,
  action: LayerReorderAction
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
    if (selectedNodes.length === 0) return state;

    let nextNodes = [...nodes];
    for (const targetId of selectedIds) {
      nextNodes = VectorEditingEngine.reorderShapes(nextNodes, targetId, action);
    }

    const isSameOrder = nextNodes.every((n, idx) => n.id === nodes[idx].id);
    if (isSameOrder) return state;

    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Layer ${action}`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Sets explicit selection array. Does not mutate HistoryStack.
 */
export function setSelection(
  state: VectorWorkspaceState,
  ids: string[]
): VectorWorkspaceState {
  const validIds = Array.isArray(ids) ? ids.filter(id => typeof id === 'string' && state.snapshot.nodes.some(n => n.id === id)) : [];
  return {
    snapshot: {
      ...state.snapshot,
      selectedIds: validIds,
    },
    historyStack: state.historyStack,
    activeGuideLines: undefined,
  };
}

/**
 * Adds IDs to existing selection. Does not mutate HistoryStack.
 */
export function addToSelection(
  state: VectorWorkspaceState,
  ids: string[]
): VectorWorkspaceState {
  const validIds = Array.isArray(ids) ? ids.filter(id => typeof id === 'string' && state.snapshot.nodes.some(n => n.id === id)) : [];
  const currentSet = new Set(state.snapshot.selectedIds);
  validIds.forEach(id => currentSet.add(id));
  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      selectedIds: Array.from(currentSet),
    },
  };
}

/**
 * Removes IDs from current selection. Does not mutate HistoryStack.
 */
export function removeFromSelection(
  state: VectorWorkspaceState,
  ids: string[]
): VectorWorkspaceState {
  const removeSet = new Set(Array.isArray(ids) ? ids : []);
  const nextSelected = state.snapshot.selectedIds.filter(id => !removeSet.has(id));
  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      selectedIds: nextSelected,
    },
  };
}

/**
 * Toggles selection state of a single node ID.
 */
export function toggleSelection(
  state: VectorWorkspaceState,
  id: string
): VectorWorkspaceState {
  if (typeof id !== 'string' || !state.snapshot.nodes.some(n => n.id === id)) {
    return state;
  }
  const currentSet = new Set(state.snapshot.selectedIds);
  if (currentSet.has(id)) {
    currentSet.delete(id);
  } else {
    currentSet.add(id);
  }
  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      selectedIds: Array.from(currentSet),
    },
  };
}

/**
 * Clears document selection (sets selectedIds to []).
 */
export function clearSelection(
  state: VectorWorkspaceState
): VectorWorkspaceState {
  if (state.snapshot.selectedIds.length === 0) return state;
  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      selectedIds: [],
    },
  };
}

/**
 * Moves selected nodes by (dx, dy) in document space and commits HistoryStack transaction.
 */
export function moveSelectedNodes(
  state: VectorWorkspaceState,
  dx: number,
  dy: number
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const validDx = Number.isFinite(dx) ? dx : 0;
    const validDy = Number.isFinite(dy) ? dy : 0;
    if (validDx === 0 && validDy === 0) return state;

    const selectedSet = new Set(selectedIds);
    const nextNodes = nodes.map((node) => {
      if (selectedSet.has(node.id) && !node.locked) {
        return VectorEditingEngine.moveShape(node, validDx, validDy);
      }
      return node;
    });

    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    if (isEqualSnapshots(state.snapshot, nextSnapshot)) {
      return state;
    }

    const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Move Nodes');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Moves selected nodes with real-time snapping calculations and returns updated state with transient guide lines.
 */
export function moveSelectedNodesWithSnapping(
  state: VectorWorkspaceState,
  dx: number,
  dy: number,
  options: SnappingOptions = {}
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const validDx = Number.isFinite(dx) ? dx : 0;
    const validDy = Number.isFinite(dy) ? dy : 0;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id) && !n.locked);
    if (selectedNodes.length === 0) return state;

    const targetBounds = VectorEditingEngine.computeSelectionBounds(selectedNodes);
    if (!targetBounds) return state;

    // Shift target bounds by (validDx, validDy)
    const movedBounds: BoundingBox2D = {
      ...targetBounds,
      x: targetBounds.x + validDx,
      y: targetBounds.y + validDy,
    };

    const referenceNodes = nodes.filter(n => !selectedIds.includes(n.id));

    let snapResult: SnapResult;
    if (options.snapToGrid) {
      const gridResult = VectorSnappingEngine.computeGridSnap(movedBounds, options.gridSizePx, options.snapThresholdPx);
      snapResult = {
        snappedDeltaX: gridResult.snappedDeltaX,
        snappedDeltaY: gridResult.snappedDeltaY,
        snappedX: gridResult.snappedX,
        snappedY: gridResult.snappedY,
        matches: [],
        guides: gridResult.guides,
      };
    } else {
      snapResult = VectorSnappingEngine.computeSnapDelta(movedBounds, referenceNodes, options);
    }

    const finalDx = validDx + snapResult.snappedDeltaX;
    const finalDy = validDy + snapResult.snappedDeltaY;

    if (finalDx === 0 && finalDy === 0) {
      return {
        ...state,
        activeGuideLines: snapResult.guides,
      };
    }

    const selectedSet = new Set(selectedIds);
    const nextNodes = nodes.map((node) => {
      if (selectedSet.has(node.id) && !node.locked) {
        return VectorEditingEngine.moveShape(node, finalDx, finalDy);
      }
      return node;
    });

    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    if (isEqualSnapshots(state.snapshot, nextSnapshot)) {
      return {
        ...state,
        activeGuideLines: snapResult.guides,
      };
    }

    const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Move Nodes');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
      activeGuideLines: snapResult.guides,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Scales selected nodes with real-time snapping calculations.
 */
export function scaleSelectedNodesWithSnapping(
  state: VectorWorkspaceState,
  scaleX: number,
  scaleY: number,
  origin?: { x: number; y: number },
  options: SnappingOptions = {}
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id) && !n.locked);
    if (selectedNodes.length === 0) return state;

    const scaledNodes = VectorEditingEngine.scaleShapes(selectedNodes, scaleX, scaleY, origin);
    const scaledBounds = VectorEditingEngine.computeSelectionBounds(scaledNodes);
    if (!scaledBounds) return state;

    const referenceNodes = nodes.filter(n => !selectedIds.includes(n.id));
    const snapResult = VectorSnappingEngine.computeSnapDelta(scaledBounds, referenceNodes, options);

    const scaledMap = new Map(scaledNodes.map(n => [n.id, n]));
    const nextNodes = nodes.map((node) => {
      if (scaledMap.has(node.id)) {
        const sNode = scaledMap.get(node.id)!;
        return VectorEditingEngine.moveShape(sNode, snapResult.snappedDeltaX, snapResult.snappedDeltaY);
      }
      return node;
    });

    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    if (isEqualSnapshots(state.snapshot, nextSnapshot)) {
      return {
        ...state,
        activeGuideLines: snapResult.guides,
      };
    }

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Scale Nodes (${scaleX}, ${scaleY})`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
      activeGuideLines: snapResult.guides,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Scales selected nodes relative to center or custom origin and commits HistoryStack transaction.
 */
export function scaleSelectedNodes(
  state: VectorWorkspaceState,
  scaleX: number,
  scaleY: number,
  origin?: { x: number; y: number },
  lockAspectRatio: boolean = false
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id) && !n.locked);
    if (selectedNodes.length === 0) return state;

    const scaledNodes = VectorEditingEngine.scaleShapes(selectedNodes, scaleX, scaleY, origin, lockAspectRatio);
    const scaledMap = new Map(scaledNodes.map(n => [n.id, n]));

    const nextNodes = nodes.map(n => scaledMap.get(n.id) || n);
    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    if (isEqualSnapshots(state.snapshot, nextSnapshot)) {
      return state;
    }

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Scale Nodes (${scaleX}, ${scaleY})`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Rotates selected nodes by angleDeg relative to center or custom origin and commits HistoryStack transaction.
 */
export function rotateSelectedNodes(
  state: VectorWorkspaceState,
  angleDeg: number,
  origin?: { x: number; y: number }
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id) && !n.locked);
    if (selectedNodes.length === 0) return state;

    const rotatedNodes = VectorEditingEngine.rotateShapes(selectedNodes, angleDeg, origin);
    const rotatedMap = new Map(rotatedNodes.map(n => [n.id, n]));

    const nextNodes = nodes.map(n => rotatedMap.get(n.id) || n);
    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    if (isEqualSnapshots(state.snapshot, nextSnapshot)) {
      return state;
    }

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Rotate Nodes (${angleDeg}°)`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Applies composed translation, scale, and rotation to selected nodes and commits 1 HistoryStack transaction.
 */
export function transformSelectedNodes(
  state: VectorWorkspaceState,
  delta: {
    dx?: number;
    dy?: number;
    scaleX?: number;
    scaleY?: number;
    rotateDeg?: number;
    origin?: { x: number; y: number };
    lockAspectRatio?: boolean;
  }
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id) && !n.locked);
    if (selectedNodes.length === 0) return state;

    const transformedNodes = VectorEditingEngine.transformShapesComposed(selectedNodes, delta);
    const transformedMap = new Map(transformedNodes.map(n => [n.id, n]));

    const nextNodes = nodes.map(n => transformedMap.get(n.id) || n);
    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    if (isEqualSnapshots(state.snapshot, nextSnapshot)) {
      return state;
    }

    const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Transform Nodes');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Aligns selected nodes (left, center, right, top, middle, bottom).
 * Requires at least 2 selected nodes.
 */
export function alignSelectedNodes(
  state: VectorWorkspaceState,
  alignment: AlignmentType
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length < 2) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
    if (selectedNodes.length < 2) return state;

    const alignedNodes = VectorEditingEngine.alignShapes(selectedNodes, alignment);
    const alignedMap = new Map(alignedNodes.map(n => [n.id, n]));

    const nextNodes = nodes.map(n => alignedMap.get(n.id) || n);
    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Align ${alignment}`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Aligns selected nodes to canvas or artboard bounds (left, center, right, top, middle, bottom).
 * Operates on 1 or more selected nodes.
 */
export function alignSelectedNodesToCanvas(
  state: VectorWorkspaceState,
  alignment: AlignmentType,
  canvasBounds?: BoundingBox2D
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id) && !n.locked);
    if (selectedNodes.length === 0) return state;

    const alignedNodes = VectorEditingEngine.alignShapesToCanvas(selectedNodes, alignment, canvasBounds);
    const alignedMap = new Map(alignedNodes.map(n => [n.id, n]));

    const nextNodes = nodes.map(n => alignedMap.get(n.id) || n);
    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    if (isEqualSnapshots(state.snapshot, nextSnapshot)) {
      return state;
    }

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Align ${alignment} to Canvas`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Distributes selected nodes sequentially with exact pixel gap spacing.
 * Requires at least 2 selected nodes.
 */
export function distributeSelectedNodesWithGap(
  state: VectorWorkspaceState,
  axis: DistributionType,
  gapPx: number = 20
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length < 2) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id) && !n.locked);
    if (selectedNodes.length < 2) return state;

    const distributedNodes = VectorEditingEngine.distributeShapesWithGap(selectedNodes, axis, gapPx);
    const distMap = new Map(distributedNodes.map(n => [n.id, n]));

    const nextNodes = nodes.map(n => distMap.get(n.id) || n);
    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    if (isEqualSnapshots(state.snapshot, nextSnapshot)) {
      return state;
    }

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Distribute ${axis} Gap ${gapPx}px`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Arranges selected nodes into a multi-column grid layout with custom column count and gaps.
 * Operates on 1 or more selected nodes.
 */
export function arrangeSelectedNodesInGrid(
  state: VectorWorkspaceState,
  columns: number = 3,
  gapX: number = 20,
  gapY: number = 20
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id) && !n.locked);
    if (selectedNodes.length === 0) return state;

    const arrangedNodes = VectorEditingEngine.arrangeShapesInGrid(selectedNodes, columns, gapX, gapY);
    const arrangedMap = new Map(arrangedNodes.map(n => [n.id, n]));

    const nextNodes = nodes.map(n => arrangedMap.get(n.id) || n);
    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    if (isEqualSnapshots(state.snapshot, nextSnapshot)) {
      return state;
    }

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Grid Layout ${columns} Cols`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Groups selected nodes into a ShapeGroupNode.
 */
export function groupSelectedNodes(
  state: VectorWorkspaceState,
  groupId?: string
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length < 2) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
    if (selectedNodes.length < 2) return state;

    const id = groupId || `group_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const groupNode = VectorEditingEngine.groupShapes(id, selectedNodes);

    let minIndex = nodes.length;
    const remainingNodes: VectorNode[] = [];
    for (let i = 0; i < nodes.length; i++) {
      if (selectedIds.includes(nodes[i].id)) {
        minIndex = Math.min(minIndex, i);
      } else {
        remainingNodes.push(nodes[i]);
      }
    }

    remainingNodes.splice(minIndex, 0, groupNode);

    const nextSnapshot: VectorDocumentSnapshot = {
      nodes: remainingNodes,
      selectedIds: [groupNode.id],
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Group Nodes');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Ungroups selected ShapeGroupNode(s) back into individual VectorNodes.
 */
export function ungroupSelectedNodes(
  state: VectorWorkspaceState
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
    const groupNodes = selectedNodes.filter((n): n is ShapeGroupNode => n.type === 'group');
    if (groupNodes.length === 0) return state;

    const newChildrenIds: string[] = [];
    const nextNodes: VectorNode[] = [];

    for (const node of nodes) {
      if (node.type === 'group' && selectedIds.includes(node.id)) {
        const children = VectorEditingEngine.ungroupShape(node);
        nextNodes.push(...children);
        newChildrenIds.push(...children.map(c => c.id));
      } else {
        nextNodes.push(node);
      }
    }

    const nextSnapshot: VectorDocumentSnapshot = {
      nodes: nextNodes,
      selectedIds: newChildrenIds,
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Ungroup Nodes');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Duplicates selected nodes with spatial offset and unique IDs.
 */
export function duplicateSelectedNodes(
  state: VectorWorkspaceState,
  offsetX: number = 20,
  offsetY: number = 20
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
    if (selectedNodes.length === 0) return state;

    const duplicatedNodes = selectedNodes.map(node =>
      VectorEditingEngine.duplicateShape(node, offsetX, offsetY)
    );
    const duplicatedIds = duplicatedNodes.map(n => n.id);

    const nextNodes = [...nodes, ...duplicatedNodes];
    const nextSnapshot: VectorDocumentSnapshot = {
      nodes: nextNodes,
      selectedIds: duplicatedIds,
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Duplicate Nodes');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}


/**
 * Loads and restores a serialized VectorDocument payload.
 */
export function loadVectorDocument(
  state: VectorWorkspaceState,
  jsonString: string
): VectorWorkspaceState {
  try {
    const restoreResult = VectorDocumentSerializer.restoreVectorDocument(jsonString);
    if (!restoreResult.success || !restoreResult.snapshot) {
      return state;
    }

    const nextSnapshot = restoreResult.snapshot;
    const nextHistoryStack = createHistoryStack<VectorDocumentSnapshot>(50).push(nextSnapshot, 'Initial State');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Copies currently selected nodes to the in-memory clipboard buffer.
 */
export function copySelectedNodes(
  state: VectorWorkspaceState
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
    if (selectedNodes.length === 0) return state;

    VectorClipboardEngine.copyShapes(selectedNodes);
    return state;
  } catch (_error) {
    return state;
  }
}

/**
 * Cuts currently selected nodes (copies to clipboard and deletes from document).
 */
export function cutSelectedNodes(
  state: VectorWorkspaceState
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
    if (selectedNodes.length === 0) return state;

    VectorClipboardEngine.copyShapes(selectedNodes);

    const remainingNodes = nodes.filter(n => !selectedIds.includes(n.id));
    const nextSnapshot: VectorDocumentSnapshot = {
      nodes: remainingNodes,
      selectedIds: [],
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Cut Nodes');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Pastes clipboard contents into the workspace snapshot with unique IDs and offsets.
 */
export function pasteClipboard(
  state: VectorWorkspaceState,
  payload?: VectorClipboardPayload | null
): VectorWorkspaceState {
  try {
    const pasteResult = VectorClipboardEngine.pasteShapes(payload);
    if (!pasteResult || pasteResult.pastedNodes.length === 0) {
      return state;
    }

    const nextNodes = [...state.snapshot.nodes, ...pasteResult.pastedNodes];
    const nextSnapshot: VectorDocumentSnapshot = {
      nodes: nextNodes,
      selectedIds: pasteResult.newSelectedIds,
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Paste Nodes');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Resizes currently selected nodes using a handle and mouse delta (dx, dy).
 */
export function resizeSelectedNodes(
  state: VectorWorkspaceState,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  lockAspectRatio: boolean = false
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0 || (dx === 0 && dy === 0)) return state;

    const selectedSet = new Set(selectedIds);
    const nextNodes = nodes.map(node => {
      if (selectedSet.has(node.id) && !node.locked) {
        const resized = VectorEditingEngine.resizeShapeByHandle(node, handle, dx, dy, lockAspectRatio);
        return VectorGeometry.isValidNodeGeometry(resized) ? resized : node;
      }
      return node;
    });

    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    if (isEqualSnapshots(state.snapshot, nextSnapshot)) {
      return state;
    }

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Resize ${handle.toUpperCase()}`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Flips selected nodes horizontally or vertically.
 */
export function flipSelectedNodes(
  state: VectorWorkspaceState,
  direction: 'horizontal' | 'vertical'
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedSet = new Set(selectedIds);
    const nextNodes = nodes.map(node => {
      if (selectedSet.has(node.id)) {
        return VectorEditingEngine.flipShape(node, direction);
      }
      return node;
    });

    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Flip ${direction}`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}


/**
 * Distributes selected nodes evenly along horizontal or vertical axis.
 */
export function distributeSelectedNodes(
  state: VectorWorkspaceState,
  axis: DistributionType
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length < 3) return state;

    const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
    if (selectedNodes.length < 3) return state;

    const distributedNodes = VectorEditingEngine.distributeShapes(selectedNodes, axis);
    const distMap = new Map(distributedNodes.map(n => [n.id, n]));

    const nextNodes = nodes.map(n => distMap.get(n.id) || n);
    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, `Distribute ${axis}`);

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Toggles lock status of selected nodes.
 */
export function toggleSelectedNodesLock(
  state: VectorWorkspaceState
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedSet = new Set(selectedIds);
    const nextNodes = nodes.map(node => {
      if (selectedSet.has(node.id)) {
        return { ...node, locked: !node.locked };
      }
      return node;
    });

    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Toggle Lock');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Toggles visibility of selected nodes.
 */
export function toggleSelectedNodesVisibility(
  state: VectorWorkspaceState
): VectorWorkspaceState {
  try {
    const { selectedIds, nodes } = state.snapshot;
    if (selectedIds.length === 0) return state;

    const selectedSet = new Set(selectedIds);
    const nextNodes = nodes.map(node => {
      if (selectedSet.has(node.id)) {
        return { ...node, visible: !node.visible };
      }
      return node;
    });

    const nextSnapshot: VectorDocumentSnapshot = {
      ...state.snapshot,
      nodes: nextNodes,
    };

    const nextHistoryStack = state.historyStack.push(nextSnapshot, 'Toggle Visibility');

    return {
      snapshot: nextSnapshot,
      historyStack: nextHistoryStack,
    };
  } catch (_error) {
    return state;
  }
}

/**
 * Selects all unlocked, visible nodes in document.
 */
export function selectAllNodes(state: VectorWorkspaceState): VectorWorkspaceState {
  const selectableIds = state.snapshot.nodes
    .filter(n => n.visible && !n.locked)
    .map(n => n.id);

  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      selectedIds: selectableIds,
    },
  };
}

/**
 * Clears current selection.
 */
export function deselectAllNodes(state: VectorWorkspaceState): VectorWorkspaceState {
  return {
    ...state,
    snapshot: {
      ...state.snapshot,
      selectedIds: [],
    },
  };
}

export interface MarqueeSelectionOptions {
  readonly mode?: 'intersect' | 'contain';
  readonly additive?: boolean;
}

/**
 * Headless spatial selection: selects all visible and unlocked nodes intersecting/contained in marquee box.
 */
export function selectNodesInMarquee(
  state: VectorWorkspaceState,
  marqueeBounds: BoundingBox2D,
  options?: MarqueeSelectionOptions
): VectorWorkspaceState {
  try {
    const mode = options?.mode || 'intersect';
    const additive = !!options?.additive;

    if (
      !marqueeBounds ||
      !Number.isFinite(marqueeBounds.x) ||
      !Number.isFinite(marqueeBounds.y) ||
      !Number.isFinite(marqueeBounds.width) ||
      !Number.isFinite(marqueeBounds.height)
    ) {
      return state;
    }

    const { nodes, selectedIds } = state.snapshot;
    const hitIds: string[] = [];

    for (const node of nodes) {
      if (!node.visible || node.locked) {
        continue;
      }
      if (VectorGeometry.nodeIntersectsMarquee(node, marqueeBounds, mode)) {
        hitIds.push(node.id);
      }
    }

    let nextSelectedIds: string[];
    if (additive) {
      const merged = new Set([...selectedIds, ...hitIds]);
      nextSelectedIds = Array.from(merged);
    } else {
      nextSelectedIds = hitIds;
    }

    return {
      ...state,
      snapshot: {
        ...state.snapshot,
        selectedIds: nextSelectedIds,
      },
    };
  } catch (_error) {
    return state;
  }
}

// =========================================================================
// PEN TOOL DRAWING ACTIONS & PATH NODE EDITING
// =========================================================================

/**
 * Starts an interactive Pen Tool drawing session.
 */
export function startPenSession(
  pathId?: string,
  initialPoint?: Point2D
): PenDrawingSession {
  return VectorPenEngine.startPenSession(pathId, initialPoint);
}

/**
 * Adds an anchor point to an active Pen drawing session.
 */
export function addPenAnchor(
  session: PenDrawingSession,
  point: Point2D,
  options?: { handleIn?: Point2D; handleOut?: Point2D; type?: VectorNodeType }
): PenDrawingSession {
  return VectorPenEngine.addAnchor(session, point, options);
}

/**
 * Updates transient mouse hover preview point during active Pen drawing (does NOT mutate history).
 */
export function updatePenPreview(
  session: PenDrawingSession,
  point: Point2D
): PenDrawingSession {
  return VectorPenEngine.updatePreviewPoint(session, point);
}

/**
 * Updates anchor handle position during active Pen drawing.
 */
export function updatePenAnchorHandle(
  session: PenDrawingSession,
  anchorIndex: number,
  handleType: 'in' | 'out',
  handlePos: Point2D,
  mode: VectorNodeType = 'smooth'
): PenDrawingSession {
  return VectorPenEngine.updateAnchorHandle(session, anchorIndex, handleType, handlePos, mode);
}

/**
 * Closes active Pen path session.
 */
export function closePenPath(session: PenDrawingSession): PenDrawingSession {
  return VectorPenEngine.closePenPath(session);
}

/**
 * Finishes Pen drawing session and commits finalized PathNode to workspace document and HistoryStack.
 */
export function finishPenSession(
  state: VectorWorkspaceState,
  session: PenDrawingSession,
  customFill?: Partial<VectorFill>,
  customStroke?: Partial<VectorStroke>
): VectorWorkspaceState {
  try {
    if (!session || session.anchors.length === 0) {
      return state;
    }

    const { pathNode } = VectorPenEngine.finishPenSession(session, customFill, customStroke);
    return addNode(state, pathNode);
  } catch (_error) {
    return state;
  }
}

/**
 * Cancels active Pen drawing session without committing any state to document or history (0 mutation).
 */
export function cancelPenSession(state: VectorWorkspaceState): VectorWorkspaceState {
  return state;
}

/**
 * Moves an anchor point of an existing PathNode in the document and commits transaction to HistoryStack.
 */
export function movePathAnchor(
  state: VectorWorkspaceState,
  nodeId: string,
  anchorIndex: number,
  newPos: Point2D
): VectorWorkspaceState {
  try {
    const node = state.snapshot.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'path' || node.locked) {
      return state;
    }

    const updatedNode = VectorPenEngine.moveAnchorPoint(node as PathNode, anchorIndex, newPos);
    return updateNode(state, updatedNode);
  } catch (_error) {
    return state;
  }
}

/**
 * Moves a control handle of an existing PathNode in the document and commits transaction to HistoryStack.
 */
export function movePathControlHandle(
  state: VectorWorkspaceState,
  nodeId: string,
  anchorIndex: number,
  handleType: 'in' | 'out',
  handlePos: Point2D,
  mode: VectorNodeType = 'smooth'
): VectorWorkspaceState {
  try {
    const node = state.snapshot.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'path' || node.locked) {
      return state;
    }

    const updatedNode = VectorPenEngine.moveControlHandle(node as PathNode, anchorIndex, handleType, handlePos, mode);
    return updateNode(state, updatedNode);
  } catch (_error) {
    return state;
  }
}

/**
 * Converts node type of an anchor point in an existing PathNode and commits transaction to HistoryStack.
 */
export function convertPathNodeType(
  state: VectorWorkspaceState,
  nodeId: string,
  anchorIndex: number,
  targetType: VectorNodeType
): VectorWorkspaceState {
  try {
    const node = state.snapshot.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'path' || node.locked) {
      return state;
    }

    const updatedNode = VectorPenEngine.convertNodeType(node as PathNode, anchorIndex, targetType);
    return updateNode(state, updatedNode);
  } catch (_error) {
    return state;
  }
}

/**
 * Inserts a node into a segment of an existing PathNode and commits transaction to HistoryStack.
 */
export function addPathNodeToSegment(
  state: VectorWorkspaceState,
  nodeId: string,
  segmentIndex: number,
  t: number = 0.5
): VectorWorkspaceState {
  try {
    const node = state.snapshot.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'path' || node.locked) {
      return state;
    }

    const updatedNode = VectorPenEngine.addNodeToSegment(node as PathNode, segmentIndex, t);
    return updateNode(state, updatedNode);
  } catch (_error) {
    return state;
  }
}

/**
 * Deletes a node from an existing PathNode and commits transaction to HistoryStack.
 */
export function deletePathNode(
  state: VectorWorkspaceState,
  nodeId: string,
  anchorIndex: number
): VectorWorkspaceState {
  try {
    const node = state.snapshot.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'path' || node.locked) {
      return state;
    }

    const updatedNode = VectorPenEngine.deleteNodeFromPath(node as PathNode, anchorIndex);
    if (!updatedNode.d || updatedNode.d === '') {
      // Deleting last node removes shape from document tree
      return deleteSelectedNodes({
        ...state,
        snapshot: {
          ...state.snapshot,
          selectedIds: [nodeId],
        },
      });
    }

    return updateNode(state, updatedNode);
  } catch (_error) {
    return state;
  }
}



