/**
 * ResponsiveLayoutIntegration.test.ts — Sprint S29
 *
 * Verifies S29 consumes the REAL S28 responsive pipeline: breakpoint resolution
 * and resolveEffectiveNodeProperty drive effective layout values. No second
 * breakpoint system exists anywhere in the flow.
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
  type SectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import { SetBreakpointOverrideCommand } from '../../responsive/ResponsiveCommands';
import { resolveLayout } from '../LayoutTree';

function buildCard(id: string): SectionNode {
  return createSectionNode({
    id,
    type: 'card',
    label: id,
    order: 0,
    props: { width: 100, height: 100 },
  });
}

function createDoc(): BuilderDocument {
  const container = createSectionNode({
    id: 'cont',
    type: 'container',
    label: 'Container',
    order: 0,
    props: {
      layoutStyle: { direction: 'vertical', gap: 12 },
    },
  });
  container.children = [buildCard('a'), buildCard('b')];
  const base = createBuilderDocument({
    id: 'resp-layout-doc',
    tenantId: 't',
    metadata: { storeName: 'Resp', storeSlug: 'resp', locale: 'en', currency: 'USD' },
  });
  return {
    ...base,
    pages: [createBuilderPage({ id: 'p', name: 'P', slug: '/', sections: [container] })],
  };
}

describe('ResponsiveLayoutIntegration (S29 ↔ S28)', () => {
  it('applies a tablet gap override through the real S28 cascade', () => {
    let doc = createDoc();
    const gapCmd = new SetBreakpointOverrideCommand('cont', 'tablet', { gap: 6 });
    doc = gapCmd.execute(doc);

    const desktop = resolveLayout(doc, 1440);
    const tablet = resolveLayout(doc, 900);

    expect(desktop.breakpointId).toBe('desktop');
    expect(tablet.breakpointId).toBe('tablet');

    // Desktop keeps the base gap=12 → b.y = 112 (100 + 12)
    expect(desktop.pages[0].sections[0].children[1].rect.y).toBe(112);
    // Tablet inherits the responsive override gap=6 → b.y = 106
    expect(tablet.pages[0].sections[0].children[1].rect.y).toBe(106);
  });

  it('re-computes container sizes when S28 flexDirection switches', () => {
    let doc = createDoc();
    const gapCmd = new SetBreakpointOverrideCommand('cont', 'mobile', { gap: 4 });
    doc = gapCmd.execute(doc);
    const dirCmd = new SetBreakpointOverrideCommand('cont', 'mobile', { flexDirection: 'row' });
    doc = dirCmd.execute(doc);

    const desktop = resolveLayout(doc, 1440);
    const mobile = resolveLayout(doc, 390);

    expect(mobile.breakpointId).toBe('mobile');

    const desktopRoot = desktop.pages[0].sections[0];
    const mobileRoot = mobile.pages[0].sections[0];

    // Desktop: vertical rows → children stacked, both x=0
    expect(desktopRoot.children[0].rect.x).toBe(0);
    expect(desktopRoot.children[1].rect.y).toBe(112);

    // Mobile: horizontal direction (S28 override) → side by side with gap 4
    expect(mobileRoot.children[0].rect.x).toBe(0);
    expect(mobileRoot.children[1].rect.x).toBe(104);
    expect(mobileRoot.children[1].rect.y).toBe(0);
  });

  it('produces identical layout for unchanged document across runs', () => {
    const doc = createDoc();
    const first = resolveLayout(doc, 1440);
    const second = resolveLayout(doc, 1440);
    expect(first).toEqual(second);
  });
});