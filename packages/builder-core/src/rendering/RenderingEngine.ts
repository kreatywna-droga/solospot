/**
 * RenderingEngine.ts — Sprint S10 Real Rendering Engine Core Orchestrator
 *
 * High-level rendering engine orchestrator for builder-core.
 * Deterministic frame rendering, session management, export pipelines,
 * and performance profiling.
 * Pure logic. NO React, NO Browser API, NO DOM.
 */

import { AnimationTimeline } from '../animation/AnimationTypes';
import { BuilderDocument } from '../BuilderDocument';
import { ExportPipeline, RenderExportJob, RenderExportResult } from './ExportPipeline';
import { PerformanceProfiler } from './PerformanceProfiler';
import { RenderContext } from './RenderContext';
import { RenderFrame } from './RenderFrame';
import { RenderPipeline } from './RenderPipeline';
import { RenderSession } from './RenderSession';

export interface RenderingEngineOptions {
  readonly pageId?: string;
  readonly contextOverrides?: Partial<RenderContext>;
  readonly maxCacheEntries?: number;
}

export class RenderingEngine {
  private session: RenderSession;
  private pipeline: RenderPipeline;
  private profiler: PerformanceProfiler;

  constructor(document: BuilderDocument, options?: RenderingEngineOptions) {
    this.session = new RenderSession(document, options);
    this.pipeline = new RenderPipeline(options?.maxCacheEntries ?? 300);
    this.profiler = new PerformanceProfiler();
  }

  public renderFrame(
    timestampMs: number,
    timelines: ReadonlyArray<AnimationTimeline> = []
  ): RenderFrame {
    this.session.setContext({ timestampMs });

    const context = this.session.getContext();
    const graph = this.session.getGraph();

    const frame = this.pipeline.render(context, graph, timelines);

    this.session.cacheFrame(frame.frameIndex, frame);

    this.profiler.recordFrame({
      frameIndex: frame.frameIndex,
      timestampMs: frame.timestampMs,
      totalRenderTimeMs: frame.renderTimeMs,
      evaluationTimeMs: frame.renderTimeMs * 0.4,
      compositionTimeMs: frame.renderTimeMs * 0.6,
      nodeCount: frame.nodes.size,
      dirtyRegionCount: frame.dirtyRegions.length,
      isCached: frame.isCached,
    });

    return frame;
  }

  public exportAnimation(
    timelines: ReadonlyArray<AnimationTimeline>,
    job: RenderExportJob
  ): RenderExportResult {
    return ExportPipeline.executeExport(this.session.getDocument(), timelines, job);
  }

  public getSession(): RenderSession {
    return this.session;
  }

  public getProfiler(): PerformanceProfiler {
    return this.profiler;
  }

  public updateDocument(doc: BuilderDocument): void {
    this.session.updateDocument(doc);
    this.pipeline.reset();
  }
}
