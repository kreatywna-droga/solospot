import { describe, it, expect } from 'vitest';
import {
  createReviewSessionState,
  createReviewSession,
  updateSessionStatus,
} from '../ReviewSessions';

describe('ReviewSessions (Sprint S7)', () => {
  it('creates a new review session', () => {
    let state = createReviewSessionState();
    const { state: updated, session } = createReviewSession(state, 'p1', 'author-1', ['reviewer-1']);
    
    expect(updated.sessions).toHaveLength(1);
    expect(session.projectId).toBe('p1');
    expect(session.status).toBe('open');
    expect(session.reviewers).toContain('reviewer-1');
  });

  it('updates session status', () => {
    let state = createReviewSessionState();
    const { state: withSession, session } = createReviewSession(state, 'p1', 'author-1', []);
    
    state = updateSessionStatus(withSession, session.sessionId, 'approved');
    expect(state.sessions[0].status).toBe('approved');
  });
});
