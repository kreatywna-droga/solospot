/**
 * ComponentSlotComposition.test.ts — Sprint S32 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { ComponentPresetRegistry } from '../ComponentPresetRegistry';
import {
  validateSlotChildInsertion,
  validateSlotChildRemoval,
} from '../ComponentSlotComposition';

describe('ComponentSlotComposition', () => {
  it('validates allowed types and max child constraints on slot insertion', () => {
    const registry = new ComponentPresetRegistry();
    const heroNode = createSectionNode({
      id: 'hero-1',
      type: 'container',
      props: { componentId: 'hero-card' },
    });

    // Valid insertion: 'button' allowed in 'action-slot'
    const res1 = validateSlotChildInsertion(heroNode, 'action-slot', 'button', registry);
    expect(res1.valid).toBe(true);

    // Invalid insertion: 'image' not allowed in 'action-slot'
    const res2 = validateSlotChildInsertion(heroNode, 'action-slot', 'image', registry);
    expect(res2.valid).toBe(false);
    expect(res2.reason).toContain('is not allowed in slot');
  });

  it('validates minimum child constraints on slot removal', () => {
    const registry = new ComponentPresetRegistry();
    const gridNode = createSectionNode({
      id: 'grid-1',
      type: 'container',
      props: { componentId: 'feature-grid' },
    });
    gridNode.children = [
      createSectionNode({ id: 'f1', type: 'card', props: { slotName: 'features-slot' } }),
    ];

    // Attempt to remove last child when minChildren is 1
    const res = validateSlotChildRemoval(gridNode, 'features-slot', registry);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('minimum child count (1) required');
  });
});
