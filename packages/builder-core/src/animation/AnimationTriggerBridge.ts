/**
 * AnimationTriggerBridge.ts — PM34 Trigger-to-Playback Bridge
 *
 * Connects AnimationTriggerEngine activations to PlaybackController instances.
 * When a trigger state transitions to ACTIVE, the bridge starts playback on the
 * corresponding AnimationPlaybackController.
 * Pure orchestration logic — NO DOM, NO Browser API, NO rAF, NO React.
 */

import { AnimationPlaybackController } from './AnimationPlaybackController';
import type { TriggerEvaluationReport } from './AnimationRuntimePreviewAdapter';

export class AnimationTriggerBridge {
  private readonly _bindings: Map<string, AnimationPlaybackController> = new Map();

  /**
   * Binds a trigger ID to an AnimationPlaybackController instance.
   */
  public bind(triggerId: string, controller: AnimationPlaybackController): void {
    this._bindings.set(triggerId, controller);
  }

  /**
   * Unbinds a trigger ID.
   */
  public unbind(triggerId: string): void {
    this._bindings.delete(triggerId);
  }

  /**
   * Gets the playback controller bound to a trigger ID.
   */
  public getController(triggerId: string): AnimationPlaybackController | undefined {
    return this._bindings.get(triggerId);
  }

  /**
   * Processes a TriggerEngineEvaluationReport. Plays any controllers bound to newly activated triggers.
   */
public handleReport(report: TriggerEvaluationReport): string[] {
    const startedControllerIds: string[] = [];

    for (const triggerId of report.activatedTriggerIds) {
      const controller = this._bindings.get(triggerId);
      if (controller) {
        controller.play();
        startedControllerIds.push(triggerId);
      }
    }

    return startedControllerIds;
  }

  /**
   * Resets all bound controllers to idle state.
   */
  public resetAll(): void {
    for (const controller of this._bindings.values()) {
      controller.reset();
    }
  }

  /**
   * Clears all trigger bindings.
   */
  public clear(): void {
    this._bindings.clear();
  }

  /**
   * List of all bound trigger IDs.
   */
  public get boundTriggerIds(): string[] {
    return Array.from(this._bindings.keys());
  }
}
