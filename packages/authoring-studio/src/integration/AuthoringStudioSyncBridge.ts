/**
 * AuthoringStudioSyncBridge.ts — Sprint S14 Inspector ↔ Canvas ↔ Timeline Sync Bridge
 *
 * Coordinates 2-way reactivity between Inspector, BuilderDocument (SSOT), Timeline, Motion System,
 * RenderingEngine, and CanvasRenderer.
 * Ensures zero duplicate state sources — BuilderDocument remains the sole SSOT.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';

export type SyncEventType =
  | 'DOCUMENT_MUTATED'
  | 'INSPECTOR_PROP_CHANGED'
  | 'CANVAS_GESTURE_TRANSFORM'
  | 'TIMELINE_KEYFRAME_UPDATED'
  | 'PLAYHEAD_MOVED';

export interface SyncEventPayload {
  readonly type: SyncEventType;
  readonly nodeId: string;
  readonly propertyKey?: string;
  readonly value?: unknown;
  readonly timeMs?: number;
}

export type SyncListener = (payload: SyncEventPayload, document: BuilderDocument) => void;

export class AuthoringStudioSyncBridge {
  private document: BuilderDocument;
  private timeline: AnimationTimeline;
  private currentTimeMs: number = 0;
  private readonly listeners: Set<SyncListener> = new Set();

  constructor(document: BuilderDocument, timeline: AnimationTimeline) {
    this.document = document;
    this.timeline = timeline;
  }

  /**
   * Registers a reactive subscriber callback.
   */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Returns current active BuilderDocument SSOT instance.
   */
  public getDocument(): BuilderDocument {
    return this.document;
  }

  /**
   * Returns current active AnimationTimeline instance.
   */
  public getTimeline(): AnimationTimeline {
    return this.timeline;
  }

  /**
   * Returns current playhead time in ms.
   */
  public getCurrentTimeMs(): number {
    return this.currentTimeMs;
  }

  /**
   * Dispatches an update originating from Inspector property edit.
   */
  public notifyInspectorChange(nodeId: string, propertyKey: string, value: unknown): void {
    const payload: SyncEventPayload = {
      type: 'INSPECTOR_PROP_CHANGED',
      nodeId,
      propertyKey,
      value,
      timeMs: this.currentTimeMs,
    };
    this.broadcast(payload);
  }

  /**
   * Dispatches an update originating from Canvas drag gesture (move/scale/rotate).
   */
  public notifyCanvasGestureTransform(nodeId: string, propertyKey: string, value: unknown): void {
    const payload: SyncEventPayload = {
      type: 'CANVAS_GESTURE_TRANSFORM',
      nodeId,
      propertyKey,
      value,
      timeMs: this.currentTimeMs,
    };
    this.broadcast(payload);
  }

  /**
   * Dispatches an update originating from Timeline keyframe authoring.
   */
  public notifyTimelineKeyframeUpdate(nodeId: string, propertyKey: string, value: unknown, timeMs: number): void {
    const payload: SyncEventPayload = {
      type: 'TIMELINE_KEYFRAME_UPDATED',
      nodeId,
      propertyKey,
      value,
      timeMs,
    };
    this.broadcast(payload);
  }

  /**
   * Updates playhead time position and notifies listeners.
   */
  public setPlayheadTime(timeMs: number): void {
    this.currentTimeMs = timeMs;
    const payload: SyncEventPayload = {
      type: 'PLAYHEAD_MOVED',
      nodeId: '',
      timeMs,
    };
    this.broadcast(payload);
  }

  /**
   * Replaces current BuilderDocument SSOT reference.
   */
  public setDocument(newDoc: BuilderDocument): void {
    this.document = newDoc;
    const payload: SyncEventPayload = {
      type: 'DOCUMENT_MUTATED',
      nodeId: '',
    };
    this.broadcast(payload);
  }

  private broadcast(payload: SyncEventPayload): void {
    for (const listener of this.listeners) {
      listener(payload, this.document);
    }
  }
}
