/**
 * ReviewThreads.ts, Comments.ts, Approvals.ts & ChangeRequests.ts — PM44 Review Workflow (ETAP 4)
 *
 * Comments, review threads, approvals, and change request models.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface CommentMessage {
  readonly commentId: string;
  readonly authorUserId: string;
  readonly text: string;
  readonly createdAt: number;
}

export interface ReviewThread {
  readonly threadId: string;
  readonly projectId: string;
  readonly targetNodeId?: string;
  readonly targetTimeMs?: number;
  readonly isResolved: boolean;
  readonly comments: ReadonlyArray<CommentMessage>;
}

export interface ProjectApproval {
  readonly approvalId: string;
  readonly projectId: string;
  readonly version: string;
  readonly reviewerUserId: string;
  readonly status: 'approved' | 'rejected' | 'changes_requested';
  readonly note?: string;
  readonly timestamp: number;
}

export function createReviewThread(
  projectId: string,
  initialComment: CommentMessage,
  targetNodeId?: string,
  targetTimeMs?: number
): ReviewThread {
  return {
    threadId: `thread-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    projectId,
    targetNodeId,
    targetTimeMs,
    isResolved: false,
    comments: [initialComment],
  };
}

export function resolveReviewThread(thread: ReviewThread): ReviewThread {
  return {
    ...thread,
    isResolved: true,
  };
}
