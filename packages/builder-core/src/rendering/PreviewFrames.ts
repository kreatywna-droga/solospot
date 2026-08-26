/**
 * PreviewFrames.ts — Sprint S10 Export Rendering
 *
 * Generates key snapshot preview frame collections (e.g. start, mid, end).
 * Pure DTO logic. NO DOM dependencies.
 */

import { AnimationTimeline } from '../animation/AnimationTypes';
import { RenderContext, createRenderContext } from './RenderContext';
import { RenderFrame } from './RenderFrame';
import { RenderGraph } from './RenderGraph';
import { RenderPipeline } from './RenderPipeline';

export interface KeyPreviewFrame {
  readonly percentage: number; // 0..100
  readonly timestampMs: number;
  readonly frame: RenderFrame;
}

export class PreviewFramesGenerator {
  public static generateKeyFrames(
    graph: RenderGraph,
    timelines: ReadonlyArray<AnimationTimeline>,
    durationMs: number,
    percentages = [0, 25, 50, 75, 100]
  ): KeyPreviewFrame[] {
    const pipeline = new RenderPipeline(percentages.length);
    const keyFrames: KeyPreviewFrame[] = [];

    for (const pct of percentages) {
      const clampPct = Math.max(0, Math.min(100, pct));
      const timestampMs = (clampPct / 100) * durationMs;

      const context = createRenderContext({
        timestampMs,
        isExportMode: true,
      });

      const frame = pipeline.render(context, graph, timelines);
      keyFrames.push({
        percentage: clampPct,
        timestampMs,
        frame,
      });
    }

    return keyFrames;
  }
}
