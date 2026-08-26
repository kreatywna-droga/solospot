/**
 * AnimationRuntimePreviewAdapter.ts — PM34 Runtime Preview Adapter
 *
 * Connects preview trigger messages to the flat PM33 AnimationTriggerEngine
 * and AnimationTriggerContext. Receives JSON preview messages, updates the
 * serializable context, evaluates all registered triggers, and reports active
 * triggers so the bridge can start playback.
 *
 * NO DOM, NO Browser API, NO window, NO document, NO React, NO rAF.
 */

import { createTriggerContext, type AnimationTriggerContext } from './AnimationTriggerContext';
import { AnimationTriggerEngine } from './AnimationTriggerEngine';
import { isTriggerSatisfied, type TriggerState } from './AnimationTriggerState';
import type { AnimationTrigger } from './AnimationTypes';
import type { PreviewTriggerMessage } from './AnimationPreviewContract';

/**
 * A single trigger evaluation result produced by the adapter (PM34-level).
 * Carries the trigger ID in addition to the PM33 engine result.
 */
export interface AdapterTriggerEvaluationResult {
  readonly triggerId: string;
  readonly shouldStart: boolean;
  readonly satisfied: boolean;
  readonly state: TriggerState;
}

/**
 * Aggregate evaluation report produced by the adapter after processing a
 * message. Mirrors the aggregation shape the bridge consumes.
 */
export interface TriggerEvaluationReport {
  readonly results: ReadonlyArray<AdapterTriggerEvaluationResult>;
  readonly activatedTriggerIds: ReadonlyArray<string>;
  readonly states: Readonly<Record<string, TriggerState>>;
  readonly allSatisfied: boolean;
  readonly anySatisfied: boolean;
}

export interface AdapterProcessingResult {
  context: AnimationTriggerContext;
  evaluationReport: TriggerEvaluationReport;
}

export class AnimationRuntimePreviewAdapter {
  private readonly _engine: AnimationTriggerEngine;
  private readonly _triggers = new Map<string, AnimationTrigger>();
  private _context: AnimationTriggerContext;

  constructor(engine: AnimationTriggerEngine) {
    this._engine = engine;
    this._context = createTriggerContext();
  }

  get context(): AnimationTriggerContext {
    return this._context;
  }

  get engine(): AnimationTriggerEngine {
    return this._engine;
  }

  /**
   * Registers a trigger definition under an id. The adapter evaluates every
   * registered trigger against the current context on each message.
   */
  public registerTrigger(triggerId: string, trigger: AnimationTrigger): void {
    this._triggers.set(triggerId, trigger);
  }

  /**
   * Processes an incoming preview message, immutably updates the flat context,
   * evaluates all registered triggers, and returns the processing result.
   */
  public processMessage(message: PreviewTriggerMessage): AdapterProcessingResult {
    this._context = createTriggerContext({
      ...this._context,
      ...this.mapMessageToContext(message),
    });
    return this.evaluate();
  }

  /**
   * Directly sets the current (flat) context snapshot and runs evaluation.
   */
  public setContext(context: AnimationTriggerContext): AdapterProcessingResult {
    this._context = context;
    return this.evaluate();
  }

  /**
   * Resets engine trigger states and resets context to the safe default.
   */
  public reset(): void {
    this._engine.reset();
    this._context = createTriggerContext();
  }

  private evaluate(): AdapterProcessingResult {
    const results: AdapterTriggerEvaluationResult[] = [];
    const states: Record<string, TriggerState> = {};
    const activatedTriggerIds: string[] = [];

    for (const [triggerId, trigger] of this._triggers) {
      const decision = this._engine.evaluate(trigger, this._context);
      const shouldStart = decision.shouldStart;
      if (shouldStart) {
        this._engine.transition(triggerId, 'ACTIVE');
      }
      const state = this._engine.stateOf(triggerId);
      const satisfied = isTriggerSatisfied(state);
      states[triggerId] = state;
      results.push({ triggerId, shouldStart, satisfied, state });
      if (shouldStart) {
        activatedTriggerIds.push(triggerId);
      }
    }

    const evaluationReport: TriggerEvaluationReport = {
      results,
      activatedTriggerIds,
      states,
      allSatisfied: results.length > 0 && results.every((r) => r.satisfied),
      anySatisfied: results.some((r) => r.satisfied),
    };

    return {
      context: this._context,
      evaluationReport,
    };
  }

  private mapMessageToContext(
    message: PreviewTriggerMessage
  ): Partial<AnimationTriggerContext> {
    switch (message.type) {
      case 'SCROLL_EVENT':
        return { scrollY: message.scrollY };
      case 'HOVER_EVENT':
        return { isHovered: message.isHovered };
      case 'CLICK_EVENT':
        return { isClicked: message.isClicked };
      case 'INTERSECTION_EVENT':
        return { visibilityRatio: message.visibilityRatio };
      case 'VIEWPORT_RESIZE_EVENT':
        return { viewportWidth: message.width, viewportHeight: message.height };
    }
  }
}
