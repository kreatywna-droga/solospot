import { describe, it, expect } from 'vitest';
import { createTimelineRuntimeConnectorState } from '../TimelineRuntimeConnector';
import { createTimelinePlaybackSession } from '../../../timeline/TimelinePlaybackSession';

describe('TimelineRuntimeConnector (Sprint S4, ETAP 1)', () => {
  it('creates connector state with no active session', () => {
    const state = createTimelineRuntimeConnectorState(null, null);
    expect(state.isConnectedToRuntime).toBe(false);
    expect(state.activeTimelineId).toBeNull();
    expect(state.lastCommand).toBeNull();
  });

  it('creates connector state with session and timeline ID', () => {
    const session = createTimelinePlaybackSession({ currentTime: 0 });
    const state = createTimelineRuntimeConnectorState(session, 'tl-1');
    expect(state.isConnectedToRuntime).toBe(true);
    expect(state.activeTimelineId).toBe('tl-1');
  });
});
