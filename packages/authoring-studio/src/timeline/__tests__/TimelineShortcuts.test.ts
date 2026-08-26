import { describe, it, expect } from 'vitest';
import { resolveTimelineShortcut } from '../TimelineShortcuts';
import {
  createContextMenuState,
  openContextMenu,
  closeContextMenu,
} from '../TimelineContextMenu';

describe('TimelineShortcuts & Context Menu (PM39, ETAP 7 & DECISION-062)', () => {
  it('resolves keyboard shortcuts to discrete authoring actions', () => {
    expect(resolveTimelineShortcut({ key: ' ' })).toBe('TOGGLE_PLAY_PAUSE');
    expect(resolveTimelineShortcut({ key: 'Delete' })).toBe('DELETE');
    expect(resolveTimelineShortcut({ key: 'Backspace' })).toBe('DELETE');

    expect(resolveTimelineShortcut({ key: 'c', ctrlKey: true })).toBe('COPY');
    expect(resolveTimelineShortcut({ key: 'v', metaKey: true })).toBe('PASTE');
    expect(resolveTimelineShortcut({ key: 'd', ctrlKey: true })).toBe('DUPLICATE');

    expect(resolveTimelineShortcut({ key: 'z', ctrlKey: true })).toBe('UNDO');
    expect(resolveTimelineShortcut({ key: 'z', ctrlKey: true, shiftKey: true })).toBe('REDO');
    expect(resolveTimelineShortcut({ key: 'y', ctrlKey: true })).toBe('REDO');

    expect(resolveTimelineShortcut({ key: 'a' })).toBe('NONE');
  });

  it('manages context menu state immutably', () => {
    let menuState = createContextMenuState();
    expect(menuState.isOpen).toBe(false);

    const items = [
      { id: '1', label: 'Copy', action: 'copy' as const, shortcut: 'Ctrl+C' },
      { id: '2', label: 'Delete', action: 'delete' as const, shortcut: 'Del' },
    ];

    menuState = openContextMenu(150, 300, 'keyframe', 'kf-1', items);
    expect(menuState.isOpen).toBe(true);
    expect(menuState.x).toBe(150);
    expect(menuState.y).toBe(300);
    expect(menuState.targetType).toBe('keyframe');
    expect(menuState.items).toHaveLength(2);

    menuState = closeContextMenu();
    expect(menuState.isOpen).toBe(false);
    expect(menuState.targetType).toBeNull();
  });
});
