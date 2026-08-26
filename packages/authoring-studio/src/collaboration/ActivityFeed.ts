/**
 * ActivityFeed.ts — Sprint S7 Collaboration Workspace
 *
 * Generates an aggregated timeline of events for a project or tenant.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface ActivityEvent {
  readonly eventId: string;
  readonly projectId: string;
  readonly actorId: string;
  readonly action: 'created_project' | 'committed_revision' | 'added_comment' | 'approved_review';
  readonly metadata?: Record<string, string>;
  readonly timestampMs: number;
}

export interface ActivityFeedState {
  readonly events: ReadonlyArray<ActivityEvent>;
}

export function createActivityFeedState(): ActivityFeedState {
  return { events: [] };
}

export function logActivity(
  state: ActivityFeedState,
  projectId: string,
  actorId: string,
  action: ActivityEvent['action'],
  metadata?: Record<string, string>
): ActivityFeedState {
  const event: ActivityEvent = {
    eventId: `evt-${Date.now()}`,
    projectId,
    actorId,
    action,
    metadata,
    timestampMs: Date.now(),
  };

  return { ...state, events: [event, ...state.events] };
}

export function getProjectActivity(
  state: ActivityFeedState,
  projectId: string
): ReadonlyArray<ActivityEvent> {
  return state.events.filter((e) => e.projectId === projectId);
}
