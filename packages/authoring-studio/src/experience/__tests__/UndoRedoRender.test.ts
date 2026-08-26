import { describe, expect, it } from 'vitest';
import { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { CanvasRenderSurface } from '../../rendering/CanvasRenderSurface';
import { RealtimeEditingSession } from '../RealtimeEditingSession';

describe('Undo / Redo Integration & Canvas Re-render (S12 ETAP 5)', () => {
  const sampleDoc: BuilderDocument = {
    id: 'doc_undoredo',
    tenantId: 'tenant_undoredo',
    version: 1,
    metadata: {
      storeName: 'Undo Redo Test',
      storeSlug: 'undo-redo-test',
      locale: 'en',
      currency: 'USD',
    },
    theme: {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      font: 'Inter',
    },
    isDirty: false,
    createdAt: 0,
    updatedAt: 0,
    pages: [
      {
        id: 'p1',
        name: 'Home',
        slug: '/',
        isHome: true,
        seo: {},
        sections: [
          {
            id: 'node_x',
            type: 'rect',
            label: 'Node X',
            order: 0,
            props: { x: 10, y: 10, width: 100, height: 100 },
            children: [],
            visible: true,
            locked: false,
          },
        ],
      },
    ],
  };

  const mockCtx = {
    save: () => {},
    restore: () => {},
    setTransform: () => {},
    globalAlpha: 1.0,
    globalCompositeOperation: 'source-over',
    beginPath: () => {},
    rect: () => {},
    clip: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    clearRect: () => {},
  };

  it('reverts document state and updates canvas commands during Undo and Redo', () => {
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const session = new RealtimeEditingSession(sampleDoc, surface);

    expect(session.getHistoryInfo().canUndo).toBe(false);

    // Transaction 1: Move to x=200
    session.updateNodePosition('node_x', 200, 10);
    expect(session.getDocument().pages[0].sections[0].props.x).toBe(200);
    expect(session.getHistoryInfo().canUndo).toBe(true);

    // Transaction 2: Move to x=500
    session.updateNodePosition('node_x', 500, 10);
    expect(session.getDocument().pages[0].sections[0].props.x).toBe(500);

    // Undo -> x should revert to 200
    session.undo();
    expect(session.getDocument().pages[0].sections[0].props.x).toBe(200);
    expect(session.getHistoryInfo().canRedo).toBe(true);

    // Undo -> x should revert to original 10
    session.undo();
    expect(session.getDocument().pages[0].sections[0].props.x).toBe(10);

    // Redo -> x should return to 200
    session.redo();
    expect(session.getDocument().pages[0].sections[0].props.x).toBe(200);

    session.destroy();
  });
});
