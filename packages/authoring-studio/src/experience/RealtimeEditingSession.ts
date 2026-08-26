/**
 * RealtimeEditingSession.ts — Sprint S12 Real-Time Editing Session Orchestrator
 *
 * Orchestrates live document edits from Inspector/Timeline/Preview controls,
 * propagates changes to BuilderDocument (SSOT), manages HistoryStack (Undo/Redo),
 * and triggers immediate re-renders through CanvasRenderer.
 *
 * Flow: User Action -> Command -> BuilderDocument -> RenderingEngine -> CanvasRenderer -> IMAGE.
 * NO second source of state. NO DOM, NO React, NO window.
 */

import { AnimationTimeline, Keyframe } from '../../../builder-core/src/animation/AnimationTypes';
import { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import { CanvasRenderSurface } from '../rendering/CanvasRenderSurface';
import { PreviewRendererConnector, PreviewRenderResult } from '../rendering/PreviewRendererConnector';
import {
  commitEditingTransaction,
  createEditingHistoryState,
  EditingHistoryState,
  redoEditingTransaction,
  undoEditingTransaction,
} from './EditingHistoryBridge';
import {
  updateKeyframeInTimeline,
  updateNodeOpacity,
  updateNodePosition,
  updateNodeProps,
  updateNodeRotation,
  updateNodeScale,
  updateNodeVisibility,
} from './InteractiveEditCommands';
import { PlaybackOrchestrator, PlaybackRange } from './PlaybackOrchestrator';

export interface RealtimeEditingSessionOptions {
  readonly pageId?: string;
  readonly fps?: number;
  readonly clearColor?: string;
}

export class RealtimeEditingSession {
  private historyState: EditingHistoryState;
  private connector: PreviewRendererConnector;
  private playbackOrchestrator: PlaybackOrchestrator;
  private revisionCounter = 1;

  constructor(
    initialDocument: BuilderDocument,
    surface: CanvasRenderSurface,
    options?: RealtimeEditingSessionOptions
  ) {
    this.historyState = createEditingHistoryState(initialDocument);
    this.connector = new PreviewRendererConnector(initialDocument, surface, {
      pageId: options?.pageId,
      clearColor: options?.clearColor,
    });
    this.playbackOrchestrator = new PlaybackOrchestrator(
      initialDocument,
      this.connector,
      { fps: options?.fps ?? 60 }
    );
  }

  public getDocument(): BuilderDocument {
    return this.historyState.currentDocument;
  }

  public getRevision(): string {
    return `rev_${this.revisionCounter}`;
  }

  // --- Inspector & Canvas Editing Operations (ETAP 1 & 4) ---

  public updateNodeProps(nodeId: string, props: Record<string, unknown>, label: string = 'Update Props'): PreviewRenderResult {
    return this.applyEditTransaction((doc) => updateNodeProps(doc, nodeId, props), label);
  }

  public updateNodePosition(nodeId: string, x: number, y: number): PreviewRenderResult {
    return this.applyEditTransaction((doc) => updateNodePosition(doc, nodeId, x, y), `Move Node ${nodeId}`);
  }

  public updateNodeScale(nodeId: string, width: number, height: number): PreviewRenderResult {
    return this.applyEditTransaction((doc) => updateNodeScale(doc, nodeId, width, height), `Scale Node ${nodeId}`);
  }

  public updateNodeRotation(nodeId: string, rotationDeg: number): PreviewRenderResult {
    return this.applyEditTransaction((doc) => updateNodeRotation(doc, nodeId, rotationDeg), `Rotate Node ${nodeId}`);
  }

  public updateNodeOpacity(nodeId: string, opacity: number): PreviewRenderResult {
    return this.applyEditTransaction((doc) => updateNodeOpacity(doc, nodeId, opacity), `Set Opacity Node ${nodeId}`);
  }

  public updateNodeVisibility(nodeId: string, visible: boolean): PreviewRenderResult {
    return this.applyEditTransaction((doc) => updateNodeVisibility(doc, nodeId, visible), `Toggle Visibility Node ${nodeId}`);
  }

  public updateKeyframe(clipId: string, trackId: string, keyframe: Keyframe): PreviewRenderResult {
    const currentTimeline = this.playbackOrchestrator.getSession().selectedTimeline;
    if (currentTimeline) {
      const updatedTimeline = updateKeyframeInTimeline(currentTimeline, clipId, trackId, keyframe);
      this.playbackOrchestrator.selectTimeline(updatedTimeline);
    }
    return this.playbackOrchestrator.renderCurrentFrame();
  }

  // --- Undo / Redo Operations (ETAP 5) ---

  public undo(): PreviewRenderResult {
    if (!this.historyState.canUndo) {
      return this.playbackOrchestrator.renderCurrentFrame();
    }
    this.historyState = undoEditingTransaction(this.historyState);
    this.revisionCounter++;
    this.playbackOrchestrator.updateDocument(this.historyState.currentDocument, this.getRevision());
    return this.playbackOrchestrator.renderCurrentFrame();
  }

  public redo(): PreviewRenderResult {
    if (!this.historyState.canRedo) {
      return this.playbackOrchestrator.renderCurrentFrame();
    }
    this.historyState = redoEditingTransaction(this.historyState);
    this.revisionCounter++;
    this.playbackOrchestrator.updateDocument(this.historyState.currentDocument, this.getRevision());
    return this.playbackOrchestrator.renderCurrentFrame();
  }

  // --- Playback Controls (ETAP 2 & 3) ---

  public play(): void {
    this.playbackOrchestrator.play();
  }

  public pause(): void {
    this.playbackOrchestrator.pause();
  }

  public stop(): void {
    this.playbackOrchestrator.stop();
  }

  public seek(timeMs: number): PreviewRenderResult {
    return this.playbackOrchestrator.seek(timeMs);
  }

  public selectTimeline(timeline: AnimationTimeline): void {
    this.playbackOrchestrator.selectTimeline(timeline);
  }

  public setPlaybackRange(range?: PlaybackRange): void {
    this.playbackOrchestrator.setPlaybackRange(range);
  }

  public tick(deltaMs: number): PreviewRenderResult {
    return this.playbackOrchestrator.tick(deltaMs);
  }

  public renderCurrentFrame(): PreviewRenderResult {
    return this.playbackOrchestrator.renderCurrentFrame();
  }

  public getHistoryInfo() {
    return {
      canUndo: this.historyState.canUndo,
      canRedo: this.historyState.canRedo,
      stackDepth: this.historyState.historyStack.entries.length,
    };
  }

  public getDiagnosticsReport() {
    return this.playbackOrchestrator.getDiagnosticsReport();
  }

  public destroy(): void {
    this.connector.destroy();
  }

  private applyEditTransaction(
    updater: (doc: BuilderDocument) => BuilderDocument,
    label: string
  ): PreviewRenderResult {
    this.historyState = commitEditingTransaction(this.historyState, updater, label);
    this.revisionCounter++;
    this.playbackOrchestrator.updateDocument(this.historyState.currentDocument, this.getRevision());
    return this.playbackOrchestrator.renderCurrentFrame();
  }
}
