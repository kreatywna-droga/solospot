import { describe, expect, it } from 'vitest';
import { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { CanvasRenderSurface } from '../../rendering/CanvasRenderSurface';
import { RealtimeEditingSession } from '../RealtimeEditingSession';

describe('Playhead Seek Operations & Playback Range (S12 ETAP 2 & 3)', () => {
  const sampleDoc: BuilderDocument = {
    id: 'doc_seek',
    tenantId: 'tenant_seek',
    version: 1,
    metadata: {
      storeName: 'Seek Test',
      storeSlug: 'seek-test',
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
    pages: [{ id: 'p1', name: 'P1', slug: '/', isHome: true, sections: [], seo: {} }],
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

  it('clamps playhead seek to specified playback range', () => {
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const session = new RealtimeEditingSession(sampleDoc, surface);

    session.setPlaybackRange({ rangeStartMs: 200, rangeEndMs: 1000 });

    // Under range min
    const resLow = session.seek(50);
    expect(resLow.timestampMs).toBe(200);

    // Over range max
    const resHigh = session.seek(2000);
    expect(resHigh.timestampMs).toBe(1000);

    // Mid range
    const resMid = session.seek(500);
    expect(resMid.timestampMs).toBe(500);

    session.destroy();
  });
});
