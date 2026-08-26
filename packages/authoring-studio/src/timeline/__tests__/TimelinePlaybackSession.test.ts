import { describe, it, expect } from 'vitest';
import {
  createTimelinePlaybackSession,
  playSession,
  pauseSession,
  stopSession,
  seekSession,
  selectTimelineInSession,
  tickSession,
} from '../TimelinePlaybackSession';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

const mockTimeline: AnimationTimeline = {
  id: 'tl-1',
  targetNodeId: 'node-1',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'Fade',
      duration: 1000,
      delay: 200,
      tracks: [],
    },
  ],
};

describe('TimelinePlaybackSession (PM37, DECISION-046)', () => {
  it('creates a default playback session', () => {
    const session = createTimelinePlaybackSession();
    expect(session.currentTime).toBe(0);
    expect(session.selectedTimeline).toBeNull();
    expect(session.status).toBe('stopped');
    expect(session.fps).toBe(60);
    expect(session.loop).toBe(false);
  });

  it('supports play, pause, and stop transitions immutably', () => {
    const session = createTimelinePlaybackSession({ currentTime: 500 });
    const playing = playSession(session);
    expect(playing.status).toBe('playing');
    expect(playing.currentTime).toBe(500);

    const paused = pauseSession(playing);
    expect(paused.status).toBe('paused');

    const stopped = stopSession(paused);
    expect(stopped.status).toBe('stopped');
    expect(stopped.currentTime).toBe(0);
  });

  it('seeks accurately and prevents negative times', () => {
    const session = createTimelinePlaybackSession();
    const seeked = seekSession(session, 450);
    expect(seeked.currentTime).toBe(450);

    const clamped = seekSession(session, -100);
    expect(clamped.currentTime).toBe(0);
  });

  it('selects timeline immutably', () => {
    const session = createTimelinePlaybackSession();
    const updated = selectTimelineInSession(session, mockTimeline);
    expect(updated.selectedTimeline?.id).toBe('tl-1');
  });

  it('ticks time during playback and stops at timeline duration when not looping', () => {
    let session = createTimelinePlaybackSession({
      selectedTimeline: mockTimeline,
      status: 'playing',
      currentTime: 0,
    });

    session = tickSession(session, 500);
    expect(session.currentTime).toBe(500);
    expect(session.status).toBe('playing');

    // Max duration of mockTimeline is delay (200) + duration (1000) = 1200
    session = tickSession(session, 800);
    expect(session.currentTime).toBe(1200);
    expect(session.status).toBe('stopped');
  });

  it('ticks time and loops when loop is enabled', () => {
    let session = createTimelinePlaybackSession({
      selectedTimeline: mockTimeline,
      status: 'playing',
      currentTime: 1000,
      loop: true,
    });

    // maxDuration is 1200. +300ms => 1300ms => 1300 % 1200 = 100ms
    session = tickSession(session, 300);
    expect(session.currentTime).toBe(100);
    expect(session.status).toBe('playing');
  });
});
