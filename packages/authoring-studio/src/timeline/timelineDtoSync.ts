/**
 * timelineDtoSync.ts — PM37 DTO Synchronization (ETAP 6)
 *
 * Ensures the data flow:
 *
 *   BuilderDocument
 *     ↓
 *   AnimationTimeline DTO
 *     ↓
 *   Timeline Session
 *     ↓
 *   Preview
 *
 * while keeping BuilderDocument as the Single Source of Truth (SSOT).
 *
 * This module provides pure mapping helpers that derive the AnimationTimeline
 * DTO from BuilderDocument and feed it into the session. It does NOT mutate
 * BuilderDocument and does NOT execute any runtime evaluation.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO setTimeout/setInterval,
 * NO RuntimeScheduler, NO interpolation execution.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { inspectNodeAnimation } from '../inspector/animationDocumentBinding';
import type { TimelinePlaybackSession } from './TimelinePlaybackSession';
import {
  selectTimelineInSession,
  totalDuration,
} from './TimelinePlaybackSession';

/**
 * Derives the AnimationTimeline DTO for a node from BuilderDocument (SSOT).
 * Returns null when the node has no animation timeline.
 */
export function extractTimelineDto(
  doc: BuilderDocument,
  nodeId: string
): AnimationTimeline | null {
  return inspectNodeAnimation(doc, nodeId);
}

/**
 * Synchronizes a node's timeline DTO into the playback session.
 * BuilderDocument remains the SSOT — the session merely reads the DTO.
 * Returns a NEW session (immutable) or the same session when no timeline exists.
 */
export function syncTimelineToSession(
  session: TimelinePlaybackSession,
  doc: BuilderDocument,
  nodeId: string
): TimelinePlaybackSession {
  const timeline = extractTimelineDto(doc, nodeId);
  if (!timeline) return session;
  return selectTimelineInSession(session, timeline);
}

/**
 * Produces an immutable snapshot describing the DTO sync state.
 * Useful for preview wiring and diagnostics. Pure.
 */
export interface TimelineDtoSyncSnapshot {
  readonly nodeId: string | null;
  readonly timelineId: string | null;
  readonly clipCount: number;
  readonly totalDuration: number;
}

export function createDtoSyncSnapshot(
  doc: BuilderDocument,
  nodeId: string
): TimelineDtoSyncSnapshot {
  const timeline = extractTimelineDto(doc, nodeId);
  if (!timeline) {
    return {
      nodeId: null,
      timelineId: null,
      clipCount: 0,
      totalDuration: 0,
    };
  }
  return {
    nodeId,
    timelineId: timeline.id,
    clipCount: timeline.clips.length,
    totalDuration: totalDuration(timeline),
  };
}
