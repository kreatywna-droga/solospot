/**
 * PreviewPlayheadSync.ts — PM38 Playhead Synchronization (ETAP 1)
 *
 * Facilitates bidirectional playhead time synchronization between Timeline and Preview.
 *
 * Flow:
 *   Timeline Playhead scrub/tick → Session → Preview Target
 *   Preview user interaction / clock → Session → Timeline Cursor
 *
 * Loop Prevention:
 *   Guaranteed via atomic source tagging ('timeline' | 'preview') and time thresholding.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser APIs.
 */

import {
  type TimelinePlaybackSession,
  seekSession,
} from '../timeline/TimelinePlaybackSession';

export type PlayheadSyncSource = 'timeline' | 'preview';

export interface PlayheadSyncState {
  readonly currentTime: number;
  readonly lastSource: PlayheadSyncSource | null;
  readonly syncVersion: number;
}

export const INITIAL_PLAYHEAD_SYNC_STATE: PlayheadSyncState = {
  currentTime: 0,
  lastSource: null,
  syncVersion: 0,
};

export function createPlayheadSyncState(
  partial: Partial<PlayheadSyncState> = {}
): PlayheadSyncState {
  return {
    ...INITIAL_PLAYHEAD_SYNC_STATE,
    ...partial,
  };
}

/**
 * Synchronizes playhead movement originating from Timeline into Preview.
 */
export function syncTimelinePlayheadToPreview(
  syncState: PlayheadSyncState,
  session: TimelinePlaybackSession,
  targetTimeMs: number
): { nextSyncState: PlayheadSyncState; updatedSession: TimelinePlaybackSession; shouldNotifyPreview: boolean } {
  const time = Math.max(0, targetTimeMs);

  // Loop prevention: skip if already synced to same time from timeline source
  if (syncState.lastSource === 'timeline' && Math.abs(syncState.currentTime - time) < 0.001) {
    return {
      nextSyncState: syncState,
      updatedSession: session,
      shouldNotifyPreview: false,
    };
  }

  const updatedSession = seekSession(session, time);
  const nextSyncState: PlayheadSyncState = {
    currentTime: time,
    lastSource: 'timeline',
    syncVersion: syncState.syncVersion + 1,
  };

  return {
    nextSyncState,
    updatedSession,
    shouldNotifyPreview: true,
  };
}

/**
 * Synchronizes playhead movement originating from Preview canvas/iframe into Timeline session.
 */
export function syncPreviewPlayheadToTimeline(
  syncState: PlayheadSyncState,
  session: TimelinePlaybackSession,
  previewTimeMs: number
): { nextSyncState: PlayheadSyncState; updatedSession: TimelinePlaybackSession; shouldNotifyTimeline: boolean } {
  const time = Math.max(0, previewTimeMs);

  // Loop prevention: skip if already synced to same time from preview source
  if (syncState.lastSource === 'preview' && Math.abs(syncState.currentTime - time) < 0.001) {
    return {
      nextSyncState: syncState,
      updatedSession: session,
      shouldNotifyTimeline: false,
    };
  }

  const updatedSession = seekSession(session, time);
  const nextSyncState: PlayheadSyncState = {
    currentTime: time,
    lastSource: 'preview',
    syncVersion: syncState.syncVersion + 1,
  };

  return {
    nextSyncState,
    updatedSession,
    shouldNotifyTimeline: true,
  };
}
