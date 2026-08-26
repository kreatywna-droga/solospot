/**
 * KeyframeDragPreview.ts — PM38 Keyframe Drag Preview (ETAP 3)
 *
 * Facilitates real-time preview updating during keyframe repositioning/dragging.
 *
 * Flow:
 *   Keyframe Drag (time offset change)
 *   → Mutates BuilderDocument (SSOT)
 *   → Evaluates updated AnimationTimeline via RuntimeBridge
 *   → Dispatches preview frame
 *
 * Operates without pausing active session.
 *
 * DECISION-055: BuilderDocument remains Single Source of Truth (SSOT).
 * NO DOM, NO React, NO requestAnimationFrame.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { RuntimeFrameBatch, RuntimeState } from '../../../builder-core/src/animation/AnimationRuntimeTypes';
import { moveKeyframe } from '../timeline/timelineDocumentBinding';
import { inspectNodeAnimation } from '../inspector/animationDocumentBinding';
import type { ScrubbingRuntimeBridge } from './LiveScrubbingEngine';

export interface KeyframeDragOptions {
  runtimeBridge: ScrubbingRuntimeBridge;
}

export interface KeyframeDragResult {
  readonly updatedDoc: BuilderDocument;
  readonly evaluatedFrame: RuntimeFrameBatch | null;
  readonly activeKeyframeId: string;
  readonly newTimeOffset: number;
}

export class KeyframeDragPreview {
  private readonly _runtimeBridge: ScrubbingRuntimeBridge;

  constructor(options: KeyframeDragOptions) {
    this._runtimeBridge = options.runtimeBridge;
  }

  /**
   * Processes a keyframe drag step: moves keyframe in document immutably, re-evaluates frame via RuntimeBridge,
   * and returns updated document + evaluated frame batch.
   */
  updateKeyframeTime(
    doc: BuilderDocument,
    nodeId: string,
    clipId: string,
    trackId: string,
    keyframeId: string,
    newTimeOffset: number,
    evalTimeMs?: number
  ): KeyframeDragResult {
    // 1. Immutable update in BuilderDocument (SSOT)
    const updatedDoc = moveKeyframe(doc, nodeId, clipId, trackId, keyframeId, newTimeOffset);

    // 2. Extract updated AnimationTimeline
    const timeline = inspectNodeAnimation(updatedDoc, nodeId);

    // 3. Evaluate frame at given time (defaulting to keyframe offset time)
    const timeToEval = evalTimeMs ?? Math.max(0, newTimeOffset);
    let evaluatedFrame: RuntimeFrameBatch | null = null;

    if (timeline) {
      const duration = timeline.clips
        ? Math.max(0, ...timeline.clips.map((c) => c.delay + c.duration))
        : 0;
      const runtimeState: RuntimeState = {
        status: 'paused',
        currentTime: timeToEval,
        duration,
        speed: timeline.playback?.speed ?? 1,
        loop: timeline.playback?.loop ?? false,
        direction: timeline.playback?.direction === 'reverse' || timeline.playback?.direction === 'alternate' || timeline.playback?.direction === 'alternate-reverse' ? 'reverse' : 'normal',
      };
      evaluatedFrame = this._runtimeBridge.evaluateFrame(timeline, runtimeState, timeToEval);
    }

    return {
      updatedDoc,
      evaluatedFrame,
      activeKeyframeId: keyframeId,
      newTimeOffset,
    };
  }
}
