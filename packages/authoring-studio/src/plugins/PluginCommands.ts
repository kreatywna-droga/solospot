/**
 * PluginCommands.ts — PM43 Command Extension System (ETAP 4)
 *
 * Registration data models for plugin commands, shortcuts, context menus, and toolbar items.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface PluginCommandContribution {
  readonly id: string;
  readonly pluginId: string;
  readonly label: string;
  readonly description?: string;
  readonly category?: string;
}

export interface PluginShortcutContribution {
  readonly id: string;
  readonly pluginId: string;
  readonly commandId: string;
  readonly keyBinding: string; // e.g. "Ctrl+Shift+P"
}

export interface PluginContextMenuContribution {
  readonly id: string;
  readonly pluginId: string;
  readonly targetType: 'keyframe' | 'track' | 'clip' | 'background';
  readonly label: string;
  readonly commandId: string;
}

export interface PluginToolbarContribution {
  readonly id: string;
  readonly pluginId: string;
  readonly label: string;
  readonly iconIdentifier?: string;
  readonly commandId: string;
  readonly tooltip?: string;
}

export interface PluginContributionsState {
  readonly commands: ReadonlyArray<PluginCommandContribution>;
  readonly shortcuts: ReadonlyArray<PluginShortcutContribution>;
  readonly contextMenus: ReadonlyArray<PluginContextMenuContribution>;
  readonly toolbarItems: ReadonlyArray<PluginToolbarContribution>;
}

export const INITIAL_PLUGIN_CONTRIBUTIONS_STATE: PluginContributionsState = {
  commands: [],
  shortcuts: [],
  contextMenus: [],
  toolbarItems: [],
};

export function createPluginContributionsState(
  partial: Partial<PluginContributionsState> = {}
): PluginContributionsState {
  return {
    ...INITIAL_PLUGIN_CONTRIBUTIONS_STATE,
    ...partial,
  };
}

export function registerPluginCommand(
  state: PluginContributionsState,
  command: PluginCommandContribution
): PluginContributionsState {
  const filtered = state.commands.filter((c) => c.id !== command.id);
  return { ...state, commands: [...filtered, command] };
}

export function registerPluginShortcut(
  state: PluginContributionsState,
  shortcut: PluginShortcutContribution
): PluginContributionsState {
  const filtered = state.shortcuts.filter((s) => s.id !== shortcut.id);
  return { ...state, shortcuts: [...filtered, shortcut] };
}

export function registerPluginContextMenu(
  state: PluginContributionsState,
  menu: PluginContextMenuContribution
): PluginContributionsState {
  const filtered = state.contextMenus.filter((m) => m.id !== menu.id);
  return { ...state, contextMenus: [...filtered, menu] };
}

export function registerPluginToolbarItem(
  state: PluginContributionsState,
  item: PluginToolbarContribution
): PluginContributionsState {
  const filtered = state.toolbarItems.filter((t) => t.id !== item.id);
  return { ...state, toolbarItems: [...filtered, item] };
}
