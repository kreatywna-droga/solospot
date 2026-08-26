import { describe, expect, it } from 'vitest';
import { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { CanvasRenderSurface } from '../../rendering/CanvasRenderSurface';
import { RealtimeEditingSession } from '../RealtimeEditingSession';

describe('Preview UI Integration & Performance Diagnostics (S12 ETAP 3 & 6)', () => {
  const sampleDoc: BuilderDocument = {
    id: 'doc_preview_diag',
    tenantId: 'tenant_preview_diag',
    version: 1,
    metadata: {
      storeName: 'Preview Diagnostic Test',
      storeSlug: 'preview-diag',
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
    pages: [{ id: 'p1', name: 'Home', slug: '/', isHome: true, sections: [], seo: {} }],
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

  it('records performance diagnostics and generates frame metrics during playback ticks', () => {
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const session = new RealtimeEditingSession(sampleDoc, surface);

    session.play();
    for (let i = 0; i < 10; i++) {
      session.tick(16.6);
    }

    const report = session.getDiagnosticsReport();
    expect(report.totalFramesProcessed).toBe(10);
    expect(report.targetFps).toBe(60);
    expect(report.averageFrameTimeMs).toBeGreaterThanOrEqual(0);

    session.destroy();
  });
});
