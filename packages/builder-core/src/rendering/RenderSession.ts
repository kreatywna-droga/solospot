/**
 * RenderSession.ts — Sprint S10 Real Rendering Engine Core
 *
 * Stateful session managing document reference, context, cache, and metrics.
 * Deterministic and pure logic. No DOM or browser calls.
 */

import { BuilderDocument } from '../BuilderDocument';
import { RenderContext, createRenderContext } from './RenderContext';
import { RenderFrame } from './RenderFrame';
import { RenderGraph, buildRenderGraph } from './RenderGraph';

export interface RenderSessionOptions {
  readonly pageId?: string;
  readonly contextOverrides?: Partial<RenderContext>;
  readonly maxCacheSize?: number;
}

export class RenderSession {
  private document: BuilderDocument;
  private context: RenderContext;
  private graph: RenderGraph;
  private cachedFrames: Map<number, RenderFrame>;
  private maxCacheSize: number;
  private activePageId?: string;

  constructor(document: BuilderDocument, options?: RenderSessionOptions) {
    this.document = document;
    this.activePageId = options?.pageId;
    this.context = createRenderContext(options?.contextOverrides);
    this.graph = buildRenderGraph(document, this.activePageId);
    this.cachedFrames = new Map();
    this.maxCacheSize = options?.maxCacheSize ?? 300; // ~5 seconds at 60 FPS
  }

  public getDocument(): BuilderDocument {
    return this.document;
  }

  public getContext(): RenderContext {
    return this.context;
  }

  public getGraph(): RenderGraph {
    return this.graph;
  }

  public setContext(overrides: Partial<RenderContext>): void {
    this.context = createRenderContext({
      ...this.context,
      ...overrides,
    });
  }

  public updateDocument(document: BuilderDocument): void {
    this.document = document;
    this.graph = buildRenderGraph(document, this.activePageId);
    this.clearCache();
  }

  public switchPage(pageId: string): void {
    this.activePageId = pageId;
    this.graph = buildRenderGraph(this.document, pageId);
    this.clearCache();
  }

  public getCachedFrame(frameIndex: number): RenderFrame | undefined {
    return this.cachedFrames.get(frameIndex);
  }

  public cacheFrame(frameIndex: number, frame: RenderFrame): void {
    if (this.cachedFrames.size >= this.maxCacheSize) {
      const oldestKey = this.cachedFrames.keys().next().value;
      if (oldestKey !== undefined) {
        this.cachedFrames.delete(oldestKey);
      }
    }
    this.cachedFrames.set(frameIndex, frame);
  }

  public clearCache(): void {
    this.cachedFrames.clear();
  }

  public getCacheCount(): number {
    return this.cachedFrames.size;
  }
}
