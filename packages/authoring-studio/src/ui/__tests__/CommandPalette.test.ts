import { describe, it, expect } from 'vitest';
import { searchCommandPalette } from '../CommandPalette';
import { createCommandRegistryState, registerStudioCommand, STANDARD_STUDIO_COMMANDS } from '../CommandRegistry';

describe('CommandPalette & Command System (Sprint S2, ETAP 3)', () => {
  it('searches command palette by title and category', () => {
    const res = searchCommandPalette(STANDARD_STUDIO_COMMANDS, 'timeline');
    expect(res.matchedCommands.length).toBeGreaterThan(0);
    expect(res.matchedCommands[0].category).toBe('Timeline');
  });

  it('registers commands immutably', () => {
    let state = createCommandRegistryState();
    expect(state.commands.length).toBeGreaterThan(3);

    state = registerStudioCommand(state, {
      commandId: 'cmd.custom.test',
      category: 'Custom',
      title: 'Run Custom Action',
      shortcut: 'Ctrl+Shift+T',
    });

    expect(state.commands.find((c) => c.commandId === 'cmd.custom.test')).toBeDefined();
  });
});
