/**
 * CommandPalette.ts — Sprint S2 Command Palette & Global Search (Command System)
 *
 * Global search models, quick actions, and command query execution descriptors.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { StudioCommand } from './CommandRegistry';

export interface CommandSearchResult {
  readonly query: string;
  readonly matchedCommands: ReadonlyArray<StudioCommand>;
}

export function searchCommandPalette(
  commands: ReadonlyArray<StudioCommand>,
  query: string
): CommandSearchResult {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return { query, matchedCommands: [...commands] };
  }

  const matched = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(normalized) ||
      c.category.toLowerCase().includes(normalized) ||
      (c.shortcut && c.shortcut.toLowerCase().includes(normalized))
  );

  return {
    query,
    matchedCommands: matched,
  };
}
