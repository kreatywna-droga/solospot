import { describe, expect, it } from 'vitest';
import { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { CanvasRenderSurface } from '../../rendering/CanvasRenderSurface';
import { RealtimeEditingSession } from '../RealtimeEditingSession';

describe('Timeline Keyframe To Canvas Propagation (S12 ETAP 3)', () => {
  const sampleDoc: BuilderDocument = {
    id: 'doc_timeline',
    tenantId: 'tenant_timeline',
    version: 1,
    metadata: {
      storeName: 'Timeline Test Document',
      storeSlug: 'timeline-test-document',
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
            id: 'animated_node',
            type: 'rect',
            label: 'Animated Node',
            order: 0,
            props: { x: 0, y: 0, width: 100, height: 100 },
            children: [],
            visible: true,
            locked: false,
          },
        ],
      },
    ],
  };

  const sampleTimeline: AnimationTimeline = {
    id: 'tl_1',
    targetNodeId: 'animated_node',
    trigger: { type: 'onLoad' },
    playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
    clips: [
      {
        id: 'clip_1',
        name: 'Fade Clip',
        delay: 0,
        duration: 1000,
        tracks: [
          {
            id: 'track_opacity',
            propertyKey: 'opacity',
            keyframes: [
              { id: 'kf_0', timeOffset: 0, value: 0, easing: { type: 'linear' } },
              { id: 'kf_1', timeOffset: 1000, value: 1, easing: { type: 'linear' } },
            ],
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

  it('evaluates keyframes during timeline playback and updates render commands', () => {
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const session = new RealtimeEditingSession(sampleDoc, surface);
    session.selectTimeline(sampleTimeline);

    // At t=0 ms, opacity should be 0
    const frameAt0 = session.seek(0);
    const opacityCmd0 = frameAt0.commands.find((c) => c.type === 'SET_OPACITY') as any;
    expect(opacityCmd0.opacity).toBe(0);

    // At t=500 ms, opacity should evaluate to 0.5
    const frameAt500 = session.seek(500);
    const opacityCmd500 = frameAt500.commands.find((c) => c.type === 'SET_OPACITY') as any;
    expect(opacityCmd500.opacity).toBeCloseTo(0.5, 2);

    // At t=1000 ms, opacity should evaluate to 1.0
    const frameAt1000 = session.seek(1000);
    const opacityCmd1000 = frameAt1000.commands.find((c) => c.type === 'SET_OPACITY') as any;
    expect(opacityCmd1000.opacity).toBe(1.0);

    session.destroy();
  });
});
