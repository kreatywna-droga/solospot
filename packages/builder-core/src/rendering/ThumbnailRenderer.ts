/**
 * ThumbnailRenderer.ts — Sprint S10 Export Rendering
 *
 * Renders single-frame poster thumbnails at specific timestamps or poster positions.
 * Pure logic. NO DOM dependencies.
 */

import { AnimationTimeline } from '../animation/AnimationTypes';
import { RenderContext, createRenderContext } from './RenderContext';
import { RenderFrame } from './RenderFrame';
import { RenderGraph } from './RenderGraph';
import { RenderPipeline } from './RenderPipeline';

export interface ThumbnailRenderOptions {
  readonly timestampMs?: number;
  readonly width?: number;
  readonly height?: number;
}

export class ThumbnailRenderer {
  public static renderThumbnail(
    graph: RenderGraph,
    timelines: ReadonlyArray<AnimationTimeline>,
    options?: ThumbnailRenderOptions
  ): RenderFrame {
    const timestampMs = options?.timestampMs ?? 0;
    const width = options?.width ?? 320;
    const height = options?.height ?? 180;

    const pipeline = new RenderPipeline(1);
    const context = createRenderContext({
      timestampMs,
      viewport: { width, height, devicePixelRatio: 1.0 },
      isExportMode: true,
    });

    return pipeline.render(context, graph, timelines);
  }
}
