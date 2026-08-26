/**
 * TimelineTransportController.ts — PM37 Timeline Transport Controller (ETAP 2)
 *
 * Command-only transport controller. It emits transport COMMAND objects:
 *
 *   Play | Pause | Stop | Seek | FrameStep | JumpToKeyframe
 *
 * DECISION-051 (Command-based Timeline Transport):
 *   The transport communicates with Runtime ONLY through command objects.
 *   It NEVER calls Runtime / Playback Engine / interpolation directly.
 *
 * DECISION-052 (Studio Bridge Owns Runtime Evaluation):
 *   The transport does NOT evaluate frames. It only produces commands /
 *   resolves structural target times. Frame evaluation is delegated to the
 *   TimelineStudioBridge.
 *
 * The transport does NOT know about AnimationRuntimeBridge,
 * AnimationRuntimePreviewBridge, or AnimationPlaybackController. It does NOT
 * perform interpolation, and it does NOT compute frames.
 *
 * NO DOM, NO window, NO requestAnimationFrame, NO setTimeout/setInterval, NO React.
 */

import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import type { TimelinePlaybackSession } from './TimelinePlaybackSession';
import { seekSession, playSession, pauseSession, stopSession } from './TimelinePlaybackSession';

// ---------------------------------------------------------------------------
// Transport command primitives (DECISION-051)
// ---------------------------------------------------------------------------

export type TransportCommand =
  | PlayCommand
  | PauseCommand
  | StopCommand
  | SeekCommand
  | FrameStepCommand
  | JumpToKeyframeCommand;

export interface PlayCommand {
  readonly type: 'PLAY';
}

export interface PauseCommand {
  readonly type: 'PAUSE';
}

export interface StopCommand {
  readonly type: 'STOP';
}

export interface SeekCommand {
  readonly type: 'SEEK';
  /** Absolute target time in ms. */
  readonly timeMs: number;
}

export interface FrameStepCommand {
  readonly type: 'FRAME_STEP';
  /** Direction of the step: +1 = forward, -1 = backward. */
  readonly direction: 1 | -1;
}

export interface JumpToKeyframeCommand {
  readonly type: 'JUMP_TO_KEYFRAME';
  readonly clipId: string;
  readonly trackId: string;
  readonly keyframeId: string;
  /** The absolute time (ms) of the target keyframe. */
  readonly timeMs: number;
}

/**
 * Discriminated result of a transport action — always a command (or a no-op marker).
 */
export type TransportResult =
  | { readonly kind: 'COMMAND'; readonly command: TransportCommand }
  | { readonly kind: 'NOOP' };

// ---------------------------------------------------------------------------
// Structural helpers (pure, no Runtime)
// ---------------------------------------------------------------------------

/**
 * Returns the sorted, unique absolute keyframe offsets for a timeline.
 * Always includes 0 (timeline start). Absolute time = clip.delay + keyframe offset.
 */
export function getKeyframeOffsets(timeline: AnimationTimeline): number[] {
  const offsets = new Set<number>([0]);
  for (const clip of timeline.clips) {
    for (const track of clip.tracks) {
      for (const kf of track.keyframes) {
        offsets.add(Math.max(0, clip.delay + kf.timeOffset));
      }
    }
  }
  return Array.from(offsets).sort((a, b) => a - b);
}

/**
 * Returns the total timeline duration = the maximum absolute keyframe offset.
 */
export function getTimelineDuration(timeline: AnimationTimeline): number {
  const offsets = getKeyframeOffsets(timeline);
  return offsets.length > 0 ? offsets[offsets.length - 1] : 0;
}

// ---------------------------------------------------------------------------
// Transport controller — stateless command/service layer
// ---------------------------------------------------------------------------

/**
 * TimelineTransportController — pure command emitter / session reducer.
 *
 * Each method either returns a command (DECISION-051) or reduces the session
 * state model. It carries NO runtime references and NO evaluation logic.
 */
export class TimelineTransportController {
  // -- lifecycle commands ---------------------------------------------------

