/**
 * RenderedFrameExporter.ts — Sprint S11 Rendered Frame Export Bridge
 *
 * Connects S11 visual rendering execution with S10 ExportPipeline and PM41 AnimationExportPipeline.
 * Does NOT create a second export pipeline; delegates sequence generation to S10 ExportPipeline
 * and PM41 AnimationExportPipeline, enhancing export results with compiled/rendered frame data.
 *
 * NO DOM, NO React, NO window direct coupling.
 */

import { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import {
  ExportPipeline as CoreExportPipeline,
  RenderExportJob,
  RenderExportResult,
} from '../../../builder-core/src/rendering/ExportPipeline';
import { RenderingEngine } from '../../../builder-core/src/rendering/RenderingEngine';
import { exportAnimationTimeline, validateExportTimeline } from '../production/AnimationExportPipeline';
import { RenderCommandCompiler } from './RenderCommandCompiler';
import { RenderCommandExecutor } from './RenderCommandExecutor';
import { RendererBackend } from './RendererBackend';
import { RendererCommand } from './RendererCommand';

export interface RenderedFrameExportPackage {
  readonly coreExport: RenderExportResult;
  readonly pm41Export?: ReturnType<typeof exportAnimationTimeline>;
  readonly compiledFrames: ReadonlyArray<{
    readonly frameIndex: number;
    readonly timestampMs: number;
    readonly commands: ReadonlyArray<RendererCommand>;
  }>;
}

export class RenderedFrameExporter {
  public static exportRenderedFrames(
    document: BuilderDocument,
    timelines: ReadonlyArray<AnimationTimeline>,
    job: RenderExportJob,
    backend?: RendererBackend
  ): RenderedFrameExportPackage {
    // 1. Validate & export timeline DTO metadata via PM41 bridge
    let pm41Export: ReturnType<typeof exportAnimationTimeline> | undefined;
    if (timelines.length > 0) {
      const primaryTimeline = timelines[0];
      const validation = validateExportTimeline(primaryTimeline);
      if (validation.isValid) {
        pm41Export = exportAnimationTimeline(primaryTimeline, 'S11VisualExporter');
      }
    }

    // 2. Delegate sequence payload generation to S10 Core ExportPipeline
    const coreExport = CoreExportPipeline.executeExport(document, timelines, job);

    // 3. Compile and optionally execute visual render commands for each frame in sequence
    const engine = new RenderingEngine(document);
    const compiledFrames: Array<{
      frameIndex: number;
      timestampMs: number;
      commands: ReadonlyArray<RendererCommand>;
    }> = [];

    const fps = job.fps ?? 60;
    const frameIntervalMs = 1000 / fps;
    const totalFrames = Math.ceil(job.durationMs / frameIntervalMs);

    for (let i = 0; i < totalFrames; i++) {
      const timestampMs = i * frameIntervalMs;
      const frame = engine.renderFrame(timestampMs, timelines);
      const commands = RenderCommandCompiler.compile(frame);

      if (backend && backend.isInitialized) {
        RenderCommandExecutor.executeCommands(backend, commands, i, timestampMs);
      }

      compiledFrames.push({
        frameIndex: i,
        timestampMs,
        commands,
      });
    }

    return {
      coreExport,
      pm41Export,
      compiledFrames,
    };
  }
}
