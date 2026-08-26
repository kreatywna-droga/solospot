/**
 * FrameSequence.ts — Sprint S10 Export Rendering
 *
 * Generates discrete frame sequence arrays & metadata for export pipelines.
 * Pure logic. NO DOM dependencies.
 */

import { AnimationTimeline } from '../animation/AnimationTypes';
import { RenderContext, createRenderContext } from './RenderContext';
import { RenderFrame } from './RenderFrame';
import { RenderGraph } from './RenderGraph';
import { RenderPipeline } from './RenderPipeline';

export interface FrameSequenceMetadata {
  readonly startFps: number;
  readonly targetFps: number;
  readonly durationMs: number;
  readonly totalFrames: number;
  readonly width: number;
  readonly height: number;
}

export interface FrameSequencePayload {
  readonly metadata: FrameSequenceMetadata;
  readonly frames: ReadonlyArray<RenderFrame>;
}

export class FrameSequenceGenerator {
  public static generateSequence(
    graph: RenderGraph,
    timelines: ReadonlyArray<AnimationTimeline>,
    durationMs: number,
    fps = 60,
    viewport = { width: 1920, height: 1080, devicePixelRatio: 1.0 }
  ): FrameSequencePayload {
    const totalFrames = Math.max(1, Math.ceil((durationMs / 1000) * fps));
    const stepMs = 1000 / fps;
    const pipeline = new RenderPipeline(totalFrames);
    const frames: RenderFrame[] = [];

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const timestampMs = Math.min(durationMs, frameIndex * stepMs);
      const context = createRenderContext({
        frameIndex,
        timestampMs,
        targetFps: fps,
        viewport,
        isExportMode: true,
      });

      const frame = pipeline.render(context, graph, timelines);
      frames.push(frame);
    }

    return {
      metadata: {
        startFps: fps,
        targetFps: fps,
        durationMs,
        totalFrames,
        width: viewport.width,
        height: viewport.height,
      },
      frames,
    };
  }
}
