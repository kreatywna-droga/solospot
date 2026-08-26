import { describe, it, expect } from 'vitest';
import { createDockLayoutState, activatePanelInDock, INITIAL_DOCK_LAYOUT_STATE } from '../DockManager';
import { createWorkspaceLayoutModel } from '../WorkspaceLayout';
import { createPanelRegistryState } from '../PanelRegistry';
import { ALL_WORKSPACE_PRESETS, PRESET_ANIMATION } from '../WorkspacePresets';

describe('DockManager & Layout System (Sprint S2, ETAP 1)', () => {
  it('creates dock layout state and activates panels immutably', () => {
    let state = createDockLayoutState();
    expect(state.nodes).toHaveLength(3);

    state = activatePanelInDock(state, 'node-left', 'assets');
    const leftNode = state.nodes.find((n) => n.nodeId === 'node-left');
    expect(leftNode?.activePanelId).toBe('assets');
  });

  it('creates workspace layout model', () => {
    const layout = createWorkspaceLayoutModel('animation', INITIAL_DOCK_LAYOUT_STATE);
    expect(layout.activePresetId).toBe('animation');
    expect(layout.showPrimaryToolbar).toBe(true);
  });

  it('provides panel registry state', () => {
    const registry = createPanelRegistryState();
    expect(registry.registeredPanels.length).toBeGreaterThan(4);
  });

  it('provides workspace presets', () => {
    expect(ALL_WORKSPACE_PRESETS.length).toBeGreaterThan(1);
    expect(PRESET_ANIMATION.presetId).toBe('preset-animation');
  });
});
