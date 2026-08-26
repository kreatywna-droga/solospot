import { describe, it, expect } from 'vitest';
import {
  createSharedLibrariesState,
  registerSharedLibrary,
} from '../AnimationSharedLibrary';

describe('AnimationSharedLibrary (PM42, ETAP 6 & DECISION-076)', () => {
  it('manages workspace, global, and user asset libraries without Runtime (DECISION-076)', () => {
    let state = createSharedLibrariesState();

    state = registerSharedLibrary(state, {
      id: 'lib-ws-1',
      name: 'Team Workspace Library',
      tier: 'workspace',
      isReadOnly: false,
      assetItems: [],
    });

    state = registerSharedLibrary(state, {
      id: 'lib-global-1',
      name: 'Studio Standard Library',
      tier: 'global',
      isReadOnly: true,
      assetItems: [],
    });

    state = registerSharedLibrary(state, {
      id: 'lib-user-1',
      name: 'Personal Favs',
      tier: 'user',
      isReadOnly: false,
      assetItems: [],
    });

    expect(state.workspaceLibraries).toHaveLength(1);
    expect(state.globalLibraries).toHaveLength(1);
    expect(state.userLibraries).toHaveLength(1);
  });
});
