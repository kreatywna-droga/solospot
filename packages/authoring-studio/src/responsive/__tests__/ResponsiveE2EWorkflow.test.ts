/**
 * ResponsiveE2EWorkflow.test.ts — Sprint S28 Golden E2E Workflow
 *
 * End-to-End Golden Workflow test for S28 Responsive & Adaptive Breakpoint Layout Subsystem:
 * Create -> Base Desktop Layout -> Breakpoint Overrides -> Fluid Sizing -> Viewport Switching -> Undo/Redo -> Verify
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
  type SectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import { BreakpointRegistry } from '../BreakpointRegistry';
import {
  resolveEffectiveNodeProperty,
  getNodeResponsiveOverrides,
} from '../ResponsiveOverrideEngine';
import {
  SetBreakpointOverrideCommand,
  RemoveBreakpointOverrideCommand,
} from '../ResponsiveCommands';
import { computeFluidSize } from '../FluidSizingEngine';
import { isNodeVisibleAtBreakpoint, setNodeVisibilityAtBreakpoint } from '../ResponsiveVisibilityRules';
import { createResponsiveViewportState, switchActiveBreakpoint } from '../ResponsiveViewportController';

const createGoldenDocument = (): BuilderDocument => {
  const doc = createBuilderDocument({
    id: 'golden-responsive-doc-1',
    tenantId: 'tenant-gold',
    metadata: { storeName: 'Responsive Golden Store', storeSlug: 'gold', locale: 'en', currency: 'USD' },
  });

  const cardNode = createSectionNode({
    id: 'card-node-1',
    type: 'card',
    label: 'Hero Card',
    order: 1,
    props: {
      width: 1200,
      height: 600,
      fontSize: 36,
      padding: 40,
      flexDirection: 'row',
    },
  });

  const page = createBuilderPage({
    id: 'p-gold-1',
    name: 'Landing Page',
    slug: '/',
    isHome: true,
    sections: [cardNode],
  });

  return {
    ...doc,
    pages: [page],
  };
};

function getCardNode(doc: BuilderDocument): SectionNode {
  return doc.pages[0].sections[0] as SectionNode;
}

describe('S28 Responsive Subsystem — Golden E2E Workflow', () => {
  it('executes full 10-step responsive authoring lifecycle cleanly', () => {
    // 1. Create Document & Registry
    let doc = createGoldenDocument();
    const registry = new BreakpointRegistry();
    let cardNode = getCardNode(doc);

    // Initial base desktop checks
    expect(resolveEffectiveNodeProperty(cardNode, 'width', 'desktop')).toBe(1200);
    expect(resolveEffectiveNodeProperty(cardNode, 'fontSize', 'desktop')).toBe(36);
    expect(isNodeVisibleAtBreakpoint(cardNode, 'desktop')).toBe(true);

    // 2. Configure Tablet Overrides (width: 768, fontSize: 24, flexDirection: 'column')
    const tabletCmd = new SetBreakpointOverrideCommand('card-node-1', 'tablet', {
      width: 768,
      fontSize: 24,
      flexDirection: 'column',
    });
    doc = tabletCmd.execute(doc);
    cardNode = getCardNode(doc);

    expect(resolveEffectiveNodeProperty(cardNode, 'width', 'tablet')).toBe(768);
    expect(resolveEffectiveNodeProperty(cardNode, 'fontSize', 'tablet')).toBe(24);
    expect(resolveEffectiveNodeProperty(cardNode, 'flexDirection', 'tablet')).toBe('column');

    // 3. Configure Mobile Overrides (width: 375, fontSize: 18)
    const mobileCmd = new SetBreakpointOverrideCommand('card-node-1', 'mobile', {
      width: 375,
      fontSize: 18,
    });
    doc = mobileCmd.execute(doc);
    cardNode = getCardNode(doc);

    expect(resolveEffectiveNodeProperty(cardNode, 'width', 'mobile')).toBe(375);
    expect(resolveEffectiveNodeProperty(cardNode, 'fontSize', 'mobile')).toBe(18);
    // Inherits flexDirection: 'column' from tablet fallback chain
    expect(resolveEffectiveNodeProperty(cardNode, 'flexDirection', 'mobile')).toBe('column');

    // 4. Configure Mobile Small Visibility Rule (hide on small mobile)
    cardNode = setNodeVisibilityAtBreakpoint(cardNode, 'mobile_small', false);
    expect(isNodeVisibleAtBreakpoint(cardNode, 'desktop')).toBe(true);
    expect(isNodeVisibleAtBreakpoint(cardNode, 'mobile')).toBe(true);
    expect(isNodeVisibleAtBreakpoint(cardNode, 'mobile_small')).toBe(false);

    // 5. Compute Adaptive Fluid Typography Clamp for Hero Title
    const fluidResult = computeFluidSize(
      { minSizePx: 18, maxSizePx: 36, minViewportPx: 375, maxViewportPx: 1440 },
      768 // Tablet width
    );
    expect(fluidResult.calculatedSizePx).toBeGreaterThan(18);
    expect(fluidResult.calculatedSizePx).toBeLessThan(36);
    expect(fluidResult.cssClampString).toContain('clamp(');

    // 6. Viewport Controller Switching
    let vpState = createResponsiveViewportState('desktop', 1600, 1000, registry);
    expect(vpState.activeBreakpointId).toBe('desktop');

    vpState = switchActiveBreakpoint(vpState, 'mobile', registry);
    expect(vpState.activeBreakpointId).toBe('mobile');
    expect(vpState.viewportWidthPx).toBe(375);

    // 7. Undo Mobile Override
    doc = mobileCmd.undo(doc);
    cardNode = getCardNode(doc);
    // Mobile width now falls back to tablet (768)
    expect(resolveEffectiveNodeProperty(cardNode, 'width', 'mobile')).toBe(768);

    // 8. Redo Mobile Override
    doc = mobileCmd.execute(doc);
    cardNode = getCardNode(doc);
    expect(resolveEffectiveNodeProperty(cardNode, 'width', 'mobile')).toBe(375);

    // 9. Inspect Node Overrides Dictionary
    const finalOverrides = getNodeResponsiveOverrides(cardNode);
    expect(finalOverrides.tablet?.width).toBe(768);
    expect(finalOverrides.mobile?.width).toBe(375);

    // 10. Final Document SSOT Verification
    expect(doc.id).toBe('golden-responsive-doc-1');
    expect(doc.pages[0].sections).toHaveLength(1);
    expect(doc.updatedAt).toBeGreaterThan(0);
  });
});
