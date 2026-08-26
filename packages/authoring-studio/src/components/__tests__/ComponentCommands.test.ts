/**
 * ComponentCommands.test.ts — Sprint S32 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import {
  ApplyComponentPresetCommand,
  SetComponentVariantCommand,
  InsertSlotNodeCommand,
  RemoveSlotNodeCommand,
} from '../ComponentCommands';

describe('ComponentCommands', () => {
  it('executes ApplyComponentPresetCommand and updates document SSOT', () => {
    const sec = createSectionNode({ id: 's1', type: 'section', label: 'Sec 1' });
    const doc = createBuilderDocument({ id: 'd1', tenantId: 't1', metadata: { storeName: 'S', storeSlug: 's', locale: 'en', currency: 'USD' } });
    doc.pages = [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [sec] })];

    const cmd = new ApplyComponentPresetCommand('s1', 'hero-card', 'primary');
    const res = cmd.execute(doc);

    expect(res.success).toBe(true);
    expect(res.doc.version).toBeGreaterThan(1);
    expect(res.doc.pages[0].sections[0].props.componentId).toBe('hero-card');
    expect(res.doc.pages[0].sections[0].props.variant).toBe('primary');
  });

  it('executes SetComponentVariantCommand, InsertSlotNodeCommand and RemoveSlotNodeCommand', () => {
    const sec = createSectionNode({ id: 's1', type: 'section', label: 'Sec 1', props: { componentId: 'hero-card', variant: 'primary' } });
    const doc = createBuilderDocument({ id: 'd1', tenantId: 't1', metadata: { storeName: 'S', storeSlug: 's', locale: 'en', currency: 'USD' } });
    doc.pages = [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [sec] })];

    // 1. Set Variant
    const cmd1 = new SetComponentVariantCommand('s1', 'compact');
    const res1 = cmd1.execute(doc);
    expect(res1.success).toBe(true);
    expect(res1.doc.pages[0].sections[0].props.variant).toBe('compact');

    // 2. Insert Slot Child
    const cmd2 = new InsertSlotNodeCommand('s1', 'action-slot', { id: 'btn1', type: 'button', label: 'Click Me' });
    const res2 = cmd2.execute(res1.doc);
    expect(res2.success).toBe(true);
    expect(res2.doc.pages[0].sections[0].children).toHaveLength(1);

    // 3. Remove Slot Child
    const cmd3 = new RemoveSlotNodeCommand('s1', 'btn1');
    const res3 = cmd3.execute(res2.doc);
    expect(res3.success).toBe(true);
    expect(res3.doc.pages[0].sections[0].children).toHaveLength(0);
  });
});
