/**
 * WorkspaceLayout.ts — Sprint S2 Main Workspace Layout Model
 *
 * Overall workspace layout descriptor containing dock layout state, active preset ID, and toolbar visibility flags.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { DockLayoutState } from './DockManager';
import { INITIAL_DOCK_LAYOUT_STATE } from './DockManager';

export interface WorkspaceLayoutModel {
  readonly layoutId: string;
  readonly name: string;
  readonly activePresetId: string;
  readonly dockLayout: DockLayoutState;
  readonly showPrimaryToolbar: boolean;
  readonly showStatusBar: boolean;
}

export function createWorkspaceLayoutModel(
  presetId: string = 'default',
  dockLayout: DockLayoutState = INITIAL_DOCK_LAYOUT_STATE
): WorkspaceLayoutModel {
  return {
    layoutId: `layout-${Date.now()}`,
    name: `Workspace Layout (${presetId})`,
    activePresetId: presetId,
    dockLayout,
    showPrimaryToolbar: true,
    showStatusBar: true,
  };
}
