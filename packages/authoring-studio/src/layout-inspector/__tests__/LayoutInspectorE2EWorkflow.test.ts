/**
 * LayoutInspectorE2EWorkflow.test.ts — Sprint S30 Golden E2E Test
 *
 * Full lifecycle trace:
 *   Create BuilderDocument -> registerLayoutFields -> readLayoutInspectorState
 *   -> applyFieldChange (direction, gap, mobile gap override, minWidth)
 *   -> resolveLayout (desktop & mobile) -> HistoryStack undo/redo -> SSOT verification
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
import { createPropertyFieldRegistry } from '../../inspector/registry/PropertyRegistry';
import { resolveLayout } from '../../layout/LayoutTree';
import { getNodeResponsiveOverrides } from '../../responsive/ResponsiveOverrideEngine';
import {
  registerLayoutFields,
  readLayoutInspectorState,
  applyFieldChange,
} from '../LayoutInspectorController';

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
    id: 'golden-inspector-doc',
    tenantId: 'tenant-gold',
    metadata: { storeName: 'Inspector Golden', storeSlug: 'gold', locale: 'en', currency: 'USD' },
  });
  const doc: BuilderDocument = {
    ...base,
    pages: [createBuilderPage({ id: 'p-gold', name: 'Landing', slug: '/', sections: [cardRow] })],
  };
  return { doc, history: createHistoryStack<BuilderDocument>(50), cardRow };
}

describe('S30 Layout Inspector UX Subsystem — Golden E2E Workflow', () => {
  it('executes full layout inspector editing lifecycle, verifying SSOT & S28/S29 integration', () => {
    let { doc, history, cardRow } = createDoc();
    history = history.push(doc, 'Initial');

    // 1. Register fields
    const registry = createPropertyFieldRegistry();
    const registeredCount = registerLayoutFields(registry);
    expect(registeredCount).toBeGreaterThanOrEqual(25);

    // 2. Read initial state
    let state = readLayoutInspectorState(doc, 'card-row', 'desktop');
    expect(state).toBeDefined();
    expect(state?.fieldValues['layout.mode']).toBeUndefined();

    // 3. Edit direction via Inspector Controller -> horizontal
    let res = applyFieldChange({ doc, history, nodeId: 'card-row', fieldId: 'layout.direction', value: 'horizontal' });
    expect(res.success).toBe(true);
    doc = res.doc;
    history = res.history;

    // 4. Edit gap via Inspector Controller -> desktop gap = 10
    res = applyFieldChange({ doc, history, nodeId: 'card-row', fieldId: 'layout.gap', value: 10 });
    expect(res.success).toBe(true);
    doc = res.doc;
    history = res.history;

    // 5. Edit gap via Inspector Controller at mobile breakpoint -> mobile gap = 4 (S28 override)
    res = applyFieldChange({ doc, history, nodeId: 'card-row', fieldId: 'layout.gap', value: 4, breakpointId: 'mobile' });
    expect(res.success).toBe(true);
    doc = res.doc;
    history = res.history;

    // 6. Verify layout resolution for desktop (gap = 10 -> x = [0, 110, 220])
    const desktopLayout = resolveLayout(doc, 1440);
    expect(desktopLayout.pages[0].sections[0].children.map((c) => c.rect.x)).toEqual([0, 110, 220]);

    // 7. Verify layout resolution for mobile (gap = 4 -> x = [0, 104, 208])
    const mobileLayout = resolveLayout(doc, 390);
    expect(mobileLayout.pages[0].sections[0].children.map((c) => c.rect.x)).toEqual([0, 104, 208]);

    // 8. Edit constraint on c1 via Inspector Controller -> minWidth = 130
    res = applyFieldChange({ doc, history, nodeId: 'c1', fieldId: 'layout.minWidth', value: 130 });
    expect(res.success).toBe(true);
    doc = res.doc;
    history = res.history;

    const constraintLayout = resolveLayout(doc, 1440);
    expect(constraintLayout.pages[0].sections[0].children.map((c) => c.rect.x)).toEqual([0, 140, 250]);

    // 9. Undo constraint via HistoryStack
    const undo1 = history.undo();
    expect(undo1).not.toBeNull();
    history = undo1!.stack;
    doc = undo1!.state;

    const afterUndoConstraint = resolveLayout(doc, 1440);
    expect(afterUndoConstraint.pages[0].sections[0].children.map((c) => c.rect.x)).toEqual([0, 110, 220]);

    // 10. Undo all remaining steps back to initial doc
    let undoNext = history.undo();
    while (undoNext) {
      history = undoNext.stack;
      doc = undoNext.state;
      undoNext = history.undo();
    }

    // SSOT integrity check
    expect(doc.id).toBe('golden-inspector-doc');
    expect(doc.version).toBe(1);
    expect(doc.isDirty).toBe(false);
    const overrides = getNodeResponsiveOverrides(doc.pages[0].sections[0]);
    expect(overrides.mobile?.gap).toBeUndefined();
    expect(cardRow.id).toBe('card-row');
  });
});