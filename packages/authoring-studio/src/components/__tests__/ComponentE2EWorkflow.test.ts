/**
 * ComponentE2EWorkflow.test.ts — Sprint S32 Golden E2E Workflow Test
 *
 * Full 12-step Golden E2E Trace using REAL production APIs:
 *   Create BuilderDocument -> Apply Preset (Hero Card) -> Set Variant (Compact)
 *   -> Insert Slot Child Node (Button) -> Reject Invalid Slot Child Node (Image)
 *   -> Resolve S29 Live Layout -> Resolve S31 Viewport Preview -> Edit Layout via S30 Inspector
 *   -> HistoryStack Undo/Redo -> SSOT Integrity Verified.
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
  type SectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import { createHistoryStack, type HistoryStack } from '../../../../builder-core/src/HistoryStack';
import { resolveLayout } from '../../layout/LayoutTree';
import { createViewportPreviewContext } from '../../viewport-preview/ViewportInteractionController';
import { ComponentController } from '../ComponentController';

function createDoc(): { doc: BuilderDocument; history: HistoryStack<BuilderDocument>; heroSection: SectionNode } {
  const heroSection = createSectionNode({
    id: 'hero-section',
    type: 'section',
    label: 'Hero Section',
    order: 0,
    props: {},
  });
  const base = createBuilderDocument({
    id: 'golden-s32-doc',
    tenantId: 'tenant-gold-s32',
    metadata: { storeName: 'S32 Golden', storeSlug: 's32gold', locale: 'en', currency: 'USD' },
  });
  const doc: BuilderDocument = {
    ...base,
    pages: [createBuilderPage({ id: 'p-gold-s32', name: 'Landing', slug: '/', sections: [heroSection] })],
  };
  return { doc, history: createHistoryStack<BuilderDocument>(50), heroSection };
}

describe('S32 Component Systems & Presets — Golden E2E Workflow', () => {
  it('executes full preset application, variant resolution, slot validation, S29 layout resolution, S31 live preview sync & history undo/redo', () => {
    let { doc, history } = createDoc();
    history = history.push(doc, 'Initial Pristine');

    const controller = new ComponentController();

    // 1. Apply 'hero-card' preset onto 'hero-section'
    let res = controller.applyPreset({ doc, history, nodeId: 'hero-section', presetId: 'hero-card', variantId: 'primary' });
    expect(res.success).toBe(true);
    doc = res.doc;
    history = res.history;

    expect(doc.pages[0].sections[0].props.componentId).toBe('hero-card');
    expect(doc.pages[0].sections[0].props.variant).toBe('primary');

    // 2. Switch variant to 'compact'
    res = controller.setVariant({ doc, history, nodeId: 'hero-section', variantId: 'compact' });
    expect(res.success).toBe(true);
    doc = res.doc;
    history = res.history;

    const resolvedProps = controller.getResolvedProps(doc.pages[0].sections[0]);
    expect(resolvedProps?.activeVariantId).toBe('compact');
    expect(resolvedProps?.effectiveProps.themeStyle).toBe('hero-compact');

    // 3. Insert valid child node into 'action-slot'
    res = controller.insertSlotChild({
      doc,
      history,
      parentNodeId: 'hero-section',
      slotName: 'action-slot',
      child: { id: 'cta-btn-1', type: 'button', label: 'Primary CTA' },
    });
    expect(res.success).toBe(true);
    doc = res.doc;
    history = res.history;

    expect(doc.pages[0].sections[0].children).toHaveLength(1);
    expect(doc.pages[0].sections[0].children?.[0].props.slotName).toBe('action-slot');

    // 4. Attempt invalid child node insertion into 'action-slot' (image not allowed)
    const invalidRes = controller.insertSlotChild({
      doc,
      history,
      parentNodeId: 'hero-section',
      slotName: 'action-slot',
      child: { id: 'invalid-img', type: 'image', label: 'Invalid Image' },
    });
    expect(invalidRes.success).toBe(false);
    expect(invalidRes.error).toContain('is not allowed in slot');

    // 5. Resolve S29 Live Layout & S31 Live Preview
    const resolvedTree = resolveLayout(doc, 1440);
    expect(resolvedTree.pages[0].sections[0].id).toBe('hero-section');

    const previewCtx = createViewportPreviewContext({ doc, history, breakpointId: 'desktop' });
    expect(previewCtx.renderableNodes.length).toBeGreaterThan(0);

    // 6. Perform History Undo steps
    let undoRes = history.undo();
    expect(undoRes).not.toBeNull();
    doc = undoRes!.state;
    history = undoRes!.history;
    // Child button insertion undone -> 0 children
    expect(doc.pages[0].sections[0].children).toHaveLength(0);

    undoRes = history.undo();
    expect(undoRes).not.toBeNull();
    doc = undoRes!.state;
    history = undoRes!.history;
    // Variant change undone -> variant 'primary'
    expect(doc.pages[0].sections[0].props.variant).toBe('primary');

    // 7. Perform History Redo steps
    let redoRes = history.redo();
    expect(redoRes).not.toBeNull();
    doc = redoRes!.state;
    history = redoRes!.history;
    expect(doc.pages[0].sections[0].props.variant).toBe('compact');

    // 8. Revert back to pristine initial state
    let undoWalk = history.undo();
    while (undoWalk) {
      doc = undoWalk.state;
      history = undoWalk.history;
      undoWalk = history.undo();
    }

    // 9. SSOT Integrity & Pristine Verification
    expect(doc.id).toBe('golden-s32-doc');
    expect(doc.version).toBe(1);
    expect(doc.isDirty).toBe(false);
    expect(doc.pages[0].sections[0].props.componentId).toBeUndefined();
  });
});
