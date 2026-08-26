/**
 * ComponentPresetModel.test.ts — Sprint S32 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { createComponentPreset } from '../ComponentPresetModel';

describe('ComponentPresetModel', () => {
  it('creates component preset DTO with default variant and slots', () => {
    const preset = createComponentPreset({
      id: 'custom-card',
      category: 'atom',
      name: 'Custom Card',
      defaultProps: { elevation: 2 },
      slots: [
        {
          name: 'card-content',
          label: 'Card Content',
          allowedTypes: ['text', 'image'],
          minChildren: 0,
          maxChildren: 5,
        },
      ],
    });

    expect(preset.id).toBe('custom-card');
    expect(preset.category).toBe('atom');
    expect(preset.variants).toHaveLength(1);
    expect(preset.defaultVariantId).toBe('default');
    expect(preset.slots).toHaveLength(1);
    expect(preset.slots[0].name).toBe('card-content');
  });
});
