import { describe, it, expect } from 'vitest';
import { createBuilderDocument } from '../../BuilderDocument';
import { RenderingEngine } from '../RenderingEngine';
import { AnimationTimeline } from '../../animation/AnimationTypes';

describe('RenderingEngine', () => {
  it('should initialize rendering session and produce deterministic frames', () => {
    const doc = createBuilderDocument({
      id: 'test-store',
      tenantId: 'test-store',
      metadata: {
        storeName: 'Test Store',
        storeSlug: 'test-store',
        locale: 'en',
        currency: 'USD',
      },
    });
    const engine = new RenderingEngine(doc);

    const frame1 = engine.renderFrame(0);
    expect(frame1.frameIndex).toBe(0);
    expect(frame1.timestampMs).toBe(0);
    expect(frame1.nodes).toBeDefined();

    const frame2 = engine.renderFrame(100);
    expect(frame2.frameIndex).toBe(6); // 100ms at 60 FPS -> 6
    expect(frame2.timestampMs).toBe(100);
  });

  it('should evaluate animated property tracks across timelines', () => {
    const doc = createBuilderDocument({
      id: 'test-store',
      tenantId: 'test-store',
      metadata: {
        storeName: 'Test Store',
        storeSlug: 'test-store',
        locale: 'en',
        currency: 'USD',
      },
    });
    const sectionId = doc.pages[0].sections[0]?.id ?? 'hero';
    const engine = new RenderingEngine(doc);

    const timeline: AnimationTimeline = {
      id: 'tl_1',
      targetNodeId: sectionId,
      trigger: { type: 'onLoad' },
      playback: { repeatCount: 1, loop: false, fillMode: 'both', direction: 'normal' },
      clips: [
        {
          id: 'clip_1',
          name: 'Fade In',
          duration: 1000,
          delay: 0,
          tracks: [
            {
              id: 'tr_1',
              propertyKey: 'opacity',
              keyframes: [
                { id: 'kf_1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
                { id: 'kf_2', timeOffset: 1000, value: 1, easing: { type: 'linear' } },
              ],
            },
          ],
        },
      ],
    };

    const midFrame = engine.renderFrame(500, [timeline]);
    const targetNode = midFrame.nodes.get(sectionId);
    expect(targetNode).toBeDefined();
    expect(targetNode?.opacity).toBeCloseTo(0.5, 2);
  });
});
