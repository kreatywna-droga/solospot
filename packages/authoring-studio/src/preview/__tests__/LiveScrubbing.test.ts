import { describe, it, expect, vi } from 'vitest';
import { LiveScrubbingEngine, type ScrubbingRuntimeBridge } from '../LiveScrubbingEngine';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

const mockTimeline: AnimationTimeline = {
  id: 'tl-scrub-test',
  targetNodeId: 'node-hero',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-fade',
      name: 'FadeIn',
      duration: 1000,
      delay: 0,
      tracks: [
        {
          id: 'track-op',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-0', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-1', timeOffset: 1000, value: 1, easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('LiveScrubbing (PM38, ETAP 2 & DECISION-054)', () => {
  it('manages scrubbing state flags', () => {
    const mockBridge: ScrubbingRuntimeBridge = {
      evaluateFrame: vi.fn(),
    };
    const engine = new LiveScrubbingEngine({ runtimeBridge: mockBridge });

    expect(engine.isScrubbing).toBe(false);

    engine.startScrubbing();
    expect(engine.isScrubbing).toBe(true);

    engine.stopScrubbing();
    expect(engine.isScrubbing).toBe(false);
  });

  it('delegates frame evaluation strictly to RuntimeBridge on scrubTo', () => {
    const mockBridge: ScrubbingRuntimeBridge = {
      evaluateFrame: vi.fn().mockImplementation((_tl, _state, time) => ({
        clipId: 'clip-fade',
        time,
        values: { opacity: time / 1000 },
      })),
    };

    const engine = new LiveScrubbingEngine({ runtimeBridge: mockBridge });
    engine.startScrubbing();

    const result = engine.scrubTo(mockTimeline, 400);

    expect(result.timeMs).toBe(400);
    expect(result.frameBatch?.values['opacity']).toBe(0.4);
    expect(mockBridge.evaluateFrame).toHaveBeenCalledWith(
      mockTimeline,
      expect.objectContaining({ currentTime: 400, status: 'paused' }),
      400
    );
  });
});
