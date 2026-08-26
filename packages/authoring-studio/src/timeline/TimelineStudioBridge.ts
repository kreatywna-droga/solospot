/**
 * TimelineStudioBridge.ts — PM37 Studio Bridge (ETAP 4 / F-01 FIX)
 *
 * The single integration point between the Timeline Panel and Runtime Preview.
 *
 * F-01 FIX — SINGLE TIME ENGINE OWNER:
 *   AnimationPlaybackController (from builder-core) is the SINGLE, EXCLUSIVE
 *   owner of playback time and status.
 *   TimelineStudioBridge delegates all playback time state transitions directly
 *   to AnimationPlaybackController and projects the resulting controller snapshot
 *   onto TimelinePlaybackSession.
 *
 *   ZERO duplicate time engines, ZERO manual time math, ZERO requestAnimationFrame.
 */

import { AnimationPlaybackController } from '../../../builder-core/src/animation/AnimationPlaybackController';
import { AnimationRuntimeBridge } from '../../../builder-core/src/animation/AnimationRuntimeBridge';
import { AnimationRuntimePreviewAdapter } from '../../../builder-core/src/animation/AnimationRuntimePreviewAdapter';
import { AnimationTriggerEngine } from '../../../builder-core/src/animation/AnimationTriggerEngine';
import type { AnimationTriggerContext } from '../../../builder-core/src/animation/AnimationTriggerContext';
import type { PreviewTriggerMessage } from '../../../builder-core/src/animation/AnimationPreviewContract';
import type { RuntimeFrameBatch } from '../../../builder-core/src/animation/AnimationRuntimeTypes';
import type {
  AnimationTimeline,
  AnimationTrigger,
} from '../../../builder-core/src/animation/AnimationTypes';
import {
  type TimelinePlaybackSession,
  createTimelinePlaybackSession,
  selectTimelineInSession,
  totalDuration,
} from './TimelinePlaybackSession';

/**
 * TimelineStudioBridge — the ONLY Timeline ↔ Runtime integration point.
 */
export class TimelineStudioBridge {
  private _session: TimelinePlaybackSession = createTimelinePlaybackSession();
  private readonly _runtimeBridge: AnimationRuntimeBridge;
  private readonly _previewAdapter: AnimationRuntimePreviewAdapter;
  private readonly _triggerEngine: AnimationTriggerEngine;
  private _playbackController: AnimationPlaybackController | null = null;

  constructor() {
    this._triggerEngine = new AnimationTriggerEngine();
    this._runtimeBridge = new AnimationRuntimeBridge();
    this._previewAdapter = new AnimationRuntimePreviewAdapter(this._triggerEngine);
  }

  /** Read-only access to the current playback session projection. */
  get session(): TimelinePlaybackSession {
    return this._session;
  }

  /** Direct access to the single owner of playback time state. */
  get playbackController(): AnimationPlaybackController | null {
    return this._playbackController;
  }

  /** The injected PM32 Runtime Bridge used for frame evaluation. */
  get runtimeBridge(): AnimationRuntimeBridge {
    return this._runtimeBridge;
  }

  /** The PM34 Preview Adapter used for trigger-aware preview. */
  get previewAdapter(): AnimationRuntimePreviewAdapter {
    return this._previewAdapter;
  }

  /**
   * Selects a timeline into the playback session and instantiates the single
   * AnimationPlaybackController time engine owner from builder-core.
   */
  selectTimeline(timeline: AnimationTimeline): boolean {
    if (!timeline) return false;
    this._session = selectTimelineInSession(this._session, timeline);
    
    const dur = Math.max(1, totalDuration(timeline));
    this._playbackController = new AnimationPlaybackController({
      duration: dur,
      speed: timeline.playback?.speed ?? 1,
      loop: timeline.playback?.loop ?? false,
    });

    this._previewAdapter.reset();
    this._previewAdapter.registerTrigger(
      timeline.id,
      normalizeTrigger(timeline.trigger)
    );

    this.syncSessionFromController();
    return true;
  }

  /** Syncs session projection from controller snapshot (Single Owner of Time). */
  private syncSessionFromController(): void {
    if (!this._playbackController) return;
    const snap = this._playbackController.snapshot();
    const mappedStatus = snap.status === 'idle' ? 'stopped' : snap.status;
    this._session = {
      ...this._session,
      currentTime: snap.currentTime,
      duration: snap.duration,
      status: mappedStatus,
      loop: snap.loop,
    };
  }

  /** Starts playback on AnimationPlaybackController. */
  play(): void {
    if (this._playbackController) {
      this._playbackController.play();
      this.syncSessionFromController();
    } else {
      this._session = { ...this._session, status: 'playing' };
    }
  }

  /** Pauses playback on AnimationPlaybackController. */
  pause(): void {
    if (this._playbackController) {
      this._playbackController.pause();
      this.syncSessionFromController();
    } else {
      if (this._session.status === 'playing') {
        this._session = { ...this._session, status: 'paused' };
      }
    }
  }

