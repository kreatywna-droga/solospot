import { describe, it, expect } from 'vitest';
import { TimelineStudioBridge } from '../TimelineStudioBridge';
import { createHoverMessage } from '../../../../builder-core/src/animation/AnimationPreviewContract';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

const mockTimeline: AnimationTimeline = {
  id: 'tl-bridge-test',
  targetNodeId: 'node-sec-1',
  trigger: { type: 'hover' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'FadeIn',
      duration: 500,
      delay: 0,
      tracks: [
        {
          id: 'track-1',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-2', timeOffset: 500, value: 1, easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('TimelineStudioBridge (PM37, DECISION-049)', () => {
  it('instantiates Studio Bridge without DOM or browser dependencies', () => {
    const bridge = new TimelineStudioBridge();
    expect(bridge.session.currentTime).toBe(0);
    expect(bridge.session.status).toBe('stopped');
    expect(bridge.runtimeBridge).toBeDefined();
    expect(bridge.previewAdapter).toBeDefined();
  });

  it('selects timeline and evaluates frames at specific playhead times', () => {
    const bridge = new TimelineStudioBridge();
    bridge.selectTimeline(mockTimeline);

    expect(bridge.session.selectedTimeline?.id).toBe('tl-bridge-test');

    const frameAt0 = bridge.seek(0);
    expect(frameAt0).not.toBeNull();
    expect(frameAt0?.values['opacity']).toBe(0);

    const frameAt500 = bridge.seek(500);
    expect(frameAt500?.values['opacity']).toBe(1);
  });

  it('controls play/pause/stop on session via studio bridge', () => {
    const bridge = new TimelineStudioBridge();
    bridge.play();
    expect(bridge.session.status).toBe('playing');

    bridge.pause();
    expect(bridge.session.status).toBe('paused');

    bridge.stop();
    expect(bridge.session.status).toBe('stopped');
  });

  it('processes trigger preview messages and triggers session playback on activation', () => {
    const bridge = new TimelineStudioBridge();
    bridge.selectTimeline(mockTimeline);

    expect(bridge.session.status).toBe('stopped');

    // Send HOVER_EVENT with isHovered: true (via canonical factory)
    const result = bridge.processPreviewMessage(
      createHoverMessage('node-sec-1', true)
    );

    expect(result.evaluationReport.activatedTriggerIds).toContain('tl-bridge-test');
    expect(bridge.session.status).toBe('playing');
  });
});
