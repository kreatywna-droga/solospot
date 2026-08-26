/**
 * TimelineRuntimeConnector.ts — Sprint S4 Timeline ↔ Runtime Connector (ETAP 1)
 *
 * Connects Timeline UI state to PM37 TimelineTransportController & PM38 PreviewRuntimeCoordinator.
 *
 * NO DOM, NO React, NO Browser API.
 */

import {
  TimelineTransportController,
  type TransportCommand,
  type TransportResult,
} from '../../timeline/TimelineTransportController';
import type { TimelinePlaybackSession } from '../../timeline/TimelinePlaybackSession';
import { seekSession } from '../../timeline/TimelinePlaybackSession';

export interface TimelineRuntimeConnectorState {
  readonly session: TimelinePlaybackSession | null;
  readonly activeTimelineId: string | null;
  readonly lastCommand: TransportCommand | null;
  readonly isConnectedToRuntime: boolean;
}

export function createTimelineRuntimeConnectorState(
  session: TimelinePlaybackSession | null = null,
  timelineId: string | null = null
): TimelineRuntimeConnectorState {
  return {
    session,
    activeTimelineId: timelineId,
    lastCommand: null,
    isConnectedToRuntime: session !== null,
  };
}

export function seekTimelinePlayheadInRuntime(
  state: TimelineRuntimeConnectorState,
  targetTimeMs: number
): { connectorState: TimelineRuntimeConnectorState; command: TransportCommand } {
  const command: TransportCommand = { type: 'SEEK', timeMs: Math.max(0, targetTimeMs) };
  const updatedSession = state.session ? TimelineTransportController.seek(state.session, targetTimeMs) : null;

  return {
    connectorState: {
      ...state,
      session: updatedSession,
      lastCommand: command,
    },
    command,
  };
}
