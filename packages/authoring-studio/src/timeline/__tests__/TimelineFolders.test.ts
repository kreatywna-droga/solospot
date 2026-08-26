import { describe, it, expect } from 'vitest';
import {
  createFoldersState,
  addFolder,
  removeFolder,
  toggleFolderCollapsed,
  addTrackToFolder,
} from '../TimelineFolders';

describe('TimelineFolders (PM40, ETAP 6 & DECISION-067)', () => {
  it('adds and manages track folders immutably (DECISION-067)', () => {
    let state = createFoldersState();

    state = addFolder(state, {
      id: 'f-1',
      name: 'Hero Animations',
      collapsed: false,
      trackIds: ['tr-opacity'],
    });

    expect(state.folders).toHaveLength(1);
    expect(state.folders[0].name).toBe('Hero Animations');

    state = addTrackToFolder(state, 'f-1', 'tr-transform');
    expect(state.folders[0].trackIds).toEqual(['tr-opacity', 'tr-transform']);
  });

  it('toggles folder collapsed/expanded state immutably', () => {
    let state = createFoldersState();
    state = addFolder(state, { id: 'f-1', name: 'Folder 1', collapsed: false, trackIds: [] });

    expect(state.folders[0].collapsed).toBe(false);

    state = toggleFolderCollapsed(state, 'f-1');
    expect(state.folders[0].collapsed).toBe(true);

    state = toggleFolderCollapsed(state, 'f-1');
    expect(state.folders[0].collapsed).toBe(false);
  });

  it('removes a folder immutably', () => {
    let state = createFoldersState();
    state = addFolder(state, { id: 'f-1', name: 'Folder 1', collapsed: false, trackIds: [] });

    state = removeFolder(state, 'f-1');
    expect(state.folders).toHaveLength(0);
  });
});
