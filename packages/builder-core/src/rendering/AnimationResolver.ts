/**
 * AnimationResolver.ts — Sprint S10 Timeline Evaluation
 *
 * Maps document timelines & clips into active animated node property trees.
 * Pure DTO resolver. NO DOM, NO UI components.
 */

import { AnimationTimeline } from '../animation/AnimationTypes';
import { TimelineEvaluator } from './TimelineEvaluator';

export class AnimationResolver {
  public static resolveDocumentAnimations(
    timelines: ReadonlyArray<AnimationTimeline>,
    timestampMs: number
  ): Map<string, Record<string, unknown>> {
    const nodeAnimationsMap = new Map<string, Record<string, unknown>>();

    for (const timeline of timelines) {
      if (!timeline.targetNodeId) continue;

      const evalResult = TimelineEvaluator.evaluateTimeline(timeline, timestampMs);

      const existing = nodeAnimationsMap.get(timeline.targetNodeId) ?? {};
      nodeAnimationsMap.set(timeline.targetNodeId, {
        ...existing,
        ...evalResult.propertyMap,
      });
    }

    return nodeAnimationsMap;
  }
}
