import { describe, it, expect } from 'vitest';
import {
  createCommandEngineState,
  registerCommand,
  getAvailableCommands,
  type StudioCommand,
  type CommandContext,
} from '../CommandEngine';
import { createBuilderDocument } from '../../../../builder-core/src/BuilderDocument';

describe('CommandEngine (Sprint S6)', () => {
  it('registers and retrieves available commands based on context', () => {
    let state = createCommandEngineState();

    const alwaysOnCmd: StudioCommand = {
      id: 'cmd-always',
      label: 'Always On',
      isEnabled: () => true,
    };

    const nodeOnlyCmd: StudioCommand = {
      id: 'cmd-node',
      label: 'Node Only',
      isEnabled: (ctx) => ctx.selectedNodeIds.length > 0,
    };

    state = registerCommand(state, alwaysOnCmd);
    state = registerCommand(state, nodeOnlyCmd);

    const doc = createBuilderDocument({ id: 'doc-1', tenantId: 't-1' });

    const contextEmpty: CommandContext = {
      document: doc,
      selectedNodeIds: [],
      activePanelId: null,
    };

    const contextWithNode: CommandContext = {
      document: doc,
      selectedNodeIds: ['node-1'],
      activePanelId: null,
    };

    const availableEmpty = getAvailableCommands(state, contextEmpty);
    expect(availableEmpty).toHaveLength(1);
    expect(availableEmpty[0].id).toBe('cmd-always');

    const availableWithNode = getAvailableCommands(state, contextWithNode);
    expect(availableWithNode).toHaveLength(2);
  });
});
