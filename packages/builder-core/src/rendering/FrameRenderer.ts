/**
 * FrameRenderer.ts — Sprint S10 Rendering Pipeline
 *
 * Single frame evaluation logic orchestrator.
 * Pure logic. NO React, NO Browser API.
 */

import { AnimationTimeline } from '../animation/AnimationTypes';
import { AnimationResolver } from './AnimationResolver';
import { RenderContext } from './RenderContext';
import { RenderFrame, RenderNodeState } from './RenderFrame';
import { RenderGraph } from './RenderGraph';
import { SceneComposer } from './SceneComposer';
import { DirtyRegionTracker } from './DirtyRegionTracker';

export class FrameRenderer {
  public static renderFrame(
    context: RenderContext,
    graph: RenderGraph,
    timelines: ReadonlyArray<AnimationTimeline>,
    previousFrame?: RenderFrame
  ): RenderFrame {
    const startTime = performance.now();

    // 1. Evaluate timelines at context timestamp
    const animatedPropsMap = AnimationResolver.resolveDocumentAnimations(timelines, context.timestampMs);

    // 2. Compose scene
    const previousNodes = previousFrame?.nodes ? new Map(previousFrame.nodes) : undefined;
    const composed = SceneComposer.composeScene(graph, animatedPropsMap, previousNodes);

    // 3. Compute dirty regions
    const dirtyRegions = context.quality.enableDirtyRegions
      ? DirtyRegionTracker.computeDirtyRegions(composed.nodes, previousNodes)
      : [];

    const endTime = performance.now();

    return {
      id: `frame_${context.frameIndex}_${context.timestampMs}`,
      contextId: context.id,
      frameIndex: context.frameIndex,
      timestampMs: context.timestampMs,
      renderTimeMs: Math.max(0, endTime - startTime),
      nodes: composed.nodes,
      nodeOrder: composed.nodeOrder,
      dirtyRegions,
      isCached: false,
    };
  }
}
