/**
 * LayoutE2EWorkflow.test.ts — Sprint S29 Golden E2E
 *
 * Full lifecycle using REAL production APIs only (BuilderDocument factories,
 * S28 SetBreakpointOverrideCommand, S29 commands, real createHistoryStack):
 *
 *   Create Document → Auto Layout → Constraints → S28 responsive overrides
 *   → resolveLayout(desktop) → resolveLayout(mobile) → Undo → Redo → SSOT verify
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
  type SectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import { getNodeResponsiveOverrides } from '../../responsive/ResponsiveOverrideEngine';
import { SetBreakpointOverrideCommand } from '../../responsive/ResponsiveCommands';
import { createHistoryStack, type HistoryStack } from '../../../../builder-core/src/HistoryStack';
import { SetLayoutStyleCommand, SetLayoutConstraintCommand } from '../LayoutCommands';
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

function createDoc(): { doc: BuilderDocument; history: HistoryStack<BuilderDocument>; cardRow: SectionNode } {
  const cardRow = createSectionNode({
    id: 'card-row',
    type: 'container',
    label: 'Card Row',
    order: 0,
    props: {},
  });
  cardRow.children = [buildCard('c1'), buildCard('c2'), buildCard('c3')];
  const base = createBuilderDocument({
    id: 'golden-layout-doc',
    tenantId: 'tenant-gold',
    metadata: { storeName: 'Layout Golden', storeSlug: 'gold', locale: 'en', currency: 'USD' },
  });
  const doc: BuilderDocument = {
    ...base,
    pages: [createBuilderPage({ id: 'p-gold', name: 'Landing', slug: '/', sections: [cardRow] })],
  };
  return { doc, history: createHistoryStack<BuilderDocument>(50), cardRow };
}

describe('S29 Layout Subsystem — Golden E2E Workflow', () => {
  it('executes the full responsive auto-layout lifecycle and verifies SSOT', () => {
    let { doc, history, cardRow } = createDoc();

    // Baseline snapshot so undo can walk all the way back to the initial doc
    history = history.push(doc, 'Initial');

    // 1. Set Auto Layout (horizontal, gap 10) via command + history
    const styleCmd = new SetLayoutStyleCommand('card-row', { direction: 'horizontal', gap: 10 });
    doc = styleCmd.execute(doc);
    history = history.push(doc, styleCmd.name);

    // 2. Mobile gap override through the real S28 pipeline
    const mobileGapCmd = new SetBreakpointOverrideCommand('card-row', 'mobile', { gap: 4 });
    doc = mobileGapCmd.execute(doc);
    history = history.push(doc, 'Mobile gap override');

    // 3. Resolve DESKTOP (base gap = 10)
    const desktop = resolveLayout(doc, 1440);
    expect(desktop.breakpointId).toBe('desktop');
    const desktopRoot = desktop.pages[0].sections[0];
    expect(desktopRoot.children.map((c) => c.rect.x)).toEqual([0, 110, 220]);

    // 4. Resolve MOBILE (S28 gap override = 4)
    const mobile = resolveLayout(doc, 390);
    expect(mobile.breakpointId).toBe('mobile');
    const mobileRoot = mobile.pages[0].sections[0];
    expect(mobileRoot.children.map((c) => c.rect.x)).toEqual([0, 104, 208]);

    // 5. Set a constraint (min-width on c1) via command + history
    const constraintCmd = new SetLayoutConstraintCommand('c1', { minWidth: 130 });
    doc = constraintCmd.execute(doc);
    history = history.push(doc, constraintCmd.name);
    const desktopWithConstraint = resolveLayout(doc, 1440);
    expect(desktopWithConstraint.pages[0].sections[0].children.map((c) => c.rect.x)).toEqual([
      0, 140, 250,
    ]);

    // 6. Undo constraint → back to base widths
    const undoRes = history.undo();
    expect(undoRes).not.toBeNull();
    history = undoRes!.stack;
    doc = undoRes!.state;
    const afterUndo = resolveLayout(doc, 1440);
    expect(afterUndo.pages[0].sections[0].children.map((c) => c.rect.x)).toEqual([0, 110, 220]);

    // 7. Redo constraint → widths re-applied
    const redoRes = history.redo();
    expect(redoRes).not.toBeNull();
    history = redoRes!.stack;
    doc = redoRes!.state;
    const afterRedo = resolveLayout(doc, 1440);
    expect(afterRedo.pages[0].sections[0].children.map((c) => c.rect.x)).toEqual([0, 140, 250]);

    // 8. Undo three more steps → layout style & mobile override both reverted to initial
    let undoExtra: { stack: HistoryStack<BuilderDocument>; state: BuilderDocument } | null = history.undo();
    expect(undoExtra).not.toBeNull();
    history = undoExtra!.stack;
    doc = undoExtra!.state;

    undoExtra = history.undo();
    expect(undoExtra).not.toBeNull();
    history = undoExtra!.stack;
    doc = undoExtra!.state;

    undoExtra = history.undo();
    expect(undoExtra).not.toBeNull();
    history = undoExtra!.stack;
    doc = undoExtra!.state;

    const bare = resolveLayout(doc, 1440);
    const bareRoot = bare.pages[0].sections[0];
    expect(bareRoot.rect).toEqual({ x: 0, y: 0, width: 100, height: 300 });
    expect(bareRoot.children.map((c) => c.rect.y)).toEqual([0, 100, 200]);

    // 9. SSOT verification — document remains the single source of truth
    expect(doc.id).toBe('golden-layout-doc');
    expect(doc.pages).toHaveLength(1);
    expect(doc.pages[0].sections).toHaveLength(1);
    // Reverted to the pristine baseline snapshot
    expect(doc.version).toBe(1);
    expect(doc.isDirty).toBe(false);
    expect(doc.pages[0].sections.length).toBe(1);

    // Layout data stored inside the existing node props (SSOT), not a second doc
    const stored = (doc.pages[0].sections[0].props as Record<string, unknown>).layoutStyle;
    expect(stored).toBeUndefined(); // style command was undone
    const overrides = getNodeResponsiveOverrides(doc.pages[0].sections[0]);
    expect(overrides.mobile?.gap).toBeUndefined(); // mobile override was undone

    // Reapplied original cardRow node is intact
    expect(cardRow.id).toBe('card-row');
  });
});