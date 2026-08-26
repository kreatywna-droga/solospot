/**
 * PanelRegistry.ts — Sprint S2 UI Panel Registry (Layout System)
 *
 * Registry of all available studio panels and their placement constraints.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface PanelDescriptor {
  readonly panelId: string;
  readonly title: string;
  readonly defaultDockPosition: 'left' | 'right' | 'top' | 'bottom' | 'center';
  readonly isCloseable: boolean;
  readonly minWidth: number;
  readonly minHeight: number;
}

export interface PanelRegistryState {
  readonly registeredPanels: ReadonlyArray<PanelDescriptor>;
}

export const STANDARD_STUDIO_PANELS: ReadonlyArray<PanelDescriptor> = [
  { panelId: 'explorer', title: 'Project Explorer', defaultDockPosition: 'left', isCloseable: false, minWidth: 200, minHeight: 300 },
  { panelId: 'assets', title: 'Asset Library', defaultDockPosition: 'left', isCloseable: true, minWidth: 220, minHeight: 300 },
  { panelId: 'canvas', title: 'Stage Canvas', defaultDockPosition: 'center', isCloseable: false, minWidth: 400, minHeight: 400 },
  { panelId: 'timeline', title: 'Animation Timeline', defaultDockPosition: 'bottom', isCloseable: true, minWidth: 400, minHeight: 200 },
  { panelId: 'inspector', title: 'Property Inspector', defaultDockPosition: 'right', isCloseable: false, minWidth: 250, minHeight: 300 },
  { panelId: 'preview', title: 'Live Preview', defaultDockPosition: 'center', isCloseable: true, minWidth: 350, minHeight: 350 },
];

export function createPanelRegistryState(
  panels: ReadonlyArray<PanelDescriptor> = STANDARD_STUDIO_PANELS
): PanelRegistryState {
  return {
    registeredPanels: [...panels],
  };
}
