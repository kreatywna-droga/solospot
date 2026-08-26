/**
 * RenderPipeline.ts — Sprint S10 Rendering Pipeline
 *
 * Multi-stage rendering pipeline executing timeline evaluation, scene composition,
 * frame caching, and dirty region tracking.
 * Pure logic. NO DOM dependencies.
 */

import { AnimationTimeline } from '../animation/AnimationTypes';
import { FrameCache } from './FrameCache';
import { FrameRenderer } from './FrameRenderer';
import { RenderContext } from './RenderContext';
import { RenderFrame } from './RenderFrame';
import { RenderGraph } from './RenderGraph';

export class RenderPipeline {
  private cache: FrameCache;
  private previousFrame?: RenderFrame;

  constructor(cacheSize = 300) {
    this.cache = new FrameCache({ maxEntries: cacheSize });
  }

  public render(
    context: RenderContext,
    graph: RenderGraph,
    timelines: ReadonlyArray<AnimationTimeline>
  ): RenderFrame {
    const cacheKey = `${context.timestampMs}_${context.frameIndex}_${graph.totalNodes}`;

    if (context.quality.enableCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const frame = FrameRenderer.renderFrame(context, graph, timelines, this.previousFrame);

    if (context.quality.enableCache) {
      this.cache.set(cacheKey, frame);
    }

    this.previousFrame = frame;
    return frame;
  }

  public getCache(): FrameCache {
    return this.cache;
  }

  public reset(): void {
    this.cache.clear();
    this.previousFrame = undefined;
  }
}
