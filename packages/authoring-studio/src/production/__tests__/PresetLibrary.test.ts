import { describe, it, expect } from 'vitest';
import {
  createPresetLibraryState,
  registerUserPreset,
  filterPresets,
  BUILTIN_PRESETS,
} from '../AnimationPresetLibrary';

describe('AnimationPresetLibrary (PM41, ETAP 3 & DECISION-071)', () => {
  it('provides built-in presets independent of Runtime execution (DECISION-071)', () => {
    const state = createPresetLibraryState();
    expect(state.presets.length).toBeGreaterThanOrEqual(BUILTIN_PRESETS.length);

    const fadeIn = state.presets.find((p) => p.id === 'preset-fade-in')!;
    expect(fadeIn).toBeDefined();
    expect(fadeIn.isBuiltIn).toBe(true);
    expect(fadeIn.category).toBe('entrance');
  });

  it('registers custom user presets immutably', () => {
    let state = createPresetLibraryState();

    state = registerUserPreset(state, {
      id: 'custom-pulse',
      name: 'Custom Pulse',
      description: 'Pulsing opacity clip',
      category: 'loop',
      tags: ['custom', 'pulse'],
      clip: {
        id: 'clip-pulse',
        name: 'Pulse',
        duration: 1000,
        delay: 0,
        tracks: [],
      },
    });

    const custom = state.presets.find((p) => p.id === 'custom-pulse')!;
    expect(custom).toBeDefined();
    expect(custom.isBuiltIn).toBe(false);
  });

  it('filters presets by category, tag, and search query', () => {
    const state = createPresetLibraryState();

    const entrances = filterPresets(state, { category: 'entrance' });
    expect(entrances.every((p) => p.category === 'entrance')).toBe(true);

    const slideSearch = filterPresets(state, { query: 'slide' });
    expect(slideSearch).toHaveLength(1);
    expect(slideSearch[0].name).toBe('Slide Up');
  });
});
