/**
 * ViewportCanvasAdapter.test.ts — Sprint S31 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import { resolveLayout } from '../../layout/LayoutTree';
import { createSelectionState } from '../../selection/SelectionModel';
import { createViewportPreviewState } from '../ViewportPreviewModel';
import { adaptLayoutToCanvas } from '../ViewportCanvasAdapter';

describe('ViewportCanvasAdapter', () => {
  it('adapts resolved layout tree into flat CanvasRenderableNodes with scaled viewportRects', () => {
    const card = createSectionNode({ id: 'c1', type: 'card', label: 'Card 1', props: { width: 200, height: 100 } });
    const doc = createBuilderDocument({ id: 'd1', tenantId: 't1', metadata: { storeName: 'S', storeSlug: 's', locale: 'en', currency: 'USD' } });
    doc.pages = [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [card] })];

    const previewState = createViewportPreviewState({ breakpointId: 'desktop', containerWidthPx: 1440, containerHeightPx: 900, zoomLevel: 1.0 });
    const resolvedTree = resolveLayout(doc, 1440);
    const selectionState = createSelectionState({ selectedNodeIds: ['c1'] });

    const renderables = adaptLayoutToCanvas(resolvedTree, previewState, selectionState, 'c1');
    expect(renderables.length).toBe(1);

    const r0 = renderables[0];
    expect(r0.nodeId).toBe('c1');
    expect(r0.isSelected).toBe(true);
    expect(r0.isHovered).toBe(true);
    expect(r0.viewportRect).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });
});
