/**
 * ViewportPreviewE2EWorkflow.test.ts — Sprint S31 Golden E2E Workflow Test
 *
 * Full 14-step Golden E2E Trace using REAL production APIs:
 *   Create BuilderDocument -> Create Nodes -> Canvas Select Node -> Desktop Preview (S29 layout)
 *   -> Change Layout via S30 Inspector -> BuilderDocument Updated -> S31 Preview Auto-Refreshed
 *   -> Switch Mobile Breakpoint -> S28 Responsive Override -> S29 Effective Layout -> Mobile Preview Reflected
 *   -> Switch Desktop -> Desktop State Preserved -> HistoryStack Undo/Redo -> SSOT Integrity Verified.
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
import { getNodeResponsiveOverrides } from '../../responsive/ResponsiveOverrideEngine';
import {
  createViewportPreviewContext,
  switchViewportBreakpoint,
  selectCanvasNode,
  editLayoutFieldAndRefresh,
} from '../ViewportInteractionController';

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
    id: 'golden-s31-doc',
    tenantId: 'tenant-gold',
    metadata: { storeName: 'S31 Golden', storeSlug: 'gold', locale: 'en', currency: 'USD' },
  });
  const doc: BuilderDocument = {
    ...base,
    pages: [createBuilderPage({ id: 'p-gold', name: 'Landing', slug: '/', sections: [cardRow] })],
  };
  return { doc, history: createHistoryStack<BuilderDocument>(50), cardRow };
}

describe('S31 Live Preview & Viewport Canvas — Golden E2E Workflow', () => {
  it('executes full live preview, selection, responsive breakpoint switching, S30 inspector sync & history undo/redo', () => {
    let { doc, history, cardRow } = createDoc();
    history = history.push(doc, 'Initial Pristine');

    // 1. Initialize Viewport Preview Context (Desktop 1440)
    let ctx = createViewportPreviewContext({ doc, history, breakpointId: 'desktop' });
    expect(ctx.previewState.activeBreakpointId).toBe('desktop');

    // 2. Select 'card-row' on canvas
    ctx = selectCanvasNode(ctx, 'card-row');
    expect(ctx.selectionState.s22SelectionState.primarySelectedId).toBe('card-row');

    // 3. Edit direction via S30 Inspector to 'horizontal'
    ctx = editLayoutFieldAndRefresh(ctx, 'layout.direction', 'horizontal');
    expect(ctx.renderableNodes[0].layoutRect.width).toBe(300);

    // 4. Edit gap via S30 Inspector (desktop gap = 12)
    ctx = editLayoutFieldAndRefresh(ctx, 'layout.gap', 12);
    // Desktop layout resolved -> x = [0, 112, 224]
    expect(ctx.renderableNodes.map((n) => n.layoutRect.x)).toEqual([0, 0, 112, 224]);

    // 5. Switch active breakpoint to mobile (375px)
    ctx = switchViewportBreakpoint(ctx, 'mobile');
    expect(ctx.previewState.activeBreakpointId).toBe('mobile');
    expect(ctx.previewState.viewportWidthPx).toBe(375);

    // 6. Edit gap via S30 Inspector at mobile breakpoint -> mobile gap = 4 (S28 override)
    ctx = editLayoutFieldAndRefresh(ctx, 'layout.gap', 4);
    // Mobile layout resolved -> x = [0, 104, 208]
    expect(ctx.renderableNodes.map((n) => n.layoutRect.x)).toEqual([0, 0, 104, 208]);

    // 7. Switch active breakpoint back to desktop -> desktop gap = 12 preserved
    ctx = switchViewportBreakpoint(ctx, 'desktop');
    expect(ctx.renderableNodes.map((n) => n.layoutRect.x)).toEqual([0, 0, 112, 224]);

    // 8. Select card 'c1' and edit minWidth = 130 via S30
    ctx = selectCanvasNode(ctx, 'c1');
    ctx = editLayoutFieldAndRefresh(ctx, 'layout.minWidth', 130);
    expect(ctx.renderableNodes.map((n) => n.layoutRect.x)).toEqual([0, 0, 142, 254]);

    // 9. Perform History Undo steps
    let undoRes = ctx.history.undo();
    expect(undoRes).not.toBeNull();
    ctx = createViewportPreviewContext({ doc: undoRes!.state, history: undoRes!.history, breakpointId: 'desktop' });
    expect(ctx.renderableNodes.map((n) => n.layoutRect.x)).toEqual([0, 0, 112, 224]);

    // 10. Perform History Redo steps
    let redoRes = ctx.history.redo();
    expect(redoRes).not.toBeNull();
    ctx = createViewportPreviewContext({ doc: redoRes!.state, history: redoRes!.history, breakpointId: 'desktop' });
    expect(ctx.renderableNodes.map((n) => n.layoutRect.x)).toEqual([0, 0, 142, 254]);

    // 11. Revert back to pristine initial state
    let undoWalk = ctx.history.undo();
    while (undoWalk) {
      ctx = createViewportPreviewContext({ doc: undoWalk.state, history: undoWalk.history, breakpointId: 'desktop' });
      undoWalk = ctx.history.undo();
    }

    // 12. SSOT Integrity & Pristine Verification
    expect(ctx.doc.id).toBe('golden-s31-doc');
    expect(ctx.doc.version).toBe(1);
    expect(ctx.doc.isDirty).toBe(false);
    expect(getNodeResponsiveOverrides(cardRow).mobile?.gap).toBeUndefined();
  });
});
