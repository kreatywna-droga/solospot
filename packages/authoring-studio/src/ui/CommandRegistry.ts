/**
 * CommandRegistry.ts — Sprint S2 Command Registry (Command System)
 *
 * Studio command registry state, keyboard shortcut bindings, and action handlers.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface StudioCommand {
  readonly commandId: string;
  readonly category: string;
  readonly title: string;
  readonly shortcut?: string;
  readonly iconId?: string;
}

export interface CommandRegistryState {
  readonly commands: ReadonlyArray<StudioCommand>;
}

export const STANDARD_STUDIO_COMMANDS: ReadonlyArray<StudioCommand> = [
  { commandId: 'cmd.timeline.play', category: 'Timeline', title: 'Play / Pause Timeline', shortcut: 'Space', iconId: 'icon-play' },
  { commandId: 'cmd.timeline.addKeyframe', category: 'Timeline', title: 'Add Keyframe at Playhead', shortcut: 'K', iconId: 'icon-keyframe' },
  { commandId: 'cmd.project.save', category: 'Project', title: 'Save Project Snapshot', shortcut: 'Ctrl+S' },
  { commandId: 'cmd.cloud.sync', category: 'Cloud', title: 'Initiate Cloud Sync', shortcut: 'Ctrl+Shift+S', iconId: 'icon-cloud-sync' },
  { commandId: 'cmd.export.pipeline', category: 'Production', title: 'Export DTO Package', shortcut: 'Ctrl+E' },
];

export function createCommandRegistryState(
  commands: ReadonlyArray<StudioCommand> = STANDARD_STUDIO_COMMANDS
): CommandRegistryState {
  return {
    commands: [...commands],
  };
}

export function registerStudioCommand(
  state: CommandRegistryState,
  command: StudioCommand
): CommandRegistryState {
  const filtered = state.commands.filter((c) => c.commandId !== command.commandId);
  return {
    commands: [...filtered, command],
  };
}
