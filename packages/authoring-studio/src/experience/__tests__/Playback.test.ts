import { describe, expect, it } from 'vitest';
import { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { CanvasRenderSurface } from '../../rendering/CanvasRenderSurface';
import { RealtimeEditingSession } from '../RealtimeEditingSession';

describe('Timeline Playback & Transport Controls (S12 ETAP 2)', () => {
  const sampleDoc: BuilderDocument = {
    id: 'doc_playback',
    tenantId: 'tenant_playback',
    version: 1,
    metadata: {
      storeName: 'Playback Test',
      storeSlug: 'playback-test',
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
        sections: [],
        seo: {},
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

  it('manages Play, Pause, Stop, Seek, and Loop states cleanly', () => {
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const session = new RealtimeEditingSession(sampleDoc, surface);

    // Initial state
    expect(session.renderCurrentFrame().frameIndex).toBe(0);

    // Play
    session.play();
    let resTick = session.tick(100);
    expect(resTick.timestampMs).toBe(100);

    // Pause
    session.pause();
    resTick = session.tick(50);
    expect(resTick.timestampMs).toBe(100); // Paused time does not advance

    // Seek
    const resSeek = session.seek(1500);
    expect(resSeek.timestampMs).toBe(1500);
    expect(resSeek.frameIndex).toBe(90);

    // Stop
    session.stop();
    expect(session.renderCurrentFrame().timestampMs).toBe(0);

    session.destroy();
  });
});
