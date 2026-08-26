/**
 * ExportPipeline.ts — Sprint S10 Export Rendering
 *
 * Render → Export Pipeline orchestrator generating frame sequences, sprite sheets,
 * preview snapshots, and thumbnail poster frames.
 * Pure DTO export generator. NO DOM or React dependencies.
 */

import { AnimationTimeline } from '../animation/AnimationTypes';
import { BuilderDocument } from '../BuilderDocument';
import { FrameSequenceGenerator, FrameSequencePayload } from './FrameSequence';
import { PreviewFramesGenerator, KeyPreviewFrame } from './PreviewFrames';
import { buildRenderGraph } from './RenderGraph';
import { SpriteSheetGenerator, SpriteSheetMetadata } from './SpriteSheets';
import { ThumbnailRenderer } from './ThumbnailRenderer';
import { RenderFrame } from './RenderFrame';

export interface RenderExportJob {
  readonly pageId?: string;
  readonly durationMs: number;
  readonly fps?: number;
  readonly width?: number;
  readonly height?: number;
  readonly includeSpriteSheet?: boolean;
  readonly includePreviewFrames?: boolean;
}

export interface RenderExportResult {
  readonly sequence: FrameSequencePayload;
  readonly thumbnail: RenderFrame;
  readonly spriteSheet?: SpriteSheetMetadata;
  readonly previewFrames?: ReadonlyArray<KeyPreviewFrame>;
}

export class ExportPipeline {
  public static executeExport(
    document: BuilderDocument,
    timelines: ReadonlyArray<AnimationTimeline>,
    job: RenderExportJob
  ): RenderExportResult {
    const graph = buildRenderGraph(document, job.pageId);
    const fps = job.fps ?? 60;
    const width = job.width ?? 1920;
    const height = job.height ?? 1080;

    // 1. Frame sequence payload
    const sequence = FrameSequenceGenerator.generateSequence(
      graph,
      timelines,
      job.durationMs,
      fps,
      { width, height, devicePixelRatio: 1.0 }
    );

    // 2. Poster thumbnail (at t=0 or mid)
    const thumbnail = ThumbnailRenderer.renderThumbnail(graph, timelines, {
      timestampMs: 0,
      width: Math.floor(width / 4),
      height: Math.floor(height / 4),
    });

    // 3. Optional SpriteSheet metadata
    let spriteSheet: SpriteSheetMetadata | undefined;
    if (job.includeSpriteSheet) {
      spriteSheet = SpriteSheetGenerator.calculateMetadata(
        sequence.metadata.totalFrames,
        width,
        height
      );
    }

    // 4. Optional Preview frames
    let previewFrames: KeyPreviewFrame[] | undefined;
    if (job.includePreviewFrames) {
      previewFrames = PreviewFramesGenerator.generateKeyFrames(
        graph,
        timelines,
        job.durationMs
      );
    }

    return {
      sequence,
      thumbnail,
      spriteSheet,
      previewFrames,
    };
  }
}
