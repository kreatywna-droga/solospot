/**
 * PreviewRuntimeCoordinator.ts — PM38 Preview Runtime Coordinator (ETAP 5 & ETAP 6)
 *
 * DECISION-053: PreviewRuntimeCoordinator jest jedynym koordynatorem synchronizacji Timeline ↔ Preview.
 * DECISION-056: Cała komunikacja między modułami odbywa się przez Dependency Injection; zakaz singletonów.
 *
 * Pure orchestrator coordinating real-time animation preview rendering:
 *   - Playhead synchronization (Timeline ↔ Preview)
 *   - Live playhead scrubbing frame evaluation via RuntimeBridge
 *   - Keyframe drag preview re-evaluation
 *   - Selection synchronization (Timeline ↔ Inspector ↔ Preview)
 *
 * ZERO Playback execution logic.
 * ZERO Browser API, ZERO DOM, ZERO requestAnimationFrame.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import type { RuntimeFrameBatch } from '../../../builder-core/src/animation/AnimationRuntimeTypes';
import type { PreviewTriggerMessage } from '../../../builder-core/src/animation/AnimationPreviewContract';

import {
  type TimelinePlaybackSession,
  seekSession,
  playSession,
  pauseSession,
  stopSession,
} from '../timeline/TimelinePlaybackSession';

import {
  type PlayheadSyncState,
  createPlayheadSyncState,
  syncTimelinePlayheadToPreview,
  syncPreviewPlayheadToTimeline,
} from './PreviewPlayheadSync';

import {
  LiveScrubbingEngine,
  type ScrubbingRuntimeBridge,
  type LiveScrubbingResult,
} from './LiveScrubbingEngine';

import {
  KeyframeDragPreview,
  type KeyframeDragResult,
} from './KeyframeDragPreview';

import {
  type TriSelectionState,
  createTriSelectionState,
  syncPreviewSelectionToStudio,
  syncTimelineSelectionToPreview,
  syncInspectorSelectionToPreview,
} from './PreviewSelectionSync';

import type { TimelineSelection } from '../timeline/TimelineSelection';

export interface PreviewAdapterSubscriber {
  processMessage(message: PreviewTriggerMessage): unknown;
}

export interface PreviewCoordinatorDependencies {
  /** Playback Session instance. */
  session: TimelinePlaybackSession;
  /** PM32 Runtime Bridge instance (or structural duck-type interface). */
  runtimeBridge: ScrubbingRuntimeBridge;
  /** PM34 Preview Adapter (optional). */
  previewAdapter?: PreviewAdapterSubscriber | null;
  /** BuilderDocument SSOT reference. */
  document: BuilderDocument;
}

export class PreviewRuntimeCoordinator {
  private _session: TimelinePlaybackSession;
  private _document: BuilderDocument;
  private readonly _runtimeBridge: ScrubbingRuntimeBridge;
  private readonly _previewAdapter: PreviewAdapterSubscriber | null;

  private _playheadSyncState: PlayheadSyncState = createPlayheadSyncState();
  private _selectionSyncState: TriSelectionState = createTriSelectionState();

  private readonly _scrubbingEngine: LiveScrubbingEngine;
  private readonly _keyframeDragPreview: KeyframeDragPreview;

  constructor(deps: PreviewCoordinatorDependencies) {
    // DECISION-056: Strict Dependency Injection
    this._session = deps.session;
    this._document = deps.document;
    this._runtimeBridge = deps.runtimeBridge;
    this._previewAdapter = deps.previewAdapter ?? null;

    this._scrubbingEngine = new LiveScrubbingEngine({ runtimeBridge: this._runtimeBridge });
    this._keyframeDragPreview = new KeyframeDragPreview({ runtimeBridge: this._runtimeBridge });
  }

  get session(): TimelinePlaybackSession {
    return this._session;
  }

  get document(): BuilderDocument {
    return this._document;
  }

  get playheadSyncState(): PlayheadSyncState {
    return this._playheadSyncState;
  }

  get selectionSyncState(): TriSelectionState {
    return this._selectionSyncState;
  }

  get scrubbingEngine(): LiveScrubbingEngine {
    return this._scrubbingEngine;
  }

