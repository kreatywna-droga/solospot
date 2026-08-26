/**
 * DockManager.ts — Sprint S2 Docking & Window Management Contracts (Layout System)
 *
 * Docking contracts, floating panel models, split view descriptors, and layout state.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type DockPosition = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'floating';

export interface FloatingPanelState {
  readonly panelId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isMinimised: boolean;
}

export interface DockNode {
  readonly nodeId: string;
  readonly position: DockPosition;
  readonly panelIds: ReadonlyArray<string>;
  readonly activePanelId: string | null;
  readonly splitRatio: number; // 0.0 - 1.0
}

export interface DockLayoutState {
  readonly nodes: ReadonlyArray<DockNode>;
  readonly floatingPanels: ReadonlyArray<FloatingPanelState>;
}

export const INITIAL_DOCK_LAYOUT_STATE: DockLayoutState = {
  nodes: [
    { nodeId: 'node-left', position: 'left', panelIds: ['explorer', 'assets'], activePanelId: 'explorer', splitRatio: 0.2 },
    { nodeId: 'node-center', position: 'center', panelIds: ['canvas', 'timeline'], activePanelId: 'canvas', splitRatio: 0.6 },
    { nodeId: 'node-right', position: 'right', panelIds: ['inspector', 'properties'], activePanelId: 'inspector', splitRatio: 0.2 },
  ],
  floatingPanels: [],
};

export function createDockLayoutState(
  initialNodes: ReadonlyArray<DockNode> = INITIAL_DOCK_LAYOUT_STATE.nodes
): DockLayoutState {
  return {
    nodes: [...initialNodes],
    floatingPanels: [],
  };
}

export function activatePanelInDock(
  state: DockLayoutState,
  nodeId: string,
  panelId: string
): DockLayoutState {
  const updatedNodes = state.nodes.map((node) => {
    if (node.nodeId !== nodeId) return node;
    return {
      ...node,
      activePanelId: panelId,
    };
  });

  return {
    ...state,
    nodes: updatedNodes,
  };
}