  static play(session: TimelinePlaybackSession): TimelinePlaybackSession {
    return playSession(session);
  }

  static pause(session: TimelinePlaybackSession): TimelinePlaybackSession {
    return pauseSession(session);
  }

  static stop(session: TimelinePlaybackSession): TimelinePlaybackSession {
    return stopSession(session);
  }

  static seek(
    session: TimelinePlaybackSession,
    timeMs: number
  ): TimelinePlaybackSession {
    return seekSession(session, timeMs);
  }

  // -- frame stepping -------------------------------------------------------

static stepFrame(
    session: TimelinePlaybackSession,
    direction: 'forward' | 'backward'
  ): TimelinePlaybackSession {
const frameMs = 1000 / Math.max(1, session.fps);
    const delta = direction === 'forward' ? frameMs : -frameMs;
    const next = session.currentTime + delta;
    // Round to 3 decimal places so forward/backward stepping is exact and
    // symmetric (avoids float drift like 100.00000000000001).
    const rounded = Math.round(next * 1000) / 1000;
    // Clamp only when a timeline (duration > 0) is selected. Without one the
    // transport is a pure scrubbing surface and must not collapse to 0
    // (DECISION-051: transport emits/resolves commands, nothing else).
    return {
      ...session,
      currentTime:
        session.duration > 0
          ? Math.max(0, Math.min(session.duration, rounded))
          : Math.max(0, rounded),
    };
  }

  // -- keyframe navigation --------------------------------------------------

  static jumpToNextKeyframe(
    session: TimelinePlaybackSession
  ): TimelinePlaybackSession {
    if (!session.selectedTimeline) return session;
    const offsets = getKeyframeOffsets(session.selectedTimeline);
    const next = offsets.find((t) => t > session.currentTime);
    if (next === undefined) return session;
    return { ...session, currentTime: next };
  }

  static jumpToPreviousKeyframe(
    session: TimelinePlaybackSession
  ): TimelinePlaybackSession {
    if (!session.selectedTimeline) return session;
    const offsets = getKeyframeOffsets(session.selectedTimeline);
    const prev = offsets
      .filter((t) => t < session.currentTime)
      .pop();
    if (prev === undefined) return session;
    return { ...session, currentTime: prev };
  }

  static jumpToEnd(session: TimelinePlaybackSession): TimelinePlaybackSession {
    return { ...session, currentTime: session.duration };
  }

  static jumpToStart(session: TimelinePlaybackSession): TimelinePlaybackSession {
    return { ...session, currentTime: 0 };
  }

  // -- command emission (DECISION-051) --------------------------------------

  static playCommand(): TransportResult {
    return { kind: 'COMMAND', command: { type: 'PLAY' } };
  }

  static pauseCommand(): TransportResult {
    return { kind: 'COMMAND', command: { type: 'PAUSE' } };
  }

  static stopCommand(): TransportResult {
    return { kind: 'COMMAND', command: { type: 'STOP' } };
  }

  static seekCommand(timeMs: number): TransportResult {
    return {
      kind: 'COMMAND',
      command: { type: 'SEEK', timeMs: Math.max(0, timeMs) },
    };
  }

  static frameStepCommand(direction: 1 | -1 = 1): TransportResult {
    return {
      kind: 'COMMAND',
      command: { type: 'FRAME_STEP', direction },
    };
  }

  static jumpToKeyframeCommand(
    timeline: AnimationTimeline,
    clipId: string,
    trackId: string,
    keyframeId: string
  ): TransportResult {
    const clip = timeline.clips.find((c) => c.id === clipId);
    const track = clip?.tracks.find((t) => t.id === trackId);
    const kf = track?.keyframes.find((k) => k.id === keyframeId);
    if (!kf) return { kind: 'NOOP' };
    return {
      kind: 'COMMAND',
      command: {
        type: 'JUMP_TO_KEYFRAME',
        clipId,
        trackId,
        keyframeId,
        timeMs: Math.max(0, (clip?.delay ?? 0) + kf.timeOffset),
      },
    };
  }
}
