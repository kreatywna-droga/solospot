/**
 * ViewportInteractionController.test.ts — Sprint S31 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import { createHistoryStack } from '../../../../builder-core/src/HistoryStack';
import {
  createViewportPreviewContext,
  switchViewportBreakpoint,
  setViewportZoom,
  panViewport,
  hoverCanvasNode,
  selectCanvasNode,
  getInspectorStateForSelection,
  editLayoutFieldAndRefresh,
} from '../ViewportInteractionController';

describe('ViewportInteractionController', () => {
  it('orchestrates live preview resolution, viewport switching, canvas selection & S30 inspector integration', () => {
    const card = createSectionNode({ id: 'c1', type: 'card', label: 'Card 1', props: { width: 300, height: 150 } });
    const base = createBuilderDocument({ id: 'd1', tenantId: 't1', metadata: { storeName: 'S', storeSlug: 's', locale: 'en', currency: 'USD' } });
    const doc = { ...base, pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [card] })] };
    const history = createHistoryStack<typeof doc>(50).push(doc, 'Init');

    let ctx = createViewportPreviewContext({ doc, history, breakpointId: 'desktop' });
    expect(ctx.previewState.activeBreakpointId).toBe('desktop');
    expect(ctx.renderableNodes).toHaveLength(1);

    // 1. Zoom and Pan
    ctx = setViewportZoom(ctx, 1.2);
    expect(ctx.previewState.zoomLevel).toBe(1.2);

    ctx = panViewport(ctx, 50, -20);
    expect(ctx.previewState.panPosition).toEqual({ x: 50, y: -20 });

    // 2. Canvas Hover and Selection
    ctx = hoverCanvasNode(ctx, 'c1');
    expect(ctx.selectionState.hoveredNodeId).toBe('c1');

    ctx = selectCanvasNode(ctx, 'c1');
    expect(ctx.selectionState.s22SelectionState.primarySelectedId).toBe('c1');

    // 3. S30 Inspector Read
    const inspectorState = getInspectorStateForSelection(ctx);
    expect(inspectorState).toBeDefined();
    expect(inspectorState?.node.id).toBe('c1');

    // 4. Edit via S30 and auto-refresh preview
    ctx = editLayoutFieldAndRefresh(ctx, 'layout.gap', 15);
    expect(ctx.doc.version).toBeGreaterThan(1);

    // 5. Switch Breakpoint to mobile
    ctx = switchViewportBreakpoint(ctx, 'mobile');
    expect(ctx.previewState.activeBreakpointId).toBe('mobile');
    expect(ctx.previewState.viewportWidthPx).toBe(375);
  });
});
