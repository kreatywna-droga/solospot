import { describe, expect, it } from 'vitest';
import { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { CanvasRenderSurface } from '../../rendering/CanvasRenderSurface';
import { RealtimeEditingSession } from '../RealtimeEditingSession';

describe('Inspector To Canvas Live Rendering (S12 ETAP 1)', () => {
  const sampleDoc: BuilderDocument = {
    id: 'doc_inspector',
    tenantId: 'tenant_inspector',
    version: 1,
    metadata: {
      storeName: 'Inspector Test Document',
      storeSlug: 'inspector-test-document',
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
            id: 'inspector_rect',
            type: 'rect',
            label: 'Inspector Rect',
            order: 0,
            props: { x: 10, y: 10, width: 100, height: 100, backgroundColor: '#000000' },
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

  it('updates canvas render commands immediately upon Inspector property edits', () => {
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const session = new RealtimeEditingSession(sampleDoc, surface);

    // Initial render
    const initialFrame = session.renderCurrentFrame();
    const initialDraw = initialFrame.commands.find((c) => c.type === 'DRAW_RECT') as any;
    expect(initialDraw.fillStyle).toBe('#000000');

    // Inspector changes background color & border
    const updatedFrame = session.updateNodeProps('inspector_rect', {
      backgroundColor: '#ef4444',
      borderColor: '#ffffff',
      borderWidth: 4,
    });

    const updatedDraw = updatedFrame.commands.find((c) => c.type === 'DRAW_RECT') as any;
    expect(updatedDraw.fillStyle).toBe('#ef4444');
    expect(updatedDraw.strokeStyle).toBe('#ffffff');
    expect(updatedDraw.strokeWidth).toBe(4);

    session.destroy();
  });
});
