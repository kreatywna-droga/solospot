/**
 * PlaybackOrchestrator.ts — Sprint S12 Timeline Playback Orchestrator
 *
 * Manages playback transport orchestration (Play, Pause, Stop, Seek, Loop,
 * Range, FPS) using TimelinePlaybackSession and PreviewRendererConnector.
 *
 * DECISION-042/046/051: Delegates evaluation strictly to RenderingEngine /
 * PreviewRendererConnector without creating a custom playback engine.
 *
 * NO DOM, NO React, NO window.
 */

import { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import {
  createTimelinePlaybackSession,
  pauseSession,
  playSession,
  seekSession,
  stopSession,
  tickSession,
  TimelinePlaybackSession,
} from '../timeline/TimelinePlaybackSession';
import { PreviewRendererConnector, PreviewRenderResult } from '../rendering/PreviewRendererConnector';
import { PlaybackPerformanceDiagnostics } from './PlaybackPerformanceDiagnostics';

export interface PlaybackRange {
  readonly rangeStartMs: number;
  readonly rangeEndMs: number;
}

export interface PlaybackOrchestratorOptions {
  readonly pageId?: string;
  readonly fps?: number;
  readonly loop?: boolean;
  readonly playbackRange?: PlaybackRange;
}

export class PlaybackOrchestrator {
  private session: TimelinePlaybackSession;
  private connector: PreviewRendererConnector;
  private diagnostics: PlaybackPerformanceDiagnostics;
  private playbackRange?: PlaybackRange;

  constructor(
    document: BuilderDocument,
    connector: PreviewRendererConnector,
    options?: PlaybackOrchestratorOptions
  ) {
    this.connector = connector;
    this.session = createTimelinePlaybackSession({
      fps: options?.fps ?? 60,
      loop: options?.loop ?? false,
    });
    this.playbackRange = options?.playbackRange;
    this.diagnostics = new PlaybackPerformanceDiagnostics(options?.fps ?? 60);
  }

  public selectTimeline(timeline: AnimationTimeline): void {
    this.session = createTimelinePlaybackSession({
      ...this.session,
      selectedTimeline: timeline,
      currentTime: 0,
      status: 'stopped',
    });
  }

  public play(): void {
    this.session = playSession(this.session);
  }

  public pause(): void {
    this.session = pauseSession(this.session);
  }

  public stop(): void {
    this.session = stopSession(this.session);
  }

  public seek(timeMs: number): PreviewRenderResult {
    let targetTime = Math.max(0, timeMs);
    if (this.playbackRange) {
      targetTime = Math.max(
        this.playbackRange.rangeStartMs,
        Math.min(this.playbackRange.rangeEndMs, targetTime)
      );
    }
    this.session = seekSession(this.session, targetTime);
    return this.renderCurrentFrame();
  }

  public setLoop(loop: boolean): void {
    this.session = { ...this.session, loop };
  }

  public setPlaybackRange(range?: PlaybackRange): void {
    this.playbackRange = range;
  }

  public tick(deltaMs: number): PreviewRenderResult {
    const startTimeMs = performance.now ? performance.now() : Date.now();
    const prevTime = this.session.currentTime;
    const nextTime = this.session.status === 'playing' ? prevTime + deltaMs : prevTime;
    this.session = tickSession(this.session, nextTime);

    // Enforce range clamping during loop/tick if set
    if (this.playbackRange && this.session.status === 'playing') {
      if (this.session.currentTime > this.playbackRange.rangeEndMs) {
        if (this.session.loop) {
          this.session = seekSession(this.session, this.playbackRange.rangeStartMs);
        } else {
          this.session = pauseSession(this.session);
          this.session = seekSession(this.session, this.playbackRange.rangeEndMs);
        }
      }
    }

    const renderResult = this.renderCurrentFrame();
    const endTimeMs = performance.now ? performance.now() : Date.now();
    const frameTimeMs = endTimeMs - startTimeMs;
    const targetIntervalMs = 1000 / this.session.fps;

    this.diagnostics.recordFrame({
      frameIndex: renderResult.frameIndex,
      timestampMs: this.session.currentTime,
      frameTimeMs,
      renderTimeMs: frameTimeMs * 0.7,
      isDropped: frameTimeMs > targetIntervalMs * 1.5,
      isCached: renderResult.isCached,
    });

    return renderResult;
  }

  public renderCurrentFrame(): PreviewRenderResult {
    const timelines = this.session.selectedTimeline ? [this.session.selectedTimeline] : [];
    return this.connector.renderPlayheadTime(this.session.currentTime, timelines);
  }

  public getSession(): TimelinePlaybackSession {
    return this.session;
  }

  public getDiagnosticsReport() {
    return this.diagnostics.getReport();
  }

  public updateDocument(doc: BuilderDocument, docRevision?: string): void {
    this.connector.updateDocument(doc, docRevision);
  }
}