  /**
   * Updates current BuilderDocument reference (SSOT update).
   */
  updateDocument(doc: BuilderDocument): void {
    this._document = doc;
  }

  /**
   * Synchronizes playhead from Timeline to Preview canvas.
   */
  syncTimelinePlayhead(targetTimeMs: number): RuntimeFrameBatch | null {
    const { nextSyncState, updatedSession } = syncTimelinePlayheadToPreview(
      this._playheadSyncState,
      this._session,
      targetTimeMs
    );

    this._playheadSyncState = nextSyncState;
    this._session = updatedSession;

    return this.evaluateCurrentFrame();
  }

  /**
   * Synchronizes playhead from Preview canvas/clock to Timeline.
   */
  syncPreviewPlayhead(previewTimeMs: number): RuntimeFrameBatch | null {
    const { nextSyncState, updatedSession } = syncPreviewPlayheadToTimeline(
      this._playheadSyncState,
      this._session,
      previewTimeMs
    );

    this._playheadSyncState = nextSyncState;
    this._session = updatedSession;

    return this.evaluateCurrentFrame();
  }

  /**
   * Live playhead scrubbing evaluation.
   */
  scrubTo(timeMs: number): LiveScrubbingResult {
    this._session = seekSession(this._session, timeMs);
    this._playheadSyncState = {
      ...this._playheadSyncState,
      currentTime: Math.max(0, timeMs),
      lastSource: 'timeline',
    };
    return this._scrubbingEngine.scrubTo(
      this._session.selectedTimeline,
      timeMs,
      {
        status: this._session.status,
        duration: this._session.duration,
        loop: this._session.loop,
      }
    );
  }

  /**
   * Real-time keyframe drag re-evaluation.
   */
  dragKeyframe(
    nodeId: string,
    clipId: string,
    trackId: string,
    keyframeId: string,
    newTimeOffset: number
  ): KeyframeDragResult {
    const result = this._keyframeDragPreview.updateKeyframeTime(
      this._document,
      nodeId,
      clipId,
      trackId,
      keyframeId,
      newTimeOffset,
      this._session.currentTime
    );

    this._document = result.updatedDoc;
    return result;
  }

  /**
   * Tri-directional selection sync (Preview Element Click).
   */
  selectFromPreview(nodeId: string): TimelineSelection {
    const { nextState, selection } = syncPreviewSelectionToStudio(
      this._selectionSyncState,
      this._document,
      nodeId
    );
    this._selectionSyncState = nextState;
    return selection;
  }

  /**
   * Tri-directional selection sync (Timeline Click).
   */
  selectFromTimeline(nodeId: string, selection: TimelineSelection): void {
    this._selectionSyncState = syncTimelineSelectionToPreview(
      this._selectionSyncState,
      nodeId,
      selection
    );
  }

  /**
   * Tri-directional selection sync (Inspector Click).
   */
  selectFromInspector(nodeId: string, clipId: string | null, keyframeId: string | null): void {
    this._selectionSyncState = syncInspectorSelectionToPreview(
      this._selectionSyncState,
      nodeId,
      clipId,
      keyframeId
    );
  }

  /**
   * Evaluates the current frame batch via PM32 RuntimeBridge (DECISION-054).
   */
  evaluateCurrentFrame(): RuntimeFrameBatch | null {
    const timeline = this._session.selectedTimeline;
    if (!timeline) return null;
    return this._runtimeBridge.evaluateFrame(
      timeline,
      {
        status: this._session.status,
        currentTime: this._session.currentTime,
        duration: this._session.duration,
        speed: timeline.playback?.speed ?? 1,
        loop: this._session.loop,
        direction: timeline.playback?.direction === 'reverse' || timeline.playback?.direction === 'alternate' || timeline.playback?.direction === 'alternate-reverse' ? 'reverse' : 'normal',
      },
      this._session.currentTime
    );
  }

  /**
   * Triggers trigger adapter processing if previewAdapter is injected.
   */
  processPreviewMessage(message: PreviewTriggerMessage): unknown {
    if (!this._previewAdapter) return null;
    return this._previewAdapter.processMessage(message);
  }
}
