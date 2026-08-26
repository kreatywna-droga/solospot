/**
 * TimelineContextMenu.ts — PM39 Timeline Context Menu Data Model (ETAP 7)
 *
 * DECISION-062: Wszystkie interakcje użytkownika są odseparowane od builder-core.
 *
 * Data structures for timeline context menus (keyframe menu, track menu, clip menu).
 *
 * NO DOM, NO React, NO Browser API.
 */

export type TimelineContextMenuAction =
  | 'copy'
  | 'cut'
  | 'paste'
  | 'duplicate'
  | 'delete'
  | 'add_keyframe'
  | 'set_easing_linear'
  | 'set_easing_ease_in'
  | 'set_easing_ease_out'
  | 'set_easing_ease_in_out'
  | 'select_all';

export interface TimelineContextMenuItem {
  readonly id: string;
  readonly label: string;
  readonly action: TimelineContextMenuAction;
  readonly disabled?: boolean;
  readonly shortcut?: string;
}

export interface TimelineContextMenuState {
  readonly isOpen: boolean;
  readonly x: number;
  readonly y: number;
  readonly targetType: 'keyframe' | 'track' | 'clip' | 'background' | null;
  readonly targetId: string | null;
  readonly items: ReadonlyArray<TimelineContextMenuItem>;
}

export const INITIAL_CONTEXT_MENU_STATE: TimelineContextMenuState = {
  isOpen: false,
  x: 0,
  y: 0,
  targetType: null,
  targetId: null,
  items: [],
};

export function createContextMenuState(
  partial: Partial<TimelineContextMenuState> = {}
): TimelineContextMenuState {
  return {
    ...INITIAL_CONTEXT_MENU_STATE,
    ...partial,
  };
}

export function openContextMenu(
  x: number,
  y: number,
  targetType: TimelineContextMenuState['targetType'],
  targetId: string | null,
  items: ReadonlyArray<TimelineContextMenuItem>
): TimelineContextMenuState {
  return {
    isOpen: true,
    x: Math.max(0, x),
    y: Math.max(0, y),
    targetType,
    targetId,
    items,
  };
}

export function closeContextMenu(): TimelineContextMenuState {
  return INITIAL_CONTEXT_MENU_STATE;
}
