/**
 * AnimationPresetLibrary.ts — PM41 Animation Preset Library (ETAP 3)
 *
 * DECISION-071: Preset Library pozostaje całkowicie niezależna od Runtime.
 *
 * Provides built-in and user-defined animation presets, category indexing, tag filtering, and search.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API.
 */

import type { AnimationClip } from '../../../builder-core/src/animation/AnimationTypes';

export type PresetCategory = 'entrance' | 'exit' | 'emphasis' | 'loop' | 'hover' | 'custom';

export interface AnimationPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: PresetCategory;
  readonly tags: ReadonlyArray<string>;
  readonly isBuiltIn: boolean;
  readonly clip: AnimationClip;
}

export interface PresetLibraryState {
  readonly presets: ReadonlyArray<AnimationPreset>;
}

export const BUILTIN_PRESETS: ReadonlyArray<AnimationPreset> = [
  {
    id: 'preset-fade-in',
    name: 'Fade In',
    description: 'Smooth opacity transition from 0 to 1',
    category: 'entrance',
    tags: ['fade', 'opacity', 'entrance', 'basic'],
    isBuiltIn: true,
    clip: {
      id: 'clip-preset-fade-in',
      name: 'Fade In',
      duration: 600,
      delay: 0,
      tracks: [
        {
          id: 'tr-opacity',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'ease-out' } },
            { id: 'kf-2', timeOffset: 600, value: 1, easing: { type: 'ease-out' } },
          ],
        },
      ],
    },
  },
  {
    id: 'preset-slide-up',
    name: 'Slide Up',
    description: 'Slide upwards into view with fade',
    category: 'entrance',
    tags: ['slide', 'transform', 'entrance'],
    isBuiltIn: true,
    clip: {
      id: 'clip-preset-slide-up',
      name: 'Slide Up',
      duration: 800,
      delay: 0,
      tracks: [
        {
          id: 'tr-opacity',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'ease-out' } },
            { id: 'kf-2', timeOffset: 800, value: 1, easing: { type: 'ease-out' } },
          ],
        },
        {
          id: 'tr-translate-y',
          propertyKey: 'translateY',
          keyframes: [
            { id: 'kf-3', timeOffset: 0, value: 50, easing: { type: 'ease-out' } },
            { id: 'kf-4', timeOffset: 800, value: 0, easing: { type: 'ease-out' } },
          ],
        },
      ],
    },
  },
  {
    id: 'preset-scale-bounce',
    name: 'Scale Bounce',
    description: 'Bouncy pop-in scale emphasis',
    category: 'emphasis',
    tags: ['scale', 'bounce', 'pop'],
    isBuiltIn: true,
    clip: {
      id: 'clip-preset-scale-bounce',
      name: 'Scale Bounce',
      duration: 500,
      delay: 0,
      tracks: [
        {
          id: 'tr-scale',
          propertyKey: 'scale',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0.8, easing: { type: 'cubic-bezier', controlPoints: [0.42, 0, 0.58, 1] } },
            { id: 'kf-2', timeOffset: 300, value: 1.05, easing: { type: 'cubic-bezier', controlPoints: [0.42, 0, 0.58, 1] } },
            { id: 'kf-3', timeOffset: 500, value: 1, easing: { type: 'cubic-bezier', controlPoints: [0.42, 0, 0.58, 1] } },
          ],
        },
      ],
    },
  },
];

export const INITIAL_PRESET_LIBRARY_STATE: PresetLibraryState = {
  presets: BUILTIN_PRESETS,
};

export function createPresetLibraryState(
  userPresets: ReadonlyArray<AnimationPreset> = []
): PresetLibraryState {
  return {
    presets: [...BUILTIN_PRESETS, ...userPresets],
  };
}

/**
 * Registers a user custom preset immutably.
 */
export function registerUserPreset(
  state: PresetLibraryState,
  preset: Omit<AnimationPreset, 'isBuiltIn'>
): PresetLibraryState {
  const newPreset: AnimationPreset = {
    ...preset,
    isBuiltIn: false,
  };

  const filtered = state.presets.filter((p) => p.id !== newPreset.id);
  return {
    presets: [...filtered, newPreset],
  };
}

/**
 * Searches and filters presets by category, tag, or query string.
 */
export function filterPresets(
  state: PresetLibraryState,
  options: { category?: PresetCategory; tag?: string; query?: string } = {}
): ReadonlyArray<AnimationPreset> {
  return state.presets.filter((preset) => {
    if (options.category && preset.category !== options.category) {
      return false;
    }

    if (options.tag && !preset.tags.includes(options.tag.toLowerCase())) {
      return false;
    }

    if (options.query && options.query.trim().length > 0) {
      const q = options.query.toLowerCase();
      const matchName = preset.name.toLowerCase().includes(q);
      const matchDesc = preset.description.toLowerCase().includes(q);
      const matchTag = preset.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTag) return false;
    }

    return true;
  });
}

export function listPresetDefinitions(): ReadonlyArray<AnimationPreset> {
  return BUILTIN_PRESETS;
}

export function getPresetDefinition(id: string): AnimationPreset | undefined {
  return BUILTIN_PRESETS.find((p) => p.id === id);
}
