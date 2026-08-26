/**
 * PreviewRenderingBridge.ts — Sprint S4 Preview Rendering Integration (ETAP 3)
 *
 * Connects Preview Canvas UI to PM38 PreviewPlayheadSync and bidirectional timeline/preview sync.
 *
 * NO DOM, NO React, NO Browser API.
 */

import {
  createPlayheadSyncState,
  syncTimelinePlayheadToPreview,
  type PlayheadSyncState,
} from '../../preview/PreviewPlayheadSync';
import {
  createTimelinePlaybackSession,
  type TimelinePlaybackSession,
} from '../../timeline/TimelinePlaybackSession';

export interface PreviewRenderingBridgeState {
  readonly playheadSync: PlayheadSyncState;
  readonly session: TimelinePlaybackSession;
  readonly viewportScale: number;
  readonly isCanvasConnected: boolean;
}

export function createPreviewRenderingBridgeState(): PreviewRenderingBridgeState {
  return {
    playheadSync: createPlayheadSyncState(),
    session: createTimelinePlaybackSession(),
    viewportScale: 1.0,
    isCanvasConnected: true,
  };
}

export function updateCanvasPreviewScale(
  state: PreviewRenderingBridgeState,
  scale: number
): PreviewRenderingBridgeState {
  return {
    ...state,
    viewportScale: Math.max(0.25, Math.min(4.0, scale)),
  };
}

export function seekPreviewToTime(
  state: PreviewRenderingBridgeState,
  targetTimeMs: number
): PreviewRenderingBridgeState {
  const { nextSyncState, updatedSession } = syncTimelinePlayheadToPreview(
    state.playheadSync,
    state.session,
    targetTimeMs
  );

  return {
    ...state,
    playheadSync: nextSyncState,
    session: updatedSession,
  };
}
