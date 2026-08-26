/**
 * ReviewSessions.ts — Sprint S7 Collaboration Workspace
 *
 * Manages the lifecycle of a document review session.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { ReviewSessionStatus } from './ReviewStatus';

export interface ReviewSession {
  readonly sessionId: string;
  readonly projectId: string;
  readonly authorId: string;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
  readonly status: ReviewSessionStatus;
  readonly reviewers: ReadonlyArray<string>;
}

export interface ReviewSessionState {
  readonly sessions: ReadonlyArray<ReviewSession>;
}

export function createReviewSessionState(): ReviewSessionState {
  return { sessions: [] };
}

export function createReviewSession(
  state: ReviewSessionState,
  projectId: string,
  authorId: string,
  reviewers: string[]
): { state: ReviewSessionState; session: ReviewSession } {
  const session: ReviewSession = {
    sessionId: `rev-${projectId}-${Date.now()}`,
    projectId,
    authorId,
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
    status: 'open',
    reviewers,
  };

  return {
    state: { ...state, sessions: [...state.sessions, session] },
    session,
  };
}

export function updateSessionStatus(
  state: ReviewSessionState,
  sessionId: string,
  status: ReviewSessionStatus
): ReviewSessionState {
  const sessions = state.sessions.map((s) =>
    s.sessionId === sessionId ? { ...s, status, updatedAtMs: Date.now() } : s
  );
  return { ...state, sessions };
}
