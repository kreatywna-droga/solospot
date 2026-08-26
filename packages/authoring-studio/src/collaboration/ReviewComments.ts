/**
 * ReviewComments.ts — Sprint S7 Collaboration Workspace
 *
 * Manages comments inside a review session.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { ReviewCommentStatus } from './ReviewStatus';

export interface ReviewComment {
  readonly commentId: string;
  readonly sessionId: string;
  readonly authorId: string;
  readonly content: string;
  readonly createdAtMs: number;
  readonly status: ReviewCommentStatus;
  readonly threadId?: string; // If it's a reply
}

export interface ReviewCommentsState {
  readonly comments: ReadonlyMap<string, ReviewComment>;
}

export function createReviewCommentsState(): ReviewCommentsState {
  return { comments: new Map() };
}

export function addComment(
  state: ReviewCommentsState,
  sessionId: string,
  authorId: string,
  content: string,
  threadId?: string
): { state: ReviewCommentsState; comment: ReviewComment } {
  const comment: ReviewComment = {
    commentId: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sessionId,
    authorId,
    content,
    createdAtMs: Date.now(),
    status: 'active',
    threadId,
  };

  const next = new Map(state.comments);
  next.set(comment.commentId, comment);

  return { state: { ...state, comments: next }, comment };
}

export function resolveComment(
  state: ReviewCommentsState,
  commentId: string
): ReviewCommentsState {
  const comment = state.comments.get(commentId);
  if (!comment) return state;

  const next = new Map(state.comments);
  next.set(commentId, { ...comment, status: 'resolved' });
  return { ...state, comments: next };
}
