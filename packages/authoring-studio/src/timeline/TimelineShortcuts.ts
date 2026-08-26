/**
 * TimelineShortcuts.ts — PM39 Timeline Keyboard Shortcuts (ETAP 7)
 *
 * DECISION-062: Wszystkie interakcje użytkownika są odseparowane od builder-core.
 *
 * Pure data model and resolver for timeline keyboard shortcuts:
 *   - Delete / Backspace → Delete action
 *   - Ctrl/Cmd + C → Copy
 *   - Ctrl/Cmd + V → Paste
 *   - Ctrl/Cmd + D → Duplicate
 *   - Ctrl/Cmd + Z → Undo
 *   - Ctrl/Cmd + Y / Shift + Ctrl/Cmd + Z → Redo
 *   - Space → Toggle Play/Pause
 *
 * NO DOM, NO React, NO Browser API.
 */

export type TimelineShortcutAction =
  | 'DELETE'
  | 'COPY'
  | 'PASTE'
  | 'DUPLICATE'
  | 'UNDO'
  | 'REDO'
  | 'TOGGLE_PLAY_PAUSE'
  | 'NONE';

export interface TimelineKeyEventInput {
  readonly key: string;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
}

/**
 * Resolves a keyboard shortcut event to a discrete authoring action.
 */
export function resolveTimelineShortcut(
  event: TimelineKeyEventInput
): TimelineShortcutAction {
  const isCmdOrCtrl = Boolean(event.ctrlKey || event.metaKey);
  const key = event.key.toLowerCase();

  // Space -> Play / Pause toggle
  if (key === ' ' || key === 'spacebar') {
    return 'TOGGLE_PLAY_PAUSE';
  }

  // Delete / Backspace -> Delete
  if (key === 'delete' || key === 'backspace') {
    return 'DELETE';
  }

  if (isCmdOrCtrl) {
    if (key === 'c') return 'COPY';
    if (key === 'v') return 'PASTE';
    if (key === 'd') return 'DUPLICATE';
    if (key === 'z') {
      return event.shiftKey ? 'REDO' : 'UNDO';
    }
    if (key === 'y') return 'REDO';
  }

  return 'NONE';
}