  /** Stops playback and rewinds to 0 on AnimationPlaybackController. */
  stop(): void {
    if (this._playbackController) {
      this._playbackController.stop();
      this.syncSessionFromController();
    } else {
      this._session = { ...this._session, status: 'stopped', currentTime: 0 };
    }
  }

  /** Seeks to timeMs on AnimationPlaybackController and evaluates frame. */
  seek(timeMs: number): RuntimeFrameBatch | null {
    if (this._playbackController) {
      this._playbackController.seek(timeMs);
      this.syncSessionFromController();
    } else {
      const clamped = this._session.duration > 0 ? Math.min(this._session.duration, Math.max(0, timeMs)) : Math.max(0, timeMs);
      this._session = { ...this._session, currentTime: clamped };
    }
    return this.evaluateCurrentFrame();
  }

  /** Advances playback playhead by deltaMs via AnimationPlaybackController. */
  advance(deltaMs: number): RuntimeFrameBatch | null {
    if (this._playbackController) {
      this._playbackController.advance(deltaMs);
      this.syncSessionFromController();
    }
    return this.evaluateCurrentFrame();
  }

  /** Replaces the internal session projection. */
  updateSession(session: TimelinePlaybackSession): void {
    this._session = session;
  }

  /** Evaluates a frame at current playhead time using AnimationRuntimeBridge. */
  evaluateCurrentFrame(): RuntimeFrameBatch | null {
    const timeline = this._session.selectedTimeline;
    if (!timeline) return null;
    const state = {
      status: this._session.status,
      currentTime: this._session.currentTime,
      duration: this._session.duration,
      speed: 1,
      loop: this._session.loop,
      direction: 'normal' as const,
    };
    return this._runtimeBridge.evaluateFrame(
      timeline,
      state,
      this._session.currentTime
    );
  }

  /** Processes an incoming preview trigger message. */
  processPreviewMessage(message: PreviewTriggerMessage): ReturnType<
    AnimationRuntimePreviewAdapter['processMessage']
  > {
    const result = this._previewAdapter.processMessage(message);
    const timeline = this._session.selectedTimeline;
    if (timeline) {
      const context = this._previewAdapter.context;
      const satisfied = this.isTriggerSatisfied(
        normalizeTrigger(timeline.trigger),
        context
      );
      if (satisfied) this.play();
    }
    return result;
  }

  /** Builds a trigger context from a preview message (pure mapping). */
  buildContext(message: PreviewTriggerMessage): AnimationTriggerContext {
    switch (message.type) {
      case 'SCROLL_EVENT':
        return {
          scrollY: message.scrollY,
          viewportWidth: 0,
          viewportHeight: 0,
          isHovered: false,
          isClicked: false,
          visibilityRatio: 0,
        };
      case 'HOVER_EVENT':
        return {
          scrollY: 0,
          viewportWidth: 0,
          viewportHeight: 0,
          isHovered: message.isHovered,
          isClicked: false,
          visibilityRatio: 0,
        };
      case 'CLICK_EVENT':
        return {
          scrollY: 0,
          viewportWidth: 0,
          viewportHeight: 0,
          isHovered: false,
          isClicked: message.isClicked,
          visibilityRatio: 0,
        };
      case 'INTERSECTION_EVENT':
        return {
          scrollY: 0,
          viewportWidth: 0,
          viewportHeight: 0,
          isHovered: false,
          isClicked: false,
          visibilityRatio: message.visibilityRatio,
        };
      case 'VIEWPORT_RESIZE_EVENT':
        return {
          scrollY: 0,
          viewportWidth: message.width,
          viewportHeight: message.height,
          isHovered: false,
          isClicked: false,
          visibilityRatio: 0,
        };
    }
  }

  /** Evaluates whether a trigger is satisfied against a context (pure). */
  private isTriggerSatisfied(
    trigger: AnimationTimeline['trigger'],
    context: AnimationTriggerContext
  ): boolean {
    switch (trigger.type) {
      case 'onLoad':
        return true;
      case 'hover':
        return context.isHovered === true;
      case 'click':
        return context.isClicked === true;
      case 'inView':
        return context.visibilityRatio >= (trigger.threshold ?? 0.5);
      case 'scroll':
        return context.scrollY >= (trigger.threshold ?? 0);
      default:
        return false;
    }
  }
}

function normalizeTrigger(
  trigger: AnimationTimeline['trigger'] | { type: string; threshold?: number; targetElementId?: string }
): AnimationTimeline['trigger'] {
  switch (trigger.type) {
    case 'onLoad':
    case 'inView':
    case 'hover':
    case 'click':
    case 'scroll':
      return trigger as AnimationTimeline['trigger'];
    case 'onHover':
      return { ...trigger, type: 'hover' } as AnimationTimeline['trigger'];
    case 'onClick':
      return { ...trigger, type: 'click' } as AnimationTrigger;
    case 'onInView':
      return { ...trigger, type: 'inView' } as AnimationTrigger;
    case 'onScroll':
      return { ...trigger, type: 'scroll' } as AnimationTrigger;
    default:
      return { ...trigger, type: 'onLoad' } as AnimationTrigger;
  }
}
