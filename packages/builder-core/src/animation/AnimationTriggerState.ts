/**
 * AnimationTriggerState.ts — PM33 Trigger Runtime State
 *
 * Pure runtime state model for animation triggers. Represents the CURRENT
 * lifecycle status of a trigger at a given point in time.
 *
 * This is deliberately separate from the trigger *definition* (`AnimationTrigger`
 * in AnimationTypes.ts) — definition is immutable config, state is transient
 * runtime. Keeping them apart allows PM34+ to attach multiple triggers to a
 * single animation and track each one independently.
 *
 * NO DOM, NO Browser API, NO requestAnimationFrame. State is a plain,
 * serializable enum + maps.
 */

/**
 * Lifecycle status of a trigger.
 *
 *   ACTIVE   — the trigger is currently satisfied / firing.
 *   WAITING  — the trigger is armed but its condition is not yet met.
 *   FINISHED — the trigger has already fired and should not re-fire (one-shot).
 *   PAUSED   — evaluation is temporarily suspended (e.g. animation paused).
 */
export type TriggerState = 'ACTIVE' | 'WAITING' | 'FINISHED' | 'PAUSED';

/**
 * A map of trigger states keyed by trigger type (or arbitrary trigger id).
 * Used to track multiple triggers on one animation.
 */
export type TriggerStateMap = Readonly<Partial<Record<string, TriggerState>>>;

/**
 * Creates the default (empty) trigger state map.
 */
export function createTriggerStateMap(): TriggerStateMap {
  return {};
}

/**
 * Creates a single trigger state entry.
 *
 * @param key  trigger key (type or trigger id)
 * @param state initial lifecycle status (defaults to WAITING)
 */
export function createTriggerState(
  key: string,
  state: TriggerState = 'WAITING'
): Readonly<Record<string, TriggerState>> {
  return { [key]: state };
}

/**
 * Transitions a trigger state map immutably. Returns a NEW map; never mutates
 * the input. Used by the trigger engine to advance lifecycle deterministically.
 */
export function transitionTriggerState(
  map: TriggerStateMap,
  key: string,
  next: TriggerState
): TriggerStateMap {
  return { ...map, [key]: next };
}

/**
 * Returns the current state for a key, defaulting to `WAITING` when absent.
 */
export function getTriggerState(
  map: TriggerStateMap,
  key: string
): TriggerState {
  return map[key] ?? 'WAITING';
}

/**
 * Whether a trigger state is considered "satisfied" (i.e. animation may start).
 * Only ACTIVE produces a positive answer — WAITING/PAUSED/FINISHED do not.
 */
export function isTriggerSatisfied(state: TriggerState): boolean {
  return state === 'ACTIVE';
}
