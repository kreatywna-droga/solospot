import { describe, it, expect } from 'vitest';
import {
  createPluginContributionsState,
  registerPluginCommand,
  registerPluginShortcut,
  registerPluginContextMenu,
  registerPluginToolbarItem,
} from '../PluginCommands';

describe('PluginCommands (PM43, ETAP 4)', () => {
  it('registers plugin commands, shortcuts, context menus, and toolbar items immutably', () => {
    let state = createPluginContributionsState();

    state = registerPluginCommand(state, {
      id: 'cmd-custom-export',
      pluginId: 'plugin-exp',
      label: 'Custom Export',
    });

    state = registerPluginShortcut(state, {
      id: 'sc-custom-export',
      pluginId: 'plugin-exp',
      commandId: 'cmd-custom-export',
      keyBinding: 'Ctrl+Shift+E',
    });

    state = registerPluginContextMenu(state, {
      id: 'cm-custom-export',
      pluginId: 'plugin-exp',
      targetType: 'keyframe',
      label: 'Export Keyframe',
      commandId: 'cmd-custom-export',
    });

    state = registerPluginToolbarItem(state, {
      id: 'tb-custom-export',
      pluginId: 'plugin-exp',
      label: 'Export Tool',
      commandId: 'cmd-custom-export',
    });

    expect(state.commands).toHaveLength(1);
    expect(state.shortcuts).toHaveLength(1);
    expect(state.contextMenus).toHaveLength(1);
    expect(state.toolbarItems).toHaveLength(1);
  });
});
