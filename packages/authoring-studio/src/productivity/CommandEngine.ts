/**
 * CommandEngine.ts — Sprint S6 Global Command Engine
 *
 * Core registry for all executable commands in the studio.
 * Supports context-aware filtering (e.g. valid only if a node is selected).
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';

export interface CommandContext {
  readonly document: BuilderDocument;
  readonly selectedNodeIds: ReadonlyArray<string>;
  readonly activePanelId: string | null;
}

export interface StudioCommand {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly shortcut?: string;
  readonly isEnabled: (ctx: CommandContext) => boolean;
}

export interface CommandEngineState {
  readonly commands: ReadonlyMap<string, StudioCommand>;
}

export function createCommandEngineState(): CommandEngineState {
  return { commands: new Map() };
}

export function registerCommand(
  state: CommandEngineState,
  command: StudioCommand
): CommandEngineState {
  const next = new Map(state.commands);
  next.set(command.id, command);
  return { ...state, commands: next };
}

export function getAvailableCommands(
  state: CommandEngineState,
  context: CommandContext
): ReadonlyArray<StudioCommand> {
  const available: StudioCommand[] = [];
  for (const cmd of state.commands.values()) {
    if (cmd.isEnabled(context)) {
      available.push(cmd);
    }
  }
  return available.sort((a, b) => a.label.localeCompare(b.label));
}
