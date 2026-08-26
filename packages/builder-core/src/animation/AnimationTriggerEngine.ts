/**
 * AnimationTriggerEngine.ts — PM33 Trigger Evaluation Engine
 *
 * The engine evaluates trigger definitions against a serializable context and
 * returns a decision. It is deliberately PURE — it does NOT execute or start
 * animations (no start/play/dispatch). Playback orchestration is out of scope
 * for PM33 (PM34/PM35).
 *
 * It also tracks lifecycle STATE (ACTIVE/WAITING/FINISHED/PAUSED) so a single
 * animation can carry multiple triggers, each evaluated and tracked
 * independently. Built on the immutable `AnimationTriggerState` helpers.
 */

import type { AnimationTrigger } from './AnimationTypes';
import type { AnimationTriggerContext } from './AnimationTriggerContext';
import {
  shouldStart,
  evaluateTrigger,
  resolveTriggerType,
  type TriggerDecision,
} from './AnimationTriggerEvaluator';
import {
  createTriggerStateMap,
  transitionTriggerState,
  getTriggerState,
  isTriggerSatisfied,
  type TriggerState,
  type TriggerStateMap,
} from './AnimationTriggerState';

/**
 * Result produced by the trigger engine for a single trigger evaluation.
 */
export interface TriggerEvaluationResult {
  readonly shouldStart: boolean;
  readonly satisfied: boolean;
  readonly state: TriggerState;
}

/**
 * Result produced when evaluating multiple triggers. `allSatisfied` is true
 * only when every trigger is satisfied.
 */
export interface MultiTriggerEvaluationResult {
  readonly results: ReadonlyArray<TriggerEvaluationResult>;
  readonly allSatisfied: boolean;
  readonly anySatisfied: boolean;
}

const TRIGGER_DEFAULT_STATE: TriggerState = 'WAITING';

export class AnimationTriggerEngine {
  private _states: TriggerStateMap;

  constructor(initialStates: TriggerStateMap = createTriggerStateMap()) {
    this._states = { ...initialStates };
  }

  /**
   * Evaluates a single trigger against a context. Returns a decision and the
   * current lifecycle state without mutating internal state (pure).
   */
  public evaluate(
    trigger: AnimationTrigger,
    context: AnimationTriggerContext
  ): TriggerEvaluationResult {
    const decision = evaluateTrigger(trigger, context);
    const state = this.statesFor(trigger.type);
    return {
      shouldStart: decision.shouldStart,
      satisfied: isTriggerSatisfied(state),
      state,
    };
  }

  /**
   * Evaluates multiple triggers against a context and returns per-trigger
   * results plus aggregate flags. Designed so PM34+ can attach several
   * triggers to a single animation.
   */
  public evaluateTriggers(
    triggers: ReadonlyArray<AnimationTrigger>,
    context: AnimationTriggerContext
  ): MultiTriggerEvaluationResult {
    const results = triggers.map((trigger) => this.evaluate(trigger, context));
    const allSatisfied = results.length > 0 && results.every((r) => r.satisfied);
    const anySatisfied = results.some((r) => r.satisfied);
    return { results, allSatisfied, anySatisfied };
  }

  /**
   * Advances the lifecycle state of a trigger key to a new state.
   * Returns a NEW state map (immutable) — does not mutate in place.
   */
  public transition(key: string, next: TriggerState): TriggerStateMap {
    this._states = transitionTriggerState(this._states, key, next);
    return this._states;
  }

  /** Resolves the effective trigger type for a raw string (normalization). */
  public resolveType(type: string): 'onLoad' | 'inView' | 'hover' | 'click' | 'scroll' {
    return resolveTriggerType(type);
  }

  /** Current lifecycle state of a trigger key. */
  public stateOf(key: string): TriggerState {
    return getTriggerState(this._states, key);
  }

  /** A read-only snapshot of all tracked trigger states. */
  public get states(): TriggerStateMap {
    return { ...this._states };
  }

  /** Resets all trigger states to the default (empty) map. */
  public reset(): void {
    this._states = createTriggerStateMap();
  }

  private statesFor(type: string): TriggerState {
    return getTriggerState(this._states, type) ?? TRIGGER_DEFAULT_STATE;
  }
}

// Re-export pure decision helpers for convenience without instantiating.
export { shouldStart, evaluateTrigger, type TriggerDecision };
