/**
 * ComponentController.test.ts — Sprint S32 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import { createHistoryStack } from '../../../../builder-core/src/HistoryStack';
import { ComponentController } from '../ComponentController';

describe('ComponentController', () => {
  it('orchestrates preset application, variant switching, slot operations & history stack pushing', () => {
    const sec = createSectionNode({ id: 's1', type: 'section', label: 'Sec 1' });
    const doc = createBuilderDocument({ id: 'd1', tenantId: 't1', metadata: { storeName: 'S', storeSlug: 's', locale: 'en', currency: 'USD' } });
    doc.pages = [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [sec] })];
    const history = createHistoryStack<typeof doc>(50).push(doc, 'Init');

    const controller = new ComponentController();

    // 1. Apply Preset
    let res = controller.applyPreset({ doc, history, nodeId: 's1', presetId: 'hero-card' });
    expect(res.success).toBe(true);
    expect(res.doc.pages[0].sections[0].props.componentId).toBe('hero-card');

    // 2. Set Variant
    res = controller.setVariant({ doc: res.doc, history: res.history, nodeId: 's1', variantId: 'compact' });
    expect(res.success).toBe(true);
    expect(res.doc.pages[0].sections[0].props.variant).toBe('compact');

    // 3. Insert Slot Child
    res = controller.insertSlotChild({
      doc: res.doc,
      history: res.history,
      parentNodeId: 's1',
      slotName: 'action-slot',
      child: { id: 'btn1', type: 'button' },
    });
    expect(res.success).toBe(true);

    // 4. Resolve Effective Props
    const resolved = controller.getResolvedProps(res.doc.pages[0].sections[0]);
    expect(resolved).toBeDefined();
    expect(resolved?.activeVariantId).toBe('compact');
  });
});
