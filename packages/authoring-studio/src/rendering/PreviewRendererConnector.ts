/**
 * PreviewRendererConnector.ts — Sprint S11 Preview Integration Connector
 *
 * Connects Preview UI / Timeline playhead events to S10 RenderingEngine,
 * S11 RenderCommandCompiler, S11 RenderCache, and CanvasRenderer backend.
 *
 * Flow: time -> RenderingEngine -> RenderFrame -> RenderCache -> CanvasRenderer -> Canvas
 * Pure connector logic without duplicating timeline evaluation.
 */

import { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import { PreviewFrameMessage, PreviewRenderingAdapter } from '../../../builder-core/src/rendering/PreviewRenderingAdapter';
import { RenderingEngine } from '../../../builder-core/src/rendering/RenderingEngine';
import { CanvasRenderer } from './CanvasRenderer';
import { CanvasRenderSurface } from './CanvasRenderSurface';
import { RenderCache } from './RenderCache';
import { RenderCommandCompiler } from './RenderCommandCompiler';
import { RenderCommandExecutor } from './RenderCommandExecutor';
import { RendererCommand } from './RendererCommand';

export interface PreviewConnectorOptions {
  readonly pageId?: string;
  readonly clearColor?: string;
  readonly enableCache?: boolean;
}

export interface PreviewRenderResult {
  readonly frameIndex: number;
  readonly timestampMs: number;
  readonly commands: ReadonlyArray<RendererCommand>;
  readonly isCached: boolean;
  readonly message: PreviewFrameMessage;
}

export class PreviewRendererConnector {
  private engine: RenderingEngine;
  private renderer: CanvasRenderer;
  private surface: CanvasRenderSurface;
  private cache: RenderCache;
  private currentDocRevision: string = 'rev_1';

  constructor(
    document: BuilderDocument,
    surface: CanvasRenderSurface,
    options?: PreviewConnectorOptions
  ) {
    this.engine = new RenderingEngine(document, { pageId: options?.pageId });
    this.surface = surface;
    this.renderer = new CanvasRenderer();
    this.renderer.initialize(surface);
    this.cache = new RenderCache(150);
  }

  public updateDocument(doc: BuilderDocument, docRevision?: string): void {
    this.engine.updateDocument(doc);
    if (docRevision && docRevision !== this.currentDocRevision) {
      this.currentDocRevision = docRevision;
      this.cache.invalidateRevision(docRevision);
    }
  }

  public renderPlayheadTime(
    timestampMs: number,
    timelines: ReadonlyArray<AnimationTimeline> = [],
    options?: PreviewConnectorOptions
  ): PreviewRenderResult {
    const fps = 60;
    const frameIndex = Math.floor((timestampMs / 1000) * fps);

    const timelineHash = timelines.map((t) => `${t.id}:${t.clips.length}`).join(',');
    const cacheKey = {
      frameIndex,
      timestampMs,
      docRevision: this.currentDocRevision,
      width: this.surface.width,
      height: this.surface.height,
      devicePixelRatio: this.surface.devicePixelRatio,
      pageId: options?.pageId,
      stateHash: timelineHash || 'notimeline',
    };

    let commands: ReadonlyArray<RendererCommand> | undefined;
    let isCached = false;

    if (options?.enableCache !== false) {
      commands = this.cache.get(cacheKey);
    }

    let frame;
    if (commands) {
      isCached = true;
      frame = this.engine.renderFrame(timestampMs, timelines);
    } else {
      frame = this.engine.renderFrame(timestampMs, timelines);
      commands = RenderCommandCompiler.compile(frame, { clearColor: options?.clearColor });
      if (options?.enableCache !== false) {
        this.cache.set(cacheKey, commands);
      }
    }

    // Execute compiled commands on CanvasRenderer backend
    RenderCommandExecutor.executeCommands(this.renderer, commands, frameIndex, timestampMs);

    // Create DTO preview message for PM38 UI sync
    const message = PreviewRenderingAdapter.createPreviewFrameMessage(frame);

    return {
      frameIndex,
      timestampMs,
      commands,
      isCached,
      message,
    };
  }

  public getRenderer(): CanvasRenderer {
    return this.renderer;
  }

  public getSurface(): CanvasRenderSurface {
    return this.surface;
  }

  public getCacheStats() {
    return this.cache.getStats();
  }

  public destroy(): void {
    this.cache.clear();
    this.renderer.destroy();
  }
}
