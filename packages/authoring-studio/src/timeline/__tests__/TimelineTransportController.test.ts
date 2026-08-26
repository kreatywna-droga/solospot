import { describe, it, expect } from 'vitest';
import {
  TimelineTransportController,
  getKeyframeOffsets,
  getTimelineDuration,
} from '../TimelineTransportController';
import { createTimelinePlaybackSession } from '../TimelinePlaybackSession';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

const timeline: AnimationTimeline = {
  id: 'tl-complex',
  targetNodeId: 'node-1',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'Intro',
      duration: 600,
      delay: 100,
      tracks: [
        {
          id: 'track-1',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-2', timeOffset: 300, value: 0.5, easing: { type: 'linear' } },
            { id: 'kf-3', timeOffset: 600, value: 1, easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('TimelineTransportController (PM37, DECISION-047)', () => {
  it('extracts unique keyframe offsets accurately', () => {
    const offsets = getKeyframeOffsets(timeline);
    // clip delay = 100
    // keyframe absolute times: 100 + 0 = 100, 100 + 300 = 400, 100 + 600 = 700
    // plus start 0
    expect(offsets).toEqual([0, 100, 400, 700]);
    expect(getTimelineDuration(timeline)).toBe(700);
  });

  it('handles play, pause, stop, seek transport controls', () => {
    let session = createTimelinePlaybackSession({ selectedTimeline: timeline });
    expect(session.status).toBe('stopped');

    session = TimelineTransportController.play(session);
    expect(session.status).toBe('playing');

    session = TimelineTransportController.pause(session);
    expect(session.status).toBe('paused');

    session = TimelineTransportController.seek(session, 250);
    expect(session.currentTime).toBe(250);

    session = TimelineTransportController.stop(session);
    expect(session.status).toBe('stopped');
    expect(session.currentTime).toBe(0);
  });

  it('steps frame forward and backward correctly', () => {
    let session = createTimelinePlaybackSession({ currentTime: 100, fps: 60 });
    // 1 frame at 60fps = ~16.666ms
    session = TimelineTransportController.stepFrame(session, 'forward');
    expect(session.currentTime).toBeCloseTo(116.666, 2);

    session = TimelineTransportController.stepFrame(session, 'backward');
    expect(session.currentTime).toBe(100);
  });

  it('jumps to next and previous keyframes', () => {
    let session = createTimelinePlaybackSession({ selectedTimeline: timeline, currentTime: 50 });

    // Next keyframe after 50 is 100
    session = TimelineTransportController.jumpToNextKeyframe(session);
    expect(session.currentTime).toBe(100);

    // Next keyframe after 100 is 400
    session = TimelineTransportController.jumpToNextKeyframe(session);
    expect(session.currentTime).toBe(400);

    // Previous keyframe before 400 is 100
    session = TimelineTransportController.jumpToPreviousKeyframe(session);
    expect(session.currentTime).toBe(100);
  });

  it('jumps to start and end of timeline', () => {
    let session = createTimelinePlaybackSession({ selectedTimeline: timeline, currentTime: 250 });

    session = TimelineTransportController.jumpToEnd(session);
    expect(session.currentTime).toBe(700);

    session = TimelineTransportController.jumpToStart(session);
    expect(session.currentTime).toBe(0);
  });
});
