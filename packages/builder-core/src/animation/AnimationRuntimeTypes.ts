/**
 * AnimationRuntimeTypes.ts — PM30 Animation Runtime Contracts
 *
 * Pure type contracts for the Animation Runtime execution layer.
 * These types describe the *shape* of runtime evaluation output — they contain
 * NO executable logic, NO DOM manipulation, and NO requestAnimationFrame.
 *
 * Responsibility boundaries:
 *   - Declares the runtime state a Playback Controller produces.
 *   - Declares the evaluation result a Timeline Evaluator produces.
 *   - Consumed (in PM31+) by the Interpolation Engine and the Runtime Preview bridge.
 *
 * Deliberately OUT of scope for PM30:
 *   - Interpolation engines (PM31)
 *   - requestAnimationFrame / clocks
 *   - DOM / CSS runtime
 *   - Inspector / Timeline / Keyframe Editor UI
 */

import type { AnimationClip, PropertyAnimationTrack, AnimationKeyframe, AnimationTimeline } from './AnimationTypes';

/**
 * Playback status of an AnimationPlaybackController instance.
 */
export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'stopped';

/**
 * Direction of playback as applied by the controller.
 * Mirrors the domain `AnimationDirection` but is flattened to the active
 * runtime direction after `alternate` / `alternate-reverse` resolution.
 */
export type RuntimePlaybackDirection = 'normal' | 'reverse';

/**
 * RuntimeFrame — a single resolved frame snapshot for one animated property.
 *
 * Describes WHAT is being evaluated (track + keyframe window) and the linear
 * progress ratio. Value interpolation is intentionally deferred to PM31.
 */
export interface RuntimeFrame {
  /** Clip that owns the active track. */
  readonly clipId: string;
  /** Track being evaluated. */
  readonly trackId: string;
  /** Property key being animated (e.g. 'opacity'). */
  readonly propertyKey: string;
  /** Time (ms) within the owning clip at which the frame is evaluated. */
  readonly clipTime: number;
  /** The keyframe that precedes (or equals) clipTime. */
  readonly from: AnimationKeyframe;
  /** The keyframe that follows (or equals) clipTime. Null when from is the last. */
  readonly to: AnimationKeyframe | null;
  /** Normalized linear progress 0..1 between from and to (no easing applied). */
  readonly normalizedProgress: number;
}

/**
 * RuntimeTrack — aggregated evaluation result for all keyframes of one track.
 */
export interface RuntimeTrack {
  readonly track: PropertyAnimationTrack;
  /** Frames for each evaluated window. Typically one frame per active segment. */
  readonly frames: ReadonlyArray<RuntimeFrame>;
}

/**
 * RuntimeEvaluationResult — full output of a Timeline Evaluator for a given time.
 */
export interface RuntimeEvaluationResult {
  /** The clip active at the evaluated time (null when time is outside all clips). */
  readonly activeClip: AnimationClip | null;
  /** Evaluated tracks belonging to the active clip. */
  readonly tracks: ReadonlyArray<RuntimeTrack>;
  /** Absolute time (ms) supplied to the evaluator. */
  readonly time: number;
}

/**
 * RuntimeState — snapshot of the Playback Controller state at a point in time.
 */
export interface RuntimeState {
  readonly status: PlaybackStatus;
  readonly currentTime: number;
  readonly duration: number;
  readonly speed: number;
  readonly loop: boolean;
  readonly direction: RuntimePlaybackDirection;
}

// ---------------------------------------------------------------------------
// PM31 — Interpolation Contracts
// ---------------------------------------------------------------------------

/**
 * InterpolationType — the kind of value a PropertyInterpolator handles.
 */
export type InterpolationType =
  | 'number'
  | 'opacity'
  | 'px'
  | 'rem'
  | '%'
  | 'deg'
  | 'color'
  | 'transform';

/**
 * InterpolationResult — the resolved value produced by a PropertyInterpolator.
 */
export type InterpolationResult = string | number;

/**
 * PropertyInterpolator — a pure, deterministic (start, end, ratio) => value
 * function. Stateless by contract.
 */
export interface PropertyInterpolator {
  (start: string | number, end: string | number, ratio: number): InterpolationResult;
}

/**
 * RuntimeInterpolationContext — immutable context passed to interpolation.
 * Carries the property type and the normalized (possibly eased) progress ratio.
 */
export interface RuntimeInterpolationContext {
  readonly type: InterpolationType;
  /** Normalized progress ratio, already eased, in 0..1. */
  readonly ratio: number;
  readonly start: string | number;
  readonly end: string | number;
}

// ---------------------------------------------------------------------------
// PM32 — Runtime Bridge & Playback Integration Contracts
// ---------------------------------------------------------------------------

/**
 * RuntimeFrameBatch — a fully assembled, resolved frame for all animated
 * properties of the active clip at a given time. Produced by the
 * RuntimeFrameAssembler after interpolation. Immutable by contract.
 */
export interface RuntimeFrameBatch {
  /** The clip that owns the resolved values (null when nothing is active). */
  readonly clipId: string | null;
  /** Absolute time (ms) at which the batch was evaluated. */
  readonly time: number;
  /** Resolved property values keyed by propertyKey. */
  readonly values: Readonly<Record<string, InterpolationResult>>;
}

/**
 * RuntimeTick — a single deterministic scheduler step: one resolved frame
 * batch plus the playback state that produced it.
 */
export interface RuntimeTick {
  readonly batch: RuntimeFrameBatch;
  readonly state: RuntimeState;
  /** Absolute time (ms) of the tick. */
  readonly time: number;
}

/**
 * RuntimePlaybackSnapshot — immutable snapshot of playback parameters used to
 * evaluate a frame deterministically. Carries no executable logic.
 */
export interface RuntimePlaybackSnapshot {
  readonly state: RuntimeState;
  /** Playhead time (ms). */
  readonly time: number;
  readonly speed: number;
  readonly direction: RuntimePlaybackDirection;
  readonly loop: boolean;
}

/**
 * RuntimeEvaluationContext — immutable context threaded through the Runtime
 * Bridge when evaluating a frame. Combines the domain timeline, the playback
 * state, and the requested evaluation time.
 */
export interface RuntimeEvaluationContext {
  readonly timeline: AnimationTimeline;
  readonly state: RuntimeState;
  /** Requested evaluation time (ms). */
  readonly time: number;
}
