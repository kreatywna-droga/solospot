/**
 * TimelinePlaybackSession.ts — PM37 Timeline Playback Session (ETAP 1)
 *
 * Pure read-only state projection model of the timeline playback session.
 *
 * IMPORTANT (DECISION-046 / F-01 FIX):
 * This is ONLY a read-only state projection snapshot. It does NOT own a clock,
 * does NOT execute time arithmetic (currentTime +=, deltaMs, loop modulo), and
 * does NOT run a scheduler or playback loop.
 *
 * Time ownership and playback progression belong STRICTLY and EXCLUSIVELY to
 * AnimationPlaybackController / RuntimeScheduler in builder-core.
 *
 * NO DOM, NO window, NO requestAnimationFrame, NO setTimeout/setInterval, NO React.
 */

import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import type { PlaybackStatus } from '../../../builder-core/src/animation/AnimationRuntimeTypes';

/**
 * Immutable snapshot of the playback session state (read-only projection).
 */
export interface TimelinePlaybackSession {
  /** Current playhead time in ms (>= 0). */
  readonly currentTime: number;
  /** Total timeline duration in ms. */
  readonly duration: number;
  /** Playback status ('idle' | 'playing' | 'paused' | 'stopped'). */
  readonly status: PlaybackStatus;
  /** The timeline currently selected into the session, or null. */
  readonly selectedTimeline: AnimationTimeline | null;
  /** Frames per second used for frame stepping. */
  readonly fps: number;
  /** Whether playback loops at the end of the timeline. */
  readonly loop: boolean;
}

const DEFAULT_SESSION: TimelinePlaybackSession = {
  currentTime: 0,
  duration: 0,
  status: 'stopped',
  selectedTimeline: null,
  fps: 60,
  loop: false,
};

/**
 * Computes total timeline duration from clips.
 */
export function totalDuration(timeline: AnimationTimeline): number {
  if (!timeline.clips || timeline.clips.length === 0) return 0;
  return timeline.clips.reduce(
    (sum, clip) => Math.max(sum, clip.delay + clip.duration),
    0
  );
}

/**
 * Creates a playback session snapshot projection.
 */
export function createTimelinePlaybackSession(
  partial: Partial<TimelinePlaybackSession> = {}
): TimelinePlaybackSession {
  const selectedTimeline = partial.selectedTimeline ?? null;
  const duration = selectedTimeline
    ? totalDuration(selectedTimeline)
    : (partial.duration ?? 0);
  const currentTime = Math.max(0, partial.currentTime ?? 0);
  return {
    ...DEFAULT_SESSION,
    ...partial,
    selectedTimeline,
    duration,
    currentTime,
  };
}

/**
 * Selects a timeline into the session snapshot, resetting playhead to 0.
 */
export function selectTimelineInSession(
  session: TimelinePlaybackSession,
  timeline: AnimationTimeline
): TimelinePlaybackSession {
  return createTimelinePlaybackSession({
    ...session,
    selectedTimeline: timeline,
    currentTime: 0,
    status: 'stopped',
  });
}

/**
 * State projection helper: set status to 'playing'.
 */
export function playSession(
  session: TimelinePlaybackSession
): TimelinePlaybackSession {
  return { ...session, status: 'playing' };
}

/**
 * State projection helper: set status to 'paused'.
 */
export function pauseSession(
  session: TimelinePlaybackSession
): TimelinePlaybackSession {
  if (session.status !== 'playing') return session;
  return { ...session, status: 'paused' };
}

/**
 * State projection helper: set status to 'stopped' and currentTime to 0.
 */
export function stopSession(
  session: TimelinePlaybackSession
): TimelinePlaybackSession {
  return { ...session, status: 'stopped', currentTime: 0 };
}

/**
 * State projection helper: set currentTime to timeMs.
 */
export function seekSession(
  session: TimelinePlaybackSession,
  timeMs: number
): TimelinePlaybackSession {
  const nonNegative = Math.max(0, timeMs);
  const clamped =
    session.duration > 0 ? Math.min(session.duration, nonNegative) : nonNegative;
  return { ...session, currentTime: clamped };
}

/**
 * Projects a time tick from AnimationPlaybackController / RuntimeScheduler.
 * Pure projection — contains ZERO time math, ZERO modulo, ZERO loop logic.
 */
export function tickSession(
  session: TimelinePlaybackSession,
  newTimeMs: number,
  newStatus?: PlaybackStatus
): TimelinePlaybackSession {
  return {
    ...session,
    currentTime: Math.max(0, newTimeMs),
    status: newStatus ?? session.status,
  };
}
