/**
 * AnimationRuntimePreviewBridge.ts — PM34 Runtime Preview Bridge
 *
 * Pure glue layer that connects the PM33 Trigger Engine with the PM32
 * Runtime Bridge. It is deliberately environment-agnostic: it consumes
 * `AnimationTriggerContext` snapshots (never browser objects) and delegates
 * evaluation to the pure engine layers.
 *
 * Pipeline (DECISION-040):
 *
 *   BrowserTriggerAdapter (Preview)
 *     ↓ AnimationTriggerContext
 *   AnimationTriggerEngine (this bridge)
 *     ↓
 *   AnimationRuntimeBridge (frame evaluation)
 *     ↓
 *   RuntimePreviewChannel (Preview)
 *
 * NO animation logic, NO interpolation, NO Playback Engine is implemented here.
 * This bridge only ORCHESTRATES the existing pure layers.
 */

import type { AnimationTimeline } from './AnimationTypes';
import type { AnimationTriggerContext } from './AnimationTriggerContext';
import type { AnimationRuntimeBridge } from './AnimationRuntimeBridge';
import type { RuntimeFrameBatch, RuntimeState } from './AnimationRuntimeTypes';
import { AnimationTriggerEngine } from './AnimationTriggerEngine';
import type {
  TriggerEvaluationResult,
  MultiTriggerEvaluationResult,
} from './AnimationTriggerEngine';

/**
 * Result produced by the bridge when a trigger fires and a frame can be
 * evaluated. Pure data — no DOM / no browser types.
 */
export interface PreviewTriggerFrameResult {
  readonly shouldStart: boolean;
  readonly satisfied: boolean;
  readonly triggerResult: TriggerEvaluationResult;
  /** Evaluated frame at the given time (only when shouldStart is true). */
  readonly frame: RuntimeFrameBatch | null;
}

/**
 * A pure orchestrator that wires the trigger engine to the runtime bridge.
 *
 * The browser adapter (Preview) supplies `AnimationTriggerContext`; this layer
 * asks the trigger engine whether the animation should start, and if so,
 * delegates frame evaluation to the runtime bridge.
 */
export class AnimationRuntimePreviewBridge {
  private readonly _triggerEngine: AnimationTriggerEngine;
  private readonly _runtimeBridge: AnimationRuntimeBridge;

  constructor(
    triggerEngine: AnimationTriggerEngine,
    runtimeBridge: AnimationRuntimeBridge
  ) {
    this._triggerEngine = triggerEngine;
    this._runtimeBridge = runtimeBridge;
  }

  /**
   * Evaluates a single trigger against a context and returns the decision plus
   * an optional evaluated frame (when the trigger should start).
   */
  public evaluateTriggerFrame(
    timeline: AnimationTimeline,
    runtimeState: RuntimeState,
    currentTime: number,
    context: AnimationTriggerContext
  ): PreviewTriggerFrameResult {
    const triggerResult = this._triggerEngine.evaluate(
      timeline.trigger,
      context
    );

    const frame = triggerResult.shouldStart
      ? this._runtimeBridge.evaluateFrame(timeline, runtimeState, currentTime)
      : null;

    return {
      shouldStart: triggerResult.shouldStart,
      satisfied: triggerResult.satisfied,
      triggerResult,
      frame,
    };
  }

  /**
   * Evaluates multiple triggers (useful for a single animation with several
   * triggers) and, when all are satisfied, evaluates one frame.
   */
  public evaluateTriggersFrame(
    timeline: AnimationTimeline,
    triggers: ReadonlyArray<AnimationTimeline['trigger']>,
    runtimeState: RuntimeState,
    currentTime: number,
    context: AnimationTriggerContext
  ): { multi: MultiTriggerEvaluationResult; frame: RuntimeFrameBatch | null } {
    const multi = this._triggerEngine.evaluateTriggers(triggers, context);
    const frame = multi.allSatisfied
      ? this._runtimeBridge.evaluateFrame(timeline, runtimeState, currentTime)
      : null;
    return { multi, frame };
  }

  /** Read-only access to the underlying trigger states. */
  public get triggerStates() {
    return this._triggerEngine.states;
  }
}
