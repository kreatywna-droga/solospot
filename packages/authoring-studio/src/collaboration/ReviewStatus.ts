/**
 * ReviewStatus.ts — Sprint S7 Collaboration Workspace
 *
 * Defines statuses for the review process.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type ReviewSessionStatus = 'open' | 'in_review' | 'approved' | 'rejected' | 'closed';
export type ReviewCommentStatus = 'active' | 'resolved' | 'ignored';
