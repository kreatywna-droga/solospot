/**
 * ComponentVariantEngine.test.ts — Sprint S32 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { ComponentPresetRegistry } from '../ComponentPresetRegistry';
import { resolveComponentVariant } from '../ComponentVariantEngine';

describe('ComponentVariantEngine', () => {
  it('resolves component variant and merges base props, variant overrides & node props', () => {
    const registry = new ComponentPresetRegistry();
    const node = createSectionNode({
      id: 'node-1',
      type: 'container',
      label: 'Hero Node',
      props: {
        componentId: 'hero-card',
        variant: 'compact',
        customText: 'Custom Title',
      },
    });

    const resolved = resolveComponentVariant(node, registry);
    expect(resolved).toBeDefined();
    expect(resolved?.componentId).toBe('hero-card');
    expect(resolved?.activeVariantId).toBe('compact');
    expect(resolved?.effectiveProps.themeStyle).toBe('hero-compact');
    expect(resolved?.effectiveProps.customText).toBe('Custom Title');
  });
});
