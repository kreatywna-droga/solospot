/**
 * WorkspacePresets.ts — Sprint S2 Workspace Presets (Layout System)
 *
 * Predefined workspace layout presets (Default, Animation, Layout, Design).
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { DockLayoutState } from './DockManager';

export interface WorkspacePreset {
  readonly presetId: string;
  readonly name: string;
  readonly description: string;
  readonly dockLayout: DockLayoutState;
}

export const PRESET_DEFAULT: WorkspacePreset = {
  presetId: 'preset-default',
  name: 'Default Workspace',
  description: 'Balanced workspace layout for general page and animation editing',
  dockLayout: {
    nodes: [
      { nodeId: 'node-left', position: 'left', panelIds: ['explorer'], activePanelId: 'explorer', splitRatio: 0.2 },
      { nodeId: 'node-center', position: 'center', panelIds: ['canvas', 'timeline'], activePanelId: 'canvas', splitRatio: 0.6 },
      { nodeId: 'node-right', position: 'right', panelIds: ['inspector'], activePanelId: 'inspector', splitRatio: 0.2 },
    ],
    floatingPanels: [],
  },
};

export const PRESET_ANIMATION: WorkspacePreset = {
  presetId: 'preset-animation',
  name: 'Animation Studio',
  description: 'Expanded timeline and preview canvas layout optimized for motion authoring',
  dockLayout: {
    nodes: [
      { nodeId: 'node-left', position: 'left', panelIds: ['assets', 'explorer'], activePanelId: 'assets', splitRatio: 0.18 },
      { nodeId: 'node-center', position: 'center', panelIds: ['canvas', 'preview'], activePanelId: 'canvas', splitRatio: 0.55 },
      { nodeId: 'node-bottom', position: 'bottom', panelIds: ['timeline'], activePanelId: 'timeline', splitRatio: 0.35 },
      { nodeId: 'node-right', position: 'right', panelIds: ['inspector'], activePanelId: 'inspector', splitRatio: 0.27 },
    ],
    floatingPanels: [],
  },
};

export const ALL_WORKSPACE_PRESETS: ReadonlyArray<WorkspacePreset> = [
  PRESET_DEFAULT,
  PRESET_ANIMATION,
];
