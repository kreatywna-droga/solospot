/**
 * ReviewQueue.ts — Sprint S7 Collaboration Workspace
 *
 * Queues documents that are pending review across a tenant/team.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface ReviewQueueItem {
  readonly itemId: string;
  readonly projectId: string;
  readonly revisionId: string;
  readonly requesterId: string;
  readonly targetReviewers: ReadonlyArray<string>;
  readonly priority: 'low' | 'normal' | 'high' | 'urgent';
  readonly requestedAtMs: number;
}

export interface ReviewQueueState {
  readonly queue: ReadonlyArray<ReviewQueueItem>;
}

export function createReviewQueueState(): ReviewQueueState {
  return { queue: [] };
}

export function enqueueReview(
  state: ReviewQueueState,
  projectId: string,
  revisionId: string,
  requesterId: string,
  targetReviewers: string[],
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
): ReviewQueueState {
  const item: ReviewQueueItem = {
    itemId: `rqi-${Date.now()}`,
    projectId,
    revisionId,
    requesterId,
    targetReviewers,
    priority,
    requestedAtMs: Date.now(),
  };

  return { ...state, queue: [...state.queue, item] };
}

export function dequeueReview(
  state: ReviewQueueState,
  itemId: string
): ReviewQueueState {
  return { ...state, queue: state.queue.filter((i) => i.itemId !== itemId) };
}
