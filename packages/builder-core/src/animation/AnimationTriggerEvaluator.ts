/**
 * AnimationTriggerEvaluator.ts — PM33 Pure Trigger Evaluator
 *
 * A stateless, pure function layer that answers exactly ONE question:
 *
 *   "Should the animation start?"
 *
 * It takes an immutable trigger *definition* and a serializable *context* and
 * returns a boolean decision. It has NO hidden state, NO side effects, NO DOM.
 *
 * The distinction between trigger *definition* (`AnimationTrigger`) and runtime
 * *state* (`AnimationTriggerState`) is preserved: the evaluator only decides,
 * the engine (or a later PM) owns lifecycle state transitions.
 */

import type { AnimationTrigger, TriggerType } from './AnimationTypes';
import type { AnimationTriggerContext } from './AnimationTriggerContext';

/**
 * Result of evaluating a single trigger.
 */
export interface TriggerDecision {
  /** Whether the animation should start. */
  readonly shouldStart: boolean;
  /** The trigger type that was evaluated. */
  readonly type: TriggerType;
}

/**
 * Evaluates a single trigger against a context via a pure function.
 * Defaults to `false` (do not start) for unknown trigger types.
 */
export function shouldStart(
  trigger: AnimationTrigger,
  context: AnimationTriggerContext
): boolean {
  switch (trigger.type) {
    case 'onLoad':
      return true;
    case 'hover':
      return context.isHovered === true;
    case 'click':
      return context.isClicked === true;
    case 'inView':
      return resolveVisibilityThreshold(trigger.threshold, context.visibilityRatio);
    case 'scroll':
      return resolveScrollThreshold(trigger.threshold, context.scrollY);
    default:
      return false;
  }
}

/**
 * Convenience: returns a richer decision object (boolean + resolved type).
 */
export function evaluateTrigger(
  trigger: AnimationTrigger,
  context: AnimationTriggerContext
): TriggerDecision {
  return {
    shouldStart: shouldStart(trigger, context),
    type: trigger.type,
  };
}

/**
 * Resolves the resolved/effective trigger type after normalization.
 * Unknown types are mapped to a safe fallback so the engine can still
 * reason about them deterministically.
 */
export function resolveTriggerType(type: string): TriggerType {
  switch (type) {
    case 'onLoad':
    case 'inView':
    case 'hover':
    case 'click':
    case 'scroll':
      return type;
    default:
      return 'onLoad';
  }
}

/**
 * inView: the trigger fires when the element's visibility ratio meets the
 * configured threshold (0..1). Default threshold is 0.5.
 */
function resolveVisibilityThreshold(
  threshold: number | undefined,
  visibilityRatio: number
): boolean {
  const t = clamp01(threshold ?? 0.5);
  return visibilityRatio >= t;
}

/**
 * scroll: the trigger fires when the vertical scroll offset meets/exceeds the
 * configured threshold (in CSS px). Default threshold is 0 (fires immediately).
 */
function resolveScrollThreshold(
  threshold: number | undefined,
  scrollY: number
): boolean {
  const t = threshold ?? 0;
  return scrollY >= t;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}
