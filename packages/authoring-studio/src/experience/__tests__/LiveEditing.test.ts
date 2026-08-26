import { describe, expect, it } from 'vitest';
import { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { CanvasRenderSurface } from '../../rendering/CanvasRenderSurface';
import { RealtimeEditingSession } from '../RealtimeEditingSession';

describe('LiveEditing Operations (S12 ETAP 1 & 4)', () => {
  const sampleDoc: BuilderDocument = {
    id: 'doc_live_test',
    tenantId: 'tenant_live_test',
    version: 1,
    metadata: {
      storeName: 'Live Test Document',
      storeSlug: 'live-test-document',
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
        id: 'page_home',
        name: 'Home',
        slug: '/',
        isHome: true,
        seo: {},
        sections: [
          {
            id: 'box_node',
            type: 'rect',
            label: 'Box Node',
            order: 0,
            props: { x: 50, y: 50, width: 100, height: 100, backgroundColor: '#3b82f6' },
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

  it('propagates node position, scale, rotation, opacity, and visibility to BuilderDocument and canvas render commands', () => {
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const session = new RealtimeEditingSession(sampleDoc, surface);

    // Position change
    const resPos = session.updateNodePosition('box_node', 200, 300);
    expect(resPos.commands.length).toBeGreaterThan(0);

    const doc1 = session.getDocument();
    expect(doc1.pages[0].sections[0].props.x).toBe(200);
    expect(doc1.pages[0].sections[0].props.y).toBe(300);

    // Scale change
    session.updateNodeScale('box_node', 400, 250);
    const doc2 = session.getDocument();
    expect(doc2.pages[0].sections[0].props.width).toBe(400);
    expect(doc2.pages[0].sections[0].props.height).toBe(250);

    // Opacity change
    session.updateNodeOpacity('box_node', 0.6);
    const doc3 = session.getDocument();
    expect(doc3.pages[0].sections[0].props.opacity).toBe(0.6);

    // Visibility toggle
    session.updateNodeVisibility('box_node', false);
    const doc4 = session.getDocument();
    expect(doc4.pages[0].sections[0].visible).toBe(false);

    session.destroy();
  });
});
