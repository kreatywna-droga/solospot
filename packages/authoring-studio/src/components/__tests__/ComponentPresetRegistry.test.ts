/**
 * ComponentPresetRegistry.test.ts — Sprint S32 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { createComponentPreset } from '../ComponentPresetModel';
import { ComponentPresetRegistry, BUILTIN_COMPONENT_PRESETS } from '../ComponentPresetRegistry';

describe('ComponentPresetRegistry', () => {
  it('loads builtin presets and allows registering new custom presets', () => {
    const registry = new ComponentPresetRegistry();
    expect(registry.getAllPresets().length).toBeGreaterThanOrEqual(3);

    const hero = registry.getPreset('hero-card');
    expect(hero).toBeDefined();
    expect(hero?.name).toBe('Hero Card Preset');

    const custom = createComponentPreset({ id: 'test-preset', category: 'widget', name: 'Test Preset' });
    const nextRegistry = registry.registerPreset(custom);

    expect(nextRegistry.getPreset('test-preset')).toBeDefined();
    expect(registry.getPreset('test-preset')).toBeUndefined(); // Immutable registry
  });
});
