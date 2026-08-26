import { describe, it, expect } from 'vitest';
import {
  createPlayheadSyncState,
  syncTimelinePlayheadToPreview,
  syncPreviewPlayheadToTimeline,
} from '../PreviewPlayheadSync';
import { createTimelinePlaybackSession } from '../../timeline/TimelinePlaybackSession';

describe('PreviewSynchronization (PM38, ETAP 1)', () => {
  it('initializes default playhead sync state', () => {
    const state = createPlayheadSyncState();
    expect(state.currentTime).toBe(0);
    expect(state.lastSource).toBeNull();
    expect(state.syncVersion).toBe(0);
  });

  it('syncs playhead from timeline to preview without infinite loops', () => {
    const state = createPlayheadSyncState();
    const session = createTimelinePlaybackSession({ currentTime: 0 });

    const { nextSyncState, updatedSession, shouldNotifyPreview } = syncTimelinePlayheadToPreview(
      state,
      session,
      500
    );

    expect(nextSyncState.currentTime).toBe(500);
    expect(nextSyncState.lastSource).toBe('timeline');
    expect(nextSyncState.syncVersion).toBe(1);
    expect(updatedSession.currentTime).toBe(500);
    expect(shouldNotifyPreview).toBe(true);

    // Re-syncing to exact same time from timeline source returns loop prevention flag (shouldNotifyPreview = false)
    const reSync = syncTimelinePlayheadToPreview(nextSyncState, updatedSession, 500);
    expect(reSync.shouldNotifyPreview).toBe(false);
  });

  it('syncs playhead from preview canvas to timeline session', () => {
    const state = createPlayheadSyncState();
    const session = createTimelinePlaybackSession({ currentTime: 0 });

    const { nextSyncState, updatedSession, shouldNotifyTimeline } = syncPreviewPlayheadToTimeline(
      state,
      session,
      750
    );

    expect(nextSyncState.currentTime).toBe(750);
    expect(nextSyncState.lastSource).toBe('preview');
    expect(updatedSession.currentTime).toBe(750);
    expect(shouldNotifyTimeline).toBe(true);

    // Loop prevention check
    const reSync = syncPreviewPlayheadToTimeline(nextSyncState, updatedSession, 750);
    expect(reSync.shouldNotifyTimeline).toBe(false);
  });
});
